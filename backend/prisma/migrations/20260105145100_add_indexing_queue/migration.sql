-- CreateTable
CREATE TABLE "IndexingQueue" (
    "id" SERIAL NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "IndexingQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IndexingQueue_status_createdAt_idx" ON "IndexingQueue"("status", "createdAt");

-- CreateIndex
CREATE INDEX "IndexingQueue_url_idx" ON "IndexingQueue"("url");
