const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const authRouter = require('./routes/auth');
const showsRouter = require('./routes/shows');
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const webhooksRouter = require('./routes/webhooks');
const commentsRouter = require('./routes/comments');

const app = express();
const PORT = process.env.PORT || 5000;

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

// Configure larger timeouts for heavy HLS raw video uploads (prevents early termination on 1GB+ uploads)
server.timeout = 20 * 60 * 1000; // 20 minutes
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
