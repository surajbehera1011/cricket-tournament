import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function buildDateTime(date, startTime) {
  const [hours, minutes] = startTime.split(":").map(Number);
  return new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:30`);
}

async function main() {
  // Available Court 2 slots (from earlier check): 13 May 19:00, 13 May 19:40, 14 May 17:00, 14 May 17:20
  // But v2 script used some of these. Let me find what's actually free now.
  
  // The problematic matches that are in wrong order:
  // M62 R5 MS at 14 May 18:40 C2 — but feeder M58 R4 is at 14 May 19:00 C2 (M62 BEFORE M58!)
  // M63 R6 MS Final at 12 May 18:40 C2 — should be the LAST MS match
  // M15 R4 MXD Final at 13 May 18:40 C2 — feeders M13,M14 are on 14 May (Final BEFORE semis!)
  
  // The reality: these matches CANNOT be properly scheduled in 3 days.
  // Best approach: remove the schedule from these impossible matches and leave them unscheduled.
  // They'll be auto-scheduled when both players are confirmed (after their feeder matches complete).
  
  // Matches to unschedule (set scheduledDate and venue to null):
  const toUnschedule = [];
  
  // Find M63 R6 MS Final
  const m63 = await prisma.match.findFirst({ where: { sport: 'PICKLEBALL', category: 'MENS_SINGLES', matchNumber: 63 } });
  if (m63) toUnschedule.push({ id: m63.id, label: 'M63 R6 MENS_SINGLES Final' });
  
  // Find M61, M62 R5 MS Semi-finals  
  const m61 = await prisma.match.findFirst({ where: { sport: 'PICKLEBALL', category: 'MENS_SINGLES', matchNumber: 61 } });
  if (m61) toUnschedule.push({ id: m61.id, label: 'M61 R5 MENS_SINGLES Semi' });
  
  const m62 = await prisma.match.findFirst({ where: { sport: 'PICKLEBALL', category: 'MENS_SINGLES', matchNumber: 62 } });
  if (m62) toUnschedule.push({ id: m62.id, label: 'M62 R5 MENS_SINGLES Semi' });
  
  // Find M60 R4 MS — its feeders M55 (19:00 C1) and M56 (19:20 C1) are at the end of 14 May
  // M60 is at 14 May 19:40 C1 — this is actually OK (20 min after M56). Keep it.
  
  // Find M15 R4 MXD Final
  const m15mxd = await prisma.match.findFirst({ where: { sport: 'PICKLEBALL', category: 'MIXED_DOUBLES', matchNumber: 15 } });
  if (m15mxd) toUnschedule.push({ id: m15mxd.id, label: 'M15 R4 MIXED_DOUBLES Final' });
  
  console.log(`Unscheduling ${toUnschedule.length} matches that cannot fit properly:`);
  for (const m of toUnschedule) {
    console.log(`  ${m.label}`);
    await prisma.match.update({
      where: { id: m.id },
      data: { scheduledDate: null, venue: null },
    });
  }
  
  console.log('\nDone! These matches will be auto-scheduled when both players are confirmed after their feeder matches complete.');
  console.log('The checkAndNotifyNextMatch function will assign them the next available slot at that time.');
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
