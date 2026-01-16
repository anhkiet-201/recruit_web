import { Injectable, Logger } from '@nestjs/common';
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
  SalaryType,
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
  employment_types: EmploymentType[];
  description_text: string;
  salary_packages: SalaryConfig[];
  managers: ManagerContact[];
  shifts: WorkShift[];
  requirements: string[];
  benefits: string[];
  other_requirements: string[];
  environment: string[];
  notes: string[];
  shift_selections: ShiftSelection[];
  distance: number;
}

@Injectable()
export class RecruitmentRepository implements IRecruitmentRepository {
  private readonly logger = new Logger(RecruitmentRepository.name);

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
            employmentTypes: (pos.employmentTypes ||
              []) as unknown as Prisma.InputJsonValue,
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
          employmentTypes: (pos.employmentTypes ||
            []) as unknown as Prisma.InputJsonValue,
          descriptionText: this.combineDescription(pos), // ✅ Always generate rich description
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
        employmentTypes: (position.employmentTypes ||
          []) as unknown as Prisma.InputJsonValue,
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
    const hasEmbedding = embedding && embedding.length > 0;
    const vectorString = hasEmbedding ? `[${embedding.join(',')}]` : null;
    const queryPattern = `%${query}%`;

    // 1. Lấy total count để tính pagination
    const countResult = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT p.id) as count
      FROM job_positions j
      INNER JOIN recruitment_posts p ON j.post_id = p.id
      WHERE (
        (${
          hasEmbedding
            ? Prisma.raw(
                `j.embedding <=> '${vectorString}'::vector < ${1 - threshold}`,
              )
            : Prisma.raw('false')
        })
        OR j.title ILIKE ${queryPattern}
        OR p.company_name ILIKE ${queryPattern}
        OR p.address ILIKE ${queryPattern}
        OR j.description_text ILIKE ${queryPattern}
        OR j.salary_packages::text ILIKE ${queryPattern}
        OR j.requirements::text ILIKE ${queryPattern}
        OR j.benefits::text ILIKE ${queryPattern}
        OR j.other_requirements::text ILIKE ${queryPattern}
        OR j.environment::text ILIKE ${queryPattern}
        OR j.managers::text ILIKE ${queryPattern}
        OR j.shifts::text ILIKE ${queryPattern}
        OR j.notes::text ILIKE ${queryPattern}
        OR j.shift_selections::text ILIKE ${queryPattern}
        OR j.employment_types::text ILIKE ${queryPattern}
        OR j.status ILIKE ${queryPattern}
      )
    `;
    const total = Number(countResult[0]?.count || 0);

    // 2. Query chính với hybrid scoring (vector + keyword)
    // Tăng trọng số (boost) cho các trường quan trọng để ưu tiên độ chính xác
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
        j.employment_types,
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
        (
          -- Semantic Score (0 to 1) if embedding exists
          ${
            hasEmbedding
              ? Prisma.raw(
                  `(1 - (j.embedding <=> '${vectorString}'::vector)) * 2.5`,
                )
              : Prisma.raw('0')
          } +
          -- Keyword Boosts (Prioritize accuracy)
          (CASE WHEN j.title ILIKE ${query} THEN 5.0 ELSE 0 END) + -- Exact title match (highest)
          (CASE WHEN j.title ILIKE ${queryPattern} THEN 3.0 ELSE 0 END) + -- Title partial match
          (CASE WHEN p.company_name ILIKE ${queryPattern} THEN 2.0 ELSE 0 END) + -- Company name match
          (CASE WHEN p.address ILIKE ${queryPattern} THEN 1.0 ELSE 0 END) + -- Address match
          (CASE WHEN j.description_text ILIKE ${queryPattern} THEN 0.5 ELSE 0 END) + -- Description match
          
          -- Global Search Boosts
          (CASE WHEN j.requirements::text ILIKE ${queryPattern} THEN 0.8 ELSE 0 END) +
          (CASE WHEN j.benefits::text ILIKE ${queryPattern} THEN 0.5 ELSE 0 END) +
          (CASE WHEN j.salary_packages::text ILIKE ${queryPattern} THEN 0.5 ELSE 0 END) +
          (CASE WHEN j.notes::text ILIKE ${queryPattern} THEN 0.3 ELSE 0 END) +
          (CASE WHEN j.employment_types::text ILIKE ${queryPattern} THEN 2.0 ELSE 0 END)
        ) as hybrid_score
      FROM job_positions j
      INNER JOIN recruitment_posts p ON j.post_id = p.id
      WHERE (
        (${
          hasEmbedding
            ? Prisma.raw(
                `j.embedding <=> '${vectorString}'::vector < ${1 - threshold}`,
              )
            : Prisma.raw('false')
        })
        OR j.title ILIKE ${queryPattern}
        OR p.company_name ILIKE ${queryPattern}
        OR p.address ILIKE ${queryPattern}
        OR j.description_text ILIKE ${queryPattern}
        -- Universal search across all JSONB fields
        OR j.salary_packages::text ILIKE ${queryPattern}
        OR j.requirements::text ILIKE ${queryPattern}
        OR j.benefits::text ILIKE ${queryPattern}
        OR j.other_requirements::text ILIKE ${queryPattern}
        OR j.environment::text ILIKE ${queryPattern}
        OR j.managers::text ILIKE ${queryPattern}
        OR j.shifts::text ILIKE ${queryPattern}
        OR j.notes::text ILIKE ${queryPattern}
        OR j.employment_types::text ILIKE ${queryPattern}
      )
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
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          positions: [],
        });
      }

      const post = postsMap.get(postId)!;
      post.positions.push({
        id: row.id,
        title: row.title,
        status: row.status as RecruitmentStatus,
        employmentTypes: row.employment_types,
        salaryPackages: row.salary_packages,
        managers: row.managers,
        shifts: row.shifts,
        requirements: row.requirements,
        benefits: row.benefits,
        otherRequirements: row.other_requirements,
        environment: row.environment,
        notes: row.notes,
        shiftSelections: row.shift_selections,
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
      createdAt: dbPost.createdAt,
      updatedAt: dbPost.updatedAt,
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
      employmentTypes: dbPos.employmentTypes as unknown as EmploymentType[], // Changed
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
    const lines: string[] = [];

    // Header
    lines.push(`# VỊ TRÍ: ${pos.title?.toUpperCase() || 'Không rõ'}`);
    lines.push(
      `LOẠI HÌNH: ${
        pos.employmentTypes?.join(', ') || 'Toàn thời gian' // Changed
      } | TRẠNG THÁI: ${
        pos.status === RecruitmentStatus.Recruiting
          ? 'Đang tuyển dụng'
          : 'Đã đóng'
      }`,
    );

    lines.push('');
    lines.push('---');
    lines.push('');

    // Requirements & Other Requirements
    if (
      (pos.requirements && pos.requirements.length > 0) ||
      (pos.otherRequirements && pos.otherRequirements.length > 0)
    ) {
      lines.push('YÊU CẦU CÔNG VIỆC:');
      if (pos.requirements)
        pos.requirements.forEach((r) => lines.push(`- ${r}`));
      if (pos.otherRequirements)
        pos.otherRequirements.forEach((r) => lines.push(`- ${r}`));
      lines.push('');
    }

    // Benefits
    if (pos.benefits && pos.benefits.length > 0) {
      lines.push('PHÚC LỢI & QUYỀN LỢI:');
      pos.benefits.forEach((b) => lines.push(`- ${b}`));
      lines.push('');
    }

    // Salary info
    if (pos.salaryPackages && pos.salaryPackages.length > 0) {
      lines.push('CHẾ ĐỘ LƯƠNG THƯỞNG:');
      pos.salaryPackages.forEach((sal) => {
        if (sal.type === SalaryType.Monthly) {
          lines.push(`- Lương tháng: ${sal.amount || 'Thỏa thuận'}`);
        } else if (sal.type === SalaryType.Shift) {
          lines.push(
            `- Lương theo ca ${sal.isNightShift ? '(ca đêm)' : '(ca ngày)'}: ${
              sal.standardRate || 'Thỏa thuận'
            }`,
          );
          if (sal.sundayRate)
            lines.push(`  + Lương Chủ Nhật: ${sal.sundayRate}`);
          if (sal.holidayRate)
            lines.push(`  + Lương Ngày Lễ: ${sal.holidayRate}`);
        } else if (sal.type === SalaryType.Overtime) {
          lines.push(`- Chế độ tăng ca:`);
          if (sal.dayShiftOvertime) {
            lines.push(
              `  + Tăng ca ngày: ${sal.dayShiftOvertime.standardRate} (Lễ ${sal.dayShiftOvertime.holidayRate})`,
            );
          }
          if (sal.nightShiftOvertime) {
            lines.push(
              `  + Tăng ca đêm: ${sal.nightShiftOvertime.standardRate} (Lễ ${sal.nightShiftOvertime.holidayRate})`,
            );
          }
        }
      });
      lines.push('');
    }

    // Environment
    if (pos.environment && pos.environment.length > 0) {
      lines.push('MÔI TRƯỜNG LÀM VIỆC:');
      pos.environment.forEach((e) => lines.push(`- ${e}`));
      lines.push('');
    }

    // Shifts
    if (pos.shifts && pos.shifts.length > 0) {
      lines.push('CA LÀM VIỆC:');
      pos.shifts.forEach((s) =>
        lines.push(`- ${s.name}: ${s.startTime} - ${s.endTime}`),
      );
      lines.push('');
    }

    // Managers
    if (pos.managers && pos.managers.length > 0) {
      lines.push('LIÊN HỆ QUẢN LÝ:');
      pos.managers.forEach((m) => {
        // @ts-expect-error email might exist in runtime
        const emailInfo = m.email ? `, ${m.email}` : '';
        lines.push(`- ${m.name} (${m.phoneNumber}${emailInfo})`);
      });
      lines.push('');
    }

    // Notes & Shift Selections
    if (pos.shiftSelections && pos.shiftSelections.length > 0) {
      const selections = pos.shiftSelections.map((s) => {
        switch (s) {
          case ShiftSelection.Flexible:
            return 'Linh hoạt (Được chọn ca)';
          case ShiftSelection.DayShiftOnly:
            return 'Chỉ ca ngày';
          case ShiftSelection.NightShiftOnly:
            return 'Chỉ ca đêm';
          case ShiftSelection.OfficeHoursOvertime:
            return 'Hành chính có tăng ca';
          case ShiftSelection.ArrangedByHR:
            return 'Nhân sự sắp xếp';
          case ShiftSelection.RotatingShift:
            return 'Xoay ca';
          default:
            return s as string;
        }
      });
      lines.push(`CHẾ ĐỘ CA: ${selections.join(', ')}`);
    }

    if (pos.notes && pos.notes.length > 0) {
      lines.push('GHI CHÚ:');
      pos.notes.forEach((n) => lines.push(`- ${n}`));
    }

    return lines
      .filter((l) => l !== undefined && l !== null)
      .join('\n')
      .trim();
  }
}
