import { Prisma } from '@prisma/client';

export interface JobDto {
  title?: string;
  content?: string;
  location?: string;
  imageUrl?: string;
  jobType?: string;
  status?: Prisma.EnumJobStatusFieldUpdateOperationsInput | string;
  salaryMin?: number | string;
  salaryMax?: number | string;
  experienceYears?: number | string;
  deadline?: Date | string;
}
