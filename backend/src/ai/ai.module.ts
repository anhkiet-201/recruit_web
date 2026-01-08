import { Module, forwardRef } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AI_PROVIDER_TOKEN } from './interfaces/ai-provider.interface';
import { AiJobRepository } from './ai.repository';
import { PromptService } from './prompt.service';
import { ContextService } from './context.service';
import { JobsModule } from '../jobs/jobs.module';
import { GeminiProvider } from './providers/gemini.provider';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({}), forwardRef(() => JobsModule)],
  controllers: [AiController],
  providers: [
    AiService,
    AiJobRepository,
    PromptService,
    ContextService,
    {
      provide: AI_PROVIDER_TOKEN,
      useClass: GeminiProvider,
    },
  ],
  exports: [AiService],
})
export class AiModule {}
