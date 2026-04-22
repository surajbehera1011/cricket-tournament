-- Add team color
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "color" TEXT NOT NULL DEFAULT '';

-- Add tournament start date
ALTER TABLE "tournament_settings" ADD COLUMN IF NOT EXISTS "tournamentStartDate" TIMESTAMP(3);
