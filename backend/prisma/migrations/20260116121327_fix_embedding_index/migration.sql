-- Drop btree index cũ (quá nhỏ cho vector)
DROP INDEX IF EXISTS "job_positions_embedding_idx";

-- Tạo ivfflat index cho vector search
CREATE INDEX job_positions_embedding_idx ON job_positions 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
