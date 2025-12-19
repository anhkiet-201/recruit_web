import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobsCleanupService } from './jobs.cleanup.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [JobsController],
  providers: [JobsService, JobsCleanupService],
  exports: [JobsService]
})
export class JobsModule {}
