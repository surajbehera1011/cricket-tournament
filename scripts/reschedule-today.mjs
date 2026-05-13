import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TODAY = "2026-05-13";
const TIME_SLOTS = ["17:00", "17:20", "17:40", "18:00", "18:20", "18:40", "19:00", "19:20", "19:40"];

function buildDateTime(date, startTime) {
  const [hours, minutes] = startTime.split(":").map(Number);
  return new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:30`);
}

async function main() {
  // Step 1: Get all ready matches (both players confirmed, not completed)
  const allMatches = await prisma.match.findMany({
    where: { sport: 'PICKLEBALL', status: { not: 'COMPLETED' } },
    select: { id: true, matchNumber: true, roundNumber: true, category: true, entry1Id: true, entry2Id: true, scheduledDate: true, venue: true, notificationSent: true },
    orderBy: [{ category: 'asc' }, { roundNumber: 'asc' }, { matchNumber: 'asc' }],
  });

  const readyMatches = allMatches.filter(m =>
    m.entry1Id && m.entry2Id &&
    !m.entry1Id.startsWith('WINNER_') &&
    !m.entry2Id.startsWith('WINNER_')
  );

  // Get player names for display
  const entryIds = readyMatches.flatMap(m => [m.entry1Id, m.entry2Id]).filter(Boolean);
  const regs = await prisma.pickleballRegistration.findMany({
    where: { id: { in: entryIds } },
    select: { id: true, player1Name: true, player2Name: true },
  });
  const nameMap = new Map(regs.map(r => [r.id, r.player2Name ? `${r.player1Name} & ${r.player2Name}` : r.player1Name]));
  const getName = (id) => nameMap.get(id) || id?.substring(0, 8) || '?';

  // Separate by category
  const ms = readyMatches.filter(m => m.category === 'MENS_SINGLES').sort((a, b) => a.roundNumber !== b.roundNumber ? a.roundNumber - b.roundNumber : a.matchNumber - b.matchNumber);
  const md = readyMatches.filter(m => m.category === 'MENS_DOUBLES').sort((a, b) => a.roundNumber !== b.roundNumber ? a.roundNumber - b.roundNumber : a.matchNumber - b.matchNumber);
  const wd = readyMatches.filter(m => m.category === 'WOMENS_DOUBLES').sort((a, b) => a.roundNumber !== b.roundNumber ? a.roundNumber - b.roundNumber : a.matchNumber - b.matchNumber);
  const mxd = readyMatches.filter(m => m.category === 'MIXED_DOUBLES').sort((a, b) => a.roundNumber !== b.roundNumber ? a.roundNumber - b.roundNumber : a.matchNumber - b.matchNumber);
  const ws = readyMatches.filter(m => m.category === 'WOMENS_SINGLES').sort((a, b) => a.roundNumber !== b.roundNumber ? a.roundNumber - b.roundNumber : a.matchNumber - b.matchNumber);

  console.log(`Ready matches: MS=${ms.length}, MD=${md.length}, WD=${wd.length}, MXD=${mxd.length}, WS=${ws.length}`);

  // Schedule for today:
  // Court 1: Men's Singles (up to 9 slots)
  // Court 2: Men's Doubles (7 slots, 5:00-6:20) + Women's Doubles (2 slots, 6:40-7:00)
  // Court 3: Mixed Doubles (7 slots, 5:00-6:20) + Women's Singles (2 slots, 6:40-7:00)

  const assignments = [];

  // Court 1: Men's Singles
  const court1Matches = ms.slice(0, 9); // max 9 slots
  for (let i = 0; i < court1Matches.length; i++) {
    assignments.push({ match: court1Matches[i], court: 'Court 1', time: TIME_SLOTS[i] });
  }

  // Court 2: Men's Doubles (first 7 slots) + Women's Doubles (last 2 slots)
  const court2MD = md.slice(0, 7);
  for (let i = 0; i < court2MD.length; i++) {
    assignments.push({ match: court2MD[i], court: 'Court 2', time: TIME_SLOTS[i] });
  }
  const court2WD = wd.slice(0, 2);
  for (let i = 0; i < court2WD.length; i++) {
    assignments.push({ match: court2WD[i], court: 'Court 2', time: TIME_SLOTS[7 + i] }); // slots 7,8 = 19:20, 19:40
  }

  // Court 3: Mixed Doubles (first 7 slots) + Women's Singles (last 2 slots)
  const court3MXD = mxd.slice(0, 7);
  for (let i = 0; i < court3MXD.length; i++) {
    assignments.push({ match: court3MXD[i], court: 'Court 3', time: TIME_SLOTS[i] });
  }
  const court3WS = ws.slice(0, 2);
  for (let i = 0; i < court3WS.length; i++) {
    assignments.push({ match: court3WS[i], court: 'Court 3', time: TIME_SLOTS[7 + i] }); // slots 7,8 = 19:20, 19:40
  }

  // Display the proposed schedule
  console.log(`\n=== PROPOSED SCHEDULE FOR ${TODAY} ===\n`);
  
  console.log('COURT 1 — Men\'s Singles:');
  for (const a of assignments.filter(x => x.court === 'Court 1')) {
    console.log(`  ${a.time} | M${a.match.matchNumber} R${a.match.roundNumber} | ${getName(a.match.entry1Id)} vs ${getName(a.match.entry2Id)}`);
  }

  console.log('\nCOURT 2 — Men\'s Doubles + Women\'s Doubles:');
  for (const a of assignments.filter(x => x.court === 'Court 2')) {
    console.log(`  ${a.time} | M${a.match.matchNumber} R${a.match.roundNumber} ${a.match.category} | ${getName(a.match.entry1Id)} vs ${getName(a.match.entry2Id)}`);
  }

  console.log('\nCOURT 3 — Mixed Doubles + Women\'s Singles:');
  for (const a of assignments.filter(x => x.court === 'Court 3')) {
    console.log(`  ${a.time} | M${a.match.matchNumber} R${a.match.roundNumber} ${a.match.category} | ${getName(a.match.entry1Id)} vs ${getName(a.match.entry2Id)}`);
  }

  console.log(`\nTotal matches to schedule: ${assignments.length}`);

  // Step 2: Clear existing schedules for these matches and apply new ones
  console.log('\nApplying schedule...');
  
  // Reset notificationSent for these matches so emails go out fresh
  const matchIds = assignments.map(a => a.match.id);
  await prisma.match.updateMany({
    where: { id: { in: matchIds } },
    data: { notificationSent: false },
  });

  // Apply new schedule
  for (const a of assignments) {
    const scheduledDate = buildDateTime(TODAY, a.time);
    await prisma.match.update({
      where: { id: a.match.id },
      data: { scheduledDate, venue: a.court },
    });
  }

  console.log(`Done! ${assignments.length} matches scheduled for ${TODAY}.`);
  console.log('\nNow go to Admin → Fixtures → click "📧 Send Match Notifications" to email all players.');
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
