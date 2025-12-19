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

    async register(data: any) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        try {
            const user = await this.prisma.user.create({
                data: {
                    id: data.uid || undefined, // Allow providing UID if syncing, else autogenerate
                    email: data.email,
                    password: hashedPassword,
                    name: data.name,
                    role: 'candidate',
                },
            });
            const { password, ...result } = user;
            return result;
        } catch (error: any) {
            if (error.code === 'P2002') {
                // User exists (email collision), return the existing user
                const existingUser = await this.prisma.user.findUnique({
                    where: { email: data.email }
                });
                if (existingUser) {
                    const { password, ...result } = existingUser;
                    return result;
                }
            }
            throw error;
        }
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
