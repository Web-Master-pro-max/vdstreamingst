import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY_API_URL = '@infinx_api_url';
export const DEFAULT_URL = Platform.OS === 'android' ? 'http://192.168.31.174:8000' : 'http://localhost:8000';

export const CANDIDATE_SERVERS = [
  'http://192.168.31.174:8000',
  'http://10.0.2.2:8000',
  'http://localhost:8000',
  'http://13.202.95.5:8000',
  'https://skirt-guided-dressing-fantastic.trycloudflare.com',
];

export const PRESET_SERVERS = [
  {
    id: 'server_wifi',
    name: 'Local Wi-Fi Network',
    url: 'http://192.168.31.174:8000',
    description: 'High-speed local development & streaming node',
    tag: 'LAN Server',
  },
  {
    id: 'server_emulator',
    name: 'Android Emulator',
    url: 'http://10.0.2.2:8000',
    description: 'Android Studio emulator loopback relay',
    tag: 'Emulator Node',
  },
  {
    id: 'server_cloud',
    name: 'Cloud Stream Network',
    url: 'http://13.202.95.5:8000',
    description: 'High-speed dedicated cloud delivery network',
    tag: 'Primary CDN',
  },
  {
    id: 'server_laptop',
    name: 'Edge Relay Tunnel',
    url: 'https://skirt-guided-dressing-fantastic.trycloudflare.com',
    description: 'Low-latency direct edge streaming relay node',
    tag: 'Edge Node',
  },
  {
    id: 'server_localhost',
    name: 'Localhost Node',
    url: 'http://localhost:8000',
    description: 'Direct local workstation development server',
    tag: 'Dev Node',
  },
];

let cachedApiUrl = null;

