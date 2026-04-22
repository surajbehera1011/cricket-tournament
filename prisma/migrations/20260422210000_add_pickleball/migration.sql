-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PickleballCategory" AS ENUM ('MENS_SINGLES', 'WOMENS_SINGLES', 'MENS_DOUBLES', 'WOMENS_DOUBLES', 'MIXED_DOUBLES');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PickleballStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "pickleball_registrations" (
    "id" TEXT NOT NULL,
    "category" "PickleballCategory" NOT NULL,
    "player1Name" TEXT NOT NULL,
    "player1Email" TEXT NOT NULL,
    "player2Name" TEXT,
    "player2Email" TEXT,
    "status" "PickleballStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pickleball_registrations_pkey" PRIMARY KEY ("id")
);
