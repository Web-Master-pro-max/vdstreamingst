const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.episode.deleteMany({ where: { title: 'Test Resumable Ep' } });
  console.log("✅ Cleaned test episode.");
}

main().finally(() => prisma.$disconnect());
