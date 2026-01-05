import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type QueueItemType = 'URL_UPDATED' | 'URL_DELETED';

@Injectable()
export class IndexingQueueService {
  private readonly logger = new Logger(IndexingQueueService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Thêm URL vào queue (gọi khi user đăng tin)
   */
  async enqueue(url: string, type: QueueItemType = 'URL_UPDATED') {
    try {
      // Check if URL already in queue with pending/processing status
      const existing = await this.prisma.indexingQueue.findFirst({
        where: {
          url,
          status: { in: ['pending', 'processing'] },
        },
      });

      if (existing) {
        this.logger.debug(`URL already in queue: ${url}`);
        return existing;
      }

      // Add to queue
      const queueItem = await this.prisma.indexingQueue.create({
        data: {
          url,
          type,
          status: 'pending',
        },
      });

      this.logger.log(`✅ Added to indexing queue: ${url}`);
      return queueItem;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to enqueue URL: ${url}`, errorMessage);
      throw error;
    }
  }

  /**
   * Lấy batch URLs để xử lý (worker sẽ gọi mỗi 10 phút)
   */
  async getPendingBatch(limit: number = 20) {
    return await this.prisma.indexingQueue.findMany({
      where: {
        status: 'pending',
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });
  }

  /**
   * Mark item as processing
   */
  async markAsProcessing(id: number) {
    return this.prisma.indexingQueue.update({
      where: { id },
      data: {
        status: 'processing',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Mark item as success
   */
  async markAsSuccess(id: number) {
    return this.prisma.indexingQueue.update({
      where: { id },
      data: {
        status: 'success',
        processedAt: new Date(),
      },
    });
  }

  /**
   * Mark item as failed and increment retry count
   */
  async markAsFailed(id: number, error: string) {
    const item = await this.prisma.indexingQueue.findUnique({
      where: { id },
    });

    if (!item) return null;

    const newRetryCount = item.retryCount + 1;
    const shouldRetry = newRetryCount < item.maxRetries;

    return this.prisma.indexingQueue.update({
      where: { id },
      data: {
        status: shouldRetry ? 'pending' : 'failed',
        retryCount: newRetryCount,
        lastError: error,
        updatedAt: new Date(),
        processedAt: shouldRetry ? null : new Date(),
      },
    });
  }
}
