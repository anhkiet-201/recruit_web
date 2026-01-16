/*
  Warnings:

  - Added the required column `employment_type` to the `job_positions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "job_positions" ADD COLUMN     "employment_type" TEXT NOT NULL;
