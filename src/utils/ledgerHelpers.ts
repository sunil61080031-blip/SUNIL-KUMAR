import { AcademicWing, FeePlan, StudentRecord } from '../types';

export type PdfExportRequest =
  | {
      type: 'register';
      students: StudentRecord[];
      filterTitle?: string;
    }
  | {
      type: 'student-ledger';
      studentId: string;
    };

export const SESSION_MONTHS = [
  { key: '2026-06', label: 'June 2026', short: 'Jun 26' },
  { key: '2026-07', label: 'July 2026', short: 'Jul 26' },
  { key: '2026-08', label: 'August 2026', short: 'Aug 26' },
  { key: '2026-09', label: 'September 2026', short: 'Sep 26' },
  { key: '2026-10', label: 'October 2026', short: 'Oct 26' },
  { key: '2026-11', label: 'November 2026', short: 'Nov 26' },
  { key: '2026-12', label: 'December 2026', short: 'Dec 26' },
  { key: '2027-01', label: 'January 2027', short: 'Jan 27' },
  { key: '2027-02', label: 'February 2027', short: 'Feb 27' },
  { key: '2027-03', label: 'March 2027', short: 'Mar 27' },
  { key: '2027-04', label: 'April 2027', short: 'Apr 27' },
  { key: '2027-05', label: 'May 2027', short: 'May 27' }
];

export const ALL_CLASSES = [
  {
    classNum: 0,
    shortLabel: 'Nursery / UKG',
    fullLabel: 'Nursery, LKG & UKG',
    wing: 'Primary Class' as AcademicWing
  },
  {
    classNum: 1,
    shortLabel: 'Class 1st',
    fullLabel: 'Class 1st (Primary Batch)',
    wing: 'Primary Class' as AcademicWing
  },
  {
    classNum: 2,
    shortLabel: 'Class 2nd',
    fullLabel: 'Class 2nd (Primary Batch)',
    wing: 'Primary Class' as AcademicWing
  },
  {
    classNum: 3,
    shortLabel: 'Class 3rd',
    fullLabel: 'Class 3rd (Primary Batch)',
    wing: 'Primary Class' as AcademicWing
  },
  {
    classNum: 4,
    shortLabel: 'Class 4th',
    fullLabel: 'Class 4th (Primary Batch)',
    wing: 'Primary Class' as AcademicWing
  },
  {
    classNum: 5,
    shortLabel: 'Class 5th',
    fullLabel: 'Class 5th (Primary Batch)',
    wing: 'Primary Class' as AcademicWing
  },
  {
    classNum: 6,
    shortLabel: 'Class 6th',
    fullLabel: 'Class 6th (Middle School Batch)',
    wing: 'Secondary Class' as AcademicWing
  },
  {
    classNum: 7,
    shortLabel: 'Class 7th',
    fullLabel: 'Class 7th (Middle School Batch)',
    wing: 'Secondary Class' as AcademicWing
  },
  {
    classNum: 8,
    shortLabel: 'Class 8th',
    fullLabel: 'Class 8th (Middle School Batch)',
    wing: 'Secondary Class' as AcademicWing
  },
  {
    classNum: 9,
    shortLabel: 'Class 9th',
    fullLabel: 'Class 9th (High School Foundation)',
    wing: 'Secondary Class' as AcademicWing
  },
  {
    classNum: 10,
    shortLabel: 'Class 10th',
    fullLabel: 'Class 10th (Matric Target)',
    wing: 'Secondary Class' as AcademicWing
  },
  {
    classNum: 11,
    shortLabel: 'Class 11th',
    fullLabel: 'Class 11th (I.Sc / I.A Foundation)',
    wing: 'High Class' as AcademicWing
  },
  {
    classNum: 12,
    shortLabel: 'Class 12th',
    fullLabel: 'Class 12th (Intermediate Board)',
    wing: 'High Class' as AcademicWing
  }
];

export function getWingForClass(classNum: number): Exclude<AcademicWing, 'All'> {
  if (classNum <= 5) return 'Primary Class';
  if (classNum <= 10) return 'Secondary Class';
  return 'High Class';
}

export interface StudentFinancials {
  regFee: number;
  billedMonthsCount: number;
  currentSessionBilled: number;
  fullYearSessionFee: number;
  currentSessionPaid: number;
  currentSessionPending: number;
  fullSessionRemaining: number;
  prevYearTotalAssigned: number;
  prevYearCleared: number;
  prevYearRemainingDue: number;
  totalCombinedPending: number;
}

