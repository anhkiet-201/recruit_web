import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../upload/minio.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService
  ) { }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return null;
    const { password, ...result } = user;
    return result;
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        education: true,
        skills: true,
        cvUrl: true,
        avatarUrl: true,
        createdAt: true
      }
    });
  }

  async update(id: string, updateUserDto: any) {
    // Check if cvUrl or avatarUrl is being updated for cleanup
    const oldUser = await this.prisma.user.findUnique({
        where: { id },
        select: { cvUrl: true, avatarUrl: true }
    });

    if (updateUserDto.cvUrl !== undefined && oldUser?.cvUrl && oldUser.cvUrl !== updateUserDto.cvUrl) {
        try {
            const filename = oldUser.cvUrl.split('/').pop();
            if (filename) await this.minioService.deleteFile(filename);
        } catch (e) { console.warn("Cleanup failed for CV", e); }
    }

    if (updateUserDto.avatarUrl !== undefined && oldUser?.avatarUrl && oldUser.avatarUrl !== updateUserDto.avatarUrl) {
        try {
            const filename = oldUser.avatarUrl.split('/').pop();
            if (filename) await this.minioService.deleteFile(filename);
        } catch (e) { console.warn("Cleanup failed for Avatar", e); }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async updateCV(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { cvUrl: true }
    });

    if (user?.cvUrl) {
      try {
        const filename = user.cvUrl.split('/').pop();
        if (filename) await this.minioService.deleteFile(filename);
      } catch (err) { console.warn(`Failed to delete old CV file`, err); }
    }

    const uploadResult = await this.minioService.uploadFile(file);
    await this.prisma.user.update({
      where: { id: userId },
      data: { cvUrl: uploadResult.url }
    });
    return { url: uploadResult.url };
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true }
    });

    if (user?.avatarUrl) {
      try {
        const filename = user.avatarUrl.split('/').pop();
        if (filename) await this.minioService.deleteFile(filename);
      } catch (err) { console.warn(`Failed to delete old avatar file`, err); }
    }

    const uploadResult = await this.minioService.uploadFile(file);
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: uploadResult.url }
    });
    return { url: uploadResult.url };
  }

  async promoteToAdmin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { role: 'admin' }
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
        where: { id },
        select: { cvUrl: true, avatarUrl: true }
    });

    if (user?.cvUrl) {
        try {
            const filename = user.cvUrl.split('/').pop();
            if (filename) await this.minioService.deleteFile(filename);
        } catch (e) { console.warn("Cleanup failed during user removal (CV)", e); }
    }

    if (user?.avatarUrl) {
        try {
            const filename = user.avatarUrl.split('/').pop();
            if (filename) await this.minioService.deleteFile(filename);
        } catch (e) { console.warn("Cleanup failed during user removal (Avatar)", e); }
    }

    return this.prisma.user.delete({
      where: { id }
    });
  }
}