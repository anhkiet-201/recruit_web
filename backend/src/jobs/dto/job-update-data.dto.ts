import { JobDto } from './job.dto';

export interface JobUpdateData extends JobDto {
  id: string;
}