export const probeServerUrl = async (url, timeoutMs = 1500) => {
  if (!url) return false;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${url.replace(/\/$/, '')}/api/settings`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(id);
    return res.ok || res.status === 200 || res.status === 304;
  } catch (e) {
    return false;
  }
};

export const discoverWorkingServer = async () => {
  if (cachedApiUrl && (await probeServerUrl(cachedApiUrl, 1000))) {
    return cachedApiUrl;
  }

  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_API_URL);
    if (saved && (await probeServerUrl(saved, 1000))) {
      cachedApiUrl = saved;
      return saved;
    }
  } catch (e) {}

  const prioritized = Platform.OS === 'android'
    ? ['http://192.168.31.174:8000', 'http://10.0.2.2:8000', 'http://13.202.95.5:8000', 'https://skirt-guided-dressing-fantastic.trycloudflare.com', 'http://localhost:8000']
    : ['http://localhost:8000', 'http://192.168.31.174:8000', 'http://13.202.95.5:8000', 'https://skirt-guided-dressing-fantastic.trycloudflare.com', 'http://10.0.2.2:8000'];

  for (const candidate of prioritized) {
    const ok = await probeServerUrl(candidate, 1200);
    if (ok) {
      cachedApiUrl = candidate;
      AsyncStorage.setItem(STORAGE_KEY_API_URL, candidate).catch(() => {});
      return candidate;
    }
  }

  cachedApiUrl = prioritized[0];
  return cachedApiUrl;
};

export const getApiBaseUrl = async () => {
  if (cachedApiUrl) return cachedApiUrl;
  return await discoverWorkingServer();
};

export const setApiBaseUrl = async (newUrl) => {
  let formatted = newUrl.trim();
  if (formatted.endsWith('/')) {
    formatted = formatted.slice(0, -1);
  }
  cachedApiUrl = formatted;
  await AsyncStorage.setItem(STORAGE_KEY_API_URL, formatted);
  return formatted;
};

export const formatMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('file://')) {
    // Already absolute URL - do NOT run encodeURI as it breaks encoded query parameters like %3A, %2F
    return trimmed;
  }
  const baseUrl = (cachedApiUrl || DEFAULT_URL).replace(/\/$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  // Only replace unencoded spaces so paths with spaces resolve properly without corrupting percent-encoding
  return `${baseUrl}${cleanPath}`.replace(/ /g, '%20');
};

export const isVideoMedia = (url) => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.toLowerCase().split('?')[0];
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mkv') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.m3u8')
  );
};

export const getShowBannerMedia = (show) => {
  if (!show) return { bannerUrl: '', posterUrl: '', isVideo: false };
  const rawBanner = show.banner || show.bannerUrl;
  const rawPoster = show.poster || show.posterUrl;
  
  const isVideo = isVideoMedia(rawBanner);
  // When rawBanner is a video, posterTarget MUST be the image poster
  const posterTarget = isVideoMedia(rawPoster) ? (isVideoMedia(rawBanner) ? '' : rawBanner) : (rawPoster || rawBanner);
  const bannerTarget = rawBanner || rawPoster;

  return {
    bannerUrl: formatMediaUrl(bannerTarget),
    posterUrl: formatMediaUrl(posterTarget),
    isVideo,
  };
};

export const STORAGE_KEY_AUTH_USER = '@infinx_auth_user';
export const STORAGE_KEY_AUTH_TOKEN = '@infinx_auth_token';
export const STORAGE_KEY_WATCHLIST = '@infinx_watchlist';
export const STORAGE_KEY_HISTORY = '@infinx_history';

export const saveAuthSession = async (token, user) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_AUTH_TOKEN, token);
    await AsyncStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
  } catch (e) {
    console.error('Error saving auth session:', e);
  }
};

export const getAuthSession = async () => {
  try {
    const [token, userStr] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_AUTH_TOKEN),
      AsyncStorage.getItem(STORAGE_KEY_AUTH_USER),
    ]);
    if (token && userStr) {
      return { token, user: JSON.parse(userStr) };
    }
  } catch (e) {
    console.error('Error getting auth session:', e);
  }
  return { token: null, user: null };
};

export const clearAuthSession = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEY_AUTH_USER);
  } catch (e) {
    console.error('Error clearing auth session:', e);
  }
};

export const getStoredWatchlist = async () => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY_WATCHLIST);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    return [];
  }
};

export const saveStoredWatchlist = async (list) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving watchlist:', e);
  }
};

export const isWatchlisted = async (showId) => {
  if (!showId) return false;
  const list = await getStoredWatchlist();
  return list.some(item => (item.id === showId || item.showId === showId));
};

export const addToWatchlist = async (show) => {
  if (!show || !show.id) return [];
  const list = await getStoredWatchlist();
  const exists = list.some(item => item.id === show.id);
  if (!exists) {
    const updated = [show, ...list];
    await saveStoredWatchlist(updated);
    return updated;
  }
  return list;
};

export const removeFromWatchlist = async (showId) => {
  if (!showId) return [];
  const list = await getStoredWatchlist();
  const updated = list.filter(item => item.id !== showId && item.showId !== showId);
  await saveStoredWatchlist(updated);
  return updated;
};

export const toggleWatchlist = async (show) => {
  if (!show || !show.id) return { bookmarked: false, list: [] };
  const list = await getStoredWatchlist();
  const index = list.findIndex(item => item.id === show.id || item.showId === show.id);
  if (index >= 0) {
    const updated = list.filter((_, idx) => idx !== index);
    await saveStoredWatchlist(updated);
    return { bookmarked: false, list: updated };
  } else {
    const updated = [show, ...list];
    await saveStoredWatchlist(updated);
    return { bookmarked: true, list: updated };
  }
};

export const getStoredHistory = async () => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY_HISTORY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    return [];
  }
};

export const saveStoredHistory = async (list) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving history:', e);
  }
};

export const recordWatchHistory = async (show, episode, positionMillis, durationMillis) => {
  try {
    if (!show || (!show.id && !episode?.showId)) return;
    const showId = show.id || episode?.showId;
    const list = await getStoredHistory();

    const progressPercent = durationMillis > 0
      ? Math.min(100, Math.max(1, Math.round((positionMillis / durationMillis) * 100)))
      : 0;

    const historyItem = {
      id: showId,
      showId: showId,
      title: show.title || episode?.show?.title || 'Anime Series',
      poster: show.poster || show.posterUrl || show.banner || show.bannerUrl,
      banner: show.banner || show.bannerUrl,
      rating: show.rating,
      year: show.year,
      genres: show.genres,
      category: show.category,
      currentEpisode: episode ? {
        id: episode.id,
        episodeNumber: episode.episodeNumber,
        title: episode.title,
        videoUrl: episode.videoUrl || episode.masterPlaylistUrl || episode.streamUrl,
        masterPlaylistUrl: episode.masterPlaylistUrl,
      } : null,
      positionMillis: Math.max(0, positionMillis || 0),
      durationMillis: Math.max(0, durationMillis || 0),
      progressPercent: progressPercent,
      lastWatchedAt: Date.now(),
    };

    // Filter out previous entry for this show and place this new entry at the front
    const filtered = list.filter(item => item.id !== showId && item.showId !== showId);
    const updated = [historyItem, ...filtered].slice(0, 50); // Keep up to 50 items

    await saveStoredHistory(updated);

    // Synchronize episode-level detailed progress for show episode list tracking
    if (episode && (episode.id || episode.episodeNumber)) {
      await saveEpisodeProgress(showId, episode, positionMillis, durationMillis);
    }

    // Synchronize with backend API and award XP if user is logged in
    try {
      const session = await getAuthSession();
      if (session && session.token) {
        const baseUrl = await getApiBaseUrl();
        const isLunar = Boolean(show.isLunar || show.anilistId || show.lunarId || isNaN(parseInt(showId)));
        const lunarIdVal = show.anilistId || show.lunarId || showId;
        const durSec = Math.floor((durationMillis || 0) / 1000);
        const posSec = Math.floor((positionMillis || 0) / 1000);
        const isCompleted = progressPercent >= 65;

        if (durSec > 0) {
          const payload = isLunar ? {
            isLunar: true,
            lunarId: String(lunarIdVal),
            episodeId: `lunar-${lunarIdVal}-${episode?.episodeNumber || 1}`,
            episodeNumber: episode?.episodeNumber || 1,
            episodeTitle: episode?.title || `Episode ${episode?.episodeNumber || 1}`,
            showTitle: show.title || 'Anime Series',
            poster: show.poster || show.posterUrl || '',
            banner: show.banner || show.bannerUrl || '',
            progress: posSec,
            duration: durSec,
            watchTime: posSec,
            watchCoverage: Math.round(watchCoverage * 100) / 100,
            completed: isCompleted
          } : {
            episodeId: parseInt(episode?.id || showId) || 1,
            progress: posSec,
            duration: durSec,
            watchTime: posSec,
            watchCoverage: Math.round(watchCoverage * 100) / 100,
            completed: isCompleted
          };

          fetch(`${baseUrl}/api/user/history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.token}`
            },
            body: JSON.stringify(payload)
          }).catch(() => {});

          if (isCompleted) {
            fetch(`${baseUrl}/api/user/xp`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.token}`
              },
              body: JSON.stringify({
                amount: 10,
                reason: 'episode_watched',
                episodeId: payload.episodeId,
                lunarId: payload.lunarId,
                episodeNumber: payload.episodeNumber,
                episodeTitle: payload.episodeTitle,
                showTitle: payload.showTitle,
                completed: true
              })
            }).catch(() => {});
          }
        }
      }
    } catch (_) {}

    return updated;
  } catch (e) {
    console.warn('Error recording watch history:', e);
  }
};

