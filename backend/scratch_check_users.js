const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany().then(u => {
    console.log("Users in DB:", u);
    process.exit(0);
}).catch(e => {
    console.error("Error:", e);
    process.exit(1);
});
