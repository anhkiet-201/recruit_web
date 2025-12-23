import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AI_PROVIDER_TOKEN, IAiProvider } from './interfaces/ai-provider.interface';
import { PromptService } from './prompt.service';

/**
 * Service quản lý logic trí tuệ nhân tạo (AI) trung tâm.
 */
@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private promptService: PromptService,
    @Inject(AI_PROVIDER_TOKEN) private aiProvider: IAiProvider,
  ) { } 

  /**
   * Xử lý hội thoại chính với người dùng.
   */
  async chat(message: string, history: any[], userId?: string, guestId?: string) {
    const systemPrompt = await this.promptService.getPrompt('system');
    const userContext = await this.buildUserContext(userId, guestId);
    
    let fullSystemInstruction = `${systemPrompt}\n\n${userContext}`;

    // --- LOGIC: Xử lý sự kiện sau tìm kiếm ---
    const searchEventMatch = message.match(/\[SYSTEM_EVENT: Search for "(.*?)" completed/);
    if (searchEventMatch) {
        const query = searchEventMatch[1];
        try {
            const jobs = await this.findSimilarJobs(query, 5);
            
            if (jobs.length > 0) {
                const jobData = jobs.map(j => {
                    const salary = (j.salaryMin || j.salaryMax) 
                        ? `${j.salaryMin || '0'}$ - ${j.salaryMax || '??'}$` 
                        : 'Thỏa thuận';
                    return `- ${j.title} (Lương: ${salary}) tại ${j.location}`;
                }).join('\n');

                fullSystemInstruction += `\n\n=== KẾT QUẢ TÌM KIẾM THỰC TẾ TỪ DATABASE (QUERY: "${query}") ===\n${jobData}\n\nNHIỆM VỤ: Dựa vào danh sách trên, hãy giới thiệu ngắn gọn cho người dùng. TUYỆT ĐỐI CHỈ NÓI VỀ CÁC CÔNG VIỆC CÓ TRONG DANH SÁCH NÀY.`;
            } else {
                fullSystemInstruction += `\n\n=== KẾT QUẢ TÌM KIẾM THỰC TẾ (QUERY: "${query}") ===\nKHÔNG TÌM THẤY CÔNG VIỆC NÀO TRONG DATABASE.\n\nNHIỆM VỤ: Hãy thông báo khéo léo cho người dùng là hiện tại chưa có vị trí phù hợp. Tuyệt đối không được bịa ra công việc ảo.`;
            }
        } catch (e) {
            console.error("Error fetching jobs for AI context:", e);
        }
    }
    // ------------------------------------------------------------------

    const tools = [{
      name: "perform_search",
      description: "Thực hiện tìm kiếm hoặc gợi ý việc làm dựa trên nhu cầu của người dùng.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Chuỗi từ khóa tìm kiếm đã được tối ưu hóa." },
          mode: { type: "string", enum: ["search", "suggest"], description: "Chế độ tìm kiếm." }
        },
        required: ["query", "mode"]
      }
    }];

    try {
      const response = await this.aiProvider.chat(
        fullSystemInstruction, 
        history, 
        message, 
        tools
      );

      let finalResponse = response.text || "";

      if (response.toolCall && response.toolCall.name === 'perform_search') {
        const { query, mode } = response.toolCall.args;
        const tag = mode === 'suggest' ? 'SUGGEST' : 'SEARCH';
        
        if (!finalResponse.trim()) {
            finalResponse = mode === 'suggest' 
                ? "Dựa trên sở thích của bạn, tôi tìm thấy một số công việc phù hợp:" 
                : `Tôi đã tìm kiếm các vị trí "${query}" cho bạn:`
        }
        finalResponse += `\n[${tag}: ${query}]`;
      }

      return finalResponse || "Xin lỗi, tôi không thể phản hồi lúc này.";
    } catch (error) {
      console.error("AiService Chat Error:", error);
      throw error;
    }
  }

  private async buildUserContext(userId?: string, guestId?: string): Promise<string> {
    const defaultVars = {
        name: 'Khách',
        skills: 'N/A',
        education: 'N/A',
        experience: 'N/A',
        search_history: 'Chưa có dữ liệu',
        application_history: 'Chưa có dữ liệu',
        current_page: 'Trang chủ',
        current_time: new Date().toLocaleString('vi-VN'),
        cv_analysis: 'Chưa có dữ liệu.'
    };

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          applications: { take: 5, orderBy: { createdAt: 'desc' }, select: { status: true, job: { select: { title: true } } } },
          searchHistories: { take: 5, orderBy: { createdAt: 'desc' }, select: { query: true } }
        }
      });

      if (user) {
        const cvMatches = await this.getJobsMatchingCv(userId);
        const cvAnalysisText = cvMatches.length > 0 
            ? `Hệ thống nhận thấy CV tương đồng với: ${cvMatches.map(j => j.title).join(', ')}.`
            : 'Chưa có dữ liệu phân tích CV.';

        // FEATURE: Persistent Search Context
        let lastSearchContext = "";
        if (user.searchHistories.length > 0) {
             const lastQuery = user.searchHistories[0].query;
             const lastJobs = await this.findSimilarJobs(lastQuery, 3);
             if (lastJobs.length > 0) {
                 lastSearchContext = `\n=== KẾT QUẢ TÌM KIẾM GẦN NHẤT CỦA USER ("${lastQuery}") ===\n` + 
                 lastJobs.map(j => `- ${j.title} (${j.location})`).join('\n');
             }
        }

        return this.promptService.getPrompt('user_context', {
            ...defaultVars,
            name: user.name || 'Thành viên',
            skills: user.skills || 'N/A',
            education: user.education || 'N/A',
            search_history: user.searchHistories.map(s => s.query).join(', ') || 'Chưa có dữ liệu',
            application_history: user.applications.map(a => `${a.job.title} (${a.status})`).join(', ') || 'Chưa có dữ liệu',
            cv_analysis: cvAnalysisText + lastSearchContext
        });
      }
    } else if (guestId) {
      const guestHistory = await this.prisma.searchHistory.findMany({
        where: { guestId }, take: 5, orderBy: { createdAt: 'desc' }, select: { query: true } 
      });
      return this.promptService.getPrompt('user_context', {
        ...defaultVars,
        name: 'Khách vãng lai',
        search_history: guestHistory.map(s => s.query).join(', ') || 'Chưa có dữ liệu',
      });
    }
    return this.promptService.getPrompt('user_context', defaultVars);
  }

  private async getJobsMatchingCv(userId: string): Promise<{ title: string }[]> {
    try {
        const jobs: any[] = await this.prisma.$queryRawUnsafe(`
            SELECT j.title FROM "Job" j, "User" u
            WHERE u.id = '${userId}' AND u.embedding IS NOT NULL AND j.embedding IS NOT NULL AND (j."status" = 'ACTIVE' OR j."status" = 'ACCEPTED')
            ORDER BY j.embedding <=> u.embedding LIMIT 3
        `);
        return jobs;
    } catch (e) { return []; }
  }

  async analyzeResume(text: string) {
    const prompt = `Trích xuất JSON (Họ tên, Kỹ năng, Học vấn) từ CV: ${text}`;
    try {
      const res = await this.aiProvider.generateText(prompt);
      return JSON.parse(res.replace(/```json|```/g, '').trim());
    } catch (e) { return null; }
  }

  // --- UTILS ---
  async generateStructuredJobText(job: any): Promise<string> {
    const prompt = `Phân tích job: ${job.title} ${job.content}`;
    try { return (await this.aiProvider.generateText(prompt)).trim(); }
    catch (e) { return `TITLE: ${job.title}. CONTENT: ${job.content.substring(0, 300)}`; }
  }

  async embedJob(jobId: string, text: string) {
    const vector = await this.aiProvider.generateEmbedding(text);
    const vectorStr = `[${vector.join(',')}]`;
    await this.prisma.$executeRawUnsafe(`UPDATE "Job" SET "embedding" = '${vectorStr}'::vector WHERE "id" = '${jobId}'::uuid`);
  }
  
  async embedUser(userId: string, text: string) {
    const vector = await this.aiProvider.generateEmbedding(text);
    const vectorStr = `[${vector.join(',')}]`;
    await this.prisma.$executeRawUnsafe(`UPDATE "User" SET "embedding" = '${vectorStr}'::vector WHERE "id" = '${userId}'`);
  }

  async findSimilarJobs(query: string, limit: number = 10) {
    const vector = await this.aiProvider.generateEmbedding(query);
    const vectorStr = `[${vector.join(',')}]`;
    const results: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT id, title, content, location, "imageUrl", "jobType", "salaryMin", "salaryMax", 
             (1 - ("embedding" <=> '${vectorStr}'::vector)) as similarity
      FROM "Job" WHERE ("status" = 'ACTIVE' OR "status" = 'ACCEPTED') AND "embedding" IS NOT NULL
      ORDER BY (
        (1 - ("embedding" <=> '${vectorStr}'::vector)) + 
        (CASE WHEN title ILIKE '%${query}%' THEN 0.8 ELSE 0 END)
      ) DESC LIMIT 20
    `);
    if (!results.length) return [];
    
    const jobList = results.map(c => `ID:${c.id}|${c.title}`).join('\n');
    const rerankPrompt = `Lọc Job phù hợp với "${query}". Trả về JSON array ID. Danh sách:\n${jobList}`;
    
    try {
      const res = await this.aiProvider.generateText(rerankPrompt);
      const cleanJson = res.replace(/```json|```/g, '').trim();
      const validIds: string[] = JSON.parse(cleanJson);
      return results.filter(c => validIds.includes(c.id)).slice(0, limit);
    } catch { return results.slice(0, limit); }
  }
}