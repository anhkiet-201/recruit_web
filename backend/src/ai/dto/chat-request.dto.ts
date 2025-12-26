import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ChatHistoryItemDto } from './ai-service.dto';

export class ChatRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({ type: [Object] })
  @IsOptional()
  @IsArray()
  history?: ChatHistoryItemDto[];
}
