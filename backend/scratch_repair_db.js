const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');

const s3 = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'YOUR_AWS_ACCESS_KEY_ID',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'YOUR_AWS_SECRET_ACCESS_KEY'
  }
});
const prisma = new PrismaClient();

async function main() {
  console.log("Starting healing check of all episode transcode statuses...");
  try {
    const episodes = await prisma.episode.findMany();
    for (const ep of episodes) {
      const prefix = `videos/show_${ep.showId}/ep_${ep.id}/`;
      try {
        const res = await s3.send(new ListObjectsV2Command({
          Bucket: 'server-3a',
          Prefix: prefix
        }));
        
        if (res.Contents && res.Contents.some(c => c.Key.endsWith('master.m3u8'))) {
          const url = `https://server-3a.s3.ap-south-1.amazonaws.com/${prefix}master.m3u8`;
          console.log(`Episode ${ep.id} (${ep.title}): FOUND on S3 -> ${url}`);
          if (ep.transcodeStatus !== 'COMPLETED' || ep.videoUrl !== url) {
            await prisma.episode.update({
              where: { id: ep.id },
              data: {
                transcodeStatus: 'COMPLETED',
                videoUrl: url
              }
            });
            console.log(`  ✅ Repaired database status to COMPLETED and set videoUrl`);
          }
        } else {
          console.log(`Episode ${ep.id} (${ep.title}): NOT found on S3`);
        }
      } catch (err) {
        console.error(`Error checking ep ${ep.id}:`, err.message);
      }
    }
    console.log("Database healing check complete!");
  } catch (err) {
    console.error("Fatal error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
