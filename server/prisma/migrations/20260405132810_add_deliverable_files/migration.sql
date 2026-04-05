-- AlterTable
ALTER TABLE "deliverables" ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "fileType" TEXT,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "originalName" TEXT;
