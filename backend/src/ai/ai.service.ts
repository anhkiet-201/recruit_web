import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AI_PROVIDER_TOKEN } from './interfaces/ai-provider.interface';
import type { IAiProvider } from './interfaces/ai-provider.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AiService {
  private systemPrompt: string = '';

  constructor(
    private prisma: PrismaService,
    @Inject(AI_PROVIDER_TOKEN) private aiProvider: IAiProvider,
  ) {
    this.loadSystemPrompt();
  }

  private loadSystemPrompt() {
    try {
      const promptPath = path.join(process.cwd(), 'src/ai/prompts/assistant.md');
      if (fs.existsSync(promptPath)) {
        this.systemPrompt = fs.readFileSync(promptPath, 'utf8');
      } else {
        this.systemPrompt = 'Bạn là trợ lý AI chuyên nghiệp của RecruitWeb.';
      }
    } catch (error) {
      console.error('Error loading system prompt file:', error);
    }
  }

  async analyzeResume(text: string) {
    const prompt = `Bạn là một chuyên gia HR. Hãy phân tích nội dung CV sau đây và trích xuất thông tin dưới dạng JSON.
    Yêu cầu JSON có cấu trúc chính xác như sau:
    {
      "name": "Họ tên",
      "phone": "Số điện thoại",
      "address": "Địa chỉ",
      "education": "Thông tin học vấn tóm tắt",
      "skills": "Danh sách kỹ năng chính, cách nhau bằng dấu phẩy",
      "experience": "Tóm tắt kinh nghiệm làm việc",
      "summary": "Tóm tắt năng lực cốt lõi (2-3 câu)"
    }
    NỘI DUNG CV: ${text}
    LƯU Ý: Chỉ trả về mã JSON, không thêm văn bản giải thích.`;

    const jsonResponse = await this.aiProvider.generateText(prompt);
    try {
      const cleaned = jsonResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) { return null; }
  }

  async generateStructuredJobText(job: any): Promise<string> {
    const prompt = `Bạn là một chuyên gia phân tích dữ liệu tuyển dụng. Hãy tóm tắt tin tuyển dụng sau đây thành một đoạn văn bản kỹ thuật ngắn gọn để dùng cho việc tìm kiếm ngữ nghĩa.
    YÊU CẦU: Trích xuất Chức danh, Kỹ năng, Lương, Kinh nghiệm, Địa điểm, Loại nhân lực.
    NỘI DUNG GỐC: Tiêu đề: ${job.title}, Mô tả: ${job.content}, Địa điểm: ${job.location}, Lương: ${job.salaryMin}-${job.salaryMax}.
    CHỈ TRẢ VỀ đoạn văn bản tóm tắt.`;

    try {
      return (await this.aiProvider.generateText(prompt)).trim();
    } catch (e) {
      return `TITLE: ${job.title}. CONTENT: ${job.content.substring(0, 300)}`;
    }
  }

  async chat(message: string, history: { role: string, parts: string }[] = [], userId?: string, guestId?: string) {
    if (process.env.NODE_ENV !== 'production') this.loadSystemPrompt();
    let dynamicInstructions = this.systemPrompt;
    let searchHistory = '';

    if (userId) {
      const userProfile = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          applications: { take: 5, orderBy: { createdAt: 'desc' }, select: { job: { select: { title: true } } } },
          searchHistories: { take: 10, orderBy: { createdAt: 'desc' }, select: { query: true } }
        }
      });
      if (userProfile) {
        searchHistory = userProfile.searchHistories.map(s => s.query).join(' | ');
        dynamicInstructions += `\n--- HỒ SƠ: ${userProfile.name}. Kỹ năng: ${userProfile.skills} ---`;
      }
    } else if (guestId) {
      const guestHistory = await this.prisma.searchHistory.findMany({ where: { guestId }, take: 10, orderBy: { createdAt: 'desc' }, select: { query: true } });
      searchHistory = guestHistory.map(s => s.query).join(' | ');
    }
    if (searchHistory) dynamicInstructions += `\nLỊCH SỬ TÌM KIẾM: ${searchHistory}\n---`;

    try {
      const model = this.aiProvider.getChatModel(dynamicInstructions);
      const chatSession = model.startChat({ history: history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.parts }] })), });
      const result = await chatSession.sendMessage(message);
      return result.response.text();
    } catch (error) { throw error; }
  }

  /**
   * TÌM KIẾM 2 LỚP (DOUBLE VALIDATION): Hybrid Search + AI Reranking
   */
  async findSimilarJobs(query: string, limit: number = 10) {
    const embedding = await this.aiProvider.generateEmbedding(query);
    const vectorString = `[${embedding.join(',')}]`;
    
    // LỚP 1: Lấy 20 ứng viên tiềm năng bằng Hybrid Search
    const candidates: any[] = await this.prisma.$queryRaw`
      SELECT id, title, content, location, "imageUrl", "jobType", "salaryMin", "salaryMax"
      FROM "Job" 
      WHERE "isActive" = true 
      AND "embedding" IS NOT NULL
      ORDER BY (
        (1 - ("embedding" <=> ${vectorString}::vector)) + 
        (CASE WHEN title ILIKE ${'%' + query + '%'} THEN 0.8 ELSE 0 END)
      ) DESC 
      LIMIT 20
    `;

    if (candidates.length === 0) return [];

    // LỚP 2: AI Reranking - Gemini kiểm tra độ liên quan thực tế
    const rerankPrompt = `Bạn là chuyên gia tuyển dụng. Hãy kiểm tra danh sách công việc sau đây và chỉ giữ lại những công việc thực sự liên quan đến yêu cầu: "${query}".
    Hãy loại bỏ những công việc lạc đề (ví dụ: tìm "kế toán" thì loại bỏ "lập trình viên").
    
    DANH SÁCH:
    ${candidates.map(c => `ID: ${c.id}, Title: ${c.title}`).join('\n')}
    
    YÊU CẦU: Trả về một mảng JSON các ID hợp lệ, ví dụ: ["id1", "id2"]. Không giải thích gì thêm.`;

    try {
      const aiResponse = await this.aiProvider.generateText(rerankPrompt);
      const cleanedJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const validIds: string[] = JSON.parse(cleanedJson);

      return candidates
        .filter(c => validIds.includes(c.id))
        .slice(0, limit);
    } catch (e) {
      console.error("Reranking failed, using raw hybrid results", e);
      return candidates.slice(0, limit);
    }
  }

  async embedJob(jobId: string, text: string) {
    const embedding = await this.aiProvider.generateEmbedding(text);
    return this.updateJobEmbedding(jobId, embedding);
  }

  async embedUser(userId: string, text: string) {
    const embedding = await this.aiProvider.generateEmbedding(text);
    const vectorString = `[${embedding.join(',')}]`;
    return this.prisma.$executeRaw`UPDATE "User" SET "embedding" = ${vectorString}::vector WHERE "id" = ${userId}`;
  }

  async updateJobEmbedding(jobId: string, embedding: number[]) {
    const vectorString = `[${embedding.join(',')}]`;
    return this.prisma.$executeRaw`UPDATE "Job" SET "embedding" = ${vectorString}::vector WHERE "id" = ${jobId}::uuid`;
  }

  async recommendJobsForUser(userId: string, limit: number = 5) {
    return this.prisma.$queryRaw`
      SELECT j.id, j.title, 1 - (j."embedding" <=> u."embedding") as score
      FROM "Job" j, "User" u
      WHERE u.id = ${userId} AND j."isActive" = true AND j."embedding" IS NOT NULL
      ORDER BY score DESC LIMIT ${limit}
    `;
  }
}