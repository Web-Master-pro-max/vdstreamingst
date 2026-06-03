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

    // Clean data structure
    const cleanedHistory = history.map(item => ({
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

    res.json(cleanedHistory);
  } catch (error) {
    console.error('Error fetching watch history:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Save/Update watch progress
router.post('/history', authenticate, async (req, res) => {
  try {
    const { episodeId, progress, duration } = req.body;

    if (!episodeId || progress === undefined || !duration) {
      return res.status(400).json({ error: 'Episode ID, progress, and duration are required.' });
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
