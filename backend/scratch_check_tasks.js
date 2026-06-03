const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const episodes = await prisma.episode.findMany({
      include: {
        show: {
          select: { title: true }
        }
      }
    });
    console.log("EPISODES IN DATABASE:");
    episodes.forEach(ep => {
      console.log(`- [${ep.show.title}] Ep ${ep.episodeNumber}: ${ep.title}`);
      console.log(`  Status: ${ep.transcodeStatus}`);
      console.log(`  URL: ${ep.videoUrl}`);
    });
  } catch (err) {
    console.error("Database query failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
