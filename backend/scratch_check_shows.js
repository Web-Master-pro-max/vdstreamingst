const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const shows = await prisma.show.findMany({
    include: {
      episodes: true
    }
  });
  console.log(JSON.stringify(shows, null, 2));
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
