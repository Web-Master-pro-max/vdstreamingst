const { PrismaClient } = require('@prisma/client');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
const prisma = new PrismaClient();

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

async function main() {
  console.log('Upserting all genres and categories...');
  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: cat,
    });
  }
  const total = await prisma.category.count();
  console.log(`✅ Success! Total categories in DB: ${total}`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
