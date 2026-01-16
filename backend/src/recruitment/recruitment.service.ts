import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { RecruitmentRepository } from './recruitment.repository';
import {
  RecruitmentPost,
  SalaryType,
  RecruitmentStatus,
  ShiftSelection,
  EmploymentType,
} from './model';
import { CreatePostDto } from './recruitment.dto';
import { AiService } from '../ai/ai.service'; // Assuming we can use AiService for embedding

@Injectable()
export class RecruitmentService {
  private readonly logger = new Logger(RecruitmentService.name);
  private readonly embeddingCache = new Map<string, number[]>();

  constructor(
    private readonly repository: RecruitmentRepository,
    private readonly aiService: AiService,
  ) {}

  async createPost(post: CreatePostDto): Promise<RecruitmentPost> {
    this.logger.log(
      `Creating recruitment post for company: ${post.companyName}`,
    );

    // Create the post without embeddings first
    const newPost = await this.repository.createPost(post);
    this.logger.log(
      `Created post ${newPost.id} with ${newPost.positions.length} positions`,
    );

    // Now update embeddings for each position với description đã tối ưu
    for (const pos of newPost.positions) {
      if (pos.id) {
        this.logger.debug(
          `Generating embedding for position: ${pos.title} (${pos.id})`,
        );

        // Use descriptionText from repository if available (which includes rich details like Managers, Shifts)
        // Combine with Company Info for full context
        // Use centralized helper for consistent embedding description
        const description = this.generateDescriptionForEmbedding(newPost, pos);

        const embedding = await this.aiService.generateEmbedding(description);
        this.logger.debug(
          `Generated ${embedding.length}-dim embedding for position ${pos.id}`,
        );

        await this.repository.updateJobPositionEmbedding(pos.id, embedding);
        this.logger.debug(`Saved embedding for position ${pos.id}`);
      }
    }

    this.logger.log(`Successfully created post ${newPost.id} with embeddings`);
    return newPost;
  }

  async findAll(limit: number, offset: number): Promise<RecruitmentPost[]> {
    return this.repository.findAllPosts(limit, offset);
  }

  async findOne(id: string): Promise<RecruitmentPost> {
    const post = await this.repository.findPostById(id);
    if (!post)
      throw new NotFoundException(`Recruitment Post with ID ${id} not found`);
    return post;
  }

  async update(
    id: string,
    updateData: Partial<RecruitmentPost>,
  ): Promise<RecruitmentPost> {
    this.logger.log(`Updating recruitment post: ${id}`);

    // Update post data first
    const updatedPost = await this.repository.updatePost(id, updateData);

    // Re-generate embeddings nếu positions được update
    if (updateData.positions && updateData.positions.length > 0) {
      this.logger.log(
        `Re-generating embeddings for ${updatedPost.positions.length} positions`,
      );

      for (const pos of updatedPost.positions) {
        if (pos.id) {
          this.logger.debug(
            `Re-generating embedding for position: ${pos.title} (${pos.id})`,
          );

          // Use centralized helper for consistent embedding description
          const description = this.generateDescriptionForEmbedding(
            updatedPost,
            pos,
          );

          const embedding = await this.aiService.generateEmbedding(description);
          await this.repository.updateJobPositionEmbedding(pos.id, embedding);
          this.logger.debug(`Updated embedding for position ${pos.id}`);
        }
      }

      this.logger.log(
        `Successfully re-generated all embeddings for post ${id}`,
      );
    }

    return updatedPost;
  }

  async remove(id: string): Promise<void> {
    return this.repository.deletePost(id);
  }

