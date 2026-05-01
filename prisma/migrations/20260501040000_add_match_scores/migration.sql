-- Add score and winner fields to matches
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "score1" TEXT;
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "score2" TEXT;
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "winnerId" TEXT;

-- Add RECORD_SCORE audit action
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'RECORD_SCORE';
