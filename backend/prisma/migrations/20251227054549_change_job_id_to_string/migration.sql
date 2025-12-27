/*
  Warnings:

  - The primary key for the `Job` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `JobTag` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_jobId_fkey";

-- DropForeignKey
ALTER TABLE "JobTag" DROP CONSTRAINT "JobTag_jobId_fkey";

-- AlterTable
ALTER TABLE "Application" ALTER COLUMN "jobId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Job" DROP CONSTRAINT "Job_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Job_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "JobTag" DROP CONSTRAINT "JobTag_pkey",
ALTER COLUMN "jobId" SET DATA TYPE TEXT,
ADD CONSTRAINT "JobTag_pkey" PRIMARY KEY ("jobId", "tagId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTag" ADD CONSTRAINT "JobTag_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
