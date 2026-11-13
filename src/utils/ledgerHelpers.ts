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
    }
  | {
      type: 'student-report-card';
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
  advanceCreditNextMonths: number;
  fullSessionRemaining: number;
  prevYearTotalAssigned: number;
  prevYearCleared: number;
  prevYearRemainingDue: number;
  totalCombinedPending: number;
}

const FULL_MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export function formatMonthYearFromDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 7) return 'November 2026';
  const [yStr, mStr] = dateStr.split('-');
  const mIdx = Number(mStr) - 1;
  if (!yStr || mIdx < 0 || mIdx > 11) return 'November 2026';
  return `${FULL_MONTH_NAMES[mIdx]} ${yStr}`;
}

export function getMonthKeyFromDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 7) return '2026-11';
  return dateStr.slice(0, 7);
}

export function getMonthKeyFromLabel(label: string): string | null {
  const found = SESSION_MONTHS.find(
    (m) => m.label.toLowerCase() === label.trim().toLowerCase()
  );
  return found ? found.key : null;
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

  const prevYearClearedFromReceipts = (stu.feePayments || []).reduce((acc, p) => {
    if (typeof p.prevYearClearedPart === 'number') {
      return acc + p.prevYearClearedPart;
    }
    if (p.isPreviousYearClearance || p.session === '2025-26') {
      return acc + p.amount;
    }
    return acc;
  }, 0);

  const prevYearTotalAssigned = stu.previousYearPendingFee || 0;
  const prevYearCleared = Math.max(
    stu.previousYearClearedAmount || 0,
    prevYearClearedFromReceipts
  );
  const prevYearRemainingDue = Math.max(0, prevYearTotalAssigned - prevYearCleared);

  const currentSessionPaid = stu.paidAmount || 0;
  const currentSessionPending = Math.max(0, currentSessionBilled - currentSessionPaid);
  const advanceCreditNextMonths = Math.max(0, currentSessionPaid - currentSessionBilled);
  const fullSessionRemaining = Math.max(0, fullYearSessionFee - currentSessionPaid);
  const totalCombinedPending = currentSessionPending + prevYearRemainingDue;

  return {
    regFee,
    billedMonthsCount,
    currentSessionBilled,
    fullYearSessionFee,
    currentSessionPaid,
    currentSessionPending,
    advanceCreditNextMonths,
    fullSessionRemaining,
    prevYearTotalAssigned,
    prevYearCleared,
    prevYearRemainingDue,
    totalCombinedPending
  };
}

export interface StudentAttendanceSummary {
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  leaveCount: number;
  attendedCount: number;
  attendancePercentage: number;
  hasRecords: boolean;
  standingLabel:
    | 'Excellent Regularity'
    | 'Good Attendance'
    | 'Needs Improvement'
    | 'No Sessions Logged';
  recentLogs: NonNullable<StudentRecord['attendanceRecords']>;
}

export function computeStudentAttendanceSummary(
  stu: StudentRecord
): StudentAttendanceSummary {
  const records = stu.attendanceRecords || [];
  const totalSessions = records.length;
  const presentCount = records.filter((r) => r.status === 'Present').length;
  const lateCount = records.filter((r) => r.status === 'Late').length;
  const absentCount = records.filter((r) => r.status === 'Absent').length;
  const leaveCount = records.filter((r) => r.status === 'Authorized Leave').length;
  const attendedCount = presentCount + lateCount;
  const hasRecords = totalSessions > 0;
  const attendancePercentage = hasRecords
    ? Math.round((attendedCount / totalSessions) * 100)
    : 0;

  let standingLabel: StudentAttendanceSummary['standingLabel'] =
    'No Sessions Logged';
  if (hasRecords) {
    if (attendancePercentage >= 85) standingLabel = 'Excellent Regularity';
    else if (attendancePercentage >= 75) standingLabel = 'Good Attendance';
    else standingLabel = 'Needs Improvement';
  }

  return {
    totalSessions,
    presentCount,
    lateCount,
    absentCount,
    leaveCount,
    attendedCount,
    attendancePercentage,
    hasRecords,
    standingLabel,
    recentLogs: records.slice(0, 6)
  };
}

export interface MonthlyLedgerRow {
  key: string;
  label: string;
  short: string;
  baseFee: number;
  discountPercent: number;
  netPayable: number;
  backDueCarriedIn: number;
  advanceCreditIn: number;
  totalPayableWithBackDues: number;
  paidAmount: number;
  remainingAmount: number;
  backDueCarriedForward: number;
  isAdvanceAdjusted: boolean;
  isBackDueClearedLater: boolean;
  paidInMonthDisplay: string;
  status:
    | 'Paid'
    | 'Partially Paid'
    | 'Pending'
    | 'Waived'
    | 'Before Admission'
    | 'Disenrolled Break';
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
  const currentMonthKey = '2026-11';
  const nextBillingMonthKey = '2026-12';

