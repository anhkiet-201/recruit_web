export interface JobSearchResultDto {
  id: string;
  title: string;
  content: string;
  location: string;
  imageUrl: string | null;
  jobType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  similarity: number;
}
