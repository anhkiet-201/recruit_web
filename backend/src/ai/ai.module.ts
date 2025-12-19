import { Module, Global } from '@nestjs/common';
import { AiService } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';
import { AI_PROVIDER_TOKEN } from './interfaces/ai-provider.interface';
import { AiController } from './ai.controller';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key',
    }),
  ],
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: AI_PROVIDER_TOKEN,
      useClass: GeminiProvider, // Dễ dàng thay đổi sang Provider khác ở đây
    },
  ],
  exports: [AiService, AI_PROVIDER_TOKEN],
})
export class AiModule {}
