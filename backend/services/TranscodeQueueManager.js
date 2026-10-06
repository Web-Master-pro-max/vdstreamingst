const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { getUploadsDir } = require('../s3');
const redis = require('../redis');
const prisma = new PrismaClient();

function getPythonExecutable() {
  if (process.env.PYTHON_EXECUTABLE && process.env.PYTHON_EXECUTABLE.trim()) {
    return process.env.PYTHON_EXECUTABLE.trim();
  }

  // Check virtual environment candidates first
  const projectRoot = path.join(__dirname, '../..');
  const workerDir = path.join(__dirname, '../../worker');
  const isWin = process.platform === 'win32';
  const binSub = isWin ? 'Scripts' : 'bin';
  const pyExeName = isWin ? 'python.exe' : 'python3';
  const pyAltExeName = isWin ? 'python.exe' : 'python';

  const venvDirs = [
    path.join(projectRoot, 'venv'),
    path.join(projectRoot, '.venv'),
    path.join(workerDir, 'venv'),
    path.join(workerDir, '.venv'),
  ];

  for (const venv of venvDirs) {
    const mainPy = path.join(venv, binSub, pyExeName);
    if (fs.existsSync(mainPy)) return mainPy;
    const altPy = path.join(venv, binSub, pyAltExeName);
    if (fs.existsSync(altPy)) return altPy;
  }

  if (isWin) {
    return 'python';
  }
  try {
    const { execSync } = require('child_process');
    execSync('python3 --version', { stdio: 'ignore' });
    return 'python3';
  } catch (e) {
    return 'python';
  }
}