  async searchSemantic(
    query: string,
    page: number = 1,
    limit: number = 10,
    threshold: number = 0.7,
  ): Promise<{
    items: RecruitmentPost[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, ' ');
    const unaccentedQuery = this.removeVietnameseTones(normalizedQuery);

    this.logger.log(
      `Semantic search: "${normalizedQuery}" (unaccented: "${unaccentedQuery}", page=${page}, limit=${limit}, threshold=${threshold})`,
    );

    const startTime = Date.now();
    let embedding: number[] | undefined;
    let finalQuery = normalizedQuery;

    // 0. Query Expansion for short queries (Experimental)
    if (normalizedQuery.length < 15 && !normalizedQuery.includes(' ')) {
      try {
        const expanded = await this.aiService.rewriteQuery(normalizedQuery);
        if (expanded && expanded !== normalizedQuery) {
          this.logger.debug(
            `Expanded query: "${normalizedQuery}" -> "${expanded}"`,
          );
          finalQuery = expanded;
        }
      } catch {
        this.logger.warn('Query expansion failed, using original query');
      }
    }

    // 1. Try to get from cache (using expanded query if applicable)
    const cacheKey = finalQuery;
    if (this.embeddingCache.has(cacheKey)) {
      embedding = this.embeddingCache.get(cacheKey);
      this.logger.debug(`Embedding cache hit for: "${cacheKey}"`);
    } else {
      // 2. Generate new embedding with error handling fallback
      try {
        const embedStartTime = Date.now();
        embedding = await this.aiService.generateEmbedding(finalQuery);
        this.embeddingCache.set(cacheKey, embedding);
        this.logger.debug(
          `Generated query embedding in ${Date.now() - embedStartTime}ms`,
        );

        // Limit cache size to prevent memory leaks (simple LRU-ish approach if needed, but for now just clear if too big)
        if (this.embeddingCache.size > 1000) {
          const firstKeyResult = this.embeddingCache.keys().next();
          if (!firstKeyResult.done) {
            this.embeddingCache.delete(firstKeyResult.value);
          }
        }
      } catch (error) {
        const err = error as Error;
        this.logger.error(
          `Failed to generate embedding for query: "${normalizedQuery}". Falling back to keyword search.`,
          err.stack,
        );
        // embedding stays undefined
      }
    }

    const offset = (page - 1) * limit;

    const result = await this.repository.findSimilarJobs(
      embedding || [], // Pass empty array if embedding failed
      normalizedQuery,
      unaccentedQuery, // Pass unaccented version for keyword matching
      threshold,
      limit,
      offset,
    );

    // 3. AI Re-ranking (Only for the first page and if results exist)
    if (result.items.length > 0 && page === 1 && embedding) {
      const topItems = result.items.slice(0, 10);
      const rerankedIds: string[] = await this.aiService.rerankRecruitmentPosts(
        query,
        topItems.map((item) => item as unknown as Record<string, unknown>),
      );

      if (rerankedIds.length > 0) {
        // Re-sort current items based on AI preference
        const rerankedItems: RecruitmentPost[] = rerankedIds
          .map((id: string) => result.items.find((item) => item.id === id))
          .filter((item): item is RecruitmentPost => !!item);

        // STRICT FILTERING: Discard items from the top 10 that AI did not include
        // We only keep the reranked items. If AI filtered them out, they are likely noise.

        // If we are on page 1, we only want to show high-quality results.
        // We will DISCARD the items that were in the top 10 but not chosen by AI.
        const itemsToKeep = result.items.slice(10); // Keep items beyond the top 10 for pagination consistency if needed

        result.items = [...rerankedItems, ...itemsToKeep];

        // Update total to reflect the filtered results
        const filteredOutFromTop10 = topItems.length - rerankedItems.length;
        if (filteredOutFromTop10 > 0) {
          result.total = Math.max(0, result.total - filteredOutFromTop10);
        }

        this.logger.debug(
          `AI Re-ranked results (Strict). Top ID: ${result.items[0]?.id}, Filtered: ${filteredOutFromTop10}`,
        );
      }
    }

    const totalTime = Date.now() - startTime;
    this.logger.log(
      `Search completed (${embedding ? 'semantic+hybrid' : 'keyword-only'}): ${
        result.items.length
      } results (total: ${result.total}) in ${totalTime}ms`,
    );

    return result;
  }

