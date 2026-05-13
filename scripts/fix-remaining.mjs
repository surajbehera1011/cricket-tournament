import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TOURNAMENT_DATES = ["2026-05-12", "2026-05-13", "2026-05-14"];
const TIME_SLOTS = ["17:00", "17:20", "17:40", "18:00", "18:20", "18:40", "19:00", "19:20", "19:40"];

function buildDateTime(date, startTime) {
  const [hours, minutes] = startTime.split(":").map(Number);
  return new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:30`);
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
  // Find the 4 unassigned matches
  const unassigned = await prisma.match.findMany({
    where: { 
      sport: 'PICKLEBALL',
      matchNumber: { in: [60, 61, 62, 15] },
      category: { in: ['MENS_SINGLES', 'MIXED_DOUBLES'] },
    },
    select: { id: true, matchNumber: true, roundNumber: true, category: true, venue: true, scheduledDate: true },
  });

  // Find M60 R4 MS, M61 R5 MS, M62 R5 MS, M15 R4 MXD
  const m60 = unassigned.find(m => m.matchNumber === 60 && m.category === 'MENS_SINGLES');
  const m61 = unassigned.find(m => m.matchNumber === 61 && m.category === 'MENS_SINGLES');
  const m62 = unassigned.find(m => m.matchNumber === 62 && m.category === 'MENS_SINGLES');
  const m15mxd = unassigned.find(m => m.matchNumber === 15 && m.category === 'MIXED_DOUBLES');

  console.log('Matches needing slots:');
  console.log(`  M60 R4 MENS_SINGLES: current ${m60?.venue} ${m60?.scheduledDate ? extractSlotInfo(m60.scheduledDate).date + ' ' + extractSlotInfo(m60.scheduledDate).startTime : 'none'}`);
  console.log(`  M61 R5 MENS_SINGLES: current ${m61?.venue} ${m61?.scheduledDate ? extractSlotInfo(m61.scheduledDate).date + ' ' + extractSlotInfo(m61.scheduledDate).startTime : 'none'}`);
  console.log(`  M62 R5 MENS_SINGLES: current ${m62?.venue} ${m62?.scheduledDate ? extractSlotInfo(m62.scheduledDate).date + ' ' + extractSlotInfo(m62.scheduledDate).startTime : 'none'}`);
  console.log(`  M15 R4 MIXED_DOUBLES: current ${m15mxd?.venue} ${m15mxd?.scheduledDate ? extractSlotInfo(m15mxd.scheduledDate).date + ' ' + extractSlotInfo(m15mxd.scheduledDate).startTime : 'none'}`);

  // Find all occupied slots on all courts
  const allScheduled = await prisma.match.findMany({
    where: { sport: 'PICKLEBALL', scheduledDate: { not: null }, venue: { not: null } },
    select: { id: true, matchNumber: true, venue: true, scheduledDate: true },
  });

  const occupied = new Set();
  for (const m of allScheduled) {
    const slot = extractSlotInfo(m.scheduledDate);
    occupied.add(`${m.venue}|${slot.date}|${slot.startTime}`);
  }

  // Find available slots per court
  console.log('\nAvailable slots:');
  for (const court of ["Court 1", "Court 2", "Court 3"]) {
    const available = [];
    for (const date of TOURNAMENT_DATES) {
      for (const time of TIME_SLOTS) {
        if (!occupied.has(`${court}|${date}|${time}`)) {
          available.push(`${date} ${time}`);
        }
      }
    }
    console.log(`  ${court}: ${available.length} slots — ${available.join(', ')}`);
  }

  // These late-round matches can go on ANY court that has space
  // M60 (R4 MS Quarter-final) — needs to be after M55, M56 (R3) which are on 14 May 19:00, 19:20 on C1
  // So M60 can't fit on C1 (no slots after 19:20). Put on C2 or C3.
  // M61, M62 (R5 MS Semi-finals) — after M57, M58, M59, M60
  // M15 (R4 MXD Final) — after M13, M14 (R3) which are on 14 May 19:20, 19:40 on C3

  // Let's assign them to available slots on any court, latest day, ensuring proper order
  // These are the final rounds — they should be on May 14, late slots

  // For now, let's just see what's available and decide
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
