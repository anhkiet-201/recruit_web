// ==========================================
// 1. ENUMS & CONSTANTS
// ==========================================

/**
 * Trạng thái của bài tuyển dụng.
 * Sử dụng String Enum để dễ debug và đọc hiểu trong JSON/Database.
 */
export enum RecruitmentStatus {
  Recruiting = "RECRUITING",
  Stopped = "STOPPED",
}

export enum EmploymentType {
  FullTime = "FULL_TIME",
  Temporary = "TEMPORARY",
  Seasonal = "SEASONAL",
}

export enum ShiftSelection {
  Flexible = "FLEXIBLE", // Được chọn ca
  DayShiftOnly = "DAY_SHIFT_ONLY", // Chỉ ca ngày
  NightShiftOnly = "NIGHT_SHIFT_ONLY", // Chỉ ca đêm
  OfficeHoursOvertime = "OFFICE_HOURS_OVERTIME", // Hành chính tăng ca
  ArrangedByHR = "ARRANGED_BY_HR", // Nhân sự sắp xếp
  RotatingShift = "ROTATING_SHIFT", // Xoay ca
}

// ==========================================
// 2. SALARY CONFIGURATION (Discriminated Unions)
// ==========================================

/**
 * SalaryType đóng vai trò là "Discriminator" (Bộ phân biệt).
 * Giúp TypeScript hiểu chính xác interface nào đang được sử dụng.
 */
export enum SalaryType {
  Monthly = "MONTHLY",
  Shift = "SHIFT",
  Overtime = "OVERTIME",
}

// Interface cơ bản cho lương theo ca (Dùng để tái sử dụng)
export interface ShiftRate {
  readonly standardRate: string; // Lương cơ bản (VND/h hoặc VND/ca)
  readonly sundayRate: string; // Lương chủ nhật
  readonly holidayRate: string; // Lương ngày lễ
}

/**
 * 2.1. Lương theo tháng
 */
export interface MonthlySalary {
  readonly type: SalaryType.Monthly; // Discriminator
  readonly amount: string; // Tổng lương cứng
}

/**
 * 2.2. Lương theo ca (Ngày/Đêm)
 */
export interface ShiftSalary extends ShiftRate {
  readonly type: SalaryType.Shift; // Discriminator
  readonly isNightShift: boolean; // Cờ đánh dấu ca đêm
}

/**
 * 2.3. Lương tăng ca
 * Composition: Chứa cấu trúc ShiftRate bên trong cho ngày và đêm
 */
export interface OvertimeSalary {
  readonly type: SalaryType.Overtime; // Discriminator
  readonly dayShiftOvertime?: ShiftRate;
  readonly nightShiftOvertime?: ShiftRate;
}

/**
 * Union Type chính: Tương đương với `sealed class SalaryConfig` trong Dart.
 * Khi dùng, chỉ cần check `item.type` là TS tự động gợi ý các trường tương ứng.
 */
export type SalaryConfig = MonthlySalary | ShiftSalary | OvertimeSalary;

// ==========================================
// 3. SUPPORTING ENTITIES
// ==========================================

export interface ManagerContact {
  readonly name?: string;
  readonly phoneNumber?: string;
}

export interface WorkShift {
  readonly name: string; // e.g., "Ca 1"
  readonly startTime: string; // Format: "HH:mm"
  readonly endTime: string; // Format: "HH:mm"
}

// ==========================================
// 4. MAIN AGGREGATES
// ==========================================

export interface JobPosition {
  readonly title: string;
  readonly benefits: string[];
  readonly requirements: string[];
  readonly otherRequirements: string[];
  readonly status: RecruitmentStatus;
  readonly employmentTypes: EmploymentType[];

  readonly managers: ManagerContact[];
  readonly shifts: WorkShift[];

  // Quan trọng: Mảng chứa các cấu hình lương đa hình
  readonly salaryPackages: SalaryConfig[];

  readonly environment: string[];
  readonly notes: string[];
  readonly descriptionText?: string;
  readonly shiftSelections: ShiftSelection[];
}

export interface RecruitmentPost {
  readonly id: string;
  readonly companyName: string;
  readonly address: string;
  readonly positions: JobPosition[];
}
