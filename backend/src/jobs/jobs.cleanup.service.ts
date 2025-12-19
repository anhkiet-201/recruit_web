import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsCleanupService {
  private readonly logger = new Logger(JobsCleanupService.name);

  constructor(private prisma: PrismaService) {}

  // Run every day at midnight: '0 0 * * *'
  // For testing purposes, you can use CronExpression.EVERY_MINUTE
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleJobExpiration() {
    this.logger.debug('Checking for expired jobs...');

    const now = new Date();

    // 1. Find and Close Expired Jobs
    const expiredJobs = await this.prisma.job.updateMany({
      where: {
        isActive: true,
        deadline: {
          lt: now, // less than now
        },
      },
      data: {
        isActive: false,
      },
    });

    if (expiredJobs.count > 0) {
        this.logger.log(`Closed ${expiredJobs.count} expired jobs.`);

        // 2. Mark pending applications of expired jobs as 'expired'
        // We first need to find the IDs of jobs that are now closed (or just closed)
        // Ideally we should have fetched IDs before update, but updateMany doesn't return IDs.
        // So we query closed jobs with deadline < now.
        
        const closedJobIds = await this.prisma.job.findMany({
            where: {
                isActive: false,
                deadline: { lt: now }
            },
            select: { id: true }
        });

        const ids = closedJobIds.map(j => j.id);

        if (ids.length > 0) {
            const expiredApps = await this.prisma.application.updateMany({
                where: {
                    jobId: { in: ids },
                    status: 'pending'
                },
                data: {
                    status: 'expired' // Marking as expired (rejected/history)
                }
            });
            
            if (expiredApps.count > 0) {
                this.logger.log(`Marked ${expiredApps.count} applications as expired.`);
            }
        }
    }
  }
}
