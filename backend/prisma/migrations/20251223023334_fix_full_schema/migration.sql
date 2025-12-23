/*
  Warnings:

  - You are about to drop the column `isActive` on the `Job` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('REVIEWING', 'ACTIVE', 'REJECTED', 'CLOSED');

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "isActive",
ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "status" "JobStatus" NOT NULL DEFAULT 'REVIEWING';

-- CreateTable
CREATE TABLE "EmployerRequest" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployerRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmployerRequest" ADD CONSTRAINT "EmployerRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