/* =========================================================
   AUDIO TRACK PREFERENCE MEMORY
   ========================================================= */
export const STORAGE_KEY_AUDIO_PREF_GLOBAL = '@infinx_audio_pref_global';
export const STORAGE_KEY_AUDIO_PREF_SHOW_PREFIX = '@infinx_audio_pref_show_';

export const getPreferredAudioTrack = async (showId) => {
  try {
    if (showId) {
      const showPref = await AsyncStorage.getItem(`${STORAGE_KEY_AUDIO_PREF_SHOW_PREFIX}${showId}`);
      if (showPref) return JSON.parse(showPref);
    }
    const globalPref = await AsyncStorage.getItem(STORAGE_KEY_AUDIO_PREF_GLOBAL);
    if (globalPref) return JSON.parse(globalPref);
  } catch (e) {
    console.warn('Error reading preferred audio track:', e);
  }
  return null;
};

export const setPreferredAudioTrack = async (showId, track) => {
  try {
    if (!track) return;
    const data = JSON.stringify({
      language: track.language || '',
      name: track.name || '',
      displayName: track.displayName || '',
      index: track.index,
    });
    if (showId) {
      await AsyncStorage.setItem(`${STORAGE_KEY_AUDIO_PREF_SHOW_PREFIX}${showId}`, data);
    }
    await AsyncStorage.setItem(STORAGE_KEY_AUDIO_PREF_GLOBAL, data);
  } catch (e) {
    console.warn('Error saving preferred audio track:', e);
  }
};

