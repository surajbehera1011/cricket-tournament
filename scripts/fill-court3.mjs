import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TODAY = "2026-05-13";

function buildDateTime(date, startTime) {
  const [hours, minutes] = startTime.split(":").map(Number);
  return new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:30`);
}

async function main() {
  // Court 3 currently has: 17:00, 17:20, 17:40 (MXD) and 19:20 (WS) = 4 slots used
  // Empty slots on Court 3: 18:00, 18:20, 18:40, 19:00, 19:40 = 5 slots available
  
  // Find remaining ready matches not yet scheduled for today
  const allMatches = await prisma.match.findMany({
    where: { sport: 'PICKLEBALL', status: { not: 'COMPLETED' } },
    select: { id: true, matchNumber: true, roundNumber: true, category: true, entry1Id: true, entry2Id: true, scheduledDate: true, venue: true },
  });

  const readyUnscheduledToday = allMatches.filter(m =>
    m.entry1Id && m.entry2Id &&
    !m.entry1Id.startsWith('WINNER_') &&
    !m.entry2Id.startsWith('WINNER_') &&
    // Not already scheduled for today
    !(m.scheduledDate && m.scheduledDate.toISOString().startsWith('2026-05-13'))
  );

  // Get names
  const entryIds = readyUnscheduledToday.flatMap(m => [m.entry1Id, m.entry2Id]).filter(Boolean);
  const regs = await prisma.pickleballRegistration.findMany({
    where: { id: { in: entryIds } },
    select: { id: true, player1Name: true, player2Name: true },
  });
  const nameMap = new Map(regs.map(r => [r.id, r.player2Name ? `${r.player1Name} & ${r.player2Name}` : r.player1Name]));
  const getName = (id) => nameMap.get(id) || id?.substring(0, 8) || '?';

  // Filter to Men's Doubles and other remaining matches
  const md = readyUnscheduledToday.filter(m => m.category === 'MENS_DOUBLES').sort((a, b) => a.matchNumber - b.matchNumber);
  const ms = readyUnscheduledToday.filter(m => m.category === 'MENS_SINGLES').sort((a, b) => a.matchNumber - b.matchNumber);
  const others = readyUnscheduledToday.filter(m => !['MENS_DOUBLES', 'MENS_SINGLES'].includes(m.category)).sort((a, b) => a.matchNumber - b.matchNumber);

  console.log(`Remaining ready matches not on today's schedule:`);
  console.log(`  Men's Doubles: ${md.length} — ${md.map(m => `M${m.matchNumber}`).join(', ')}`);
  console.log(`  Men's Singles: ${ms.length} — ${ms.map(m => `M${m.matchNumber}`).join(', ')}`);
  console.log(`  Others: ${others.length} — ${others.map(m => `M${m.matchNumber} ${m.category}`).join(', ')}`);

  // Available Court 3 slots for today (check what's already there)
  const court3Today = allMatches.filter(m => 
    m.venue === 'Court 3' && 
    m.scheduledDate && 
    m.scheduledDate.toISOString().startsWith('2026-05-13')
  );
  
  const usedSlots = new Set();
  for (const m of court3Today) {
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(m.scheduledDate.getTime() + istOffset);
    const time = `${String(ist.getUTCHours()).padStart(2, '0')}:${String(ist.getUTCMinutes()).padStart(2, '0')}`;
    usedSlots.add(time);
  }

  const ALL_SLOTS = ["17:00", "17:20", "17:40", "18:00", "18:20", "18:40", "19:00", "19:20", "19:40"];
  const availableSlots = ALL_SLOTS.filter(t => !usedSlots.has(t));
  
  console.log(`\nCourt 3 used slots today: ${[...usedSlots].join(', ')}`);
  console.log(`Court 3 available slots: ${availableSlots.join(', ')}`);

  // Fill with Men's Doubles first, then any other remaining
  const toSchedule = [...md, ...ms, ...others].slice(0, availableSlots.length);

  console.log(`\nScheduling ${toSchedule.length} matches in Court 3 empty slots:`);
  
  const updates = [];
  for (let i = 0; i < toSchedule.length; i++) {
    const m = toSchedule[i];
    const time = availableSlots[i];
    console.log(`  ${time} | M${m.matchNumber} R${m.roundNumber} ${m.category} | ${getName(m.entry1Id)} vs ${getName(m.entry2Id)}`);
    updates.push({ id: m.id, time });
  }

  if (updates.length > 0) {
    console.log('\nApplying...');
    for (const u of updates) {
      const scheduledDate = buildDateTime(TODAY, u.time);
      await prisma.match.update({
        where: { id: u.id },
        data: { scheduledDate, venue: 'Court 3', notificationSent: false },
      });
    }
    console.log('Done!');
  }
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
