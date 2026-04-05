/*
  Warnings:

  - You are about to drop the column `programmeId` on the `objectifs_strategiques` table. All the data in the column will be lost.
  - You are about to drop the `programmes_ldf` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `projectId` to the `objectifs_strategiques` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "objectifs_strategiques" DROP CONSTRAINT "objectifs_strategiques_programmeId_fkey";

-- DropForeignKey
ALTER TABLE "programmes_ldf" DROP CONSTRAINT "programmes_ldf_axeId_fkey";

-- DropForeignKey
ALTER TABLE "programmes_ldf" DROP CONSTRAINT "programmes_ldf_programmeBudgetaireId_fkey";

-- AlterTable
ALTER TABLE "budgets" ADD COLUMN     "source" TEXT DEFAULT 'MDD';

-- AlterTable
ALTER TABLE "objectifs_strategiques" DROP COLUMN "programmeId",
ADD COLUMN     "projectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "programmes_budgetaires" ADD COLUMN     "axeId" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "sourceBudget" TEXT;

-- DropTable
DROP TABLE "programmes_ldf";

-- AddForeignKey
ALTER TABLE "programmes_budgetaires" ADD CONSTRAINT "programmes_budgetaires_axeId_fkey" FOREIGN KEY ("axeId") REFERENCES "axes_strategiques"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objectifs_strategiques" ADD CONSTRAINT "objectifs_strategiques_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
