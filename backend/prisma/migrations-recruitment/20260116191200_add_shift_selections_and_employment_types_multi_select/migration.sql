/*
  Warnings:

  - Idempotent migration to ensure columns exist without crashing.
*/

-- Safe Add Column: employment_types
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_positions' AND column_name='employment_types') THEN
        ALTER TABLE "job_positions" ADD COLUMN "employment_types" JSONB NOT NULL DEFAULT '[]';
    END IF;
END $$;

-- Safe Add Column: shift_selections
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_positions' AND column_name='shift_selections') THEN
        ALTER TABLE "job_positions" ADD COLUMN "shift_selections" JSONB NOT NULL DEFAULT '[]';
    END IF;
END $$;

-- Drop legacy column if exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_positions' AND column_name='employment_type') THEN
        ALTER TABLE "job_positions" DROP COLUMN "employment_type";
    END IF;
END $$;
