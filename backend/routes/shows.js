const express = require('express');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { getUploadsDir } = require('../s3');

const router = express.Router();
const prisma = new PrismaClient();

// Get all shows
router.get('/', async (req, res) => {
  try {
    const shows = await prisma.show.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        categories: {
          include: { category: true }
        },
        episodes: {
          orderBy: { episodeNumber: 'asc' }
        }
      }
    });
    res.json(shows);
  } catch (error) {
    console.error('Error fetching shows list:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

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

function formatEpisodeWithServers(ep) {
  if (!ep) return ep;
  const isS3 = (url) => url && (url.includes('amazonaws.com') || (url.startsWith('http') && !url.includes('/uploads/')));
  const isLocal = (url) => url && (url.startsWith('/uploads') || url.includes('/uploads/'));

  const s3Url = ep.s3Url || (isS3(ep.videoUrl) ? ep.videoUrl : null);
  const localUrl = ep.localUrl || (isLocal(ep.videoUrl) ? ep.videoUrl : null);

  const servers = [];
  if (s3Url) {
    servers.push({
      id: 's3',
      name: 'Server 1: AWS Cloud',
      shortName: 'Server 1 (AWS)',
      badge: 'AWS S3',
      url: s3Url,
      type: 'cloud'
    });
  }
  if (localUrl) {
    servers.push({
      id: 'local',
      name: 'Server 2: Laptop Local Storage',
      shortName: 'Server 2 (Laptop)',
      badge: 'Local Disk',
      url: localUrl,
      type: 'local'
    });
  }

  return {
    ...ep,
    s3Url,
    localUrl,
    servers,
    defaultServer: servers.length > 0 ? servers[0].id : null,
    videoUrl: ep.videoUrl || (servers.length > 0 ? servers[0].url : null)
  };
}

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

    const enrichedEpisodes = (show.episodes || []).map(formatEpisodeWithServers);
    res.json({
      ...show,
      episodes: enrichedEpisodes
    });
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

    let episode = null;
    try {
      episode = await prisma.episode.findUnique({
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
              },
            },
          },
        },
      });
    } catch (queryErr) {
      console.warn('Detailed episode query failed, trying basic query:', queryErr.message);
      episode = await prisma.episode.findUnique({
        where: { id },
      });
      if (episode && episode.showId) {
        try {
          episode.show = await prisma.show.findUnique({
            where: { id: episode.showId },
            include: {
              categories: { include: { category: true } },
              episodes: { orderBy: { episodeNumber: 'asc' } },
            },
          });
        } catch (e) {
          console.warn('Failed to load show for episode:', e.message);
        }
      }
    }

    if (!episode) {
      return res.status(404).json({ error: 'Episode not found.' });
    }

    // Auto-heal: If videoUrl is not set or status is not COMPLETED, check if master.m3u8 is already on disk
    if (!episode.videoUrl || episode.transcodeStatus !== 'COMPLETED') {
      try {
        const uploadsDir = getUploadsDir();
        const cleanKey = `videos/show_${episode.showId}/ep_${episode.id}`;
        const localMaster = path.join(uploadsDir, cleanKey, 'master.m3u8');
        if (fs.existsSync(localMaster)) {
          const resolvedUrl = `/uploads/${cleanKey}/master.m3u8`;
          episode.videoUrl = resolvedUrl;
          episode.transcodeStatus = 'COMPLETED';
          const completedStageDetails = JSON.stringify({
            uploadServer: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' },
            transcoding: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' },
            uploadS3: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' }
          });
          episode.stageDetails = completedStageDetails;

          // Asynchronously heal database without blocking response
          prisma.episode.update({
            where: { id: episode.id },
            data: {
              transcodeStatus: 'COMPLETED',
              videoUrl: resolvedUrl,
              stageDetails: completedStageDetails
            }
          }).catch(err => console.warn(`[Shows Auto-Heal DB] Ep #${episode.id}:`, err.message));
        }
      } catch (checkErr) {
        // Continue if disk check fails
      }
    }

    // Increment episode views safely
    try {
      await prisma.episode.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
    } catch (viewErr) {
      // Ignore view increment error
    }

    if (episode.show && Array.isArray(episode.show.episodes)) {
      episode.show.episodes = episode.show.episodes.map(formatEpisodeWithServers);
    }

    const formatted = formatEpisodeWithServers(episode);
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching episode:', error);
    res.status(500).json({ error: 'Internal server error: ' + (error.message || '') });
  }
});


module.exports = router;
