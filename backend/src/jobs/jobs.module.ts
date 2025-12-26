import { Module, forwardRef } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobsCleanupService } from './jobs.cleanup.service';
import { UploadModule } from '../upload/upload.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [UploadModule, forwardRef(() => AiModule)],
  controllers: [JobsController],
  providers: [JobsService, JobsCleanupService],
  exports: [JobsService]
})
export class JobsModule { }
