import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OptimizeJobDto {
  @ApiProperty({ description: 'Nội dung thô của tin tuyển dụng cần phân tích' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class OptimizedJobResponseDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  location: string;

  @ApiProperty({ required: false })
  salaryMin?: number;

  @ApiProperty({ required: false })
  salaryMax?: number;

  @ApiProperty({ required: false })
  jobType?: string;

  @ApiProperty({ required: false })
  experienceYears?: number;

  @ApiProperty({ required: false })
  deadline?: string;

  @ApiProperty({ type: [String], required: false })
  skills?: string[];
}

export class AiGeneratedPostResponseDto {
  @ApiProperty({
    description: 'Nội dung bài đăng định dạng đẹp (với emoji) để hiển thị',
  })
  displayContent: string;

  @ApiProperty({ description: 'Dữ liệu có cấu trúc để điền vào form tạo Job' })
  structuredData: OptimizedJobResponseDto;
}
