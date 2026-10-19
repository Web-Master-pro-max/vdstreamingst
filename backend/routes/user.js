const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get Watchlist
router.get('/watchlist', authenticate, async (req, res) => {
  try {
    const watchlist = await prisma.watchlist.findMany({
      where: { userId: req.user.id },
      include: {
        show: {
          include: {
            categories: {
              include: {
                category: true,
              },
            },
            episodes: {
              orderBy: { episodeNumber: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(watchlist.map(item => item.show));
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Toggle Watchlist item (add/remove)
router.post('/watchlist', authenticate, async (req, res) => {
  try {
    const { showId } = req.body;
    if (!showId) {
      return res.status(400).json({ error: 'Show ID is required.' });
    }

    const show = await prisma.show.findUnique({ where: { id: parseInt(showId) } });
    if (!show) {
      return res.status(404).json({ error: 'Show not found.' });
    }

    // Check if already in watchlist
    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_showId: {
          userId: req.user.id,
          showId: parseInt(showId),
        },
      },
    });

    if (existing) {
      // Remove
      await prisma.watchlist.delete({
        where: { id: existing.id },
      });
      return res.json({ status: 'removed', message: 'Show removed from watchlist.' });
    } else {
      // Add
      await prisma.watchlist.create({
        data: {
          userId: req.user.id,
          showId: parseInt(showId),
        },
      });
      return res.json({ status: 'added', message: 'Show added to watchlist.' });
    }
  } catch (error) {
    console.error('Error toggling watchlist:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

const fs = require('fs');
const path = require('path');

const ANIME_HISTORY_DIR = path.join(__dirname, '../data');
const ANIME_HISTORY_FILE = path.join(ANIME_HISTORY_DIR, 'anime_history.json');
const WATCHED_EPISODES_FILE = path.join(ANIME_HISTORY_DIR, 'watched_episodes.json');

function getUserWatchedEpisodes(userId) {
  try {
    if (!fs.existsSync(WATCHED_EPISODES_FILE)) return {};
    const data = JSON.parse(fs.readFileSync(WATCHED_EPISODES_FILE, 'utf8') || '{}');
    return data[userId] || {};
  } catch (e) {
    return {};
  }
}

function saveUserWatchedEpisodes(userId, episodesMap) {
  try {
    if (!fs.existsSync(ANIME_HISTORY_DIR)) {
      fs.mkdirSync(ANIME_HISTORY_DIR, { recursive: true });
    }
    let data = {};
    if (fs.existsSync(WATCHED_EPISODES_FILE)) {
      try {
        data = JSON.parse(fs.readFileSync(WATCHED_EPISODES_FILE, 'utf8') || '{}');
      } catch (e) { data = {}; }
    }
    data[userId] = episodesMap;
    const tempFile = path.join(ANIME_HISTORY_DIR, `watched_episodes_${Date.now()}_${Math.random().toString(36).substring(2)}.tmp`);
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, WATCHED_EPISODES_FILE);
  } catch (e) {
    console.error('Error saving watched episodes to file:', e);
  }
}

function getUserAnimeHistory(userId) {
  try {
    if (!fs.existsSync(ANIME_HISTORY_FILE)) return [];
    const data = JSON.parse(fs.readFileSync(ANIME_HISTORY_FILE, 'utf8') || '{}');
    return data[userId] || [];
  } catch (e) {
    return [];
  }
}

function saveUserAnimeHistory(userId, item) {
  try {
    if (!fs.existsSync(ANIME_HISTORY_DIR)) {
      fs.mkdirSync(ANIME_HISTORY_DIR, { recursive: true });
    }
    let data = {};
    if (fs.existsSync(ANIME_HISTORY_FILE)) {
      try {
        data = JSON.parse(fs.readFileSync(ANIME_HISTORY_FILE, 'utf8') || '{}');
      } catch (e) { data = {}; }
    }
    if (!data[userId]) data[userId] = [];

    const showKey = item.lunarId || item.showId || item.episodeId;
    data[userId] = data[userId].filter(existing => {
      const existingKey = existing.lunarId || existing.showId || existing.episodeId;
      return String(existingKey) !== String(showKey);
    });

    data[userId].unshift(item);
    if (data[userId].length > 30) data[userId] = data[userId].slice(0, 30);
    // Atomic safe write to avoid file corruption during simultaneous user updates
    const tempFile = path.join(ANIME_HISTORY_DIR, `anime_history_${Date.now()}_${Math.random().toString(36).substring(2)}.tmp`);
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, ANIME_HISTORY_FILE);
  } catch (e) {
    console.error('Error saving anime history to file:', e);
  }
}

const COMPLETED_ANIME_FILE = path.join(ANIME_HISTORY_DIR, 'completed_anime.json');

function getUserCompletedAnime(userId) {
  try {
    if (!fs.existsSync(COMPLETED_ANIME_FILE)) return [];
    const data = JSON.parse(fs.readFileSync(COMPLETED_ANIME_FILE, 'utf8') || '{}');
    return data[userId] || [];
  } catch (e) {
    return [];
  }
}

function saveUserCompletedAnime(userId, list) {
  try {
    if (!fs.existsSync(ANIME_HISTORY_DIR)) {
      fs.mkdirSync(ANIME_HISTORY_DIR, { recursive: true });
    }
    let data = {};
    if (fs.existsSync(COMPLETED_ANIME_FILE)) {
      try {
        data = JSON.parse(fs.readFileSync(COMPLETED_ANIME_FILE, 'utf8') || '{}');
      } catch (e) { data = {}; }
    }
    data[userId] = list;
    const tempFile = path.join(ANIME_HISTORY_DIR, `completed_anime_${Date.now()}_${Math.random().toString(36).substring(2)}.tmp`);
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, COMPLETED_ANIME_FILE);
  } catch (e) {
    console.error('Error saving completed anime to file:', e);
  }
}

async function getAggregatedCompletedAnime(userId) {
  const manualList = getUserCompletedAnime(userId);
  const map = new Map();

  manualList.forEach(item => {
    if (item && (item.id || item.showId || item.lunarId)) {
      const key = String(item.id || item.showId || item.lunarId);
      map.set(key, item);
    }
  });

  try {
    const dbHistory = await prisma.watchHistory.findMany({
      where: { userId },
      include: {
        episode: {
          include: {
            show: {
              include: {
                categories: { include: { category: true } },
                episodes: true
              }
            }
          }
        }
      }
    });

    const showProgressMap = new Map();
    dbHistory.forEach(h => {
      if (!h.episode || !h.episode.show) return;
      const s = h.episode.show;
      if (!showProgressMap.has(s.id)) {
        showProgressMap.set(s.id, {
          show: s,
          watchedEpisodes: new Set(),
          maxProgress: 0,
          totalDuration: 0
        });
      }
      const entry = showProgressMap.get(s.id);
      if (h.duration > 0 && (h.progress / h.duration >= 0.85)) {
        entry.watchedEpisodes.add(h.episode.id);
      }
      if (h.progress > entry.maxProgress) entry.maxProgress = h.progress;
      if (h.duration > entry.totalDuration) entry.totalDuration = h.duration;
    });

    for (const [showId, entry] of showProgressMap.entries()) {
      const s = entry.show;
      const totalEpisodes = (s.episodes && s.episodes.length) || 1;
      const isMovie = s.type === 'movie' || totalEpisodes === 1;
      const isCompleted = isMovie
        ? (entry.totalDuration > 0 && entry.maxProgress / entry.totalDuration >= 0.85)
        : (entry.watchedEpisodes.size >= totalEpisodes && totalEpisodes > 0);

      const key = String(showId);
      if (isCompleted && !map.has(key)) {
        map.set(key, {
          id: s.id,
          showId: s.id,
          title: s.title,
          poster: s.poster,
          banner: s.banner || s.poster,
          rating: s.rating || 8.0,
          type: s.type || 'series',
          genres: (s.categories && s.categories.map(c => c.category?.name).filter(Boolean).join(', ')) || 'Anime',
          episodesCount: totalEpisodes,
          completedAt: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.warn('Error auto-detecting DB completed anime:', err.message);
  }

  try {
    const lunarHistory = getUserAnimeHistory(userId);
    lunarHistory.forEach(item => {
      const isCompleted = item.progress && item.duration && (item.progress / item.duration >= 0.85);
      const key = String(item.lunarId || item.id);
      if (isCompleted && !map.has(key)) {
        map.set(key, {
          id: item.lunarId || item.id,
          lunarId: item.lunarId,
          title: item.showTitle,
          poster: item.poster,
          banner: item.banner || item.poster,
          rating: 8.5,
          type: 'series',
          genres: 'Anime',
          episodesCount: item.episodeNumber || 1,
          completedAt: item.watchedAt || new Date().toISOString()
        });
      }
    });
  } catch (err) {
    console.warn('Error auto-detecting lunar completed anime:', err.message);
  }

  return Array.from(map.values());
}

// GET /api/user/completed-anime - Get all anime completed by the authenticated user
router.get('/completed-anime', authenticate, async (req, res) => {
  try {
    const list = await getAggregatedCompletedAnime(req.user.id);
    res.json(list);
  } catch (err) {
    console.error('Error fetching completed anime:', err);
    res.status(500).json({ error: 'Failed to fetch completed anime' });
  }
});

// POST /api/user/completed-anime - Mark an anime as completed
router.post('/completed-anime', authenticate, async (req, res) => {
  try {
    const { showId, lunarId, title, poster, banner, rating, type, genres, episodesCount } = req.body;
    let animeEntry = null;

    if (showId) {
      const show = await prisma.show.findUnique({
        where: { id: parseInt(showId) },
        include: {
          categories: { include: { category: true } },
          episodes: true
        }
      });
      if (!show) return res.status(404).json({ error: 'Show not found' });
      animeEntry = {
        id: show.id,
        showId: show.id,
        title: show.title,
        poster: show.poster,
        banner: show.banner || show.poster,
        rating: show.rating || 8.0,
        type: show.type || 'series',
        genres: (show.categories && show.categories.map(c => c.category?.name).filter(Boolean).join(', ')) || 'Anime',
        episodesCount: show.episodes?.length || 1,
        completedAt: new Date().toISOString()
      };
    } else if (title) {
      animeEntry = {
        id: lunarId || `custom-${Date.now()}`,
        lunarId: lunarId || null,
        title: String(title).trim(),
        poster: poster || '',
        banner: banner || poster || '',
        rating: typeof rating === 'number' ? rating : parseFloat(rating) || 8.0,
        type: type || 'series',
        genres: genres || 'Anime',
        episodesCount: parseInt(episodesCount, 10) || 1,
        completedAt: new Date().toISOString()
      };
    } else {
      return res.status(400).json({ error: 'showId or anime details (title, poster) required.' });
    }

    const currentList = getUserCompletedAnime(req.user.id);
    const existingIdx = currentList.findIndex(a => String(a.id || a.showId || a.lunarId) === String(animeEntry.id) || a.title.toLowerCase() === animeEntry.title.toLowerCase());
    if (existingIdx >= 0) {
      currentList[existingIdx] = animeEntry;
    } else {
      currentList.unshift(animeEntry);
    }
    saveUserCompletedAnime(req.user.id, currentList);
    res.json({ success: true, anime: animeEntry, completedAnime: currentList });
  } catch (err) {
    console.error('Error marking completed anime:', err);
    res.status(500).json({ error: 'Failed to record completed anime' });
  }
});

// DELETE /api/user/completed-anime/:id - Remove an anime from completed list
router.delete('/completed-anime/:id', authenticate, async (req, res) => {
  try {
    const targetId = String(req.params.id);
    const currentList = getUserCompletedAnime(req.user.id);
    const updated = currentList.filter(a => String(a.id || a.showId || a.lunarId) !== targetId);
    saveUserCompletedAnime(req.user.id, updated);

    // If this anime was in user.topAnime showcase, remove it as well
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user && user.topAnime) {
      let top = user.topAnime;
      if (typeof top === 'string') { try { top = JSON.parse(top); } catch (e) { top = []; } }
      if (Array.isArray(top)) {
        const filteredTop = top.filter(item => String(item.id || item.showId || item.lunarId) !== targetId);
        if (filteredTop.length !== top.length) {
          await prisma.user.update({
            where: { id: req.user.id },
            data: { topAnime: filteredTop.length > 0 ? filteredTop : null }
          });
        }
      }
    }

    res.json({ success: true, message: 'Anime removed from completed list' });
  } catch (err) {
    console.error('Error deleting completed anime:', err);
    res.status(500).json({ error: 'Failed to remove completed anime' });
  }
});

// Get Watch History (for Continue Watching progress bar)
router.get('/history', authenticate, async (req, res) => {
  try {
    const history = await prisma.watchHistory.findMany({
      where: { userId: req.user.id },
      include: {
        episode: {
          include: {
            show: true,
          },
        },
      },
      orderBy: { watchedAt: 'desc' },
    });

    // Filter out deleted episodes or shows to prevent crashes
    const validHistory = history.filter(item => item && item.episode && item.episode.show);
    const cleanedHistory = validHistory.map(item => ({
      id: item.id,
      episodeId: item.episodeId,
      progress: item.progress,
      duration: item.duration,
      watchedAt: item.watchedAt,
      episode: {
        id: item.episode.id,
        title: item.episode.title,
        episodeNumber: item.episode.episodeNumber,
        videoUrl: item.episode.videoUrl,
        show: item.episode.show,
      },
    }));

    // Retrieve synced anime history
    const animeHistory = getUserAnimeHistory(req.user.id);
    const cleanedAnimeHistory = animeHistory.map(item => ({
      id: item.id || `lunar-${item.lunarId}-${item.episodeNumber}`,
      isLunar: true,
      lunarId: item.lunarId,
      episodeId: item.episodeId,
      episodeNumber: item.episodeNumber,
      progress: item.progress,
      duration: item.duration,
      watchedAt: item.watchedAt,
      episode: {
        id: item.episodeId,
        title: item.episodeTitle || `Episode ${item.episodeNumber}`,
        episodeNumber: item.episodeNumber,
        videoUrl: '',
        show: {
          id: `lunar-${item.lunarId}`,
          anilistId: item.lunarId,
          title: item.showTitle,
          poster: item.poster,
          banner: item.banner,
          isLunar: true
        }
      }
    }));

    const combined = [...cleanedHistory, ...cleanedAnimeHistory].sort((a, b) => {
      const timeA = new Date(a.watchedAt).getTime();
      const timeB = new Date(b.watchedAt).getTime();
      return timeB - timeA;
    });

    res.json(combined);
  } catch (error) {
    console.error('Error fetching watch history:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Save/Update watch progress
router.post('/history', authenticate, async (req, res) => {
  try {
    const { episodeId, progress, duration, isLunar, lunarId, inWatchParty, completed } = req.body;

    if (!episodeId || progress === undefined || !duration) {
      return res.status(400).json({ error: 'Episode ID, progress, and duration are required.' });
    }

    const floatProg = parseFloat(progress) || 0;
    const floatDur = parseFloat(duration) || 1;
    const progressRatio = floatDur > 0 ? (floatProg / floatDur) : 0;
    const isWatchedComplete = Boolean(completed) || progressRatio >= 0.70;

    // Handle dynamic Anime show progress
    if (isLunar || lunarId || isNaN(parseInt(episodeId))) {
      const anilistIdVal = lunarId || req.body.anilistId || (typeof episodeId === 'string' && episodeId.startsWith('lunar-') ? episodeId.split('-')[1] : null);
      const epNumVal = req.body.episodeNumber || (typeof episodeId === 'string' && episodeId.startsWith('lunar-') ? parseInt(episodeId.split('-')[2]) : 1);
      const epKey = `lunar-${anilistIdVal}-${epNumVal}`;

      const animeHistoryItem = {
        id: epKey,
        userId: req.user.id,
        isLunar: true,
        lunarId: anilistIdVal,
        episodeId: epKey,
        episodeNumber: epNumVal,
        episodeTitle: req.body.episodeTitle || `Episode ${epNumVal}`,
        showTitle: req.body.showTitle || req.body.title || 'Anime Series',
        poster: req.body.poster || '',
        banner: req.body.banner || '',
        progress: floatProg,
        duration: floatDur,
        watchedAt: new Date().toISOString()
      };
      saveUserAnimeHistory(req.user.id, animeHistoryItem);

      // Record detailed episode watch in watched_episodes
      const watchedMap = getUserWatchedEpisodes(req.user.id);
      const existingEntry = watchedMap[epKey] || {};
      watchedMap[epKey] = {
        ...existingEntry,
        episodeKey: epKey,
        episodeId: epKey,
        lunarId: anilistIdVal,
        episodeNumber: epNumVal,
        episodeTitle: req.body.episodeTitle || existingEntry.episodeTitle || `Episode ${epNumVal}`,
        showTitle: req.body.showTitle || req.body.title || existingEntry.showTitle || 'Anime Series',
        poster: req.body.poster || existingEntry.poster || '',
        banner: req.body.banner || existingEntry.banner || '',
        progress: floatProg,
        duration: floatDur,
        completed: existingEntry.completed || progressRatio >= 0.85 || Boolean(completed),
        lastWatchedAt: new Date().toISOString()
      };
      saveUserWatchedEpisodes(req.user.id, watchedMap);

      let xpResult = null;
      if (isWatchedComplete) {
        xpResult = await awardUserXpInternal(
          req.user.id,
          inWatchParty ? 25 : 10,
          inWatchParty ? 'watch_party' : 'episode_watched',
          epKey,
          {
            episodeTitle: req.body.episodeTitle || existingEntry.episodeTitle,
            showTitle: req.body.showTitle || req.body.title || existingEntry.showTitle
          }
        );
      }

      return res.json({ success: true, isLunar: true, history: animeHistoryItem, xpResult });
    }

    const episode = await prisma.episode.findUnique({
      where: { id: parseInt(episodeId) },
      include: { show: true }
    });
    if (!episode) {
      return res.status(404).json({ error: 'Episode not found.' });
    }

    const history = await prisma.watchHistory.upsert({
      where: {
        userId_episodeId: {
          userId: req.user.id,
          episodeId: parseInt(episodeId),
        },
      },
      update: {
        progress: floatProg,
        duration: floatDur,
        watchedAt: new Date(),
      },
      create: {
        userId: req.user.id,
        episodeId: parseInt(episodeId),
        progress: floatProg,
        duration: floatDur,
      },
    });

    const epKey = `db-${episodeId}`;
    const watchedMap = getUserWatchedEpisodes(req.user.id);
    const existingEntry = watchedMap[epKey] || {};
    watchedMap[epKey] = {
      ...existingEntry,
      episodeKey: epKey,
      episodeId: parseInt(episodeId),
      episodeNumber: episode.episodeNumber || 1,
      episodeTitle: episode.title || existingEntry.episodeTitle || `Episode ${episode.episodeNumber || 1}`,
      showTitle: episode.show?.title || existingEntry.showTitle || 'Anime Series',
      poster: episode.show?.poster || existingEntry.poster || '',
      banner: episode.show?.banner || existingEntry.banner || '',
      progress: floatProg,
      duration: floatDur,
      completed: existingEntry.completed || progressRatio >= 0.85 || Boolean(completed),
      lastWatchedAt: new Date().toISOString()
    };
    saveUserWatchedEpisodes(req.user.id, watchedMap);

    let xpResult = null;
    if (isWatchedComplete) {
      xpResult = await awardUserXpInternal(
        req.user.id,
        inWatchParty ? 25 : 10,
        inWatchParty ? 'watch_party' : 'episode_watched',
        epKey,
        {
          episodeTitle: episode.title,
          showTitle: episode.show?.title
        }
      );
    }

    res.json({ success: true, history, xpResult });
  } catch (error) {
    console.error('Error updating watch history:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Clear or Delete watch history
router.delete('/history', authenticate, async (req, res) => {
  try {
    const { episodeId, lunarId } = req.query || {};

    if (episodeId) {
      await prisma.watchHistory.deleteMany({
        where: {
          userId: req.user.id,
          episodeId: parseInt(episodeId)
        }
      });
      return res.json({ success: true, message: 'Episode removed from history' });
    }

    if (lunarId) {
      if (fs.existsSync(ANIME_HISTORY_FILE)) {
        try {
          const data = JSON.parse(fs.readFileSync(ANIME_HISTORY_FILE, 'utf8') || '{}');
          if (Array.isArray(data[req.user.id])) {
            data[req.user.id] = data[req.user.id].filter(item => String(item.lunarId || item.anilistId) !== String(lunarId));
            fs.writeFileSync(ANIME_HISTORY_FILE, JSON.stringify(data, null, 2), 'utf8');
          }
        } catch (e) {}
      }
      return res.json({ success: true, message: 'Anime removed from history' });
    }

    // Clear all history
    await prisma.watchHistory.deleteMany({
      where: { userId: req.user.id }
    });

    if (fs.existsSync(ANIME_HISTORY_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(ANIME_HISTORY_FILE, 'utf8') || '{}');
        delete data[req.user.id];
        fs.writeFileSync(ANIME_HISTORY_FILE, JSON.stringify(data, null, 2), 'utf8');
      } catch (e) {}
    }

    res.json({ success: true, message: 'All watch history cleared' });
  } catch (error) {
    console.error('Error clearing watch history:', error);
    res.status(500).json({ error: 'Failed to clear watch history' });
  }
});

// =========================================================================
// ADVANCED PROFILE CUSTOMIZATION & PROGRESSION ENDPOINTS
// =========================================================================

function calculateOtakuRank(level, currentVipRank, role) {
  if (level >= 50) return 'HOKAGE_VIP';
  if (level >= 25) return 'HASHIRA';
  if (level >= 15) return 'JOUNIN';
  if (level >= 5) return 'CHUNIN';
  return 'GENIN';
}

const AVATAR_LEVEL_REQUIREMENTS = {
  // Level 50: Hokage / God Tier
  'av-luffy-monkey': 50,
  'av-naruto-uzumaki': 50,
  'av-gokuu-son': 50,
  'av-eren-yeager': 50,
  'av-ichigo-kurosaki': 50,
  'av-jin-u-seong': 50,
  'av-saitama': 50,
  'av-sukuna': 50,
  'av-itachi-uchiha': 50,
  'av-light-yagami': 50,
  'av-l-lawliet': 50,
  'av-lelouch-lamperouge': 50,
  'av-vegeta': 50,
  // Level 25: Jounin Elite Tier
  'av-tanjirou-kamado': 25,
  'av-yuuji-itadori': 25,
  'av-denji': 25,
  'av-shigeo-kageyama': 25,
  'av-ken-kaneki': 25,
  'av-thorfinn-karlsefni': 25,
  'av-violet-evergarden': 25,
  'av-edward-elric': 25,
  'av-gon-freecss': 25,
  'av-izuku-midoriya': 25,
  'av-kurisu-makise': 25,
  'av-rintarou-okabe': 25,
  'av-frieren': 25,
  'av-guts': 25,
  'av-levi': 25,
  'av-kakashi-hatake': 25,
  'av-satoru-gojou': 25,
  // Level 15: Chunin Tier
  'av-zoro-roronoa': 15,
  'av-sasuke-uchiha': 15,
  'av-gaara': 15,
  'av-roy-mustang': 15,
  'av-katsuki-bakugou': 15,
  'av-shouto-todoroki': 15,
  'av-killua-zoldyck': 15,
  'av-hisoka-morow': 15,
  'av-mikasa-ackerman': 15,
  'av-yor-forger': 15,
  'av-power': 15,
  'av-makima': 15,
  'av-kaguya-shinomiya': 15,
  // Level 5: Genin Tier
  'av-panda': 5,
  'av-megumi-fushiguro': 5,
  'av-nobara-kugisaki': 5,
  'av-aoi-todo': 5,
  'av-genos': 5,
  'av-shikamaru-nara': 5,
  'av-kiba-inuzuka': 5,
  'av-loid-forger': 5,
  'av-nezuko-kamado': 5,
  'av-mai-sakurajima': 5,
  // Expanded Avatar Requirements
  'av-sanji': 5,
  'av-miko-iino': 5,
  'av-zero-two': 5,
  'av-kusuo-saiki': 5,
  'av-robin-nico': 5,
  'av-izumi-miyamura': 5,
  'av-hitagi-senjougahara': 5,
  'av-shouyou-hinata': 5,
  'av-asuka-langley-souryuu': 5,
  'av-aki-hayakawa': 5,
  'av-yuu-ishigami': 5,
  'av-spike-spiegel': 5,
  'av-joutarou-kuujou': 5,
  'av-hange-zoe': 5,
  'av-shinobu-oshino': 15,
  'av-rimuru-tempest': 15,
  'av-kento-nanami': 15,
  'av-maki-zenin': 15,
  'av-erwin-smith': 15,
  'av-yato': 15,
  'av-rin-toosaka': 15,
  'av-tobio-kageyama': 15,
  'av-hachiman-hikigaya': 15,
  'av-giyuu-tomioka': 15,
  'av-koyomi-araragi': 15,
  'av-hitori-gotou': 15,
  'av-homura-akemi': 15,
  'av-artoria-pendragon': 15,
  'av-miku-nakano': 25,
  'av-kyouko-hori': 25,
  'av-kana-arima': 25,
  'av-yuuta-okkotsu': 25,
  'av-shouko-nishimiya': 25,
  'av-rei-ayanami': 25,
  'av-roxy-migurdia': 25,
  'av-kyoujurou-rengoku': 25,
  'av-shinji-ikari': 25,
  'av-johan-liebert': 25,
  'av-misato-katsuragi': 25,
  'av-c-c': 25,
  'av-nino-nakano': 25,
  'av-yami-sukehiro': 25,
  'av-ai-hayasaka': 50,
  'av-shouya-ishida': 50,
  'av-yuu-nishinoya': 50,
  'av-sakuta-azusagawa': 50,
  'av-karma-akabane': 50,
  'av-kyou-souma': 50,
  'av-reze': 50,
  'av-law-trafalgar': 50,
  'av-nami': 50,
};

const BANNER_LEVEL_REQUIREMENTS = {
  // Level 50: Monarch
  'ban-solo-leveling': 50,
  'ban-dragonball': 50,
  'ban-death-note': 50,
  'ban-steins-gate': 50,
  'ban-evangelion': 50,
  // Level 25: Jounin
  'ban-bleach': 25,
  'ban-cyberpunk': 25,
  'ban-fmab': 25,
  'ban-frieren': 25,
  // Level 15: Chunin
  'ban-aot': 15,
  'ban-hxh': 15,
  'ban-chainsaw-man': 15,
  'ban-vinland': 15,
  // Level 5: Genin
  'ban-demon-slayer': 5,
  'ban-jjk': 5,
  'ban-mob-psycho': 5,
  // Expanded Banner Requirements
  'ban-my-hero-academia-season-2': 5,
  'ban-attack-on-titan-final-season': 5,
  'ban-the-promised-neverland': 5,
  'ban-assassination-classroom': 5,
  'ban-mob-psycho-100': 5,
  'ban-re-zero-starting-life-in-another-world': 5,
  'ban-your-lie-in-april': 5,
  'ban-attack-on-titan-season-3-part-2': 5,
  'ban-naruto-shippuden': 5,
  'ban-erased': 5,
  'ban-my-hero-academia-season-3': 5,
  'ban-black-clover': 5,
  'ban-haikyu': 5,
  'ban-rascal-does-not-dream-of-bunny-girl-senpai': 5,
  'ban-spy-x-family': 15,
  'ban-kaguya-sama-love-is-war': 15,
  'ban-dr-stone': 15,
  'ban-vinland-saga': 15,
  'ban-violet-evergarden': 15,
  'ban-horimiya': 15,
  'ban-toradora': 15,
  'ban-no-game-no-life': 15,
  'ban-akame-ga-kill': 15,
  'ban-noragami': 15,
  'ban-my-hero-academia-season-4': 15,
  'ban-the-seven-deadly-sins': 15,
  'ban-konosuba-god-s-blessing-on-this-wonderful-world': 15,
  'ban-demon-slayer-kimetsu-no-yaiba-the-movie-mugen-train': 15,
  'ban-code-geass-lelouch-of-the-rebellion': 25,
  'ban-darling-in-the-franxx': 25,
  'ban-parasyte-the-maxim': 25,
  'ban-neon-genesis-evangelion': 25,
  'ban-jujutsu-kaisen-season-2': 25,
  'ban-frieren-beyond-journey-s-end': 25,
  'ban-demon-slayer-kimetsu-no-yaiba-entertainment-district-arc': 25,
  'ban-fire-force': 25,
  'ban-spirited-away': 25,
  'ban-jojo-s-bizarre-adventure-tv': 25,
  'ban-cowboy-bebop': 50,
  'ban-one-punch-man-season-2': 50,
  'ban-death-parade': 50,
  'ban-that-time-i-got-reincarnated-as-a-slime': 50,
  'ban-mushoku-tensei-jobless-reincarnation': 50,
  'ban-the-rising-of-the-shield-hero': 50,
};

const AURA_LEVEL_REQUIREMENTS = {
  'sakura': 5,
  'electric': 10,
  'fire': 15,
  'purple': 25,
  'gold': 50
};

// Rate limit memory store: userId -> { lastAwardAt, xpThisHour, hourStart }
const userXpRateLimitMap = new Map();

async function awardUserXpInternal(userId, requestedAmount = 10, reason = 'episode_watched', epKey = null, metadata = {}) {
  const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
  if (!user) return { success: false, error: 'User not found' };

  const isAdmin = user.role === 'ADMIN';
  const now = Date.now();

  // Episode-level deduplication:
  const watchedEpisodes = getUserWatchedEpisodes(user.id);
  if (epKey && watchedEpisodes[epKey] && watchedEpisodes[epKey].xpAwarded) {
    const awardedAt = new Date(watchedEpisodes[epKey].xpAwardedAt || 0).getTime();
    // Allow rewatch XP only after 30 minutes cooldown
    if (now - awardedAt < 1800000) {
      const xpNext = (user.level || 1) * 200;
      return {
        success: true,
        alreadyAwarded: true,
        xpGained: 0,
        xp: user.xp || 0,
        level: user.level || 1,
        xpNextLevel: xpNext,
        xpPercent: Math.min(100, Math.round(((user.xp || 0) / xpNext) * 100)),
        vipRank: user.vipRank || 'GENIN',
        leveledUp: false
      };
    }
  }

  // Anti-cheat rate limiting for regular non-admin users
  if (!isAdmin) {
    const rateInfo = userXpRateLimitMap.get(user.id) || { lastAwardAt: 0, xpThisHour: 0, hourStart: now };
    // Cooldown: at least 10 seconds between XP gain events
    if (now - rateInfo.lastAwardAt < 10000) {
      return {
        success: false,
        rateLimited: true,
        error: 'Streaming too fast. Please stream naturally to earn rewards.'
      };
    }
    // Hourly cap: maximum 800 XP per hour
    if (now - rateInfo.hourStart > 3600000) {
      rateInfo.xpThisHour = 0;
      rateInfo.hourStart = now;
    }
    if (rateInfo.xpThisHour >= 800) {
      return {
        success: false,
        rateLimited: true,
        error: 'Hourly XP cap reached. Continue watching to level up again next hour!'
      };
    }
    rateInfo.lastAwardAt = now;
    rateInfo.xpThisHour += requestedAmount;
    userXpRateLimitMap.set(user.id, rateInfo);
  }

  const amount = Math.max(1, Math.min(isAdmin ? 500 : 50, parseInt(requestedAmount) || 10));
  let newXp = (user.xp || 0) + amount;
  let newLevel = user.level || 1;
  let leveledUp = false;

  let threshold = newLevel * 200;
  while (newXp >= threshold) {
    newXp -= threshold;
    newLevel += 1;
    leveledUp = true;
    threshold = newLevel * 200;
  }

  const newRank = calculateOtakuRank(newLevel, user.vipRank, user.role);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      xp: newXp,
      level: newLevel,
      vipRank: newRank
    }
  });

  // Mark episode as awarded in watched_episodes
  if (epKey) {
    watchedEpisodes[epKey] = {
      ...(watchedEpisodes[epKey] || {}),
      episodeKey: epKey,
      ...metadata,
      xpAwarded: true,
      xpAwardedAt: new Date().toISOString(),
      lastWatchedAt: new Date().toISOString()
    };
    saveUserWatchedEpisodes(user.id, watchedEpisodes);
  }

  const xpNext = (updated.level || 1) * 200;
  return {
    success: true,
    xpGained: amount,
    xp: updated.xp,
    level: updated.level,
    xpNextLevel: xpNext,
    xpPercent: Math.min(100, Math.round((updated.xp / xpNext) * 100)),
    vipRank: updated.vipRank,
    leveledUp
  };
}

// GET /api/user/profile - Fetch current user's complete profile & otaku stats
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        watchlist: {
          include: { show: true }
        }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Calculate watch stats
    const watchedMap = getUserWatchedEpisodes(req.user.id) || {};
    const watchedList = Object.values(watchedMap);
    const animeHistory = getUserAnimeHistory(req.user.id) || [];
    const dbHistory = await prisma.watchHistory.findMany({
      where: { userId: req.user.id }
    });

    const uniqueEpKeys = new Set();
    watchedList.forEach(e => {
      if (e.episodeKey) uniqueEpKeys.add(e.episodeKey);
    });
    animeHistory.forEach(h => {
      const k = h.episodeId || (h.lunarId ? `lunar-${h.lunarId}-${h.episodeNumber || 1}` : null);
      if (k) uniqueEpKeys.add(k);
    });
    dbHistory.forEach(h => {
      if (h.episodeId) uniqueEpKeys.add(`db-${h.episodeId}`);
    });

    let totalWatchSec = 0;
    watchedList.forEach(e => { totalWatchSec += (e.progress || 0); });
    if (totalWatchSec === 0) {
      animeHistory.forEach(h => { totalWatchSec += (h.progress || 0); });
      dbHistory.forEach(h => { totalWatchSec += (h.progress || 0); });
    }

    const totalHours = Math.round((totalWatchSec / 3600) * 10) / 10;
    const totalEpisodes = Math.max(uniqueEpKeys.size, animeHistory.length + dbHistory.length);

    const xpNext = (user.level || 1) * 200;
    const currentXp = user.xp || 0;
    const rank = user.vipRank || calculateOtakuRank(user.level || 1, user.vipRank, user.role);

    let userTopAnime = user.topAnime;
    if (typeof userTopAnime === 'string') {
      try { userTopAnime = JSON.parse(userTopAnime); } catch (e) { userTopAnime = null; }
    }
    if (!Array.isArray(userTopAnime)) {
      userTopAnime = [];
    }

    res.json({
      id: user.id,
      email: user.email,
      username: user.username || user.email.split('@')[0],
      role: user.role,
      vipRank: rank,
      level: user.level || 1,
      xp: currentXp,
      xpNextLevel: xpNext,
      xpPercent: Math.min(100, Math.round((currentXp / xpNext) * 100)),
      bio: user.bio || '',
      avatarUrl: user.avatarUrl || null,
      avatarFrame: (user.role !== 'ADMIN' && (user.avatarFrame === 'gold' || user.avatarFrame === 'aura-gold')) ? 'default' : (user.avatarFrame || 'default'),
      bannerUrl: user.bannerUrl || null,
      accentColor: user.accentColor || '#ff0055',
      topAnime: userTopAnime,
      isPrivate: Boolean(user.isPrivate),
      createdAt: user.createdAt,
      stats: {
        totalHoursWatched: totalHours,
        totalEpisodesWatched: totalEpisodes,
        watchlistCount: user.watchlist.length,
        recentHistory: animeHistory.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/user/profile - Update user profile customization
router.put('/profile', authenticate, async (req, res) => {
  try {
    const {
      userId,
      targetUserId,
      username,
      bio,
      avatarUrl,
      avatarFrame,
      bannerUrl,
      accentColor,
      topAnime,
      isPrivate,
      level
    } = req.body;

    // Strict Account Ownership Check: Only the owner (or ADMIN) can update profile
    const requestedTarget = targetUserId || userId;
    if (requestedTarget && String(requestedTarget) !== String(req.user.id) && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Access Denied: Only the account owner has ownership and permission to modify this account.'
      });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    const isAdmin = currentUser.role === 'ADMIN';

    const data = {};
    if (username !== undefined) data.username = String(username).trim().slice(0, 30);
    if (bio !== undefined) data.bio = String(bio).trim().slice(0, 500);
    if (accentColor !== undefined) data.accentColor = String(accentColor).trim();
    if (isPrivate !== undefined) data.isPrivate = Boolean(isPrivate);

    // ANTI-CHEAT & AUTHENTICITY: Validate topAnime showcase
    // Only anime that the user has completed may be added to their showcase
    if (topAnime !== undefined) {
      if (topAnime === null || (Array.isArray(topAnime) && topAnime.length === 0)) {
        data.topAnime = null;
      } else if (Array.isArray(topAnime)) {
        const completedList = await getAggregatedCompletedAnime(req.user.id);
        const completedKeySet = new Set(
          completedList.map(a => String(a.id || a.showId || a.lunarId || ''))
        );
        const completedTitleSet = new Set(
          completedList.map(a => String(a.title || '').trim().toLowerCase())
        );

        const validatedTopAnime = [];
        for (const item of topAnime.slice(0, 3)) {
          if (!item) continue;
          const itemId = String(item.id || item.showId || item.lunarId || '');
          const itemTitle = String(item.title || '').trim().toLowerCase();

          const isCompleted = completedKeySet.has(itemId) || completedTitleSet.has(itemTitle);
          if (!isCompleted && !isAdmin) {
            return res.status(400).json({
              error: `Cannot showcase "${item.title || 'Anime'}": Only anime you have completed can be added to your Hall of Fame Showcase.`
            });
          }

          validatedTopAnime.push({
            id: item.id || itemId,
            title: String(item.title || 'Untitled Anime').trim(),
            poster: String(item.poster || '').trim(),
            banner: String(item.banner || item.poster || '').trim(),
            rating: typeof item.rating === 'number' ? item.rating : parseFloat(item.rating) || 8.0,
            type: String(item.type || 'series'),
            genres: String(item.genres || item.genre || 'Anime'),
            episodesCount: item.episodesCount ? (parseInt(item.episodesCount, 10) || item.episodesCount) : null,
            completedAt: item.completedAt || new Date().toISOString()
          });
        }

        data.topAnime = validatedTopAnime;
      }
    }

    // ANTI-CHEAT: Only administrators have privileges to manually set/override user level
    if (level !== undefined) {
      if (!isAdmin) {
        return res.status(403).json({
          error: 'Access denied: Only administrators have privileges to manually adjust levels.'
        });
      }
      const parsedLvl = Math.max(1, Math.min(100, parseInt(level) || 1));
      data.level = parsedLvl;
      data.vipRank = calculateOtakuRank(parsedLvl, currentUser.vipRank, currentUser.role);
    }

    const effectiveLevel = (isAdmin && data.level !== undefined) ? data.level : (currentUser.level || 1);

    // ANTI-CHEAT: Validate avatar lock level requirement
    if (avatarUrl !== undefined) {
      const cleanAvatar = avatarUrl ? String(avatarUrl).trim() : null;
      if (cleanAvatar && !isAdmin) {
        for (const [key, reqLvl] of Object.entries(AVATAR_LEVEL_REQUIREMENTS)) {
          if (cleanAvatar.includes(key) && effectiveLevel < reqLvl) {
            return res.status(403).json({
              error: `Access Denied: This avatar requires Level ${reqLvl}. You are currently Level ${effectiveLevel}.`
            });
          }
        }
      }
      data.avatarUrl = cleanAvatar;
    }

    // ANTI-CHEAT: Validate banner lock level requirement
    if (bannerUrl !== undefined) {
      const cleanBanner = bannerUrl ? String(bannerUrl).trim() : null;
      if (cleanBanner && !isAdmin) {
        for (const [key, reqLvl] of Object.entries(BANNER_LEVEL_REQUIREMENTS)) {
          if (cleanBanner.includes(key) && effectiveLevel < reqLvl) {
            return res.status(403).json({
              error: `Access Denied: This hero banner requires Level ${reqLvl}. You are currently Level ${effectiveLevel}.`
            });
          }
        }
      }
      data.bannerUrl = cleanBanner;
    }

    // ANTI-CHEAT: Validate aura frame lock level & admin-only requirement
    if (avatarFrame !== undefined) {
      const cleanFrame = String(avatarFrame).trim();
      if (cleanFrame) {
        // ADMIN-ONLY RESTRICTION: Super Saiyan God aura frame is reserved exclusively for Admins
        if ((cleanFrame === 'gold' || cleanFrame === 'aura-gold') && !isAdmin) {
          return res.status(403).json({
            error: 'Access Denied: The Super Saiyan God animated aura frame is exclusive to Administrators.'
          });
        }
        if (!isAdmin && AURA_LEVEL_REQUIREMENTS[cleanFrame]) {
          const reqLvl = AURA_LEVEL_REQUIREMENTS[cleanFrame];
          if (effectiveLevel < reqLvl) {
            return res.status(403).json({
              error: `Access Denied: This aura frame requires Level ${reqLvl}. You are currently Level ${effectiveLevel}.`
            });
          }
        }
      }
      data.avatarFrame = cleanFrame;
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data
    });

    res.json({
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        username: updated.username || updated.email.split('@')[0],
        role: updated.role,
        vipRank: updated.vipRank,
        level: updated.level,
        xp: updated.xp,
        bio: updated.bio,
        avatarUrl: updated.avatarUrl,
        avatarFrame: updated.avatarFrame,
        bannerUrl: updated.bannerUrl,
        accentColor: updated.accentColor,
        topAnime: updated.topAnime,
        isPrivate: Boolean(updated.isPrivate)
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/user/xp - Award XP for watching or participating
router.post('/xp', authenticate, async (req, res) => {
  try {
    const { episodeId, lunarId, episodeNumber, inWatchParty, amount, reason } = req.body;
    let epKey = null;
    if (episodeId) {
      if (String(episodeId).startsWith('lunar-')) {
        epKey = String(episodeId);
      } else if (isNaN(parseInt(episodeId))) {
        epKey = `lunar-${lunarId || 'anime'}-${episodeNumber || 1}`;
      } else {
        epKey = `db-${episodeId}`;
      }
    } else if (lunarId) {
      epKey = `lunar-${lunarId}-${episodeNumber || 1}`;
    }

    const isParty = Boolean(inWatchParty || reason === 'watch_party');
    const xpAmount = parseInt(amount) || (isParty ? 25 : 10);
    const xpReason = reason || (isParty ? 'watch_party' : 'episode_watched');

    const result = await awardUserXpInternal(req.user.id, xpAmount, xpReason, epKey, req.body);
    if (!result.success && result.rateLimited) {
      return res.status(429).json({ error: result.error, xp: result.xp, level: result.level });
    }
    res.json(result);
  } catch (error) {
    console.error('Error awarding XP:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/user/profile/:id - Public profile view
router.get('/profile/:id', async (req, res) => {
  try {
    const target = req.params.id;
    let user;

    if (!isNaN(parseInt(target))) {
      user = await prisma.user.findUnique({ where: { id: parseInt(target) } });
    }
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: target },
            { email: target },
            { email: { startsWith: target + '@' } }
          ]
        }
      });
    }

    if (!user) return res.status(404).json({ error: 'Otaku profile not found' });

    const watchedMap = getUserWatchedEpisodes(user.id) || {};
    const watchedList = Object.values(watchedMap);
    const animeHistory = getUserAnimeHistory(user.id) || [];
    const uniqueEpKeys = new Set();
    watchedList.forEach(e => { if (e.episodeKey) uniqueEpKeys.add(e.episodeKey); });
    animeHistory.forEach(h => {
      const k = h.episodeId || (h.lunarId ? `lunar-${h.lunarId}-${h.episodeNumber || 1}` : null);
      if (k) uniqueEpKeys.add(k);
    });

    let totalWatchSec = 0;
    watchedList.forEach(e => { totalWatchSec += (e.progress || 0); });
    if (totalWatchSec === 0) {
      animeHistory.forEach(h => { totalWatchSec += (h.progress || 0); });
    }
    const totalHours = Math.round((totalWatchSec / 3600) * 10) / 10;
    const totalEpisodes = Math.max(uniqueEpKeys.size, animeHistory.length);

    let watchlistCount = 0;
    let publicWatchlist = [];
    try {
      watchlistCount = await prisma.watchlist.count({ where: { userId: user.id } });
      if (!user.isPrivate) {
        const wl = await prisma.watchlist.findMany({
          where: { userId: user.id },
          include: { show: true },
          orderBy: { createdAt: 'desc' },
          take: 12
        });
        publicWatchlist = wl.map(item => item.show).filter(Boolean);
      }
    } catch (e) {}

    const xpNext = (user.level || 1) * 200;
    const currentXp = user.xp || 0;

    let userTopAnime = user.topAnime;
    if (typeof userTopAnime === 'string') {
      try { userTopAnime = JSON.parse(userTopAnime); } catch (e) { userTopAnime = []; }
    }
    if (!Array.isArray(userTopAnime)) {
      userTopAnime = [];
    }

    res.json({
      id: user.id,
      email: user.isPrivate ? null : user.email,
      username: user.username || user.email.split('@')[0],
      role: user.role,
      vipRank: user.vipRank || 'GENIN',
      level: user.level || 1,
      xp: currentXp,
      xpNextLevel: xpNext,
      xpPercent: Math.min(100, Math.round((currentXp / xpNext) * 100)),
      bio: user.bio || '',
      avatarUrl: user.avatarUrl,
      avatarFrame: (user.role !== 'ADMIN' && (user.avatarFrame === 'gold' || user.avatarFrame === 'aura-gold')) ? 'default' : (user.avatarFrame || 'default'),
      bannerUrl: user.bannerUrl,
      accentColor: user.accentColor || '#ff0055',
      topAnime: userTopAnime,
      isPrivate: Boolean(user.isPrivate),
      createdAt: user.createdAt,
      watchlist: publicWatchlist,
      stats: {
        totalHoursWatched: totalHours,
        totalEpisodesWatched: totalEpisodes,
        watchlistCount: watchlistCount,
        recentHistory: user.isPrivate ? [] : animeHistory.slice(0, 6)
      }
    });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
