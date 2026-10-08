const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.episode.update({
    where: { id: 593 },
    data: {
      localUrl: '/uploads/videos/show_60/ep_593/master.m3u8',
      videoUrl: '/uploads/videos/show_60/ep_593/master.m3u8',
    }
  });
  console.log('Successfully updated episode 593:', updated);
}

main().catch(console.error).finally(() => prisma.$disconnect());
