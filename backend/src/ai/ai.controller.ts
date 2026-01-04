import { Controller, Post, Body, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { ChatRequestDto } from './dto/chat-request.dto';
import { AiService } from './ai.service';
import { ApiTags, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';

import { OptimizeJobDto } from './dto/optimize-job.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('chat')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        history: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              parts: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async chat(
    @Request() req: ExpressRequest,

    @Body() body: ChatRequestDto,
  ) {
    try {
      let userId: string | undefined;
      const user = req.user as { userId: string } | undefined;
      if (user?.userId) {
        userId = user.userId;
      }

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = this.jwtService.verify<{
            sub?: string;
            id?: string;
          }>(token);
          userId = decoded.sub || decoded.id; // Support both conventions
        } catch (e) {
          console.error('Invalid token:', e);
        }
      }
      const guestId = req.headers['x-guest-id'] as string | undefined;
      const response = await this.aiService.chat(
        body.message,
        body.history || [],

        userId,
        guestId,
      );
      return { response };
    } catch (error) {
      console.error('AI Chat Error:', error);
      throw error;
    }
  }
  @Post('optimize-job')
  @ApiBearerAuth()
  @ApiBody({
    type: OptimizeJobDto,
    description: 'Optimize job content',
  })
  async optimizeJob(@Body() body: OptimizeJobDto) {
    try {
      const result = await this.aiService.optimizeJobContent(body.content);
      return result;
    } catch (error) {
      console.error('AI Job Optimize Error:', error);
      throw error;
    }
  }
}
