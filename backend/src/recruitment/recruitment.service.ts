import { Injectable, NotFoundException } from '@nestjs/common';
import { RecruitmentRepository } from './recruitment.repository';
import { RecruitmentPost, JobPosition } from './model';
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

    // Now update embeddings for each position
    for (const pos of newPost.positions) {
      if (pos.id) {
        const description = [
          `Company: ${newPost.companyName}`,
          `Address: ${newPost.address}`,
          `Title: ${pos.title}`,
          `Status: ${pos.status}`,
          `Requirements: ${(pos.requirements || []).join(', ')}`,
          `Benefits: ${(pos.benefits || []).join(', ')}`,
          `Other Requirements: ${(pos.otherRequirements || []).join(', ')}`,
          `Environment: ${(pos.environment || []).join(', ')}`,
          `Notes: ${(pos.notes || []).join(', ')}`,
          `Shifts: ${(pos.shifts || [])
            .map((s) => `${s.name} (${s.startTime}-${s.endTime})`)
            .join(', ')}`,
          `Managers: ${(pos.managers || [])
            .map((m) => `${m.name} (${m.phoneNumber})`)
            .join(', ')}`,
          `Salary: ${(pos.salaryPackages || [])
            .map((s) => JSON.stringify(s))
            .join('; ')}`,
        ].join('\n');

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
    return this.repository.updatePost(id, updateData);
  }

  async remove(id: string): Promise<void> {
    return this.repository.deletePost(id);
  }

  async searchSemantic(
    query: string,
    limit: number = 10,
  ): Promise<JobPosition[]> {
    const embedding = await this.aiService.generateEmbedding(query);
    // threshold 0.2 (similarity > 0.8? No, cosine distance < 0.2 means similarity > 0.8)
    // Actually repo uses: WHERE embedding <-> vector < (1 - threshold)
    // If threshold is SIMILARITY (0 to 1), then distance < 1-threshold.
    // If user inputs 0.7 similarity, distance < 0.3.
    return this.repository.findSimilarJobs(embedding, 0.6, limit);
  }
}
