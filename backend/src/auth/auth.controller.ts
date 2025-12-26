import type { Request as ExpressRequest } from 'express';
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { RequestWithUser } from '../types/auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() req: LoginDto) {
    const user = await this.authService.validateUser(req.email, req.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('register')
  register(@Request() req: ExpressRequest, @Body() body: RegisterDto) {
    const guestId = req.headers['x-guest-id'] as string;
    return this.authService.register(
      body.email,
      body.password,
      body.name,
      guestId,
    );
  }

  @Post('google')
  async googleLogin(
    @Request() req: ExpressRequest,
    @Body() body: { token: string },
  ) {
    const guestId = req.headers['x-guest-id'] as string;
    return this.authService.loginWithGoogle(body.token, guestId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Request() req: RequestWithUser) {
    return this.authService.getUserById(req.user.id);
  }
}
