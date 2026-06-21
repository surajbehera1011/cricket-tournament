import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const team = await prisma.team.findMany({
    where: { name: { contains: 'RoKo', mode: 'insensitive' } },
    select: { id: true, name: true, status: true, createdAt: true },
  });
  console.log('RoKo team:', JSON.stringify(team, null, 2));
  
  const total = await prisma.team.count();
  console.log('Total teams:', total);
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
