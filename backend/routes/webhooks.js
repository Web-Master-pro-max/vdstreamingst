const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

const WEBHOOK_SECRET = process.env.WORKER_WEBHOOK_SECRET || 'infinx_webhook_shared_secret_2026';

// POST /api/webhooks/transcode-status - Worker status update webhook
router.post('/transcode-status', async (req, res) => {
  try {
    const { episodeId, status, videoUrl, s3Url, localUrl, storageType, secret, stageDetails, error } = req.body;

    if (!episodeId || !status || !secret) {
      return res.status(400).json({ error: 'Missing required parameters: episodeId, status, secret.' });
    }

    // Verify webhook authentication secret
    if (secret !== WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized webhook request.' });
    }

    // Validate status values
    if (!['PROCESSING', 'COMPLETED', 'FAILED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid transcode status.' });
    }

    console.log(`Webhook: Episode ${episodeId} changed state to ${status}. URL: ${videoUrl || 'None'}`);

    const updateData = { transcodeStatus: status };
    if (videoUrl) {
      updateData.videoUrl = videoUrl;
      const isS3 = videoUrl.includes('amazonaws.com') || (videoUrl.startsWith('http') && !videoUrl.includes('/uploads/'));
      if (storageType === 's3' || isS3) {
        updateData.s3Url = videoUrl;
      } else if (prisma.episode.fields && prisma.episode.fields.localUrl) {
        updateData.localUrl = videoUrl;
      }
    }
    if (s3Url) updateData.s3Url = s3Url;
    if (localUrl && prisma.episode.fields && prisma.episode.fields.localUrl) {
      updateData.localUrl = localUrl;
    }

    if (status === 'COMPLETED') {
      updateData.stageDetails = JSON.stringify({
        uploadServer: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' },
        transcoding: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' },
        uploadS3: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' }
      });
    } else if (stageDetails) {
      let stageObj = typeof stageDetails === 'string' ? JSON.parse(stageDetails) : stageDetails;
      if (error && stageObj.transcoding) {
        stageObj.transcoding.error = error;
        if (!stageObj.transcoding.speed || stageObj.transcoding.speed === '0x') {
          stageObj.transcoding.speed = String(error).substring(0, 80);
        }
      }
      updateData.stageDetails = JSON.stringify(stageObj);
    } else if (status === 'FAILED') {
      const errMsg = error || 'Transcode process failed';
      updateData.stageDetails = JSON.stringify({
        uploadServer: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' },
        transcoding: { percent: 0, speed: errMsg.substring(0, 80), eta: 0, status: 'FAILED', error: errMsg },
        uploadS3: { percent: 0, speed: '0 MB/s', eta: 0, status: 'PENDING' }
      });
    }

    const parsedId = parseInt(episodeId, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: 'Invalid episodeId.' });
    }

    const existingEp = await prisma.episode.findUnique({ where: { id: parsedId } });
    if (!existingEp) {
      console.warn(`Webhook warning: Episode #${parsedId} not found in database.`);
      return res.status(404).json({ error: `Episode ${parsedId} not found.` });
    }

    let episode;
    try {
      episode = await prisma.episode.update({
        where: { id: parsedId },
        data: updateData,
      });
    } catch (dbErr) {
      if (updateData.localUrl && dbErr.message && dbErr.message.includes('localUrl')) {
        console.warn(`[Webhook] Retrying DB update without localUrl column for Ep #${parsedId}...`);
        delete updateData.localUrl;
        episode = await prisma.episode.update({
          where: { id: parsedId },
          data: updateData,
        });
      } else {
        throw dbErr;
      }
    }

    res.json({ success: true, message: 'Status updated successfully.', episode });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
