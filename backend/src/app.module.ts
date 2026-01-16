import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JobsModule } from './jobs/jobs.module';
import { ApplicationsModule } from './applications/applications.module';
import { TagsModule } from './tags/tags.module';
import { UploadModule } from './upload/upload.module';
import { AiModule } from './ai/ai.module';
import { GoogleIndexingModule } from './google-indexing/google-indexing.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `../.env${process.env.NODE_ENV ?? ''}`,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    JobsModule,
    ApplicationsModule,
    TagsModule,
    UploadModule,
    AiModule,
    GoogleIndexingModule,
    RecruitmentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
