import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema-recruitment.prisma',
  migrations: {
    path: 'prisma/migrations-recruitment',
  },
  datasource: {
    url: process.env.RECRUITMENT_DATABASE_URL,
  },
});
