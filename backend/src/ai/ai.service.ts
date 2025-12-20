import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AI_PROVIDER_TOKEN, IAiProvider } from './interfaces/ai-provider.interface';
import { PromptService } from './prompt.service';

/**
 * Service quản lý logic trí tuệ nhân tạo (AI) trung tâm.
 * Chịu trách nhiệm:
 * 1. Xây dựng ngữ cảnh (Context) từ dữ liệu người dùng.
 * 2. Tương tác với AI Provider (Gemini/OpenAI).
 * 3. Xử lý các logic nghiệp vụ như Tìm kiếm việc làm (RAG) và gợi ý.
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
   * 
   * @param message Tin nhắn hiện tại của người dùng.
   * @param history Lịch sử chat trước đó (để duy trì ngữ cảnh).
   * @param userId ID người dùng (nếu đã đăng nhập).
   * @param guestId ID khách (nếu chưa đăng nhập).
   * @returns Phản hồi văn bản từ AI.
   */
  async chat(message: string, history: any[], userId?: string, guestId?: string) {
    // 1. Load System Prompt & User Context
    const systemPrompt = await this.promptService.getPrompt('system');
    const userContext = await this.buildUserContext(userId, guestId);
    
    let fullSystemInstruction = `${systemPrompt}\n\n${userContext}`;

    // --- LOGIC: Xử lý sự kiện sau tìm kiếm (Post-Search Context) ---
    // Frontend gửi tín hiệu ngầm dạng: "[SYSTEM_EVENT: Search for \"Java\" completed...]"
    // Server sẽ chặn tin nhắn này, query DB thật, và bơm dữ liệu vào prompt cho AI tóm tắt.
    const searchEventMatch = message.match(/\`[SYSTEM_EVENT: Search for \"(.*?)\" completed/);
    if (searchEventMatch) {
        const query = searchEventMatch[1];
        try {
            // RAG: Retrieval-Augmented Generation (Tìm kiếm dữ liệu thật để bổ sung cho AI)
            const jobs = await this.findSimilarJobs(query, 5);
            const jobData = jobs.map(j => `- ${j.title} (Lương: ${j.salaryMin || 'TT'} - ${j.salaryMax || 'TT'} USD) tại ${j.location}`).join('\n');
            
            fullSystemInstruction += `\n\n=== KẾT QUẢ TÌM KIẾM THỰC TẾ (QUERY: \"${query}\") ===\n${jobData}\n\nNHIỆM VỤ: Hãy tóm tắt ngắn gọn các công việc trên cho người dùng và mời họ ứng tuyển.`;
        } catch (e) {
            console.error("Error fetching jobs for AI context:", e);
        }
    }

    // 2. Define Tools (Định nghĩa công cụ cho AI)
    // AI sẽ quyết định có gọi tool này hay không dựa trên message của user.
    const tools = [{
      name: "perform_search",
      description: "Thực hiện tìm kiếm hoặc gợi ý việc làm dựa trên nhu cầu của người dùng.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Chuỗi từ khóa tìm kiếm đã được tối ưu hóa (ví dụ: 'React Developer Hanoi Senior')." },
          mode: { type: "string", enum: ["search", "suggest"], description: "Chế độ: 'search' cho yêu cầu trực tiếp, 'suggest' cho gợi ý chủ động." }
        },
        required: ["query", "mode"]
      }
    }];

    try {
      // Gọi AI Provider
      const response = await this.aiProvider.chat(
        fullSystemInstruction, 
        history, 
        message, 
        tools
      );

      let finalResponse = response.text || "";

      // 3. Handle Tool Calls (Xử lý khi AI quyết định dùng tool)
      if (response.toolCall && response.toolCall.name === 'perform_search') {
        const { query, mode } = response.toolCall.args;
        const tag = mode === 'suggest' ? 'SUGGEST' : 'SEARCH';
        
        // Nếu AI chỉ gọi tool mà không nói gì, ta thêm câu dẫn mặc định
        if (!finalResponse.trim()) {
            finalResponse = mode === 'suggest' 
                ? `Dựa trên sở thích của bạn, tôi tìm thấy một số công việc phù hợp:` 
                : `Tôi đã tìm kiếm các vị trí "${query}" cho bạn:`
        }
        // Gắn thẻ đặc biệt để Frontend nhận diện và chuyển hướng
        finalResponse += `\n[${tag}: ${query}]`;
      }

      return finalResponse || "Xin lỗi, tôi không thể phản hồi lúc này.";
    } catch (error) {
      console.error("AiService Chat Error:", error);
      throw error;
    }
  }

  /**
   * Xây dựng ngữ cảnh người dùng (User Context) để cá nhân hóa AI.
   * Bao gồm: Thông tin cá nhân, CV Analysis, Lịch sử tìm kiếm/ứng tuyển.
   */
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
        // Feature: CV Semantic Analysis
        const cvMatches = await this.getJobsMatchingCv(userId);
        const cvAnalysisText = cvMatches.length > 0 
            ? `Hệ thống nhận thấy CV của ứng viên có độ tương đồng cao với các vị trí: ${cvMatches.map(j => j.title).join(', ')}. Hãy dùng thông tin này để suy luận về chuyên môn của ứng viên.`
            : 'Chưa có dữ liệu phân tích CV (hoặc chưa upload CV).';

        return this.promptService.getPrompt('user_context', {
            ...defaultVars,
            name: user.name || 'Thành viên',
            skills: user.skills || 'N/A',
            education: user.education || 'N/A',
            experience: 'N/A', 
            search_history: user.searchHistories.map(s => s.query).join(', ') || 'Chưa có dữ liệu',
            application_history: user.applications.map(a => `${a.job.title} (${a.status})`).join(', ') || 'Chưa có dữ liệu',
            cv_analysis: cvAnalysisText
        });
      }
    } else if (guestId) {
      const guestHistory = await this.prisma.searchHistory.findMany({
        where: { guestId }, 
        take: 5, 
        orderBy: { createdAt: 'desc' }, 
        select: { query: true } 
      });
      
      return this.promptService.getPrompt('user_context', {
        ...defaultVars,
        name: 'Khách vãng lai',
        search_history: guestHistory.map(s => s.query).join(', ') || 'Chưa có dữ liệu',
        cv_analysis: 'Không có thông tin CV cho khách vãng lai.'
      });
    }

    return this.promptService.getPrompt('user_context', defaultVars);
  }

  /**
   * Tìm kiếm Job dựa trên CV của người dùng sử dụng Vector Search.
   * Sử dụng pgvector để so sánh embedding của User và Job.
   */
  private async getJobsMatchingCv(userId: string): Promise<{ title: string }[]> {
    try {
        const jobs: any[] = await this.prisma.$queryRawUnsafe(`
            SELECT j.title
            FROM "Job" j, "User" u
            WHERE u.id = '${userId}'
            AND u.embedding IS NOT NULL
            AND j.embedding IS NOT NULL
            AND j."isActive" = true
            ORDER BY j.embedding <=> u.embedding
            LIMIT 3
        `);
        return jobs;
    } catch (e) {
        return [];
    }
  }

  // --- UTILS (Giữ lại để tương thích ngược nếu cần) ---
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
      FROM "Job" WHERE "isActive" = true AND "embedding" IS NOT NULL
      ORDER BY (
        (1 - ("embedding" <=> '${vectorStr}'::vector)) + 
        (CASE WHEN title ILIKE '%${query}%' THEN 0.8 ELSE 0 END)
      ) DESC LIMIT 20
    `);
    if (!results.length) return [];
    
    // Rerank lại bằng AI để đảm bảo chất lượng cao nhất
    const rerankPrompt = `Lọc Job phù hợp với "${query}". Trả về JSON array ID. Danh sách:\n${results.map(c => `ID:${c.id}|${c.title}`).join('\n')}`;
    try {
      const res = await this.aiProvider.generateText(rerankPrompt);
      const validIds: string[] = JSON.parse(res.replace(/```json|```/g, '').trim());
      return results.filter(c => validIds.includes(c.id)).slice(0, limit);
    } catch { return results.slice(0, limit); }
  }
}
