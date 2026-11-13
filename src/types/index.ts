export type NoticeCategory = 'Urgent' | 'Exam' | 'Holiday' | 'Batch' | 'General';

export type BatchShift = 'Morning Batch' | 'Afternoon Batch' | 'Evening Batch' | 'Night Class';

export type EnrollmentStatus = 'Enrolled' | 'Disenrolled' | 'Re-enrolled';

export type FeeDiscountType =
  | 'None'
  | 'Sibling (10%)'
  | 'Merit Scholarship (20%)'
  | 'EWS / Financial Aid (30%)'
  | 'Partial Charity Aid (50%)'
  | 'Full Charity / Free Education (100%)';

export interface StudyCentre {
  id: string;
  centreCode: string;
  name: string;
  location: string;
  phone: string;
  inCharge: string;
  maxCapacity: number; // Up to 600 students
  image: string;
}

export interface InstituteConfig {
  name: string;
  hindiName: string;
  founder: string;
  role: string;
  phone: string;
  phoneDisplay: string;
  email: string;
  address: string;
  landmark: string;
  timings: string;
  established: string;
  heroImage: string;
  directorImage: string;
  maxStudentCapacity: number; // default 600
  studyCentres: StudyCentre[];
}

export interface StaffMember {
  id: string;
  staffCode: string;
  name: string;
  role: string;
  responsibility: string;
  qualification: string;
  phone: string;
  assignedCentreId: string;
  assignedBatchIds: string[];
  shift: string;
}

export interface NoticeItem {
  id: string;
  refNo: string;
  title: string;
  hindiTitle: string;
  date: string;
  category: NoticeCategory;
  isUrgent: boolean;
  isPinned: boolean;
  content: string;
  hindiContent: string;
  applicableClasses: string;
  issuedBy: string;
}

export interface BatchItem {
  id: string;
  batchCode: string; // e.g., BATCH-M1, BATCH-M2
  classNum: number;
  classLevel: string;
  hindiSubtitle: string;
  badge: string;
  timing: string;
  shift: BatchShift;
  centreId: string;
  assignedStaffName: string;
  subjects: string[];
  focusPillars: string[];
  mentor: string;
  totalSeats: number;
  enrolledCount: number;
  medium: string;
  isActive?: boolean;
}

export interface FeePlan {
  classLevel: string;
  classNum: number;
  monthlyFee: number;
  quarterlyFee: number;
  registrationFee: number;
  features: string[];
}

export type AcademicWing = 'All' | 'Primary Class' | 'Secondary Class' | 'High Class';

export interface PromotionRecord {
  id: string;
  date: string;
  fromClass: string;
  fromClassNum: number;
  toClass: string;
  toClassNum: number;
  session: string;
  carryForwardDues: number;
  remarks?: string;
}

export interface FeePaymentItem {
  id: string;
  receiptNo: string;
  date: string;
  monthLabel: string;
  session?: string;
  isPreviousYearClearance?: boolean;
  amount: number;
  mode: 'Cash' | 'UPI / Online' | 'Charity Waiver';
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Authorized Leave';

export interface AttendanceRecord {
  id: string;
  date: string;
  status: AttendanceStatus;
  subjectTopic: string;
  shift: BatchShift;
  markedBy: string;
  remarks?: string;
}

export interface StudentRecord {
  id: string;
  studentIdCode: string; // e.g., STU-2026-001
  studentName: string;
  parentName: string;
  phone: string;
  classLevel: string;
  classNum: number;
  batchId: string;
  batchCode: string;
  shift: BatchShift;
  centreId: string;
  board: 'BSEB (Bihar Board)' | 'CBSE';
  village: string;
  academicSession?: string; // e.g., '2026-27'
  enrollmentDate: string;
  disenrollmentDate?: string;
  reEnrollmentDate?: string;
  enrollmentStatus: EnrollmentStatus;
  baseMonthlyFee: number;
  discountType: FeeDiscountType;
  discountPercent: number;
  isCharitySeat: boolean;
  charityNote?: string;
  netMonthlyFee: number;
  paidAmount?: number;
  previousYearPendingFee?: number;
  previousYearClearedAmount?: number;
  promotedFromClass?: string;
  lastPromotionDate?: string;
  promotionHistory?: PromotionRecord[];
  feePayments?: FeePaymentItem[];
  attendanceRecords?: AttendanceRecord[];
  portalPasswordHash?: string;
  portalPasswordSalt?: string;
  hasCustomPassword?: boolean;
  notes?: string;
}

export type AuthSecurityMode = 'password_or_otp' | 'password' | 'otp' | 'both';

export interface SecurityConfig {
  adminAuthMode: AuthSecurityMode;
  adminPasswordHash: string;
  adminPasswordSalt: string;
  adminOtpPhone: string;
  adminOtpEmail: string;
  requireStudentAuth: boolean;
  allowStudentPasswordLogin: boolean;
  allowStudentOtpLogin: boolean;
  showDemoLoginHelpers: boolean;
  sessionTimeoutMinutes: number;
}

export interface SecurityLogItem {
  id: string;
  timestamp: string;
  actor: string;
  event: string;
  method: 'Password' | 'OTP' | '2FA' | 'System';
  status: 'Success' | 'Failed' | 'Reset';
}

export interface InquiryItem {
  id: string;
  studentName: string;
  parentName: string;
  phone: string;
  classLevel: string;
  batchCode?: string;
  shift?: BatchShift;
  centreId?: string;
  board: 'BSEB (Bihar Board)' | 'CBSE';
  village: string;
  enrollmentDate: string;
  enrollmentType: 'New Enrollment' | 'Re-enrollment' | 'Disenrollment Request';
  discountType: FeeDiscountType;
  isCharitySeat: boolean;
  netMonthlyFee: number;
  message?: string;
  date: string;
  status: 'New' | 'Contacted' | 'Enrolled' | 'Disenrolled' | 'Re-enrolled';
}
