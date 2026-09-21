const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const categoriesData = [
  {
    "id": 1,
    "name": "Action Movies",
    "slug": "action"
  },
  {
    "id": 2,
    "name": "Anime Series",
    "slug": "anime"
  },
  {
    "id": 3,
    "name": "Hollywood Movies",
    "slug": "hollywood"
  },
  {
    "id": 4,
    "name": "Web Series",
    "slug": "web-series"
  },
  {
    "id": 5,
    "name": "Horror Movies",
    "slug": "horror"
  },
  {
    "id": 6,
    "name": "Kids & Family",
    "slug": "kids"
  },
  {
    "id": 7,
    "name": "Korean Drama",
    "slug": "kdrama"
  }
];
const usersData = [
  {
    "id": 1,
    "email": "admin@infinx.com",
    "passwordHash": "$2a$10$7EMEfLVjEbzy/DbZIz/HFub8RBDBO.eNITML/I/InaQVFDO2ZuLkO",
    "role": "ADMIN",
    "isBanned": false,
    "createdAt": "2026-06-02T15:06:54.422Z",
    "updatedAt": "2026-08-01T09:25:40.602Z"
  },
  {
    "id": 2,
    "email": "abcseller@gmail.com",
    "passwordHash": "$2a$10$nJ9dHhHevkndvz0XZs5LveIH94RbOrDP5E7u9AsXzrjRbluqeZE8m",
    "role": "USER",
    "isBanned": false,
    "createdAt": "2026-06-03T05:15:02.887Z",
    "updatedAt": "2026-08-01T09:25:40.610Z"
  }
];
const showsData = [
  {
    "id": 14,
    "title": "Loki",
    "description": "The mercurial villain Loki resumes his role as the God of Mischief in a new series that takes place after the events of “Avengers: Endgame.”",
    "type": "series",
    "rating": 8.2,
    "poster": "https://serverbuket-12.s3.ap-south-1.amazonaws.com/posters/1785566065355-loki.jpg",
    "banner": null,
    "year": "2021–2023",
    "runtime": "6 Ep",
    "badge": "HD",
    "dubsub": true,
    "views": 0,
    "isFeatured": true,
    "createdAt": "2026-08-01T06:34:26.129Z",
    "updatedAt": "2026-08-01T08:06:15.410Z",
    "categories": [
      {
        "showId": 14,
        "categoryId": 4
      }
    ],
    "episodes": [
      {
        "id": 327,
        "showId": 14,
        "title": "S1.E1 ∙ Glorious Purpose",
        "episodeNumber": 1,
        "description": "",
        "duration": "",
        "videoUrl": "https://serverbuket-12.s3.ap-south-1.amazonaws.com/videos/show_14/ep_327/master.m3u8",
        "transcodeStatus": "COMPLETED",
        "stageDetails": "{\"uploadServer\":{\"percent\":100,\"speed\":\"Done\",\"eta\":0,\"status\":\"COMPLETED\"},\"transcoding\":{\"percent\":45.5,\"speed\":\"1.8x\",\"eta\":30,\"status\":\"PROCESSING\"},\"uploadS3\":{\"percent\":0,\"speed\":\"0 MB/s\",\"eta\":0,\"status\":\"PENDING\"}}",
        "views": 23,
        "createdAt": "2026-08-01T06:35:54.014Z",
        "updatedAt": "2026-08-01T08:45:38.928Z"
      },
      {
        "id": 328,
        "showId": 14,
        "title": "S1.E2 ∙ The Variant",
        "episodeNumber": 2,
        "description": "",
        "duration": "",
        "videoUrl": "https://serverbuket-12.s3.ap-south-1.amazonaws.com/videos/show_14/ep_328/master.m3u8",
        "transcodeStatus": "COMPLETED",
        "stageDetails": "{\"uploadServer\":{\"percent\":100,\"speed\":\"Done\",\"eta\":0,\"status\":\"COMPLETED\"},\"transcoding\":{\"percent\":100,\"speed\":\"Done\",\"eta\":0,\"status\":\"COMPLETED\"},\"uploadS3\":{\"percent\":100,\"speed\":\"Done\",\"eta\":0,\"status\":\"COMPLETED\"}}",
        "views": 2,
        "createdAt": "2026-08-01T08:21:43.221Z",
        "updatedAt": "2026-08-01T09:33:02.816Z"
      }
    ]
  }
];