  // Build chronological credit queue from session receipts
  const sessionReceiptsChrono = (stu.feePayments || [])
    .map((p, idx) => {
      const sessionAmt =
        typeof p.sessionPaidPart === 'number'
          ? p.sessionPaidPart
          : p.isPreviousYearClearance || p.session === '2025-26'
          ? 0
          : p.amount;
      return {
        receipt: p,
        sessionAmt,
        orderIdx: idx
      };
    })
    .filter((x) => x.sessionAmt > 0)
    .sort((a, b) => {
      const cmp = (a.receipt.date || '').localeCompare(b.receipt.date || '');
      return cmp !== 0 ? cmp : b.orderIdx - a.orderIdx;
    });

  // Deduct registration fee from earliest receipt(s)
  let regLeft = fin.regFee;
  let receiptTuitionSum = 0;
  const creditQueue: {
    receiptNo: string;
    date: string;
    paidInMonth: string;
    monthKey: string;
    remaining: number;
  }[] = [];

  for (const item of sessionReceiptsChrono) {
    let amt = item.sessionAmt;
    if (regLeft > 0) {
      const regUsed = Math.min(regLeft, amt);
      regLeft -= regUsed;
      amt -= regUsed;
    }
    if (amt > 0) {
      receiptTuitionSum += amt;
      const rDate = item.receipt.date || stu.enrollmentDate || '2026-07-01';
      const paidInMo =
        item.receipt.paidInMonth || formatMonthYearFromDate(rDate);
      const rMonthKey =
        getMonthKeyFromLabel(paidInMo) || getMonthKeyFromDate(rDate);
      creditQueue.push({
        receiptNo: item.receipt.receiptNo,
        date: rDate,
        paidInMonth: paidInMo,
        monthKey: rMonthKey,
        remaining: amt
      });
    }
  }

  // Account for any seed/opening balance not represented by receipt records
  const totalTuitionPool = Math.max(0, fin.currentSessionPaid - fin.regFee);
  if (totalTuitionPool > receiptTuitionSum) {
    const openingDiff = totalTuitionPool - receiptTuitionSum;
    creditQueue.unshift({
      receiptNo: 'OPENING-BAL',
      date: stu.enrollmentDate || '2026-07-01',
      paidInMonth: formatMonthYearFromDate(stu.enrollmentDate || '2026-07-01'),
      monthKey: enrollMonthKey,
      remaining: openingDiff
    });
  }

  let runningBackDue = 0;

  return SESSION_MONTHS.map((m) => {
    const isBeforeAdmission = m.key < enrollMonthKey;
    const isDuringDisenrolledBreak =
      disenrollMonthKey !== null &&
      m.key > disenrollMonthKey &&
      (reEnrollMonthKey === null || m.key < reEnrollMonthKey);

    const isWaived = stu.isCharitySeat || stu.netMonthlyFee === 0;
    const isInactive = isBeforeAdmission || isDuringDisenrolledBreak;
    const netPayable = isInactive ? 0 : stu.netMonthlyFee;

    const backDueCarriedIn =
      m.key <= nextBillingMonthKey && !isInactive && !isWaived ? runningBackDue : 0;

    let status: MonthlyLedgerRow['status'] = 'Pending';
    let paidForMonth = 0;
    let advanceCreditIn = 0;
    let isAdvanceAdjusted = false;
    let isBackDueClearedLater = false;
    const appliedCredits: {
      receiptNo: string;
      date: string;
      paidInMonth: string;
      monthKey: string;
      amount: number;
    }[] = [];

    if (isBeforeAdmission) {
      status = 'Before Admission';
    } else if (isDuringDisenrolledBreak) {
      status = 'Disenrolled Break';
    } else if (isWaived) {
      status = 'Waived';
    } else {
      let need = netPayable;
      for (const cred of creditQueue) {
        if (need <= 0) break;
        if (cred.remaining <= 0) continue;
        const take = Math.min(need, cred.remaining);
        cred.remaining -= take;
        need -= take;
        paidForMonth += take;

        if (cred.monthKey < m.key) {
          advanceCreditIn += take;
          isAdvanceAdjusted = true;
        } else if (cred.monthKey > m.key) {
          isBackDueClearedLater = true;
        }

        appliedCredits.push({
          receiptNo: cred.receiptNo,
          date: cred.date,
          paidInMonth: cred.paidInMonth,
          monthKey: cred.monthKey,
          amount: take
        });
      }

      if (paidForMonth >= netPayable && netPayable > 0) {
        status = 'Paid';
      } else if (paidForMonth > 0) {
        status = 'Partially Paid';
      } else {
        status = 'Pending';
      }
    }

    const remainingAmount =
      isInactive || isWaived ? 0 : Math.max(0, netPayable - paidForMonth);

    if (!isInactive && !isWaived && m.key <= currentMonthKey) {
      runningBackDue += remainingAmount;
    }

    const backDueCarriedForward =
      m.key <= currentMonthKey && !isInactive && !isWaived ? runningBackDue : 0;

    const totalPayableWithBackDues = netPayable + backDueCarriedIn;

    const lastCredit = appliedCredits[appliedCredits.length - 1];
    const receiptNoDisplay = lastCredit
      ? appliedCredits.length > 1
        ? `${lastCredit.receiptNo} (+${appliedCredits.length - 1})`
        : lastCredit.receiptNo
      : '—';

    const receiptDateDisplay = lastCredit ? lastCredit.date : '—';
    const paidInMonthDisplay = lastCredit ? lastCredit.paidInMonth : '—';

    return {
      ...m,
      baseFee: stu.baseMonthlyFee,
      discountPercent: stu.discountPercent,
      netPayable,
      backDueCarriedIn,
      advanceCreditIn,
      totalPayableWithBackDues,
      paidAmount: paidForMonth,
      remainingAmount,
      backDueCarriedForward,
      isAdvanceAdjusted,
      isBackDueClearedLater,
      paidInMonthDisplay,
      status,
      receiptNo: receiptNoDisplay,
      receiptDate: receiptDateDisplay
    };
  });
}

