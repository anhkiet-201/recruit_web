import { IsNotEmpty, IsUUID, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  @IsUUID()
  jobId: string;

  @ApiProperty({ example: 'https://example.com/cv.pdf' })
  @IsNotEmpty()
  @IsUrl()
  cvUrl: string;
}
