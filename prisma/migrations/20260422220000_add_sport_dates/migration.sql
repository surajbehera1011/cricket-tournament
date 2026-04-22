ALTER TABLE "tournament_settings" ADD COLUMN IF NOT EXISTS "cricketStartDate" TIMESTAMP(3);
ALTER TABLE "tournament_settings" ADD COLUMN IF NOT EXISTS "pickleballStartDate" TIMESTAMP(3);
ALTER TABLE "tournament_settings" ADD COLUMN IF NOT EXISTS "cricketRegCloseDate" TIMESTAMP(3);
ALTER TABLE "tournament_settings" ADD COLUMN IF NOT EXISTS "pickleballRegCloseDate" TIMESTAMP(3);

-- Migrate existing tournamentStartDate to cricketStartDate if not already set
UPDATE "tournament_settings"
SET "cricketStartDate" = "tournamentStartDate"
WHERE "tournamentStartDate" IS NOT NULL AND "cricketStartDate" IS NULL;
