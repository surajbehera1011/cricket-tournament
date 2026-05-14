import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TODAY = "2026-05-14";

function buildDateTime(date, time) {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:30`);
}

async function main() {
  // Schedule assignments for May 14
  const schedule = [
    // Court 1 — Men's Singles
    { category: 'MENS_SINGLES', matchNumber: 50, court: 'Court 1', time: '16:00' },
    { category: 'MENS_SINGLES', matchNumber: 57, court: 'Court 1', time: '16:40' },
    { category: 'MENS_SINGLES', matchNumber: 60, court: 'Court 1', time: '17:00' },
    { category: 'MENS_SINGLES', matchNumber: 61, court: 'Court 1', time: '17:20' },
    { category: 'MENS_SINGLES', matchNumber: 62, court: 'Court 1', time: '17:50' },

    // Court 2 — Men's Doubles
    { category: 'MENS_DOUBLES', matchNumber: 26, court: 'Court 2', time: '16:00' },
    { category: 'MENS_DOUBLES', matchNumber: 30, court: 'Court 2', time: '16:20' },
    { category: 'MENS_DOUBLES', matchNumber: 29, court: 'Court 2', time: '17:30' },

    // Court 3 — Women's + Finals
    { category: 'WOMENS_SINGLES', matchNumber: 14, court: 'Court 3', time: '16:00' },
    { category: 'WOMENS_SINGLES', matchNumber: 15, court: 'Court 3', time: '16:20' },
    { category: 'WOMENS_DOUBLES', matchNumber: 7, court: 'Court 3', time: '16:50' },
    { category: 'MENS_SINGLES', matchNumber: 63, court: 'Court 3', time: '18:30' },
    { category: 'MIXED_DOUBLES', matchNumber: 15, court: 'Court 3', time: '19:00' },
    { category: 'MENS_DOUBLES', matchNumber: 31, court: 'Court 3', time: '19:30' },
  ];

  console.log('=== Applying Day 3 Schedule ===\n');

  let applied = 0;
  for (const s of schedule) {
    const match = await prisma.match.findFirst({
      where: { sport: 'PICKLEBALL', category: s.category, matchNumber: s.matchNumber },
      select: { id: true, matchNumber: true, category: true, status: true },
    });

    if (!match) {
      console.log(`  ❌ NOT FOUND: ${s.category} M${s.matchNumber}`);
      continue;
    }

    if (match.status === 'COMPLETED') {
      console.log(`  ⏭️  SKIP (already completed): ${s.category} M${s.matchNumber}`);
      continue;
    }

    const scheduledDate = buildDateTime(TODAY, s.time);
    await prisma.match.update({
      where: { id: match.id },
      data: { scheduledDate, venue: s.court, notificationSent: false },
    });

    console.log(`  ✅ ${s.time} ${s.court} | ${s.category} M${s.matchNumber}`);
    applied++;
  }

  console.log(`\nApplied: ${applied} matches scheduled for ${TODAY}`);
  console.log('\nTo send emails: Go to Admin → Fixtures → click "📧 Send Match Notifications"');
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
