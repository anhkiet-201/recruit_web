import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { TelegramService } from '../notifications/telegram.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
  ) {}

  async submitApplication(
    userId: string,
    createApplicationDto: CreateApplicationDto,
  ) {
    // 1. Check if user already applied for this job
    const existing = await this.prisma.application.findFirst({
      where: {
        jobId: createApplicationDto.jobId,
        userId: userId,
      },
    });

    if (existing) {
      throw new BadRequestException('Bạn đã ứng tuyển công việc này rồi.');
    }

    // 2. Fetch Job Author to check role
    const job = await this.prisma.job.findUnique({
      where: { id: createApplicationDto.jobId },
      include: { author: { select: { role: true, name: true } } },
    });

    if (!job) {
      throw new BadRequestException('Công việc không tồn tại.');
    }

    // 3. Create new application
    try {
      const application = await this.prisma.application.create({
        data: {
          jobId: createApplicationDto.jobId,
          userId: userId,
          cvUrl: createApplicationDto.cvUrl,
          status: 'pending',
        },
        include: {
          user: { select: { name: true, email: true, phone: true } },
        },
      });

      // 4. Send Telegram Notification
      console.log(
        `[ApplicationsService] Checking for notification. Job Author Role: ${job.author?.role}`,
      );
      this.telegramService
        .sendApplicationNotification(job, application)
        .catch((err) => {
          console.error(
            'Failed to call telegramService.sendApplicationNotification:',
            err,
          );
        });

      return application;
    } catch (error) {
      console.error('Prisma Error:', error);
      throw new BadRequestException(
        'Không thể gửi hồ sơ. Vui lòng kiểm tra lại thông tin.',
      );
    }
  }

  async getMyApplications(userId: string) {
    return this.prisma.application.findMany({
      where: { userId },
      include: {
        job: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEmployerApplications(employerId: string) {
    return this.prisma.application.findMany({
      where: {
        job: {
          authorId: employerId,
        },
      },
      include: {
        job: { select: { title: true, authorId: true } },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.application.findMany({
      include: {
        job: { select: { title: true } },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.application.update({
      where: { id },
      data: { status },
    });
  }
}
