import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Find the Men's Doubles matches in question
  const mdMatches = await prisma.match.findMany({
    where: { sport: 'PICKLEBALL', category: 'MENS_DOUBLES' },
    select: { id: true, matchNumber: true, roundNumber: true, entry1Id: true, entry2Id: true, score1: true, score2: true, winnerId: true, status: true },
    orderBy: { matchNumber: 'asc' },
  });

  // Get names
  const entryIds = mdMatches.flatMap(m => [m.entry1Id, m.entry2Id]).filter(id => id && !id.startsWith('WINNER_'));
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

  // Show R2 matches around M19, M20 and the R3 match they feed into
  console.log('=== Men\'s Doubles R2 matches ===');
  const r2 = mdMatches.filter(m => m.roundNumber === 2);
  for (const m of r2) {
    console.log(`  M${m.matchNumber} R${m.roundNumber}: ${getName(m.entry1Id)} vs ${getName(m.entry2Id)} | score: ${m.score1}-${m.score2} | winner: ${getName(m.winnerId)} | status: ${m.status}`);
  }

  console.log('\n=== Men\'s Doubles R3+ matches ===');
  const r3plus = mdMatches.filter(m => m.roundNumber >= 3);
  for (const m of r3plus) {
    console.log(`  M${m.matchNumber} R${m.roundNumber}: ${getName(m.entry1Id)} vs ${getName(m.entry2Id)} | score: ${m.score1}-${m.score2} | winner: ${getName(m.winnerId)} | status: ${m.status}`);
  }

  // Find M19 (Subham & Sachin vs Ram Gopal & Harshit) and M20 (PITCHAIAH vs Srinath & Rahul)
  const m19 = mdMatches.find(m => m.matchNumber === 19);
  const m20 = mdMatches.find(m => m.matchNumber === 20);
  
  console.log(`\n=== Matches to revert ===`);
  console.log(`M19: ${getName(m19?.entry1Id)} vs ${getName(m19?.entry2Id)} | winner: ${getName(m19?.winnerId)} | status: ${m19?.status}`);
  console.log(`M20: ${getName(m20?.entry1Id)} vs ${getName(m20?.entry2Id)} | winner: ${getName(m20?.winnerId)} | status: ${m20?.status}`);

  // Find the R3 match that M19 and M20 feed into
  // M19 winner goes to a match with WINNER_M19, M20 winner goes to WINNER_M20
  const m19Next = mdMatches.find(m => m.entry1Id === m19?.winnerId || m.entry2Id === m19?.winnerId);
  const m20Next = mdMatches.find(m => m.entry1Id === m20?.winnerId || m.entry2Id === m20?.winnerId);
  
  // Actually, let's find by WINNER_M pattern or by the actual winner ID in later rounds
  const feedsFrom19 = mdMatches.find(m => m.roundNumber > 2 && (m.entry1Id === m19?.winnerId || m.entry2Id === m19?.winnerId));
  const feedsFrom20 = mdMatches.find(m => m.roundNumber > 2 && (m.entry1Id === m20?.winnerId || m.entry2Id === m20?.winnerId));

  if (feedsFrom19) {
    console.log(`\nM19 winner advanced to: M${feedsFrom19.matchNumber} R${feedsFrom19.roundNumber}`);
    console.log(`  Current: ${getName(feedsFrom19.entry1Id)} vs ${getName(feedsFrom19.entry2Id)}`);
  }
  if (feedsFrom20) {
    console.log(`M20 winner advanced to: M${feedsFrom20.matchNumber} R${feedsFrom20.roundNumber}`);
    console.log(`  Current: ${getName(feedsFrom20.entry1Id)} vs ${getName(feedsFrom20.entry2Id)}`);
  }

  // Now fix:
  // 1. Revert M19: clear score, winner, set status back to SCHEDULED
  // 2. Revert M20: clear score, winner, set status back to SCHEDULED
  // 3. In the next round match, replace the advanced winner IDs with WINNER_M19 and WINNER_M20

  if (m19 && m19.status === 'COMPLETED') {
    console.log(`\nReverting M19...`);
    await prisma.match.update({
      where: { id: m19.id },
      data: { score1: null, score2: null, winnerId: null, status: 'SCHEDULED' },
    });
    console.log('  M19 reverted to SCHEDULED');

    // Find where the winner was placed and revert to WINNER_M19
    if (feedsFrom19 && m19.winnerId) {
      if (feedsFrom19.entry1Id === m19.winnerId) {
        await prisma.match.update({ where: { id: feedsFrom19.id }, data: { entry1Id: `WINNER_M${m19.matchNumber}` } });
        console.log(`  M${feedsFrom19.matchNumber} entry1 reverted to WINNER_M${m19.matchNumber}`);
      } else if (feedsFrom19.entry2Id === m19.winnerId) {
        await prisma.match.update({ where: { id: feedsFrom19.id }, data: { entry2Id: `WINNER_M${m19.matchNumber}` } });
        console.log(`  M${feedsFrom19.matchNumber} entry2 reverted to WINNER_M${m19.matchNumber}`);
      }
    }
  }

  if (m20 && m20.status === 'COMPLETED') {
    console.log(`\nReverting M20...`);
    await prisma.match.update({
      where: { id: m20.id },
      data: { score1: null, score2: null, winnerId: null, status: 'SCHEDULED' },
    });
    console.log('  M20 reverted to SCHEDULED');

    if (feedsFrom20 && m20.winnerId) {
      if (feedsFrom20.entry1Id === m20.winnerId) {
        await prisma.match.update({ where: { id: feedsFrom20.id }, data: { entry1Id: `WINNER_M${m20.matchNumber}` } });
        console.log(`  M${feedsFrom20.matchNumber} entry1 reverted to WINNER_M${m20.matchNumber}`);
      } else if (feedsFrom20.entry2Id === m20.winnerId) {
        await prisma.match.update({ where: { id: feedsFrom20.id }, data: { entry2Id: `WINNER_M${m20.matchNumber}` } });
        console.log(`  M${feedsFrom20.matchNumber} entry2 reverted to WINNER_M${m20.matchNumber}`);
      }
    }
  }

  console.log('\nDone!');
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
