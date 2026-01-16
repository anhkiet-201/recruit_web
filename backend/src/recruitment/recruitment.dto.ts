import {
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  RecruitmentStatus,
  SalaryType,
  ShiftSelection,
  EmploymentType,
} from './model';

export class ShiftRateDto {
  @IsString()
  standardRate: string;

  @IsString()
  sundayRate: string;

  @IsString()
  holidayRate: string;
}

export class MonthlySalaryDto {
  @IsEnum(SalaryType)
  type: SalaryType.Monthly;

  @IsString()
  amount: string;
}

export class ShiftSalaryDto extends ShiftRateDto {
  @IsEnum(SalaryType)
  type: SalaryType.Shift;

  @IsBoolean()
  isNightShift: boolean;
}

export class OvertimeSalaryDto {
  @IsEnum(SalaryType)
  type: SalaryType.Overtime;

  @ValidateNested()
  @IsOptional()
  @Type(() => ShiftRateDto)
  dayShiftOvertime?: ShiftRateDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => ShiftRateDto)
  nightShiftOvertime?: ShiftRateDto;
}

export class ManagerContactDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;
}

export class WorkShiftDto {
  @IsString()
  name: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;
}

export class CreatePositionDto {
  @IsString()
  title: string;

  @IsEnum(RecruitmentStatus)
  status: RecruitmentStatus;

  @IsArray()
  @IsEnum(EmploymentType, { each: true })
  employmentTypes: EmploymentType[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object, {
    discriminator: {
      property: 'type',
      subTypes: [
        { value: MonthlySalaryDto, name: SalaryType.Monthly },
        { value: ShiftSalaryDto, name: SalaryType.Shift },
        { value: OvertimeSalaryDto, name: SalaryType.Overtime },
      ],
    },
  })
  salaryPackages: (MonthlySalaryDto | ShiftSalaryDto | OvertimeSalaryDto)[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManagerContactDto)
  managers: ManagerContactDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkShiftDto)
  shifts: WorkShiftDto[];

  @IsArray()
  @IsString({ each: true })
  requirements: string[];

  @IsArray()
  @IsString({ each: true })
  benefits: string[];

  @IsArray()
  @IsString({ each: true })
  otherRequirements: string[];

  @IsArray()
  @IsString({ each: true })
  environment: string[];

  @IsArray()
  @IsString({ each: true })
  notes: string[];

  @IsOptional()
  @IsString()
  descriptionText?: string;

  @IsArray()
  @IsEnum(ShiftSelection, { each: true })
  shiftSelections: ShiftSelection[];
}

export class CreatePostDto {
  @IsString()
  companyName: string;

  @IsString()
  address: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePositionDto)
  positions: CreatePositionDto[];
}

// Search DTOs
export class SearchRecruitmentQueryDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsString()
  page?: string = '1';

  @IsOptional()
  @IsString()
  limit?: string = '10';

  @IsOptional()
  @IsString()
  threshold?: string = '0.6';
}
