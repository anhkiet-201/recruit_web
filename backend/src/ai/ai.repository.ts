import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiJobRepository {
    constructor(private readonly prisma: PrismaService) { }

    async getUserContext(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            include: { applications: { take: 3 }, searchHistories: { take: 5 } },
        });
    }

    async updateUserEmbedding(userId: string, vectorString: string) {
        return this.prisma.$executeRaw`UPDATE "User" SET "embedding" = ${vectorString}::vector WHERE "id" = ${userId}`;
    }

    async updateJobEmbedding(jobId: string, vectorString: string) {
        return this.prisma.$executeRaw`UPDATE "Job" SET "embedding" = ${vectorString}::vector WHERE "id" = ${jobId}::uuid`;
    }

    async findSimilarJobs(vectorString: string, query: string, limit: number = 20): Promise<any[]> {
        return this.prisma.$queryRaw`
      SELECT id, title, content, location, "imageUrl", "jobType", "salaryMin", "salaryMax", (1 - ("embedding" <=> ${vectorString}::vector)) as similarity
      FROM "Job" WHERE "isActive" = true AND "embedding" IS NOT NULL
      ORDER BY ((1 - ("embedding" <=> ${vectorString}::vector)) + (CASE WHEN title ILIKE ${'%' + query + '%'} THEN 0.8 ELSE 0 END)) DESC LIMIT ${limit}
    `;
    }

    async recommendJobsForUser(userId: string, limit: number = 5) {
        return this.prisma.$queryRaw`SELECT j.id, j.title, 1 - (j."embedding" <=> u."embedding") as score FROM "Job" j, "User" u WHERE u.id = ${userId} AND j."isActive" = true AND j."embedding" IS NOT NULL ORDER BY score DESC LIMIT ${limit}`;
    }
}
