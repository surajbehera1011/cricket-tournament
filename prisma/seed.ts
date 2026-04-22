import { PrismaClient, UserRole, PoolStatus, MembershipType, TeamStatus, AuditAction, Gender } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🏏 Seeding cricket tournament database...\n");

  // ─── Tournament Settings ────────────────────────────
  await prisma.tournamentSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      maxTeamSize: 9,
      minFemalePerTeam: 1,
      tournamentName: "Office Cricket Tournament",
      registrationOpen: true,
    },
  });

  console.log("✅ Tournament settings created");

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

  // ─── Teams (default size now 9) ─────────────────────
  const team1 = await prisma.team.upsert({
    where: { name: "Royal Strikers" },
    update: {},
    create: {
      name: "Royal Strikers",
      captainUserId: captain1.id,
      teamSize: 9,
      status: TeamStatus.INCOMPLETE,
    },
  });

  const team2 = await prisma.team.upsert({
    where: { name: "Thunder Hawks" },
    update: {},
    create: {
      name: "Thunder Hawks",
      captainUserId: captain2.id,
      teamSize: 9,
      status: TeamStatus.INCOMPLETE,
    },
  });

  const team3 = await prisma.team.upsert({
    where: { name: "Code Warriors" },
    update: {},
    create: {
      name: "Code Warriors",
      captainUserId: null,
      teamSize: 9,
      status: TeamStatus.INCOMPLETE,
    },
  });

  const team4 = await prisma.team.upsert({
    where: { name: "Debug Dragons" },
    update: {},
    create: {
      name: "Debug Dragons",
      captainUserId: null,
      teamSize: 9,
      status: TeamStatus.INCOMPLETE,
    },
  });

  console.log("✅ Teams created");

  // ─── Players (team members) ─────────────────────────
  // Gender: F = FEMALE, M = MALE
  const teamPlayers = [
    { fullName: "Rahul Sharma", gender: Gender.MALE, preferredRole: "Batsman", experienceLevel: "Advanced", team: team1 },
    { fullName: "Vikram Singh", gender: Gender.MALE, preferredRole: "Bowler", experienceLevel: "Advanced", team: team1 },
    { fullName: "Arun Nair", gender: Gender.MALE, preferredRole: "All-Rounder", experienceLevel: "Intermediate", team: team1 },
    { fullName: "Deepak Reddy", gender: Gender.MALE, preferredRole: "Batsman", experienceLevel: "Intermediate", team: team1 },
    { fullName: "Karthik Iyer", gender: Gender.MALE, preferredRole: "Bowler", experienceLevel: "Beginner", team: team1 },
    { fullName: "Suresh Kumar", gender: Gender.MALE, preferredRole: "Wicket Keeper", experienceLevel: "Advanced", team: team1 },
    { fullName: "Manish Pandey", gender: Gender.MALE, preferredRole: "All-Rounder", experienceLevel: "Intermediate", team: team1 },
    { fullName: "Meera Sharma", gender: Gender.FEMALE, preferredRole: "Bowler", experienceLevel: "Intermediate", team: team1 },

    { fullName: "Priya Patel", gender: Gender.FEMALE, preferredRole: "Batsman", experienceLevel: "Advanced", team: team2 },
    { fullName: "Neha Gupta", gender: Gender.FEMALE, preferredRole: "Bowler", experienceLevel: "Intermediate", team: team2 },
    { fullName: "Sanjay Rao", gender: Gender.MALE, preferredRole: "All-Rounder", experienceLevel: "Advanced", team: team2 },
    { fullName: "Akash Mehta", gender: Gender.MALE, preferredRole: "Batsman", experienceLevel: "Beginner", team: team2 },
    { fullName: "Rohan Das", gender: Gender.MALE, preferredRole: "Bowler", experienceLevel: "Intermediate", team: team2 },

    { fullName: "Varun Joshi", gender: Gender.MALE, preferredRole: "Batsman", experienceLevel: "Intermediate", team: team3 },
    { fullName: "Nitin Verma", gender: Gender.MALE, preferredRole: "All-Rounder", experienceLevel: "Advanced", team: team3 },
    { fullName: "Pooja Sharma", gender: Gender.FEMALE, preferredRole: "Bowler", experienceLevel: "Beginner", team: team3 },

    { fullName: "Arjun Kapoor", gender: Gender.MALE, preferredRole: "Batsman", experienceLevel: "Advanced", team: team4 },
    { fullName: "Kavya Menon", gender: Gender.FEMALE, preferredRole: "Bowler", experienceLevel: "Advanced", team: team4 },
    { fullName: "Tarun Bhat", gender: Gender.MALE, preferredRole: "All-Rounder", experienceLevel: "Intermediate", team: team4 },
    { fullName: "Sneha Reddy", gender: Gender.FEMALE, preferredRole: "Wicket Keeper", experienceLevel: "Intermediate", team: team4 },
    { fullName: "Harish Gowda", gender: Gender.MALE, preferredRole: "Batsman", experienceLevel: "Beginner", team: team4 },
    { fullName: "Meera Krishnan", gender: Gender.FEMALE, preferredRole: "Bowler", experienceLevel: "Advanced", team: team4 },
    { fullName: "Rajesh Pillai", gender: Gender.MALE, preferredRole: "All-Rounder", experienceLevel: "Intermediate", team: team4 },
    { fullName: "Divya Nambiar", gender: Gender.FEMALE, preferredRole: "Batsman", experienceLevel: "Advanced", team: team4 },
  ];

  for (let i = 0; i < teamPlayers.length; i++) {
    const p = teamPlayers[i];
    const player = await prisma.player.create({
      data: {
        fullName: p.fullName,
        gender: p.gender,
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
    { fullName: "Ankit Saxena", gender: Gender.MALE, preferredRole: "Batsman", experienceLevel: "Intermediate" },
    { fullName: "Swati Jain", gender: Gender.FEMALE, preferredRole: "Bowler", experienceLevel: "Advanced" },
    { fullName: "Manoj Tiwari", gender: Gender.MALE, preferredRole: "All-Rounder", experienceLevel: "Beginner" },
    { fullName: "Rekha Menon", gender: Gender.FEMALE, preferredRole: "Wicket Keeper", experienceLevel: "Intermediate" },
    { fullName: "Siddharth Kulkarni", gender: Gender.MALE, preferredRole: "Batsman", experienceLevel: "Advanced" },
    { fullName: "Lakshmi Narayan", gender: Gender.FEMALE, preferredRole: "Bowler", experienceLevel: "Intermediate" },
    { fullName: "Pranav Desai", gender: Gender.MALE, preferredRole: "All-Rounder", experienceLevel: "Beginner" },
    { fullName: "Anjali Bhatt", gender: Gender.FEMALE, preferredRole: "Batsman", experienceLevel: "Advanced" },
  ];

  for (const p of poolPlayers) {
    await prisma.player.create({
      data: {
        fullName: p.fullName,
        gender: p.gender,
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
      after: { name: "Royal Strikers", teamSize: 9 },
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
