const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Categories
  const categoriesData = [
    { name: 'Action Movies', slug: 'action' },
    { name: 'Anime Series', slug: 'anime' },
    { name: 'Hollywood Movies', slug: 'hollywood' },
    { name: 'Web Series', slug: 'web-series' },
    { name: 'Horror Movies', slug: 'horror' },
    { name: 'Kids & Family', slug: 'kids' },
    { name: 'Korean Drama', slug: 'kdrama' },
  ];

  console.log('Upserting categories...');
  const categories = {};
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
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
    update: {},
    create: {
      email: adminEmail,
      passwordHash: passwordHash,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user seeded.');

  // 3. Seed some initial shows
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
          videoUrl: "https://server-3a.s3.ap-south-1.amazonaws.com/Breaking+Bad+Season+1/master.m3u8", // Using the user's existing HLS folders if available
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

    if (!exists) {
      console.log(`Creating show: ${show.title}...`);
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
          isFeatured: show.title.includes("Demon Slayer") || show.title.includes("Spy X Family"),
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
      console.log(`✅ Created show with ID: ${createdShow.id}`);
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
