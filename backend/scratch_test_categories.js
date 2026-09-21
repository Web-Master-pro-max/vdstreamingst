const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      shows: { select: { showId: true } }
    }
  });

  console.log("=== DB CATEGORIES SUMMARY ===");
  categories.forEach(c => {
    console.log(`[${c.id}] ${c.name} (slug: ${c.slug}) -> ${c.shows.length} shows`);
  });
  
  await prisma.$disconnect();
}

main().catch(console.error);
