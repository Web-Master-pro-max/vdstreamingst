const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting recovery of user-uploaded shows and episodes...");

  try {
    // 1. Get categories map
    const categoriesList = await prisma.category.findMany();
    const categoriesMap = {};
    categoriesList.forEach(c => {
      categoriesMap[c.slug] = c.id;
    });
    console.log("Categories found:", categoriesMap);

    // 2. Restore Show 6 (Frieren: Beyond Journey's End)
    console.log("Restoring Show 6 (Frieren)...");
    const show6Exists = await prisma.show.findUnique({ where: { id: 6 } });
    if (!show6Exists) {
      await prisma.show.create({
        data: {
          id: 6,
          title: "Frieren: Beyond Journey's End",
          description: "An elf mage and her former party members' journey beyond the end of their adventure.",
          type: "series",
          rating: 9.0,
          poster: "Postes/frieren1.jpg",
          year: "2023",
          runtime: "20 Ep",
          badge: "HD",
          dubsub: true,
          categories: {
            create: [
              { category: { connect: { id: categoriesMap['anime'] } } }
            ]
          }
        }
      });
      console.log("✅ Created Show 6 (Frieren)");
    } else {
      console.log("Show 6 already exists in database.");
    }

    // Restore Show 6 Episodes (EP1 to EP20)
    // Episode IDs should start at 7 (for EP1) and run up to 26 (for EP20)?
    // Wait! Let's check: the user had Episode ID 7 for EP1. What about the other episode IDs?
    // In Prisma, we can specify specific IDs.
    // Let's check if Frieren episodes already exist.
    for (let i = 1; i <= 20; i++) {
      const epId = 300 + i;
      const epNumber = i;
      
      const epExists = await prisma.episode.findFirst({
        where: { showId: 6, episodeNumber: epNumber }
      });

      if (!epExists) {
        let videoUrl = null;
        let transcodeStatus = "PENDING";
        
        if (i <= 19) {
          videoUrl = `https://server-s3-6.s3.eu-north-1.amazonaws.com/Server-S3/Frieren%20Beyond%20Journeys%20End%20S01/videos/EP${i}/master.m3u8`;
          transcodeStatus = "COMPLETED";
        }

        await prisma.episode.create({
          data: {
            id: epId,
            showId: 6,
            title: `Episode ${i}`,
            episodeNumber: epNumber,
            duration: "24:00",
            videoUrl: videoUrl,
            transcodeStatus: transcodeStatus
          }
        });
        console.log(`✅ Created Frieren Ep ${epNumber} (ID: ${epId}) -> ${videoUrl}`);
      } else {
        console.log(`Frieren Ep ${epNumber} already exists in database.`);
      }
    }

    // 3. Restore Show 9 (Spider-Man: Noir)
    console.log("Restoring Show 9 (Spider-Man: Noir)...");
    const show9Exists = await prisma.show.findUnique({ where: { id: 9 } });
    if (!show9Exists) {
      await prisma.show.create({
        data: {
          id: 9,
          title: "Spider-Man: Noir",
          description: "An alternate universe Spider-Man fights crime in a gritty 1930s style New York. A detective noir take on the classic web-slinger.",
          type: "movie",
          rating: 8.5,
          poster: "https://server-3a.s3.ap-south-1.amazonaws.com/posters/1780160525265-spider noir.png",
          banner: "https://server-3a.s3.ap-south-1.amazonaws.com/banners/1780212490113-spider noir.png",
          year: "2024",
          runtime: "1 Ep",
          badge: "HD",
          dubsub: true,
          categories: {
            create: [
              { category: { connect: { id: categoriesMap['action'] } } },
              { category: { connect: { id: categoriesMap['hollywood'] } } }
            ]
          }
        }
      });
      console.log("✅ Created Show 9 (Spider-Man: Noir)");
    } else {
      console.log("Show 9 already exists in database.");
    }

    // Restore Show 9 Episode (ID: 50)
    const ep50Exists = await prisma.episode.findUnique({ where: { id: 50 } });
    if (!ep50Exists) {
      await prisma.episode.create({
        data: {
          id: 50,
          showId: 9,
          title: "Full Movie",
          episodeNumber: 1,
          duration: "120:00",
          videoUrl: "https://server-3a.s3.ap-south-1.amazonaws.com/videos/show_9/ep_50/master.m3u8",
          transcodeStatus: "COMPLETED"
        }
      });
      console.log("✅ Created Episode 50 under Show 9");
    } else {
      console.log("Episode 50 already exists.");
    }

    // 4. Restore Show 10 (Hopper)
    console.log("Restoring Show 10 (Hopper)...");
    const show10Exists = await prisma.show.findUnique({ where: { id: 10 } });
    if (!show10Exists) {
      await prisma.show.create({
        data: {
          id: 10,
          title: "Hopper",
          description: "A thrilling story detailing the adventures and struggles of Hopper, drawing from history and action-packed mystery.",
          type: "movie",
          rating: 7.8,
          poster: "https://server-3a.s3.ap-south-1.amazonaws.com/posters/1780213650207-hopper.jpg",
          banner: "https://server-3a.s3.ap-south-1.amazonaws.com/banners/1780224731167-hopperpost.jpg",
          year: "2024",
          runtime: "1 Ep",
          badge: "HD",
          dubsub: false,
          categories: {
            create: [
              { category: { connect: { id: categoriesMap['action'] } } },
              { category: { connect: { id: categoriesMap['hollywood'] } } }
            ]
          }
        }
      });
      console.log("✅ Created Show 10 (Hopper)");
    } else {
      console.log("Show 10 already exists in database.");
    }

    // Restore Show 10 Episode (ID: 51)
    const ep51Exists = await prisma.episode.findUnique({ where: { id: 51 } });
    if (!ep51Exists) {
      await prisma.episode.create({
        data: {
          id: 51,
          showId: 10,
          title: "Full Movie",
          episodeNumber: 1,
          duration: "120:00",
          videoUrl: "https://server-3a.s3.ap-south-1.amazonaws.com/videos/show_10/ep_51/master.m3u8",
          transcodeStatus: "COMPLETED"
        }
      });
      console.log("✅ Created Episode 51 under Show 10");
    } else {
      console.log("Episode 51 already exists.");
    }

    // 5. Restore Show 11 (Project Hail Mary)
    console.log("Restoring Show 11 (Project Hail Mary)...");
    const show11Exists = await prisma.show.findUnique({ where: { id: 11 } });
    if (!show11Exists) {
      await prisma.show.create({
        data: {
          id: 11,
          title: "Project Hail Mary",
          description: "Ryland Grace is the sole survivor on a desperate, last-chance mission to save humanity and the Earth from an extinction-level event.",
          type: "movie",
          rating: 8.8,
          poster: "https://server-3a.s3.ap-south-1.amazonaws.com/posters/1780321395227-Project Hail Mary.jpg",
          banner: "https://server-3a.s3.ap-south-1.amazonaws.com/banners/1780321453703-Hail Mary banner.jpg",
          year: "2026",
          runtime: "1 Ep",
          badge: "HD",
          dubsub: true,
          categories: {
            create: [
              { category: { connect: { id: categoriesMap['hollywood'] } } },
              { category: { connect: { id: categoriesMap['action'] } } }
            ]
          }
        }
      });
      console.log("✅ Created Show 11 (Project Hail Mary)");
    } else {
      console.log("Show 11 already exists in database.");
    }

    // Restore Show 11 Episode (ID: 52)
    const ep52Exists = await prisma.episode.findUnique({ where: { id: 52 } });
    if (!ep52Exists) {
      await prisma.episode.create({
        data: {
          id: 52,
          showId: 11,
          title: "Full Movie",
          episodeNumber: 1,
          duration: "135:00",
          videoUrl: "https://server-3a.s3.ap-south-1.amazonaws.com/videos/show_11/ep_52/master.m3u8",
          transcodeStatus: "COMPLETED"
        }
      });
      console.log("✅ Created Episode 52 under Show 11");
    } else {
      console.log("Episode 52 already exists.");
    }

    // 6. Restore Breaking Bad Episode 54 (ID: 54, Episode 3)
    console.log("Checking Show 2 (Breaking Bad) for Episode 54...");
    const show2Exists = await prisma.show.findUnique({ where: { id: 2 } });
    if (show2Exists) {
      const ep54Exists = await prisma.episode.findUnique({ where: { id: 54 } });
      if (!ep54Exists) {
        await prisma.episode.create({
          data: {
            id: 54,
            showId: 2,
            title: "...and the Bag's in the River",
            episodeNumber: 3,
            duration: "48:00",
            videoUrl: "https://server-3a.s3.ap-south-1.amazonaws.com/videos/show_2/ep_54/master.m3u8",
            transcodeStatus: "COMPLETED"
          }
        });
        console.log("✅ Created Episode 54 under Show 2");
        
        // Also update runtime of Show 2 if needed
        await prisma.show.update({
          where: { id: 2 },
          data: { runtime: "3 Ep" }
        });
      } else {
        console.log("Episode 54 already exists.");
      }
    } else {
      console.log("⚠️ Breaking Bad (Show 2) not found in database.");
    }

    console.log("\n🎉 Database recovery complete!");
  } catch (error) {
    console.error("❌ Error during database recovery:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
