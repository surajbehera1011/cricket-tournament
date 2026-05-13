import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.match.updateMany({
    where: { sport: 'PICKLEBALL', notificationSent: true },
    data: { notificationSent: false },
  });
  console.log(`Reset ${result.count} matches to notificationSent = false`);
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
