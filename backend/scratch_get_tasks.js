const http = require('http');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.error("No admin user found");
    return;
  }

  const secret = process.env.JWT_SECRET || 'infinx_anime_jwt_secret_key_9981';
  const token = jwt.sign({ userId: admin.id, role: 'ADMIN' }, secret);

  http.get('http://localhost:8000/api/admin/tasks', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log("Status:", res.statusCode);
      try {
        const data = JSON.parse(body);
        console.log("Returned tasks count:", data.length);
        if (data.length > 0) {
          console.log("Sample task #", data[0].id, "stageDetails:", data[0].stageDetails);
        }
      } catch(e) {
        console.log("Raw body:", body);
      }
    });
  });
}

main().finally(() => prisma.$disconnect());
