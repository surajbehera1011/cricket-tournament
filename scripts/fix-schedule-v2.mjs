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

function slotFromGlobal(globalIdx) {
  const dayIdx = Math.floor(globalIdx / 9);
  const slotIdx = globalIdx % 9;
  return { date: TOURNAMENT_DATES[dayIdx], time: TIME_SLOTS[slotIdx] };
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
    where: { sport: 'PICKLEBALL' },
    select: { id: true, matchNumber: true, roundNumber: true, category: true, entry1Id: true, entry2Id: true, scheduledDate: true, venue: true, notificationSent: true },
    orderBy: [{ category: 'asc' }, { matchNumber: 'asc' }],
  });

  // Build dependency map: for each match, find which match it feeds into
  // A match M feeds into the next match that has WINNER_M{matchNumber} as entry
  const feedsInto = new Map(); // matchNumber -> next match's matchNumber
  for (const m of allMatches) {
    const winnerRef = `WINNER_M${m.matchNumber}`;
    const nextMatch = allMatches.find(n => 
      n.category === m.category && 
      (n.entry1Id === winnerRef || n.entry2Id === winnerRef)
    );
    if (nextMatch) {
      feedsInto.set(m.matchNumber, nextMatch.matchNumber);
    }
  }

  // Separate locked and unlocked
  const locked = allMatches.filter(m => m.notificationSent && m.scheduledDate);
  const unlocked = allMatches.filter(m => !m.notificationSent && m.scheduledDate && m.venue);

  console.log(`Locked: ${locked.length}, Unlocked to fix: ${unlocked.length}`);

  // Build occupied slots (from locked matches only)
  const occupiedSlots = new Map(); // "court|globalIdx" -> matchId
  const matchSlots = new Map(); // matchId -> { court, globalIdx }
  
  for (const m of locked) {
    const slot = extractSlotInfo(m.scheduledDate);
    const globalIdx = getGlobalSlotIndex(slot.date, slot.startTime);
    const key = `${m.venue}|${globalIdx}`;
    occupiedSlots.set(key, m.id);
    matchSlots.set(m.id, { court: m.venue, globalIdx });
  }

  // Also track match number -> slot for dependency checking
  const matchNumToSlot = new Map(); // matchNumber -> globalIdx
  for (const m of locked) {
    const slot = extractSlotInfo(m.scheduledDate);
    const globalIdx = getGlobalSlotIndex(slot.date, slot.startTime);
    matchNumToSlot.set(m.matchNumber, globalIdx);
  }

  // Group unlocked by category, then sort by round + matchNumber
  const categories = [...new Set(unlocked.map(m => m.category))];
  const updates = [];

  for (const category of categories) {
    const catMatches = unlocked.filter(m => m.category === category);
    catMatches.sort((a, b) => {
      if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber;
      return a.matchNumber - b.matchNumber;
    });

    for (const m of catMatches) {
      // Determine the court for this match
      const court = m.venue;

      // Find minimum slot: must be after all feeder matches + 1 gap
      let minSlot = 0;

      // Check what feeds INTO this match (find matches whose WINNER_ ref points here)
      const feederRef1 = m.entry1Id; // could be "WINNER_M34"
      const feederRef2 = m.entry2Id;
      
      for (const ref of [feederRef1, feederRef2]) {
        if (ref && ref.startsWith("WINNER_M")) {
          const feederMatchNum = parseInt(ref.replace("WINNER_M", ""));
          const feederSlot = matchNumToSlot.get(feederMatchNum);
          if (feederSlot !== undefined) {
            // Must be at least 2 slots after the feeder (1 gap = 20 min rest)
            minSlot = Math.max(minSlot, feederSlot + 2);
          }
        }
      }

      // Also must be after all same-round matches on same court that were already assigned
      // (to maintain sequential ordering within a round)

      // Find next available slot on this court >= minSlot
      let assigned = false;
      for (let globalIdx = minSlot; globalIdx < 27; globalIdx++) {
        const key = `${court}|${globalIdx}`;
        if (!occupiedSlots.has(key)) {
          const { date, time } = slotFromGlobal(globalIdx);
          const newDate = buildDateTime(date, time);
          
          // Check current assignment
          const oldSlot = extractSlotInfo(m.scheduledDate);
          const oldGlobal = getGlobalSlotIndex(oldSlot.date, oldSlot.startTime);

          if (oldGlobal !== globalIdx) {
            updates.push({
              id: m.id,
              matchNumber: m.matchNumber,
              round: m.roundNumber,
              category: m.category,
              court,
              oldTime: `${oldSlot.date} ${oldSlot.startTime}`,
              newTime: `${date} ${time}`,
              newDate
            });
          }

          occupiedSlots.set(key, m.id);
          matchNumToSlot.set(m.matchNumber, globalIdx);
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
  } else {
    console.log('No fixes needed.');
  }
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
