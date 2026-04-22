-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_SETTINGS';

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'MALE';

-- AlterTable
ALTER TABLE "teams" ALTER COLUMN "teamSize" SET DEFAULT 9;

-- CreateTable
CREATE TABLE "tournament_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "maxTeamSize" INTEGER NOT NULL DEFAULT 9,
    "minFemalePerTeam" INTEGER NOT NULL DEFAULT 1,
    "tournamentName" TEXT NOT NULL DEFAULT 'Office Cricket Tournament',
    "registrationOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_settings_pkey" PRIMARY KEY ("id")
);
