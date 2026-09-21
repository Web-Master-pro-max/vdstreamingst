const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Attaching categories to shows...");
  
  const shows = await prisma.show.findMany({ include: { categories: true } });
  const allCategories = await prisma.category.findMany();

  for (const show of shows) {
    // Attach top popular genres & categories to existing shows for demonstration
    let targetSlugs = ['anime', 'action', 'adventure', 'hollywood', 'south-hindi-dubbed', 'bollywood', 'sci-fi', 'thriller', 'web-series', 'horror'];
    
    for (const slug of targetSlugs) {
      const cat = allCategories.find(c => c.slug === slug);
      if (cat) {
        const exists = show.categories.some(c => c.categoryId === cat.id);
        if (!exists) {
          await prisma.categoryOnShow.create({
            data: {
              showId: show.id,
              categoryId: cat.id
            }
          }).catch(() => {});
        }
      }
    }
  }

  console.log("✅ Attached categories to shows successfully!");
  await prisma.$disconnect();
}

main().catch(console.error);
