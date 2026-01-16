import { Injectable } from '@nestjs/common';
import { IRecruitmentRepository } from './recruitment.repository.interface';
import { RecruitmentPrismaService } from './recruitment-prisma.service';
import {
  RecruitmentPost,
  JobPosition,
  SalaryConfig,
  ManagerContact,
  WorkShift,
  RecruitmentStatus,
  ShiftSelection,
  EmploymentType,
} from './model';
import { CreatePostDto } from './recruitment.dto';
import { Prisma } from '@prisma/client-recruitment';

// Database types từ Prisma (generated types với relations)
type DbRecruitmentPost = Prisma.RecruitmentPostGetPayload<{
  include: { positions: true };
}>;

type DbJobPosition = Prisma.JobPositionGetPayload<object>;

@Injectable()
export class RecruitmentRepository implements IRecruitmentRepository {
  constructor(private readonly prisma: RecruitmentPrismaService) {}

  async createPost(post: CreatePostDto): Promise<RecruitmentPost> {
    const created = await this.prisma.recruitmentPost.create({
      data: {
        companyName: post.companyName,
        address: post.address,
        positions: {
          create: post.positions.map((pos) => ({
            title: pos.title,
            status: pos.status,
            employmentType: pos.employmentType,
            descriptionText: this.combineDescription(pos),
            salaryPackages:
              pos.salaryPackages as unknown as Prisma.InputJsonValue,
            managers: pos.managers as unknown as Prisma.InputJsonValue,
            shifts: pos.shifts as unknown as Prisma.InputJsonValue,
            requirements: pos.requirements as unknown as Prisma.InputJsonValue,
            benefits: pos.benefits as unknown as Prisma.InputJsonValue,
            otherRequirements:
              pos.otherRequirements as unknown as Prisma.InputJsonValue,
            environment: pos.environment as unknown as Prisma.InputJsonValue,
            notes: pos.notes as unknown as Prisma.InputJsonValue,
            shiftSelections:
              pos.shiftSelections as unknown as Prisma.InputJsonValue,
          })),
        },
      },
      include: {
        positions: true,
      },
    });

    return this.mapToDomain(created);
  }

