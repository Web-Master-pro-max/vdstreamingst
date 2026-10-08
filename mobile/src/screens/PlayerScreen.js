import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
  Switch,
  Platform,
  BackHandler,
  StatusBar,
  useWindowDimensions,
  PanResponder,
  Animated,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import { useKeepAwake, activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { COLORS } from '../theme/colors';
import {
  apiService,
  formatMediaUrl,
  recordWatchHistory,
  getAuthSession,
  getPreferredAudioTrack,
  setPreferredAudioTrack,
  getSubtitleSettings,
  saveSubtitleSettings,
  getAutoSkipIntroSetting,
  saveAutoSkipIntroSetting,
  getAutoSkipOutroSetting,
  saveAutoSkipOutroSetting,
  getSkipDurationSetting,
  saveSkipDurationSetting,
  getApiBaseUrl,
  setApiBaseUrl,
  PRESET_SERVERS,
} from '../services/api';
import { DeviceControls } from '../services/deviceControls';

const SAMPLE_STREAM = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

// Map ISO language codes to user-friendly names
const getFriendlyLanguageName = (code) => {
  if (!code) return null;
  const c = code.toLowerCase().trim();
  const map = {
    hin: 'Hindi', hi: 'Hindi',
    eng: 'English', en: 'English',
    jpn: 'Japanese', ja: 'Japanese', jp: 'Japanese',
    spa: 'Spanish', es: 'Spanish',
    zho: 'Chinese', zh: 'Chinese',
    kor: 'Korean', ko: 'Korean',
    fra: 'French', fr: 'French',
    deu: 'German', de: 'German',
    rus: 'Russian', ru: 'Russian',
  };
  return map[c] || c.toUpperCase();
};

// Parse WebVTT content into timed cue objects
const parseVtt = (vttText) => {
  if (!vttText) return [];
  const lines = vttText.split('\n');
  const cues = [];
  let i = 0;

  const timeToMs = (timeStr) => {
    const parts = timeStr.trim().split(':');
    let hrs = 0, mins = 0, secs = 0;
    if (parts.length === 3) {
      hrs = parseFloat(parts[0]);
      mins = parseFloat(parts[1]);
      secs = parseFloat(parts[2].replace(',', '.'));
    } else if (parts.length === 2) {
      mins = parseFloat(parts[0]);
      secs = parseFloat(parts[1].replace(',', '.'));
    }
    return (hrs * 3600 + mins * 60 + secs) * 1000;
  };

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes('-->')) {
      const times = line.split('-->');
      const startMs = timeToMs(times[0]);
      const endMs = timeToMs(times[1]);
      i++;
      let textLines = [];
      while (i < lines.length && lines[i].trim() !== '') {
        const cleanLine = lines[i].trim().replace(/<[^>]*>/g, '');
        if (cleanLine) textLines.push(cleanLine);
        i++;
      }
      if (textLines.length > 0) {
        cues.push({ startMs, endMs, text: textLines.join('\n') });
      }
    }
    i++;
  }
  return cues;
};

// Intelligent Multi-Heuristic Anime Intro & Outro Detection Engine
const detectPreciseIntroOutroWindows = ({
  episode,
  durationMillis = 0,
  subCues = [],
  preferredDuration = 'auto',
}) => {
  const dur = Number(durationMillis) || 0;
  if (dur < 120000) {
    return {
      intro: null,
      outro: null,
      introSource: 'none',
      outroSource: 'none',
      detectionSource: 'none',
      summary: 'Duration under 2 min',
    };
  }

  // Base OP length based on preference or standard broadcast anime (89.5s)
  let standardOpLengthMs = 89500;
  if (preferredDuration === '60') standardOpLengthMs = 60000;
  else if (preferredDuration === '75') standardOpLengthMs = 75000;
  else if (preferredDuration === '85') standardOpLengthMs = 85000;
  else if (preferredDuration === '100') standardOpLengthMs = 100000;
  else if (preferredDuration === '90') standardOpLengthMs = 90000;

  let intro = null;
  let outro = null;
  let introSource = 'none';
  let outroSource = 'none';

  // 1. Explicit Metadata
  const explicitIntroStart = episode?.introStart ?? episode?.skipIntroStart;
  const explicitIntroEnd = episode?.introEnd ?? episode?.skipIntroEnd;
  const explicitOutroStart = episode?.outroStart ?? episode?.skipOutroStart;
  const explicitOutroEnd = episode?.outroEnd ?? episode?.skipOutroEnd;

  if (explicitIntroStart !== undefined && explicitIntroEnd !== undefined && Number(explicitIntroEnd) > Number(explicitIntroStart)) {
    intro = {
      start: Math.max(0, Math.round(Number(explicitIntroStart))),
      end: Math.min(dur, Math.round(Number(explicitIntroEnd))),
      source: 'metadata',
    };
    introSource = 'Metadata';
  }

  if (explicitOutroStart !== undefined && explicitOutroEnd !== undefined && Number(explicitOutroEnd) > Number(explicitOutroStart)) {
    outro = {
      start: Math.max(0, Math.round(Number(explicitOutroStart))),
      end: Math.min(dur, Math.round(Number(explicitOutroEnd))),
      source: 'metadata',
    };
    outroSource = 'Metadata';
  }

  // 2. Embedded Video Chapters
  if (Array.isArray(episode?.chapters) && episode.chapters.length > 0) {
    const chapters = episode.chapters;
    if (!intro) {
      const opChapter = chapters.find((c) => {
        const t = (c.title || c.name || '').toLowerCase();
        return /\b(op|opening|intro|theme)\b/i.test(t);
      });
      if (opChapter) {
        const s = Math.round(Number(opChapter.startTime ?? opChapter.start ?? 0) * (opChapter.startTime < 10000 ? 1000 : 1));
        const e = Math.round(Number(opChapter.endTime ?? opChapter.end ?? (s + standardOpLengthMs)) * (opChapter.endTime < 10000 ? 1000 : 1));
        if (e > s) {
          intro = { start: s, end: e, source: 'chapters' };
          introSource = 'Chapter Markers';
        }
      }
    }

    if (!outro) {
      const edChapter = chapters.find((c) => {
        const t = (c.title || c.name || '').toLowerCase();
        return /\b(ed|ending|outro|credits)\b/i.test(t);
      });
      if (edChapter) {
        const s = Math.round(Number(edChapter.startTime ?? edChapter.start ?? (dur - 90000)) * (edChapter.startTime < 10000 ? 1000 : 1));
        const e = Math.round(Number(edChapter.endTime ?? edChapter.end ?? dur) * (edChapter.endTime < 10000 ? 1000 : 1));
        if (e > s) {
          outro = { start: s, end: e, source: 'chapters' };
          outroSource = 'Chapter Markers';
        }
      }
    }
  }

  // 3. Subtitle Audio / Lyric Pattern Analysis (WebVTT)
  if (Array.isArray(subCues) && subCues.length > 0) {
    const isMusicCue = (text = '') => {
      return /([♪♫🎶🎵♩])|(\[(music|theme|song|intro|outro|ending|instrumental)\])|(\((music|theme|song|intro|outro|ending|instrumental)\))/i.test(text);
    };

    // --- Opening Song Detection via Subtitle Lyrics ---
    if (!intro) {
      const opMusicCues = subCues.filter((c) => c.startMs <= 300000 && isMusicCue(c.text));
      if (opMusicCues.length >= 1) {
        const clusterStart = opMusicCues[0].startMs;
        const lastMusicCue = opMusicCues[opMusicCues.length - 1];
        let clusterEnd = lastMusicCue.endMs;
        if (clusterEnd - clusterStart < 65000) {
          clusterEnd = clusterStart + standardOpLengthMs;
        }
        intro = {
          start: Math.max(0, clusterStart - 1000),
          end: Math.min(dur, clusterEnd + 1000),
          source: 'subtitle_lyrics',
        };
        introSource = 'Subtitle Lyrics (♪)';
      }
    }

    // --- Prologue Silence Gap Analysis (when OP lyrics aren't subtitled) ---
    if (!intro) {
      const earlyCues = subCues
        .filter((c) => c.startMs <= 260000)
        .sort((a, b) => a.startMs - b.startMs);

      if (earlyCues.length >= 1) {
        let detectedGap = null;
        for (let i = 0; i < earlyCues.length - 1; i++) {
          const currentCue = earlyCues[i];
          const nextCue = earlyCues[i + 1];
          const gap = nextCue.startMs - currentCue.endMs;
          if (gap >= 65000 && gap <= 105000 && currentCue.endMs <= 180000) {
            detectedGap = {
              start: Math.max(0, currentCue.endMs + 300),
              end: Math.min(dur, nextCue.startMs - 300),
            };
            break;
          }
        }

        if (detectedGap) {
          intro = {
            start: detectedGap.start,
            end: detectedGap.end,
            source: 'prologue_gap',
          };
          introSource = 'Prologue / Gap Analysis';
        } else if (earlyCues[0].startMs >= 65000 && earlyCues[0].startMs <= 110000) {
          intro = {
            start: 0,
            end: Math.min(dur, earlyCues[0].startMs - 500),
            source: 'direct_start_gap',
          };
          introSource = 'Direct OP Gap Analysis';
        }
      }
    }

    // --- Outro Song Detection via Subtitle Lyrics ---
    if (!outro) {
      const outroThreshold = Math.max(0, dur - 270000);
      const edMusicCues = subCues.filter((c) => c.startMs >= outroThreshold && isMusicCue(c.text));
      if (edMusicCues.length >= 1) {
        const clusterStart = edMusicCues[0].startMs;
        const lastMusicCue = edMusicCues[edMusicCues.length - 1];
        let clusterEnd = lastMusicCue.endMs;
        if (clusterEnd - clusterStart < 60000) {
          clusterEnd = Math.min(dur - 2000, clusterStart + standardOpLengthMs);
        }
        outro = {
          start: Math.max(0, clusterStart - 1000),
          end: Math.min(dur - 1000, clusterEnd + 1500),
          source: 'subtitle_lyrics',
        };
        outroSource = 'Subtitle Lyrics (♪)';
      }
    }
  }

  // 4. TV Broadcast Anime Standards (Smart Fallbacks)
  if (!intro) {
    const defaultStart = 15000;
    const defaultEnd = Math.min(dur, defaultStart + standardOpLengthMs);
    intro = {
      start: defaultStart,
      end: defaultEnd,
      source: 'broadcast_standard',
    };
    introSource = 'Anime Standard (89.5s)';
  }

  if (!outro) {
    const defaultOutroStart = Math.max(0, dur - standardOpLengthMs - 5000);
    const defaultOutroEnd = Math.max(0, dur - 3000);
    outro = {
      start: defaultOutroStart,
      end: defaultOutroEnd,
      source: 'broadcast_standard',
    };
    outroSource = 'Anime Standard (89.5s)';
  }

  return {
    intro,
    outro,
    introSource,
    outroSource,
    detectionSource: `${introSource} / ${outroSource}`,
    summary: `OP: ${Math.floor(intro.start / 60000)}:${String(Math.floor((intro.start % 60000) / 1000)).padStart(2, '0')} - ${Math.floor(intro.end / 60000)}:${String(Math.floor((intro.end % 60000) / 1000)).padStart(2, '0')}`,
  };
};

