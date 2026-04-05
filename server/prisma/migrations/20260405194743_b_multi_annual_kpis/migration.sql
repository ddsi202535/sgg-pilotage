/*
  Warnings:

  - You are about to drop the `cibles_strategiques` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "cibles_strategiques" DROP CONSTRAINT "cibles_strategiques_objectifId_fkey";

-- DropTable
DROP TABLE "cibles_strategiques";

-- CreateTable
CREATE TABLE "indicateurs" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unite" TEXT,
    "objectifId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesures_annuelles" (
    "id" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "valeurCible" DOUBLE PRECISION,
    "valeurReel" DOUBLE PRECISION,
    "indicateurId" TEXT NOT NULL,

    CONSTRAINT "mesures_annuelles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bi_snapshots" (
    "id" TEXT NOT NULL,
    "programmeBudgetaireId" TEXT NOT NULL,
    "dateSnapshot" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mois" INTEGER NOT NULL,
    "annee" INTEGER NOT NULL,
    "physicalProgress" DOUBLE PRECISION NOT NULL,
    "financialProgress" DOUBLE PRECISION NOT NULL,
    "budgetConsomme" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "bi_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mesures_annuelles_indicateurId_annee_key" ON "mesures_annuelles"("indicateurId", "annee");

-- CreateIndex
CREATE UNIQUE INDEX "bi_snapshots_programmeBudgetaireId_annee_mois_key" ON "bi_snapshots"("programmeBudgetaireId", "annee", "mois");

-- AddForeignKey
ALTER TABLE "indicateurs" ADD CONSTRAINT "indicateurs_objectifId_fkey" FOREIGN KEY ("objectifId") REFERENCES "objectifs_strategiques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesures_annuelles" ADD CONSTRAINT "mesures_annuelles_indicateurId_fkey" FOREIGN KEY ("indicateurId") REFERENCES "indicateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bi_snapshots" ADD CONSTRAINT "bi_snapshots_programmeBudgetaireId_fkey" FOREIGN KEY ("programmeBudgetaireId") REFERENCES "programmes_budgetaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;
