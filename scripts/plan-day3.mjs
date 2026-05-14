import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const allMatches = await prisma.match.findMany({
    where: { sport: 'PICKLEBALL' },
    select: { id: true, matchNumber: true, roundNumber: true, category: true, entry1Id: true, entry2Id: true, score1: true, score2: true, winnerId: true, status: true, scheduledDate: true, venue: true },
    orderBy: [{ category: 'asc' }, { roundNumber: 'asc' }, { matchNumber: 'asc' }],
  });

  const entryIds = allMatches.flatMap(m => [m.entry1Id, m.entry2Id]).filter(id => id && !id.startsWith('WINNER_'));
  const regs = await prisma.pickleballRegistration.findMany({
    where: { id: { in: entryIds } },
    select: { id: true, player1Name: true, player2Name: true },
  });
  const nameMap = new Map(regs.map(r => [r.id, r.player2Name ? `${r.player1Name} & ${r.player2Name}` : r.player1Name]));
  const getName = (id) => {
    if (!id) return 'TBD';
    if (id.startsWith('WINNER_')) return id;
    return nameMap.get(id) || id.substring(0, 8);
  };

  // Separate completed vs remaining
  const completed = allMatches.filter(m => m.status === 'COMPLETED');
  const remaining = allMatches.filter(m => m.status !== 'COMPLETED');

  // Completed matches that were played on 13th but might have wrong dates
  const completedOn13 = completed.filter(m => {
    if (!m.scheduledDate) return false;
    const ist = new Date(m.scheduledDate.getTime() + 5.5 * 60 * 60 * 1000);
    return ist.getUTCDate() === 13;
  });

  console.log(`=== SUMMARY ===`);
  console.log(`Total matches: ${allMatches.length}`);
  console.log(`Completed: ${completed.length}`);
  console.log(`Remaining: ${remaining.length}`);
  console.log(`Completed scheduled on 13th: ${completedOn13.length}`);

  // Show remaining matches by category
  const categories = ['MENS_SINGLES', 'MENS_DOUBLES', 'WOMENS_DOUBLES', 'MIXED_DOUBLES', 'WOMENS_SINGLES'];
  
  console.log(`\n=== REMAINING MATCHES (not completed) ===\n`);
  
  let totalReady = 0;
  let totalWaiting = 0;
  
  for (const cat of categories) {
    const catRemaining = remaining.filter(m => m.category === cat);
    if (catRemaining.length === 0) continue;
    
    const ready = catRemaining.filter(m => m.entry1Id && m.entry2Id && !m.entry1Id.startsWith('WINNER_') && !m.entry2Id.startsWith('WINNER_'));
    const waiting = catRemaining.filter(m => !m.entry1Id || !m.entry2Id || m.entry1Id?.startsWith('WINNER_') || m.entry2Id?.startsWith('WINNER_'));
    
    console.log(`--- ${cat} (${catRemaining.length} remaining: ${ready.length} ready, ${waiting.length} waiting) ---`);
    
    for (const m of catRemaining) {
      const isReady = m.entry1Id && m.entry2Id && !m.entry1Id.startsWith('WINNER_') && !m.entry2Id.startsWith('WINNER_');
      const isFinal = m.roundNumber === Math.max(...catRemaining.map(x => x.roundNumber));
      const isSemi = m.roundNumber === Math.max(...catRemaining.map(x => x.roundNumber)) - 1 && catRemaining.filter(x => x.roundNumber === m.roundNumber).length <= 2;
      const tag = isFinal ? ' [FINAL]' : isSemi ? ' [SEMI]' : '';
      console.log(`  M${m.matchNumber} R${m.roundNumber}${tag}: ${getName(m.entry1Id)} vs ${getName(m.entry2Id)} | ${isReady ? 'READY' : 'WAITING'}`);
    }
    
    totalReady += ready.length;
    totalWaiting += waiting.length;
    console.log('');
  }

  console.log(`\nTotal ready to schedule: ${totalReady}`);
  console.log(`Total waiting for results: ${totalWaiting}`);
  
  // Time slots for May 14: 4 PM to 8 PM = 12 slots of 20 min
  console.log(`\n=== AVAILABLE SLOTS (May 14, 4:00 PM - 8:00 PM) ===`);
  console.log(`12 slots per court × 3 courts = 36 total slots`);
  console.log(`Finals start from 6:00 PM`);
  console.log(`Semi-finals and finals are 3-set matches (longer)`);
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