export interface SmartPaymentPreview {
  prevYearCleared: number;
  sessionPaidDelta: number;
  backDuesCleared: number;
  currentMonthPaid: number;
  extraAdvanceToNextMonths: number;
  breakdown: {
    label: string;
    monthKey?: string;
    amount: number;
    type: 'prev-year' | 'back-due' | 'current-month' | 'next-month-advance';
  }[];
  remainingPrevYearAfter: number;
  remainingSessionAfter: number;
  remainingCombinedAfter: number;
}

export function previewSmartPaymentAllocation(
  stu: StudentRecord,
  feePlans: FeePlan[],
  paymentAmount: number,
  paymentDate: string,
  paidInMonthLabel: string,
  includePrevYearDues: boolean
): SmartPaymentPreview {
  const fin = computeStudentFinancials(stu, feePlans);
  const rows = buildMonthlyLedgerRows(stu, feePlans);
  const paidMonthKey =
    getMonthKeyFromLabel(paidInMonthLabel) || getMonthKeyFromDate(paymentDate);

  let remaining = Math.max(0, Math.round(paymentAmount));
  const breakdown: SmartPaymentPreview['breakdown'] = [];

  let prevYearCleared = 0;
  if (includePrevYearDues && fin.prevYearRemainingDue > 0 && remaining > 0) {
    prevYearCleared = Math.min(remaining, fin.prevYearRemainingDue);
    remaining -= prevYearCleared;
    breakdown.push({
      label: 'Prev. Year (2025-26) Back Dues',
      amount: prevYearCleared,
      type: 'prev-year'
    });
  }

  let backDuesCleared = 0;
  let currentMonthPaid = 0;
  let extraAdvanceToNextMonths = 0;

  // Registration fee if unpaid in current session
  const regUnpaid = stu.isCharitySeat
    ? 0
    : Math.max(0, fin.regFee - fin.currentSessionPaid);
  if (regUnpaid > 0 && remaining > 0) {
    const regUsed = Math.min(remaining, regUnpaid);
    remaining -= regUsed;
    backDuesCleared += regUsed;
    breakdown.push({
      label: 'Registration / Kit Fee Due',
      amount: regUsed,
      type: 'back-due'
    });
  }

  // Chronological FIFO across active session months
  for (const row of rows) {
    if (remaining <= 0) break;
    if (
      row.status === 'Before Admission' ||
      row.status === 'Disenrolled Break' ||
      row.status === 'Waived'
    ) {
      continue;
    }
    if (row.remainingAmount <= 0) continue;

    const used = Math.min(remaining, row.remainingAmount);
    remaining -= used;

    if (row.key < paidMonthKey) {
      backDuesCleared += used;
      breakdown.push({
        label: `${row.label} Back Due Cleared`,
        monthKey: row.key,
        amount: used,
        type: 'back-due'
      });
    } else if (row.key === paidMonthKey) {
      currentMonthPaid += used;
      breakdown.push({
        label: `${row.label} Fee Paid`,
        monthKey: row.key,
        amount: used,
        type: 'current-month'
      });
    } else {
      extraAdvanceToNextMonths += used;
      breakdown.push({
        label: `${row.label} Adjusted (Next Month Adv.)`,
        monthKey: row.key,
        amount: used,
        type: 'next-month-advance'
      });
    }
  }

  if (remaining > 0) {
    extraAdvanceToNextMonths += remaining;
    breakdown.push({
      label: 'Advance Credit Carried to Upcoming Session',
      amount: remaining,
      type: 'next-month-advance'
    });
  }

  const sessionPaidDelta = Math.max(0, Math.round(paymentAmount) - prevYearCleared);
  const remainingPrevYearAfter = Math.max(0, fin.prevYearRemainingDue - prevYearCleared);
  const remainingSessionAfter = Math.max(0, fin.currentSessionPending - sessionPaidDelta);

  return {
    prevYearCleared,
    sessionPaidDelta,
    backDuesCleared,
    currentMonthPaid,
    extraAdvanceToNextMonths,
    breakdown,
    remainingPrevYearAfter,
    remainingSessionAfter,
    remainingCombinedAfter: remainingPrevYearAfter + remainingSessionAfter
  };
}
