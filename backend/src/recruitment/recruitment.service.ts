import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { RecruitmentRepository } from './recruitment.repository';
import { RecruitmentPost, SalaryType, RecruitmentStatus } from './model';
import { CreatePostDto } from './recruitment.dto';
import { AiService } from '../ai/ai.service'; // Assuming we can use AiService for embedding

@Injectable()
export class RecruitmentService {
  private readonly logger = new Logger(RecruitmentService.name);

  constructor(
    private readonly repository: RecruitmentRepository,
    private readonly aiService: AiService,
  ) {}

  async createPost(post: CreatePostDto): Promise<RecruitmentPost> {
    this.logger.log(
      `Creating recruitment post for company: ${post.companyName}`,
    );

    // Create the post without embeddings first
    const newPost = await this.repository.createPost(post);
    this.logger.log(
      `Created post ${newPost.id} with ${newPost.positions.length} positions`,
    );

    // Now update embeddings for each position với description đã tối ưu
    for (const pos of newPost.positions) {
      if (pos.id) {
        this.logger.debug(
          `Generating embedding for position: ${pos.title} (${pos.id})`,
        );

        // Use descriptionText from repository if available (which includes rich details like Managers, Shifts)
        // Combine with Company Info for full context
        const description = [
          `Công ty: ${newPost.companyName}`,
          `Địa chỉ: ${newPost.address}`,
          '',
          pos.descriptionText || '',
        ].join('\n');

        const embedding = await this.aiService.generateEmbedding(description);
        this.logger.debug(
          `Generated ${embedding.length}-dim embedding for position ${pos.id}`,
        );

        await this.repository.updateJobPositionEmbedding(pos.id, embedding);
        this.logger.debug(`Saved embedding for position ${pos.id}`);
      }
    }

    this.logger.log(`Successfully created post ${newPost.id} with embeddings`);
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
    this.logger.log(`Updating recruitment post: ${id}`);

    // Update post data first
    const updatedPost = await this.repository.updatePost(id, updateData);

    // Re-generate embeddings nếu positions được update
    if (updateData.positions && updateData.positions.length > 0) {
      this.logger.log(
        `Re-generating embeddings for ${updatedPost.positions.length} positions`,
      );

      for (const pos of updatedPost.positions) {
        if (pos.id) {
          this.logger.debug(
            `Re-generating embedding for position: ${pos.title} (${pos.id})`,
          );

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
          this.logger.debug(`Updated embedding for position ${pos.id}`);
        }
      }

      this.logger.log(
        `Successfully re-generated all embeddings for post ${id}`,
      );
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
    threshold: number = 0.6, // Tăng lên 0.6 để lọc kết quả chính xác hơn
  ): Promise<{
    items: RecruitmentPost[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    this.logger.log(
      `Semantic search: "${query}" (page=${page}, limit=${limit}, threshold=${threshold})`,
    );

    const startTime = Date.now();
    const embedding = await this.aiService.generateEmbedding(query);
    this.logger.debug(
      `Generated query embedding in ${Date.now() - startTime}ms`,
    );

    const offset = (page - 1) * limit;

    // const searchStart = Date.now();
    const result = await this.repository.findSimilarJobs(
      embedding,
      query,
      threshold,
      limit,
      offset,
    );

    const totalTime = Date.now() - startTime;
    this.logger.log(
      `Search completed: ${result.items.length} results (total: ${result.total}, page ${result.page}/${result.lastPage}) in ${totalTime}ms`,
    );

    return result;
  }
}
