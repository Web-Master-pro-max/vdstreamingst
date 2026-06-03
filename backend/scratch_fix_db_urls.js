const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Populating all existing S3 episodes in database...");
  try {
    // 1. Find the Spy X Family show
    const spyShow = await prisma.show.findFirst({
      where: { title: { contains: "Spy" } }
    });

    if (spyShow) {
      console.log(`Found Spy X Family show ID: ${spyShow.id}`);
      
      // Create episodes EP2 through EP5
      for (let epNum = 2; epNum <= 5; epNum++) {
        const videoUrl = `https://server-s3-6.s3.eu-north-1.amazonaws.com/Server-S3/SpyxfamilyS3/videos/EP${epNum}/master.m3u8`;
        
        const existingEp = await prisma.episode.findFirst({
          where: { showId: spyShow.id, episodeNumber: epNum }
        });

        if (existingEp) {
          await prisma.episode.update({
            where: { id: existingEp.id },
            data: { videoUrl, transcodeStatus: "COMPLETED" }
          });
          console.log(`✅ Updated Spy X Family Ep ${epNum} -> ${videoUrl}`);
        } else {
          await prisma.episode.create({
            data: {
              showId: spyShow.id,
              title: `Episode ${epNum}`,
              episodeNumber: epNum,
              videoUrl,
              transcodeStatus: "COMPLETED",
              duration: "24:00"
            }
          });
          console.log(`✅ Created Spy X Family Ep ${epNum} -> ${videoUrl}`);
        }
      }
    }

    // 2. Find the Descendants of the Sun show
    const descendantsShow = await prisma.show.findFirst({
      where: { title: { contains: "Descendants" } }
    });

    if (descendantsShow) {
      console.log(`Found Descendants show ID: ${descendantsShow.id}`);
      
      // Create episodes EP2 through EP16
      for (let epNum = 2; epNum <= 16; epNum++) {
        const videoUrl = `https://server-s3-6.s3.eu-north-1.amazonaws.com/Server-S3/Descendants%20of%20the%20Sun%20S01/videos/EP${epNum}/master.m3u8`;
        
        const existingEp = await prisma.episode.findFirst({
          where: { showId: descendantsShow.id, episodeNumber: epNum }
        });

        if (existingEp) {
          await prisma.episode.update({
            where: { id: existingEp.id },
            data: { videoUrl, transcodeStatus: "COMPLETED" }
          });
          console.log(`✅ Updated Descendants Ep ${epNum} -> ${videoUrl}`);
        } else {
          await prisma.episode.create({
            data: {
              showId: descendantsShow.id,
              title: `Episode ${epNum}`,
              episodeNumber: epNum,
              videoUrl,
              transcodeStatus: "COMPLETED",
              duration: "60:00"
            }
          });
          console.log(`✅ Created Descendants Ep ${epNum} -> ${videoUrl}`);
        }
      }
    }

    console.log("All episodes populated successfully!");
  } catch (err) {
    console.error("ERROR updating database:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
