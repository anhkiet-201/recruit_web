import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface JobWithAuthor {
  title: string;
  author?: {
    role: string;
  } | null;
}

interface ApplicationWithUser {
  cvUrl: string;
  user?: {
    name?: string | null;
    email: string;
    phone?: string | null;
  } | null;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly chatId: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '';
    this.chatId = this.configService.get<string>('TELEGRAM_CHAT_ID') || '';

    this.logger.log(
      `Initializing TelegramService. Token present: ${!!this.botToken}, ChatID present: ${!!this.chatId}`,
    );

    if (!this.botToken || !this.chatId) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured. Notifications will be disabled.',
      );
    }
  }

  async sendMessage(message: string): Promise<void> {
    if (!this.botToken || !this.chatId) {
      return;
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      await firstValueFrom(
        this.httpService.post(url, {
          chat_id: this.chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      );
      this.logger.log('Telegram notification sent successfully.');
    } catch (error) {
      this.logger.error(
        'Failed to send Telegram notification',
        error instanceof Error ? error.message : error,
      );
    }
  }

  async sendApplicationNotification(
    job: JobWithAuthor,
    application: ApplicationWithUser,
  ): Promise<void> {
    if (job.author?.role !== 'admin') {
      return;
    }

    this.logger.log(
      '[TelegramService] Author is admin. Sending Telegram notification...',
    );

    const message =
      `🚨 <b>ỨNG VIÊN MỚI ỨNG TUYỂN</b>\n\n` +
      `💼 <b>Công việc:</b> ${job.title}\n` +
      `👤 <b>Ứng viên:</b> ${application.user?.name || 'Chưa cập nhật'} (${application.user?.email})\n` +
      `📞 <b>SĐT:</b> ${application.user?.phone || 'Chưa cập nhật'}\n` +
      `📄 <b>CV:</b> <a href="${application.cvUrl}">Xem chi tiết</a>\n` +
      `🕒 <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}`;

    await this.sendMessage(message);
  }

  async sendEmployerRequestNotification(user: {
    name?: string | null;
    email: string;
    phone?: string | null;
  }): Promise<void> {
    this.logger.log(
      '[TelegramService] Sending Employer Request Telegram notification...',
    );

    const message =
      `🚀 <b>YÊU CẦU NÂNG CẤP NHÀ TUYỂN DỤNG</b>\n\n` +
      `👤 <b>Người yêu cầu:</b> ${user.name || 'Chưa cập nhật'}\n` +
      `📧 <b>Email:</b> ${user.email}\n` +
      `📞 <b>SĐT:</b> ${user.phone || 'Chưa cập nhật'}\n` +
      `🕒 <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}`;

    await this.sendMessage(message);
  }

  async sendNewJobNotification(
    job: { title: string },
    author: { name?: string | null; email: string; phone?: string | null },
  ): Promise<void> {
    this.logger.log(
      '[TelegramService] Sending New Job (Non-Admin) Telegram notification...',
    );

    const message =
      `📢 <b>TIN TUYỂN DỤNG MỚI (Cần duyệt)</b>\n\n` +
      `🏢 <b>Nhà tuyển dụng:</b> ${author.name || 'Chưa cập nhật'}\n` +
      `💼 <b>Tiêu đề:</b> ${job.title}\n` +
      `📧 <b>Email:</b> ${author.email}\n` +
      `📞 <b>SĐT:</b> ${author.phone || 'Chưa cập nhật'}\n` +
      `🕒 <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}`;

    await this.sendMessage(message);
  }
}