/* =========================================================
   SUBTITLE APPEARANCE SETTINGS
   ========================================================= */
export const STORAGE_KEY_SUBTITLE_SETTINGS = '@infinx_subtitle_settings';

export const DEFAULT_SUBTITLE_SETTINGS = {
  size: 'medium', // 'small' (16), 'medium' (20), 'large' (25), 'huge' (30)
  color: '#ffffff', // '#ffffff', '#FFE600', '#00f0ff', '#55ff55'
  style: 'shadow', // 'shadow' (clean outlined shadow), 'box' (semi-translucent), 'solid' (opaque)
  position: 'bottom', // 'bottom', 'raised'
};

export const getSubtitleSettings = async () => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY_SUBTITLE_SETTINGS);
    if (json) {
      return { ...DEFAULT_SUBTITLE_SETTINGS, ...JSON.parse(json) };
    }
  } catch (e) {
    console.warn('Error reading subtitle settings:', e);
  }
  return DEFAULT_SUBTITLE_SETTINGS;
};

export const saveSubtitleSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SUBTITLE_SETTINGS, JSON.stringify(settings));
    return settings;
  } catch (e) {
    console.warn('Error saving subtitle settings:', e);
  }
};

/* =========================================================
   AUTO SKIP INTRO & OUTRO PREFERENCES
   ========================================================= */
export const STORAGE_KEY_AUTO_SKIP_INTRO = '@infinx_auto_skip_intro';
export const STORAGE_KEY_AUTO_SKIP_OUTRO = '@infinx_auto_skip_outro';
export const STORAGE_KEY_SKIP_DURATION = '@infinx_skip_intro_duration';

export const getAutoSkipIntroSetting = async () => {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY_AUTO_SKIP_INTRO);
    return val === null ? true : val === 'true';
  } catch (e) {
    return true;
  }
};

export const saveAutoSkipIntroSetting = async (enabled) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_AUTO_SKIP_INTRO, enabled ? 'true' : 'false');
    return enabled;
  } catch (e) {
    console.warn('Error saving auto skip intro setting:', e);
  }
};

export const getAutoSkipOutroSetting = async () => {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY_AUTO_SKIP_OUTRO);
    return val === null ? true : val === 'true';
  } catch (e) {
    return true;
  }
};

export const saveAutoSkipOutroSetting = async (enabled) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_AUTO_SKIP_OUTRO, enabled ? 'true' : 'false');
    return enabled;
  } catch (e) {
    console.warn('Error saving auto skip outro setting:', e);
  }
};

export const getSkipDurationSetting = async () => {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY_SKIP_DURATION);
    return val || 'auto';
  } catch (e) {
    return 'auto';
  }
};

export const saveSkipDurationSetting = async (val) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SKIP_DURATION, val || 'auto');
    return val;
  } catch (e) {
    console.warn('Error saving skip duration setting:', e);
  }
};

/* =========================================================
   EPISODES PROGRESS TRACKING (SHOW DETAIL SCREEN)
   ========================================================= */
export const STORAGE_KEY_EPISODES_PROGRESS = '@infinx_episodes_progress';

export const getShowEpisodesProgress = async (showId) => {
  if (!showId) return { episodes: {}, lastWatched: null };
  try {
    const json = await AsyncStorage.getItem(`${STORAGE_KEY_EPISODES_PROGRESS}_${showId}`);
    return json ? JSON.parse(json) : { episodes: {}, lastWatched: null };
  } catch (e) {
    return { episodes: {}, lastWatched: null };
  }
};

