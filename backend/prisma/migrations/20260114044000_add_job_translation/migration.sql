-- CreateTable
CREATE TABLE IF NOT EXISTS "JobTranslation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jobId" TEXT NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JobTranslation_jobId_locale_idx" ON "JobTranslation"("jobId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "JobTranslation_jobId_locale_key" ON "JobTranslation"("jobId", "locale");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'JobTranslation_jobId_fkey'
    ) THEN
        ALTER TABLE "JobTranslation" ADD CONSTRAINT "JobTranslation_jobId_fkey" 
        FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
