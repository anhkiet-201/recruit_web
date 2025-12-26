export interface JobExcelRow {
  Title: string;
  Description: string;
  Location?: string;
  MinSalary?: string | number;
  MaxSalary?: string | number;
  JobType?: string;
  ImageURL?: string;
  Tags?: string | number;
}