export const saveEpisodeProgress = async (showId, episode, positionMillis, durationMillis) => {
  if (!showId || !episode) return;
  const epId = episode.id || `ep_${episode.episodeNumber}`;
  try {
    const current = await getShowEpisodesProgress(showId);
    const pos = Math.max(0, positionMillis || 0);
    const dur = Math.max(0, durationMillis || 0);
    const progressPercent = dur > 0
      ? Math.min(100, Math.max(1, Math.round((pos / dur) * 100)))
      : 0;
    const isCompleted = progressPercent >= 88;

    const epProgress = {
      episodeId: epId,
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      positionMillis: pos,
      durationMillis: dur,
      progressPercent,
      completed: isCompleted,
      lastWatchedAt: Date.now(),
    };

    const updated = {
      ...current,
      lastWatched: epProgress,
      episodes: {
        ...(current.episodes || {}),
        [epId]: epProgress,
      },
    };

    await AsyncStorage.setItem(`${STORAGE_KEY_EPISODES_PROGRESS}_${showId}`, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Error saving episode progress:', e);
  }
};

const fetchWithTimeout = async (endpoint, options = {}, timeoutMs = 8000) => {
  let baseUrl = await getApiBaseUrl();
  let url = `${baseUrl}${endpoint}`;

  const doFetch = async (targetUrl) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(targetUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };

  try {
    const response = await doFetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `API Error ${response.status}`;
      try {
        const json = JSON.parse(errorText);
        if (json.error) errorMsg = json.error;
        else if (json.message) errorMsg = json.message;
      } catch (_) {
        if (errorText) errorMsg = errorText;
      }
      const err = new Error(errorMsg);
      err.status = response.status;
      throw err;
    }
    return await response.json();
  } catch (err) {
    if (
      err.message &&
      (err.message.includes('Network request failed') ||
        err.name === 'AbortError' ||
        err.message.includes('timeout') ||
        err.status === 502 ||
        err.status === 504)
    ) {
      try {
        const newServer = await discoverWorkingServer();
        if (newServer && newServer !== baseUrl) {
          baseUrl = newServer;
          url = `${baseUrl}${endpoint}`;
          const retryRes = await doFetch(url);
          if (retryRes.ok) return await retryRes.json();
        }
      } catch (retryErr) {}
    }
    throw err;
  }
};

// Demo/Fallback Data when backend is offline or loading
export const DEMO_CAROUSEL = [
  {
    id: 1,
    title: "Demon Slayer: Entertainment District Arc",
    description: "Tanjiro and his friends accompany the Sound Hashira Tengen Uzui to Yoshiwara, a glowing entertainment district, to investigate mysterious disappearances.",
    posterUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80",
    rating: 4.9,
    year: 2022,
    categories: [{ category: { name: "Action" } }, { category: { name: "Supernatural" } }],
    episodes: [{ id: 101, episodeNumber: 1, title: "Sound Hashira Tengen Uzui", duration: "24m" }]
  },
  {
    id: 2,
    title: "Attack on Titan: The Final Season",
    description: "The truth outside the walls is finally revealed, bringing Humanity's last defense into direct conflict with Marley.",
    posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80",
    rating: 4.8,
    year: 2023,
    categories: [{ category: { name: "Dark Fantasy" } }, { category: { name: "Action" } }],
    episodes: [{ id: 201, episodeNumber: 1, title: "The Other Side of the Sea", duration: "24m" }]
  },
  {
    id: 3,
    title: "Jujutsu Kaisen: Shibuya Incident",
    description: "Satoru Gojo is targeted by special grade curses on Halloween night in Shibuya, triggering a war for humanity.",
    posterUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80",
    rating: 4.9,
    year: 2023,
    categories: [{ category: { name: "Action" } }, { category: { name: "Shounen" } }],
    episodes: [{ id: 301, episodeNumber: 1, title: "Shibuya Incident", duration: "24m" }]
  }
];

export const DEMO_CATEGORIES = [
  {
    id: 1,
    name: "Trending Now",
    slug: "trending",
    shows: DEMO_CAROUSEL
  },
  {
    id: 2,
    name: "Action & Adventure",
    slug: "action",
    shows: [DEMO_CAROUSEL[0], DEMO_CAROUSEL[2]]
  },
  {
    id: 3,
    name: "Top Rated Classics",
    slug: "top-rated",
    shows: [DEMO_CAROUSEL[1], DEMO_CAROUSEL[0]]
  }
];

