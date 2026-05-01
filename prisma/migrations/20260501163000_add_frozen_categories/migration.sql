-- AlterTable
ALTER TABLE "fixtures" ADD COLUMN "frozenCategories" TEXT[] DEFAULT ARRAY[]::TEXT[];
