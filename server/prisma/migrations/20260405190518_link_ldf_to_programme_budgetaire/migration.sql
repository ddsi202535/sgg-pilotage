-- AlterTable
ALTER TABLE "programmes_ldf" ADD COLUMN     "programmeBudgetaireId" TEXT;

-- AddForeignKey
ALTER TABLE "programmes_ldf" ADD CONSTRAINT "programmes_ldf_programmeBudgetaireId_fkey" FOREIGN KEY ("programmeBudgetaireId") REFERENCES "programmes_budgetaires"("id") ON DELETE SET NULL ON UPDATE CASCADE;
