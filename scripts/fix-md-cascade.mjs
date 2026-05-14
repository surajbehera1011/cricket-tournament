import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // M26 R3 was also completed based on the wrong M19/M20 results
  // M26 winner (Srinath & Rahul) was advanced to M29 R4
  // Need to revert M26 and undo M29 advancement

  const mdMatches = await prisma.match.findMany({
    where: { sport: 'PICKLEBALL', category: 'MENS_DOUBLES', matchNumber: { in: [26, 29] } },
    select: { id: true, matchNumber: true, roundNumber: true, entry1Id: true, entry2Id: true, score1: true, score2: true, winnerId: true, status: true },
  });

  const entryIds = mdMatches.flatMap(m => [m.entry1Id, m.entry2Id, m.winnerId]).filter(id => id && !id.startsWith('WINNER_'));
  const regs = await prisma.pickleballRegistration.findMany({
    where: { id: { in: entryIds } },
    select: { id: true, player1Name: true, player2Name: true },
  });
  const nameMap = new Map(regs.map(r => [r.id, r.player2Name ? `${r.player1Name} & ${r.player2Name}` : r.player1Name]));
  const getName = (id) => {
    if (!id) return 'null';
    if (id.startsWith('WINNER_')) return id;
    return nameMap.get(id) || id.substring(0, 8);
  };

  const m26 = mdMatches.find(m => m.matchNumber === 26);
  const m29 = mdMatches.find(m => m.matchNumber === 29);

  console.log(`M26 R3: ${getName(m26?.entry1Id)} vs ${getName(m26?.entry2Id)} | score: ${m26?.score1}-${m26?.score2} | winner: ${getName(m26?.winnerId)} | status: ${m26?.status}`);
  console.log(`M29 R4: ${getName(m29?.entry1Id)} vs ${getName(m29?.entry2Id)} | score: ${m29?.score1}-${m29?.score2} | winner: ${getName(m29?.winnerId)} | status: ${m29?.status}`);

  // Revert M26: clear score/winner, set entries back to WINNER_M19 and WINNER_M20
  if (m26) {
    console.log('\nReverting M26...');
    await prisma.match.update({
      where: { id: m26.id },
      data: { 
        score1: null, 
        score2: null, 
        winnerId: null, 
        status: 'SCHEDULED',
        entry1Id: 'WINNER_M19',
        entry2Id: 'WINNER_M20',
      },
    });
    console.log('  M26 reverted (entries set to WINNER_M19 vs WINNER_M20)');
  }

  // Revert M29: replace the M26 winner with WINNER_M26
  if (m29 && m26?.winnerId) {
    if (m29.entry1Id === m26.winnerId) {
      await prisma.match.update({ where: { id: m29.id }, data: { entry1Id: 'WINNER_M26' } });
      console.log('  M29 entry1 reverted to WINNER_M26');
    } else if (m29.entry2Id === m26.winnerId) {
      await prisma.match.update({ where: { id: m29.id }, data: { entry2Id: 'WINNER_M26' } });
      console.log('  M29 entry2 reverted to WINNER_M26');
    }
  }

  console.log('\nDone! M19, M20, M26 are all back to SCHEDULED. M29 waiting for WINNER_M26.');
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