async function main() {
  console.log("🌱 Seeding EC2 Database...");

  // 1. Seed Categories
  console.log("Seeding categories...");
  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, slug: cat.slug },
      create: { id: cat.id, name: cat.name, slug: cat.slug }
    });
  }

  // 2. Seed Users
  console.log("Seeding users...");
  for (const u of usersData) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role,
        isBanned: u.isBanned
      },
      create: {
        id: u.id,
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role,
        isBanned: u.isBanned
      }
    });
  }

  // 3. Seed Shows & Episodes
  console.log("Seeding shows and episodes...");
  for (const s of showsData) {
    const showExist = await prisma.show.findUnique({ where: { id: s.id } });
    if (!showExist) {
      console.log(`➕ Creating show: ${s.title}...`);
      await prisma.show.create({
        data: {
          id: s.id,
          title: s.title,
          description: s.description,
          type: s.type,
          rating: s.rating,
          poster: s.poster,
          banner: s.banner,
          year: s.year,
          runtime: s.runtime,
          badge: s.badge,
          dubsub: s.dubsub,
          views: s.views,
          isFeatured: s.isFeatured,
          categories: {
            create: s.categories.map(c => ({
              category: { connect: { id: c.categoryId } }
            }))
          },
          episodes: {
            create: s.episodes.map(ep => ({
              id: ep.id,
              title: ep.title,
              episodeNumber: ep.episodeNumber,
              description: ep.description,
              duration: ep.duration,
              videoUrl: ep.videoUrl,
              transcodeStatus: ep.transcodeStatus,
              stageDetails: ep.stageDetails,
              views: ep.views
            }))
          }
        }
      });
      console.log(`   ✅ Created show with ID: ${s.id}`);
    } else {
      const needsShowUpdate =
        showExist.title !== s.title ||
        showExist.description !== s.description ||
        showExist.type !== s.type ||
        showExist.rating !== s.rating ||
        showExist.poster !== s.poster ||
        showExist.banner !== s.banner ||
        showExist.year !== s.year ||
        showExist.runtime !== s.runtime ||
        showExist.badge !== s.badge ||
        showExist.dubsub !== s.dubsub ||
        showExist.isFeatured !== s.isFeatured;

      if (needsShowUpdate) {
        await prisma.show.update({
          where: { id: s.id },
          data: {
            title: s.title,
            description: s.description,
            type: s.type,
            rating: s.rating,
            poster: s.poster,
            banner: s.banner,
            year: s.year,
            runtime: s.runtime,
            badge: s.badge,
            dubsub: s.dubsub,
            isFeatured: s.isFeatured
          }
        });
        console.log(`🔄 Updated show metadata: ${s.title}`);
      } else {
        console.log(`✨ Show metadata up to date: ${s.title}`);
      }

      // Sync categories
      if (s.categories && s.categories.length > 0) {
        for (const c of s.categories) {
          await prisma.categoryOnShow.upsert({
            where: {
              showId_categoryId: {
                showId: s.id,
                categoryId: c.categoryId
              }
            },
            update: {},
            create: {
              showId: s.id,
              categoryId: c.categoryId
            }
          });
        }
      }

      // Sync episodes
      if (s.episodes && s.episodes.length > 0) {
        for (const ep of s.episodes) {
          const existingEp = await prisma.episode.findFirst({
            where: {
              OR: [
                { id: ep.id },
                { showId: s.id, episodeNumber: ep.episodeNumber }
              ]
            }
          });

          if (!existingEp) {
            await prisma.episode.create({
              data: {
                id: ep.id,
                showId: s.id,
                title: ep.title,
                episodeNumber: ep.episodeNumber,
                description: ep.description,
                duration: ep.duration,
                videoUrl: ep.videoUrl,
                transcodeStatus: ep.transcodeStatus,
                stageDetails: ep.stageDetails,
                views: ep.views
              }
            });
            console.log(`   ➕ Added episode ${ep.episodeNumber}: "${ep.title}"`);
          } else {
            const needsEpUpdate =
              existingEp.title !== ep.title ||
              existingEp.videoUrl !== ep.videoUrl ||
              existingEp.transcodeStatus !== ep.transcodeStatus ||
              existingEp.duration !== ep.duration ||
              existingEp.description !== ep.description ||
              existingEp.stageDetails !== ep.stageDetails;

            if (needsEpUpdate) {
              await prisma.episode.update({
                where: { id: existingEp.id },
                data: {
                  title: ep.title,
                  episodeNumber: ep.episodeNumber,
                  description: ep.description,
                  duration: ep.duration,
                  videoUrl: ep.videoUrl,
                  transcodeStatus: ep.transcodeStatus,
                  stageDetails: ep.stageDetails
                }
              });
              console.log(`   🔄 Updated episode ${ep.episodeNumber}: "${ep.title}"`);
            } else {
              console.log(`   ✨ Episode ${ep.episodeNumber} up to date.`);
            }
          }
        }
      }
    }
  }

  console.log("🎉 EC2 Database seeding completed successfully!");
}

main()
  .catch(e => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
