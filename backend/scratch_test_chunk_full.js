const http = require('http');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const show = await prisma.show.findFirst();
  const secret = process.env.JWT_SECRET || 'infinx_anime_jwt_secret_key_9981';
  const token = jwt.sign({ userId: admin.id, role: 'ADMIN' }, secret);

  const uploadId = `test_resumable_${Date.now()}`;
  const dummyChunk1 = Buffer.from("CHUNK_DATA_1_");
  const dummyChunk2 = Buffer.from("CHUNK_DATA_2_");

  console.log("1. Uploading Chunk 0...");
  await uploadChunk(token, uploadId, 0, 2, dummyChunk1);

  console.log("2. Checking status after Chunk 0...");
  const status1 = await getStatus(token, uploadId);
  console.log("Status:", status1);

  console.log("3. Uploading Chunk 1...");
  await uploadChunk(token, uploadId, 1, 2, dummyChunk2);

  console.log("4. Checking status after Chunk 1...");
  const status2 = await getStatus(token, uploadId);
  console.log("Status:", status2);

  console.log("5. Finalizing Upload...");
  const finalRes = await finalizeUpload(token, uploadId, show.id, "Test Resumable Ep", 99, 2);
  console.log("Finalize Result:", finalRes);
}

function getStatus(token, uploadId) {
  return new Promise((resolve) => {
    http.get({
      hostname: 'localhost',
      port: 8000,
      path: `/api/admin/upload-chunk-status?uploadId=${uploadId}`,
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
  });
}

function uploadChunk(token, uploadId, chunkIndex, totalChunks, buffer) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    let body = '';
    body += `--${boundary}\r\nContent-Disposition: form-data; name="uploadId"\r\n\r\n${uploadId}\r\n`;
    body += `--${boundary}\r\nContent-Disposition: form-data; name="chunkIndex"\r\n\r\n${chunkIndex}\r\n`;
    body += `--${boundary}\r\nContent-Disposition: form-data; name="totalChunks"\r\n\r\n${totalChunks}\r\n`;
    body += `--${boundary}\r\nContent-Disposition: form-data; name="chunk"; filename="chunk_${chunkIndex}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
    
    const headerBuf = Buffer.from(body, 'utf8');
    const footerBuf = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const payload = Buffer.concat([headerBuf, buffer, footerBuf]);

    const req = http.request({
      hostname: 'localhost',
      port: 8000,
      path: '/api/admin/upload-chunk',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': payload.length
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function finalizeUpload(token, uploadId, showId, title, episodeNumber, totalChunks) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      uploadId,
      showId,
      title,
      episodeNumber,
      totalChunks,
      fileName: 'test_stream.mkv'
    });

    const req = http.request({
      hostname: 'localhost',
      port: 8000,
      path: '/api/admin/upload-chunk-finalize',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

main().finally(() => prisma.$disconnect());
