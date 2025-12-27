import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../upload/minio.service';
import { AiService } from '../ai/ai.service';
import { TelegramService } from '../notifications/telegram.service';
import { GoogleIndexingService } from '../google-indexing/google-indexing.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Prisma, JobStatus } from '@prisma/client';
import { read, utils } from 'xlsx';
import { JobExcelRow } from './dto/job-excel-row.dto';
import { JobUpdateData } from './dto/job-update-data.dto';
import { ImportError } from './dto/import-error.dto';
import { JobStructuredInputDto } from 'src/ai/dto/ai-service.dto';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
    @Inject(forwardRef(() => AiService))
    private aiService: AiService,
    private telegramService: TelegramService,
    private googleIndexingService: GoogleIndexingService,
  ) {}

  /**
   * Quy trình tạo Vector thông minh bằng AI (Chạy ngầm)
   */
  indexJobWithAi(job: JobStructuredInputDto) {
    // Fire-and-forget: Không await, để chạy nền
    this.processAiIndexing(job).catch((err: unknown) => {
      console.error(`Background AI Indexing failed for Job ${job.id}`, err);
    });
  }

  private async processAiIndexing(job: JobStructuredInputDto) {
    // 1. Dùng AI phân tách ý chính
    const optimizedText = await this.aiService.generateStructuredJobText(job);
    // 2. Tạo Vector từ văn bản đã tối ưu
    await this.aiService.embedJob(job.id, optimizedText);
    console.log(`[Background] Indexed Job ${job.id} with AI Optimized Text.`);
  }

  /**
   * Tối ưu văn bản để AI tạo Vector chính xác hơn (Backup manual method)
   */
  getJobSearchText(job: { title: string; content: string }): string {
    const title = job.title.toUpperCase();
    return `TITLE: ${title}. TITLE: ${title}. TITLE: ${title}. TITLE: ${title}. TITLE: ${title}. CONTENT: ${job.content}`;
  }

  async importFromExcel(file: Express.Multer.File) {
    const workbook = read(file.buffer, {
      type: 'buffer',
      cellDates: true,
    });

    const data = utils.sheet_to_json<JobExcelRow>(
      workbook.Sheets[workbook.SheetNames[0]],
    );

    let createdCount = 0;
    const errors: { row: number; error: string }[] = [];
    const indexingBatch: { url: string; type: 'URL_UPDATED' }[] = [];

    for (const row of data) {
      try {
        const title = row['Title'];

        const content = row['Description'];

        const location = row['Location'] || 'Remote';

        const minSalary = row['MinSalary']
          ? parseInt(row['MinSalary'].toString())
          : null;

        const maxSalary = row['MaxSalary']
          ? parseInt(row['MaxSalary'].toString())
          : null;

        const jobType = row['JobType']?.toLowerCase() || 'unskilled';

        const imageUrl = row['ImageURL'] || null;

        const job = await this.prisma.job.create({
          data: {
            id: this.generateJobId(title),
            title,
            content,
            location,
            salaryMin: minSalary,
            salaryMax: maxSalary,
            jobType,
            status: JobStatus.REVIEWING, // Default Draft
            views: 0,
            imageUrl,
          },
        });

        this.indexJobWithAi(job);

        const frontendUrl =
          process.env.NEXT_PUBLIC_APP_URL || 'https://timviec.vieclamhr.com';
        indexingBatch.push({
          url: `${frontendUrl}/jobs/${job.id}`,
          type: 'URL_UPDATED',
        });

        const tagNames = row['Tags']
          ? row['Tags']
              .toString()
              .split(',')
              .map((t: string) => t.trim())
          : [];
        if (tagNames.length > 0) {
          for (const tagName of tagNames) {
            if (!tagName) continue;
            const tag = await this.prisma.tag.upsert({
              where: { name: tagName },
              update: {},

              create: { name: tagName },
            });
            await this.prisma.jobTag.create({
              data: { jobId: job.id, tagId: tag.id },
            });
          }
        }

        createdCount++;
      } catch (error: any) {
        const importError = error as ImportError;
        const errorMessage =
          importError.message || (error as string) || 'Unknown error';
        errors.push({
          row: createdCount + 2,
          error: errorMessage,
        });
      }
    }

    if (indexingBatch.length > 0) {
      this.googleIndexingService
        .sendBatchIndexing(indexingBatch)
        .catch((err: unknown) =>
          console.error(
            'Failed to send batch indexing:',
            err instanceof Error ? err.message : err,
          ),
        );
    }

    return {
      success: true,
      count: createdCount,
      errors: errors.length > 0 ? errors : null,
    };
  }

  private generateJobId(title: string): string {
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    // Generate 6 random digits
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `${slug}_${randomSuffix}`;
  }

  async create(
    createJobDto: CreateJobDto,
    user: { role: string; userId: string },
  ) {
    // 1. Tách 'tags' ra khỏi DTO
    const { tags, ...jobData } = createJobDto;

    // Determine default status based on role
    // If admin -> ACTIVE (or respect DTO), if others -> REVIEWING
    let status: JobStatus = JobStatus.REVIEWING;
    if (user?.role === 'admin') {
      status = (jobData.status as JobStatus) || JobStatus.ACTIVE;
    } else {
      // Force REVIEWING for non-admins unless specific logic allows otherwise
      status = JobStatus.REVIEWING;
    }

    const job = await this.prisma.job.create({
      data: {
        id: this.generateJobId(jobData.title),
        title: jobData.title,
        content: jobData.content,
        location: jobData.location,
        salaryMin: jobData.salaryMin ? Number(jobData.salaryMin) : null,
        salaryMax: jobData.salaryMax ? Number(jobData.salaryMax) : null,
        experienceYears: jobData.experienceYears
          ? Number(jobData.experienceYears)
          : null,
        imageUrl: jobData.imageUrl,
        deadline: jobData.deadline ? new Date(jobData.deadline) : null,
        jobType: jobData.jobType,
        status: status,
        authorId: user?.userId, // Set author
        // 2. Sử dụng nested create để thêm tags
        jobTags:
          tags && Array.isArray(tags)
            ? {
                create: tags.map((tagId: string) => ({
                  tag: {
                    connect: { id: tagId },
                  },
                })),
              }
            : undefined,
      },
    });

    // Trigger background indexing
    this.indexJobWithAi(job);

    // Notify Telegram if author is not admin
    if (user?.role !== 'admin') {
      const author = await this.prisma.user.findUnique({
        where: { id: user.userId },
        select: { name: true, email: true, phone: true },
      });

      if (author) {
        this.telegramService
          .sendNewJobNotification(job, author)
          .catch((err) =>
            console.error('Failed to send new job notification:', err),
          );
      }
    }

    // Google Indexing & Sitemap Ping
    const frontendUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://timviec.vieclamhr.com';
    const jobUrl = `${frontendUrl}/jobs/${job.id}`;

    this.googleIndexingService
      .publishUrl({ url: jobUrl, type: 'URL_UPDATED' })
      .catch((err) =>
        console.error('Failed to publish URL to Google Indexing:', err),
      );
    return job;
  }

  async update(
    id: string,
    updateJobDto: UpdateJobDto,
    user: { role: string; userId: string },
  ) {
    // 1. Tách 'tags' ra khỏi DTO chính
    const { tags, ...jobData } = updateJobDto;

    // Logic: Nếu người sửa không phải Admin, luôn reset trạng thái về REVIEWING
    // để Admin duyệt lại nội dung vừa sửa.
    if (user && user.role !== 'admin') {
      jobData.status = 'REVIEWING';
    }

    // Check image cleanup logic...
    if (jobData.imageUrl !== undefined) {
      const oldJob = await this.prisma.job.findUnique({
        where: { id },
        select: { imageUrl: true },
      });
      if (oldJob?.imageUrl && oldJob.imageUrl !== jobData.imageUrl) {
        try {
          const filename = oldJob.imageUrl.split('/').pop();
          if (filename) await this.minioService.deleteFile(filename);
        } catch {
          // ignore
        }
      }
    }

    const job = await this.prisma.job.update({
      where: { id },
      data: {
        ...(jobData as unknown as JobUpdateData),
        status: (jobData.status
          ? jobData.status
          : undefined) as Prisma.EnumJobStatusFieldUpdateOperationsInput,
        salaryMin: jobData.salaryMin
          ? parseInt(jobData.salaryMin as unknown as string)
          : undefined,
        salaryMax: jobData.salaryMax
          ? parseInt(jobData.salaryMax as unknown as string)
          : undefined,
        experienceYears: jobData.experienceYears
          ? parseInt(jobData.experienceYears as unknown as string)
          : undefined,
        deadline: jobData.deadline
          ? new Date(jobData.deadline as string | number | Date)
          : undefined,
      },
    });

    // 2. Xử lý logic cập nhật tags nếu có
    if (tags && Array.isArray(tags)) {
      // Bọc trong transaction để đảm bảo toàn vẹn dữ liệu
      await this.prisma.$transaction([
        // Xóa tất cả các JobTag cũ của Job này
        this.prisma.jobTag.deleteMany({ where: { jobId: id } }),
        // Tạo lại các JobTag mới từ mảng tags (mảng ID) được gửi lên
        this.prisma.jobTag.createMany({
          data: tags.map((tagId: string) => ({
            jobId: id,
            tagId: tagId,
          })),
        }),
      ]);
    }

    // Trigger background indexing
    this.indexJobWithAi(job);
    return job;
  }

  async findAll(
    query: {
      page?: number;
      limit?: number;
      status?: string;
      authorId?: string;
    } = {},
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const where: Prisma.JobWhereInput = {};
    if (query.status)
      where.status = query.status as Prisma.EnumJobStatusFilter | 'ACTIVE';
    if (query.authorId) where.authorId = query.authorId;

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: {
          jobTags: { include: { tag: true } },
          _count: { select: { applications: true } },
          author: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.job.count({ where }),
    ]);
    return { items, total, page, lastPage: Math.ceil(total / limit) };
  }

  async approveJob(id: string, status: JobStatus) {
    const job = await this.prisma.job.update({
      where: { id },
      data: { status: status },
    });

    if (status === JobStatus.ACTIVE) {
      this.indexJobWithAi(job);
    }

    return job;
  }

  async search(query: {
    title?: string;
    location?: string;
    jobType?: string;
    page?: number;
    limit?: number;
    userId?: string;
    guestId?: string;
  }) {
    const { title, location, jobType, userId, guestId } = query;
    // ... (Tracking Logic - keep same)
    if (title || location) {
      const queryText =
        `Title: ${title || ''}, Location: ${location || ''}`.trim();
      try {
        const embedding = await this.aiService.generateEmbedding(queryText);

        const vectorString = `[${embedding.join(',')}]`;
        if (userId)
          await this.prisma
            .$executeRaw`INSERT INTO "SearchHistory" ("id", "userId", "query", "embedding", "createdAt") VALUES (gen_random_uuid(), ${userId}, ${queryText}, ${vectorString}::vector, NOW())`;
        else if (guestId) {
          await this.prisma.guest.upsert({
            where: { id: guestId },
            update: { lastActive: new Date() },
            create: { id: guestId },
          });
          await this.prisma
            .$executeRaw`INSERT INTO "SearchHistory" ("id", "guestId", "query", "embedding", "createdAt") VALUES (gen_random_uuid(), ${guestId}::uuid, ${queryText}, ${vectorString}::vector, NOW())`;
        }
      } catch {
        // ignore
      }
    }

    const where: Prisma.JobWhereInput = { status: 'ACTIVE' };
    if (title)
      where.OR = [
        { title: { contains: title, mode: 'insensitive' } },
        {
          jobTags: {
            some: { tag: { name: { contains: title, mode: 'insensitive' } } },
          },
        },
      ];
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (jobType && jobType !== 'all') where.jobType = jobType;

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: {
          jobTags: { include: { tag: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: ((Number(query.page) || 1) - 1) * (Number(query.limit) || 10),
        take: Number(query.limit) || 10,
      }),
      this.prisma.job.count({ where }),
    ]);
    return {
      items,
      total,
      page: Number(query.page) || 1,
      lastPage: Math.ceil(total / (Number(query.limit) || 10)),
    };
  }

  async findOne(id: string, incrementView: boolean = true) {
    try {
      const data = incrementView ? { views: { increment: 1 } } : {};
      return await this.prisma.job.update({
        where: { id },
        data,
        include: {
          jobTags: { include: { tag: true } },
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
              address: true,
            },
          },
        },
      });
    } catch {
      return null;
    }
  }

  async remove(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      select: { imageUrl: true },
    });
    if (job?.imageUrl) {
      try {
        const filename = job.imageUrl.split('/').pop();
        if (filename) await this.minioService.deleteFile(filename);
      } catch {
        // ignore
      }
    }

    const frontendUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://timviec.vieclamhr.com';
    const jobUrl = `${frontendUrl}/jobs/${id}`;

    this.googleIndexingService
      .publishUrl({ url: jobUrl, type: 'URL_DELETED' })
      .catch((err) =>
        console.error(
          'Failed to publish URL deletion to Google Indexing:',
          err,
        ),
      );
    return this.prisma.job.delete({ where: { id } });
  }

  async getLocations() {
    const jobs = await this.prisma.job.findMany({
      where: { status: 'ACTIVE' },
      select: { location: true },
      distinct: ['location'],
    });
    return jobs.map((j) => j.location);
  }

  async getSuggestions() {
    const [jobs, tags] = await Promise.all([
      this.prisma.job.findMany({
        where: { status: 'ACTIVE' },
        select: { title: true },
        distinct: ['title'],
        take: 20,
      }),
      this.prisma.tag.findMany({ select: { name: true }, take: 20 }),
    ]);
    return Array.from(
      new Set([...jobs.map((j) => j.title), ...tags.map((t) => t.name)]),
    );
  }

  async getTrendingJobs(limit: number = 6) {
    return this.prisma.job.findMany({
      where: { status: 'ACTIVE' },
      include: {
        jobTags: { include: { tag: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { views: 'desc' },
      take: Number(limit),
    });
  }

  async getHotJobs(limit: number = 6) {
    return this.prisma.job.findMany({
      where: { status: 'ACTIVE' },
      include: {
        jobTags: { include: { tag: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { applications: { _count: 'desc' } },
      take: Number(limit),
    });
  }
}
