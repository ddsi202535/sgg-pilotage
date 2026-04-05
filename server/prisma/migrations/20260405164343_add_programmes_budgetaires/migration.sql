-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "programmeId" TEXT;

-- CreateTable
CREATE TABLE "programmes_budgetaires" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "responsableId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programmes_budgetaires_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "programmes_budgetaires_code_key" ON "programmes_budgetaires"("code");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "programmes_budgetaires"("id") ON DELETE SET NULL ON UPDATE CASCADE;