// Sanitize HLS playlist and parse audio/subtitle tracks with multi-server fallback & ExoPlayer safety
const processHlsManifest = async (url, targetAudioPrefOrIndex = 0, targetQuality = 'auto') => {
  const result = {
    sanitizedUrl: url,
    audioTracks: [],
    subtitleTracks: [],
    qualityLevels: [],
    selectedAudioIndex: 0,
    workingUrl: url,
  };
  if (!url || typeof url !== 'string' || !url.includes('.m3u8') || url.startsWith('file://')) {
    return result;
  }

  try {
    // Multi-Server Candidate Resolution:
    // If the active URL is 404 on AWS EC2 or Laptop Cloudflare, automatically try candidates
    const candidateUrls = [url];
    let relPath = null;
    const uploadsIdx = url.indexOf('/uploads/');
    if (uploadsIdx !== -1) {
      relPath = url.substring(uploadsIdx);
    } else {
      const videosIdx = url.indexOf('/videos/');
      if (videosIdx !== -1) {
        relPath = '/uploads' + url.substring(videosIdx);
      }
    }

    if (relPath) {
      PRESET_SERVERS.forEach((srv) => {
        const candidate = `${srv.url}${relPath}`;
        if (!candidateUrls.includes(candidate)) {
          candidateUrls.push(candidate);
        }
      });
    }

    let workingUrl = url;
    let rawText = null;

    for (const cand of candidateUrls) {
      try {
        const res = await fetch(cand);
        if (res.ok) {
          const text = await res.text();
          if (text.includes('#EXTM3U')) {
            workingUrl = cand;
            rawText = text.trim();
            break;
          }
        }
      } catch (e) {
        // Continue to next candidate
      }
    }

    if (!rawText) return result;
    result.workingUrl = workingUrl;

    const lastSlashIndex = workingUrl.lastIndexOf('/');
    const baseUrl = lastSlashIndex !== -1 ? workingUrl.substring(0, lastSlashIndex + 1) : workingUrl;

    // Parse audio, subtitle, and video quality variant tracks
    const lines = rawText.split('\n');
    let audioCounter = 0;
    let pendingStreamInf = null;
    const variants = [];

    lines.forEach((line) => {
      const l = line.trim();
      if (!l || l.startsWith('#EXTM3U')) return;

      if (l.startsWith('#EXT-X-MEDIA:TYPE=SUBTITLES')) {
        const nameMatch = l.match(/NAME="([^"]*)"/);
        const langMatch = l.match(/LANGUAGE="([^"]*)"/);
        const uriMatch = l.match(/URI="([^"]*)"/);
        if (uriMatch && uriMatch[1]) {
          const lang = langMatch ? langMatch[1] : '';
          let name = nameMatch && nameMatch[1].trim() ? nameMatch[1].trim() : '';
          if (!name || name === 'und') {
            name = getFriendlyLanguageName(lang) || 'Subtitle';
          }
          const fullUri = uriMatch[1].startsWith('http') ? uriMatch[1] : baseUrl + uriMatch[1];
          result.subtitleTracks.push({
            name,
            language: lang,
            displayName: getFriendlyLanguageName(lang) || name,
            uri: fullUri,
          });
        }
        return;
      }

      if (l.startsWith('#EXT-X-MEDIA:TYPE=AUDIO')) {
        const nameMatch = l.match(/NAME="([^"]*)"/);
        const langMatch = l.match(/LANGUAGE="([^"]*)"/);
        const uriMatch = l.match(/URI="([^"]*)"/);
        if (uriMatch && uriMatch[1]) {
          const lang = langMatch ? langMatch[1] : '';
          let name = nameMatch && nameMatch[1].trim() ? nameMatch[1].trim() : '';
          if (!name || name === 'und') {
            name = getFriendlyLanguageName(lang) || `Audio ${audioCounter + 1}`;
          }
          const fullUri = uriMatch[1].startsWith('http') ? uriMatch[1] : baseUrl + uriMatch[1];
          result.audioTracks.push({
            name,
            language: lang,
            displayName: getFriendlyLanguageName(lang) || name,
            uri: fullUri,
            index: audioCounter,
            rawLine: l,
          });
          audioCounter++;
        }
        return;
      }

      if (l.startsWith('#EXT-X-STREAM-INF:')) {
        pendingStreamInf = l;
        return;
      }

      if (pendingStreamInf && !l.startsWith('#') && l.length > 0) {
        const fullStreamUri = l.startsWith('http') ? l : baseUrl + l;
        const resMatch = pendingStreamInf.match(/RESOLUTION=(\d+)x(\d+)/i);
        let w = resMatch ? parseInt(resMatch[1], 10) : 0;
        let h = resMatch ? parseInt(resMatch[2], 10) : 0;
        let badge = 'SD';
        let badgeClass = 'badge-sd';
        let label = 'SD';

        if (h >= 1000) {
          badge = 'FHD';
          badgeClass = 'badge-fhd';
          label = '1080p';
        } else if (h >= 700) {
          badge = 'HD';
          badgeClass = 'badge-hd';
          label = '720p';
        } else if (h >= 400) {
          badge = 'SD';
          badgeClass = 'badge-sd';
          label = '480p';
        } else if (h > 0) {
          badge = 'SD';
          badgeClass = 'badge-sd';
          label = '360p';
        } else {
          const bwMatch = pendingStreamInf.match(/BANDWIDTH=(\d+)/i);
          const bw = bwMatch ? parseInt(bwMatch[1], 10) : 0;
          if (bw >= 3000000) {
            badge = 'FHD';
            badgeClass = 'badge-fhd';
            label = '1080p';
            h = 1080;
            w = 1920;
          } else if (bw >= 1800000) {
            badge = 'HD';
            badgeClass = 'badge-hd';
            label = '720p';
            h = 720;
            w = 1280;
          } else {
            badge = 'SD';
            badgeClass = 'badge-sd';
            label = '480p';
            h = 480;
            w = 854;
          }
        }

        const nameMatch = pendingStreamInf.match(/NAME="([^"]+)"/i);
        if (nameMatch && nameMatch[1]) {
          const nm = nameMatch[1].toLowerCase();
          if (nm.includes('1080')) { label = '1080p'; badge = 'FHD'; badgeClass = 'badge-fhd'; }
          else if (nm.includes('720')) { label = '720p'; badge = 'HD'; badgeClass = 'badge-hd'; }
          else if (nm.includes('480')) { label = '480p'; badge = 'SD'; badgeClass = 'badge-sd'; }
          else if (nm.includes('360')) { label = '360p'; badge = 'SD'; badgeClass = 'badge-sd'; }
        }

        variants.push({
          id: label,
          label,
          badge,
          badgeClass,
          width: w,
          height: h,
          streamInf: pendingStreamInf,
          uri: fullStreamUri,
        });
        pendingStreamInf = null;
        return;
      }
    });

    if (!variants || variants.length === 0) {
      result.qualityLevels = [
        { id: 'auto', label: 'Auto', badge: 'Optimal', badgeClass: 'badge-auto', isAuto: true },
        { id: '1080p', label: '1080p', badge: 'FHD', badgeClass: 'badge-fhd', height: 1080 },
        { id: '720p', label: '720p', badge: 'HD', badgeClass: 'badge-hd', height: 720 },
        { id: '480p', label: '480p', badge: 'SD', badgeClass: 'badge-sd', height: 480 },
        { id: '360p', label: '360p', badge: 'SD', badgeClass: 'badge-sd', height: 360 },
      ];
    } else {
      const seenLabels = new Set();
      const uniqueQualities = [];
      [...variants].sort((a, b) => b.height - a.height).forEach((q) => {
        if (!seenLabels.has(q.label)) {
          seenLabels.add(q.label);
          uniqueQualities.push({
            id: q.id,
            label: q.label,
            badge: q.badge,
            badgeClass: q.badgeClass,
            height: q.height,
            uri: q.uri,
          });
        }
      });
      result.qualityLevels = [
        { id: 'auto', label: 'Auto', badge: 'Optimal', badgeClass: 'badge-auto', isAuto: true },
        ...uniqueQualities,
      ];
    }

    // Resolve which audio track index to activate based on user's preference or index
    let resolvedAudioIndex = 0;
    if (typeof targetAudioPrefOrIndex === 'number') {
      resolvedAudioIndex = Math.max(0, Math.min(targetAudioPrefOrIndex, Math.max(0, result.audioTracks.length - 1)));
    } else if (targetAudioPrefOrIndex && typeof targetAudioPrefOrIndex === 'object') {
      const targetLang = (targetAudioPrefOrIndex.language || '').toLowerCase().trim();
      const targetName = (targetAudioPrefOrIndex.name || targetAudioPrefOrIndex.displayName || '').toLowerCase().trim();

      const matchedIndex = result.audioTracks.findIndex((t) => {
        const tLang = (t.language || '').toLowerCase().trim();
        const tName = (t.name || '').toLowerCase().trim();
        const tDisplay = (t.displayName || '').toLowerCase().trim();
        return (
          (targetLang && tLang === targetLang) ||
          (targetName && (tName === targetName || tDisplay === targetName || tDisplay.includes(targetName) || targetName.includes(tDisplay)))
        );
      });

      if (matchedIndex !== -1) {
        resolvedAudioIndex = matchedIndex;
      }
    } else if (typeof targetAudioPrefOrIndex === 'string') {
      const query = targetAudioPrefOrIndex.toLowerCase().trim();
      const matchedIndex = result.audioTracks.findIndex((t) => {
        return (
          (t.language || '').toLowerCase().trim() === query ||
          (t.name || '').toLowerCase().trim().includes(query) ||
          (t.displayName || '').toLowerCase().trim().includes(query)
        );
      });
      if (matchedIndex !== -1) resolvedAudioIndex = matchedIndex;
    }
    result.selectedAudioIndex = resolvedAudioIndex;

    // Build a sanitized master playlist for ExoPlayer:
    // 1. Exclude TYPE=SUBTITLES because it points to raw .vtt files which crash ExoPlayer's HlsPlaylistParser
    // 2. Remove SUBTITLES="subs" attribute from #EXT-X-STREAM-INF
    // 3. Mark selectedAudioIndex as DEFAULT=YES, AUTOSELECT=YES, non-selected as DEFAULT=NO, AUTOSELECT=NO
    // 4. Resolve relative audio and video variant paths to full URLs
    // 5. CRITICAL FIX: Guarantee that NAME attribute is NEVER empty ("") in #EXT-X-MEDIA:TYPE=AUDIO
    // 6. Support targetQuality: for specific quality output only that variant; for 'auto' sort highest-first and filter non-16-aligned renditions
    const cleanLines = ['#EXTM3U'];

    if (rawText.includes('#EXT-X-VERSION:')) {
      const vMatch = rawText.match(/#EXT-X-VERSION:\d+/);
      if (vMatch) cleanLines.push(vMatch[0]);
    }
    if (rawText.includes('#EXT-X-INDEPENDENT-SEGMENTS')) {
      cleanLines.push('#EXT-X-INDEPENDENT-SEGMENTS');
    }

    result.audioTracks.forEach((track, aIdx) => {
      const isSelected = aIdx === resolvedAudioIndex;
      const safeName = (track.displayName || track.name || `Audio ${aIdx + 1}`).replace(/"/g, '');
      let modified = track.rawLine || `#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="${safeName}",URI="${track.uri}"`;

      if (/NAME="[^"]*"/.test(modified)) {
        modified = modified.replace(/NAME="[^"]*"/, `NAME="${safeName}"`);
      } else {
        modified = modified.replace('#EXT-X-MEDIA:TYPE=AUDIO', `#EXT-X-MEDIA:TYPE=AUDIO,NAME="${safeName}"`);
      }

      if (/DEFAULT=(YES|NO)/.test(modified)) {
        modified = modified.replace(/DEFAULT=(YES|NO)/, `DEFAULT=${isSelected ? 'YES' : 'NO'}`);
      } else {
        modified += `,DEFAULT=${isSelected ? 'YES' : 'NO'}`;
      }

      if (/AUTOSELECT=(YES|NO)/.test(modified)) {
        modified = modified.replace(/AUTOSELECT=(YES|NO)/, `AUTOSELECT=${isSelected ? 'YES' : 'NO'}`);
      } else {
        modified += `,AUTOSELECT=${isSelected ? 'YES' : 'NO'}`;
      }

      modified = modified.replace(/URI="([^"]+)"/, (m, p1) => {
        const full = p1.startsWith('http') ? p1 : baseUrl + p1;
        return `URI="${full}"`;
      });

      cleanLines.push(modified);
    });

    if (variants.length > 0) {
      if (targetQuality && targetQuality !== 'auto') {
        const chosenVariant = variants.find(
          (v) => v.id.toLowerCase() === targetQuality.toLowerCase() || v.label.toLowerCase() === targetQuality.toLowerCase()
        ) || variants[0];

        const cleanInf = chosenVariant.streamInf.replace(/,SUBTITLES="[^"]+"/, '');
        cleanLines.push(cleanInf);
        cleanLines.push(chosenVariant.uri);
      } else {
        // Auto mode: select optimal highest rendition (1080p) to guarantee zero macroblock misalignment and pristine playback
        const sorted = [...variants].sort((a, b) => b.height - a.height);
        const bestVariant = sorted[0];
        if (bestVariant) {
          const cleanInf = bestVariant.streamInf.replace(/,SUBTITLES="[^"]+"/, '');
          cleanLines.push(cleanInf);
          cleanLines.push(bestVariant.uri);
        }
      }
    } else {
      // Fallback if no variants found (e.g. single stream media playlist)
      lines.forEach((line) => {
        const l = line.trim();
        if (!l || l.startsWith('#EXTM3U') || l.startsWith('#EXT-X-MEDIA:TYPE=')) return;
        if (!l.startsWith('#')) {
          const full = l.startsWith('http') ? l : baseUrl + l;
          cleanLines.push(full);
        } else {
          cleanLines.push(l);
        }
      });
    }

    try {
      if (FileSystem && FileSystem.cacheDirectory) {
        const cacheFile = `${FileSystem.cacheDirectory}stream_${Date.now()}.m3u8`;
        await FileSystem.writeAsStringAsync(cacheFile, cleanLines.join('\n'));
        result.sanitizedUrl = cacheFile;
      } else {
        result.sanitizedUrl = workingUrl;
      }
    } catch (fsErr) {
      console.warn('Could not write sanitized m3u8 to cache:', fsErr);
      result.sanitizedUrl = workingUrl;
    }
    return result;
  } catch (err) {
    console.warn('Error processing HLS manifest:', err);
    return result;
  }
};

