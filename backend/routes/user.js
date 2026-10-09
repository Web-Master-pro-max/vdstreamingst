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
    fs.writeFileSync(ANIME_HISTORY_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving anime history to file:', e);
  }
}

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
    const { episodeId, progress, duration, isLunar, lunarId } = req.body;

    if (!episodeId || progress === undefined || !duration) {
      return res.status(400).json({ error: 'Episode ID, progress, and duration are required.' });
    }

    // Handle dynamic Anime show progress
    if (isLunar || lunarId || isNaN(parseInt(episodeId))) {
      const anilistIdVal = lunarId || req.body.anilistId || (typeof episodeId === 'string' && episodeId.startsWith('lunar-') ? episodeId.split('-')[1] : null);
      const epNumVal = req.body.episodeNumber || (typeof episodeId === 'string' && episodeId.startsWith('lunar-') ? parseInt(episodeId.split('-')[2]) : 1);

      const animeHistoryItem = {
        id: `lunar-${anilistIdVal}-${epNumVal}`,
        userId: req.user.id,
        isLunar: true,
        lunarId: anilistIdVal,
        episodeId: `lunar-${anilistIdVal}-${epNumVal}`,
        episodeNumber: epNumVal,
        episodeTitle: req.body.episodeTitle || `Episode ${epNumVal}`,
        showTitle: req.body.showTitle || req.body.title || 'Anime Series',
        poster: req.body.poster || '',
        banner: req.body.banner || '',
        progress: parseFloat(progress),
        duration: parseFloat(duration),
        watchedAt: new Date().toISOString()
      };
      saveUserAnimeHistory(req.user.id, animeHistoryItem);
      return res.json({ success: true, isLunar: true, history: animeHistoryItem });
    }

    const episode = await prisma.episode.findUnique({ where: { id: parseInt(episodeId) } });
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
        progress: parseFloat(progress),
        duration: parseFloat(duration),
        watchedAt: new Date(),
      },
      create: {
        userId: req.user.id,
        episodeId: parseInt(episodeId),
        progress: parseFloat(progress),
        duration: parseFloat(duration),
      },
    });

    res.json({ success: true, history });
  } catch (error) {
    console.error('Error updating watch history:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