export const DEMO_LUNAR_TRENDING = {
  popularThisSeason: [
    {
      anilistId: 21,
      title: "ONE PIECE",
      romajiTitle: "ONE PIECE",
      englishTitle: "ONE PIECE",
      poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg",
      banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJ2JHj.jpg",
      rating: 8.8,
      year: 1999,
      format: "TV",
      episodes: 1180,
      isLunar: true,
      genres: ["Action", "Adventure", "Comedy", "Fantasy"]
    },
    {
      anilistId: 145064,
      title: "Jujutsu Kaisen Season 2",
      romajiTitle: "Jujutsu Kaisen 2nd Season",
      englishTitle: "Jujutsu Kaisen Season 2",
      poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145064-7D4bE4bXGf8O.jpg",
      banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/145064-6s5Y1nJbL7pE.jpg",
      rating: 8.9,
      year: 2023,
      format: "TV",
      episodes: 23,
      isLunar: true,
      genres: ["Action", "Fantasy", "Supernatural"]
    },
    {
      anilistId: 151807,
      title: "Solo Leveling",
      romajiTitle: "Ore dake Level Up na Ken",
      englishTitle: "Solo Leveling",
      poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-m1g5vU5gC0z1.jpg",
      banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/151807-y7nZtL4gXm1b.jpg",
      rating: 8.6,
      year: 2024,
      format: "TV",
      episodes: 12,
      isLunar: true,
      genres: ["Action", "Adventure", "Fantasy"]
    },
    {
      anilistId: 166240,
      title: "Demon Slayer: Hashira Training Arc",
      romajiTitle: "Kimetsu no Yaiba: Hashira Geiko-hen",
      englishTitle: "Demon Slayer: Kimetsu no Yaiba Hashira Training Arc",
      poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx166240-E0uFhG9h4X2v.jpg",
      banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/166240-A7fD9xP3gT1v.jpg",
      rating: 8.7,
      year: 2024,
      format: "TV",
      episodes: 8,
      isLunar: true,
      genres: ["Action", "Fantasy", "Supernatural"]
    }
  ],
  trendingNow: [
    {
      anilistId: 21,
      title: "ONE PIECE",
      poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg",
      banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJ2JHj.jpg",
      rating: 8.8,
      year: 1999,
      format: "TV",
      episodes: 1180,
      isLunar: true,
      genres: ["Action", "Adventure", "Fantasy"]
    },
    {
      anilistId: 172463,
      title: "Kaiju No. 8",
      romajiTitle: "Kaijuu 8-gou",
      englishTitle: "Kaiju No. 8",
      poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx172463-mJz2K4rP9tN1.jpg",
      banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/172463-y8P2mW5xV6bN.jpg",
      rating: 8.4,
      year: 2024,
      format: "TV",
      episodes: 12,
      isLunar: true,
      genres: ["Action", "Sci-Fi"]
    }
  ],
  upcomingNextSeason: []
};

