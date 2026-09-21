const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Categories & Genres
  const categoriesData = [
    // Categories
    { name: 'South Hindi Dubbed', slug: 'south-hindi-dubbed' },
    { name: 'Hollywood Movies', slug: 'hollywood' },
    { name: 'Bollywood Movies', slug: 'bollywood' },
    { name: 'Anime Series', slug: 'anime' },
    { name: 'Web Series', slug: 'web-series' },
    { name: 'Kids & Family', slug: 'kids' },
    { name: 'Korean Drama', slug: 'kdrama' },
    // Genres
    { name: 'Action', slug: 'action' },
    { name: 'Adventure', slug: 'adventure' },
    { name: 'Animation', slug: 'animation' },
    { name: 'Comedy', slug: 'comedy' },
    { name: 'Crime', slug: 'crime' },
    { name: 'Drama', slug: 'drama' },
    { name: 'Fantasy', slug: 'fantasy' },
    { name: 'Historical', slug: 'historical' },
    { name: 'Horror', slug: 'horror' },
    { name: 'Mystery', slug: 'mystery' },
    { name: 'Political', slug: 'political' },
    { name: 'Romance', slug: 'romance' },
    { name: 'Sci-Fi', slug: 'sci-fi' },
    { name: 'Thriller', slug: 'thriller' }
  ];

  console.log('Upserting categories...');
  const categories = {};
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: cat,
    });
    categories[cat.slug] = createdCat;
  }
  console.log(`✅ Seeded ${Object.keys(categories).length} categories.`);

  // 2. Seed Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@infinx.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  console.log(`Upserting admin user: ${adminEmail}...`);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: passwordHash,
      role: 'ADMIN',
    },
    create: {
      email: adminEmail,
      passwordHash: passwordHash,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user seeded.');

  // 3. Seed initial shows (Create missing, Update changed)
  console.log('Seeding initial mock shows...');
  
  const showsData = [
    {
      title: "Demon Slayer: Infinity Castle",
      description: "The Demon Slayer Corps are drawn into the Infinity Castle, where Muzan Kibutsuji awaits their arrival.",
      type: "movie",
      rating: 8.4,
      poster: "Postes/infinit-cas11.jpg",
      year: "2025",
      runtime: "2h 35m",
      badge: "HD",
      dubsub: true,
      categorySlugs: ["action", "anime"],
      episodes: [
        {
          title: "Infinity Castle - Movie Cut",
          episodeNumber: 1,
          videoUrl: "https://server-3a.s3.ap-south-1.amazonaws.com/Demon_Slayer_Kimetsu_No_Yaiba+The_Movie_Infinity/master.m3u8",
          transcodeStatus: "COMPLETED",
          duration: "155:00"
        }
      ]
    },
    {
      title: "Breaking Bad Season 1",
      description: "A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing methamphetamine with a former student to secure his family's future.",
      type: "series",
      rating: 9.5,
      poster: "Postes/breakingb1.jpg",
      year: "2008",
      runtime: "7 Ep",
      badge: "HD",
      dubsub: false,
      categorySlugs: ["web-series"],
      episodes: [
        {
          title: "Pilot",
          episodeNumber: 1,
          videoUrl: "https://server-3a.s3.ap-south-1.amazonaws.com/Breaking+Bad+Season+1/master.m3u8",
          transcodeStatus: "COMPLETED",
          duration: "58:00"
        },
        {
          title: "Cat's in the Bag...",
          episodeNumber: 2,
          videoUrl: null,
          transcodeStatus: "PENDING",
          duration: "48:00"
        }
      ]
    },
    {
      title: "Spy X Family Season 3",
      description: "Continues the comedic, action-packed adventures of the Forger family who keep their secret identities hidden from one another.",
      type: "series",
      rating: 8.3,
      poster: "Postes/spyfamS3p.jpg",
      year: "2025",
      runtime: "1 Ep",
      badge: "HD",
      dubsub: true,
      categorySlugs: ["anime"],
      episodes: [
        {
          title: "Episode 1",
          episodeNumber: 1,
          videoUrl: "https://server-s3-6.s3.eu-north-1.amazonaws.com/Server-S3/SpyxfamilyS3/master.m3u8",
          transcodeStatus: "COMPLETED",
          duration: "24:00"
        }
      ]
    },
    {
      title: "The Nun",
      description: "A priest with a haunted past and a novice on the threshold of her final vows are sent by the Vatican to investigate the death of a young nun.",
      type: "movie",
      rating: 5.3,
      poster: "Horror-poster/the nun.jpeg",
      year: "2018",
      runtime: "96 min",
      badge: "HD",
      dubsub: false,
      categorySlugs: ["horror"],
      episodes: [
        {
          title: "The Nun Movie",
          episodeNumber: 1,
          videoUrl: "https://videobucket43.s3.eu-north-1.amazonaws.com/Horror+movies/The+Nun+(2018)+Dual+Audio/master.m3u8",
          transcodeStatus: "COMPLETED",
          duration: "96:00"
        }
      ]
    },
    {
      title: "Descendants Of The Sun",
      description: "A love story between Captain Yoo Si-jin, a South Korean special forces officer, and Dr. Kang Mo-yeon, a dedicated surgeon.",
      type: "series",
      rating: 8.2,
      poster: "Postes/Descendants Of The Sun.jpg",
      year: "2016",
      runtime: "1 Ep",
      badge: "HD",
      dubsub: false,
      categorySlugs: ["kdrama"],
      episodes: [
        {
          title: "Episode 1",
          episodeNumber: 1,
          videoUrl: "https://server-s3-6.s3.eu-north-1.amazonaws.com/Server-S3/Descendants+of+the+Sun+S01/master.m3u8",
          transcodeStatus: "COMPLETED",
          duration: "60:00"
        }
      ]
    }
  ];

  for (const show of showsData) {
    const exists = await prisma.show.findFirst({
      where: { title: show.title }
    });

    const isFeatured = show.title.includes("Demon Slayer") || show.title.includes("Spy X Family");

    if (!exists) {
      console.log(`➕ Creating show: ${show.title}...`);
      const createdShow = await prisma.show.create({
        data: {
          title: show.title,
          description: show.description,
          type: show.type,
          rating: show.rating,
          poster: show.poster,
          year: show.year,
          runtime: show.runtime,
          badge: show.badge,
          dubsub: show.dubsub,
          isFeatured: isFeatured,
          categories: {
            create: show.categorySlugs.map(slug => ({
              category: {
                connect: { slug }
              }
            }))
          },
          episodes: {
            create: show.episodes
          }
        }
      });
      console.log(`   ✅ Created show with ID: ${createdShow.id}`);
    } else {
      // Check if show fields need updating
      const needsShowUpdate =
        exists.description !== show.description ||
        exists.type !== show.type ||
        exists.rating !== show.rating ||
        exists.poster !== show.poster ||
        exists.year !== show.year ||
        exists.runtime !== show.runtime ||
        exists.badge !== show.badge ||
        exists.dubsub !== show.dubsub ||
        exists.isFeatured !== isFeatured;

      if (needsShowUpdate) {
        await prisma.show.update({
          where: { id: exists.id },
          data: {
            description: show.description,
            type: show.type,
            rating: show.rating,
            poster: show.poster,
            year: show.year,
            runtime: show.runtime,
            badge: show.badge,
            dubsub: show.dubsub,
            isFeatured: isFeatured
          }
        });
        console.log(`🔄 Updated show metadata: ${show.title}`);
      } else {
        console.log(`✨ Show metadata up to date: ${show.title}`);
      }

      // Sync categories for existing show
      if (show.categorySlugs && show.categorySlugs.length > 0) {
        for (const slug of show.categorySlugs) {
          const cat = categories[slug];
          if (cat) {
            await prisma.categoryOnShow.upsert({
              where: {
                showId_categoryId: {
                  showId: exists.id,
                  categoryId: cat.id
                }
              },
              update: {},
              create: {
                showId: exists.id,
                categoryId: cat.id
              }
            });
          }
        }
      }

      // Sync episodes for existing show
      if (show.episodes && show.episodes.length > 0) {
        for (const ep of show.episodes) {
          const existingEp = await prisma.episode.findFirst({
            where: {
              showId: exists.id,
              episodeNumber: ep.episodeNumber
            }
          });

          if (!existingEp) {
            await prisma.episode.create({
              data: {
                showId: exists.id,
                title: ep.title,
                episodeNumber: ep.episodeNumber,
                videoUrl: ep.videoUrl,
                transcodeStatus: ep.transcodeStatus,
                duration: ep.duration
              }
            });
            console.log(`   ➕ Added episode ${ep.episodeNumber}: "${ep.title}"`);
          } else {
            const needsEpUpdate =
              existingEp.title !== ep.title ||
              existingEp.videoUrl !== ep.videoUrl ||
              existingEp.transcodeStatus !== ep.transcodeStatus ||
              existingEp.duration !== ep.duration;

            if (needsEpUpdate) {
              await prisma.episode.update({
                where: { id: existingEp.id },
                data: {
                  title: ep.title,
                  videoUrl: ep.videoUrl,
                  transcodeStatus: ep.transcodeStatus,
                  duration: ep.duration
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

  console.log('🎉 Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