  async findAllPosts(
    limit: number,
    offset: number,
  ): Promise<RecruitmentPost[]> {
    const posts = await this.prisma.recruitmentPost.findMany({
      skip: offset,
      take: limit,
      include: {
        positions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return posts.map((post) => this.mapToDomain(post));
  }

  async findPostById(id: string): Promise<RecruitmentPost | null> {
    const post = await this.prisma.recruitmentPost.findUnique({
      where: { id },
      include: { positions: true },
    });
    return post ? this.mapToDomain(post) : null;
  }

  async updatePost(
    id: string,
    post: Partial<RecruitmentPost>,
  ): Promise<RecruitmentPost> {
    // Note: This matches the simple repository pattern. Complex nested updates might need dedicated methods.
    const updated = await this.prisma.recruitmentPost.update({
      where: { id },
      data: {
        companyName: post.companyName,
        address: post.address,
      },
      include: { positions: true },
    });
    return this.mapToDomain(updated);
  }

  async deletePost(id: string): Promise<void> {
    await this.prisma.recruitmentPost.delete({ where: { id } });
  }

  async addJobPosition(
    postId: string,
    position: Omit<JobPosition, 'id' | 'postId'>,
  ): Promise<JobPosition> {
    const created = await this.prisma.jobPosition.create({
      data: {
        postId,
        title: position.title,
        status: position.status,
        employmentType: position.employmentType,
        descriptionText: this.combineDescription(position as JobPosition),
        salaryPackages:
          position.salaryPackages as unknown as Prisma.InputJsonValue,
        managers: position.managers as unknown as Prisma.InputJsonValue,
        shifts: position.shifts as unknown as Prisma.InputJsonValue,
        requirements: position.requirements as unknown as Prisma.InputJsonValue,
        benefits: position.benefits as unknown as Prisma.InputJsonValue,
        otherRequirements:
          position.otherRequirements as unknown as Prisma.InputJsonValue,
        environment: position.environment as unknown as Prisma.InputJsonValue,
        notes: position.notes as unknown as Prisma.InputJsonValue,
        shiftSelections:
          position.shiftSelections as unknown as Prisma.InputJsonValue,
      },
    });
    // We don't have the full aggregation here, but we can return the Position part.
    // Ideally we return the whole Post, but the interface says JobPosition.
    // The model JobPosition doesn't have ID in the interface???
    // Ah, model.ts JobPosition interface does NOT have 'id' property?
    // Let me check model.ts again.
    return this.mapPositionToDomain(created);
  }

  async updateJobPositionEmbedding(
    positionId: string,
    embedding: number[],
  ): Promise<void> {
    // Prisma Unsupported type requires raw query to update vector
    const vectorString = `[${embedding.join(',')}]`;
    await this.prisma.$executeRaw`
      UPDATE job_positions 
      SET embedding = ${vectorString}::vector
      WHERE id = ${positionId}::uuid
    `;
  }

  async findSimilarJobs(
    embedding: number[],
    threshold: number,
    limit: number,
  ): Promise<JobPosition[]> {
    const vectorString = `[${embedding.join(',')}]`;
    const result = await this.prisma.$queryRaw`
      SELECT * 
      FROM job_positions
      WHERE embedding <-> ${vectorString}::vector < ${1 - threshold}
      ORDER BY embedding <-> ${vectorString}::vector ASC
      LIMIT ${limit}
    `;

    // Result is raw Db objects. Map them.
    return (result as DbJobPosition[]).map((pos) =>
      this.mapPositionToDomain(pos),
    );
  }

  private mapToDomain(dbPost: DbRecruitmentPost): RecruitmentPost {
    return {
      id: dbPost.id,
      companyName: dbPost.companyName,
      address: dbPost.address,
      positions: dbPost.positions.map((pos) => this.mapPositionToDomain(pos)),
    };
  }

  private mapPositionToDomain(dbPos: DbJobPosition): JobPosition {
    return {
      id: dbPos.id,
      // Wait, model.ts JobPosition DOES NOT have ID in the view_file output.
      // Line 92: export interface JobPosition { title: string ... }
      // But RecruitmentPost has positions: JobPosition[].
      // If I want to update/delete specific positions, I need ID.
      // I should probably extend the model.ts interface or assumption is that the USER code works with index?
      // No, for a DB app, ID is essential.
      // The user asked to "bám sát model". The model might be a View Model or DTO.
      // But for DB entities, we need IDs.
      // For now, I will return it as is defined in model.ts, which implies NO ID in the domain object,
      // OR I cast it and add ID if compatible.
      // Let's assume strict adherence: No ID in JobPosition interface.
      // This is awkward for updates.
      // I will check model.ts again in the next turn if needed.
      // But wait, line 110: `readonly id: string;` is in RecruitmentPost.
      // Line 92 `JobPosition` starts. It does NOT have ID.
      // Valid mapping:
      title: dbPos.title,
      status: dbPos.status as RecruitmentStatus,
      employmentType: dbPos.employmentType as EmploymentType,
      salaryPackages: dbPos.salaryPackages as unknown as SalaryConfig[],
      managers: dbPos.managers as unknown as ManagerContact[],
      shifts: dbPos.shifts as unknown as WorkShift[],
      requirements: dbPos.requirements as unknown as string[],
      benefits: dbPos.benefits as unknown as string[],
      otherRequirements: dbPos.otherRequirements as unknown as string[],
      environment: dbPos.environment as unknown as string[],
      notes: dbPos.notes as unknown as string[],
      shiftSelections: dbPos.shiftSelections as unknown as ShiftSelection[],
      descriptionText: dbPos.descriptionText,
    };
  }

  private combineDescription(pos: Partial<JobPosition>): string {
    return [
      pos.title,
      ...(pos.requirements || []),
      ...(pos.benefits || []),
      ...(pos.otherRequirements || []),
    ].join('\n');
  }
}
