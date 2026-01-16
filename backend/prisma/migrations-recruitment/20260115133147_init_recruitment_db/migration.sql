-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "recruitment_posts" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruitment_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_positions" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "description_text" TEXT NOT NULL,
    "embedding" vector(768),
    "salary_packages" JSONB NOT NULL,
    "managers" JSONB NOT NULL,
    "shifts" JSONB NOT NULL,
    "requirements" JSONB NOT NULL,
    "benefits" JSONB NOT NULL,
    "other_requirements" JSONB NOT NULL,
    "environment" JSONB NOT NULL,
    "notes" JSONB NOT NULL,

    CONSTRAINT "job_positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: ivfflat for vector search (btree won't work for 768-dim vectors)
CREATE INDEX "job_positions_embedding_idx" ON "job_positions"
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- AddForeignKey
ALTER TABLE "job_positions" ADD CONSTRAINT "job_positions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "recruitment_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
