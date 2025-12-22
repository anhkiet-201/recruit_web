import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    constructor(
        private mailerService: MailerService,
        private configService: ConfigService,
    ) { }

    async sendPasswordResetEmail(email: string, token: string) {
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

        await this.mailerService.sendMail({
            to: email,
            subject: 'Reset Password - RecruitWeb',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #1e40af; text-align: center;">Reset Your Password</h2>
          <p>Hi there,</p>
          <p>We received a request to reset the password for your RecruitWeb account. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="font-size: 12px; color: #64748b; text-align: center;">Sent by RecruitWeb</p>
        </div>
      `,
        });
    }
}
