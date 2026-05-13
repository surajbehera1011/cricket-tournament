import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function buildDateTime(date, startTime) {
  const [hours, minutes] = startTime.split(":").map(Number);
  return new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:30`);
}

async function main() {
  // M63 R6 MS Final was incorrectly placed at 12 May by v2 script. Let's check and fix all late-round issues.
  // Available Court 2 slots: 13 May 19:00, 13 May 19:40, 14 May 17:00, 14 May 17:20
  
  // The problem matches and their correct order:
  // M15 R4 MIXED_DOUBLES (Final) - must be AFTER M13 (R3, 14 May 19:20 C3) and M14 (R3, 14 May 19:40 C3)
  //   -> Cannot be on 14 May at all since feeders are at 19:20 and 19:40 (last slots)
  //   -> This match simply cannot fit in 3 days with proper gaps!
  
  // M61 R5 MS (Semi) - must be after M57 (R4, 14 May 18:00 C2) 
  // M62 R5 MS (Semi) - must be after M58 (R4, 14 May 19:00 C2)
  // M63 R6 MS (Final) - must be after M61 and M62

  // Reality check: with 79 matches and only 81 slots, there's NO room for gaps in later rounds.
  // The best we can do: ensure later rounds are AFTER their feeders (even if back-to-back).
  
  // Let's just ensure chronological correctness (later round = later time) without gap requirement.
  
  const updates = [
    // M63 R6 MS Final - should be the very last MS match. Put at latest available slot.
    // Currently at 12 May 18:40 C2 (WRONG - that's before R4 and R5!)
    // Move to: we need to find the latest slot after M61 and M62
  ];

  // Let's check what M57, M58, M59, M60, M61, M62, M63 are currently at
  const lateMatches = await prisma.match.findMany({
    where: { sport: 'PICKLEBALL', category: 'MENS_SINGLES', roundNumber: { gte: 4 } },
    select: { id: true, matchNumber: true, roundNumber: true, scheduledDate: true, venue: true },
    orderBy: { matchNumber: 'asc' },
  });

  console.log('Late MS matches:');
  for (const m of lateMatches) {
    const d = m.scheduledDate;
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(d.getTime() + istOffset);
    console.log(`  M${m.matchNumber} R${m.roundNumber} ${m.venue} | ${ist.getUTCDate()} May ${String(ist.getUTCHours()).padStart(2,'0')}:${String(ist.getUTCMinutes()).padStart(2,'0')}`);
  }

  // Also check Mixed Doubles late rounds
  const lateMXD = await prisma.match.findMany({
    where: { sport: 'PICKLEBALL', category: 'MIXED_DOUBLES', roundNumber: { gte: 3 } },
    select: { id: true, matchNumber: true, roundNumber: true, scheduledDate: true, venue: true },
    orderBy: { matchNumber: 'asc' },
  });

  console.log('\nLate MXD matches:');
  for (const m of lateMXD) {
    const d = m.scheduledDate;
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(d.getTime() + istOffset);
    console.log(`  M${m.matchNumber} R${m.roundNumber} ${m.venue} | ${ist.getUTCDate()} May ${String(ist.getUTCHours()).padStart(2,'0')}:${String(ist.getUTCMinutes()).padStart(2,'0')}`);
  }

  // Also check Men's Doubles late rounds
  const lateMD = await prisma.match.findMany({
    where: { sport: 'PICKLEBALL', category: 'MENS_DOUBLES', roundNumber: { gte: 4 } },
    select: { id: true, matchNumber: true, roundNumber: true, scheduledDate: true, venue: true },
    orderBy: { matchNumber: 'asc' },
  });

  console.log('\nLate MD matches:');
  for (const m of lateMD) {
    const d = m.scheduledDate;
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(d.getTime() + istOffset);
    console.log(`  M${m.matchNumber} R${m.roundNumber} ${m.venue} | ${ist.getUTCDate()} May ${String(ist.getUTCHours()).padStart(2,'0')}:${String(ist.getUTCMinutes()).padStart(2,'0')}`);
  }

  // Now let's fix: swap M63 (currently 12 May 18:40 C2) with a later slot
  // M63 needs to be after M61 and M62 (both R5)
  // M61 is at 14 May 18:20 C2, M62 at 14 May 18:40 C2 (from earlier output)
  // Wait - v2 script may have changed these. Let me just look at current state.
  
  const m63 = lateMatches.find(m => m.matchNumber === 63);
  const m61 = lateMatches.find(m => m.matchNumber === 61);
  const m62 = lateMatches.find(m => m.matchNumber === 62);

  if (m63 && m61 && m62) {
    // M63 Final must be after both M61 and M62
    // Find the latest of M61, M62 times, then put M63 after that
    const ist61 = new Date(m61.scheduledDate.getTime() + 5.5*60*60*1000);
    const ist62 = new Date(m62.scheduledDate.getTime() + 5.5*60*60*1000);
    const ist63 = new Date(m63.scheduledDate.getTime() + 5.5*60*60*1000);
    
    console.log(`\nM61 at: ${ist61.getUTCDate()} May ${String(ist61.getUTCHours()).padStart(2,'0')}:${String(ist61.getUTCMinutes()).padStart(2,'0')}`);
    console.log(`M62 at: ${ist62.getUTCDate()} May ${String(ist62.getUTCHours()).padStart(2,'0')}:${String(ist62.getUTCMinutes()).padStart(2,'0')}`);
    console.log(`M63 at: ${ist63.getUTCDate()} May ${String(ist63.getUTCHours()).padStart(2,'0')}:${String(ist63.getUTCMinutes()).padStart(2,'0')}`);
    
    // If M63 is before M61 or M62, we need to move it
    if (m63.scheduledDate < m61.scheduledDate || m63.scheduledDate < m62.scheduledDate) {
      console.log('\n*** M63 FINAL is before its semi-finals! Need to fix. ***');
      // Find available slot on Court 2 after both M61 and M62
      const allC2 = await prisma.match.findMany({
        where: { sport: 'PICKLEBALL', venue: 'Court 2', scheduledDate: { not: null } },
        select: { id: true, scheduledDate: true },
      });
      const c2Occupied = new Set();
      for (const m of allC2) {
        const s = new Date(m.scheduledDate.getTime() + 5.5*60*60*1000);
        c2Occupied.add(`${s.getUTCFullYear()}-${String(s.getUTCMonth()+1).padStart(2,'0')}-${String(s.getUTCDate()).padStart(2,'0')}|${String(s.getUTCHours()).padStart(2,'0')}:${String(s.getUTCMinutes()).padStart(2,'0')}`);
      }
      
      // Remove M63's current slot from occupied (we're moving it)
      const s63 = `${ist63.getUTCFullYear()}-${String(ist63.getUTCMonth()+1).padStart(2,'0')}-${String(ist63.getUTCDate()).padStart(2,'0')}|${String(ist63.getUTCHours()).padStart(2,'0')}:${String(ist63.getUTCMinutes()).padStart(2,'0')}`;
      c2Occupied.delete(s63);
      
      // Find latest time of M61/M62
      const laterSemi = m61.scheduledDate > m62.scheduledDate ? m61 : m62;
      const laterIST = new Date(laterSemi.scheduledDate.getTime() + 5.5*60*60*1000);
      
      // Find next available slot on C2 after the later semi
      for (const date of TOURNAMENT_DATES) {
        for (const time of TIME_SLOTS) {
          const slotDate = buildDateTime(date, time);
          if (slotDate <= laterSemi.scheduledDate) continue;
          const key = `${date}|${time}`;
          if (!c2Occupied.has(key)) {
            console.log(`Moving M63 to: ${date} ${time} Court 2`);
            await prisma.match.update({ where: { id: m63.id }, data: { scheduledDate: slotDate } });
            console.log('Done!');
            break;
          }
        }
        // Check if we found one
        const updated = await prisma.match.findUnique({ where: { id: m63.id }, select: { scheduledDate: true } });
        if (updated.scheduledDate > laterSemi.scheduledDate) break;
      }
    }
  }
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
