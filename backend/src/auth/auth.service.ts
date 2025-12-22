import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
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
        await this.prisma.guest.delete({ where: { id: guestId } }).catch(() => {});
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
}
