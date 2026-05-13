import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Get all pickleball matches that need scheduling for today (May 13)
  // These are matches where both players are confirmed AND either:
  // - Not yet scheduled (scheduledDate is null)
  // - Already scheduled for today but need verification
  
  const allMatches = await prisma.match.findMany({
    where: { sport: 'PICKLEBALL' },
    select: { id: true, matchNumber: true, roundNumber: true, category: true, entry1Id: true, entry2Id: true, scheduledDate: true, venue: true, status: true, winnerId: true, notificationSent: true },
    orderBy: [{ category: 'asc' }, { roundNumber: 'asc' }, { matchNumber: 'asc' }],
  });

  // Get player names
  const entryIds = allMatches.flatMap(m => [m.entry1Id, m.entry2Id]).filter(id => id && !id.startsWith('WINNER_'));
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

  // Find matches that are ready to play (both entries confirmed, not completed)
  const readyMatches = allMatches.filter(m => 
    m.status !== 'COMPLETED' &&
    m.entry1Id && m.entry2Id &&
    !m.entry1Id.startsWith('WINNER_') &&
    !m.entry2Id.startsWith('WINNER_')
  );

  console.log(`\n=== READY MATCHES (both players confirmed, not completed): ${readyMatches.length} ===\n`);
  
  const categories = ['MENS_SINGLES', 'MENS_DOUBLES', 'WOMENS_DOUBLES', 'MIXED_DOUBLES', 'WOMENS_SINGLES'];
  
  for (const cat of categories) {
    const catMatches = readyMatches.filter(m => m.category === cat).sort((a, b) => {
      if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber;
      return a.matchNumber - b.matchNumber;
    });
    if (catMatches.length === 0) continue;
    
    console.log(`--- ${cat} (${catMatches.length} matches ready) ---`);
    for (const m of catMatches) {
      const scheduled = m.scheduledDate ? `${new Date(m.scheduledDate).toISOString().split('T')[0]} ${m.venue}` : 'UNSCHEDULED';
      console.log(`  M${m.matchNumber} R${m.roundNumber}: ${getName(m.entry1Id)} vs ${getName(m.entry2Id)} | ${scheduled} | notified: ${m.notificationSent}`);
    }
    console.log('');
  }

  // Also show completed matches from yesterday for context
  const completed = allMatches.filter(m => m.status === 'COMPLETED');
  console.log(`\n=== COMPLETED MATCHES: ${completed.length} ===`);
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
