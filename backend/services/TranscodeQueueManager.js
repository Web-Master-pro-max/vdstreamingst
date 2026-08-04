const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class TranscodeQueueManager {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.currentJob = null;
    this.activeChildProcess = null;
    this.isPaused = false;
  }

  /**
   * Enqueue a new episode transcoding job.
   */
  async enqueueJob(job) {
    const episodeId = parseInt(job.episodeId, 10);
    const showId = parseInt(job.showId, 10);
    const formattedJob = { ...job, episodeId, showId };
    
    // Check if job is already running or queued
    if (this.currentJob && this.currentJob.episodeId === episodeId) {
      console.log(`[QueueManager] Episode ${episodeId} is currently being transcoded.`);
      return;
    }

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

    const { episodeId, showId, rawVideoPath, s3FolderKey } = job;

    console.log(`\n====================================================`);
    console.log(`🚀 [QueueManager] STARTING Transcoding Job for Episode ${episodeId} (Show ${showId})`);
    console.log(`====================================================\n`);

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

    const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
    const scriptPath = path.join(__dirname, '../../worker/converter_helper.py');
    const binPath = path.join(__dirname, '../bin');

    const customEnv = { ...process.env };
    customEnv.BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 8000}`;
    const pathKey = Object.keys(customEnv).find(k => k.toLowerCase() === 'path') || 'PATH';
    const originalPath = customEnv[pathKey] || '';
    customEnv[pathKey] = `${binPath};${originalPath}`;

    const child = spawn(pythonExecutable, [
      scriptPath,
      rawVideoPath,
      episodeId.toString(),
      showId.toString(),
      s3FolderKey
    ], {
      env: customEnv,
      shell: false
    });

    this.activeChildProcess = child;

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => console.log(`[Transcoder Ep ${episodeId}] ${line}`));
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
      } catch (e) {}
      this.finishCurrentJob();
    });

    child.on('close', async (code, signal) => {
      this.activeChildProcess = null;

      if (signal === 'SIGKILL' || signal === 'SIGTERM') {
        console.log(`⏹️ [QueueManager] Transcoder for Episode ${episodeId} was STOPPED/CANCELLED.`);
        this.finishCurrentJob();
        return;
      }

      console.log(`[QueueManager] Transcoder for Episode ${episodeId} exited with code ${code}`);

      if (code === 0) {
        const match = stdoutData.match(/SUCCESS_PLAYBACK_URL:\s*(https?:\/\/\S+)/);
        if (match && match[1]) {
          const playbackUrl = match[1];
          console.log(`✅ [QueueManager] Episode ${episodeId} Transcoding COMPLETED! Playback URL: ${playbackUrl}`);
          try {
            await prisma.episode.update({
              where: { id: episodeId },
              data: {
                transcodeStatus: 'COMPLETED',
                videoUrl: playbackUrl
              }
            });
          } catch (e) {
            console.error(`Error updating completed status for Ep ${episodeId}:`, e.message);
          }
          this.finishCurrentJob();
          return;
        }
      }

      console.error(`❌ [QueueManager] Episode ${episodeId} Transcoding FAILED with code ${code}. Stderr: ${stderrData}`);
      try {
        await prisma.episode.update({
          where: { id: episodeId },
          data: { transcodeStatus: 'FAILED' }
        });
      } catch (e) {}

      this.finishCurrentJob();
    });
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
      } catch (e) {}
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
      } catch (e) {}
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
      } catch (e) {}
      console.log(`▶️ [QueueManager] Resumed active transcoding for Episode ${episodeId}`);
      return { success: true, message: `Episode ${episodeId} transcoding resumed.` };
    }

    this.isPaused = false;
    try {
      await prisma.episode.update({
        where: { id: episodeId },
        data: { transcodeStatus: 'PENDING' }
      });
    } catch (e) {}
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
      if (this.activeChildProcess) {
        try {
          this.activeChildProcess.kill('SIGKILL');
        } catch (e) {}
      }
      try {
        await prisma.episode.update({
          where: { id: episodeId },
          data: { transcodeStatus: 'CANCELLED' }
        });
      } catch (e) {}
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
      } catch (e) {}
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
    this.isProcessing = false;
    this.currentJob = null;
    this.activeChildProcess = null;
    
    if (!this.isPaused && this.queue.length > 0) {
      console.log(`\n[QueueManager] 🔄 Moving to next queued job in line (${this.queue.length} remaining)...`);
      setTimeout(() => this.processNext(), 1000);
    } else if (this.queue.length === 0) {
      console.log(`\n[QueueManager] ✨ All queued transcoding jobs completed! Queue is now idle.`);
    }
  }

  /**
   * Scan database on server start for any PENDING or interrupted PROCESSING tasks.
   */
  async syncPendingFromDB() {
    try {
      const pendingEpisodes = await prisma.episode.findMany({
        where: {
          transcodeStatus: { in: ['PENDING', 'PROCESSING', 'PAUSED'] }
        },
        orderBy: { createdAt: 'asc' }
      });

      if (pendingEpisodes.length > 0) {
        console.log(`[QueueManager] Found ${pendingEpisodes.length} unfinished episodes in database. Re-queueing sequentially...`);
        for (const ep of pendingEpisodes) {
          const rawDir = path.join(__dirname, '../../uploads/temp_raw');
          const possibleRawPath = path.join(rawDir, `raw_show_${ep.showId}_ep_${ep.id}.mp4`);
          const s3FolderKey = `videos/show_${ep.showId}/ep_${ep.id}`;
          
          this.enqueueJob({
            episodeId: ep.id,
            showId: ep.showId,
            rawVideoPath: possibleRawPath,
            s3FolderKey: s3FolderKey
          });
        }
      }
    } catch (err) {
      console.warn(`[QueueManager] Could not sync pending episodes from DB:`, err.message);
    }
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
