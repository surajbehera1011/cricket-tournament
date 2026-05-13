import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const SUBHAM_ID = 'cde93ddd-d61e-4094-ba3f-9ae56cf0000e';
  const AVINASH_ID = 'a3b3b4f2-b285-4dca-88c7-e9721071804f';
  const SRINATH_ID = '06f84382-cc5c-4f8c-bebf-fec93231f0bd';
  const SATISH_ID = 'd03a9a6c-4d4d-4b7e-a82d-5691b4528b30';

  // Fix 1: M33 - Subham won (score 0-1 means entry2 won), not Avinash
  console.log('Fix 1: M33 - Setting winner to Subham Dwarapu');
  const m33 = await prisma.match.findFirst({
    where: { sport: 'PICKLEBALL', category: 'MENS_SINGLES', matchNumber: 33 },
  });
  if (m33) {
    await prisma.match.update({
      where: { id: m33.id },
      data: { winnerId: SUBHAM_ID },
    });
    console.log('  M33 winner updated to Subham');
  }

  // Fix 1b: M49 (R3) - Should have Subham (winner of M33) instead of whatever is there
  // M49 entry1Id should be WINNER_M33 -> Subham
  const m49 = await prisma.match.findFirst({
    where: { sport: 'PICKLEBALL', category: 'MENS_SINGLES', matchNumber: 49 },
  });
  if (m49) {
    // Check which entry slot references M33
    if (m49.entry1Id === AVINASH_ID || m49.entry1Id?.includes('WINNER_M33') || m49.entry1Id?.startsWith('WINNER_M')) {
      await prisma.match.update({
        where: { id: m49.id },
        data: { entry1Id: SUBHAM_ID },
      });
      console.log('  M49 entry1Id updated to Subham');
    } else if (m49.entry2Id === AVINASH_ID || m49.entry2Id?.includes('WINNER_M33')) {
      await prisma.match.update({
        where: { id: m49.id },
        data: { entry2Id: SUBHAM_ID },
      });
      console.log('  M49 entry2Id updated to Subham');
    } else {
      console.log(`  M49 entries: ${m49.entry1Id} vs ${m49.entry2Id} - checking if Avinash is there`);
      if (m49.entry1Id === AVINASH_ID) {
        await prisma.match.update({ where: { id: m49.id }, data: { entry1Id: SUBHAM_ID } });
        console.log('  M49 entry1Id updated to Subham (was Avinash)');
      } else if (m49.entry2Id === AVINASH_ID) {
        await prisma.match.update({ where: { id: m49.id }, data: { entry2Id: SUBHAM_ID } });
        console.log('  M49 entry2Id updated to Subham (was Avinash)');
      } else {
        console.log('  M49 - Could not find where to place Subham. Manual check needed.');
      }
    }
  }

  // Fix 2: M32 - Srinath won (score 0-1 means entry2 won), not Satish
  console.log('\nFix 2: M32 - Setting winner to Srinath Gunnala');
  const m32 = await prisma.match.findFirst({
    where: { sport: 'PICKLEBALL', category: 'MENS_SINGLES', matchNumber: 32 },
  });
  if (m32) {
    await prisma.match.update({
      where: { id: m32.id },
      data: { winnerId: SRINATH_ID },
    });
    console.log('  M32 winner updated to Srinath');
  }

  // Fix 2b: M48 (R2) - Should have Srinath (winner of M32) instead of Satish
  const m48 = await prisma.match.findFirst({
    where: { sport: 'PICKLEBALL', category: 'MENS_SINGLES', matchNumber: 48 },
  });
  if (m48) {
    if (m48.entry1Id === SATISH_ID) {
      await prisma.match.update({ where: { id: m48.id }, data: { entry1Id: SRINATH_ID } });
      console.log('  M48 entry1Id updated to Srinath (was Satish)');
    } else if (m48.entry2Id === SATISH_ID) {
      await prisma.match.update({ where: { id: m48.id }, data: { entry2Id: SRINATH_ID } });
      console.log('  M48 entry2Id updated to Srinath (was Satish)');
    } else {
      console.log(`  M48 entries: ${m48.entry1Id} vs ${m48.entry2Id} - Satish not found here`);
    }
  }

  // Also check if Satish was advanced further (M56 or beyond)
  const allMS = await prisma.match.findMany({
    where: { sport: 'PICKLEBALL', category: 'MENS_SINGLES', roundNumber: { gte: 3 } },
    select: { id: true, matchNumber: true, roundNumber: true, entry1Id: true, entry2Id: true },
  });
  for (const m of allMS) {
    if (m.entry1Id === SATISH_ID) {
      console.log(`  WARNING: Satish found in M${m.matchNumber} R${m.roundNumber} entry1 - may need fixing if M48 winner advances`);
    }
    if (m.entry2Id === SATISH_ID) {
      console.log(`  WARNING: Satish found in M${m.matchNumber} R${m.roundNumber} entry2 - may need fixing if M48 winner advances`);
    }
  }

  console.log('\nDone! Bracket data corrected.');
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
