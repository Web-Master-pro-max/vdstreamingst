const http = require('http');

const data = JSON.stringify({
  episodeId: 327,
  status: 'PROCESSING',
  secret: 'infinx_webhook_shared_secret_2026',
  stageDetails: {
    uploadServer: { percent: 100, speed: 'Done', eta: 0, status: 'COMPLETED' },
    transcoding: { percent: 45.5, speed: '1.8x', eta: 30, status: 'PROCESSING' },
    uploadS3: { percent: 0, speed: '0 MB/s', eta: 0, status: 'PENDING' }
  }
});

const req = http.request({
  hostname: 'localhost',
  port: 8000,
  path: '/api/webhooks/transcode-status',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  console.log(`Webhook HTTP Status Code: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
