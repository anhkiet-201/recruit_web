import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../upload/minio.service';
import { AiService } from '../ai/ai.service';
import { ResumeAnalysisResult } from '../ai/dto/resume-analysis.dto';
import pdf from 'pdf-parse';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
    @Inject(forwardRef(() => AiService))
    private aiService: AiService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        createdAt: true,
      },
    });
  }

  async getPublicProfile(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async update(
    id: string,
    updateUserDto: Partial<{
      cvUrl: string;
      avatarUrl: string;
      name: string;
      phone: string;
      address: string;
      education: string;
      skills: string;
    }>,
  ) {
    const oldUser = await this.prisma.user.findUnique({
      where: { id },
      select: { cvUrl: true, avatarUrl: true },
    });

    if (
      updateUserDto.cvUrl !== undefined &&
      oldUser?.cvUrl &&
      oldUser.cvUrl !== updateUserDto.cvUrl
    ) {
      try {
        const filename = oldUser.cvUrl.split('/').pop();
        if (filename) await this.minioService.deleteFile(filename);
      } catch {
        console.warn('Cleanup failed for CV');
      }
    }

    if (
      updateUserDto.avatarUrl !== undefined &&
      oldUser?.avatarUrl &&
      oldUser.avatarUrl !== updateUserDto.avatarUrl
    ) {
      try {
        const filename = oldUser.avatarUrl.split('/').pop();
        if (filename) await this.minioService.deleteFile(filename);
      } catch {
        console.warn('Cleanup failed for Avatar');
      }
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
      select: { cvUrl: true },
    });

    if (user?.cvUrl) {
      try {
        const filename = user.cvUrl.split('/').pop();
        if (filename) await this.minioService.deleteFile(filename);
      } catch (err) {
        console.warn(`Failed to delete old CV file`, err);
      }
    }

    // 2. Upload file mới
    const uploadResult = await this.minioService.uploadFile(file);

    // 3. PHÂN TÍCH CV BẰNG AI
    try {
      // Chỉ hỗ trợ PDF cho việc phân tích văn bản hiện tại
      if (file.mimetype === 'application/pdf') {
        const pdfData = (await pdf(file.buffer)) as { text: string };
        const cvText = pdfData.text;

        // Gọi AI để trích xuất thông tin

        const analysis: ResumeAnalysisResult | null =
          await this.aiService.analyzeResume(cvText);

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
            },
          });

          // Tạo Vector Embedding cho nội dung CV để AI hiểu sâu người dùng
          await this.aiService.embedUser(
            userId,
            `Profile of ${analysis.name}. Skills: ${analysis.skills}. Education: ${analysis.education}. Experience: ${analysis.experience}. Summary: ${analysis.summary}`,
          );

          return {
            url: uploadResult.url,
            analyzed: true,
            message: 'CV đã được tải lên và phân tích tự động thành công.',
          };
        }
      }
    } catch (error) {
      console.error('AI CV Analysis failed', error);
    }

    // Fallback: Nếu phân tích lỗi hoặc không phải PDF, chỉ update URL
    await this.prisma.user.update({
      where: { id: userId },
      data: { cvUrl: uploadResult.url },
    });

    return { url: uploadResult.url, analyzed: false };
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });
    if (user?.avatarUrl) {
      try {
        const filename = user.avatarUrl.split('/').pop();
        if (filename) await this.minioService.deleteFile(filename);
      } catch (err) {
        console.warn(`Failed to delete old avatar file`, err);
      }
    }
    const uploadResult = await this.minioService.uploadFile(file);
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: uploadResult.url },
    });
    return { url: uploadResult.url };
  }

  async promoteToAdmin(id: string) {
    return this.prisma.user.update({ where: { id }, data: { role: 'admin' } });
  }

  async createEmployerRequest(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Người dùng không tồn tại.');
    }

    if (!user.name || !user.phone || !user.address) {
      throw new Error(
        'Vui lòng cập nhật đầy đủ thông tin: Tên, Số điện thoại và Địa chỉ trước khi đăng ký làm nhà tuyển dụng.',
      );
    }

    // Check if there is already a pending request
    const existingRequest = await this.prisma.employerRequest.findFirst({
      where: { userId, status: 'pending' },
    });

    if (existingRequest) {
      throw new Error('Bạn đã có một yêu cầu đang chờ xử lý.');
    }

    return this.prisma.employerRequest.create({
      data: {
        userId,
        status: 'pending',
      },
    });
  }

  async getEmployerRequestStatus(userId: string) {
    return this.prisma.employerRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllEmployerRequests() {
    return this.prisma.employerRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            address: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async handleEmployerRequest(
    requestId: string,
    status: 'approved' | 'rejected' | 'pending',
  ) {
    const request = await this.prisma.employerRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Yêu cầu không tồn tại.');
    }

    const updatedRequest = await this.prisma.employerRequest.update({
      where: { id: requestId },
      data: { status },
    });

    if (status === 'approved') {
      await this.prisma.user.update({
        where: { id: request.userId },
        data: { role: 'employer' },
      });
    } else {
      // Nếu là rejected hoặc bị revoke về pending, hạ quyền xuống candidate
      await this.prisma.user.update({
        where: { id: request.userId },
        data: { role: 'candidate' },
      });
    }

    return updatedRequest;
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { cvUrl: true, avatarUrl: true },
    });
    if (user?.cvUrl) {
      try {
        const filename = user.cvUrl.split('/').pop();
        if (filename) await this.minioService.deleteFile(filename);
      } catch {
        // ignore
      }
    }
    if (user?.avatarUrl) {
      try {
        const filename = user.avatarUrl.split('/').pop();
        if (filename) await this.minioService.deleteFile(filename);
      } catch {
        // ignore
      }
    }
    return this.prisma.user.delete({ where: { id } });
  }
}
