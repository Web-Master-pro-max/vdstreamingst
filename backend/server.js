const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from current directory, parent root directory, or working directory
const possibleEnvPaths = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', '.env'),
  path.join(process.cwd(), '.env')
];
for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
dotenv.config();

if (!process.env.DATABASE_URL) {
  const dbHost = process.env.MYSQL_HOST || 'localhost';
  const dbPort = process.env.MYSQL_PORT || '3306';
  const dbUser = process.env.MYSQL_USER || 'root';
  const dbPass = process.env.MYSQL_PASSWORD || '9981';
  const dbName = process.env.MYSQL_DB || 'infinx';
  process.env.DATABASE_URL = `mysql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;
}

const authRouter = require('./routes/auth');
const showsRouter = require('./routes/shows');
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const webhooksRouter = require('./routes/webhooks');
const commentsRouter = require('./routes/comments');
const lunarxRouter = require('./routes/lunarx');
const transcodeQueueManager = require('./services/TranscodeQueueManager');
const jwt = require('jsonwebtoken');
const { authenticate, requireAdmin } = require('./middleware/auth');

// Auto-sync any unfinished transcode tasks from DB into sequential queue
transcodeQueueManager.syncPendingFromDB();
transcodeQueueManager.startRedisWatcher();

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS for frontend flexibility
app.use(cors());

// HTTP Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Parse requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/shows', showsRouter);
app.use('/api/lunarx', lunarxRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/comments', commentsRouter);

const realtimeService = require('./services/RealtimeService');

// Public Community Live Chat API
app.get('/api/public-chat/messages', (req, res) => {
  res.json(realtimeService.getPublicMessages());
});

app.post('/api/public-chat/messages', (req, res) => {
  const { user, text, role, avatar, avatarFrame, sticker, gif, mention, level, rank } = req.body;
  const msg = realtimeService.addPublicMessage(user, text, role, { avatar, avatarFrame, sticker, gif, mention, level, rank });
  if (!msg) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }
  res.json(msg);
});

app.get('/api/public-chat/poll', (req, res) => {
  res.json(realtimeService.getPublicPoll());
});

app.post('/api/public-chat/poll/vote', (req, res) => {
  const { optionId } = req.body;
  const poll = realtimeService.votePoll(optionId);
  res.json(poll);
});

// Admin Delete Public Chat Message Endpoint
app.delete('/api/public-chat/messages/:id', authenticate, requireAdmin, (req, res) => {
  const messageId = req.params.id;
  const deleted = realtimeService.deletePublicMessage(messageId);
  if (!deleted) {
    return res.status(404).json({ error: 'Message not found or already deleted.' });
  }
  res.json({ success: true, messageId });
});



// Mobile APK Direct Download Endpoint
app.get('/api/download/app', (req, res) => {
  const possibleApkPaths = [
    path.join(__dirname, '../uploads/infinx-app.apk'),
    path.join(__dirname, '../mobile/android/app/build/outputs/apk/release/app-release.apk'),
    path.join(__dirname, '../mobile/android/app/build/outputs/apk/debug/app-debug.apk')
  ];
  const apkFile = possibleApkPaths.find(p => fs.existsSync(p));
  if (apkFile) {
    return res.download(apkFile, 'infinx-anime.apk');
  }
  res.redirect('https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500');
});

// Load persistent storage settings from settings.json if present
try {
  const defaultUploads = fs.existsSync('/app/uploads') ? '/app/uploads' : path.join(__dirname, '../uploads');
  const tempSettingsFile = path.join(defaultUploads, 'settings.json');
  if (fs.existsSync(tempSettingsFile)) {
    const s = JSON.parse(fs.readFileSync(tempSettingsFile, 'utf8'));
    if (s.storageType && !process.env.STORAGE_TYPE) {
      process.env.STORAGE_TYPE = s.storageType;
    }
    if (s.localStoragePath && !process.env.LOCAL_STORAGE_PATH) {
      process.env.LOCAL_STORAGE_PATH = s.localStoragePath;
    }
  }
} catch (e) { }

// Resolve directories dynamically (supports custom laptop storage path, Docker, and native)
const { getUploadsDir } = require('./s3');
const uploadsPath = getUploadsDir();
const settingsPath = path.join(uploadsPath, 'settings.json');

// Settings Endpoint (Public only receives safe display properties; Admins receive full config)
app.get('/api/settings', (req, res) => {
  try {
    let settings = { bannerSlideTime: 6000 };
    if (fs.existsSync(settingsPath)) {
      try {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      } catch (e) { }
    }

    const payload = {
      bannerSlideTime: settings.bannerSlideTime || 6000,
    };

    // Only expose internal storage paths and S3 bucket details if requested by an Admin
    let isAdmin = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'infinx_anime_jwt_secret_key_9981');
        if (decoded && decoded.role === 'ADMIN') {
          isAdmin = true;
        }
      } catch (e) { }
    }

    if (isAdmin) {
      payload.storageType = settings.storageType || process.env.STORAGE_TYPE || 'local';
      payload.localStoragePath = settings.localStoragePath || process.env.LOCAL_STORAGE_PATH || uploadsPath;
      payload.s3Bucket = process.env.AWS_S3_BUCKET || 'serverbuket-12';
      payload.s3Region = process.env.AWS_REGION || 'ap-south-1';
    }

    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// Settings Modification Endpoint (Protected - Admin only)
app.post('/api/settings', authenticate, requireAdmin, (req, res) => {
  try {
    const { bannerSlideTime, storageType, localStoragePath } = req.body;
    let settings = { bannerSlideTime: 6000 };
    if (fs.existsSync(settingsPath)) {
      try {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      } catch (e) { }
    }
    if (bannerSlideTime) {
      settings.bannerSlideTime = parseInt(bannerSlideTime, 10) || 6000;
    }
    if (storageType) {
      const cleanType = storageType.toLowerCase().trim();
      settings.storageType = cleanType;
      process.env.STORAGE_TYPE = cleanType;
    }
    if (localStoragePath !== undefined) {
      const cleanPath = (localStoragePath || '').trim();
      settings.localStoragePath = cleanPath;
      process.env.LOCAL_STORAGE_PATH = cleanPath;
      if (cleanPath && !fs.existsSync(cleanPath)) {
        try { fs.mkdirSync(cleanPath, { recursive: true }); } catch (e) { }
      }
    }
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write settings' });
  }
});

const frontendPath = fs.existsSync('/app/frontend') ? '/app/frontend' : path.join(__dirname, '../frontend');
const videoPlayerPath = path.join(frontendPath, 'video-player');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Serve uploads folder for videos, posters, banners, and HLS streams
// Restrict raw uploaded video files, staging chunk directories, and settings.json from direct public download
app.use('/uploads', (req, res, next) => {
  const reqPath = (req.path || '').toLowerCase();
  if (
    reqPath.startsWith('/raw-') ||
    reqPath.includes('/chunks_') ||
    reqPath.includes('/transcode_') ||
    reqPath === '/settings.json' ||
    reqPath.endsWith('/settings.json') ||
    /\.(mkv|avi|mov)$/i.test(reqPath)
  ) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  next();
});

app.use('/uploads', express.static(uploadsPath));
app.use('/posters', express.static(path.join(uploadsPath, 'posters')));
app.use('/banners', express.static(path.join(uploadsPath, 'banners')));
app.use('/assets', express.static(path.join(frontendPath, 'assets')));

// Fallback resolver for image files requested at root (e.g. /1791215324723-abc.jpg)
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const ext = path.extname(req.path).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) return next();

  // If exact file exists inside frontend directory, serve it
  const directFrontendPath = path.join(frontendPath, req.path.replace(/^\//, ''));
  if (fs.existsSync(directFrontendPath) && !fs.statSync(directFrontendPath).isDirectory()) {
    return res.sendFile(directFrontendPath);
  }

  const fileName = path.basename(req.path);
  const possiblePaths = [
    path.join(uploadsPath, 'posters', fileName),
    path.join(uploadsPath, 'banners', fileName),
    path.join(uploadsPath, fileName),
    path.join(__dirname, '../uploads/posters', fileName),
    path.join(__dirname, '../uploads/banners', fileName),
    path.join(__dirname, '../uploads', fileName),
    path.join(frontendPath, 'Postes', fileName),
    path.join(frontendPath, 'Horror-poster', fileName),
    path.join(frontendPath, 'assets', 'avatars', fileName),
    path.join(frontendPath, 'assets', 'banners', fileName),
  ];

  const foundPath = possiblePaths.find(p => fs.existsSync(p));
  if (foundPath) {
    return res.sendFile(foundPath);
  }

  // If an image asset is requested but not found, send default poster fallback to prevent console 404s
  const fallbackCandidates = [
    path.join(frontendPath, 'Postes', 'spyfamS3p.jpg'),
    path.join(frontendPath, 'Postes', 'spyfamS3.jpg'),
    path.join(frontendPath, 'Postes', 'infinit-cas11.jpg')
  ];
  const foundFallback = fallbackCandidates.find(p => fs.existsSync(p));
  if (foundFallback) {
    return res.sendFile(foundFallback);
  }
  next();
});

// Clean Video Player Route at '/watch' (e.g. /watch?id=1735&ep=1&t=681)
app.get('/watch', (req, res) => {
  res.sendFile(path.join(videoPlayerPath, 'index.html'));
});

// Serve Video Player static files at '/video-player' path
app.use('/video-player', express.static(videoPlayerPath));

// Serve Static Frontend Site at root path '/'
app.use('/', express.static(frontendPath));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

// Start listening
const server = app.listen(PORT, () => {
  console.log(`🚀 Infinx Streaming API Server running on port ${PORT}`);
});

// Attach real-time Socket.io engine for Public Live Chat and Watch Party
realtimeService.attach(server);

// Configure unlimited/extended timeouts for heavy HLS raw video uploads (prevents ERR_CONNECTION_RESET on 1GB+ uploads)
server.timeout = 0; // Unlimited
server.requestTimeout = 0; // Unlimited
server.keepAliveTimeout = 120000; // 2 minutes
server.headersTimeout = 125000; // 2 minutes

// Automated 48-hour (2 days) storage cleanup job for raw videos & abandoned upload chunks
function cleanupOldUploads() {
  try {
    if (!fs.existsSync(uploadsPath)) return;

    const files = fs.readdirSync(uploadsPath);
    const now = Date.now();
    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // 48 hours

    let deletedFilesCount = 0;
    let freedBytes = 0;

    files.forEach(file => {
      // Never delete persistent application assets (videos, posters, banners, settings)
      if (file === 'videos' || file === 'posters' || file === 'banners' || file === 'settings.json') {
        return;
      }

      const filePath = path.join(uploadsPath, file);
      try {
        const stats = fs.statSync(filePath);
        const ageMs = now - stats.mtimeMs;

        if (ageMs > TWO_DAYS_MS) {
          const isRawVideo = file.startsWith('raw-') || /\.(mkv|mp4|avi|mov|ts|m3u8)$/i.test(file);
          const isChunkDir = stats.isDirectory() && file.startsWith('chunks_');
          const isTranscodeDir = stats.isDirectory() && file.startsWith('transcode_');

          if (isRawVideo || isChunkDir || isTranscodeDir) {
            if (stats.isDirectory()) {
              fs.rmSync(filePath, { recursive: true, force: true });
              console.log(`🧹 Deleted old temp directory (>2 days): ${file}`);
            } else {
              freedBytes += stats.size;
              fs.unlinkSync(filePath);
              console.log(`🧹 Deleted old raw video file (>2 days): ${file}`);
            }
            deletedFilesCount++;
          }
        }
      } catch (err) {
        console.warn(`Could not check/delete file ${file}:`, err.message);
      }
    });

    if (deletedFilesCount > 0) {
      const freedMB = (freedBytes / (1024 * 1024)).toFixed(1);
      console.log(`✅ Automated cleanup finished: Removed ${deletedFilesCount} old item(s) (>2 days), freed ~${freedMB} MB disk space.`);
    }
  } catch (err) {
    console.error('Error running 2-day upload cleanup job:', err.message);
  }
}

// Run cleanup immediately on server boot, then scheduled every 6 hours
cleanupOldUploads();
setInterval(cleanupOldUploads, 6 * 60 * 60 * 1000);
