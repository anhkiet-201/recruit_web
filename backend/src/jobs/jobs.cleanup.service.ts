import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsCleanupService {
  private readonly logger = new Logger(JobsCleanupService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCleanup() {
    this.logger.debug('Starting maintenance tasks...');
    await this.handleJobExpiration();
    await this.handleGuestCleanup();
  }

  async handleJobExpiration() {
    const now = new Date();
    const expiredJobs = await this.prisma.job.updateMany({
      where: { isActive: true, deadline: { lt: now } },
      data: { isActive: false }
    });

    if (expiredJobs.count > 0) {
        const closedJobIds = await this.prisma.job.findMany({ where: { isActive: false, deadline: { lt: now } }, select: { id: true } });
        const ids = closedJobIds.map(j => j.id);
        if (ids.length > 0) {
            await this.prisma.application.updateMany({ where: { jobId: { in: ids }, status: 'pending' }, data: { status: 'expired' } });
        }
    }
  }

  async handleGuestCleanup() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Delete guests who haven't been active for 7 days
    const deleted = await this.prisma.guest.deleteMany({
      where: {
        lastActive: { lt: sevenDaysAgo }
      }
    });

    if (deleted.count > 0) {
      this.logger.log(`Cleaned up ${deleted.count} inactive guest records.`);
    }
  }
}