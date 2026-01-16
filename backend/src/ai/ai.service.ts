import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import {
  AI_PROVIDER_TOKEN,
  IAiProvider,
} from './interfaces/ai-provider.interface';
import { PromptService } from './prompt.service';
import { JobsService } from '../jobs/jobs.service';
import { JobSearchResultDto } from './dto/job-search-result.dto';
import {
  ChatHistoryItemDto,
  JobCvMatchDto,
  JobStructuredInputDto,
  PerformSearchToolArgs,
  GetJobDetailToolArgs,
} from './dto/ai-service.dto';
import { OptimizedJobResponseDto } from './dto/optimize-job.dto';

/**
 * Service quản lý logic trí tuệ nhân tạo (AI) trung tâm.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  constructor(
    private prisma: PrismaService,
    private promptService: PromptService,
    @Inject(AI_PROVIDER_TOKEN) private aiProvider: IAiProvider,
    @Inject(forwardRef(() => JobsService))
    private jobsService: JobsService,
  ) {}

  /**
   * Xử lý hội thoại chính với người dùng.
   */
  async chat(
    message: string,
    history: ChatHistoryItemDto[],
    userId?: string,
    guestId?: string,
  ) {
    const systemPrompt = await this.promptService.getPrompt('system');
    const userContext = await this.buildUserContext(userId, guestId);

    let fullSystemInstruction = `${systemPrompt}\n\n${userContext}`;

    const searchEventMatch = message.match(
      /\[SYSTEM_EVENT: Search for "(.*?)" completed/,
    );
    const viewJobEventMatch = message.match(
      /\[SYSTEM_EVENT: View Job ID: (.*?) completed\]/,
    );

    if (searchEventMatch) {
      const query = searchEventMatch[1];
      try {
        const { items: jobs } = await this.findSimilarJobs(query, 1, 5);

        if (jobs.length > 0) {
          const jobData = jobs
            .map((j) => {
              const salary =
                j.salaryMin || j.salaryMax
                  ? `${j.salaryMin || '0'}$ - ${j.salaryMax || '??'}$`
                  : 'Thỏa thuận';
              return `- [ID: ${j.id}] ${j.title} (Lương: ${salary}) tại ${j.location}`;
            })
            .join('\n');

          fullSystemInstruction += `\n\n=== KẾT QUẢ TÌM KIẾM THỰC TẾ TỪ DATABASE (QUERY: "${query}") ===\n${jobData}\n\nNHIỆM VỤ: Dựa vào danh sách trên, hãy giới thiệu ngắn gọn cho người dùng.
QUAN TRỌNG: Khi liệt kê công việc, BẮT BUỘC phải giữ nguyên thẻ [ID: ...] đi kèm tên công việc trong câu trả lời của bạn để hệ thống có thể theo dõi. Ví dụ: "* Lập trình viên [ID: xyz]...".
TUYỆT ĐỐI CHỈ NÓI VỀ CÁC CÔNG VIỆC CÓ TRONG DANH SÁCH NÀY.`;
        } else {
          fullSystemInstruction += `\n\n=== KẾT QUẢ TÌM KIẾM THỰC TẾ (QUERY: "${query}") ===\nKHÔNG TÌM THẤY CÔNG VIỆC NÀO TRONG DATABASE.\n\nNHIỆM VỤ: Hãy thông báo khéo léo cho người dùng là hiện tại chưa có vị trí phù hợp. Tuyệt đối không được bịa ra công việc ảo.`;
        }
      } catch (e) {
        console.error('Error fetching jobs for AI context:', e);
      }
    } else if (viewJobEventMatch) {
      const jobId = viewJobEventMatch[1];
      try {
        const job = await this.jobsService.findOne(jobId);
        if (job) {
          const jobInfo = await this.generateStructuredJobText(job);
          fullSystemInstruction += `\n\n=== NGƯỜI DÙNG ĐANG XEM CHI TIẾT CÔNG VIỆC (ID: ${jobId}) ===\n${jobInfo}\n\nNHIỆM VỤ: Hãy ghi nhớ thông tin job này vào bộ nhớ ngữ cảnh. Không cần phản hồi lại gì cả, trừ khi người dùng hỏi thêm.`;
        }
      } catch (e) {
        console.error('Error fetching job detail for context:', e);
      }
    }
    // ------------------------------------------------------------------

    const tools = [
      {
        name: 'perform_search',
        description:
          'Thực hiện tìm kiếm hoặc gợi ý việc làm dựa trên nhu cầu của người dùng.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Chuỗi từ khóa tìm kiếm đã được tối ưu hóa.',
            },
            mode: {
              type: 'string',
              enum: ['search', 'suggest'],
              description: 'Chế độ tìm kiếm.',
            },
          },
          required: ['query', 'mode'],
        },
      },
      {
        name: 'get_job_detail',
        description:
          'Lấy thông tin chi tiết của một công việc cụ thể khi người dùng hỏi về nó (ID).',
        parameters: {
          type: 'object',
          properties: {
            jobId: {
              type: 'string',
              description:
                'ID của công việc (UUID). BẮT BUỘC phải lấy từ Context/History. Nếu không tìm thấy ID, TUYỆT ĐỐI KHÔNG được hỏi người dùng, mà phải dùng tool `perform_search` để tìm công việc trước.',
            },
          },
          required: ['jobId'],
        },
      },
    ];

    try {
      const response = await this.aiProvider.chat(
        fullSystemInstruction,
        history,
        message,
        tools,
      );

      let finalResponse = response.text || '';

      if (response.toolCall) {
        if (response.toolCall.name === 'perform_search') {
          const { query, mode } = response.toolCall
            .args as unknown as PerformSearchToolArgs;
          const tag = mode === 'suggest' ? 'SUGGEST' : 'SEARCH';

          if (!finalResponse.trim()) {
            finalResponse =
              mode === 'suggest'
                ? 'Dựa trên sở thích của bạn, tôi tìm thấy một số công việc phù hợp:'
                : `Tôi đã tìm kiếm các vị trí "${query}" cho bạn:`;
          }
          finalResponse += `\n[${tag}: ${query}]`;
        } else if (response.toolCall.name === 'get_job_detail') {
          const { jobId } = response.toolCall
            .args as unknown as GetJobDetailToolArgs;
          try {
            const job = await this.jobsService.findOne(jobId);
            if (job) {
              finalResponse =
                `- Tiêu đề: ${job.title}\n` +
                `- Công ty: ${job.author?.name || 'N/A'}\n` +
                `- Mức lương: ${job.salaryMin ? `${job.salaryMin}` : ''} - ${job.salaryMax ? `${job.salaryMax}` : ''}\n` +
                `- Địa điểm: ${job.location}\n` +
                `- Mô tả: ${job.content}\n` +
                `\n[NAVIGATE: /jobs/${job.id}]`;
            } else {
              finalResponse =
                'Xin lỗi, tôi không tìm thấy thông tin công việc này.';
            }
          } catch (_e) {
            console.error('Error fetching job detail:', _e);
            finalResponse =
              'Xin lỗi, có lỗi xảy ra khi lấy thông tin công việc.';
          }
        }
      }

      return finalResponse || 'Xin lỗi, tôi không thể phản hồi lúc này.';
    } catch (error) {
      console.error('AiService Chat Error:', error);
      throw error;
    }
  }

  private async buildUserContext(
    userId?: string,
    guestId?: string,
  ): Promise<string> {
    const defaultVars = {
      name: 'Khách',
      skills: 'N/A',
      education: 'N/A',
      experience: 'N/A',
      search_history: 'Chưa có dữ liệu',
      application_history: 'Chưa có dữ liệu',
      current_page: 'Trang chủ',
      current_time: new Date().toLocaleString('vi-VN'),
      cv_analysis: 'Chưa có dữ liệu.',
    };

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          applications: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { status: true, job: { select: { title: true } } },
          },
          searchHistories: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { query: true },
          },
        },
      });

      if (user) {
        const cvMatches = await this.getJobsMatchingCv(userId);
        const cvAnalysisText =
          cvMatches.length > 0
            ? `Hệ thống nhận thấy CV tương đồng với: ${cvMatches.map((j) => j.title).join(', ')}.`
            : 'Chưa có dữ liệu phân tích CV.';

        // FEATURE: Persistent Search Context
        let lastSearchContext = '';
        if (user.searchHistories.length > 0) {
          const lastQuery = user.searchHistories[0].query;
          const { items: lastJobs } = await this.findSimilarJobs(
            lastQuery,
            1,
            3,
          );
          if (lastJobs.length > 0) {
            lastSearchContext =
              `\n=== KẾT QUẢ TÌM KIẾM GẦN NHẤT CỦA USER ("${lastQuery}") ===\n` +
              lastJobs
                .map((j) => `- [ID: ${j.id}] ${j.title} (${j.location})`)
                .join('\n');
          }
        }

        return this.promptService.getPrompt('user_context', {
          ...defaultVars,
          name: user.name || 'Thành viên',
          skills: user.skills || 'N/A',
          education: user.education || 'N/A',
          search_history:
            user.searchHistories.map((s) => s.query).join(', ') ||
            'Chưa có dữ liệu',
          application_history:
            user.applications
              .map((a) => `${a.job.title} (${a.status})`)
              .join(', ') || 'Chưa có dữ liệu',
          cv_analysis: cvAnalysisText + lastSearchContext,
        });
      }
    } else if (guestId) {
      const guestHistory = await this.prisma.searchHistory.findMany({
        where: { guestId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { query: true },
      });
      return this.promptService.getPrompt('user_context', {
        ...defaultVars,
        name: 'Khách vãng lai',
        search_history:
          guestHistory.map((s) => s.query).join(', ') || 'Chưa có dữ liệu',
      });
    }
    return this.promptService.getPrompt('user_context', defaultVars);
  }

  private async getJobsMatchingCv(userId: string): Promise<JobCvMatchDto[]> {
    try {
      const jobs = await this.prisma.$queryRaw<JobCvMatchDto[]>`
            SELECT j.title FROM "Job" j, "User" u
            WHERE u.id = ${userId}::uuid AND u.embedding IS NOT NULL AND j.embedding IS NOT NULL AND (j."status" = 'ACTIVE' OR j."status" = 'ACCEPTED')
            ORDER BY j.embedding <=> u.embedding LIMIT 3
        `;
      return jobs;
    } catch (_e) {
      console.error('Error fetching jobs matching CV:', _e);
      return [];
    }
  }

  async analyzeResume(
    text: string,
  ): Promise<import('./dto/resume-analysis.dto').ResumeAnalysisResult | null> {
    const prompt = `Trích xuất thông tin từ CV thành JSON với các trường sau: name (Họ tên), phone (SĐT), address (Địa chỉ), education (Học vấn), skills (Kỹ năng), experience (Kinh nghiệm), summary (Tóm tắt ngắn gọn). CV Content: ${text}`;
    try {
      const res = await this.aiProvider.generateText(prompt);
      return JSON.parse(
        res.replace(/```json|```/g, '').trim(),
      ) as import('./dto/resume-analysis.dto').ResumeAnalysisResult;
    } catch (_e) {
      console.error('Error analyzing resume:', _e);
      return null;
    }
  }

  // --- UTILS ---

  async generateStructuredJobText(job: JobStructuredInputDto): Promise<string> {
    const jobType = job.jobType || 'N/A';
    const salaryMin = job.salaryMin ?? '0';
    const salaryMax = job.salaryMax ?? 'Thỏa thuận';
    const experience = job.experience || 'Không yêu cầu';
    const deadline = job.deadline
      ? new Date(job.deadline).toISOString().split('T')[0]
      : 'Không thời hạn';

    const prompt = `Phân tích job: \nTên: ${job.title} \nNội dung: ${job.content} \nKhu vực: ${job.location} \nLoại việc: ${jobType} \nMức lương: ${salaryMin} - ${salaryMax} \nKinh nghiệm: ${experience} \nHạn nộp: ${deadline}`;
    try {
      return (await this.aiProvider.generateText(prompt)).trim();
    } catch {
      return `TITLE: ${job.title}. CONTENT: ${job.content.substring(0, 300)} \nKhu vực: ${job.location} \nLoại việc: ${jobType} \nMức lương: ${salaryMin} - ${salaryMax} \nKinh nghiệm: ${experience} \nHạn nộp: ${deadline}`;
    }
  }

  async embedJob(jobId: string, text: string) {
    const vector = await this.aiProvider.generateEmbedding(text);
    const vectorStr = `[${vector.join(',')}]`;
    await this.prisma
      .$executeRaw`UPDATE "Job" SET "embedding" = ${vectorStr}::vector WHERE "id" = ${jobId}::uuid`;
  }

  async embedUser(userId: string, text: string) {
    const vector = await this.aiProvider.generateEmbedding(text);
    const vectorStr = `[${vector.join(',')}]`;
    await this.prisma
      .$executeRaw`UPDATE "User" SET "embedding" = ${vectorStr}::vector WHERE "id" = ${userId}::uuid`;
  }

  async generateEmbedding(text: string) {
    return this.aiProvider.generateEmbedding(text);
  }

  /**
   * Mở rộng và chuyên nghiệp hóa câu truy vấn tìm kiếm việc làm (Experimental).
   * Ví dụ: "nv vp" -> "nhân viên văn phòng, hành chính nhân sự"
   */
  async rewriteQuery(query: string): Promise<string> {
    const prompt = `
      Bạn là một chuyên gia tuyển dụng. Hãy viết lại câu truy vấn tìm kiếm của người dùng bên dưới để tối ưu hóa khả năng tìm kiếm (SEO & Semantic).
      - Nếu là từ viết tắt, hãy viết đầy đủ (vd: "nv vp" -> "nhân viên văn phòng").
      - Thêm 1-2 từ đồng nghĩa chuyên môn nếu cần.
      - Giữ nguyên ý định gốc.
      - TRẢ VỀ DUY NHẤT CHUỖI CÂU TRUY VẤN MỚI, KHÔNG GIẢI THÍCH.

      Truy vấn: "${query}"
    `;

    try {
      const result = await this.aiProvider.generateText(prompt);
      return result.trim().replace(/^"|"$/g, '');
    } catch (e) {
      this.logger.error(`Failed to rewrite query: ${query}`, e);
      return query;
    }
  }

  async optimizeJobContent(rawText: string): Promise<OptimizedJobResponseDto> {
    const prompt = `
      Bạn là một chuyên gia HR. Nhiệm vụ của bạn là phân tích nội dung tuyển dụng thô dưới đây và trích xuất thông tin thành JSON chuẩn.
      
      Yêu cầu đầu ra (JSON Only):
      {
        "title": "Tiêu đề công việc ngắn gọn, hấp dẫn (Phải bao gồm tên công ty)",
        "content": "Nội dung chi tiết phải định dạng HTML (phải sử dụng các thẻ sau: h3, ul, ol, li, p, br, strong, em, s). Chia thành các mục: Mô tả, Yêu cầu, Quyền lợi. KHÔNG dùng thẻ h1, h2.",
        "location": "Địa điểm làm việc",
        "salaryMin": 10000000 (Số nguyên, nếu không có để null),
        "salaryMax": 20000000 (Số nguyên, nếu không có để null),
        "jobType": "skilled" (Chỉ chọn 1 trong 3 giá trị: "unskilled" (Lao động phổ thông), "skilled" (Lao động có tay nghề/bằng cấp), "professional" (Chuyên gia/Quản lý/Cấp cao)),
        "experienceYears": 1 (Số năm kinh nghiệm yêu cầu, số nguyên. Nếu không yêu cầu ghi 0. Nếu yêu cầu > 0 năm thì ghi số năm),
        "deadline": "2024-12-31T00:00:00.000Z" (ISO Date string. Nếu có hạn nộp thì parse về format này. Nếu không tìm thấy thì để null),
        "skills": ["React", "NodeJS", "Lao động phổ thông", "Điện tử"] (Trích xuất các kỹ năng chuyên môn, công cụ, ngôn ngữ, hoặc chứng chỉ yêu cầu. Tối đa 5-7 tags quan trọng nhất),
      }

      QUAN TRỌNG: 
      - Nếu lương là "Thỏa thuận", "Cạnh tranh" -> salaryMin = null, salaryMax = null.
      - Nếu lương là "Up to 20tr" -> salaryMin = null, salaryMax = 20000000.
      - Nếu lương là "Từ 10tr" -> salaryMin = 10000000, salaryMax = null.
      - "content" phải được format HTML đẹp mắt, sạch sẽ.
      - Về "jobType":
        + "unskilled": Công nhân, bảo vệ, tạp vụ, phục vụ, giao hàng...
        + "skilled": Lập trình viên, kế toán, kỹ sư, nhân viên văn phòng, giáo viên... (Có yêu cầu bằng cấp/kỹ năng cụ thể)
        + "professional": Trưởng phòng, Giám đốc, Quản lý, Senior Expert...
      
      Nội dung thô:
      ${rawText}
    `;

    try {
      const res = await this.aiProvider.generateText(prompt);
      // Clean markdown code blocks if present
      const cleanJson = res.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson) as OptimizedJobResponseDto;
    } catch (e) {
      console.error('Error optimizing job content:', e);
      throw new Error('Failed to analyze job content.');
    }
  }

  async translateJob(
    job: { id: string; title: string; content: string; location: string },
    targetLocale: string,
  ): Promise<{ title: string; content: string; location: string }> {
    if (targetLocale === 'vi')
      return {
        title: job.title,
        content: job.content,
        location: job.location,
      };

    const languageMap: Record<string, string> = {
      en: 'English',
      zh: 'Chinese (Simplified)',
    };

    const targetLang = languageMap[targetLocale] || 'English';

    // 1. Check Cache
    const cached = await this.prisma.jobTranslation.findUnique({
      where: {
        jobId_locale: {
          jobId: job.id,
          locale: targetLocale,
        },
      },
    });

    if (cached) {
      return {
        title: cached.title,
        content: cached.content,
        location: cached.location,
      };
    }

    // 2. Generate Translation
    const prompt = `
      Translate the following Job Posting to ${targetLang}.
      Return the result as a JSON object with keys: "title", "content", "location".
      
      Input:
      Title: ${job.title}
      Location: ${job.location}
      Content: ${job.content}

      Requirements:
      1. Translate explicitly but professional.
      2. Keep HTML tags in "content" intact.
      3. For "location", translate the city/country names if applicable.
      4. JSON format ONLY.
    `;

    try {
      const res = await this.aiProvider.generateText(prompt);
      const cleanJson = res.replace(/```json|```/g, '').trim();
      const translation = JSON.parse(cleanJson) as {
        title: string;
        content: string;
        location: string;
      };

      // 3. Save to Cache
      await this.prisma.jobTranslation.upsert({
        where: {
          jobId_locale: {
            jobId: job.id,
            locale: targetLocale,
          },
        },
        create: {
          jobId: job.id,
          locale: targetLocale,
          title: translation.title,
          content: translation.content,
          location: translation.location,
        },
        update: {
          // If already exists, update content might be useful or just do nothing (idempotent)
          title: translation.title,
          content: translation.content,
          location: translation.location,
        },
      });

      return translation;
    } catch (e) {
      console.error('Error translating job:', e);
      return {
        title: job.title,
        content: job.content,
        location: job.location,
      };
    }
  }

  async findSimilarJobs(
    query: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    items: JobSearchResultDto[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const vector = await this.aiProvider.generateEmbedding(query);
    const vectorStr = `[${vector.join(',')}]`;
    const offset = (page - 1) * limit;

    // Use a soft limit for total to avoid scanning the whole table for vector search
    // or use a separate count query if needed. Here we assume a fixed max relevance window.
    const MAX_RELEVANT_ITEMS = 100;

    const results = await this.prisma.$queryRaw<JobSearchResultDto[]>`
      SELECT id, title, content, location, "imageUrl", "jobType", "salaryMin", "salaryMax", 
             (1 - ("embedding" <=> ${vectorStr}::vector)) as similarity
      FROM "Job" WHERE ("status" = 'ACTIVE' OR "status" = 'ACCEPTED') AND "embedding" IS NOT NULL
      ORDER BY (
        (1 - ("embedding" <=> ${vectorStr}::vector)) + 
        (CASE WHEN title ILIKE ${`%${query}%`} THEN 0.8 ELSE 0 END)
      ) DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Mock total for vector search since exact count of "relevant" items is vague
    const total =
      results.length < limit ? offset + results.length : MAX_RELEVANT_ITEMS;

    if (!results.length) return { items: [], total: 0, page, lastPage: 0 };

    const jobList = results.map((c) => `ID:${c.id}|${c.title}`).join('\n');
    const rerankPrompt = `Lọc Job phù hợp với "${query}". Trả về JSON array ID. Danh sách:\n${jobList}`;

    try {
      const res = await this.aiProvider.generateText(rerankPrompt);
      const cleanJson = res.replace(/```json|```/g, '').trim();
      const validIds = JSON.parse(cleanJson) as string[];
      // Filter but keep original order
      const filtered = results.filter((c) => validIds.includes(c.id));

      // If LLM filters too aggressively, fallback to original top N
      const items = filtered.length > 0 ? filtered : results;
      return {
        items,
        total,
        page,
        lastPage: Math.ceil(total / limit),
      };
    } catch {
      return {
        items: results,
        total,
        page,
        lastPage: Math.ceil(total / limit),
      };
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron() {
    this.logger.debug('Running background translation task...');

    // Find recent jobs that are missing translations (EN or ZH)
    // We limit to 5 per run to avoid rate limits
    const jobsToTranslate = await this.prisma.job.findMany({
      where: {
        AND: [
          { status: 'ACTIVE' }, // Only translate active jobs
          {
            OR: [
              { jobTranslations: { none: { locale: 'en' } } },
              { jobTranslations: { none: { locale: 'zh' } } },
            ],
          },
        ],
      },
      take: 2, // Process small batches
      orderBy: { createdAt: 'desc' },
      include: {
        jobTranslations: true,
      },
    });

    if (jobsToTranslate.length === 0) {
      return;
    }

    this.logger.log(
      `Found ${jobsToTranslate.length} jobs needing translation.`,
    );

    for (const job of jobsToTranslate) {
      const hasEn = job.jobTranslations.some((t) => t.locale === 'en');
      const hasZh = job.jobTranslations.some((t) => t.locale === 'zh');

      if (!hasEn) {
        this.logger.log(`Translating Job ID ${job.id} to English...`);
        await this.translateJob(
          {
            id: job.id,
            title: job.title,
            content: job.content,
            location: job.location,
          },
          'en',
        );
      }

      if (!hasZh) {
        this.logger.log(`Translating Job ID ${job.id} to Chinese...`);
        await this.translateJob(
          {
            id: job.id,
            title: job.title,
            content: job.content,
            location: job.location,
          },
          'zh',
        );
      }
    }
  }
}
