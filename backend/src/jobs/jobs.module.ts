import { Module, forwardRef } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobsCleanupService } from './jobs.cleanup.service';
import { UploadModule } from '../upload/upload.module';
import { AiModule } from '../ai/ai.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GoogleIndexingModule } from '../google-indexing/google-indexing.module';

@Module({
  imports: [
    UploadModule,
    forwardRef(() => AiModule),
    NotificationsModule,
    GoogleIndexingModule,
  ],
  controllers: [JobsController],
  providers: [JobsService, JobsCleanupService],
  exports: [JobsService],
})
export class JobsModule {}