export function computeStudentFinancials(
  stu: StudentRecord,
  feePlans: FeePlan[]
): StudentFinancials {
  const plan = feePlans.find((fp) => fp.classNum === stu.classNum);
  const regFee = stu.isCharitySeat ? 0 : plan ? plan.registrationFee : 200;

  const enrollMonthKey = (stu.enrollmentDate || '2026-07-01').slice(0, 7);
  const currentMonthKey = '2026-11';
  const activeMonthsElapsed = SESSION_MONTHS.filter(
    (m) => m.key >= enrollMonthKey && m.key <= currentMonthKey
  ).length;

  const billedMonthsCount = Math.max(1, activeMonthsElapsed);
  const currentSessionBilled = stu.isCharitySeat
    ? 0
    : regFee + stu.netMonthlyFee * billedMonthsCount;

  const fullYearSessionFee = stu.isCharitySeat ? 0 : regFee + stu.netMonthlyFee * 10;

  const prevYearClearedFromReceipts = (stu.feePayments || [])
    .filter((p) => p.isPreviousYearClearance || p.session === '2025-26')
    .reduce((acc, p) => acc + p.amount, 0);

  const prevYearTotalAssigned = stu.previousYearPendingFee || 0;
  const prevYearCleared = Math.max(
    stu.previousYearClearedAmount || 0,
    prevYearClearedFromReceipts
  );
  const prevYearRemainingDue = Math.max(0, prevYearTotalAssigned - prevYearCleared);

  const currentSessionPaid = stu.paidAmount || 0;
  const currentSessionPending = Math.max(0, currentSessionBilled - currentSessionPaid);
  const fullSessionRemaining = Math.max(0, fullYearSessionFee - currentSessionPaid);
  const totalCombinedPending = currentSessionPending + prevYearRemainingDue;

  return {
    regFee,
    billedMonthsCount,
    currentSessionBilled,
    fullYearSessionFee,
    currentSessionPaid,
    currentSessionPending,
    fullSessionRemaining,
    prevYearTotalAssigned,
    prevYearCleared,
    prevYearRemainingDue,
    totalCombinedPending
  };
}

export interface MonthlyLedgerRow {
  key: string;
  label: string;
  short: string;
  baseFee: number;
  discountPercent: number;
  netPayable: number;
  paidAmount: number;
  status: 'Paid' | 'Pending' | 'Waived' | 'Before Admission' | 'Disenrolled Break';
  receiptNo: string;
  receiptDate: string;
}

export function buildMonthlyLedgerRows(
  stu: StudentRecord,
  feePlans: FeePlan[]
): MonthlyLedgerRow[] {
  const fin = computeStudentFinancials(stu, feePlans);
  const enrollMonthKey = (stu.enrollmentDate || '2026-07-01').slice(0, 7);
  const disenrollMonthKey = stu.disenrollmentDate
    ? stu.disenrollmentDate.slice(0, 7)
    : null;
  const reEnrollMonthKey = stu.reEnrollmentDate
    ? stu.reEnrollmentDate.slice(0, 7)
    : null;

  let remainingPool = Math.max(0, fin.currentSessionPaid - fin.regFee);

  return SESSION_MONTHS.map((m) => {
    const isBeforeAdmission = m.key < enrollMonthKey;
    const isDuringDisenrolledBreak =
      disenrollMonthKey !== null &&
      m.key > disenrollMonthKey &&
      (reEnrollMonthKey === null || m.key < reEnrollMonthKey);

    const matchingReceipt = (stu.feePayments || []).find(
      (p) =>
        !p.isPreviousYearClearance &&
        p.monthLabel.toLowerCase().includes(m.label.split(' ')[0].toLowerCase())
    );

    let status: MonthlyLedgerRow['status'] = 'Pending';
    let paidForMonth = 0;

    if (isBeforeAdmission) {
      status = 'Before Admission';
    } else if (isDuringDisenrolledBreak) {
      status = 'Disenrolled Break';
    } else if (stu.isCharitySeat || stu.netMonthlyFee === 0) {
      status = 'Waived';
    } else if (matchingReceipt) {
      status = 'Paid';
      paidForMonth = stu.netMonthlyFee;
      remainingPool = Math.max(0, remainingPool - stu.netMonthlyFee);
    } else if (remainingPool >= stu.netMonthlyFee && stu.netMonthlyFee > 0) {
      status = 'Paid';
      paidForMonth = stu.netMonthlyFee;
      remainingPool -= stu.netMonthlyFee;
    } else {
      status = 'Pending';
    }

    return {
      ...m,
      baseFee: stu.baseMonthlyFee,
      discountPercent: stu.discountPercent,
      netPayable:
        status === 'Before Admission' || status === 'Disenrolled Break'
          ? 0
          : stu.netMonthlyFee,
      paidAmount: paidForMonth,
      status,
      receiptNo: matchingReceipt?.receiptNo || (status === 'Paid' ? 'LEDGER-ADJ' : '—'),
      receiptDate: matchingReceipt?.date || (status === 'Paid' ? stu.enrollmentDate : '—')
    };
  });
}
