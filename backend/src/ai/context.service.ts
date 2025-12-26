import { Injectable } from '@nestjs/common';
import { AiJobRepository } from './ai.repository';

export interface UserContext {
  profile: any;
  recentSearches: string[];
  appliedJobs: string[];
}

@Injectable()
export class ContextService {
  constructor(private readonly aiRepository: AiJobRepository) {}

  async getUserContext(userId: string): Promise<UserContext> {
    const rawData = await this.aiRepository.getUserContext(userId);

    if (!rawData) {
      return {
        profile: null,
        recentSearches: [],
        appliedJobs: [],
      };
    }

    // Process Skills and Profile
    const profile = {
      name: rawData.name,
      skills: rawData.skills,
      education: rawData.education || 'Not specified',
      location: rawData.address,
    };

    // Extract recent search queries
    const recentSearches = rawData.searchHistories
      .map((h: any) => h.query)
      .filter((q: string) => q)
      .slice(0, 5);

    // Extract applied job titles to understand preference
    const appliedJobs = rawData.applications
      .map((a: any) => a.job?.title)
      .filter((t: string) => t)
      .slice(0, 5);

    return {
      profile,
      recentSearches,
      appliedJobs,
    };
  }

  formatContextString(context: UserContext): string {
    if (!context.profile) return '';

    let contextStr = `USER PROFILE:\nTime: ${new Date().toISOString()}\nName: ${context.profile.name}\nSkills: ${context.profile.skills}\nLocation: ${context.profile.location}\n`;

    if (context.recentSearches.length > 0) {
      contextStr += `RECENT SEARCHES: ${context.recentSearches.join(', ')}\n`;
    }

    if (context.appliedJobs.length > 0) {
      contextStr += `RECENTLY APPLIED: ${context.appliedJobs.join(', ')}\n`;
    }

    return contextStr;
  }
}
