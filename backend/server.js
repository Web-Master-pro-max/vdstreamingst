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
const transcodeQueueManager = require('./services/TranscodeQueueManager');

// Auto-sync any unfinished transcode tasks from DB into sequential queue
transcodeQueueManager.syncPendingFromDB();

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS for frontend flexibility
app.use(cors());

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
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/comments', commentsRouter);

// Settings Endpoint
// Resolve uploads directory for persistent settings storage
const settingsPath = fs.existsSync('/app/uploads') 
    ? '/app/uploads/settings.json' 
    : path.join(__dirname, '../uploads/settings.json');

app.get('/api/settings', (req, res) => {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      res.json(JSON.parse(data));
    } else {
      res.json({ bannerSlideTime: 6000 });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const { bannerSlideTime } = req.body;
    let settings = { bannerSlideTime: 6000 };
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
    if (bannerSlideTime) {
      settings.bannerSlideTime = parseInt(bannerSlideTime, 10) || 6000;
    }
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write settings' });
  }
});

// Resolve directories dynamically (supports both Docker and native system execution)
const uploadsPath = fs.existsSync('/app/uploads') ? '/app/uploads' : path.join(__dirname, '../uploads');
const frontendPath = fs.existsSync('/app/frontend') ? '/app/frontend' : path.join(__dirname, '../frontend');
const videoPlayerPath = path.join(frontendPath, 'video-player');

// Ensure native uploads directory exists if missing
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Serve uploads folder for raw verification or local testing fallback
app.use('/uploads', express.static(uploadsPath));

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
