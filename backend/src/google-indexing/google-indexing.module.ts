import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleIndexingService } from './google-indexing.service';
import { IndexingQueueService } from './indexing-queue.service';
import { IndexingWorkerService } from './indexing-worker.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    GoogleIndexingService,
    IndexingQueueService,
    IndexingWorkerService,
  ],
  exports: [GoogleIndexingService, IndexingQueueService],
})
export class GoogleIndexingModule {}
