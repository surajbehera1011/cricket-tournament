import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding cricket tournament database...\n");

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

  console.log("Tournament settings created");

  // ─── Admin User ───────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "surajbehera1011@gmail.com" },
    update: { role: UserRole.ADMIN },
    create: {
      email: "surajbehera1011@gmail.com",
      displayName: "Tournament Admin",
      role: UserRole.ADMIN,
      password: "",
    },
  });

  console.log("Admin user created");
  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
