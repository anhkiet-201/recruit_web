import { defineConfig, env } from 'prisma/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from parent directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Also load from current directory if present
dotenv.config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
