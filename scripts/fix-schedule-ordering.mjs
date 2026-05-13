import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TOURNAMENT_DATES = ["2026-05-12", "2026-05-13", "2026-05-14"];
const TIME_SLOTS = ["17:00", "17:20", "17:40", "18:00", "18:20", "18:40", "19:00", "19:20", "19:40"];

function buildDateTime(date, startTime) {
  const [hours, minutes] = startTime.split(":").map(Number);
  return new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:30`);
}

function getGlobalSlotIndex(date, startTime) {
  const dayIndex = TOURNAMENT_DATES.indexOf(date);
  const slotIndex = TIME_SLOTS.indexOf(startTime);
  if (dayIndex < 0 || slotIndex < 0) return -1;
  return dayIndex * 9 + slotIndex;
}

function extractSlotInfo(scheduledDate) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(scheduledDate.getTime() + istOffset);
  const hours = String(istDate.getUTCHours()).padStart(2, "0");
  const minutes = String(istDate.getUTCMinutes()).padStart(2, "0");
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  return { date: `${year}-${month}-${day}`, startTime: `${hours}:${minutes}` };
}

async function main() {
  const allMatches = await prisma.match.findMany({
    where: { sport: 'PICKLEBALL', scheduledDate: { not: null }, venue: { not: null } },
    select: { id: true, matchNumber: true, roundNumber: true, category: true, entry1Id: true, entry2Id: true, scheduledDate: true, venue: true, notificationSent: true },
    orderBy: [{ category: 'asc' }, { roundNumber: 'asc' }, { matchNumber: 'asc' }],
  });

  const locked = allMatches.filter(m => m.notificationSent);
  const unlocked = allMatches.filter(m => !m.notificationSent);

  console.log(`Locked (emails sent, won't change): ${locked.length}`);
  console.log(`Unlocked (can reschedule): ${unlocked.length}`);

  // Build occupied slots from locked matches
  const occupiedSlots = new Map();
  for (const m of locked) {
    const slot = extractSlotInfo(m.scheduledDate);
    occupiedSlots.set(`${m.venue}|${slot.date}|${slot.startTime}`, m.id);
  }

  // Group unlocked by court
  const courts = ["Court 1", "Court 2", "Court 3"];
  const unlockedByCourt = { "Court 1": [], "Court 2": [], "Court 3": [] };
  for (const m of unlocked) {
    if (unlockedByCourt[m.venue]) unlockedByCourt[m.venue].push(m);
  }

  const updates = [];

  for (const court of courts) {
    const courtMatches = unlockedByCourt[court];
    if (courtMatches.length === 0) continue;

    // Sort by round then matchNumber
    courtMatches.sort((a, b) => {
      if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber;
      return a.matchNumber - b.matchNumber;
    });

    // Find max slot per round from locked matches on this court
    const maxSlotPerRound = {};
    for (const m of locked.filter(x => x.venue === court)) {
      const slot = extractSlotInfo(m.scheduledDate);
      const idx = getGlobalSlotIndex(slot.date, slot.startTime);
      if (!maxSlotPerRound[m.roundNumber] || idx > maxSlotPerRound[m.roundNumber]) {
        maxSlotPerRound[m.roundNumber] = idx;
      }
    }

    for (const m of courtMatches) {
      let minSlot = 0;
      for (let r = 1; r < m.roundNumber; r++) {
        if (maxSlotPerRound[r] !== undefined) {
          minSlot = Math.max(minSlot, maxSlotPerRound[r] + 1);
        }
      }

      let assigned = false;
      for (let globalIdx = minSlot; globalIdx < 27; globalIdx++) {
        const dayIdx = Math.floor(globalIdx / 9);
        const slotIdx = globalIdx % 9;
        const date = TOURNAMENT_DATES[dayIdx];
        const time = TIME_SLOTS[slotIdx];
        const key = `${court}|${date}|${time}`;

        if (!occupiedSlots.has(key)) {
          const newDate = buildDateTime(date, time);
          const oldSlot = extractSlotInfo(m.scheduledDate);
          const oldGlobal = getGlobalSlotIndex(oldSlot.date, oldSlot.startTime);

          if (oldGlobal !== globalIdx) {
            updates.push({ id: m.id, matchNumber: m.matchNumber, round: m.roundNumber, category: m.category, court, oldTime: `${oldSlot.date} ${oldSlot.startTime}`, newTime: `${date} ${time}`, newDate });
          }

          occupiedSlots.set(key, m.id);
          if (!maxSlotPerRound[m.roundNumber] || globalIdx > maxSlotPerRound[m.roundNumber]) {
            maxSlotPerRound[m.roundNumber] = globalIdx;
          }
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        console.log(`  WARNING: No slot for M${m.matchNumber} R${m.roundNumber} ${m.category} on ${court}`);
      }
    }
  }

  console.log(`\nMatches to fix: ${updates.length}`);
  for (const u of updates) {
    console.log(`  M${u.matchNumber} R${u.round} ${u.category} ${u.court}: ${u.oldTime} -> ${u.newTime}`);
  }

  if (updates.length > 0) {
    console.log('\nApplying...');
    for (const u of updates) {
      await prisma.match.update({ where: { id: u.id }, data: { scheduledDate: u.newDate } });
    }
    console.log('Done!');
  }
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
