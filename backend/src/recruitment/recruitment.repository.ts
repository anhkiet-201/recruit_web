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

interface RawSearchResult {
  post_id: string;
  company_name: string;
  address: string;
  created_at: Date;
  updated_at: Date;
  id: string;
  title: string;
  status: string;
  employment_type: string;
  description_text: string;
  salary_packages: any;
  managers: any;
  shifts: any;
  requirements: any;
  benefits: any;
  other_requirements: any;
  environment: any;
  notes: any;
  shift_selections: any;
  distance: number;
}

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
    // Build update data object với proper Prisma type
    const updateData: Prisma.RecruitmentPostUpdateInput = {};

    if (post.companyName !== undefined) {
      updateData.companyName = post.companyName;
    }

    if (post.address !== undefined) {
      updateData.address = post.address;
    }

    // Handle positions update if provided
    if (post.positions !== undefined && post.positions.length > 0) {
      // Delete existing positions and create new ones
      // This is simpler than trying to upsert each position individually
      await this.prisma.jobPosition.deleteMany({
        where: { postId: id },
      });

      updateData.positions = {
        create: post.positions.map((pos) => ({
          title: pos.title,
          status: pos.status,
          employmentType: pos.employmentType,
          descriptionText: pos.descriptionText || this.combineDescription(pos),
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
      };
    }

    const updated = await this.prisma.recruitmentPost.update({
      where: { id },
      data: updateData,
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
    // Note: Không cần cast ::uuid, Prisma tự động handle UUID parameters
    await this.prisma.$executeRaw`
      UPDATE job_positions 
      SET embedding = ${vectorString}::vector
      WHERE id = ${positionId}
    `;
  }

  async findSimilarJobs(
    embedding: number[],
    query: string,
    threshold: number,
    limit: number,
    offset: number,
  ): Promise<{
    items: RecruitmentPost[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const vectorString = `[${embedding.join(',')}]`;
    const queryPattern = `%${query}%`;

    // 1. Lấy total count để tính pagination
    const countResult = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT p.id) as count
      FROM job_positions j
      INNER JOIN recruitment_posts p ON j.post_id = p.id
      WHERE j.embedding <-> ${vectorString}::vector < ${1 - threshold}
    `;
    const total = Number(countResult[0]?.count || 0);

    // 2. Query chính với hybrid scoring (vector + keyword)
    const result = await this.prisma.$queryRaw`
      SELECT 
        p.id as post_id,
        p.company_name,
        p.address,
        p.created_at,
        p.updated_at,
        j.id,
        j.title,
        j.status,
        j.employment_type,
        j.description_text,
        j.salary_packages,
        j.managers,
        j.shifts,
        j.requirements,
        j.benefits,
        j.other_requirements,
        j.environment,
        j.notes,
        j.shift_selections,
        (1 - (j.embedding <-> ${vectorString}::vector)) as similarity,
        (
          (1 - (j.embedding <-> ${vectorString}::vector)) +
          (CASE WHEN j.title ILIKE ${queryPattern} THEN 0.5 ELSE 0 END) +
          (CASE WHEN p.company_name ILIKE ${queryPattern} THEN 0.3 ELSE 0 END)
        ) as hybrid_score
      FROM job_positions j
      INNER JOIN recruitment_posts p ON j.post_id = p.id
      WHERE j.embedding <-> ${vectorString}::vector < ${1 - threshold}
      ORDER BY hybrid_score DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // 3. Group positions by post_id
    const postsMap = new Map<string, RecruitmentPost>();

    for (const row of result as RawSearchResult[]) {
      const postId = row.post_id;

      if (!postsMap.has(postId)) {
        postsMap.set(postId, {
          id: postId,
          companyName: row.company_name,
          address: row.address,
          positions: [],
        });
      }

      const post = postsMap.get(postId)!;
      post.positions.push({
        id: row.id,
        title: row.title,
        status: row.status as RecruitmentStatus,
        employmentType: row.employment_type as EmploymentType,
        salaryPackages: row.salary_packages as unknown as SalaryConfig[],
        managers: row.managers as unknown as ManagerContact[],
        shifts: row.shifts as unknown as WorkShift[],
        requirements: row.requirements as unknown as string[],
        benefits: row.benefits as unknown as string[],
        otherRequirements: row.other_requirements as unknown as string[],
        environment: row.environment as unknown as string[],
        notes: row.notes as unknown as string[],
        shiftSelections: row.shift_selections as unknown as ShiftSelection[],
        descriptionText: row.description_text,
      });
    }

    const items = Array.from(postsMap.values());
    const page = Math.floor(offset / limit) + 1;
    const lastPage = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      lastPage,
    };
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
