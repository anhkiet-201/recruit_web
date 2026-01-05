import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IndexingQueueService } from './indexing-queue.service';
import { GoogleIndexingService } from './google-indexing.service';

@Injectable()
export class IndexingWorkerService {
  private readonly logger = new Logger(IndexingWorkerService.name);
  private isProcessing = false;

  constructor(
    private queueService: IndexingQueueService,
    private indexingService: GoogleIndexingService,
  ) {}

  /**
   * Chạy mỗi 10 phút
   */
  @Cron('*/10 * * * *', {
    name: 'indexing-worker',
  })
  async processQueue() {
    // Prevent overlapping executions
    if (this.isProcessing) {
      this.logger.warn('Previous batch still processing. Skipping...');
      return;
    }

    this.isProcessing = true;
    this.logger.log('🚀 Starting indexing queue worker...');

    try {
      // Lấy batch pending items (20 URLs mỗi lần)
      const batch = await this.queueService.getPendingBatch(20);

      if (batch.length === 0) {
        this.logger.log('No pending items in queue');
        return;
      }

      this.logger.log(`Processing ${batch.length} URLs from queue`);

      // Xử lý từng item
      for (const item of batch) {
        await this.queueService.markAsProcessing(item.id);

        try {
          // Gọi Google Indexing API
          await this.indexingService.publishUrl({
            url: item.url,
            type: item.type as 'URL_UPDATED' | 'URL_DELETED',
          });

          // Mark as success
          await this.queueService.markAsSuccess(item.id);
          this.logger.log(`✅ Successfully indexed: ${item.url}`);
        } catch (error: unknown) {
          // Mark as failed (auto retry if < maxRetries)
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          await this.queueService.markAsFailed(item.id, errorMessage);
          this.logger.error(`❌ Failed to index: ${item.url}`, errorMessage);
        }

        // Delay 1 giây giữa các requests (rate limiting)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      this.logger.log(
        `✅ Queue worker completed: ${batch.length} URLs processed`,
      );
    } catch (error) {
      this.logger.error('Queue worker failed', error);
    } finally {
      this.isProcessing = false;
    }
  }
}
