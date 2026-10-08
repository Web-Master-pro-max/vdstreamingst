const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const eps = await prisma.episode.findMany({
    select: { id: true, showId: true, episodeNumber: true, videoUrl: true, s3Url: true, localUrl: true }
  });
  console.log('Total episodes:', eps.length);
  for (const ep of eps) {
    console.log(`Ep ${ep.id} (Show ${ep.showId}): s3Url=${ep.s3Url ? 'YES' : 'NO'}, localUrl=${ep.localUrl ? ep.localUrl : 'null'}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
