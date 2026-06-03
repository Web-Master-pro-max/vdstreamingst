const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get featured shows for carousel
router.get('/carousel', async (req, res) => {
  try {
    const featuredShows = await prisma.show.findMany({
      where: { isFeatured: true },
      take: 5,
      orderBy: { rating: 'desc' },
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
    });

    // If no featured shows exist, fallback to top rated shows
    if (featuredShows.length === 0) {
      const topShows = await prisma.show.findMany({
        take: 5,
        orderBy: { rating: 'desc' },
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
      });
      return res.json(topShows);
    }

    res.json(featuredShows);
  } catch (error) {
    console.error('Error fetching carousel shows:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get shows grouped by categories (for home grid sections)
router.get('/categories', async (req, res) => {
  try {
    const categoriesWithShows = await prisma.category.findMany({
      include: {
        shows: {
          include: {
            show: {
              include: {
                categories: {
                  include: {
                    category: true
                  }
                },
                episodes: {
                  orderBy: { episodeNumber: 'asc' },
                }
              }
            },
          },
        },
      },
    });

    // Clean up response structure: map categories to include flat list of shows
    const result = categoriesWithShows.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      shows: cat.shows.map(cs => cs.show),
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Search shows
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    const shows = await prisma.show.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
        ],
      },
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
    });

    res.json(shows);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get single show by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid show ID.' });
    }

    const show = await prisma.show.findUnique({
      where: { id },
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
    });

    if (!show) {
      return res.status(404).json({ error: 'Show not found.' });
    }

    res.json(show);
  } catch (error) {
    console.error('Error fetching show:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get single episode by ID (for the video player)
router.get('/episodes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid episode ID.' });
    }

    const episode = await prisma.episode.findUnique({
      where: { id },
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
              select: {
                id: true,
                episodeNumber: true,
                title: true,
                duration: true,
                transcodeStatus: true,
              },
            },
          },
        },
      },
    });

    if (!episode) {
      return res.status(404).json({ error: 'Episode not found.' });
    }

    // Increment episode views
    await prisma.episode.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    res.json(episode);
  } catch (error) {
    console.error('Error fetching episode:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
