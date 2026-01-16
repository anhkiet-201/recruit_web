import { Module } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { RecruitmentController } from './recruitment.controller';
import { RecruitmentRepository } from './recruitment.repository';
import { RecruitmentPrismaService } from './recruitment-prisma.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [RecruitmentController],
  providers: [
    RecruitmentService,
    RecruitmentRepository,
    RecruitmentPrismaService,
  ],
  exports: [RecruitmentService],
})
export class RecruitmentModule {}
