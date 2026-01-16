/*
  Warnings:

  - Added the required column `shift_selections` to the `job_positions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "job_positions" ADD COLUMN     "shift_selections" JSONB NOT NULL;
