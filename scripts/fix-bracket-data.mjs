import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Issue 1: M33 (R2) has "Avinash A vs Subham Dwarapu" but Subham won M1 (not Avinash)
  // Looking at the bracket: M1 (Avinash A vs Sai Shashank) score 1-0, so Avinash won
  // M33 shows "Avinash A vs Subham Dwarapu" - Subham is from M2 (bye, auto-advanced)
  // M49 (R3) shows "TBD vs Subhankar Ran..." - the winner of M33 should go here
  // But M49 already has Subhankar (from M34 winner). The issue is M33's winner wasn't advanced to M49.
  
  // Issue 2: M32 (Satish Regeti vs Srinath Gunnala) score 0-1, meaning Srinath won
  // But M48 shows "Charan Sai Pul... vs Satish Regeti" - Satish was incorrectly advanced instead of Srinath
  
  // Let me first check the actual data
  const msMatches = await prisma.match.findMany({
    where: { sport: 'PICKLEBALL', category: 'MENS_SINGLES', matchNumber: { in: [1, 2, 32, 33, 48, 49] } },
    select: { id: true, matchNumber: true, roundNumber: true, entry1Id: true, entry2Id: true, score1: true, score2: true, winnerId: true, status: true },
    orderBy: { matchNumber: 'asc' },
  });

  console.log('=== Current state of relevant matches ===');
  for (const m of msMatches) {
    console.log(`M${m.matchNumber} R${m.roundNumber}: entry1=${m.entry1Id?.substring(0,8)} entry2=${m.entry2Id?.substring(0,8)} | score: ${m.score1}-${m.score2} | winner: ${m.winnerId?.substring(0,8)} | status: ${m.status}`);
  }

  // Get player names for the entries
  const entryIds = msMatches.flatMap(m => [m.entry1Id, m.entry2Id, m.winnerId]).filter(Boolean);
  const regs = await prisma.pickleballRegistration.findMany({
    where: { id: { in: entryIds } },
    select: { id: true, player1Name: true },
  });
  const nameMap = new Map(regs.map(r => [r.id, r.player1Name]));

  console.log('\n=== With names ===');
  for (const m of msMatches) {
    const e1 = m.entry1Id ? nameMap.get(m.entry1Id) || m.entry1Id?.substring(0,8) : 'null';
    const e2 = m.entry2Id ? (m.entry2Id.startsWith('WINNER_') ? m.entry2Id : nameMap.get(m.entry2Id) || m.entry2Id?.substring(0,8)) : 'null';
    const w = m.winnerId ? nameMap.get(m.winnerId) || m.winnerId?.substring(0,8) : 'none';
    console.log(`M${m.matchNumber} R${m.roundNumber}: ${e1} vs ${e2} | score: ${m.score1}-${m.score2} | winner: ${w} | status: ${m.status}`);
  }

  // Now find Srinath's registration ID
  const srinath = await prisma.pickleballRegistration.findFirst({
    where: { player1Name: { contains: 'Srinath' }, category: 'MENS_SINGLES' },
    select: { id: true, player1Name: true },
  });
  console.log(`\nSrinath: ${srinath?.id} (${srinath?.player1Name})`);

  // Find Satish's registration ID
  const satish = await prisma.pickleballRegistration.findFirst({
    where: { player1Name: { contains: 'Satish' }, category: 'MENS_SINGLES' },
    select: { id: true, player1Name: true },
  });
  console.log(`Satish: ${satish?.id} (${satish?.player1Name})`);

  // Find Subham's registration ID
  const subham = await prisma.pickleballRegistration.findFirst({
    where: { player1Name: { contains: 'Subham' }, category: 'MENS_SINGLES' },
    select: { id: true, player1Name: true },
  });
  console.log(`Subham: ${subham?.id} (${subham?.player1Name})`);
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
