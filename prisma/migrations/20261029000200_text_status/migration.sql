-- CreateEnum
CREATE TYPE "TextStatus" AS ENUM ('FULL_TEXT', 'EXCERPT_ONLY', 'METADATA_ONLY');

-- AlterTable
ALTER TABLE "Work" ADD COLUMN "textStatus" "TextStatus" NOT NULL DEFAULT 'FULL_TEXT';

-- AlterTable
ALTER TABLE "WorkVersion" ADD COLUMN "textStatus" "TextStatus" NOT NULL DEFAULT 'FULL_TEXT';

-- CreateIndex
CREATE INDEX "Work_textStatus_idx" ON "Work"("textStatus");
