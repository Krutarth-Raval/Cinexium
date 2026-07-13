const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'reviewer@cinexium.site' },
    update: {},
    create: {
      email: 'reviewer@cinexium.site',
      name: 'Razorpay Reviewer',
      username: 'reviewer',
      verified: true
    }
  });
  console.log('Test user created: reviewer@cinexium.site');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
