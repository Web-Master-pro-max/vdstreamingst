const http = require('http');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const show = await prisma.show.findFirst();
  const secret = process.env.JWT_SECRET || 'infinx_anime_jwt_secret_key_9981';
  const token = jwt.sign({ userId: admin.id, role: 'ADMIN' }, secret);

  const payload = JSON.stringify({
    showId: show.id,
    episodeNumber: 88,
    title: 'Manual Test Episode',
    videoUrl: 'https://serverbuket-12.s3.ap-south-1.amazonaws.com/videos/test/master.m3u8',
    duration: '24:00',
    description: 'Manually added episode test'
  });

  const req = http.request({
    hostname: 'localhost',
    port: 8000,
    path: '/api/admin/episodes/manual',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log("Manual Episode Creation Status:", res.statusCode);
      console.log("Body:", body);
    });
  });

  req.write(payload);
  req.end();
}

main().finally(() => prisma.$disconnect());
