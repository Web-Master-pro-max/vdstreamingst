const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

const WEBHOOK_SECRET = process.env.WORKER_WEBHOOK_SECRET || 'infinx_webhook_shared_secret_2026';

// POST /api/webhooks/transcode-status - Worker status update webhook
router.post('/transcode-status', async (req, res) => {
  try {
    const { episodeId, status, videoUrl, secret, error } = req.body;

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

    const episode = await prisma.episode.update({
      where: { id: parseInt(episodeId) },
      data: updateData,
    });

    res.json({ success: true, message: 'Status updated successfully.', episode });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
