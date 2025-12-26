import { Controller, Post, Body, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';

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
    @Request() req: any,

    @Body() body: { message: string; history: any[] },
  ) {
    try {
      // Manual extraction of userId if present, allowing guestId as fallback
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment -- Reason: Accessing req.user manually
      let userId = req.user?.userId;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment -- Reason: Accessing req.headers manually
      const authHeader = req.headers.authorization;

      // Manual Token Decoding (Soft Auth)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call -- Reason: Checking string methods on any
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call -- Reason: Splitting string
        const token = authHeader.split(' ')[1] as string;
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Reason: JWT verify return type
          const decoded = this.jwtService.verify(token);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Reason: Accessing decoded token props
          userId = decoded.sub || decoded.id; // Support both conventions
        } catch {
          // Token invalid/expired - treat as guest
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Reason: Custom header
      const guestId = req.headers['x-guest-id'] as string;
      const response = await this.aiService.chat(
        body.message,
        body.history || [],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- Reason: userId might be extracted manually
        userId,
        guestId,
      );
      return { response };
    } catch (error) {
      console.error('AI Chat Error:', error);
      throw error;
    }
  }
}
