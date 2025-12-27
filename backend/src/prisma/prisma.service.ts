import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Calculate path to parent .env (assuming dist/prisma/prisma.service.js or src/prisma...)
// When running in dist, __dirname is .../dist/prisma. Parent .env is .../.env (3 levels up?)
// When running in src, __dirname is .../src/prisma. Parent .env is .../../.env (2 levels up?)
// Wait, the workspace root is 2 levels up from backend root.
// backend/.env (missing)
// ttn-web/.env (present)
// backend/src/prisma/prisma.service.ts -> ../../../.env
// backend/dist/prisma/prisma.service.js -> ../../../.env

// Let's try to find it robustly or just assume standard structure.
// If run from backend root via `nest start`, `process.cwd()` is backend/.
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // Load local .env if any

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
