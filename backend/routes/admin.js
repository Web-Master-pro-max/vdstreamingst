const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Redis = require('ioredis');
const { PrismaClient } = require('@prisma/client');
const { uploadToS3 } = require('../s3');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Connect to Redis for task queueing with clean native fallback retry behavior
let lastRedisErrorTime = 0;
const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    // Retries exponentially up to 30 seconds to prevent event-loop throttling
    return Math.min(times * 1000, 30000);
  }
});

// Catch and handle Redis connection errors gracefully without spamming terminal
redis.on('error', (err) => {
  const now = Date.now();
  if (now - lastRedisErrorTime > 30000) {
    console.warn('⚠️ Redis connection failed (running natively outside Docker-Compose). Task queueing is suspended: ', err.message);
    lastRedisErrorTime = now;
  }
});

// Multer config for image and video files (posters/banners) - in-memory
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Multer config for video uploads - disk storage on shared volume
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = fs.existsSync('/app/uploads') ? '/app/uploads' : path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'raw-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 } // 5GB limit
});

// GET /api/admin/shows - Fetch all shows for lists
router.get('/shows', authenticate, requireAdmin, async (req, res) => {
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
    console.error('Error fetching admin shows:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/admin/shows - Create new show (Poster S3 upload)
router.post('/shows', authenticate, requireAdmin, imageUpload.fields([{ name: 'poster', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, description, rating, year, runtime, badge, dubsub, categoryIds, isFeatured } = req.body;
    const type = req.body.type || 'series';

    if (!title || !description || !year || !runtime) {
      return res.status(400).json({ error: 'Required fields missing: title, description, year, runtime.' });
    }

    if (!req.files || !req.files['poster']) {
      return res.status(400).json({ error: 'Poster image file is required.' });
    }

    // Upload poster to S3
    const posterFile = req.files['poster'][0];
    const posterKey = `posters/${Date.now()}-${posterFile.originalname}`;
    console.log(`Uploading poster: ${posterKey} to S3...`);
    const posterUrl = await uploadToS3(posterKey, posterFile.buffer, posterFile.mimetype);

    // Upload banner to S3 if exists
    let bannerUrl = null;
    if (req.files['banner']) {
      const bannerFile = req.files['banner'][0];
      const bannerKey = `banners/${Date.now()}-${bannerFile.originalname}`;
      bannerUrl = await uploadToS3(bannerKey, bannerFile.buffer, bannerFile.mimetype);
    }

    // Parse category IDs
    let parsedCategoryIds = [];
    if (categoryIds) {
      if (Array.isArray(categoryIds)) {
        parsedCategoryIds = categoryIds.map(id => parseInt(id));
      } else if (typeof categoryIds === 'string') {
        try {
          const parsed = JSON.parse(categoryIds);
          if (Array.isArray(parsed)) {
            parsedCategoryIds = parsed.map(id => parseInt(id));
          } else {
            parsedCategoryIds = [parseInt(parsed)];
          }
        } catch (e) {
          parsedCategoryIds = categoryIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        }
      }
    }

    // Create show in DB
    const show = await prisma.show.create({
      data: {
        title,
        description,
        type,
        rating: parseFloat(rating) || 0.0,
        poster: posterUrl,
        banner: bannerUrl,
        year,
        runtime,
        badge: badge || 'HD',
        dubsub: dubsub === 'true' || dubsub === true,
        isFeatured: isFeatured === 'true' || isFeatured === true,
        categories: {
          create: parsedCategoryIds.map(id => ({
            category: { connect: { id } }
          }))
        }
      },
      include: {
        categories: {
          include: { category: true }
        }
      }
    });

    res.status(201).json(show);
  } catch (error) {
    console.error('Error creating show:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

const episodeUploadHandler = async (req, res) => {
  try {
    const showId = parseInt(req.params.id || req.body.showId);
    const { title, episodeNumber, description, duration } = req.body;

    if (!showId) {
      return res.status(400).json({ error: 'Show ID is required.' });
    }

    if (!title || !episodeNumber) {
      return res.status(400).json({ error: 'Title and episode number are required.' });
    }

    const show = await prisma.show.findUnique({ where: { id: showId } });
    if (!show) {
      return res.status(404).json({ error: 'Show not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Source video file is required.' });
    }

    const rawVideoPath = req.file.path; // Local disk path in shared volume

    // Create episode record in DB with PENDING transcodeStatus
    const episode = await prisma.episode.create({
      data: {
        showId,
        title,
        episodeNumber: parseInt(episodeNumber),
        description: description || '',
        duration: duration || '',
        transcodeStatus: 'PENDING',
      }
    });

    const s3FolderKey = `videos/show_${showId}/ep_${episode.id}/`;

    // Detect if Redis is connected
    const isRedisConnected = redis.status === 'ready';

    if (isRedisConnected) {
      // Enqueue task to Redis for Python worker
      const transcodeTask = {
        episodeId: episode.id,
        showId: showId,
        showTitle: show.title,
        episodeNumber: episode.episodeNumber,
        sourceVideoPath: rawVideoPath,
        s3FolderKey: s3FolderKey,
      };

      console.log(`Enqueueing transcode job to Redis for Episode ${episode.id}...`);
      await redis.lpush('transcode_tasks', JSON.stringify(transcodeTask));

      res.status(201).json({
        message: 'Episode created and transcoding task queued successfully to Redis queue.',
        episode,
      });
    } else {
      // Fallback: spawn background python child process to transcode natively on host
      console.log(`⚠️ Redis is offline. Spawning background child process to transcode Episode ${episode.id} natively...`);
      
      const { spawn } = require('child_process');
      const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
      const scriptPath = path.join(__dirname, '../../worker/converter_helper.py');

      // Update database to PROCESSING immediately to reflect in logs
      await prisma.episode.update({
        where: { id: episode.id },
        data: { transcodeStatus: 'PROCESSING' }
      });

      const binPath = path.join(__dirname, '../bin');
      const customEnv = { ...process.env };
      const pathKey = Object.keys(customEnv).find(k => k.toLowerCase() === 'path') || 'PATH';
      const originalPath = customEnv[pathKey] || '';
      customEnv[pathKey] = `${binPath};${originalPath}`;

      const child = spawn(pythonExecutable, [
        scriptPath,
        rawVideoPath,
        episode.id.toString(),
        showId.toString(),
        s3FolderKey
      ], {
        env: customEnv,
        shell: true
      });

      let stdoutData = '';
      let stderrData = '';

      child.stdout.on('data', (data) => {
        stdoutData += data.toString();
        // Log clean stdout lines
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => console.log(`[Transcoder stdout] ${line}`));
      });

      child.stderr.on('data', (data) => {
        stderrData += data.toString();
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => console.warn(`[Transcoder stderr] ${line}`));
      });

      child.on('close', async (code) => {
        console.log(`[Transcoder] Process exited with code ${code}`);
        if (code === 0) {
          const match = stdoutData.match(/SUCCESS_PLAYBACK_URL:\s*(https?:\/\/\S+)/);
          if (match && match[1]) {
            const playbackUrl = match[1];
            console.log(`✅ Local host transcoder finished successfully! URL: ${playbackUrl}`);
            await prisma.episode.update({
              where: { id: episode.id },
              data: {
                transcodeStatus: 'COMPLETED',
                videoUrl: playbackUrl
              }
            });
            return;
          }
        }

        console.error(`❌ Local host transcoder failed with code ${code}. Stderr: ${stderrData}`);
        await prisma.episode.update({
          where: { id: episode.id },
          data: { transcodeStatus: 'FAILED' }
        });
      });

      res.status(201).json({
        message: 'Episode created and native host background transcoding dispatched successfully.',
        episode,
      });
    }
  } catch (error) {
    console.error('Error uploading episode:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/admin/shows/:id/episodes - Add episode & upload raw video file (REST Path)
router.post('/shows/:id/episodes', authenticate, requireAdmin, videoUpload.single('video'), episodeUploadHandler);

// POST /api/admin/upload-episode-video - Add episode & upload raw video file (Frontend Path Alias)
router.post('/upload-episode-video', authenticate, requireAdmin, videoUpload.single('video'), episodeUploadHandler);

// GET /api/admin/tasks - Retrieve transcode statuses
router.get('/tasks', authenticate, requireAdmin, async (req, res) => {
  try {
    const episodes = await prisma.episode.findMany({
      where: {
        transcodeStatus: { in: ['PENDING', 'PROCESSING', 'FAILED', 'COMPLETED'] }
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        show: {
          select: { title: true }
        }
      },
      take: 50
    });
    res.json(episodes);
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/admin/shows/:id - Delete a show and all its episodes
router.delete('/shows/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const showId = parseInt(req.params.id);
    
    // First delete episodes associated with the show
    await prisma.episode.deleteMany({
      where: { showId }
    });
    
    // Delete categories links
    await prisma.categoryOnShow.deleteMany({
      where: { showId }
    });
    
    // Finally, delete the show itself
    await prisma.show.delete({
      where: { id: showId }
    });
    
    res.json({ message: 'Show and all its episodes deleted successfully.' });
  } catch (error) {
    console.error('Error deleting show:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/admin/episodes/:id - Delete a single episode
router.delete('/episodes/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const episodeId = parseInt(req.params.id);
    
    await prisma.episode.delete({
      where: { id: episodeId }
    });
    
    res.json({ message: 'Episode deleted successfully.' });
  } catch (error) {
    console.error('Error deleting episode:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/admin/shows/:id/feature - Fully customize banner overrides
router.post('/shows/:id/feature', authenticate, requireAdmin, imageUpload.fields([{ name: 'banner', maxCount: 1 }]), async (req, res) => {
  try {
    const showId = parseInt(req.params.id);
    const { titleOverride, descriptionOverride, isFeatured } = req.body;

    const show = await prisma.show.findUnique({ where: { id: showId } });
    if (!show) {
      return res.status(404).json({ error: 'Show not found.' });
    }

    let bannerUrl = show.banner;
    if (req.files && req.files['banner']) {
      const bannerFile = req.files['banner'][0];
      const bannerKey = `banners/${Date.now()}-${bannerFile.originalname}`;
      bannerUrl = await uploadToS3(bannerKey, bannerFile.buffer, bannerFile.mimetype);
    }

    const updatedShow = await prisma.show.update({
      where: { id: showId },
      data: {
        isFeatured: isFeatured === 'false' ? false : true,
        title: titleOverride || show.title,
        description: descriptionOverride || show.description,
        banner: bannerUrl
      }
    });

    res.json({ message: 'Show featured settings updated successfully.', show: updatedShow });
  } catch (error) {
    console.error('Error updating featured settings:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/admin/users - List all registered users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(users.map(({ passwordHash, ...u }) => u));
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/admin/users - Create new user / administrator
const bcrypt = require('bcryptjs');
router.post('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { email, password, role, isBanned } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: role || 'USER',
        isBanned: isBanned === 'true' || isBanned === true
      }
    });
    res.status(201).json({ id: user.id, email: user.email, role: user.role, isBanned: user.isBanned });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/admin/users/:id - Edit user role, email, password, or ban status
router.put('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { email, password, role, isBanned } = req.body;
    const data = {};
    if (email) data.email = email;
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }
    if (role) data.role = role;
    if (isBanned !== undefined) {
      data.isBanned = isBanned === 'true' || isBanned === true;
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data
    });
    res.json({ id: user.id, email: user.email, role: user.role, isBanned: user.isBanned });
  } catch (error) {
    console.error('Error editing user:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/admin/users/:id - Delete a user completely
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/admin/episodes/:id - Fully update and edit single episode metadata/source
router.put('/episodes/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const episodeId = parseInt(req.params.id);
    const { title, episodeNumber, description, duration, videoUrl, transcodeStatus } = req.body;
    const data = {};
    if (title) data.title = title;
    if (episodeNumber) data.episodeNumber = parseInt(episodeNumber);
    if (description !== undefined) data.description = description;
    if (duration !== undefined) data.duration = duration;
    if (videoUrl !== undefined) data.videoUrl = videoUrl;
    if (transcodeStatus !== undefined) data.transcodeStatus = transcodeStatus;
    const episode = await prisma.episode.update({
      where: { id: episodeId },
      data
    });
    res.json({ message: 'Episode updated successfully.', episode });
  } catch (error) {
    console.error('Error editing episode:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/admin/shows/:id - Fully update and edit single show metadata, poster/banner, categories
router.put('/shows/:id', authenticate, requireAdmin, imageUpload.fields([{ name: 'poster', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid show ID.' });
    }

    const { title, description, rating, year, runtime, badge, dubsub, categoryIds, isFeatured, type } = req.body;

    if (!title || !description || !year || !runtime) {
      return res.status(400).json({ error: 'Required fields missing: title, description, year, runtime.' });
    }

    const currentShow = await prisma.show.findUnique({ where: { id } });
    if (!currentShow) {
      return res.status(404).json({ error: 'Show not found.' });
    }

    let posterUrl = currentShow.poster;
    if (req.files && req.files['poster']) {
      const posterFile = req.files['poster'][0];
      const posterKey = `posters/${Date.now()}-${posterFile.originalname}`;
      console.log(`Uploading updated poster: ${posterKey} to S3...`);
      posterUrl = await uploadToS3(posterKey, posterFile.buffer, posterFile.mimetype);
    }

    let bannerUrl = currentShow.banner;
    if (req.files && req.files['banner']) {
      const bannerFile = req.files['banner'][0];
      const bannerKey = `banners/${Date.now()}-${bannerFile.originalname}`;
      console.log(`Uploading updated banner: ${bannerKey} to S3...`);
      bannerUrl = await uploadToS3(bannerKey, bannerFile.buffer, bannerFile.mimetype);
    }

    // Parse category IDs
    let parsedCategoryIds = [];
    if (categoryIds) {
      if (Array.isArray(categoryIds)) {
        parsedCategoryIds = categoryIds.map(catId => parseInt(catId));
      } else if (typeof categoryIds === 'string') {
        try {
          const parsed = JSON.parse(categoryIds);
          if (Array.isArray(parsed)) {
            parsedCategoryIds = parsed.map(catId => parseInt(catId));
          } else {
            parsedCategoryIds = [parseInt(parsed)];
          }
        } catch (e) {
          parsedCategoryIds = categoryIds.split(',').map(catId => parseInt(catId.trim())).filter(catId => !isNaN(catId));
        }
      }
    }

    // Update show categories and details via db transactions or consecutive updates
    await prisma.categoryOnShow.deleteMany({
      where: { showId: id }
    });

    const updatedShow = await prisma.show.update({
      where: { id },
      data: {
        title,
        description,
        type: type || 'series',
        rating: parseFloat(rating) || 0.0,
        poster: posterUrl,
        banner: bannerUrl,
        year,
        runtime,
        badge: badge || 'HD',
        dubsub: dubsub === 'true' || dubsub === true,
        isFeatured: isFeatured === 'true' || isFeatured === true,
        categories: {
          create: parsedCategoryIds.map(catId => ({
            category: { connect: { id: catId } }
          }))
        }
      },
      include: {
        categories: {
          include: { category: true }
        }
      }
    });

    res.json(updatedShow);
  } catch (error) {
    console.error('Error updating show:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
