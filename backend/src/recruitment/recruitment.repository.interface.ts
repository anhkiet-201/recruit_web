import { RecruitmentPost, JobPosition } from './model';
import { CreatePostDto } from './recruitment.dto';

export interface IRecruitmentRepository {
  createPost(post: CreatePostDto): Promise<RecruitmentPost>;
  findAllPosts(limit: number, offset: number): Promise<RecruitmentPost[]>;
  findPostById(id: string): Promise<RecruitmentPost | null>;
  updatePost(
    id: string,
    post: Partial<RecruitmentPost>,
  ): Promise<RecruitmentPost>;
  deletePost(id: string): Promise<void>;

  // Job Positions & AI
  addJobPosition(
    postId: string,
    position: Omit<JobPosition, 'id' | 'postId'>,
  ): Promise<JobPosition>;
  updateJobPositionEmbedding(
    positionId: string,
    embedding: number[],
  ): Promise<void>;
  findSimilarJobs(
    embedding: number[],
    threshold: number,
    limit: number,
  ): Promise<JobPosition[]>;
}
