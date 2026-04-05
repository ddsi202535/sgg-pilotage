-- CreateTable
CREATE TABLE "axes_strategiques" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "axes_strategiques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programmes_ldf" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "axeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programmes_ldf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objectifs_strategiques" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objectifs_strategiques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cibles_strategiques" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "valeurCible" DOUBLE PRECISION,
    "valeurReel" DOUBLE PRECISION,
    "unite" TEXT,
    "annee" INTEGER NOT NULL DEFAULT 2025,
    "objectifId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cibles_strategiques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "projectId" TEXT,
    "kpiId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts_triggered" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_triggered_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "axes_strategiques_code_key" ON "axes_strategiques"("code");

-- AddForeignKey
ALTER TABLE "programmes_ldf" ADD CONSTRAINT "programmes_ldf_axeId_fkey" FOREIGN KEY ("axeId") REFERENCES "axes_strategiques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objectifs_strategiques" ADD CONSTRAINT "objectifs_strategiques_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "programmes_ldf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cibles_strategiques" ADD CONSTRAINT "cibles_strategiques_objectifId_fkey" FOREIGN KEY ("objectifId") REFERENCES "objectifs_strategiques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts_triggered" ADD CONSTRAINT "alerts_triggered_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "alert_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
