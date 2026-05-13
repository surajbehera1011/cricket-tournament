import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check how many matches have notificationSent = true
  const notified = await prisma.match.findMany({
    where: { sport: 'PICKLEBALL', notificationSent: true },
    select: { id: true, matchNumber: true, roundNumber: true, category: true, entry1Id: true, entry2Id: true, scheduledDate: true, venue: true },
  });
  console.log(`\n=== Matches with notificationSent = true: ${notified.length} ===`);
  for (const m of notified) {
    console.log(`  M${m.matchNumber} R${m.roundNumber} ${m.category} | ${m.venue} | ${m.scheduledDate}`);
  }

  // Check how many matches are ready to notify (both entries confirmed, scheduled, not yet notified)
  const ready = await prisma.match.findMany({
    where: {
      sport: 'PICKLEBALL',
      scheduledDate: { not: null },
      venue: { not: null },
      notificationSent: false,
      entry1Id: { not: null },
      entry2Id: { not: null },
    },
    select: { id: true, matchNumber: true, roundNumber: true, category: true, entry1Id: true, entry2Id: true, scheduledDate: true, venue: true },
  });

  // Filter out WINNER_ placeholders
  const reallyReady = ready.filter(m => 
    m.entry1Id && m.entry2Id && 
    !m.entry1Id.startsWith('WINNER_') && 
    !m.entry2Id.startsWith('WINNER_')
  );
  console.log(`\n=== Matches ready to notify (not yet sent): ${reallyReady.length} ===`);
  for (const m of reallyReady.slice(0, 10)) {
    console.log(`  M${m.matchNumber} R${m.roundNumber} ${m.category} | ${m.venue} | ${m.scheduledDate}`);
  }
  if (reallyReady.length > 10) console.log(`  ... and ${reallyReady.length - 10} more`);

  // Check if sbehera is in any of the notified matches
  const allEntryIds = [...notified.map(m => m.entry1Id), ...notified.map(m => m.entry2Id)].filter(Boolean);
  if (allEntryIds.length > 0) {
    const regs = await prisma.pickleballRegistration.findMany({
      where: { id: { in: allEntryIds } },
      select: { id: true, player1Name: true, player1Email: true, player2Name: true, player2Email: true },
    });
    console.log(`\n=== Players in notified matches ===`);
    for (const r of regs) {
      console.log(`  ${r.player1Name} | email: ${r.player1Email?.substring(0, 20)}...`);
      if (r.player2Name) console.log(`  ${r.player2Name} | email: ${r.player2Email?.substring(0, 20)}...`);
    }
  }

  // Check total scheduled matches
  const totalScheduled = await prisma.match.count({
    where: { sport: 'PICKLEBALL', scheduledDate: { not: null } },
  });
  console.log(`\n=== Total scheduled pickleball matches: ${totalScheduled} ===`);
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
