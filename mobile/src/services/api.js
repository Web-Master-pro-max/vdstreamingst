import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY_API_URL = '@infinx_api_url';
export const DEFAULT_URL = 'http://13.202.95.5:8000';

export const PRESET_SERVERS = [
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
];

let cachedApiUrl = null;

export const getApiBaseUrl = async () => {
  if (cachedApiUrl) return cachedApiUrl;
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_API_URL);
    if (saved) {
      cachedApiUrl = saved;
      return saved;
    }
  } catch (e) {
    console.error('Failed to read API URL from storage:', e);
  }
  cachedApiUrl = DEFAULT_URL;
  return DEFAULT_URL;
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
  let fullUrl = trimmed;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:') && !trimmed.startsWith('file://')) {
    const baseUrl = cachedApiUrl || DEFAULT_URL;
    fullUrl = trimmed.startsWith('/') ? `${baseUrl}${trimmed}` : `${baseUrl}/${trimmed}`;
  }
  try {
    return encodeURI(fullUrl);
  } catch (e) {
    return fullUrl;
  }
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
    return val === 'true';
  } catch (e) {
    return false;
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
    return val === 'true';
  } catch (e) {
    return false;
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
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    clearTimeout(id);

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
    clearTimeout(id);
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
    try {
      const data = await fetchWithTimeout(`/api/shows/${id}`);
      if (data && data.id) return data;
    } catch (e) {
      console.log('Fallback getShowById:', e.message);
    }
    return DEMO_CAROUSEL.find(s => s.id == id) || DEMO_CAROUSEL[0];
  },

  getEpisodeById: async (id) => {
    try {
      const data = await fetchWithTimeout(`/api/shows/episodes/${id}`);
      if (data && data.id) return data;
    } catch (e) {
      console.log('Fallback getEpisodeById:', e.message);
    }
    return {
      id: id,
      episodeNumber: 1,
      title: "Episode 1: Awakening",
      videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
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
};
