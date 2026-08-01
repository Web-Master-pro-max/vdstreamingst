const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const episodes = await prisma.episode.findMany({
    orderBy: { id: 'desc' },
    take: 5
  });
  console.log("Latest Episodes:", JSON.stringify(episodes, null, 2));
}

main().finally(() => prisma.$disconnect());