export const apiService = {
  getCarouselShows: async () => {
    try {
      const data = await fetchWithTimeout('/api/shows/carousel');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (e) {
      console.log('Using fallback demo carousel:', e.message);
    }
    return DEMO_CAROUSEL;
  },

  getCategoriesWithShows: async () => {
    try {
      const data = await fetchWithTimeout('/api/shows/categories');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (e) {
      console.log('Using fallback demo categories:', e.message);
    }
    return DEMO_CATEGORIES;
  },

  searchShows: async (query) => {
    if (!query) return [];
    try {
      const data = await fetchWithTimeout(`/api/shows/search?q=${encodeURIComponent(query)}`);
      if (Array.isArray(data)) return data;
    } catch (e) {
      console.log('Fallback search filtering:', e.message);
    }
    const q = query.toLowerCase();
    return DEMO_CAROUSEL.filter(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  },

  getShowById: async (id) => {
    if (!id) return DEMO_CAROUSEL[0];
    const strId = String(id);
    if (strId.startsWith('lunar-')) {
      return await apiService.getLunarAnimeAll(strId.replace('lunar-', ''));
    }
    try {
      const data = await fetchWithTimeout(`/api/shows/${id}`);
      if (data && data.id) return data;
    } catch (e) {
      console.log('Fallback getShowById:', e.message);
    }
    return DEMO_CAROUSEL.find(s => s.id == id) || DEMO_CAROUSEL[0];
  },

  getEpisodeById: async (id) => {
    if (!id) return null;
    const strId = String(id);
    if (strId.startsWith('lunar-')) {
      const parts = strId.split('-');
      const anilistId = parts[1];
      const epNum = parseInt(parts[2], 10) || 1;
      try {
        const streamData = await apiService.getLunarAnimeStream(anilistId, epNum);
        return {
          id: strId,
          episodeNumber: epNum,
          title: `Episode ${epNum}`,
          isLunar: true,
          anilistId: anilistId,
          videoUrl: streamData?.streamUrl || streamData?.stream?.url || '',
          streamData: streamData,
        };
      } catch (e) {}
    }
    try {
      const data = await fetchWithTimeout(`/api/shows/episodes/${id}`);
      if (data && data.id) return data;
    } catch (e) {
      console.log('Fallback getEpisodeById:', e.message);
    }
    return {
      id: id,
      episodeNumber: 1,
      title: "Episode 1",
      videoUrl: "",
      show: DEMO_CAROUSEL[0]
    };
  },

  loginUser: async (email, password) => {
    const data = await fetchWithTimeout('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });
    if (data && data.token && data.user) {
      await saveAuthSession(data.token, data.user);
    }
    return data;
  },

  registerUser: async (email, password) => {
    const data = await fetchWithTimeout('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });
    if (data && data.token && data.user) {
      await saveAuthSession(data.token, data.user);
    }
    return data;
  },

  getAdminStats: async (token) => {
    try {
      return await fetchWithTimeout('/api/admin/tasks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      return [];
    }
  },

  // =========================================================
  // LUNAR ANIME API METHODS (Matching Main Website)
  // =========================================================

  getLunarTrending: async () => {
    try {
      const data = await fetchWithTimeout('/api/lunarx/trending', {}, 10000);
      if (data && (data.popularThisSeason || data.trendingNow || data.upcomingNextSeason)) {
        return data;
      }
    } catch (e) {
      console.warn('getLunarTrending fetch failed, using fallback:', e.message);
    }
    return DEMO_LUNAR_TRENDING;
  },

  browseLunarAnime: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.genre && params.genre !== 'All' && params.genre !== 'all') queryParams.append('genre', params.genre);
      if (params.format && params.format !== 'all') queryParams.append('format', params.format);
      if (params.season && params.season !== 'all') queryParams.append('season', params.season);
      if (params.year && params.year !== 'all') queryParams.append('year', params.year);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const qs = queryParams.toString();
      const data = await fetchWithTimeout(`/api/lunarx/browse${qs ? `?${qs}` : ''}`, {}, 10000);
      if (data && (data.media || Array.isArray(data))) return data;
    } catch (e) {
      console.warn('browseLunarAnime error:', e.message);
    }
    return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1 } };
  },

  searchLunarAnime: async (query, limit = 20) => {
    if (!query || !query.trim()) return [];
    try {
      const data = await fetchWithTimeout(`/api/lunarx/search?q=${encodeURIComponent(query.trim())}&limit=${limit}`, {}, 8000);
      if (Array.isArray(data)) return data;
    } catch (e) {
      console.warn('searchLunarAnime error:', e.message);
    }
    return [];
  },

  getLunarAnimeInfo: async (anilistId) => {
    if (!anilistId) throw new Error('Missing anilistId');
    const cleanId = String(anilistId).replace(/^lunar-/, '');
    return await fetchWithTimeout(`/api/lunarx/info/${cleanId}`, {}, 10000);
  },

  getLunarAnimeEpisodes: async (anilistId) => {
    if (!anilistId) return [];
    const cleanId = String(anilistId).replace(/^lunar-/, '');
    try {
      const data = await fetchWithTimeout(`/api/lunarx/episodes/${cleanId}`, {}, 10000);
      if (Array.isArray(data)) return data;
    } catch (e) {
      console.warn('getLunarAnimeEpisodes error:', e.message);
    }
    return [];
  },

  getLunarAnimeAll: async (anilistId) => {
    if (!anilistId) throw new Error('Missing anilistId');
    const cleanId = String(anilistId).replace(/^lunar-/, '');
    const data = await fetchWithTimeout(`/api/lunarx/all/${cleanId}`, {}, 12000);
    return data;
  },

  getLunarAnimeSeasons: async (anilistId) => {
    if (!anilistId) return [];
    const cleanId = String(anilistId).replace(/^lunar-/, '');
    try {
      const data = await fetchWithTimeout(`/api/lunarx/seasons/${cleanId}`, {}, 8000);
      if (Array.isArray(data)) return data;
    } catch (e) {
      console.warn('getLunarAnimeSeasons error:', e.message);
    }
    return [];
  },

  getLunarAnimeStream: async (anilistId, epNum = 1, host = 'zuna', type = 'sub') => {
    if (!anilistId) throw new Error('Missing anilistId');
    const cleanId = String(anilistId).replace(/^lunar-/, '');
    const data = await fetchWithTimeout(
      `/api/lunarx/stream/${cleanId}/${epNum}?host=${encodeURIComponent(host)}&type=${encodeURIComponent(type)}`,
      {},
      30000
    );
    return data;
  },
};