export const PlayerScreen = ({ route, navigation }) => {
  const { episodeId, episode: initialEpisode, show: initialShow, initialPositionMillis = 0 } = route.params || {};

  // Requirement 1: Screen Awake Lock - never sleep while on player screen
  useKeepAwake();
  useEffect(() => {
    activateKeepAwakeAsync('infinx-player-screen').catch(() => {});
    return () => {
      deactivateKeepAwake('infinx-player-screen').catch(() => {});
    };
  }, []);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [isLandscape, setIsLandscape] = useState(false);
  const [timelineWidth, setTimelineWidth] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPositionMillis, setScrubPositionMillis] = useState(0);

  const [show, setShow] = useState(initialShow || null);
  const [episode, setEpisode] = useState(initialEpisode || null);
  const [episodesList, setEpisodesList] = useState(initialShow?.episodes || []);

  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const showControlsRef = useRef(true);
  useEffect(() => {
    showControlsRef.current = showControls;
  }, [showControls]);
  const [playbackError, setPlaybackError] = useState(false);
  const [playbackErrorMsg, setPlaybackErrorMsg] = useState('');
  const [isAuthRequired, setIsAuthRequired] = useState(false);

  // Device Hardware Brightness & System Volume State
  const [brightness, setBrightness] = useState(1.0); // 0.01 to 1.0 (device screen brightness)
  const [volume, setVolume] = useState(1.0); // 0.0 to 1.0 (device media volume)
  const [gestureHud, setGestureHud] = useState({ visible: false, type: null, value: 1.0 });

  const brightnessRef = useRef(1.0);
  const volumeRef = useRef(1.0);
  const activeGestureType = useRef(null);
  const initialGestureValue = useRef(1.0);
  const gestureHudTimeout = useRef(null);
  const hasAppliedInitialSeek = useRef(false);
  const lastSavedHistoryTime = useRef(0);
  const masterUrlRef = useRef(null);

  // Sync with actual mobile device screen brightness and media volume
  useEffect(() => {
    DeviceControls.getBrightness().then((b) => {
      if (typeof b === 'number' && b > 0) {
        setBrightness(b);
        brightnessRef.current = b;
      }
    }).catch(() => {});
    DeviceControls.getVolume().then((v) => {
      if (typeof v === 'number' && v >= 0) {
        setVolume(v);
        volumeRef.current = v;
      }
    }).catch(() => {});

    return () => {
      DeviceControls.restoreBrightness().catch(() => {});
    };
  }, []);

  // Video Quality Section State (Matching Main Site)
  const [availableQualityLevels, setAvailableQualityLevels] = useState([
    { id: 'auto', label: 'Auto', badge: 'Optimal', badgeClass: 'badge-auto', isAuto: true },
    { id: '1080p', label: '1080p', badge: 'FHD', badgeClass: 'badge-fhd', height: 1080 },
    { id: '720p', label: '720p', badge: 'HD', badgeClass: 'badge-hd', height: 720 },
    { id: '480p', label: '480p', badge: 'SD', badgeClass: 'badge-sd', height: 480 },
    { id: '360p', label: '360p', badge: 'SD', badgeClass: 'badge-sd', height: 360 },
  ]);
  const [selectedQuality, setSelectedQuality] = useState('auto');

  const selectQualityLevel = async (qualityItem) => {
    setSelectedQuality(qualityItem.id);
    resetControlsTimeout();

    const curPos = positionMillisRef.current || positionMillis;
    const playing = isPlaying;
    try {
      const rawMaster = masterUrlRef.current || episode?.masterPlaylistUrl || episode?.videoUrl || episode?.streamUrl || SAMPLE_STREAM;
      const formatted = formatMediaUrl(rawMaster);
      const res = await processHlsManifest(formatted, selectedAudioTrackIndex, qualityItem.id);
      if (res.workingUrl) masterUrlRef.current = res.workingUrl;
      setActiveStreamUrl(res.sanitizedUrl);
      if (videoRef.current && curPos > 0) {
        setTimeout(async () => {
          try {
            await videoRef.current.setPositionAsync(curPos);
            if (playing) await videoRef.current.playAsync();
          } catch (e) {}
        }, 300);
      }
    } catch (e) {
      console.warn('Error selecting quality level:', e);
    }
  };

  // Requirement 2: Audio Language Track Memory Across Series
  const [availableAudioTracks, setAvailableAudioTracks] = useState([]);
  const [selectedAudioTrackIndex, setSelectedAudioTrackIndex] = useState(0);
  const preferredAudioRef = useRef(null);

  useEffect(() => {
    const targetShowId = show?.id || episode?.showId;
    if (targetShowId) {
      getPreferredAudioTrack(targetShowId).then((pref) => {
        if (pref) preferredAudioRef.current = pref;
      }).catch(() => {});
    }
  }, [show?.id, episode?.showId]);

  // Requirement 4: Subtitles & Appearance Settings
  const [availableSubtitleTracks, setAvailableSubtitleTracks] = useState([]);
  const [selectedSubtitleIndex, setSelectedSubtitleIndex] = useState(-1); // -1 = Off
  const [subCues, setSubCues] = useState([]);
  const [activeCaptionText, setActiveCaptionText] = useState('');
  const [subSettings, setSubSettings] = useState({
    size: 'medium',
    color: '#ffffff',
    style: 'shadow',
    position: 'bottom',
  });

  useEffect(() => {
    getSubtitleSettings().then(setSubSettings).catch(() => {});
  }, []);

  const handleUpdateSubSettings = (updates) => {
    const updated = { ...subSettings, ...updates };
    setSubSettings(updated);
    saveSubtitleSettings(updated);
  };

  // Requirement 6: Active Server Switcher State
  const [currentServerUrl, setCurrentServerUrl] = useState('');
  const [serverSwitching, setServerSwitching] = useState(false);

  useEffect(() => {
    getApiBaseUrl().then(setCurrentServerUrl).catch(() => {});
  }, []);

  const handleSwitchServer = async (newUrl) => {
    if (!newUrl || newUrl === currentServerUrl) return;
    setServerSwitching(true);
    try {
      const formatted = await setApiBaseUrl(newUrl);
      setCurrentServerUrl(formatted);
      if (episode) {
        const rawUrl = episode?.masterPlaylistUrl || episode?.videoUrl || episode?.streamUrl || SAMPLE_STREAM;
        const formattedMedia = formatMediaUrl(rawUrl);
        const pref = preferredAudioRef.current;
        masterUrlRef.current = formattedMedia;
        const res = await processHlsManifest(formattedMedia, pref, selectedQuality);
        if (res.workingUrl) masterUrlRef.current = res.workingUrl;
        setActiveStreamUrl(res.sanitizedUrl);
        setAvailableAudioTracks(res.audioTracks);
        setSelectedAudioTrackIndex(res.selectedAudioIndex || 0);
        setAvailableSubtitleTracks(res.subtitleTracks);
        if (res.qualityLevels && res.qualityLevels.length > 0) {
          setAvailableQualityLevels(res.qualityLevels);
        }
      }
    } catch (e) {
      console.warn('Error switching server in player:', e);
    } finally {
      setServerSwitching(false);
    }
  };

  // Requirement 3: Precise Timeline Scrubber Measurement Ref
  const progressBarRef = useRef(null);
  const progressBarPageX = useRef(0);

  const measureProgressBar = () => {
    progressBarRef.current?.measure((x, y, width, height, pageX, pageY) => {
      if (pageX !== undefined) {
        progressBarPageX.current = pageX;
      }
    });
  };

  // Playback Stats
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const positionMillisRef = useRef(0);
  const durationMillisRef = useRef(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [resizeMode, setResizeMode] = useState(ResizeMode.CONTAIN);
  const [autoNext, setAutoNext] = useState(true);

  // Modals
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [episodesVisible, setEpisodesVisible] = useState(false);
  const [activeStreamUrl, setActiveStreamUrl] = useState(null);

  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Helper to persist watch history
  const saveCurrentProgress = (posOverride, durOverride) => {
    const p = posOverride !== undefined ? posOverride : positionMillisRef.current;
    const d = durOverride !== undefined ? durOverride : durationMillisRef.current;
    if (p > 1000 && d > 0 && (episode || show)) {
      recordWatchHistory(show, episode, p, d).catch(() => {});
    }
  };

  // HUD show / hide
  const showHud = (type, value) => {
    if (gestureHudTimeout.current) clearTimeout(gestureHudTimeout.current);
    setGestureHud({ visible: true, type, value });
  };

  const scheduleHideHud = () => {
    if (gestureHudTimeout.current) clearTimeout(gestureHudTimeout.current);
    gestureHudTimeout.current = setTimeout(() => {
      setGestureHud(prev => ({ ...prev, visible: false }));
    }, 1200);
  };

  // Seek ±10s (Direct ExoPlayer status query + ref tracking to prevent stale 0s seek)
  const skipForward = async (amountMs = 10000) => {
    resetControlsTimeout();
    if (!videoRef.current) return;
    try {
      let curPos = positionMillisRef.current;
      let curDur = durationMillisRef.current;

      try {
        const status = await videoRef.current.getStatusAsync();
        if (status && status.isLoaded) {
          if (typeof status.positionMillis === 'number' && status.positionMillis > 0) {
            curPos = Math.max(curPos, status.positionMillis);
          }
          if (typeof status.durationMillis === 'number' && status.durationMillis > 0) {
            curDur = status.durationMillis;
          }
        }
      } catch (e) {}

      const targetPos = curDur > 0 ? Math.min(curPos + amountMs, curDur) : curPos + amountMs;
      positionMillisRef.current = targetPos;
      setPositionMillis(targetPos);
      await videoRef.current.setPositionAsync(targetPos);
    } catch (e) {
      console.warn('Error in skipForward:', e);
    }
  };

  const skipBackward = async (amountMs = 10000) => {
    resetControlsTimeout();
    if (!videoRef.current) return;
    try {
      let curPos = positionMillisRef.current;
      let curDur = durationMillisRef.current;

      try {
        const status = await videoRef.current.getStatusAsync();
        if (status && status.isLoaded) {
          if (typeof status.positionMillis === 'number') {
            curPos = status.positionMillis;
          }
          if (typeof status.durationMillis === 'number' && status.durationMillis > 0) {
            curDur = status.durationMillis;
          }
        }
      } catch (e) {}

      const targetPos = Math.max(curPos - amountMs, 0);
      positionMillisRef.current = targetPos;
      setPositionMillis(targetPos);
      await videoRef.current.setPositionAsync(targetPos);
    } catch (e) {
      console.warn('Error in skipBackward:', e);
    }
  };

  // Requirement: Double Tap HUD & Seek ±10s (Left = -10s, Right = +10s, YouTube-style accumulation)
  const [doubleTapHud, setDoubleTapHud] = useState({ visible: false, side: null, count: 10 });
  const doubleTapTimeoutRef = useRef(null);
  const skipAccumulatorRef = useRef(10);
  const lastDoubleTapSideRef = useRef(null);
  const lastDoubleTapTimeRef = useRef(0);
  const lastTapTimeRef = useRef(0);
  const lastTapXRef = useRef(0);
  const singleTapTimerRef = useRef(null);

  const triggerDoubleTapSkip = (side) => {
    const now = Date.now();
    let currentCount = 10;
    if (
      lastDoubleTapSideRef.current === side &&
      now - lastDoubleTapTimeRef.current < 900
    ) {
      skipAccumulatorRef.current += 10;
      currentCount = skipAccumulatorRef.current;
    } else {
      skipAccumulatorRef.current = 10;
      currentCount = 10;
    }

    lastDoubleTapSideRef.current = side;
    lastDoubleTapTimeRef.current = now;

    if (doubleTapTimeoutRef.current) clearTimeout(doubleTapTimeoutRef.current);
    setDoubleTapHud({ visible: true, side, count: currentCount });

    if (side === 'left') {
      skipBackward(10000);
    } else {
      skipForward(10000);
    }

    doubleTapTimeoutRef.current = setTimeout(() => {
      setDoubleTapHud((prev) => ({ ...prev, visible: false }));
      skipAccumulatorRef.current = 10;
      lastDoubleTapSideRef.current = null;
    }, 850);
  };

  // Requirement: Precise Skip Intro & Outro (Netflix / Crunchyroll Style)
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipOutro, setShowSkipOutro] = useState(false);
  const [autoSkipIntro, setAutoSkipIntro] = useState(false);
  const [autoSkipOutro, setAutoSkipOutro] = useState(true);
  const [skipDurationPref, setSkipDurationPref] = useState('auto');
  const [backgroundCues, setBackgroundCues] = useState([]);
  const hasAutoSkippedIntroRef = useRef(false);
  const outroDismissedRef = useRef(false);

  // Undo Skip Intro Toast
  const [undoSkipVisible, setUndoSkipVisible] = useState(false);
  const lastSkippedPosRef = useRef(null);
  const undoToastTimeoutRef = useRef(null);

  // Outro Auto-Next Countdown
  const [showOutroCard, setShowOutroCard] = useState(false);
  const [outroCountdown, setOutroCountdown] = useState(null);
  const outroCountdownTimerRef = useRef(null);

  // Intelligent detection memoization
  const skipWindows = useMemo(() => {
    return detectPreciseIntroOutroWindows({
      episode,
      durationMillis,
      subCues: subCues.length > 0 ? subCues : backgroundCues,
      preferredDuration: skipDurationPref,
    });
  }, [episode, durationMillis, subCues, backgroundCues, skipDurationPref]);

  const skipWindowsRef = useRef(skipWindows);
  useEffect(() => {
    skipWindowsRef.current = skipWindows;
  }, [skipWindows]);

  const autoSkipIntroRef = useRef(autoSkipIntro);
  useEffect(() => {
    autoSkipIntroRef.current = autoSkipIntro;
  }, [autoSkipIntro]);

  const autoSkipOutroRef = useRef(autoSkipOutro);
  useEffect(() => {
    autoSkipOutroRef.current = autoSkipOutro;
  }, [autoSkipOutro]);

  const episodesListRef = useRef(episodesList);
  useEffect(() => {
    episodesListRef.current = episodesList;
  }, [episodesList]);

  const episodeRef = useRef(episode);
  useEffect(() => {
    episodeRef.current = episode;
  }, [episode]);

  useEffect(() => {
    getAutoSkipIntroSetting().then(setAutoSkipIntro).catch(() => {});
    getAutoSkipOutroSetting().then(setAutoSkipOutro).catch(() => {});
    getSkipDurationSetting().then(setSkipDurationPref).catch(() => {});
  }, []);

  const handleToggleAutoSkip = (val) => {
    setAutoSkipIntro(val);
    saveAutoSkipIntroSetting(val);
  };

  const handleToggleAutoSkipOutro = (val) => {
    setAutoSkipOutro(val);
    saveAutoSkipOutroSetting(val);
  };

  const handleSelectSkipDuration = (val) => {
    setSkipDurationPref(val);
    saveSkipDurationSetting(val);
  };

  // Dynamic Refs to ensure PanResponder never hits stale closures
  const windowWidthRef = useRef(windowWidth);
  useEffect(() => {
    windowWidthRef.current = windowWidth;
  }, [windowWidth]);

  const triggerDoubleTapSkipRef = useRef(null);
  triggerDoubleTapSkipRef.current = triggerDoubleTapSkip;

  const toggleControlsRef = useRef(null);
  toggleControlsRef.current = toggleControls;

  const togglePlayPauseRef = useRef(null);
  togglePlayPauseRef.current = togglePlayPause;

  const hasMoved = useRef(false);

  // Gesture PanResponder: Left = Brightness, Right = Volume, Double-Tap = Seek ±10s, Single Tap = Controls
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !showControlsRef.current,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: (evt) => {
        hasMoved.current = false;
        const currentWidth = windowWidthRef.current || windowWidth;
        const touchX = evt.nativeEvent.pageX ?? evt.nativeEvent.locationX ?? (currentWidth * 0.5);
        const isRight = touchX >= (currentWidth * 0.5);
        if (isRight) {
          activeGestureType.current = 'volume';
          initialGestureValue.current = volumeRef.current;
        } else {
          activeGestureType.current = 'brightness';
          initialGestureValue.current = brightnessRef.current;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (Math.abs(gestureState.dy) > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
          hasMoved.current = true;
          if (!activeGestureType.current) return;
          const delta = -gestureState.dy / 220;
          if (activeGestureType.current === 'brightness') {
            const nextVal = Math.max(0.01, Math.min(1.0, initialGestureValue.current + delta));
            setBrightness(nextVal);
            brightnessRef.current = nextVal;
            DeviceControls.setBrightness(nextVal).catch(() => {});
            showHud('brightness', nextVal);
          } else if (activeGestureType.current === 'volume') {
            const nextVal = Math.max(0.0, Math.min(1.0, initialGestureValue.current + delta));
            setVolume(nextVal);
            volumeRef.current = nextVal;
            DeviceControls.setVolume(nextVal).catch(() => {});
            if (videoRef.current) {
              videoRef.current.setStatusAsync({ volume: nextVal, isMuted: nextVal === 0 }).catch(() => {});
            }
            setIsMuted(nextVal === 0);
            showHud('volume', nextVal);
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!hasMoved.current && Math.abs(gestureState.dx) < 16 && Math.abs(gestureState.dy) < 16) {
          const currentWidth = windowWidthRef.current || windowWidth;
          const touchX = evt.nativeEvent.pageX ?? evt.nativeEvent.locationX ?? (currentWidth * 0.5);
          const now = Date.now();
          const timeDiff = now - lastTapTimeRef.current;
          const xDiff = Math.abs(touchX - lastTapXRef.current);

          if (timeDiff < 360 && xDiff < 140) {
            // Confirmed Double-Tap!
            if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
            lastTapTimeRef.current = 0;

            if (touchX < currentWidth * 0.42) {
              if (triggerDoubleTapSkipRef.current) {
                triggerDoubleTapSkipRef.current('left');
              } else {
                triggerDoubleTapSkip('left');
              }
            } else if (touchX > currentWidth * 0.58) {
              if (triggerDoubleTapSkipRef.current) {
                triggerDoubleTapSkipRef.current('right');
              } else {
                triggerDoubleTapSkip('right');
              }
            } else {
              if (togglePlayPauseRef.current) {
                togglePlayPauseRef.current();
              } else {
                togglePlayPause();
              }
            }
          } else {
            // First tap: delay toggleControls to detect potential second tap
            lastTapTimeRef.current = now;
            lastTapXRef.current = touchX;
            if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
            singleTapTimerRef.current = setTimeout(() => {
              if (toggleControlsRef.current) {
                toggleControlsRef.current();
              } else {
                toggleControls();
              }
            }, 270);
          }
        }
        activeGestureType.current = null;
        scheduleHideHud();
      },
      onPanResponderTerminate: () => {
        activeGestureType.current = null;
        scheduleHideHud();
      },
    })
  ).current;

  const hideSystemUI = async () => {
    try {
      StatusBar.setHidden(true, 'fade');
      if (Platform.OS === 'android') {
        await NavigationBar.setPositionAsync('absolute');
        await NavigationBar.setVisibilityAsync('hidden');
        await NavigationBar.setBehaviorAsync('overlay-swipe');
      }
    } catch (e) {
      console.warn('Error hiding system UI:', e);
    }
  };

  const showSystemUI = async () => {
    try {
      StatusBar.setHidden(false, 'fade');
      if (Platform.OS === 'android') {
        await NavigationBar.setPositionAsync('relative');
        await NavigationBar.setVisibilityAsync('visible');
        await NavigationBar.setBehaviorAsync('inset-touch');
      }
    } catch (e) {
      console.warn('Error showing system UI:', e);
    }
  };

  // Fluid Orientation Management: Auto-rotates naturally with device sensor & allows manual button toggle
  useEffect(() => {
    let isMounted = true;

    // Enable fluid device rotation
    ScreenOrientation.unlockAsync().catch(() => {});

    let navBarListener = null;
    if (Platform.OS === 'android') {
      try {
        navBarListener = NavigationBar.addVisibilityListener(({ visibility }) => {
          if (visibility === 'visible' && isMounted) {
            setTimeout(() => {
              if (isMounted) {
                NavigationBar.setVisibilityAsync('hidden').catch(() => {});
              }
            }, 2500);
          }
        });
      } catch (e) {}
    }

    const updateOrientationState = (orient) => {
      if (!isMounted) return;
      const landscape =
        orient === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        orient === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;
      setIsLandscape(landscape);
      if (landscape) {
        hideSystemUI();
      } else {
        showSystemUI();
      }
    };

    ScreenOrientation.getOrientationAsync().then(updateOrientationState).catch(() => {});

    const subscription = ScreenOrientation.addOrientationChangeListener((evt) => {
      updateOrientationState(evt.orientationInfo.orientation);
    });

    const unsubFocus = navigation.addListener('focus', () => {
      ScreenOrientation.unlockAsync().catch(() => {});
    });

    const unsubBlur = navigation.addListener('blur', () => {
      saveCurrentProgress();
      showSystemUI();
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    });

    return () => {
      isMounted = false;
      ScreenOrientation.removeOrientationChangeListener(subscription);
      if (navBarListener && typeof navBarListener.remove === 'function') {
        navBarListener.remove();
      }
      unsubFocus();
      unsubBlur();
      saveCurrentProgress();
      showSystemUI();
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, [navigation]);

  const isWidescreen = windowWidth > windowHeight;

  // Safe Exit & Restore Portrait
  const handleBackPress = async () => {
    saveCurrentProgress();
    await showSystemUI();
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } catch (e) {}
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  // Toggle Orientation Button handler
  const toggleOrientation = async () => {
    resetControlsTimeout();
    try {
      if (isWidescreen) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setIsLandscape(false);
        await showSystemUI();
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setIsLandscape(true);
        await hideSystemUI();
      }
    } catch (err) {
      console.warn('Orientation toggle error:', err);
    }
  };

  // Android Hardware Back Button Listener
  useEffect(() => {
    const onBackPress = () => {
      if (episodesVisible) {
        setEpisodesVisible(false);
        return true;
      }
      if (settingsVisible) {
        setSettingsVisible(false);
        return true;
      }
      if (isWidescreen) {
        // Exit landscape back to portrait first
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
        setIsLandscape(false);
        showSystemUI();
        return true;
      }
      handleBackPress();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [episodesVisible, settingsVisible, isWidescreen, navigation, positionMillis, durationMillis, episode, show]);

  // Load and process stream URL & manifest
  const loadStreamUrl = async (targetUrl, audioIdx = 0, targetQuality = 'auto') => {
    setPlaybackError(false);
    setSelectedSubtitleIndex(-1);
    setSubCues([]);
    setBackgroundCues([]);
    setActiveCaptionText('');

    const formatted = formatMediaUrl(targetUrl);
    masterUrlRef.current = formatted;
    const pref = preferredAudioRef.current !== null ? preferredAudioRef.current : audioIdx;
    const result = await processHlsManifest(formatted, pref, targetQuality || selectedQuality);
    if (result.workingUrl) masterUrlRef.current = result.workingUrl;

    setActiveStreamUrl(result.sanitizedUrl);
    setAvailableAudioTracks(result.audioTracks);
    const resolvedIdx = result.selectedAudioIndex ?? audioIdx;
    setSelectedAudioTrackIndex(resolvedIdx);
    if (result.audioTracks[resolvedIdx]) {
      preferredAudioRef.current = result.audioTracks[resolvedIdx];
    }
    setAvailableSubtitleTracks(result.subtitleTracks);
    if (result.qualityLevels && result.qualityLevels.length > 0) {
      setAvailableQualityLevels(result.qualityLevels);
    }

    // Pre-fetch first subtitle track in background for AI intro/outro detection even when captions are hidden
    if (result.subtitleTracks && result.subtitleTracks.length > 0) {
      const firstSubUri = result.subtitleTracks[0]?.uri;
      if (firstSubUri) {
        fetch(firstSubUri)
          .then((r) => (r.ok ? r.text() : ''))
          .then((txt) => {
            if (txt) {
              const cues = parseVtt(txt);
              if (cues && cues.length > 0) {
                setBackgroundCues(cues);
              }
            }
          })
          .catch(() => {});
      }
    }
  };

  // Sync active stream URL when episode updates (strictly auth gated)
  useEffect(() => {
    let isMounted = true;
    const initStream = async () => {
      const sess = await getAuthSession();
      if (!sess?.token) {
        if (isMounted) {
          setIsPlaying(false);
          setIsAuthRequired(true);
          setActiveStreamUrl(null);
        }
        return;
      }
      if (isMounted) setIsAuthRequired(false);

      if (episode) {
        const rawUrl = episode?.masterPlaylistUrl || episode?.videoUrl || episode?.streamUrl || SAMPLE_STREAM;
        const formatted = formatMediaUrl(rawUrl);
        setPlaybackError(false);
        hasAppliedInitialSeek.current = false;
        setSelectedSubtitleIndex(-1);
        setSubCues([]);
        setActiveCaptionText('');

        try {
          const targetShowId = show?.id || episode?.showId;
          const pref = preferredAudioRef.current || await getPreferredAudioTrack(targetShowId);
          masterUrlRef.current = formatted;
          const result = await processHlsManifest(formatted, pref, selectedQuality);
          if (result.workingUrl) masterUrlRef.current = result.workingUrl;
          if (isMounted) {
            setActiveStreamUrl(result.sanitizedUrl);
            setAvailableAudioTracks(result.audioTracks);
            const resolvedIdx = result.selectedAudioIndex || 0;
            setSelectedAudioTrackIndex(resolvedIdx);
            if (result.audioTracks[resolvedIdx]) {
              preferredAudioRef.current = result.audioTracks[resolvedIdx];
            }
            setAvailableSubtitleTracks(result.subtitleTracks);
            if (result.qualityLevels && result.qualityLevels.length > 0) {
              setAvailableQualityLevels(result.qualityLevels);
            }
          }
        } catch (err) {
          console.warn('Playlist prep error:', err);
          if (isMounted) setActiveStreamUrl(formatted);
        }
      }
    };
    initStream();
    return () => { isMounted = false; };
  }, [episode?.id, episode?.videoUrl]);

  // Handle Subtitle Selection & Cue Fetching
  const selectSubtitleTrack = async (index) => {
    setSelectedSubtitleIndex(index);
    setActiveCaptionText('');

    if (index === -1 || index >= availableSubtitleTracks.length) {
      setSubCues([]);
      return;
    }

    const subTrack = availableSubtitleTracks[index];
    if (subTrack && subTrack.uri) {
      try {
        const response = await fetch(subTrack.uri);
        if (response.ok) {
          const vttText = await response.text();
          const cues = parseVtt(vttText);
          setSubCues(cues);
        }
      } catch (err) {
        console.warn('Error fetching subtitle VTT:', err);
      }
    }
  };

  // Load episode and show metadata
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setPlaybackError(false);
      try {
        let currentEp = initialEpisode;
        if (episodeId && (!currentEp || !currentEp.videoUrl)) {
          const fetchedEp = await apiService.getEpisodeById(episodeId);
          if (fetchedEp) currentEp = fetchedEp;
        }
        if (isMounted && currentEp) setEpisode(currentEp);

        let parentShow = initialShow;
        const targetShowId = currentEp?.showId || initialShow?.id;
        if (targetShowId && (!parentShow || !parentShow.episodes)) {
          const fetchedShow = await apiService.getShowById(targetShowId);
          if (fetchedShow) parentShow = fetchedShow;
        }
        if (isMounted && parentShow) {
          setShow(parentShow);
          if (parentShow.episodes && parentShow.episodes.length > 0) {
            setEpisodesList(parentShow.episodes);
          }
        }
      } catch (err) {
        console.warn('Error loading player data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [episodeId]);

  // Controls Auto-Hide Timer & Toggle
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4500);
  };

  const toggleControls = () => {
    setShowControls((prev) => {
      if (prev) {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        return false;
      } else {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 4500);
        return true;
      }
    });
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Update Status, Active Subtitle Cue, & Handle Auto Next
  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPlaybackError(false);
      const pos = status.positionMillis || 0;
      const dur = status.durationMillis || 0;
      setPositionMillis(pos);
      setDurationMillis(dur);
      positionMillisRef.current = pos;
      if (dur > 0) durationMillisRef.current = dur;
      setIsPlaying(status.isPlaying);

      // Initial seek to saved position when resuming from Continue Watching
      if (!hasAppliedInitialSeek.current && initialPositionMillis > 0 && dur > 0) {
        hasAppliedInitialSeek.current = true;
        if (initialPositionMillis < dur - 5000) {
          videoRef.current?.setPositionAsync(initialPositionMillis).catch(() => {});
        }
      }

      // Periodic watch history recording (every ~6 seconds during active playback)
      if (status.isPlaying && pos > 3000) {
        const now = Date.now();
        if (now - lastSavedHistoryTime.current > 6000) {
          lastSavedHistoryTime.current = now;
          recordWatchHistory(show, episode, pos, dur || durationMillis).catch(() => {});
        }
      }

      // Match current timestamp with active subtitle cue
      if (subCues.length > 0) {
        const activeCue = subCues.find(c => c.startMs <= pos && pos <= c.endMs);
        setActiveCaptionText(activeCue ? activeCue.text : '');
      } else {
        setActiveCaptionText('');
      }

      // Requirement: Precise Smart Intro & Outro detection
      const currentSkip = skipWindowsRef.current;
      const intro = currentSkip?.intro;
      const outro = currentSkip?.outro;
      const currentList = episodesListRef.current || [];
      const currentCurEp = episodeRef.current;
      const cIdx = currentList.findIndex(e => e.id === currentCurEp?.id || e.episodeNumber === currentCurEp?.episodeNumber);
      const canAdvance = cIdx >= 0 && cIdx < currentList.length - 1;

      if (dur > 60000 && intro && pos >= intro.start && pos < intro.end) {
        if (autoSkipIntroRef.current && !hasAutoSkippedIntroRef.current) {
          hasAutoSkippedIntroRef.current = true;
          triggerUndoToast(pos);
          videoRef.current?.setPositionAsync(intro.end).catch(() => {});
          setShowSkipIntro(false);
        } else {
          setShowSkipIntro(true);
        }
      } else {
        setShowSkipIntro(false);
      }

      if (dur > 60000 && outro && pos >= outro.start && pos < outro.end) {
        if (canAdvance) {
          if (!outroDismissedRef.current) {
            setShowOutroCard(true);
          }
          setShowSkipOutro(false);
        } else {
          setShowSkipOutro(true);
          setShowOutroCard(false);
        }
      } else {
        setShowSkipOutro(false);
        setShowOutroCard(false);
      }

      if (status.didJustFinish && !status.isLooping) {
        saveCurrentProgress();
        if (autoNext && episodesList.length > 0) {
          playNextEpisode();
        }
      }
    } else if (status.error) {
      console.warn('Playback error:', status.error);
      setPlaybackErrorMsg(`Status Error: ${status.error}`);
      setPlaybackError(true);
    }
  };

  // Toggle Play / Pause
  const togglePlayPause = async () => {
    resetControlsTimeout();
    if (!videoRef.current) return;
    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn('Error toggling play/pause:', e);
    }
  };

  // Mute / Unmute
  const toggleMute = async () => {
    resetControlsTimeout();
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    await videoRef.current.setIsMutedAsync(newMuted);
    setIsMuted(newMuted);
    if (!newMuted && volumeRef.current === 0) {
      setVolume(0.5);
      volumeRef.current = 0.5;
      await videoRef.current.setStatusAsync({ volume: 0.5, isMuted: false });
    }
  };

  // Interactive Timeline Scrubber Handlers (Glitch-free pageX coordinate mapping)
  const updateScrubFromEvent = (evt) => {
    if (timelineWidth <= 0 || durationMillis <= 0) return;
    const pageX = evt.nativeEvent.pageX;
    let touchX;
    if (pageX !== undefined && progressBarPageX.current !== undefined && progressBarPageX.current > 0) {
      touchX = pageX - progressBarPageX.current;
    } else {
      touchX = evt.nativeEvent.locationX;
    }
    const clampedX = Math.max(0, Math.min(touchX, timelineWidth));
    const ratio = clampedX / timelineWidth;
    const targetMillis = Math.floor(ratio * durationMillis);
    setScrubPositionMillis(targetMillis);
  };

  const handleTimelineTouchStart = (evt) => {
    resetControlsTimeout();
    setIsScrubbing(true);
    measureProgressBar();
    updateScrubFromEvent(evt);
  };

  const handleTimelineTouchMove = (evt) => {
    resetControlsTimeout();
    updateScrubFromEvent(evt);
  };

  const handleTimelineTouchEnd = async (evt) => {
    setIsScrubbing(false);
    resetControlsTimeout();
    if (timelineWidth <= 0 || durationMillis <= 0 || !videoRef.current) return;
    const pageX = evt.nativeEvent.pageX;
    let touchX;
    if (pageX !== undefined && progressBarPageX.current !== undefined && progressBarPageX.current > 0) {
      touchX = pageX - progressBarPageX.current;
    } else {
      touchX = evt.nativeEvent.locationX;
    }
    const clampedX = Math.max(0, Math.min(touchX, timelineWidth));
    const ratio = clampedX / timelineWidth;
    const targetMillis = Math.floor(ratio * durationMillis);
    setPositionMillis(targetMillis);
    positionMillisRef.current = targetMillis;
    try {
      await videoRef.current.setPositionAsync(targetMillis);
    } catch (e) {
      console.warn('Seek error:', e);
    }
  };

  // Undo Toast Trigger & Dismiss
  const triggerUndoToast = (skippedFrom) => {
    lastSkippedPosRef.current = skippedFrom;
    setUndoSkipVisible(true);
    if (undoToastTimeoutRef.current) clearTimeout(undoToastTimeoutRef.current);
    undoToastTimeoutRef.current = setTimeout(() => {
      setUndoSkipVisible(false);
    }, 6000);
  };

  const handleUndoSkip = async () => {
    if (lastSkippedPosRef.current !== null && videoRef.current) {
      const returnTarget = lastSkippedPosRef.current;
      lastSkippedPosRef.current = null;
      setUndoSkipVisible(false);
      hasAutoSkippedIntroRef.current = false;
      await videoRef.current.setPositionAsync(returnTarget);
    }
  };

  const handleCancelOutro = () => {
    outroDismissedRef.current = true;
    setShowOutroCard(false);
    setOutroCountdown(null);
    if (outroCountdownTimerRef.current) {
      clearInterval(outroCountdownTimerRef.current);
      outroCountdownTimerRef.current = null;
    }
  };

  // Change Episode
  const playNextEpisode = () => {
    if (!episodesList || episodesList.length === 0) return;
    const currentIdx = episodesList.findIndex(e => e.id === episode?.id || e.episodeNumber === episode?.episodeNumber);
    if (currentIdx >= 0 && currentIdx < episodesList.length - 1) {
      saveCurrentProgress();
      hasAutoSkippedIntroRef.current = false;
      outroDismissedRef.current = false;
      setShowOutroCard(false);
      setOutroCountdown(null);
      setShowSkipIntro(false);
      setShowSkipOutro(false);
      setUndoSkipVisible(false);
      const nextEp = episodesList[currentIdx + 1];
      setEpisode(nextEp);
    }
  };

  const playPrevEpisode = () => {
    if (!episodesList || episodesList.length === 0) return;
    const currentIdx = episodesList.findIndex(e => e.id === episode?.id || e.episodeNumber === episode?.episodeNumber);
    if (currentIdx > 0) {
      saveCurrentProgress();
      hasAutoSkippedIntroRef.current = false;
      outroDismissedRef.current = false;
      setShowOutroCard(false);
      setOutroCountdown(null);
      setShowSkipIntro(false);
      setShowSkipOutro(false);
      setUndoSkipVisible(false);
      const prevEp = episodesList[currentIdx - 1];
      setEpisode(prevEp);
    }
  };

  // Precise Skip Intro & Outro Action Handlers
  const handleSkipIntro = async () => {
    const introEnd = skipWindowsRef.current?.intro?.end ?? episode?.introEnd ?? 90000;
    const curPos = positionMillisRef.current || positionMillis;
    triggerUndoToast(curPos);
    setShowSkipIntro(false);
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(introEnd);
    }
  };

  const handleSkipOutro = () => {
    setShowSkipOutro(false);
    setShowOutroCard(false);
    const currentIdx = episodesList.findIndex(e => e.id === episode?.id || e.episodeNumber === episode?.episodeNumber);
    const hasNextEp = currentIdx >= 0 && currentIdx < episodesList.length - 1;
    if (hasNextEp) {
      playNextEpisode();
    } else if (videoRef.current && durationMillis > 0) {
      videoRef.current.setPositionAsync(Math.max(0, durationMillis - 1000));
    }
  };

  // Outro Countdown timer effect
  useEffect(() => {
    if (showOutroCard && autoSkipOutro && !outroDismissedRef.current) {
      setOutroCountdown(5);
      if (outroCountdownTimerRef.current) clearInterval(outroCountdownTimerRef.current);
      let count = 5;
      outroCountdownTimerRef.current = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(outroCountdownTimerRef.current);
          outroCountdownTimerRef.current = null;
          setOutroCountdown(0);
          if (!outroDismissedRef.current) {
            playNextEpisode();
          }
        } else {
          setOutroCountdown(count);
        }
      }, 1000);
    } else {
      if (outroCountdownTimerRef.current) {
        clearInterval(outroCountdownTimerRef.current);
        outroCountdownTimerRef.current = null;
      }
      if (!showOutroCard) {
        setOutroCountdown(null);
      }
    }

    return () => {
      if (outroCountdownTimerRef.current) {
        clearInterval(outroCountdownTimerRef.current);
      }
    };
  }, [showOutroCard, autoSkipOutro]);

  // Playback Rate
  const changeSpeed = async (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      await videoRef.current.setRateAsync(rate, true);
    }
  };

  // Switch Audio Track & Persist Preference for entire series
  const selectAudioTrack = async (index) => {
    if (index === selectedAudioTrackIndex) return;
    setSelectedAudioTrackIndex(index);
    resetControlsTimeout();

    const selectedTrack = availableAudioTracks[index];
    if (selectedTrack) {
      preferredAudioRef.current = selectedTrack;
      const targetShowId = show?.id || episode?.showId;
      setPreferredAudioTrack(targetShowId, selectedTrack).catch(() => {});
    }

    const rawMaster = masterUrlRef.current || episode?.masterPlaylistUrl || episode?.videoUrl || episode?.streamUrl || SAMPLE_STREAM;
    const formatted = formatMediaUrl(rawMaster);
    const currentPos = positionMillis;
    const playing = isPlaying;

    try {
      const res = await processHlsManifest(formatted, index, selectedQuality);
      if (res.workingUrl) masterUrlRef.current = res.workingUrl;
      setActiveStreamUrl(res.sanitizedUrl);
      if (videoRef.current && currentPos > 0) {
        setTimeout(async () => {
          try {
            await videoRef.current.setPositionAsync(currentPos);
            if (playing) await videoRef.current.playAsync();
          } catch (e) {}
        }, 400);
      }
    } catch (err) {
      console.warn('Error switching audio track:', err);
    }
  };

  // Cycle Screen Aspect Ratio / Resize Mode
  const cycleResizeMode = () => {
    resetControlsTimeout();
    if (resizeMode === ResizeMode.CONTAIN) {
      setResizeMode(ResizeMode.COVER);
    } else if (resizeMode === ResizeMode.COVER) {
      setResizeMode(ResizeMode.STRETCH);
    } else {
      setResizeMode(ResizeMode.CONTAIN);
    }
  };

  // Format timeline timestamp with hour support (H:MM:SS / M:SS)
  const formatTime = (millis, totalDurationMillis = 0) => {
    if (isNaN(millis) || millis == null || millis < 0) return "0:00";
    const totalSeconds = Math.floor(millis / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const showHours = (totalDurationMillis && totalDurationMillis >= 3600000) || hrs > 0;
    if (showHours) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Determine Stream URL (only activeStreamUrl when prepared)
  const streamUrl = activeStreamUrl ? formatMediaUrl(activeStreamUrl) : null;
  const showTitle = show?.title || episode?.show?.title || "Infinx Anime";
  const epTitle = episode?.title || `Episode ${episode?.episodeNumber || 1}`;

  const currentEpIndex = episodesList.findIndex(e => e.id === episode?.id || e.episodeNumber === episode?.episodeNumber);
  const hasNext = currentEpIndex >= 0 && currentEpIndex < episodesList.length - 1;
  const hasPrev = currentEpIndex > 0;
  const nextEp = hasNext ? episodesList[currentEpIndex + 1] : null;

  return (
    <View style={styles.container}>
      <StatusBar
        hidden={isWidescreen}
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      {isAuthRequired ? (
        <View style={styles.authLockContainer}>
          <View style={styles.authLockCard}>
            <View style={styles.authLockBadge}>
              <Ionicons name="lock-closed" size={32} color="#fff" />
            </View>
            <Text style={styles.authLockTitle}>Account Required to Stream</Text>
            <Text style={styles.authLockDesc}>
              You must sign up or sign in to watch any anime shows. Create your free account to unlock high definition playback!
            </Text>
            <TouchableOpacity
              style={styles.authLockBtn}
              onPress={() => {
                ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
                navigation.navigate('Library');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.authLockBtnText}>Sign In / Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.authLockBackBtn}
              onPress={() => {
                ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
                navigation.goBack();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.authLockBackText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : loading || !streamUrl ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading Stream...</Text>
        </View>
      ) : (
        <View style={styles.playerWrapper} {...panResponder.panHandlers}>
            <Video
              ref={videoRef}
              style={styles.video}
              source={{
                uri: streamUrl,
                overrideExtension: streamUrl?.includes('.m3u8') ? 'm3u8' : undefined,
                headers: streamUrl?.startsWith('http') ? {
                  'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36',
                } : undefined,
              }}
              useNativeControls={false}
              resizeMode={resizeMode}
              shouldPlay={true}
              isMuted={isMuted}
              rate={playbackRate}
              progressUpdateIntervalMillis={250.0}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              onError={(err) => {
                console.warn('Video load error:', err);
                const msg = typeof err === 'object' ? JSON.stringify(err) : String(err);
                setPlaybackErrorMsg(`Load Error: ${msg}`);
                setPlaybackError(true);
              }}
            />

            {/* Real device hardware screen brightness is directly controlled via DeviceControls */}

            {/* Gesture HUD (Brightness / Volume) */}
            {gestureHud.visible && (
              <View style={styles.hudOverlay} pointerEvents="none">
                <View style={styles.hudBox}>
                  <Ionicons
                    name={
                      gestureHud.type === 'brightness'
                        ? (gestureHud.value > 0.6 ? 'sunny' : gestureHud.value > 0.25 ? 'sunny-outline' : 'moon')
                        : (gestureHud.value === 0 ? 'volume-mute' : gestureHud.value > 0.5 ? 'volume-high' : 'volume-low')
                    }
                    size={32}
                    color={COLORS.primary}
                  />
                  <View style={styles.hudBarTrack}>
                    <View
                      style={[
                        styles.hudBarFill,
                        { height: `${Math.round(gestureHud.value * 100)}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.hudText}>{Math.round(gestureHud.value * 100)}%</Text>
                  <Text style={styles.hudLabel}>
                    {gestureHud.type === 'brightness' ? 'Brightness' : 'Volume'}
                  </Text>
                </View>
              </View>
            )}

            {/* Requirement: Double-Tap Seek ±10s HUD Indicator (Left = ⏪ 10s, Right = ⏩ 10s) */}
            {doubleTapHud.visible && (
              <View
                pointerEvents="none"
                style={[
                  styles.doubleTapHudContainer,
                  doubleTapHud.side === 'left' ? styles.doubleTapHudLeft : styles.doubleTapHudRight,
                ]}
              >
                <View style={styles.doubleTapRippleCircle}>
                  <MaterialIcons
                    name={doubleTapHud.side === 'left' ? 'replay-10' : 'forward-10'}
                    size={38}
                    color="#fff"
                  />
                  <Text style={styles.doubleTapHudText}>10 seconds</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 }}>
                    <Ionicons
                      name={doubleTapHud.side === 'left' ? 'chevron-back' : 'chevron-forward'}
                      size={16}
                      color={COLORS.primary}
                    />
                    <Ionicons
                      name={doubleTapHud.side === 'left' ? 'chevron-back' : 'chevron-forward'}
                      size={16}
                      color={COLORS.primary}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Requirement 4: Modern Subtitle / Closed Caption Overlay */}
            {activeCaptionText !== '' && (
              <View
                pointerEvents="none"
                style={[
                  styles.captionOverlay,
                  {
                    bottom: showControls ? 115 : (subSettings.position === 'raised' ? 65 : 35),
                  }
                ]}
              >
                <Text
                  style={[
                    styles.captionText,
                    {
                      fontSize:
                        subSettings.size === 'small' ? 16 :
                        subSettings.size === 'large' ? 25 :
                        subSettings.size === 'huge' ? 30 : 20,
                      color: subSettings.color || '#ffffff',
                      textShadowColor: 'rgba(0, 0, 0, 0.95)',
                      textShadowOffset: { width: 1.5, height: 1.5 },
                      textShadowRadius: 3.5,
                      backgroundColor:
                        subSettings.style === 'shadow'
                          ? 'transparent'
                          : subSettings.style === 'solid'
                          ? 'rgba(10, 10, 15, 0.95)'
                          : 'rgba(0, 0, 0, 0.75)',
                      borderWidth: subSettings.style === 'solid' ? 1 : 0,
                      borderColor: 'rgba(255, 255, 255, 0.25)',
                      paddingHorizontal: subSettings.style === 'shadow' ? 8 : 14,
                      paddingVertical: subSettings.style === 'shadow' ? 2 : 6,
                    }
                  ]}
                >
                  {activeCaptionText}
                </Text>
              </View>
            )}
            {/* Error Fallback Overlay */}
            {playbackError && (
              <View style={styles.errorOverlay}>
                <Ionicons name="alert-circle-outline" size={54} color={COLORS.primary} />
                <Text style={styles.errorTitle}>Stream Connection Error</Text>
                <Text style={styles.errorDesc}>{playbackErrorMsg || 'Could not load video source from server.'}</Text>
                <Text style={{ color: '#888', fontSize: 10, marginTop: 4, textAlign: 'center', paddingHorizontal: 20 }}>
                  {streamUrl}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => {
                      setPlaybackError(false);
                      setActiveStreamUrl(SAMPLE_STREAM);
                    }}
                  >
                    <Ionicons name="play-circle-outline" size={20} color="#fff" />
                    <Text style={styles.retryText}>Play Demo Stream</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.retryBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                    onPress={() => {
                      const originalUrl = episode?.masterPlaylistUrl || episode?.videoUrl || episode?.streamUrl || SAMPLE_STREAM;
                      loadStreamUrl(originalUrl);
                    }}
                  >
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Full Player Overlay Controls */}
            {showControls && (
              <View style={[styles.overlay, isWidescreen && styles.overlayLandscape]} pointerEvents="box-none">
                <TouchableWithoutFeedback onPress={toggleControls}>
                  <View style={StyleSheet.absoluteFillObject} />
                </TouchableWithoutFeedback>
                {/* Top Header Bar */}
                <View style={styles.topBar} pointerEvents="box-none">
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={handleBackPress}
                  >
                    <Ionicons name="chevron-back" size={26} color="#fff" />
                  </TouchableOpacity>

                  <View style={styles.titleWrapper}>
                    <Text style={styles.showTitle} numberOfLines={1}>{showTitle}</Text>
                    <Text style={styles.epTitle} numberOfLines={1}>{epTitle}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => { setEpisodesVisible(true); resetControlsTimeout(); }}
                  >
                    <Ionicons name="list" size={22} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => { setSettingsVisible(true); resetControlsTimeout(); }}
                  >
                    <Ionicons name="settings-sharp" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Center Controls */}
                <View style={styles.centerControls} pointerEvents="box-none">
                  <TouchableOpacity
                    style={[styles.smallControlBtn, !hasPrev && styles.disabledBtn]}
                    onPress={playPrevEpisode}
                    disabled={!hasPrev}
                  >
                    <Ionicons name="play-skip-back" size={24} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.controlBtn} onPress={skipBackward}>
                    <MaterialIcons name="replay-10" size={32} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.playPauseBtn} onPress={togglePlayPause}>
                    <Ionicons
                      name={isPlaying ? "pause" : "play"}
                      size={42}
                      color="#fff"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.controlBtn} onPress={skipForward}>
                    <MaterialIcons name="forward-10" size={32} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.smallControlBtn, !hasNext && styles.disabledBtn]}
                    onPress={playNextEpisode}
                    disabled={!hasNext}
                  >
                    <Ionicons name="play-skip-forward" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Bottom Control Bar */}
                <View style={styles.bottomBar} pointerEvents="box-none">
                  <View style={styles.timeRow}>
                    <Text style={styles.timeText}>
                      {formatTime(isScrubbing ? scrubPositionMillis : positionMillis, durationMillis)}
                    </Text>

                    {/* Requirement 3: Interactive Scrub Progress Bar with pointerEvents=none and pageX tracking */}
                    <View
                      ref={progressBarRef}
                      style={styles.progressBarContainer}
                      onLayout={(e) => {
                        setTimelineWidth(e.nativeEvent.layout.width);
                        measureProgressBar();
                      }}
                      onStartShouldSetResponder={() => true}
                      onMoveShouldSetResponder={() => true}
                      onResponderGrant={handleTimelineTouchStart}
                      onResponderMove={handleTimelineTouchMove}
                      onResponderRelease={handleTimelineTouchEnd}
                      onResponderTerminate={() => setIsScrubbing(false)}
                    >
                      <View style={styles.progressBarTrack} pointerEvents="none">
                        {/* Intelligent Intro Zone Marker */}
                        {durationMillis > 0 && skipWindows.intro && (
                          <View
                            style={[
                              styles.timelineZoneMarker,
                              styles.introZoneMarker,
                              {
                                left: `${(skipWindows.intro.start / durationMillis) * 100}%`,
                                width: `${Math.max(1, ((skipWindows.intro.end - skipWindows.intro.start) / durationMillis) * 100)}%`,
                              }
                            ]}
                          />
                        )}

                        {/* Intelligent Outro Zone Marker */}
                        {durationMillis > 0 && skipWindows.outro && (
                          <View
                            style={[
                              styles.timelineZoneMarker,
                              styles.outroZoneMarker,
                              {
                                left: `${(skipWindows.outro.start / durationMillis) * 100}%`,
                                width: `${Math.max(1, ((skipWindows.outro.end - skipWindows.outro.start) / durationMillis) * 100)}%`,
                              }
                            ]}
                          />
                        )}

                        <View
                          pointerEvents="none"
                          style={[
                            styles.progressBarFill,
                            {
                              width: durationMillis > 0
                                ? `${Math.min(100, Math.max(0, ((isScrubbing ? scrubPositionMillis : positionMillis) / durationMillis) * 100))}%`
                                : '0%'
                            }
                          ]}
                        />

                        {/* Visual Chapter Boundary Notches */}
                        {durationMillis > 0 && skipWindows.intro && (
                          <>
                            <View
                              style={[
                                styles.timelineNotch,
                                { left: `${(skipWindows.intro.start / durationMillis) * 100}%` }
                              ]}
                            />
                            <View
                              style={[
                                styles.timelineNotch,
                                { left: `${(skipWindows.intro.end / durationMillis) * 100}%` }
                              ]}
                            />
                          </>
                        )}
                        {durationMillis > 0 && skipWindows.outro && (
                          <View
                            style={[
                              styles.timelineNotch,
                              { left: `${(skipWindows.outro.start / durationMillis) * 100}%` }
                            ]}
                          />
                        )}
                      </View>

                      {/* Tactile Progress Knob */}
                      <View
                        pointerEvents="none"
                        style={[
                          styles.progressKnob,
                          {
                            left: durationMillis > 0
                              ? `${Math.min(100, Math.max(0, ((isScrubbing ? scrubPositionMillis : positionMillis) / durationMillis) * 100))}%`
                              : '0%',
                            transform: [{ scale: isScrubbing ? 1.35 : 1 }],
                          }
                        ]}
                      >
                        {/* Chapter HUD Tooltip during scrubbing */}
                        {isScrubbing && (
                          <View style={styles.scrubChapterTooltip}>
                            <Text style={styles.scrubChapterTooltipText}>
                              {skipWindows.intro && scrubPositionMillis >= skipWindows.intro.start && scrubPositionMillis <= skipWindows.intro.end
                                ? '🎵 Opening (OP)'
                                : skipWindows.outro && scrubPositionMillis >= skipWindows.outro.start && scrubPositionMillis <= skipWindows.outro.end
                                ? '🎬 Ending (ED)'
                                : formatTime(scrubPositionMillis, durationMillis)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <Text style={styles.timeText}>{formatTime(durationMillis, durationMillis)}</Text>
                  </View>

                  {/* Actions Row */}
                  <View style={styles.bottomActionsRow}>
                    <TouchableOpacity style={styles.actionIconButton} onPress={toggleMute}>
                      <Ionicons
                        name={isMuted ? "volume-mute" : "volume-high"}
                        size={20}
                        color="#fff"
                      />
                    </TouchableOpacity>

                    {/* Quick Quality Indicator Button */}
                    <TouchableOpacity
                      style={[styles.actionIconButton, { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8 }]}
                      onPress={() => setSettingsVisible(true)}
                    >
                      <Ionicons name="sparkles" size={13} color={COLORS.primary} />
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>
                        {availableQualityLevels.find(q => q.id === selectedQuality)?.label || 'Auto'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionIconButton} onPress={cycleResizeMode}>
                      <Ionicons
                        name={resizeMode === ResizeMode.COVER ? "expand-outline" : "contract-outline"}
                        size={20}
                        color={resizeMode !== ResizeMode.CONTAIN ? COLORS.primary : "#fff"}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionIconButton}
                      onPress={() => setAutoNext(!autoNext)}
                    >
                      <Ionicons
                        name="repeat"
                        size={20}
                        color={autoNext ? COLORS.primary : COLORS.textMuted}
                      />
                    </TouchableOpacity>

                    {/* Auto Rotate / Screen Orientation Toggle */}
                    <TouchableOpacity
                      style={styles.actionIconButton}
                      onPress={toggleOrientation}
                    >
                      <MaterialIcons
                        name={isWidescreen ? "screen-lock-portrait" : "screen-rotation"}
                        size={20}
                        color={isWidescreen ? COLORS.primary : "#fff"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Requirement: Floating Netflix/Crunchyroll-style Skip Intro Pill */}
            {showSkipIntro && (
              <TouchableOpacity
                style={[
                  styles.skipPillBtn,
                  {
                    bottom: showControls ? 160 : 60,
                    right: isWidescreen ? 40 : 20,
                  }
                ]}
                onPress={handleSkipIntro}
                activeOpacity={0.85}
              >
                <Ionicons name="sparkles" size={15} color="#ffd700" />
                <Text style={styles.skipPillText}>Skip Intro</Text>
                <Ionicons name="play-forward" size={15} color="#fff" />
              </TouchableOpacity>
            )}

            {/* Requirement: Netflix-style Floating Undo Skip Toast */}
            {undoSkipVisible && (
              <View
                pointerEvents="box-none"
                style={[
                  styles.undoToastContainer,
                  {
                    bottom: showControls ? 160 : 60,
                  }
                ]}
              >
                <View style={styles.undoToastCard}>
                  <Ionicons name="play-skip-forward" size={16} color={COLORS.primary} />
                  <Text style={styles.undoToastText} numberOfLines={1}>
                    Skipped Intro
                  </Text>
                  <TouchableOpacity
                    style={styles.undoToastBtn}
                    onPress={handleUndoSkip}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-undo" size={13} color="#fff" />
                    <Text style={styles.undoToastBtnText}>Undo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.undoDismissBtn}
                    onPress={() => setUndoSkipVisible(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Requirement: Interactive Outro Auto-Next Countdown Card */}
            {showOutroCard && hasNext && !outroDismissedRef.current && (
              <View
                style={[
                  styles.outroCardContainer,
                  {
                    bottom: showControls ? 160 : 60,
                    right: isWidescreen ? 40 : 20,
                  }
                ]}
              >
                <View style={styles.outroCard}>
                  <View style={styles.outroHeaderRow}>
                    <View style={styles.outroCountdownBadge}>
                      <Ionicons name="timer-outline" size={14} color="#d8b4fe" />
                      <Text style={styles.outroCountdownText}>
                        {autoSkipOutro && outroCountdown !== null
                          ? `Next Episode in ${outroCountdown}s`
                          : 'Up Next'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleCancelOutro}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.outroNextEpText} numberOfLines={1}>
                    {nextEp ? `EP ${nextEp.episodeNumber}: ${nextEp.title || 'Next Episode'}` : 'Next Episode'}
                  </Text>

                  {autoSkipOutro && outroCountdown !== null && (
                    <View style={styles.outroProgressBar}>
                      <View
                        style={[
                          styles.outroProgressFill,
                          { width: `${Math.max(0, Math.min(100, ((5 - outroCountdown) / 5) * 100))}%` }
                        ]}
                      />
                    </View>
                  )}

                  <View style={styles.outroButtonsRow}>
                    <TouchableOpacity
                      style={styles.outroPlayNowBtn}
                      onPress={playNextEpisode}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.outroPlayNowText}>Play Now</Text>
                      <Ionicons name="play-forward" size={14} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.outroCancelBtn}
                      onPress={handleCancelOutro}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.outroCancelText}>Watch Credits</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Requirement: Floating Skip Outro Pill when on final episode */}
            {showSkipOutro && !hasNext && (
              <TouchableOpacity
                style={[
                  styles.skipPillBtn,
                  {
                    bottom: showControls ? 160 : 60,
                    right: isWidescreen ? 40 : 20,
                  }
                ]}
                onPress={handleSkipOutro}
                activeOpacity={0.85}
              >
                <Text style={styles.skipPillText}>Skip Outro</Text>
                <Ionicons name="play-forward" size={16} color="#fff" />
              </TouchableOpacity>
            )}

            {/* ====== SETTINGS MODAL ====== */}
            <Modal
              visible={settingsVisible}
              animationType="fade"
              transparent={true}
              onRequestClose={() => setSettingsVisible(false)}
            >
              <TouchableWithoutFeedback onPress={() => setSettingsVisible(false)}>
                <View style={styles.modalBackdrop}>
                  <TouchableWithoutFeedback>
                    <View style={styles.settingsModalContent}>
                      <View style={styles.modalHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={styles.modalHeaderIconBadge}>
                            <Ionicons name="settings-sharp" size={16} color={COLORS.primary} />
                          </View>
                          <Text style={styles.modalTitle}>Playback & Stream Settings</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.modalCloseBtn}
                          onPress={() => setSettingsVisible(false)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>

                      <ScrollView 
                        style={{ maxHeight: isWidescreen ? 260 : 440 }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 16 }}
                      >
                        {/* 1. Video Quality Section (Exact Match to Main Site) */}
                        <View style={styles.settingsSectionCard}>
                          <View style={styles.settingsSectionHeader}>
                            <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                            <Text style={styles.settingsSectionTitle}>Video Quality</Text>
                            <View style={styles.sectionHeaderBadge}>
                              <Text style={styles.sectionHeaderBadgeText}>
                                {availableQualityLevels.find(q => q.id === selectedQuality)?.label || 'Auto'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.settingsSectionSub}>Adaptive multi-bitrate resolution matching main website</Text>
                          <View style={styles.qualityGrid}>
                            {availableQualityLevels.map((lvl) => {
                              const isSelected = selectedQuality === lvl.id;
                              return (
                                <TouchableOpacity
                                  key={lvl.id}
                                  style={[
                                    styles.qualityCard,
                                    isSelected && styles.qualityCardActive
                                  ]}
                                  onPress={() => selectQualityLevel(lvl)}
                                  activeOpacity={0.7}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Ionicons
                                      name={lvl.isAuto ? "flash" : "tv-outline"}
                                      size={13}
                                      color={isSelected ? COLORS.primary : COLORS.textMuted}
                                    />
                                    <Text style={[styles.qualityLabel, isSelected && styles.qualityLabelActive]}>
                                      {lvl.label}
                                    </Text>
                                  </View>
                                  {lvl.badge && (
                                    <View style={[
                                      styles.qualityBadgeBase,
                                      lvl.badgeClass === 'badge-auto' ? styles.qualityBadgeAuto :
                                      lvl.badgeClass === 'badge-fhd' ? styles.qualityBadgeFhd :
                                      lvl.badgeClass === 'badge-hd' ? styles.qualityBadgeHd :
                                      styles.qualityBadgeSd
                                    ]}>
                                      <Text style={[
                                        styles.qualityBadgeTextBase,
                                        lvl.badgeClass === 'badge-auto' ? styles.qualityBadgeTextAuto :
                                        lvl.badgeClass === 'badge-fhd' ? styles.qualityBadgeTextFhd :
                                        lvl.badgeClass === 'badge-hd' ? styles.qualityBadgeTextHd :
                                        styles.qualityBadgeTextSd
                                      ]}>
                                        {lvl.badge}
                                      </Text>
                                    </View>
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>

                        {/* 2. Playback Speed */}
                        <View style={styles.settingsSectionCard}>
                          <View style={styles.settingsSectionHeader}>
                            <Ionicons name="speedometer-outline" size={16} color={COLORS.primary} />
                            <Text style={styles.settingsSectionTitle}>Playback Speed</Text>
                          </View>
                          <View style={styles.optionsRow}>
                            {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                              <TouchableOpacity
                                key={speed}
                                style={[
                                  styles.chipOption,
                                  playbackRate === speed && styles.chipOptionActive
                                ]}
                                onPress={() => changeSpeed(speed)}
                              >
                                <Text style={[
                                  styles.chipText,
                                  playbackRate === speed && styles.chipTextActive
                                ]}>
                                  {speed === 1.0 ? 'Normal (1.0x)' : `${speed}x`}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        {/* 3. Audio & Dubbing */}
                        <View style={styles.settingsSectionCard}>
                          <View style={styles.settingsSectionHeader}>
                            <Ionicons name="headset-outline" size={16} color={COLORS.primary} />
                            <Text style={styles.settingsSectionTitle}>Audio & Dubbing</Text>
                          </View>
                          <View style={styles.optionsRow}>
                            {availableAudioTracks.length > 0 ? (
                              availableAudioTracks.map((track, idx) => (
                                <TouchableOpacity
                                  key={idx}
                                  style={[
                                    styles.chipOption,
                                    selectedAudioTrackIndex === idx && styles.chipOptionActive,
                                    { flexDirection: 'row', alignItems: 'center', gap: 6 }
                                  ]}
                                  onPress={() => selectAudioTrack(idx)}
                                >
                                  <Ionicons
                                    name="volume-medium-outline"
                                    size={13}
                                    color={selectedAudioTrackIndex === idx ? '#fff' : COLORS.textMuted}
                                  />
                                  <Text style={[
                                    styles.chipText,
                                    selectedAudioTrackIndex === idx && styles.chipTextActive
                                  ]}>
                                    {track.displayName}
                                  </Text>
                                </TouchableOpacity>
                              ))
                            ) : (
                              <TouchableOpacity style={[styles.chipOption, styles.chipOptionActive]}>
                                <Text style={[styles.chipText, styles.chipTextActive]}>Default Audio</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>

                        {/* 4. Subtitles & Closed Captions */}
                        <View style={styles.settingsSectionCard}>
                          <View style={styles.settingsSectionHeader}>
                            <Ionicons name="chatbox-ellipses-outline" size={16} color={COLORS.primary} />
                            <Text style={styles.settingsSectionTitle}>Subtitles & Captions</Text>
                          </View>
                          <View style={styles.optionsRow}>
                            <TouchableOpacity
                              style={[
                                styles.chipOption,
                                selectedSubtitleIndex === -1 && styles.chipOptionActive
                              ]}
                              onPress={() => selectSubtitleTrack(-1)}
                            >
                              <Text style={[
                                styles.chipText,
                                selectedSubtitleIndex === -1 && styles.chipTextActive
                              ]}>
                                Off
                              </Text>
                            </TouchableOpacity>

                            {availableSubtitleTracks.map((sub, idx) => (
                              <TouchableOpacity
                                key={idx}
                                style={[
                                  styles.chipOption,
                                  selectedSubtitleIndex === idx && styles.chipOptionActive
                                ]}
                                onPress={() => selectSubtitleTrack(idx)}
                              >
                                <Text style={[
                                  styles.chipText,
                                  selectedSubtitleIndex === idx && styles.chipTextActive
                                ]}>
                                  {sub.displayName}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>

                          {/* Subtitle Appearance Settings */}
                          <Text style={[styles.subSectionTitle, { marginTop: 12 }]}>Subtitle Size</Text>
                          <View style={styles.optionsRow}>
                            {[
                              { key: 'small', label: 'Small (16px)' },
                              { key: 'medium', label: 'Normal (20px)' },
                              { key: 'large', label: 'Large (25px)' },
                              { key: 'huge', label: 'Huge (30px)' },
                            ].map(opt => (
                              <TouchableOpacity
                                key={opt.key}
                                style={[
                                  styles.chipOption,
                                  subSettings.size === opt.key && styles.chipOptionActive
                                ]}
                                onPress={() => handleUpdateSubSettings({ size: opt.key })}
                              >
                                <Text style={[
                                  styles.chipText,
                                  subSettings.size === opt.key && styles.chipTextActive
                                ]}>
                                  {opt.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>

                          <Text style={[styles.subSectionTitle, { marginTop: 10 }]}>Subtitle Text Color</Text>
                          <View style={styles.optionsRow}>
                            {[
                              { color: '#ffffff', label: 'White' },
                              { color: '#FFE600', label: 'Yellow' },
                              { color: '#00f0ff', label: 'Cyan' },
                              { color: '#55ff55', label: 'Green' },
                            ].map(opt => (
                              <TouchableOpacity
                                key={opt.color}
                                style={[
                                  styles.chipOption,
                                  subSettings.color === opt.color && styles.chipOptionActive,
                                  { flexDirection: 'row', alignItems: 'center', gap: 6 }
                                ]}
                                onPress={() => handleUpdateSubSettings({ color: opt.color })}
                              >
                                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: opt.color }} />
                                <Text style={[
                                  styles.chipText,
                                  subSettings.color === opt.color && styles.chipTextActive
                                ]}>
                                  {opt.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>

                          <Text style={[styles.subSectionTitle, { marginTop: 10 }]}>Backdrop & Shadow Style</Text>
                          <View style={styles.optionsRow}>
                            {[
                              { key: 'shadow', label: 'Cinematic Shadow' },
                              { key: 'box', label: 'Translucent Box' },
                              { key: 'solid', label: 'Solid Box' },
                            ].map(opt => (
                              <TouchableOpacity
                                key={opt.key}
                                style={[
                                  styles.chipOption,
                                  subSettings.style === opt.key && styles.chipOptionActive
                                ]}
                                onPress={() => handleUpdateSubSettings({ style: opt.key })}
                              >
                                <Text style={[
                                  styles.chipText,
                                  subSettings.style === opt.key && styles.chipTextActive
                                ]}>
                                  {opt.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>

                          {/* Live Subtitle Preview */}
                          <View style={styles.subPreviewBox}>
                            <Text
                              style={[
                                styles.subPreviewText,
                                {
                                  fontSize:
                                    subSettings.size === 'small' ? 14 :
                                    subSettings.size === 'large' ? 20 :
                                    subSettings.size === 'huge' ? 24 : 17,
                                  color: subSettings.color || '#ffffff',
                                  textShadowColor: 'rgba(0, 0, 0, 0.95)',
                                  textShadowOffset: { width: 1.5, height: 1.5 },
                                  textShadowRadius: 3.5,
                                  backgroundColor:
                                    subSettings.style === 'shadow'
                                      ? 'transparent'
                                      : subSettings.style === 'solid'
                                      ? 'rgba(10, 10, 15, 0.95)'
                                      : 'rgba(0, 0, 0, 0.75)',
                                  borderWidth: subSettings.style === 'solid' ? 1 : 0,
                                  borderColor: 'rgba(255, 255, 255, 0.25)',
                                  paddingHorizontal: subSettings.style === 'shadow' ? 6 : 12,
                                  paddingVertical: subSettings.style === 'shadow' ? 2 : 4,
                                  borderRadius: 6,
                                }
                              ]}
                            >
                              Preview: Hurry up! Guard the sea gate!
                            </Text>
                          </View>
                        </View>

                        {/* 5. Screen Fit & Aspect Ratio */}
                        <View style={styles.settingsSectionCard}>
                          <View style={styles.settingsSectionHeader}>
                            <Ionicons name="expand-outline" size={16} color={COLORS.primary} />
                            <Text style={styles.settingsSectionTitle}>Screen Fit & Aspect Ratio</Text>
                          </View>
                          <View style={styles.optionsRow}>
                            {[
                              { label: 'Fit (Contain)', mode: ResizeMode.CONTAIN },
                              { label: 'Fill (Cover)', mode: ResizeMode.COVER },
                              { label: 'Stretch', mode: ResizeMode.STRETCH }
                            ].map(item => (
                              <TouchableOpacity
                                key={item.label}
                                style={[
                                  styles.chipOption,
                                  resizeMode === item.mode && styles.chipOptionActive
                                ]}
                                onPress={() => setResizeMode(item.mode)}
                              >
                                <Text style={[
                                  styles.chipText,
                                  resizeMode === item.mode && styles.chipTextActive
                                ]}>
                                  {item.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        {/* 6. Streaming Network Route (NO RAW IP EXPOSED) */}
                        <View style={styles.settingsSectionCard}>
                          <View style={styles.settingsSectionHeader}>
                            <Ionicons name="server-outline" size={16} color={COLORS.primary} />
                            <Text style={styles.settingsSectionTitle}>Streaming Network Route</Text>
                          </View>
                          <Text style={styles.settingsSectionSub}>Encrypted high-performance cloud CDN & edge network</Text>
                          <View style={{ gap: 8, marginTop: 4 }}>
                            {PRESET_SERVERS.map(srv => {
                              const isActive = currentServerUrl === srv.url;
                              return (
                                <TouchableOpacity
                                  key={srv.id}
                                  style={[
                                    styles.serverOptionCard,
                                    isActive && styles.serverOptionCardActive
                                  ]}
                                  onPress={() => handleSwitchServer(srv.url)}
                                  disabled={serverSwitching}
                                  activeOpacity={0.7}
                                >
                                  <View style={{ flex: 1, paddingRight: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                      <Text style={[
                                        styles.serverOptionName,
                                        isActive && styles.serverOptionNameActive
                                      ]}>
                                        {srv.name}
                                      </Text>
                                      <View style={[styles.serverBadge, isActive && styles.serverBadgeActive]}>
                                        <Text style={styles.serverBadgeText}>{srv.tag}</Text>
                                      </View>
                                    </View>
                                    <Text style={styles.serverOptionDesc} numberOfLines={1}>
                                      {srv.description}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                                      <Ionicons name="shield-checkmark" size={11} color={COLORS.success} />
                                      <Text style={{ color: '#00e699', fontSize: 10, fontWeight: '700' }}>
                                        Secure Verified Stream Link
                                      </Text>
                                    </View>
                                  </View>
                                  {serverSwitching && isActive ? (
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                  ) : isActive ? (
                                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                                  ) : (
                                    <Ionicons name="radio-button-off" size={18} color={COLORS.textMuted} />
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>

                        {/* 7. Smart Anime Auto-Skip */}
                        <View style={styles.settingsSectionCard}>
                          <View style={styles.settingsSectionHeader}>
                            <Ionicons name="flash-outline" size={16} color={COLORS.primary} />
                            <Text style={styles.settingsSectionTitle}>Smart Anime Auto-Skip</Text>
                          </View>

                          <View style={styles.switchRow}>
                            <Text style={styles.settingLabelText}>Auto Play Next Episode</Text>
                            <Switch
                              value={autoNext}
                              onValueChange={setAutoNext}
                              trackColor={{ false: '#333', true: COLORS.primary }}
                              thumbColor="#fff"
                            />
                          </View>

                          <View style={styles.switchRow}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                              <Text style={styles.settingLabelText}>Auto-Skip Opening (Intro)</Text>
                              <Text style={styles.settingSubLabel}>Fast-forwards anime OP themes</Text>
                            </View>
                            <Switch
                              value={autoSkipIntro}
                              onValueChange={handleToggleAutoSkip}
                              trackColor={{ false: '#333', true: COLORS.primary }}
                              thumbColor="#fff"
                            />
                          </View>

                          <View style={styles.switchRow}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                              <Text style={styles.settingLabelText}>Auto-Skip Outro & Countdown</Text>
                              <Text style={styles.settingSubLabel}>Displays 5s next-episode countdown when ending begins</Text>
                            </View>
                            <Switch
                              value={autoSkipOutro}
                              onValueChange={handleToggleAutoSkipOutro}
                              trackColor={{ false: '#333', true: COLORS.primary }}
                              thumbColor="#fff"
                            />
                          </View>

                          <Text style={[styles.subSectionTitle, { marginTop: 10 }]}>Intro Skip Duration</Text>
                          <View style={styles.optionsRow}>
                            {[
                              { id: 'auto', label: 'Smart Auto' },
                              { id: '60', label: '60s' },
                              { id: '75', label: '75s' },
                              { id: '85', label: '85s' },
                              { id: '90', label: '90s (TV)' },
                            ].map(opt => (
                              <TouchableOpacity
                                key={opt.id}
                                style={[
                                  styles.chipOption,
                                  skipDurationPref === opt.id && styles.chipOptionActive
                                ]}
                                onPress={() => handleSelectSkipDuration(opt.id)}
                              >
                                <Text style={[
                                  styles.chipText,
                                  skipDurationPref === opt.id && styles.chipTextActive
                                ]}>
                                  {opt.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>

                          {/* Smart Detection Live Status Card */}
                          <View style={styles.detectionCard}>
                            <View style={styles.detectionCardHeader}>
                              <Ionicons name="sparkles" size={14} color="#38ef7d" />
                              <Text style={styles.detectionCardTitle}>Smart Auto-Detection Engine</Text>
                            </View>
                            {skipWindows.intro && (
                              <View style={styles.detectionDetailRow}>
                                <Text style={styles.detectionLabel}>Opening (OP):</Text>
                                <Text style={styles.detectionVal}>
                                  {formatTime(skipWindows.intro.start, durationMillis)} - {formatTime(skipWindows.intro.end, durationMillis)} ({skipWindows.introSource})
                                </Text>
                              </View>
                            )}
                            {skipWindows.outro && (
                              <View style={styles.detectionDetailRow}>
                                <Text style={styles.detectionLabel}>Ending (ED):</Text>
                                <Text style={styles.detectionVal}>
                                  {formatTime(skipWindows.outro.start, durationMillis)} - {formatTime(skipWindows.outro.end, durationMillis)} ({skipWindows.outroSource})
                                </Text>
                              </View>
                            )}
                            {!skipWindows.intro && !skipWindows.outro && (
                              <Text style={styles.detectionInactiveText}>Standard 90s television timing active</Text>
                            )}
                          </View>
                        </View>
                      </ScrollView>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>

            {/* ====== EPISODES DRAWER MODAL ====== */}
            <Modal
              visible={episodesVisible}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setEpisodesVisible(false)}
            >
              <TouchableWithoutFeedback onPress={() => setEpisodesVisible(false)}>
                <View style={styles.modalBackdrop}>
                  <TouchableWithoutFeedback>
                    <View style={[styles.episodesModalContent, isWidescreen && { height: windowHeight * 0.85 }]}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Episode ({episodesList.length})</Text>
                        <TouchableOpacity onPress={() => setEpisodesVisible(false)}>
                          <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                      </View>

                      <ScrollView style={styles.episodesScroll}>
                        {episodesList.map((ep) => {
                          const isActive = episode?.id === ep.id || episode?.episodeNumber === ep.episodeNumber;
                          return (
                            <TouchableOpacity
                              key={ep.id || ep.episodeNumber}
                              style={[styles.drawerEpCard, isActive && styles.drawerEpCardActive]}
                              onPress={() => {
                                setEpisode(ep);
                                setEpisodesVisible(false);
                              }}
                            >
                              <View style={[styles.drawerEpBadge, isActive && styles.drawerEpBadgeActive]}>
                                <Text style={[styles.drawerEpBadgeText, isActive && styles.drawerEpBadgeTextActive]}>
                                  EP {ep.episodeNumber}
                                </Text>
                              </View>
                              <View style={styles.drawerEpInfo}>
                                <Text style={[styles.drawerEpTitle, isActive && styles.drawerEpTitleActive]} numberOfLines={1}>
                                  {ep.title}
                                </Text>
                                <Text style={styles.drawerEpDur}>{ep.duration || '24m'}</Text>
                              </View>
                              {isActive ? (
                                <Ionicons name="volume-high" size={20} color={COLORS.primary} />
                              ) : (
                                <Ionicons name="play" size={16} color={COLORS.textMuted} />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>

          </View>
        )}
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  playerWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 85,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 15,
  },
  captionText: {
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  /* Gesture HUD Overlay */
  hudOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25,
  },
  hudBox: {
    backgroundColor: 'rgba(15, 15, 25, 0.88)',
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    minWidth: 100,
  },
  hudBarTrack: {
    width: 8,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  hudBarFill: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  hudText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  hudLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'ios' ? 44 : 20,
    paddingHorizontal: 18,
    zIndex: 10,
  },
  overlayLandscape: {
    paddingHorizontal: 36,
    paddingVertical: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 20,
    elevation: 20,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    flex: 1,
  },
  showTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  epTitle: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    zIndex: 20,
    elevation: 20,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallControlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.35,
  },
  playPauseBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  bottomBar: {
    gap: 8,
    zIndex: 20,
    elevation: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 44,
    textAlign: 'center',
  },
  progressBarContainer: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    position: 'relative',
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressKnob: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ffffff',
    marginLeft: -7,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 14,
  },
  actionIconButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  /* Error Overlay */
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
    zIndex: 20,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  errorDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 10,
  },
  retryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Modal Backdrop & Shared Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  settingsModalContent: {
    backgroundColor: '#12121c',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  episodesModalContent: {
    backgroundColor: '#12121c',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '65%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  settingLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  chipOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  episodesScroll: {
    flex: 1,
    marginTop: 8,
  },
  drawerEpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  drawerEpCardActive: {
    backgroundColor: 'rgba(255, 0, 85, 0.12)',
    borderColor: COLORS.primary,
  },
  drawerEpBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  drawerEpBadgeActive: {
    backgroundColor: COLORS.primary,
  },
  drawerEpBadgeText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  drawerEpBadgeTextActive: {
    color: '#fff',
  },
  drawerEpInfo: {
    flex: 1,
  },
  drawerEpTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  drawerEpTitleActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  drawerEpDur: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  authLockContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#05050c',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 24,
  },
  authLockCard: {
    backgroundColor: 'rgba(20, 20, 36, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  authLockBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  authLockTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  authLockDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  authLockBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 10,
  },
  authLockBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  authLockBackBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  authLockBackText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  subPreviewBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  subPreviewText: {
    textAlign: 'center',
    fontWeight: '700',
  },
  serverOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  serverOptionCardActive: {
    backgroundColor: 'rgba(255, 0, 85, 0.12)',
    borderColor: COLORS.primary,
  },
  serverOptionName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  serverOptionNameActive: {
    color: COLORS.primary,
  },
  serverOptionDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  serverBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  serverBadgeActive: {
    backgroundColor: COLORS.primary,
  },
  serverBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  settingSubLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  /* Double Tap HUD Indicator */
  doubleTapHudContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '38%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 22,
  },
  doubleTapHudLeft: {
    left: 0,
    borderTopRightRadius: 100,
    borderBottomRightRadius: 100,
    backgroundColor: 'rgba(255, 0, 85, 0.12)',
  },
  doubleTapHudRight: {
    right: 0,
    borderTopLeftRadius: 100,
    borderBottomLeftRadius: 100,
    backgroundColor: 'rgba(255, 0, 85, 0.12)',
  },
  doubleTapRippleCircle: {
    backgroundColor: 'rgba(15, 15, 25, 0.88)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  doubleTapHudText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  /* Precise Skip Intro / Outro Pill Button */
  skipPillBtn: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(18, 18, 28, 0.94)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    elevation: 35,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    zIndex: 99,
  },
  skipPillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  /* Timeline Chapter Highlights & Scrubbing HUD */
  timelineZoneMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 2,
    zIndex: 1,
  },
  introZoneMarker: {
    backgroundColor: 'rgba(255, 45, 85, 0.55)',
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#ff2d55',
  },
  outroZoneMarker: {
    backgroundColor: 'rgba(168, 85, 247, 0.55)',
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#a855f7',
  },
  timelineNotch: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 2,
  },
  scrubChapterTooltip: {
    position: 'absolute',
    bottom: 26,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 15, 25, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    elevation: 6,
    minWidth: 90,
    alignItems: 'center',
  },
  scrubChapterTooltipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  /* Undo Skip Intro Floating Toast */
  undoToastContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  undoToastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 32, 0.96)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    elevation: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    gap: 12,
  },
  undoToastText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  undoToastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  undoToastBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  undoDismissBtn: {
    padding: 4,
  },

  /* Outro Auto-Next Countdown Card */
  outroCardContainer: {
    position: 'absolute',
    zIndex: 99,
    elevation: 35,
    maxWidth: 360,
    width: '88%',
  },
  outroCard: {
    backgroundColor: 'rgba(16, 16, 28, 0.96)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.5)',
    elevation: 35,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    gap: 10,
  },
  outroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  outroCountdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
  },
  outroCountdownText: {
    color: '#d8b4fe',
    fontSize: 12,
    fontWeight: '800',
  },
  outroNextEpText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  outroProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  outroProgressFill: {
    height: '100%',
    backgroundColor: '#a855f7',
    borderRadius: 2,
  },
  outroButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  outroPlayNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 12,
  },
  outroPlayNowText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  outroCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  outroCancelText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },

  /* Detection Card in Settings Modal */
  detectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 14,
    gap: 6,
  },
  detectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  detectionCardTitle: {
    color: '#38ef7d',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  detectionDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  detectionVal: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  modalHeaderIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 0, 85, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsSectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 12,
  },
  settingsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  settingsSectionTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  settingsSectionSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 10,
  },
  sectionHeaderBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255, 0, 85, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 85, 0.25)',
  },
  sectionHeaderBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  subSectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 8,
    marginBottom: 4,
  },
  settingLabelText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  detectionInactiveText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },

  /* Quality Section Styles Matching Main Site */
  qualityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  qualityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    minWidth: '47%',
    flex: 1,
  },
  qualityCardActive: {
    backgroundColor: 'rgba(255, 0, 85, 0.12)',
    borderColor: COLORS.primary,
  },
  qualityLabel: {
    color: '#ddd',
    fontSize: 12,
    fontWeight: '700',
  },
  qualityLabelActive: {
    color: '#fff',
    fontWeight: '800',
  },
  qualityBadgeBase: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  qualityBadgeAuto: {
    backgroundColor: 'rgba(0, 230, 153, 0.18)',
    borderColor: 'rgba(0, 230, 153, 0.35)',
  },
  qualityBadgeFhd: {
    backgroundColor: 'rgba(255, 0, 85, 0.2)',
    borderColor: 'rgba(255, 0, 85, 0.5)',
  },
  qualityBadgeHd: {
    backgroundColor: 'rgba(0, 180, 216, 0.2)',
    borderColor: 'rgba(0, 180, 216, 0.4)',
  },
  qualityBadgeSd: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  qualityBadgeTextBase: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  qualityBadgeTextAuto: {
    color: '#00e699',
  },
  qualityBadgeTextFhd: {
    color: '#ff3377',
  },
  qualityBadgeTextHd: {
    color: '#00b4d8',
  },
  qualityBadgeTextSd: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
