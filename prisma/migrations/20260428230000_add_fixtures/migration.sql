-- CreateEnum
CREATE TYPE "FixtureSport" AS ENUM ('CRICKET', 'PICKLEBALL');
CREATE TYPE "FixtureStatus" AS ENUM ('DRAFT', 'FROZEN');
CREATE TYPE "FixtureStage" AS ENUM ('GROUP', 'KNOCKOUT');
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'COMPLETED');

-- Add new settings columns
ALTER TABLE "tournament_settings" ADD COLUMN "targetCricketTeams" INTEGER NOT NULL DEFAULT 12;
ALTER TABLE "tournament_settings" ADD COLUMN "cricketGroupCount" INTEGER NOT NULL DEFAULT 4;

-- CreateTable
CREATE TABLE "fixtures" (
    "id" TEXT NOT NULL,
    "sport" "FixtureSport" NOT NULL,
    "status" "FixtureStatus" NOT NULL DEFAULT 'DRAFT',
    "groupCount" INTEGER NOT NULL DEFAULT 4,
    "frozenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixtures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "sport" "FixtureSport" NOT NULL,
    "stage" "FixtureStage" NOT NULL,
    "groupName" TEXT,
    "roundNumber" INTEGER NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "category" TEXT,
    "team1Id" TEXT,
    "team2Id" TEXT,
    "entry1Id" TEXT,
    "entry2Id" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "venue" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fixtures_sport_key" ON "fixtures"("sport");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "fixtures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