class TranscodeQueueManager {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.currentJob = null;
    this.activeChildProcess = null;
    this.currentJobTimeout = null;
    this.isPaused = false;
    this.redisWatcherInterval = null;
  }

  /**
   * Enqueue a new episode transcoding job.
   */
  async enqueueJob(job) {
    const episodeId = parseInt(job.episodeId, 10);
    const showId = parseInt(job.showId, 10);
    if (!episodeId || isNaN(episodeId)) {
      console.warn('[QueueManager] Cannot enqueue job with invalid episodeId:', job);
      return;
    }

    const formattedJob = { ...job, episodeId, showId };

    // Check if job is already running
    if (this.currentJob && this.currentJob.episodeId === episodeId) {
      console.log(`[QueueManager] Episode ${episodeId} is currently being transcoded.`);
      return;
    }

    // Check if job is already queued
    const alreadyInQueue = this.queue.some(j => j.episodeId === episodeId);
    if (alreadyInQueue) {
      console.log(`[QueueManager] Episode ${episodeId} is already queued in line.`);
      return;
    }

    if (this.isProcessing) {
      try {
        await prisma.episode.update({
          where: { id: episodeId },
          data: { transcodeStatus: 'PENDING' }
        });
      } catch (err) {
        console.warn(`[QueueManager] Could not update PENDING status for Episode ${episodeId}:`, err.message);
      }
    }

    this.isPaused = false;
    this.queue.push(formattedJob);
    console.log(`[QueueManager] 📥 Enqueued Episode ${episodeId} for Show ${showId}. Total in queue: ${this.queue.length}`);

    this.processNext();
  }

  /**
   * Process the next job in the sequential queue.
   */
  async processNext() {
    if (this.isProcessing || this.isPaused || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const job = this.queue.shift();
    this.currentJob = job;

    const { episodeId, showId, rawVideoPath, s3FolderKey, storageType, localStoragePath } = job;

    console.log(`\n====================================================`);
    console.log(`🚀 [QueueManager] STARTING Transcoding Job for Episode ${episodeId} (Show ${showId})`);
    console.log(`   Source File: ${rawVideoPath}`);
    console.log(`   Storage Destination: ${storageType || 'local'} (${localStoragePath || 'default'})`);
    console.log(`====================================================\n`);

    // Verify source video file exists on disk
    if (!rawVideoPath || !fs.existsSync(rawVideoPath)) {
      console.error(`❌ [QueueManager] Raw video file not found on disk for Episode ${episodeId}: ${rawVideoPath}`);
      try {
        await prisma.episode.update({
          where: { id: episodeId },
          data: {
            transcodeStatus: 'FAILED',
            stageDetails: JSON.stringify({
              uploadServer: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' },
              transcoding: { percent: 0, speed: 'Source file missing', eta: 0, status: 'FAILED' },
              uploadS3: { percent: 0, speed: '0 MB/s', eta: 0, status: 'FAILED' }
            })
          }
        });
      } catch (e) { }
      this.finishCurrentJob();
      return;
    }

    // Immediately mark as PROCESSING in DB
    try {
      await prisma.episode.update({
        where: { id: episodeId },
        data: {
          transcodeStatus: 'PROCESSING',
          stageDetails: JSON.stringify({
            uploadServer: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' },
            transcoding: { percent: 0.1, speed: '1.0x', eta: 0, status: 'PROCESSING' },
            uploadS3: { percent: 0, speed: '0 MB/s', eta: 0, status: 'PENDING' }
          })
        }
      });
    } catch (err) {
      console.error(`[QueueManager] Failed to set PROCESSING status for Episode ${episodeId}:`, err.message);
    }

    const pythonExecutable = getPythonExecutable();
    const scriptPath = path.join(__dirname, '../../worker/converter_helper.py');
    const binPath = path.join(__dirname, '../bin');

    const customEnv = { ...process.env };
    customEnv.BACKEND_URL = process.env.BACKEND_URL || `http://127.0.0.1:${process.env.PORT || 8000}`;
    customEnv.WORKER_WEBHOOK_SECRET = process.env.WORKER_WEBHOOK_SECRET || 'infinx_webhook_shared_secret_2026';

    if (storageType) {
      customEnv.STORAGE_TYPE = storageType;
    }
    if (localStoragePath) {
      customEnv.LOCAL_STORAGE_PATH = localStoragePath;
    }

    // Platform-safe PATH delimiter (':' on Linux/WSL, ';' on Windows)
    const pathKey = Object.keys(customEnv).find(k => k.toLowerCase() === 'path') || 'PATH';
    const originalPath = customEnv[pathKey] || '';
    customEnv[pathKey] = `${binPath}${path.delimiter}${originalPath}`;

    const spawnArgs = [
      scriptPath,
      rawVideoPath,
      episodeId.toString(),
      showId.toString(),
      s3FolderKey,
      storageType || process.env.STORAGE_TYPE || 'local',
      localStoragePath || process.env.LOCAL_STORAGE_PATH || ''
    ];

    console.log(`[QueueManager] Spawning: ${pythonExecutable} ${scriptPath}`);

    try {
      const child = spawn(pythonExecutable, spawnArgs, {
        env: customEnv,
        shell: false
      });

      this.activeChildProcess = child;

      // 60-minute maximum runtime safety watchdog to prevent stuck processes
      this.currentJobTimeout = setTimeout(async () => {
        console.error(`⏱️ [QueueManager] Transcode timeout reached for Episode ${episodeId}. Terminating process...`);
        if (this.activeChildProcess) {
          try { this.activeChildProcess.kill('SIGKILL'); } catch (e) { }
        }
        try {
          await prisma.episode.update({
            where: { id: episodeId },
            data: { transcodeStatus: 'FAILED' }
          });
        } catch (e) { }
        this.finishCurrentJob();
      }, 60 * 60 * 1000);

      let stdoutData = '';
      let stderrData = '';
      let isJobFinished = false;
      let lastProgressUpdateTime = 0;

      child.stdout.on('data', (data) => {
        const text = data.toString();
        stdoutData += text;
        const lines = text.trim().split('\n');
        lines.forEach(line => {
          console.log(`[Transcoder Ep ${episodeId}] ${line}`);
          if (isJobFinished) return;

          // If line signals completion, ignore any in-flight progress overwrite
          if (line.includes('SUCCESS_PLAYBACK_URL:') || line.includes('COMPLETED 100.0%')) {
            return;
          }

          // Direct fallback parsing for live progress updates (throttled to 1 sec)
          const transcodeMatch = line.match(/TRANSCODING\s+([\d.]+)%(?:\s*\((.*)\))?/i);
          const uploadMatch = line.match(/UPLOADING_S3\s+([\d.]+)%(?:\s*\((.*)\))?/i);

          const now = Date.now();
          if (transcodeMatch && (now - lastProgressUpdateTime > 1000)) {
            lastProgressUpdateTime = now;
            const pct = parseFloat(transcodeMatch[1]);
            let spd = transcodeMatch[2] ? transcodeMatch[2].trim() : 'Processing';
            if (spd.endsWith(')')) spd = spd.slice(0, -1);
            prisma.episode.update({
              where: { id: episodeId },
              data: {
                transcodeStatus: 'PROCESSING',
                stageDetails: JSON.stringify({
                  uploadServer: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' },
                  transcoding: { percent: pct, speed: spd, eta: 0, status: 'PROCESSING' },
                  uploadS3: { percent: 0, speed: '0 MB/s', eta: 0, status: 'PENDING' }
                })
              }
            }).catch(() => { });
          } else if (uploadMatch && (now - lastProgressUpdateTime > 1000)) {
            lastProgressUpdateTime = now;
            const pct = parseFloat(uploadMatch[1]);
            let spd = uploadMatch[2] ? uploadMatch[2].trim() : 'Uploading';
            if (spd.endsWith(')')) spd = spd.slice(0, -1);
            prisma.episode.update({
              where: { id: episodeId },
              data: {
                transcodeStatus: 'PROCESSING',
                stageDetails: JSON.stringify({
                  uploadServer: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' },
                  transcoding: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' },
                  uploadS3: { percent: pct, speed: spd, eta: 0, status: 'PROCESSING' }
                })
              }
            }).catch(() => { });
          }
        });
      });

      child.stderr.on('data', (data) => {
        stderrData += data.toString();
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => console.warn(`[Transcoder Ep ${episodeId}] ${line}`));
      });

      child.on('error', async (err) => {
        console.error(`❌ [QueueManager] Error executing transcoder for Episode ${episodeId}:`, err);
        try {
          await prisma.episode.update({
            where: { id: episodeId },
            data: { transcodeStatus: 'FAILED' }
          });
        } catch (e) { }
        this.finishCurrentJob();
      });

      child.on('close', async (code, signal) => {
        isJobFinished = true;
        if (this.currentJobTimeout) {
          clearTimeout(this.currentJobTimeout);
          this.currentJobTimeout = null;
        }
        this.activeChildProcess = null;

        if (signal === 'SIGKILL' || signal === 'SIGTERM') {
          console.log(`⏹️ [QueueManager] Transcoder for Episode ${episodeId} was STOPPED/CANCELLED.`);
          this.finishCurrentJob();
          return;
        }

        console.log(`[QueueManager] Transcoder for Episode ${episodeId} exited with code ${code}`);

        if (code === 0) {
          const match = stdoutData.match(/SUCCESS_PLAYBACK_URL:\s*(\S+)/);
          let playbackUrl = match && match[1] ? match[1].trim() : null;
          if (!playbackUrl) {
            const ep = await prisma.episode.findUnique({ where: { id: episodeId } });
            if (ep && ep.videoUrl && ep.videoUrl.includes('master.m3u8')) playbackUrl = ep.videoUrl;
          }

          // Fallback reconstruction if stdout was missed or formatted differently
          if (!playbackUrl) {
            const cleanFolderKey = (s3FolderKey || `videos/show_${showId}/ep_${episodeId}`).replace(/^\/+|\/+$/g, '');
            if (job.storageType === 's3' || process.env.STORAGE_TYPE === 's3') {
              const bucket = process.env.AWS_S3_BUCKET || 'serverbuket-12';
              const region = process.env.AWS_REGION || 'ap-south-1';
              playbackUrl = `https://${bucket}.s3.${region}.amazonaws.com/${cleanFolderKey}/master.m3u8`;
            } else {
              playbackUrl = `/uploads/${cleanFolderKey}/master.m3u8`;
            }
          }

          console.log(`✅ [QueueManager] Episode ${episodeId} Transcoding COMPLETED! Playback URL: ${playbackUrl}`);
          try {
            const completeData = {
              transcodeStatus: 'COMPLETED',
              videoUrl: playbackUrl,
              stageDetails: JSON.stringify({
                uploadServer: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' },
                transcoding: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' },
                uploadS3: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' }
              })
            };
            if (job.storageType === 's3' || playbackUrl.includes('amazonaws.com')) {
              completeData.s3Url = playbackUrl;
            } else if (prisma.episode.fields && prisma.episode.fields.localUrl) {
              completeData.localUrl = playbackUrl;
            }

            try {
              await prisma.episode.update({
                where: { id: episodeId },
                data: completeData
              });
            } catch (err) {
              if (completeData.localUrl && err.message && err.message.includes('localUrl')) {
                console.warn(`[QueueManager] Retrying completion update without localUrl for Ep ${episodeId}...`);
                delete completeData.localUrl;
                await prisma.episode.update({
                  where: { id: episodeId },
                  data: completeData
                });
              } else {
                throw err;
              }
            }
          } catch (e) {
            console.error(`Error updating completed status for Ep ${episodeId}:`, e.message);
          }
          this.finishCurrentJob();
          return;
        }

        console.error(`❌ [QueueManager] Episode ${episodeId} Transcoding FAILED with code ${code}. Stderr: ${stderrData}`);
        const errLines = stderrData.trim().split('\n').filter(Boolean);
        const lastErr = errLines.slice(-3).join(' ') || `Transcode exited with code ${code}`;
        try {
          const ep = await prisma.episode.findUnique({ where: { id: episodeId } });
          let stageObj = {
            uploadServer: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' },
            transcoding: { percent: 0, speed: lastErr.substring(0, 80), eta: 0, status: 'FAILED', error: lastErr },
            uploadS3: { percent: 0, speed: '0 MB/s', eta: 0, status: 'PENDING' }
          };
          if (ep && ep.stageDetails) {
            try {
              const prev = JSON.parse(ep.stageDetails);
              stageObj = {
                ...prev,
                transcoding: { ...prev.transcoding, status: 'FAILED', speed: lastErr.substring(0, 80), error: lastErr }
              };
            } catch (e) { }
          }
          await prisma.episode.update({
            where: { id: episodeId },
            data: {
              transcodeStatus: 'FAILED',
              stageDetails: JSON.stringify(stageObj)
            }
          });
        } catch (e) { }

        this.finishCurrentJob();
      });
    } catch (spawnErr) {
      console.error(`❌ [QueueManager] Critical spawn error for Episode ${episodeId}:`, spawnErr);
      try {
        await prisma.episode.update({
          where: { id: episodeId },
          data: {
            transcodeStatus: 'FAILED',
            stageDetails: JSON.stringify({
              uploadServer: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' },
              transcoding: { percent: 0, speed: spawnErr.message.substring(0, 80), eta: 0, status: 'FAILED', error: spawnErr.message },
              uploadS3: { percent: 0, speed: '0 MB/s', eta: 0, status: 'PENDING' }
            })
          }
        });
      } catch (e) { }
      this.finishCurrentJob();
    }
  }

  /**
   * Pause currently running active transcoding job or queue.
   */
  async pauseJob(episodeIdStr) {
    const episodeId = parseInt(episodeIdStr, 10);

    if (this.currentJob && this.currentJob.episodeId === episodeId) {
      if (this.activeChildProcess && process.platform !== 'win32') {
        this.activeChildProcess.kill('SIGSTOP');
      }
      this.isPaused = true;
      try {
        await prisma.episode.update({
          where: { id: episodeId },
          data: { transcodeStatus: 'PAUSED' }
        });
      } catch (e) { }
      console.log(`⏸️ [QueueManager] Paused active transcoding for Episode ${episodeId}`);
      return { success: true, message: `Episode ${episodeId} transcoding paused.` };
    }

    const queuedIdx = this.queue.findIndex(j => j.episodeId === episodeId);
    if (queuedIdx !== -1) {
      try {
        await prisma.episode.update({
          where: { id: episodeId },
          data: { transcodeStatus: 'PAUSED' }
        });
      } catch (e) { }
      return { success: true, message: `Queued Episode ${episodeId} marked as paused.` };
    }

    return { success: false, message: `Episode ${episodeId} is not active or queued.` };
  }

  /**
   * Resume paused transcoding job or queue.
   */
  async resumeJob(episodeIdStr) {
    const episodeId = parseInt(episodeIdStr, 10);

    if (this.currentJob && this.currentJob.episodeId === episodeId && this.isPaused) {
      if (this.activeChildProcess && process.platform !== 'win32') {
        this.activeChildProcess.kill('SIGCONT');
      }
      this.isPaused = false;
      try {
        await prisma.episode.update({
          where: { id: episodeId },
          data: { transcodeStatus: 'PROCESSING' }
        });
      } catch (e) { }
      console.log(`▶️ [QueueManager] Resumed active transcoding for Episode ${episodeId}`);
      return { success: true, message: `Episode ${episodeId} transcoding resumed.` };
    }

    this.isPaused = false;
    try {
      await prisma.episode.update({
        where: { id: episodeId },
        data: { transcodeStatus: 'PENDING' }
      });
    } catch (e) { }
    this.processNext();
    return { success: true, message: `Episode ${episodeId} queue resumed.` };
  }

  /**
   * Stop / Cancel running or queued transcoding job.
   */
  async stopJob(episodeIdStr) {
    const episodeId = parseInt(episodeIdStr, 10);

    if (this.currentJob && this.currentJob.episodeId === episodeId) {
      console.log(`⏹️ [QueueManager] Stopping active transcoding process for Episode ${episodeId}...`);
      if (this.currentJobTimeout) {
        clearTimeout(this.currentJobTimeout);
        this.currentJobTimeout = null;
      }
      if (this.activeChildProcess) {
        try {
          this.activeChildProcess.kill('SIGKILL');
        } catch (e) { }
      }
      try {
        await prisma.episode.update({
          where: { id: episodeId },
          data: { transcodeStatus: 'CANCELLED' }
        });
      } catch (e) { }
      return { success: true, message: `Stopped transcoding process for Episode ${episodeId}.` };
    }

    const queuedIdx = this.queue.findIndex(j => j.episodeId === episodeId);
    if (queuedIdx !== -1) {
      this.queue.splice(queuedIdx, 1);
      try {
        await prisma.episode.update({
          where: { id: episodeId },
          data: { transcodeStatus: 'CANCELLED' }
        });
      } catch (e) { }
      console.log(`⏹️ [QueueManager] Removed Episode ${episodeId} from pending queue.`);
      return { success: true, message: `Episode ${episodeId} removed from transcoding queue.` };
    }

    return { success: false, message: `Episode ${episodeId} is not running or queued.` };
  }

  /**
   * Delete transcoding task & episode record from database.
   */
  async deleteJob(episodeIdStr) {
    const episodeId = parseInt(episodeIdStr, 10);

    // 1. Stop job if active or queued
    await this.stopJob(episodeId);

    // 2. Delete episode record from DB
    try {
      await prisma.episode.delete({
        where: { id: episodeId }
      });
      console.log(`🗑️ [QueueManager] Deleted Episode ${episodeId} from database.`);
      return { success: true, message: `Episode ${episodeId} and its transcoding job deleted.` };
    } catch (err) {
      console.error(`Error deleting episode ${episodeId}:`, err.message);
      return { success: false, message: `Could not delete episode: ${err.message}` };
    }
  }

  finishCurrentJob() {
    if (this.currentJobTimeout) {
      clearTimeout(this.currentJobTimeout);
      this.currentJobTimeout = null;
    }
    this.isProcessing = false;
    this.currentJob = null;
    this.activeChildProcess = null;
    this.isPaused = false;

    if (this.queue.length > 0) {
      console.log(`\n[QueueManager] 🔄 Moving to next queued job in line (${this.queue.length} remaining)...`);
      setTimeout(() => this.processNext(), 1000);
    } else {
      console.log(`\n[QueueManager] ✨ All queued transcoding jobs completed! Queue is now idle.`);
    }
  }

  /**
   * Scan database on server start for any PENDING or interrupted PROCESSING tasks,
   * restoring them or marking orphaned ones cleanly.
   */
  async syncPendingFromDB() {
    try {
      const pendingEpisodes = await prisma.episode.findMany({
        where: {
          transcodeStatus: { in: ['PENDING', 'PROCESSING', 'PAUSED'] }
        },
        orderBy: { createdAt: 'asc' }
      });

      if (pendingEpisodes.length === 0) return;

      console.log(`[QueueManager] Found ${pendingEpisodes.length} unfinished episodes in database. Checking source files...`);
      const uploadsDir = getUploadsDir();
      const rawDir = path.join(uploadsDir, 'temp_raw');

      for (const ep of pendingEpisodes) {
        // 1. If videoUrl already exists and is working, mark COMPLETED immediately
        if (ep.videoUrl && ep.videoUrl.trim().length > 0) {
          console.log(`[QueueManager] Episode ${ep.id} already has videoUrl (${ep.videoUrl}). Auto-marking COMPLETED.`);
          await prisma.episode.update({
            where: { id: ep.id },
            data: { transcodeStatus: 'COMPLETED' }
          });
          continue;
        }

        // 2. Locate raw source video file specifically for this episode
        let rawVideoPath = null;
        if (fs.existsSync(uploadsDir)) {
          const files = fs.readdirSync(uploadsDir);
          const matchFile = files.find(f =>
            f.startsWith('raw-') && (
              f.includes(`ep_${ep.id}-`) ||
              f.includes(`ep_${ep.id}_`) ||
              f.includes(`_${ep.id}_`) ||
              f.includes(`_${ep.id}.`) ||
              f.includes(`ep${ep.id}`)
            )
          );
          if (matchFile) {
            rawVideoPath = path.join(uploadsDir, matchFile);
          }
        }

        if (!rawVideoPath || !fs.existsSync(rawVideoPath)) {
          const legacyPath = path.join(rawDir, `raw_show_${ep.showId}_ep_${ep.id}.mp4`);
          if (fs.existsSync(legacyPath)) {
            rawVideoPath = legacyPath;
          }
        }

        if (rawVideoPath && fs.existsSync(rawVideoPath)) {
          const s3FolderKey = `videos/show_${ep.showId}/ep_${ep.id}`;
          console.log(`[QueueManager] Found source video for Episode ${ep.id}. Re-queueing for transcoding: ${rawVideoPath}`);
          this.enqueueJob({
            episodeId: ep.id,
            showId: ep.showId,
            rawVideoPath: rawVideoPath,
            s3FolderKey: s3FolderKey
          });
        } else {
          console.log(`[QueueManager] No raw video file found on disk for Episode ${ep.id}. Marking FAILED so it does not stay stuck in PENDING.`);
          await prisma.episode.update({
            where: { id: ep.id },
            data: {
              transcodeStatus: 'FAILED',
              stageDetails: JSON.stringify({
                uploadServer: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' },
                transcoding: { percent: 0, speed: 'Source file missing', eta: 0, status: 'FAILED' },
                uploadS3: { percent: 0, speed: '0 MB/s', eta: 0, status: 'FAILED' }
              })
            }
          });
        }
      }
    } catch (err) {
      console.warn(`[QueueManager] Could not sync pending episodes from DB:`, err.message);
    }
  }

  /**
   * Watch Redis for any tasks pushed to 'transcode_tasks' that haven't been picked up,
   * automatically draining and executing them.
   */
  startRedisWatcher() {
    if (this.redisWatcherInterval) return;

    this.redisWatcherInterval = setInterval(async () => {
      if (redis.status !== 'ready') return;
      try {
        const queueLen = await redis.llen('transcode_tasks');
        if (queueLen > 0) {
          console.log(`[QueueManager] 📥 Found ${queueLen} task(s) in Redis queue 'transcode_tasks'. Draining to native transcoder...`);
          const taskData = await redis.rpop('transcode_tasks');
          if (taskData) {
            const task = JSON.parse(taskData);
            if (task && task.episodeId) {
              this.enqueueJob({
                episodeId: task.episodeId,
                showId: task.showId,
                rawVideoPath: task.sourceVideoPath,
                s3FolderKey: task.s3FolderKey,
                storageType: task.storageType,
                localStoragePath: task.localStoragePath
              });
            }
          }
        }
      } catch (err) {
        // Ignore redis poll errors
      }
    }, 4000);
  }

  getQueueStatus() {
    return {
      isProcessing: this.isProcessing,
      isPaused: this.isPaused,
      currentJob: this.currentJob,
      queueLength: this.queue.length,
      queue: this.queue.map(j => ({ episodeId: j.episodeId, showId: j.showId }))
    };
  }
}

const transcodeQueueManager = new TranscodeQueueManager();
module.exports = transcodeQueueManager;
