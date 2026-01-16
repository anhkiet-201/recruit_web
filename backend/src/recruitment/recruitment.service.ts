import { Injectable, NotFoundException } from '@nestjs/common';
import { RecruitmentRepository } from './recruitment.repository';
import { RecruitmentPost, SalaryType, RecruitmentStatus } from './model';
import { CreatePostDto } from './recruitment.dto';
import { AiService } from '../ai/ai.service'; // Assuming we can use AiService for embedding

@Injectable()
export class RecruitmentService {
  constructor(
    private readonly repository: RecruitmentRepository,
    private readonly aiService: AiService,
  ) {}

  async createPost(post: CreatePostDto): Promise<RecruitmentPost> {
    // Create the post without embeddings first
    const newPost = await this.repository.createPost(post);

    // Now update embeddings for each position với description đã tối ưu
    for (const pos of newPost.positions) {
      if (pos.id) {
        // Tối ưu description: thông tin quan trọng lên đầu, giảm noise
        const description = [
          `Vị trí: ${pos.title}`,
          `Công ty: ${newPost.companyName}`,
          `Địa chỉ: ${newPost.address}`,
          `Loại hình: ${pos.employmentType}`,
          pos.status === RecruitmentStatus.Recruiting
            ? 'Đang tuyển dụng'
            : 'Đã đóng',
          '',
          // Requirements (quan trọng nhất)
          ...(pos.requirements && pos.requirements.length > 0
            ? ['Yêu cầu:', ...pos.requirements.map((r) => `- ${r}`)]
            : []),
          '',
          // Benefits
          ...(pos.benefits && pos.benefits.length > 0
            ? ['Phúc lợi:', ...pos.benefits.map((b) => `- ${b}`)]
            : []),
          '',
          // Environment
          ...(pos.environment && pos.environment.length > 0
            ? ['Môi trường làm việc:', ...pos.environment.map((e) => `- ${e}`)]
            : []),
          '',
          // Salary info (simplified, không include chi tiết phone number)
          ...(pos.salaryPackages && pos.salaryPackages.length > 0
            ? [
                'Lương:',
                ...pos.salaryPackages
                  .map((sal) => {
                    if (sal.type === SalaryType.Monthly) {
                      return `- Tháng: ${sal.amount || 'Thỏa thuận'}`;
                    }
                    if (sal.type === SalaryType.Shift) {
                      return `- Theo ca ${sal.isNightShift ? '(ca đêm)' : ''}`;
                    }
                    if (sal.type === SalaryType.Overtime) {
                      return `- Có tăng ca`;
                    }
                    return '';
                  })
                  .filter(Boolean),
              ]
            : []),
          '',
          // Other requirements
          ...(pos.otherRequirements && pos.otherRequirements.length > 0
            ? ['Yêu cầu khác:', ...pos.otherRequirements.map((r) => `- ${r}`)]
            : []),
        ]
          .filter((line) => line !== undefined && line !== null)
          .join('\n');

        const embedding = await this.aiService.generateEmbedding(description);
        await this.repository.updateJobPositionEmbedding(pos.id, embedding);
      }
    }

    return newPost;
  }

  async findAll(limit: number, offset: number): Promise<RecruitmentPost[]> {
    return this.repository.findAllPosts(limit, offset);
  }

  async findOne(id: string): Promise<RecruitmentPost> {
    const post = await this.repository.findPostById(id);
    if (!post)
      throw new NotFoundException(`Recruitment Post with ID ${id} not found`);
    return post;
  }

  async update(
    id: string,
    updateData: Partial<RecruitmentPost>,
  ): Promise<RecruitmentPost> {
    // Update post data first
    const updatedPost = await this.repository.updatePost(id, updateData);

    // Re-generate embeddings nếu positions được update
    if (updateData.positions && updateData.positions.length > 0) {
      for (const pos of updatedPost.positions) {
        if (pos.id) {
          // Tạo description text giống như trong createPost
          const description = [
            `Vị trí: ${pos.title}`,
            `Công ty: ${updatedPost.companyName}`,
            `Địa chỉ: ${updatedPost.address}`,
            `Loại hình: ${pos.employmentType}`,
            pos.status === RecruitmentStatus.Recruiting
              ? 'Đang tuyển dụng'
              : 'Đã đóng',
            '',
            // Requirements (quan trọng nhất)
            ...(pos.requirements && pos.requirements.length > 0
              ? ['Yêu cầu:', ...pos.requirements.map((r) => `- ${r}`)]
              : []),
            '',
            // Benefits
            ...(pos.benefits && pos.benefits.length > 0
              ? ['Phúc lợi:', ...pos.benefits.map((b) => `- ${b}`)]
              : []),
            '',
            // Environment
            ...(pos.environment && pos.environment.length > 0
              ? [
                  'Môi trường làm việc:',
                  ...pos.environment.map((e) => `- ${e}`),
                ]
              : []),
            '',
            // Salary info
            ...(pos.salaryPackages && pos.salaryPackages.length > 0
              ? [
                  'Lương:',
                  ...pos.salaryPackages
                    .map((sal) => {
                      if (sal.type === SalaryType.Monthly) {
                        return `- Tháng: ${sal.amount || 'Thỏa thuận'}`;
                      }
                      if (sal.type === SalaryType.Shift) {
                        return `- Theo ca ${sal.isNightShift ? '(ca đêm)' : ''}`;
                      }
                      if (sal.type === SalaryType.Overtime) {
                        return `- Có tăng ca`;
                      }
                      return '';
                    })
                    .filter(Boolean),
                ]
              : []),
            '',
            // Other requirements
            ...(pos.otherRequirements && pos.otherRequirements.length > 0
              ? ['Yêu cầu khác:', ...pos.otherRequirements.map((r) => `- ${r}`)]
              : []),
          ]
            .filter((line) => line !== undefined && line !== null)
            .join('\n');

          const embedding = await this.aiService.generateEmbedding(description);
          await this.repository.updateJobPositionEmbedding(pos.id, embedding);
        }
      }
    }

    return updatedPost;
  }

  async remove(id: string): Promise<void> {
    return this.repository.deletePost(id);
  }

  async searchSemantic(
    query: string,
    page: number = 1,
    limit: number = 10,
    threshold: number = 0.5, // Điều chỉnh từ 0.6 xuống 0.5
  ): Promise<{
    items: RecruitmentPost[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const embedding = await this.aiService.generateEmbedding(query);
    const offset = (page - 1) * limit;

    return this.repository.findSimilarJobs(
      embedding,
      query,
      threshold,
      limit,
      offset,
    );
  }
}
