import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsUrl,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty({ example: 'Senior React Developer' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Job description content...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'Hà Nội' })
  @IsString()
  @IsNotEmpty({ message: 'Location is required' })
  location: string;

  @ApiProperty({ example: 1000, required: false })
  @IsInt()
  @IsOptional()
  salaryMin?: number;

  @ApiProperty({ example: 2000, required: false })
  @IsInt()
  @IsOptional()
  salaryMax?: number;

  @ApiProperty({ example: 2, required: false })
  @IsInt()
  @IsOptional()
  experienceYears?: number;

  @ApiProperty({ example: '2025-12-31', required: false })
  @IsDateString()
  @IsOptional()
  deadline?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: 'professional', required: false })
  @IsString()
  @IsOptional()
  jobType?: string;

  @ApiProperty({
    example: 'ACTIVE',
    required: false,
    enum: ['DRAFT', 'ACTIVE', 'EXPIRED', 'REVIEWING', 'ACCEPTED', 'REJECTED'],
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: ['uuid1', 'uuid2'],
    required: false,
  })
  @IsOptional()
  tags?: string[];
}
