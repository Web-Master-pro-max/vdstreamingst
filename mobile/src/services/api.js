import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY_API_URL = '@infinx_api_url';
const DEFAULT_URL = 'http://13.202.95.5:8000';

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
      throw new Error(`API Error ${response.status}: ${errorText}`);
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
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      show: DEMO_CAROUSEL[0]
    };
  },

  loginUser: async (email, password) => {
    try {
      return await fetchWithTimeout('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } catch (e) {
      // Demo mock login for testing without live backend DB connection
      if (email && password) {
        return {
          user: { id: 1, name: email.split('@')[0], email },
          token: "demo_jwt_token_12345"
        };
      }
      throw e;
    }
  }
};
