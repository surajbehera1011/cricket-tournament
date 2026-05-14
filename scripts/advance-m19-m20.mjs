import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // M19 winner should advance to M26 entry1
  // M20 winner should advance to M26 entry2
  
  const m19 = await prisma.match.findFirst({
    where: { sport: 'PICKLEBALL', category: 'MENS_DOUBLES', matchNumber: 19 },
    select: { id: true, winnerId: true, entry1Id: true, entry2Id: true, score1: true, score2: true, status: true },
  });
  
  const m20 = await prisma.match.findFirst({
    where: { sport: 'PICKLEBALL', category: 'MENS_DOUBLES', matchNumber: 20 },
    select: { id: true, winnerId: true, entry1Id: true, entry2Id: true, score1: true, score2: true, status: true },
  });

  const m26 = await prisma.match.findFirst({
    where: { sport: 'PICKLEBALL', category: 'MENS_DOUBLES', matchNumber: 26 },
    select: { id: true, entry1Id: true, entry2Id: true },
  });

  console.log(`M19: score ${m19?.score1}-${m19?.score2}, winner: ${m19?.winnerId?.substring(0,8)}, status: ${m19?.status}`);
  console.log(`M20: score ${m20?.score1}-${m20?.score2}, winner: ${m20?.winnerId?.substring(0,8)}, status: ${m20?.status}`);
  console.log(`M26: entry1=${m26?.entry1Id}, entry2=${m26?.entry2Id}`);

  if (m19?.winnerId && m20?.winnerId && m26) {
    await prisma.match.update({
      where: { id: m26.id },
      data: {
        entry1Id: m19.winnerId,
        entry2Id: m20.winnerId,
      },
    });
    console.log(`\nAdvanced M19 winner to M26 entry1, M20 winner to M26 entry2`);
    console.log('M26 is now ready to play!');
  } else {
    console.log('\nCannot advance — missing winner IDs');
  }
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
