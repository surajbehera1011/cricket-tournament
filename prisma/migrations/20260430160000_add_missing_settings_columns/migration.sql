-- Add missing tournament_settings columns
ALTER TABLE "tournament_settings" ADD COLUMN IF NOT EXISTS "mandatoryPlayerCount" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "tournament_settings" ADD COLUMN IF NOT EXISTS "mandatoryFemaleCount" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "tournament_settings" ADD COLUMN IF NOT EXISTS "extraPlayerLimit" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "tournament_settings" ADD COLUMN IF NOT EXISTS "cricketVenue" TEXT NOT NULL DEFAULT '';
ALTER TABLE "tournament_settings" ADD COLUMN IF NOT EXISTS "cricketVenueMapUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "tournament_settings" ADD COLUMN IF NOT EXISTS "pickleballVenue" TEXT NOT NULL DEFAULT '';
ALTER TABLE "tournament_settings" ADD COLUMN IF NOT EXISTS "pickleballVenueMapUrl" TEXT NOT NULL DEFAULT '';

-- Update maxTeamSize default to match schema
ALTER TABLE "tournament_settings" ALTER COLUMN "maxTeamSize" SET DEFAULT 10;
ALTER TABLE "teams" ALTER COLUMN "teamSize" SET DEFAULT 10;

-- Add missing AuditAction value
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'UPDATE_CAPTAIN';
