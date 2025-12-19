import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) { }

  create(createTagDto: any) {
    return this.prisma.tag.create({
      data: { name: createTagDto.name }
    });
  }

  findAll() {
    return this.prisma.tag.findMany();
  }

  async addTagToJob(jobId: string, tagId: string) {
    return this.prisma.jobTag.create({
      data: { jobId, tagId }
    });
  }

  async removeTagFromJob(jobId: string, tagId: string) {
    return this.prisma.jobTag.delete({
      where: { jobId_tagId: { jobId, tagId } }
    });
  }

  async getJobTags(jobId: string) {
    return this.prisma.jobTag.findMany({
      where: { jobId },
      include: { tag: true }
    });
  }

  async remove(id: string) {
    return this.prisma.tag.delete({
      where: { id }
    });
  }
}
