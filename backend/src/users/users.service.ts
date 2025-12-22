import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../upload/minio.service';
import { AiService } from '../ai/ai.service';
const pdf = require('pdf-parse');

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
    @Inject(forwardRef(() => AiService))
    private aiService: AiService,
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
        id: true, email: true, name: true, role: true, phone: true,
        address: true, education: true, skills: true, cvUrl: true,
        avatarUrl: true, createdAt: true
      }
    });
  }

  async update(id: string, updateUserDto: any) {
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
    // 1. Dọn dẹp file cũ
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

    // 2. Upload file mới
    const uploadResult = await this.minioService.uploadFile(file);

    // 3. PHÂN TÍCH CV BẰNG AI
    try {
        // Chỉ hỗ trợ PDF cho việc phân tích văn bản hiện tại
        if (file.mimetype === 'application/pdf') {
            const pdfData = await pdf(file.buffer);
            const cvText = pdfData.text;

            // Gọi AI để trích xuất thông tin
            const analysis = await this.aiService.analyzeResume(cvText);

            if (analysis) {
                // Tự động cập nhật Profile dựa trên phân tích
                await this.prisma.user.update({
                    where: { id: userId },
                    data: {
                        cvUrl: uploadResult.url,
                        // Chỉ cập nhật nếu trường đó đang trống hoặc ưu tiên thông tin mới từ CV
                        name: analysis.name || undefined,
                        phone: analysis.phone || undefined,
                        address: analysis.address || undefined,
                        education: analysis.education || undefined,
                        skills: analysis.skills || undefined,
                    }
                });

                // Tạo Vector Embedding cho nội dung CV để AI hiểu sâu người dùng
                await this.aiService.embedUser(userId, `Profile of ${analysis.name}. Skills: ${analysis.skills}. Education: ${analysis.education}. Experience: ${analysis.experience}. Summary: ${analysis.summary}`);
                
                return { 
                    url: uploadResult.url, 
                    analyzed: true,
                    message: "CV đã được tải lên và phân tích tự động thành công."
                };
            }
        }
    } catch (error) {
        console.error("AI CV Analysis failed", error);
    }

    // Fallback: Nếu phân tích lỗi hoặc không phải PDF, chỉ update URL
    await this.prisma.user.update({
      where: { id: userId },
      data: { cvUrl: uploadResult.url }
    });

    return { url: uploadResult.url, analyzed: false };
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });
    if (user?.avatarUrl) {
      try {
        const filename = user.avatarUrl.split('/').pop();
        if (filename) await this.minioService.deleteFile(filename);
      } catch (err) { console.warn(`Failed to delete old avatar file`, err); }
    }
    const uploadResult = await this.minioService.uploadFile(file);
    await this.prisma.user.update({ where: { id: userId }, data: { avatarUrl: uploadResult.url } });
    return { url: uploadResult.url };
  }

  async promoteToAdmin(id: string) {
    return this.prisma.user.update({ where: { id }, data: { role: 'admin' } });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { cvUrl: true, avatarUrl: true } });
    if (user?.cvUrl) {
        try { const filename = user.cvUrl.split('/').pop(); if (filename) await this.minioService.deleteFile(filename); } catch (e) {}
    }
    if (user?.avatarUrl) {
        try { const filename = user.avatarUrl.split('/').pop(); if (filename) await this.minioService.deleteFile(filename); } catch (e) {}
    }
    return this.prisma.user.delete({ where: { id } });
  }
}
