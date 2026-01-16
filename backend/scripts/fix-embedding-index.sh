#!/bin/bash
# Fix embedding index - Drop btree và tạo ivfflat index

echo "🔧 Fixing embedding index for vector search..."

# Run SQL directly on recruitment database
docker exec ttn-postgres psql -U user -d recruitment_db -c "
-- Drop old btree index (too small for vectors)
DROP INDEX IF EXISTS job_positions_embedding_idx;

-- Create ivfflat index for vector search  
-- ivfflat is optimized for approximate nearest neighbor search
CREATE INDEX job_positions_embedding_idx ON job_positions 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
"

echo "✅ Index fixed! Vector search will now work properly."
