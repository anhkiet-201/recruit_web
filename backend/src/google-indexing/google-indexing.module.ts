import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleIndexingService } from './google-indexing.service';

@Module({
  imports: [ConfigModule],
  providers: [GoogleIndexingService],
  exports: [GoogleIndexingService],
})
export class GoogleIndexingModule {}
