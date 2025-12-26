export interface UserProfileDto {
  name: string | null;
  skills: string | null;
  education: string | null;
  location: string | null;
}

export interface SearchHistoryDto {
  query: string;
}

export interface ApplicationContextDto {
  job: {
    title: string;
  } | null;
}

export interface UserContext {
  profile: UserProfileDto | null;
  recentSearches: string[];
  appliedJobs: string[];
}

export interface RawUserContextData {
  name: string | null;
  skills: string | null;
  education: string | null;
  address: string | null;
  searchHistories: SearchHistoryDto[];
  applications: ApplicationContextDto[];
}
