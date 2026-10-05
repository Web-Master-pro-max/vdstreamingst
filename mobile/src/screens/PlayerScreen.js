import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import { COLORS } from '../theme/colors';
import { apiService, formatMediaUrl, recordWatchHistory } from '../services/api';

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

// Sanitize HLS playlist and parse audio/subtitle tracks
const processHlsManifest = async (url, selectedAudioIndex = 0) => {
  const result = {
    sanitizedUrl: url,
    audioTracks: [],
    subtitleTracks: [],
  };
  if (!url || typeof url !== 'string' || !url.includes('.m3u8') || url.startsWith('file://')) {
    return result;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) return result;

    const rawText = await response.text();
    const trimmed = rawText.trim();
    if (!trimmed.includes('#EXTM3U')) return result;

    const lastSlashIndex = url.lastIndexOf('/');
    const baseUrl = lastSlashIndex !== -1 ? url.substring(0, lastSlashIndex + 1) : url;

    // Parse audio and subtitle tracks
    const lines = trimmed.split('\n');
    let audioCounter = 0;
    lines.forEach((line) => {
      const l = line.trim();
      if (l.startsWith('#EXT-X-MEDIA:TYPE=AUDIO')) {
        const nameMatch = l.match(/NAME="([^"]+)"/);
        const langMatch = l.match(/LANGUAGE="([^"]+)"/);
        const uriMatch = l.match(/URI="([^"]+)"/);
        if (uriMatch) {
          const lang = langMatch ? langMatch[1] : '';
          const name = nameMatch ? nameMatch[1] : `Audio ${audioCounter + 1}`;
          const fullUri = uriMatch[1].startsWith('http') ? uriMatch[1] : baseUrl + uriMatch[1];
          result.audioTracks.push({
            name,
            language: lang,
            displayName: getFriendlyLanguageName(lang) || name,
            uri: fullUri,
            index: audioCounter,
          });
          audioCounter++;
        }
      } else if (l.startsWith('#EXT-X-MEDIA:TYPE=SUBTITLES')) {
        const nameMatch = l.match(/NAME="([^"]+)"/);
        const langMatch = l.match(/LANGUAGE="([^"]+)"/);
        const uriMatch = l.match(/URI="([^"]+)"/);
        if (uriMatch) {
          const lang = langMatch ? langMatch[1] : '';
          const name = nameMatch ? nameMatch[1] : 'Subtitle';
          const fullUri = uriMatch[1].startsWith('http') ? uriMatch[1] : baseUrl + uriMatch[1];
          result.subtitleTracks.push({
            name,
            language: lang,
            displayName: getFriendlyLanguageName(lang) || name,
            uri: fullUri,
          });
        }
      }
    });

    // Build a sanitized master playlist for ExoPlayer:
    // 1. Exclude TYPE=SUBTITLES because it points to raw .vtt files which crash ExoPlayer's HlsPlaylistParser
    // 2. Remove SUBTITLES="subs" attribute from #EXT-X-STREAM-INF
    // 3. Mark selectedAudioIndex as DEFAULT=YES, AUTOSELECT=YES
    // 4. Resolve relative audio and video variant paths to full S3 URLs
    let audioIdx = 0;
    const cleanLines = ['#EXTM3U'];

    lines.forEach((line) => {
      const l = line.trim();
      if (!l || l.startsWith('#EXTM3U')) return;

      if (l.startsWith('#EXT-X-MEDIA:TYPE=SUBTITLES')) {
        return; // Exclude to prevent ExoPlayer ParserException
      }

      if (l.startsWith('#EXT-X-MEDIA:TYPE=AUDIO')) {
        const isSelected = audioIdx === selectedAudioIndex;
        audioIdx++;
        let modified = l
          .replace(/DEFAULT=(YES|NO)/, `DEFAULT=${isSelected ? 'YES' : 'NO'}`)
          .replace(/AUTOSELECT=(YES|NO)/, `AUTOSELECT=${isSelected ? 'YES' : 'NO'}`)
          .replace(/URI="([^"]+)"/, (m, p1) => {
            const full = p1.startsWith('http') ? p1 : baseUrl + p1;
            return `URI="${full}"`;
          });
        cleanLines.push(modified);
        return;
      }

      if (l.startsWith('#EXT-X-STREAM-INF:')) {
        const modified = l.replace(/,SUBTITLES="[^"]+"/, '');
        cleanLines.push(modified);
        return;
      }

      if (!l.startsWith('#')) {
        const full = l.startsWith('http') ? l : baseUrl + l;
        cleanLines.push(full);
        return;
      }

      cleanLines.push(l);
    });

    const fixedText = cleanLines.join('\n');
    const cacheFileName = `clean_stream_${Date.now()}_${selectedAudioIndex}.m3u8`;
    const cachePath = `${FileSystem.cacheDirectory}${cacheFileName}`;
    await FileSystem.writeAsStringAsync(cachePath, fixedText);

    result.sanitizedUrl = cachePath;
    return result;
  } catch (err) {
    console.warn('Error processing HLS manifest:', err);
    return result;
  }
};

