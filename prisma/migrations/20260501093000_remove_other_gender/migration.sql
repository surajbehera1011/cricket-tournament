-- Remove OTHER from Gender enum
-- First update any existing rows that use OTHER to MALE as a safe default
UPDATE "players" SET "gender" = 'MALE' WHERE "gender" = 'OTHER';

-- Remove the OTHER value from the Gender enum
ALTER TYPE "Gender" RENAME TO "Gender_old";
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');
ALTER TABLE "players" ALTER COLUMN "gender" DROP DEFAULT;
ALTER TABLE "players" ALTER COLUMN "gender" TYPE "Gender" USING ("gender"::text::"Gender");
ALTER TABLE "players" ALTER COLUMN "gender" SET DEFAULT 'MALE';
DROP TYPE "Gender_old";
