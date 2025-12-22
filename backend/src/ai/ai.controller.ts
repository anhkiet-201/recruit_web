import { Controller, Post, Body, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly jwtService: JwtService
  ) { }

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
              parts: { type: 'string' }
            }
          }
        }
      }
    }
  })
  async chat(@Request() req, @Body() body: { message: string, history: any[] }) {
    try {
      // Manual extraction of userId if present, allowing guestId as fallback
      let userId = req.user?.userId;
      const authHeader = req.headers.authorization;

      // Manual Token Decoding (Soft Auth)
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = this.jwtService.verify(token);
          userId = decoded.sub || decoded.id; // Support both conventions
        } catch (e) {
          // Token invalid/expired - treat as guest
        }
      }

      const guestId = req.headers['x-guest-id'] as string;
      const response = await this.aiService.chat(body.message, body.history || [], userId, guestId);
      return { response };
    } catch (error) {
      console.error("AI Chat Error:", error);
      throw error;
    }
  }
}