export const PlayerScreen = ({ route, navigation }) => {
  const { episodeId, episode: initialEpisode, show: initialShow, initialPositionMillis = 0 } = route.params || {};

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
  const [playbackError, setPlaybackError] = useState(false);

  // Brightness (Dimming Overlay) & Volume State
  const [brightness, setBrightness] = useState(1.0); // 0.1 to 1.0
  const [volume, setVolume] = useState(1.0); // 0.0 to 1.0
  const [gestureHud, setGestureHud] = useState({ visible: false, type: null, value: 1.0 });

  const brightnessRef = useRef(1.0);
  const volumeRef = useRef(1.0);
  const activeGestureType = useRef(null);
  const initialGestureValue = useRef(1.0);
  const gestureHudTimeout = useRef(null);
  const hasAppliedInitialSeek = useRef(false);
  const lastSavedHistoryTime = useRef(0);

  // Tracks & Captions State
  const [availableAudioTracks, setAvailableAudioTracks] = useState([]);
  const [selectedAudioTrackIndex, setSelectedAudioTrackIndex] = useState(0);
  const [availableSubtitleTracks, setAvailableSubtitleTracks] = useState([]);
  const [selectedSubtitleIndex, setSelectedSubtitleIndex] = useState(-1); // -1 = Off
  const [subCues, setSubCues] = useState([]);
  const [activeCaptionText, setActiveCaptionText] = useState('');

  // Playback Stats
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
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
    const p = posOverride !== undefined ? posOverride : positionMillis;
    const d = durOverride !== undefined ? durOverride : durationMillis;
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

  const hasMoved = useRef(false);

  // Gesture PanResponder: Left = Brightness, Right = Volume, Tap = Toggle Controls
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4;
      },
      onPanResponderGrant: (evt) => {
        hasMoved.current = false;
        const touchX = evt.nativeEvent.pageX ?? evt.nativeEvent.locationX ?? (windowWidth * 0.5);
        const isRight = touchX >= (windowWidth * 0.5);
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
            const nextVal = Math.max(0.1, Math.min(1.0, initialGestureValue.current + delta));
            setBrightness(nextVal);
            brightnessRef.current = nextVal;
            showHud('brightness', nextVal);
          } else if (activeGestureType.current === 'volume') {
            const nextVal = Math.max(0.0, Math.min(1.0, initialGestureValue.current + delta));
            setVolume(nextVal);
            volumeRef.current = nextVal;
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
          toggleControls();
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

  // Auto-Rotate & Orientation Management: Auto-rotates into fullscreen landscape on play
  useEffect(() => {
    let isMounted = true;

    // Immediately rotate and lock to landscape fullscreen when opening player
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    setIsLandscape(true);
    hideSystemUI();

    let navBarListener = null;
    if (Platform.OS === 'android') {
      try {
        navBarListener = NavigationBar.addVisibilityListener(({ visibility }) => {
          if (visibility === 'visible' && isMounted) {
            // Keep immersive: re-hide transient bars after user edge-swipe
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
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
      hideSystemUI();
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

  const isWidescreen = isLandscape || windowWidth > windowHeight;

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
  const loadStreamUrl = async (targetUrl, audioIdx = 0) => {
    setPlaybackError(false);
    setSelectedSubtitleIndex(-1);
    setSubCues([]);
    setActiveCaptionText('');

    const formatted = formatMediaUrl(targetUrl);
    const result = await processHlsManifest(formatted, audioIdx);

    setActiveStreamUrl(result.sanitizedUrl);
    setAvailableAudioTracks(result.audioTracks);
    setSelectedAudioTrackIndex(audioIdx);
    setAvailableSubtitleTracks(result.subtitleTracks);
  };

  // Sync active stream URL when episode updates
  useEffect(() => {
    let isMounted = true;
    if (episode) {
      const rawUrl = episode?.masterPlaylistUrl || episode?.videoUrl || episode?.streamUrl || SAMPLE_STREAM;
      const formatted = formatMediaUrl(rawUrl);
      setPlaybackError(false);
      hasAppliedInitialSeek.current = false;
      setSelectedSubtitleIndex(-1);
      setSubCues([]);
      setActiveCaptionText('');

      processHlsManifest(formatted).then((result) => {
        if (isMounted) {
          setActiveStreamUrl(result.sanitizedUrl);
          setAvailableAudioTracks(result.audioTracks);
          setSelectedAudioTrackIndex(0);
          setAvailableSubtitleTracks(result.subtitleTracks);
        }
      }).catch(err => {
        console.warn('Playlist prep error:', err);
        if (isMounted) setActiveStreamUrl(formatted);
      });
    }
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

      if (status.didJustFinish && !status.isLooping) {
        saveCurrentProgress();
        if (autoNext && episodesList.length > 0) {
          playNextEpisode();
        }
      }
    } else if (status.error) {
      console.warn('Playback error:', status.error);
      setPlaybackError(true);
    }
  };

  // Play / Pause
  const togglePlayPause = async () => {
    resetControlsTimeout();
    if (!videoRef.current) return;
    if (isPlaying) {
      saveCurrentProgress();
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
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

  // Seek ±10s
  const skipForward = async () => {
    resetControlsTimeout();
    if (!videoRef.current) return;
    const newPos = Math.min(positionMillis + 10000, durationMillis);
    await videoRef.current.setPositionAsync(newPos);
  };

  const skipBackward = async () => {
    resetControlsTimeout();
    if (!videoRef.current) return;
    const newPos = Math.max(positionMillis - 10000, 0);
    await videoRef.current.setPositionAsync(newPos);
  };

  // Interactive Timeline Scrubber Handlers
  const updateScrubFromEvent = (evt) => {
    if (timelineWidth <= 0 || durationMillis <= 0) return;
    const touchX = evt.nativeEvent.locationX;
    const clampedX = Math.max(0, Math.min(touchX, timelineWidth));
    const ratio = clampedX / timelineWidth;
    const targetMillis = Math.floor(ratio * durationMillis);
    setScrubPositionMillis(targetMillis);
  };

  const handleTimelineTouchStart = (evt) => {
    resetControlsTimeout();
    setIsScrubbing(true);
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
    const touchX = evt.nativeEvent.locationX;
    const clampedX = Math.max(0, Math.min(touchX, timelineWidth));
    const ratio = clampedX / timelineWidth;
    const targetMillis = Math.floor(ratio * durationMillis);
    setPositionMillis(targetMillis);
    try {
      await videoRef.current.setPositionAsync(targetMillis);
    } catch (e) {
      console.warn('Seek error:', e);
    }
  };

  // Change Episode
  const playNextEpisode = () => {
    if (!episodesList || episodesList.length === 0) return;
    const currentIdx = episodesList.findIndex(e => e.id === episode?.id || e.episodeNumber === episode?.episodeNumber);
    if (currentIdx >= 0 && currentIdx < episodesList.length - 1) {
      saveCurrentProgress();
      const nextEp = episodesList[currentIdx + 1];
      setEpisode(nextEp);
    }
  };

  const playPrevEpisode = () => {
    if (!episodesList || episodesList.length === 0) return;
    const currentIdx = episodesList.findIndex(e => e.id === episode?.id || e.episodeNumber === episode?.episodeNumber);
    if (currentIdx > 0) {
      saveCurrentProgress();
      const prevEp = episodesList[currentIdx - 1];
      setEpisode(prevEp);
    }
  };

  // Playback Rate
  const changeSpeed = async (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      await videoRef.current.setRateAsync(rate, true);
    }
  };

  // Switch Audio Track
  const selectAudioTrack = async (index) => {
    if (index === selectedAudioTrackIndex) return;
    setSelectedAudioTrackIndex(index);
    resetControlsTimeout();

    const rawMaster = episode?.masterPlaylistUrl || episode?.videoUrl || episode?.streamUrl || SAMPLE_STREAM;
    const formatted = formatMediaUrl(rawMaster);
    const currentPos = positionMillis;
    const playing = isPlaying;

    try {
      const res = await processHlsManifest(formatted, index);
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

  return (
    <View style={styles.container}>
      <StatusBar
        hidden={isWidescreen}
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      {loading || !streamUrl ? (
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
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36',
                },
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
                if (streamUrl !== SAMPLE_STREAM) {
                  console.log('Server stream failed, falling back to sample stream');
                  setActiveStreamUrl(SAMPLE_STREAM);
                } else {
                  setPlaybackError(true);
                }
              }}
            />

            {/* In-Player Brightness Dimmer Overlay */}
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: '#000',
                  opacity: Math.max(0, Math.min(0.85, (1 - brightness) * 0.85)),
                  zIndex: 8,
                },
              ]}
            />

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

            {/* Subtitle / Closed Caption Overlay */}
            {activeCaptionText !== '' && (
              <View style={styles.captionOverlay}>
                <Text style={styles.captionText}>{activeCaptionText}</Text>
              </View>
            )}

            {/* Error Fallback Overlay */}
            {playbackError && (
              <View style={styles.errorOverlay}>
                <Ionicons name="alert-circle-outline" size={54} color={COLORS.primary} />
                <Text style={styles.errorTitle}>Stream Connection Error</Text>
                <Text style={styles.errorDesc}>Could not load video source from server.</Text>
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
              <View style={[styles.overlay, isWidescreen && styles.overlayLandscape]}>
                {/* Top Header Bar */}
                <View style={styles.topBar}>
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
                <View style={styles.centerControls}>
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
                <View style={styles.bottomBar}>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeText}>
                      {formatTime(isScrubbing ? scrubPositionMillis : positionMillis, durationMillis)}
                    </Text>

                    {/* Interactive Scrub Progress Bar */}
                    <View
                      style={styles.progressBarContainer}
                      onLayout={(e) => setTimelineWidth(e.nativeEvent.layout.width)}
                      onStartShouldSetResponder={() => true}
                      onMoveShouldSetResponder={() => true}
                      onResponderGrant={handleTimelineTouchStart}
                      onResponderMove={handleTimelineTouchMove}
                      onResponderRelease={handleTimelineTouchEnd}
                      onResponderTerminate={() => setIsScrubbing(false)}
                    >
                      <View style={styles.progressBarTrack}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: durationMillis > 0
                                ? `${Math.min(100, Math.max(0, ((isScrubbing ? scrubPositionMillis : positionMillis) / durationMillis) * 100))}%`
                                : '0%'
                            }
                          ]}
                        />
                      </View>

                      {/* Tactile Progress Knob */}
                      <View
                        style={[
                          styles.progressKnob,
                          {
                            left: durationMillis > 0
                              ? `${Math.min(100, Math.max(0, ((isScrubbing ? scrubPositionMillis : positionMillis) / durationMillis) * 100))}%`
                              : '0%',
                            transform: [{ scale: isScrubbing ? 1.35 : 1 }],
                          }
                        ]}
                      />
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
                        <Text style={styles.modalTitle}>Player Settings</Text>
                        <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                          <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                      </View>

                      <ScrollView style={{ maxHeight: isWidescreen ? 220 : 380 }}>
                        {/* Audio Language Tracks */}
                        <Text style={styles.settingLabel}>Audio Track</Text>
                        <View style={styles.optionsRow}>
                          {availableAudioTracks.length > 0 ? (
                            availableAudioTracks.map((track, idx) => (
                              <TouchableOpacity
                                key={idx}
                                style={[
                                  styles.chipOption,
                                  selectedAudioTrackIndex === idx && styles.chipOptionActive
                                ]}
                                onPress={() => selectAudioTrack(idx)}
                              >
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

                        {/* Subtitles / Closed Captions */}
                        <Text style={[styles.settingLabel, { marginTop: 14 }]}>Subtitles & Captions</Text>
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

                        {/* Speed Options */}
                        <Text style={[styles.settingLabel, { marginTop: 14 }]}>Playback Speed</Text>
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
                                {speed === 1.0 ? 'Normal' : `${speed}x`}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Screen Aspect Ratio */}
                        <Text style={[styles.settingLabel, { marginTop: 14 }]}>Aspect Ratio (Screen Fit)</Text>
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

                        {/* Auto Next Switch */}
                        <View style={styles.switchRow}>
                          <Text style={styles.settingLabel}>Auto Play Next Episode</Text>
                          <Switch
                            value={autoNext}
                            onValueChange={setAutoNext}
                            trackColor={{ false: '#333', true: COLORS.primary }}
                            thumbColor="#fff"
                          />
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
});
