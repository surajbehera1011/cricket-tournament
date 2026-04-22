import { PrismaClient, UserRole, PoolStatus, MembershipType, TeamStatus, AuditAction } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🏏 Seeding cricket tournament database...\n");

  // ─── Users ──────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      email: "admin@company.com",
      displayName: "Tournament Admin",
      role: UserRole.ADMIN,
    },
  });

  const captain1 = await prisma.user.upsert({
    where: { email: "captain1@company.com" },
    update: {},
    create: {
      email: "captain1@company.com",
      displayName: "Rahul Sharma",
      role: UserRole.CAPTAIN,
    },
  });

  const captain2 = await prisma.user.upsert({
    where: { email: "captain2@company.com" },
    update: {},
    create: {
      email: "captain2@company.com",
      displayName: "Priya Patel",
      role: UserRole.CAPTAIN,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: "viewer@company.com" },
    update: {},
    create: {
      email: "viewer@company.com",
      displayName: "Amit Kumar",
      role: UserRole.VIEWER,
    },
  });

  console.log("✅ Users created");

  // ─── Teams ──────────────────────────────────────────
  const team1 = await prisma.team.upsert({
    where: { name: "Royal Strikers" },
    update: {},
    create: {
      name: "Royal Strikers",
      captainUserId: captain1.id,
      teamSize: 8,
      status: TeamStatus.COMPLETE,
    },
  });

  const team2 = await prisma.team.upsert({
    where: { name: "Thunder Hawks" },
    update: {},
    create: {
      name: "Thunder Hawks",
      captainUserId: captain2.id,
      teamSize: 8,
      status: TeamStatus.INCOMPLETE,
    },
  });

  const team3 = await prisma.team.upsert({
    where: { name: "Code Warriors" },
    update: {},
    create: {
      name: "Code Warriors",
      captainUserId: null,
      teamSize: 6,
      status: TeamStatus.INCOMPLETE,
    },
  });

  const team4 = await prisma.team.upsert({
    where: { name: "Debug Dragons" },
    update: {},
    create: {
      name: "Debug Dragons",
      captainUserId: null,
      teamSize: 8,
      status: TeamStatus.COMPLETE,
    },
  });

  console.log("✅ Teams created");

  // ─── Players (team members) ─────────────────────────
  const teamPlayers = [
    { fullName: "Rahul Sharma", preferredRole: "Batsman", experienceLevel: "Advanced", team: team1 },
    { fullName: "Vikram Singh", preferredRole: "Bowler", experienceLevel: "Advanced", team: team1 },
    { fullName: "Arun Nair", preferredRole: "All-Rounder", experienceLevel: "Intermediate", team: team1 },
    { fullName: "Deepak Reddy", preferredRole: "Batsman", experienceLevel: "Intermediate", team: team1 },
    { fullName: "Karthik Iyer", preferredRole: "Bowler", experienceLevel: "Beginner", team: team1 },
    { fullName: "Suresh Kumar", preferredRole: "Wicket Keeper", experienceLevel: "Advanced", team: team1 },
    { fullName: "Manish Pandey", preferredRole: "All-Rounder", experienceLevel: "Intermediate", team: team1 },
    { fullName: "Ravi Teja", preferredRole: "Bowler", experienceLevel: "Beginner", team: team1 },

    { fullName: "Priya Patel", preferredRole: "Batsman", experienceLevel: "Advanced", team: team2 },
    { fullName: "Neha Gupta", preferredRole: "Bowler", experienceLevel: "Intermediate", team: team2 },
    { fullName: "Sanjay Rao", preferredRole: "All-Rounder", experienceLevel: "Advanced", team: team2 },
    { fullName: "Akash Mehta", preferredRole: "Batsman", experienceLevel: "Beginner", team: team2 },
    { fullName: "Rohan Das", preferredRole: "Bowler", experienceLevel: "Intermediate", team: team2 },

    { fullName: "Varun Joshi", preferredRole: "Batsman", experienceLevel: "Intermediate", team: team3 },
    { fullName: "Nitin Verma", preferredRole: "All-Rounder", experienceLevel: "Advanced", team: team3 },
    { fullName: "Pooja Sharma", preferredRole: "Bowler", experienceLevel: "Beginner", team: team3 },

    { fullName: "Arjun Kapoor", preferredRole: "Batsman", experienceLevel: "Advanced", team: team4 },
    { fullName: "Kavya Menon", preferredRole: "Bowler", experienceLevel: "Advanced", team: team4 },
    { fullName: "Tarun Bhat", preferredRole: "All-Rounder", experienceLevel: "Intermediate", team: team4 },
    { fullName: "Sneha Reddy", preferredRole: "Wicket Keeper", experienceLevel: "Intermediate", team: team4 },
    { fullName: "Harish Gowda", preferredRole: "Batsman", experienceLevel: "Beginner", team: team4 },
    { fullName: "Meera Krishnan", preferredRole: "Bowler", experienceLevel: "Advanced", team: team4 },
    { fullName: "Rajesh Pillai", preferredRole: "All-Rounder", experienceLevel: "Intermediate", team: team4 },
    { fullName: "Divya Nambiar", preferredRole: "Batsman", experienceLevel: "Advanced", team: team4 },
  ];

  for (let i = 0; i < teamPlayers.length; i++) {
    const p = teamPlayers[i];
    const player = await prisma.player.create({
      data: {
        fullName: p.fullName,
        preferredRole: p.preferredRole,
        experienceLevel: p.experienceLevel,
        poolStatus: PoolStatus.ASSIGNED,
      },
    });
    await prisma.teamMembership.create({
      data: {
        teamId: p.team.id,
        playerId: player.id,
        membershipType: MembershipType.TEAM_SUBMISSION,
        positionSlot: `Player ${(i % 9) + 1}`,
      },
    });
  }

  console.log("✅ Team players + memberships created");

  // ─── Individual Pool Players ────────────────────────
  const poolPlayers = [
    { fullName: "Ankit Saxena", preferredRole: "Batsman", experienceLevel: "Intermediate" },
    { fullName: "Swati Jain", preferredRole: "Bowler", experienceLevel: "Advanced" },
    { fullName: "Manoj Tiwari", preferredRole: "All-Rounder", experienceLevel: "Beginner" },
    { fullName: "Rekha Menon", preferredRole: "Wicket Keeper", experienceLevel: "Intermediate" },
    { fullName: "Siddharth Kulkarni", preferredRole: "Batsman", experienceLevel: "Advanced" },
    { fullName: "Lakshmi Narayan", preferredRole: "Bowler", experienceLevel: "Intermediate" },
    { fullName: "Pranav Desai", preferredRole: "All-Rounder", experienceLevel: "Beginner" },
    { fullName: "Anjali Bhatt", preferredRole: "Batsman", experienceLevel: "Advanced" },
  ];

  for (const p of poolPlayers) {
    await prisma.player.create({
      data: {
        fullName: p.fullName,
        preferredRole: p.preferredRole,
        experienceLevel: p.experienceLevel,
        poolStatus: PoolStatus.LOOKING_FOR_TEAM,
      },
    });
  }

  console.log("✅ Individual pool players created");

  // ─── Sample Audit Log ───────────────────────────────
  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: AuditAction.CREATE_TEAM,
      entityType: "Team",
      entityId: team1.id,
      after: { name: "Royal Strikers", teamSize: 8 },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: AuditAction.REGISTER_TEAM,
      entityType: "Team",
      entityId: team2.id,
      after: { name: "Thunder Hawks", teamSize: 8 },
    },
  });

  console.log("✅ Audit logs created");
  console.log("\n🏏 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
