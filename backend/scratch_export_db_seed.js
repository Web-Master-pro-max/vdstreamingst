const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
const prisma = new PrismaClient();

async function main() {
  console.log("📦 Extracting live database snapshot...");

  const users = await prisma.user.findMany();
  const categories = await prisma.category.findMany();
  const shows = await prisma.show.findMany({
    include: {
      categories: true,
      episodes: true
    }
  });

  console.log(`Found ${users.length} Users, ${categories.length} Categories, ${shows.length} Shows.`);

  // Write EC2 Prisma Seed Script
  const seedScriptContent = `const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const categoriesData = ${JSON.stringify(categories, null, 2)};
const usersData = ${JSON.stringify(users, null, 2)};
const showsData = ${JSON.stringify(shows, null, 2)};

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
`;

  const seedFilePath = path.join(__dirname, 'prisma', 'seed_ec2.js');
  fs.writeFileSync(seedFilePath, seedScriptContent, 'utf8');
  console.log(`✅ Generated EC2 seed script: ${seedFilePath}`);

  // Generate Raw SQL dump file
  let sqlDump = `-- Infinx Anime SQL Migration Dump for EC2\n\nSET FOREIGN_KEY_CHECKS=0;\n\n`;

  // Categories SQL
  sqlDump += `-- Table: Category\n`;
  for (const cat of categories) {
    sqlDump += `INSERT INTO \`Category\` (\`id\`, \`name\`, \`slug\`) VALUES (${cat.id}, '${cat.name.replace(/'/g, "\\'")}', '${cat.slug}') ON DUPLICATE KEY UPDATE \`name\`='${cat.name.replace(/'/g, "\\'")}';\n`;
  }

  // Users SQL
  sqlDump += `\n-- Table: User\n`;
  for (const u of users) {
    sqlDump += `INSERT INTO \`User\` (\`id\`, \`email\`, \`passwordHash\`, \`role\`, \`isBanned\`, \`createdAt\`, \`updatedAt\`) VALUES (${u.id}, '${u.email}', '${u.passwordHash}', '${u.role}', ${u.isBanned ? 1 : 0}, NOW(), NOW()) ON DUPLICATE KEY UPDATE \`role\`='${u.role}';\n`;
  }

  // Shows SQL
  sqlDump += `\n-- Table: Show\n`;
  for (const s of shows) {
    const poster = (s.poster || '').replace(/'/g, "\\'");
    const banner = s.banner ? `'${s.banner.replace(/'/g, "\\'")}'` : 'NULL';
    const title = s.title.replace(/'/g, "\\'");
    const desc = s.description.replace(/'/g, "\\'");
    sqlDump += `INSERT INTO \`Show\` (\`id\`, \`title\`, \`description\`, \`type\`, \`rating\`, \`poster\`, \`banner\`, \`year\`, \`runtime\`, \`badge\`, \`dubsub\`, \`views\`, \`isFeatured\`, \`createdAt\`, \`updatedAt\`) VALUES (${s.id}, '${title}', '${desc}', '${s.type}', ${s.rating}, '${poster}', ${banner}, '${s.year}', '${s.runtime}', '${s.badge}', ${s.dubsub ? 1 : 0}, ${s.views}, ${s.isFeatured ? 1 : 0}, NOW(), NOW()) ON DUPLICATE KEY UPDATE \`title\`='${title}';\n`;

    for (const c of s.categories) {
      sqlDump += `INSERT INTO \`CategoryOnShow\` (\`showId\`, \`categoryId\`) VALUES (${c.showId}, ${c.categoryId}) ON DUPLICATE KEY UPDATE \`showId\`=${c.showId};\n`;
    }

    for (const ep of s.episodes) {
      const epTitle = ep.title.replace(/'/g, "\\'");
      const epDesc = ep.description ? `'${ep.description.replace(/'/g, "\\'")}'` : 'NULL';
      const epDuration = ep.duration ? `'${ep.duration}'` : 'NULL';
      const videoUrl = ep.videoUrl ? `'${ep.videoUrl.replace(/'/g, "\\'")}'` : 'NULL';
      const stageDetails = ep.stageDetails ? `'${ep.stageDetails.replace(/'/g, "\\'")}'` : 'NULL';
      sqlDump += `INSERT INTO \`Episode\` (\`id\`, \`showId\`, \`title\`, \`episodeNumber\`, \`description\`, \`duration\`, \`videoUrl\`, \`transcodeStatus\`, \`stageDetails\`, \`views\`, \`createdAt\`, \`updatedAt\`) VALUES (${ep.id}, ${ep.showId}, '${epTitle}', ${ep.episodeNumber}, ${epDesc}, ${epDuration}, ${videoUrl}, '${ep.transcodeStatus}', ${stageDetails}, ${ep.views}, NOW(), NOW()) ON DUPLICATE KEY UPDATE \`title\`='${epTitle}';\n`;
    }
  }

  sqlDump += `\nSET FOREIGN_KEY_CHECKS=1;\n`;
  const sqlFilePath = path.join(__dirname, 'prisma', 'seed_dump.sql');
  fs.writeFileSync(sqlFilePath, sqlDump, 'utf8');
  console.log(`✅ Generated SQL dump file: ${sqlFilePath}`);
}

main().finally(() => prisma.$disconnect());