  private generateDescriptionForEmbedding(
    post: { companyName: string; address: string },
    pos: Partial<RecruitmentPost['positions'][0]>,
  ): string {
    const lines: string[] = [];

    // Header - Core Information
    lines.push(`# VỊ TRÍ: ${pos.title?.toUpperCase() || ''}`);
    lines.push(`CÔNG TY: ${post.companyName}`);
    lines.push(`ĐỊA CHỈ: ${post.address}`);
    lines.push(
      `LOẠI HÌNH: ${
        pos.employmentTypes && pos.employmentTypes.length > 0
          ? pos.employmentTypes
              .map((t) => this.getEmploymentTypeLabel(t))
              .join(', ')
          : 'Toàn thời gian'
      }`,
    );
    lines.push(
      `TRẠNG THÁI: ${
        pos.status === RecruitmentStatus.Recruiting
          ? 'Đang tuyển dụng'
          : 'Đã đóng'
      }`,
    );

    lines.push('');
    lines.push('---');
    lines.push('');

    // Requirements & Other Requirements
    if (
      (pos.requirements && pos.requirements.length > 0) ||
      (pos.otherRequirements && pos.otherRequirements.length > 0)
    ) {
      lines.push('YÊU CẦU CÔNG VIỆC:');
      if (pos.requirements)
        pos.requirements.forEach((r) => lines.push(`- ${r}`));
      if (pos.otherRequirements)
        pos.otherRequirements.forEach((r) => lines.push(`- ${r}`));
      lines.push('');
    }

    // Benefits
    if (pos.benefits && pos.benefits.length > 0) {
      lines.push('PHÚC LỢI & QUYỀN LỢI:');
      pos.benefits.forEach((b) => lines.push(`- ${b}`));
      lines.push('');
    }

    // Salary info - Highly Detailed for Semantic Search
    if (pos.salaryPackages && pos.salaryPackages.length > 0) {
      lines.push('CHẾ ĐỘ LƯƠNG THƯỞNG CHI TIẾT:');
      pos.salaryPackages.forEach((sal) => {
        if (sal.type === SalaryType.Monthly) {
          lines.push(`- Lương tháng: ${sal.amount || 'Thỏa thuận'}`);
        } else if (sal.type === SalaryType.Shift) {
          lines.push(
            `- Lương theo ca ${sal.isNightShift ? 'đêm' : 'ngày'}: ${
              sal.standardRate || 'Thỏa thuận'
            }`,
          );
          if (sal.sundayRate)
            lines.push(`  + Lương Chủ Nhật: ${sal.sundayRate}`);
          if (sal.holidayRate)
            lines.push(`  + Lương Ngày Lễ: ${sal.holidayRate}`);
        } else if (sal.type === SalaryType.Overtime) {
          lines.push(`- Chế độ tăng ca:`);
          if (sal.dayShiftOvertime) {
            lines.push(
              `  + Tăng ca ngày: Cơ bản ${sal.dayShiftOvertime.standardRate}, CN ${sal.dayShiftOvertime.sundayRate}, Lễ ${sal.dayShiftOvertime.holidayRate}`,
            );
          }
          if (sal.nightShiftOvertime) {
            lines.push(
              `  + Tăng ca đêm: Cơ bản ${sal.nightShiftOvertime.standardRate}, CN ${sal.nightShiftOvertime.sundayRate}, Lễ ${sal.nightShiftOvertime.holidayRate}`,
            );
          }
        }
      });
      lines.push('');
    }

    // Environment - Added for exhaustive coverage
    if (pos.environment && pos.environment.length > 0) {
      lines.push('MÔI TRƯỜNG LÀM VIỆC:');
      pos.environment.forEach((e) => lines.push(`- ${e}`));
      lines.push('');
    }

    // Shifts
    if (pos.shifts && pos.shifts.length > 0) {
      lines.push('CA LÀM VIỆC:');
      pos.shifts.forEach((s) =>
        lines.push(`- ${s.name}: ${s.startTime} - ${s.endTime}`),
      );
      lines.push('');
    }

    // Shift Selections
    if (pos.shiftSelections && pos.shiftSelections.length > 0) {
      const selections = pos.shiftSelections.map((s) =>
        this.getShiftSelectionLabel(s),
      );
      lines.push(`CÁCH THỨC ĐI CA: ${selections.join(', ')}`);
      lines.push('');
    }

    // Managers / Contacts - Added for exhaustive coverage
    if (pos.managers && pos.managers.length > 0) {
      lines.push('THÔNG TIN LIÊN HỆ & QUẢN LÝ:');
      pos.managers.forEach((m) => {
        const name = m.name || 'Người quản lý';
        const phone = m.phoneNumber || '';
        lines.push(`- ${name}${phone ? ` (${phone})` : ''}`);
      });
      lines.push('');
    }

    // Notes
    if (pos.notes && pos.notes.length > 0) {
      lines.push('GHI CHÚ QUAN TRỌNG:');
      pos.notes.forEach((n) => lines.push(`- ${n}`));
      lines.push('');
    }

    // Raw Description text if any
    if (pos.descriptionText) {
      lines.push('MÔ TẢ CHI TIẾT BỔ SUNG:');
      lines.push(pos.descriptionText);
    }

    return lines
      .filter((l) => l !== undefined && l !== null)
      .join('\n')
      .trim();
  }

  private getShiftSelectionLabel(selection: ShiftSelection): string {
    switch (selection) {
      case ShiftSelection.Flexible:
        return 'Linh hoạt (Được chọn ca)';
      case ShiftSelection.DayShiftOnly:
        return 'Chỉ ca ngày';
      case ShiftSelection.NightShiftOnly:
        return 'Chỉ ca đêm';
      case ShiftSelection.OfficeHoursOvertime:
        return 'Hành chính có tăng ca';
      case ShiftSelection.ArrangedByHR:
        return 'Nhân sự sắp xếp';
      case ShiftSelection.RotatingShift:
        return 'Xoay ca';
      default:
        return selection;
    }
  }

  private getEmploymentTypeLabel(type: EmploymentType): string {
    switch (type) {
      case EmploymentType.FullTime:
        return 'Toàn thời gian';
      case EmploymentType.Temporary:
        return 'Thời vụ';
      case EmploymentType.Seasonal:
        return 'Mùa vụ';
      default:
        return type;
    }
  }
  private removeVietnameseTones(str: string): string {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
    str = str.replace(/ò|ó|ọ|ỏ|ã|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
    str = str.replace(/đ/g, 'd');
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
    str = str.replace(/Đ/g, 'D');
    // Some system encode vietnamese combining accent as individual utf-8 characters

    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ''); // ̀ ́ ̃ ̉ ̣
    str = str.replace(/\u02C6|\u0306|\u031B/g, ''); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
    // Remove extra spaces
    str = str.replace(/\s+/g, ' ');
    str = str.trim();
    return str;
  }

  async generateJobPosting(postId: string, positionId: string): Promise<any> {
    const post = await this.repository.findPostById(postId);
    if (!post) throw new NotFoundException('Recruitment post not found');

    const position = post.positions.find((p) => p.id === positionId);
    if (!position) throw new NotFoundException('Job position not found');

    // Prepare data for AI
    const dataForAi = {
      companyName: post.companyName,
      address: post.address,
      ...position,
    };

    return this.aiService.generateJobPosting(postId, positionId, dataForAi);
  }
}
