const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

const WEBHOOK_SECRET = process.env.WORKER_WEBHOOK_SECRET || 'infinx_webhook_shared_secret_2026';

// POST /api/webhooks/transcode-status - Worker status update webhook
router.post('/transcode-status', async (req, res) => {
  try {
    const { episodeId, status, videoUrl, secret, stageDetails, error } = req.body;

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
    }

    if (stageDetails) {
      updateData.stageDetails = typeof stageDetails === 'string' ? stageDetails : JSON.stringify(stageDetails);
    } else if (status === 'COMPLETED') {
      updateData.stageDetails = JSON.stringify({
        uploadServer: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' },
        transcoding: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' },
        uploadS3: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' }
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

    const episode = await prisma.episode.update({
      where: { id: parsedId },
      data: updateData,
    });

    res.json({ success: true, message: 'Status updated successfully.', episode });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
