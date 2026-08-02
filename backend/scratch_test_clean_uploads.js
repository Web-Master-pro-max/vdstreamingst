const http = require('http');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const secret = process.env.JWT_SECRET || 'infinx_anime_jwt_secret_key_9981';
  const token = jwt.sign({ userId: admin.id, role: 'ADMIN' }, secret);

  const req = http.request({
    hostname: 'localhost',
    port: 8000,
    path: '/api/admin/clean-uploads',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Length': 0
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log("Clean Uploads Status:", res.statusCode);
      console.log("Response Body:", body);
    });
  });

  req.end();
}

main().finally(() => prisma.$disconnect());
