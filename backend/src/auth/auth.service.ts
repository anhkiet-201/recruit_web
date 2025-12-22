import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    };
  }

  async register(email: string, pass: string, name: string, guestId?: string) {
    const hashedPassword = await bcrypt.hash(pass, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'candidate',
      },
    });

    // Migrate Guest search history to User if guestId provided
    if (guestId) {
      try {
        await this.prisma.searchHistory.updateMany({
          where: { guestId },
          data: {
            userId: user.id,
            guestId: null // Clear guest link
          }
        });
        // Delete the guest record as it's no longer needed
        await this.prisma.guest.delete({ where: { id: guestId } }).catch(() => { });
      } catch (e) {
        console.warn('Migration of guest history failed', e);
      }
    }

    return user;
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // We don't want to reveal if a user exists or not for security
      return { message: 'If an account with that email exists, we have sent a reset link.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    await this.mailService.sendPasswordResetEmail(email, token);

    return { message: 'If an account with that email exists, we have sent a reset link.' };
  }

  async resetPassword(token: string, newPass: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);
    await this.prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    // Delete the token after successful use
    await this.prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    return { message: 'Password has been successfully reset.' };
  }
}
