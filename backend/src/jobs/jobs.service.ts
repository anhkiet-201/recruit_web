import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../upload/minio.service';
import * as XLSX from 'xlsx';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService
  ) { }

  // ... (keep importFromExcel, create, findOne as they are)

  async findAll(query: { page?: number; limit?: number } = {}) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        include: {
          jobTags: { include: { tag: true } },
          _count: { select: { applications: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.job.count(),
    ]);

    return { items, total, page, lastPage: Math.ceil(total / limit) };
  }

  async search(query: { title?: string; location?: string; jobType?: string; page?: number; limit?: number }) {
    const { title, location, jobType } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    
    // Title OR Tag name search
    if (title) {
      where.OR = [
        { title: { contains: title, mode: 'insensitive' } },
        { 
          jobTags: { 
            some: { 
              tag: { name: { contains: title, mode: 'insensitive' } } 
            } 
          } 
        }
      ];
    }

    if (location) where.location = { contains: location, mode: 'insensitive' };
    
    if (jobType && jobType !== 'all' && jobType !== 'undefined') {
        where.jobType = jobType;
    }

    console.log('Search Filter:', JSON.stringify(where, null, 2));

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: {
          jobTags: { include: { tag: true } },
          _count: { select: { applications: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    return { items, total, page, lastPage: Math.ceil(total / limit) };
  }

  // ... (keep create, findOne, update, remove, getLocations unchanged)
  // Note: I will copy the rest of the methods to ensure the file remains functional.
  
  create(createJobDto: any) {
    return this.prisma.job.create({
      data: {
        title: createJobDto.title,
        content: createJobDto.content,
        location: createJobDto.location,
        salaryMin: createJobDto.salaryMin ? parseInt(createJobDto.salaryMin) : null,
        salaryMax: createJobDto.salaryMax ? parseInt(createJobDto.salaryMax) : null,
        experienceYears: createJobDto.experienceYears ? parseInt(createJobDto.experienceYears) : null,
        imageUrl: createJobDto.imageUrl,
        deadline: createJobDto.deadline ? new Date(createJobDto.deadline) : null,
        jobType: createJobDto.jobType,
        isActive: true
      }
    });
  }

  async findOne(id: string, incrementView: boolean = true) {
    try {
      if (incrementView) {
        return await this.prisma.job.update({
          where: { id },
          data: { views: { increment: 1 } },
          include: { jobTags: { include: { tag: true } } }
        });
      } else {
        return await this.prisma.job.findUnique({
          where: { id },
          include: { jobTags: { include: { tag: true } } }
        });
      }
    } catch (error) {
      return null;
    }
  }

  async update(id: string, updateJobDto: any) {
    if (updateJobDto.imageUrl !== undefined) {
        const oldJob = await this.prisma.job.findUnique({ where: { id }, select: { imageUrl: true } });
        if (oldJob?.imageUrl && oldJob.imageUrl !== updateJobDto.imageUrl) {
            try {
                const filename = oldJob.imageUrl.split('/').pop();
                if (filename) await this.minioService.deleteFile(filename);
            } catch (e) { console.warn("Failed to delete orphaned job image", e); }
        }
    }
    return this.prisma.job.update({
      where: { id },
      data: {
        ...updateJobDto,
        salaryMin: updateJobDto.salaryMin ? parseInt(updateJobDto.salaryMin) : undefined,
        salaryMax: updateJobDto.salaryMax ? parseInt(updateJobDto.salaryMax) : undefined,
        experienceYears: updateJobDto.experienceYears ? parseInt(updateJobDto.experienceYears) : undefined,
        deadline: updateJobDto.deadline ? new Date(updateJobDto.deadline) : undefined,
      }
    });
  }

  async remove(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id }, select: { imageUrl: true } });
    if (job?.imageUrl) {
        try {
            const filename = job.imageUrl.split('/').pop();
            if (filename) await this.minioService.deleteFile(filename);
        } catch (e) { console.warn("Failed to delete job image during removal", e); }
    }
    return this.prisma.job.delete({ where: { id } });
  }

  async getLocations() {
    const jobs = await this.prisma.job.findMany({ where: { isActive: true }, select: { location: true }, distinct: ['location'] });
    return jobs.map(j => j.location);
  }

  async getSuggestions() {
    const [jobs, tags] = await Promise.all([
      this.prisma.job.findMany({
        where: { isActive: true },
        select: { title: true },
        distinct: ['title'],
        take: 20
      }),
      this.prisma.tag.findMany({
        select: { name: true },
        take: 20
      })
    ]);

    const suggestions = [
      ...jobs.map(j => j.title),
      ...tags.map(t => t.name)
    ];

    return Array.from(new Set(suggestions)); // Unique values
  }

  async getTrendingJobs(limit: number = 6) {
    return this.prisma.job.findMany({
      where: { isActive: true },
      include: {
        jobTags: { include: { tag: true } },
        _count: { select: { applications: true } }
      },
      orderBy: { views: 'desc' },
      take: Number(limit),
    });
  }

  async getHotJobs(limit: number = 6) {
    return this.prisma.job.findMany({
      where: { isActive: true },
      include: {
        jobTags: { include: { tag: true } },
        _count: { select: { applications: true } }
      },
      orderBy: {
        applications: { _count: 'desc' }
      },
      take: Number(limit),
    });
  }

  async importFromExcel(file: Express.Multer.File) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);
    let createdCount = 0;
    const errors: any[] = [];
    for (const [index, row] of data.entries()) {
      try {
        const title = row['Title'];
        const content = row['Description'];
        if (!title || !content) throw new Error('Missing Title or Description');
        const tagNames = row['Tags'] ? row['Tags'].toString().split(',').map(t => t.trim()) : [];
        const job = await this.prisma.job.create({
          data: {
            title: title, content: content, location: row['Location'] || 'Remote',
            salaryMin: row['MinSalary'] ? parseInt(row['MinSalary']) : null,
            salaryMax: row['MaxSalary'] ? parseInt(row['MaxSalary']) : null,
            experienceYears: row['Experience'] ? parseInt(row['Experience']) : null,
            deadline: row['Deadline'] ? new Date(row['Deadline']) : null,
            jobType: row['JobType']?.toLowerCase() || 'unskilled',
            isActive: false, views: 0, imageUrl: row['ImageURL'] || null
          }
        });
        if (tagNames.length > 0) {
            for (const tagName of tagNames) {
                if (!tagName) continue;
                const tag = await this.prisma.tag.upsert({ where: { name: tagName }, update: {}, create: { name: tagName } });
                await this.prisma.jobTag.create({ data: { jobId: job.id, tagId: tag.id } });
            }
        }
        createdCount++;
      } catch (error) { errors.push({ row: index + 2, error: error.message, data: row }); }
    }
    return { success: true, count: createdCount, errors: errors.length > 0 ? errors : null };
  }
}