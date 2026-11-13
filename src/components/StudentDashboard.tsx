import React, { useState, useMemo } from 'react';
import {
  StudentRecord,
  BatchItem,
  FeePlan,
  InstituteConfig,
  AcademicWing,
  FeePaymentItem,
  FeeReminderLogItem,
  FeeReminderSettings,
  FeeReminderLanguage
} from '../types';
import {
  Layers,
  GraduationCap,
  IndianRupee,
  Calendar,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Search,
  FileSpreadsheet,
  TrendingUp,
  History,
  UserCheck,
  UserMinus,
  RotateCcw,
  PlusCircle,
  Sparkles,
  Filter,
  Printer,
  FileText,
  MessageCircle,
  BellRing,
  Send,
  Copy,
  Check,
  Trash2,
  Clock,
  Wallet,
  Receipt
} from 'lucide-react';
import {
  PdfExportRequest,
  ALL_CLASSES,
  SESSION_MONTHS,
  getWingForClass,
  computeStudentFinancials as computeFinancialsWithPlans,
  buildMonthlyLedgerRows,
  formatMonthYearFromDate,
  previewSmartPaymentAllocation
} from '../utils/ledgerHelpers';
import {
  buildFeeReminderMessage,
  buildWhatsAppParentUrl,
  computeDaysPastDeadline
} from '../utils/reminderHelpers';

export { getWingForClass };

interface StudentDashboardProps {
  students: StudentRecord[];
  batches: BatchItem[];
  feePlans: FeePlan[];
  instituteConfig: InstituteConfig;
  isAdmin: boolean;
  onRecordFeePayment: (studentId: string, payment: FeePaymentItem) => void;
  onClearPreviousYearFee: (
    studentId: string,
    amountPaid: number,
    mode: 'Cash' | 'UPI / Online',
    newTotalPrevPending?: number,
    meta?: { paidByParentName?: string; remarks?: string; date?: string }
  ) => void;
  onPromoteStudent: (
    studentId: string,
    toClassNum: number,
    toClassLevel: string,
    toBatchCode: string,
    newSession: string,
    carryForwardDues: number,
    remarks?: string
  ) => void;
  onBulkPromoteClass: (
    fromClassNum: number,
    toClassNum: number,
    toClassLevel: string,
    toBatchCode: string,
    newSession: string,
    remarks?: string
  ) => number;
  onDisenrollStudent: (studentId: string, date: string, reason?: string) => void;
  onReEnrollStudent: (studentId: string, date: string, batchCode?: string) => void;
  onOpenPdfExport?: (req: PdfExportRequest) => void;
  feeReminders: FeeReminderLogItem[];
  feeReminderSettings: FeeReminderSettings;
  onUpdateReminderSettings: (settings: FeeReminderSettings) => void;
  onDispatchFeeReminder: (reminder: FeeReminderLogItem) => void;
  onBulkDispatchReminders: (reminders: FeeReminderLogItem[]) => void;
  onClearFeeReminders: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  students,
  batches,
  feePlans,
  instituteConfig,
  feeReminders,
  feeReminderSettings,
  onUpdateReminderSettings,
  onDispatchFeeReminder,
  onBulkDispatchReminders,
  onClearFeeReminders,
  onRecordFeePayment,
  onClearPreviousYearFee,
  onPromoteStudent,
  onBulkPromoteClass,
  onDisenrollStudent,
  onReEnrollStudent,
  onOpenPdfExport
}) => {
  // 1. Wing Filter (All / Primary Class / Secondary Class / High Class)
  const [selectedWing, setSelectedWing] = useState<AcademicWing>('All');
  // 2. Separate Class-Wise Filter ('all' or 0..12)
  const [selectedClassNum, setSelectedClassNum] = useState<number | 'all'>('all');
  // 3. Session Filter & Search
  const [selectedSession, setSelectedSession] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Enrolled' | 'Re-enrolled' | 'Disenrolled'>('All');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'All' | 'Overdue' | 'Cleared'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // 4. Internal Sub-Section Tabs to minimize scrolling
  const [dashboardSubTab, setDashboardSubTab] = useState<
    'directory' | 'ledger' | 'promotion' | 'reminders'
  >('directory');

  // Reminder feedback state
  const [reminderBannerMsg, setReminderBannerMsg] = useState<string | null>(null);
  const [copiedReminderStudentId, setCopiedReminderStudentId] = useState<string | null>(null);
  const [copiedBulkQueue, setCopiedBulkQueue] = useState(false);

  // 5. Selected Student for Ledger / Promotion inspection
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  );

  // Ledger Sub-View: Monthly-Wise vs Session-Wise
  const [ledgerMode, setLedgerMode] = useState<'monthly' | 'session'>('monthly');

  // Parent Partial Payment Collection Log Box State
  const [collectDate, setCollectDate] = useState<string>('2026-11-13');
  const [collectPaidInMonth, setCollectPaidInMonth] = useState<string>('November 2026');
  const [includePrevYearInAuto, setIncludePrevYearInAuto] = useState<boolean>(true);
  const [collectAmount, setCollectAmount] = useState<string>('');
  const [collectMode, setCollectMode] = useState<'Cash' | 'UPI / Online'>('UPI / Online');
  const [collectParentName, setCollectParentName] = useState<string>('');
  const [collectRemarks, setCollectRemarks] = useState<string>('');
  const [collectErrorMsg, setCollectErrorMsg] = useState<string | null>(null);

  // Previous Year Fee Form State
  const [prevPayAmount, setPrevPayAmount] = useState<string>('');
  const [prevPayMode, setPrevPayMode] = useState<'Cash' | 'UPI / Online'>('Cash');
  const [editPrevTotalAmount, setEditPrevTotalAmount] = useState<string>('');
  const [ledgerBannerMessage, setLedgerBannerMessage] = useState<string | null>(null);

  // Individual Promotion Form State
  const [promoTargetClassNum, setPromoTargetClassNum] = useState<number>(11);
  const [promoTargetSession, setPromoTargetSession] = useState<string>('2027-28');
  const [promoTargetBatchCode, setPromoTargetBatchCode] = useState<string>('BATCH-E11');
  const [promoCarryForwardDues, setPromoCarryForwardDues] = useState<boolean>(true);
  const [promoRemarks, setPromoRemarks] = useState<string>('');
  const [promoSuccessMsg, setPromoSuccessMsg] = useState<string | null>(null);

  // Bulk Class Promotion Form State
  const [bulkFromClassNum, setBulkFromClassNum] = useState<number>(10);
  const [bulkToClassNum, setBulkToClassNum] = useState<number>(11);
  const [bulkSession, setBulkSession] = useState<string>('2027-28');
  const [bulkRemarks, setBulkRemarks] = useState<string>(
    'Annual Session Class Promotion with automatic fee carry-forward'
  );

  // Helper to compute fee metrics for any student
  const computeStudentFinancials = (stu: StudentRecord) =>
    computeFinancialsWithPlans(stu, feePlans);

  const daysPastDeadline = useMemo(
    () => computeDaysPastDeadline(feeReminderSettings.activeDeadlineDate),
    [feeReminderSettings.activeDeadlineDate]
  );

  // Overdue students exceeding deadline within current scope
  const overdueReminderTargets = useMemo(() => {
    return students
      .filter((stu) => {
        if (stu.enrollmentStatus === 'Disenrolled') return false;
        const fin = computeFinancialsWithPlans(stu, feePlans);
        return fin.totalCombinedPending > 0;
      })
      .map((stu) => {
        const fin = computeFinancialsWithPlans(stu, feePlans);
        const msg = buildFeeReminderMessage(
          stu,
          fin,
          instituteConfig,
          feeReminderSettings.activeDeadlineDate,
          daysPastDeadline,
          feeReminderSettings.defaultLanguage
        );
        const waUrl = buildWhatsAppParentUrl(stu.phone, msg);
        const latestReminder = feeReminders.find((r) => r.studentId === stu.id) || null;
        return {
          student: stu,
          financials: fin,
          messageText: msg,
          waUrl,
          latestReminder
        };
      });
  }, [
    students,
    feePlans,
    instituteConfig,
    feeReminderSettings.activeDeadlineDate,
    feeReminderSettings.defaultLanguage,
    daysPastDeadline,
    feeReminders
  ]);

  const createAndDispatchReminder = (
    stu: StudentRecord,
    dueAmount: number,
    messageText: string,
    channel: FeeReminderLogItem['channel']
  ) => {
    const newLog: FeeReminderLogItem = {
      id: `rem-${Date.now()}-${stu.id}`,
      studentId: stu.id,
      studentIdCode: stu.studentIdCode,
      studentName: stu.studentName,
      parentName: stu.parentName,
      parentPhone: stu.phone,
      classLevel: stu.classLevel,
      dueAmount,
      deadlineDate: feeReminderSettings.activeDeadlineDate,
      daysPastDeadline,
      channel,
      messageText,
      sentAt: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }),
      status: 'Sent',
      language: feeReminderSettings.defaultLanguage
    };
    onDispatchFeeReminder(newLog);
    setReminderBannerMsg(
      `${channel} fee deadline reminder logged for ${stu.parentName} (${stu.studentName} · ₹${dueAmount.toLocaleString('en-IN')} due).`
    );
  };

  const handleBulkSendInAppReminders = () => {
    if (overdueReminderTargets.length === 0) return;
    const nowStamp = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
    const logs: FeeReminderLogItem[] = overdueReminderTargets.map((item) => ({
      id: `rem-bulk-${Date.now()}-${item.student.id}`,
      studentId: item.student.id,
      studentIdCode: item.student.studentIdCode,
      studentName: item.student.studentName,
      parentName: item.student.parentName,
      parentPhone: item.student.phone,
      classLevel: item.student.classLevel,
      dueAmount: item.financials.totalCombinedPending,
      deadlineDate: feeReminderSettings.activeDeadlineDate,
      daysPastDeadline,
      channel: 'In-App Notification',
      messageText: item.messageText,
      sentAt: nowStamp,
      status: 'Sent',
      language: feeReminderSettings.defaultLanguage
    }));
    onBulkDispatchReminders(logs);
    setReminderBannerMsg(
      `Dispatched ${logs.length} automated In-App Fee Deadline Notifications to parent Student Portal accounts.`
    );
  };

  const handleCopyBulkWhatsAppMessages = async () => {
    if (overdueReminderTargets.length === 0) return;
    const combined = overdueReminderTargets
      .map(
        (t, idx) =>
          `[${idx + 1}] Parent: ${t.student.parentName} (${t.student.phone})\n${t.messageText}`
      )
      .join('\n\n------------------------------\n\n');
    try {
      await navigator.clipboard.writeText(combined);
      setCopiedBulkQueue(true);
      setTimeout(() => setCopiedBulkQueue(false), 2500);
    } catch {
      // Fallback ignored
    }
  };

  // Wing Switching Handler
  const handleSelectWing = (wing: AcademicWing) => {
    setSelectedWing(wing);
    if (selectedClassNum !== 'all') {
      const targetWing = getWingForClass(selectedClassNum);
      if (wing !== 'All' && targetWing !== wing) {
        setSelectedClassNum('all');
      }
    }
  };

  // Available class pills based on selected Wing
  const visibleClasses = useMemo(() => {
    if (selectedWing === 'All') return ALL_CLASSES;
    return ALL_CLASSES.filter((c) => c.wing === selectedWing);
  }, [selectedWing]);

  // Base filtered students (Wing, Class, Session, Enrollment Status, Search)
  const baseFilteredStudents = useMemo(() => {
    return students.filter((stu) => {
      const stuWing = getWingForClass(stu.classNum);
      if (selectedWing !== 'All' && stuWing !== selectedWing) return false;
      if (selectedClassNum !== 'all' && stu.classNum !== selectedClassNum) return false;
      if (
        selectedSession !== 'All' &&
        (stu.academicSession || '2026-27') !== selectedSession
      ) {
        return false;
      }
      if (statusFilter !== 'All' && stu.enrollmentStatus !== statusFilter) return false;

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchId = stu.studentIdCode.toLowerCase().includes(q);
        const matchName = stu.studentName.toLowerCase().includes(q);
        const matchParent = stu.parentName.toLowerCase().includes(q);
        const matchClass = stu.classLevel.toLowerCase().includes(q);
        if (!matchId && !matchName && !matchParent && !matchClass) return false;
      }
      return true;
    });
  }, [
    students,
    selectedWing,
    selectedClassNum,
    selectedSession,
    statusFilter,
    searchQuery
  ]);

  // Overdue summary within current Wing/Class/Session scope (independent of feeStatusFilter)
  const scopeFeeOverview = useMemo(() => {
    return baseFilteredStudents.reduce(
      (acc, stu) => {
        const fin = computeFinancialsWithPlans(stu, feePlans);
        if (fin.totalCombinedPending > 0) {
          acc.overdueCount += 1;
          acc.overdueAmount += fin.totalCombinedPending;
        } else {
          acc.clearedCount += 1;
        }
        return acc;
      },
      { overdueCount: 0, clearedCount: 0, overdueAmount: 0 }
    );
  }, [baseFilteredStudents, feePlans]);

  // Final filtered students list applying Fee Status filter
  const filteredStudents = useMemo(() => {
    if (feeStatusFilter === 'All') return baseFilteredStudents;
    return baseFilteredStudents.filter((stu) => {
      const fin = computeFinancialsWithPlans(stu, feePlans);
      if (feeStatusFilter === 'Overdue') return fin.totalCombinedPending > 0;
      return fin.totalCombinedPending === 0;
    });
  }, [baseFilteredStudents, feeStatusFilter, feePlans]);

  // Aggregate summary metrics for the currently filtered Wing / Class / Fee Status
  const summaryStats = useMemo(() => {
    return filteredStudents.reduce(
      (acc, stu) => {
        const fin = computeFinancialsWithPlans(stu, feePlans);
        acc.studentCount += 1;
        acc.currentPaid += fin.currentSessionPaid;
        acc.currentPending += fin.currentSessionPending;
        acc.prevYearPending += fin.prevYearRemainingDue;
        acc.prevYearCleared += fin.prevYearCleared;
        acc.totalCombinedDue += fin.totalCombinedPending;
        if (fin.totalCombinedPending > 0) acc.overdueCount += 1;
        else acc.clearedCount += 1;
        if (stu.enrollmentStatus === 'Disenrolled') acc.disenrolledCount += 1;
        if (stu.promotedFromClass) acc.promotedCount += 1;
        return acc;
      },
      {
        studentCount: 0,
        currentPaid: 0,
        currentPending: 0,
        prevYearPending: 0,
        prevYearCleared: 0,
        totalCombinedDue: 0,
        overdueCount: 0,
        clearedCount: 0,
        disenrolledCount: 0,
        promotedCount: 0
      }
    );
  }, [filteredStudents, feePlans]);

  // Currently inspected student in Ledger / Promotion tabs
  const activeStudent = useMemo(() => {
    return (
      students.find((s) => s.id === selectedStudentId) ||
      filteredStudents[0] ||
      students[0] ||
      null
    );
  }, [students, selectedStudentId, filteredStudents]);

  const activeFinancials = useMemo(() => {
    if (!activeStudent) return null;
    return computeStudentFinancials(activeStudent);
  }, [activeStudent, feePlans]);

  // Build Monthly-Wise Ledger rows for activeStudent
  const monthlyLedgerRows = useMemo(() => {
    if (!activeStudent) return [];
    return buildMonthlyLedgerRows(activeStudent, feePlans);
  }, [activeStudent, feePlans]);

  // Sync collection form defaults when switching activeStudent
  React.useEffect(() => {
    if (!activeStudent) return;
    setCollectParentName(activeStudent.parentName || '');
    setCollectErrorMsg(null);
    setCollectAmount('');
    setCollectRemarks('');
  }, [activeStudent?.id]);

  // Live preview of FIFO settlement (Prev Year Back Dues -> Prior Month Back Dues -> Paid Month -> Next Month Advance)
  const livePaymentPreview = useMemo(() => {
    const amt = Math.round(Number(collectAmount) || 0);
    if (!activeStudent || amt <= 0) return null;
    return previewSmartPaymentAllocation(
      activeStudent,
      feePlans,
      amt,
      collectDate,
      collectPaidInMonth,
      includePrevYearInAuto
    );
  }, [
    activeStudent,
    feePlans,
    collectAmount,
    collectDate,
    collectPaidInMonth,
    includePrevYearInAuto
  ]);

  // Quick 1-click Pay Month handler (pays remaining balance for the month)
  const handleQuickPayMonth = (monthLabel: string, amount: number) => {
    if (!activeStudent || amount <= 0) return;
    const todayStr = collectDate || new Date().toISOString().slice(0, 10);
    const paidInMo = formatMonthYearFromDate(todayStr);
    const preview = previewSmartPaymentAllocation(
      activeStudent,
      feePlans,
      amount,
      todayStr,
      paidInMo,
      false
    );
    const newPayment: FeePaymentItem = {
      id: `fp-${Date.now()}`,
      receiptNo: `REC-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: todayStr,
      paidInMonth: paidInMo,
      monthLabel:
        preview.extraAdvanceToNextMonths > 0
          ? `${monthLabel} (+₹${preview.extraAdvanceToNextMonths} Adv. Next Mo.)`
          : monthLabel,
      amount,
      prevYearClearedPart: 0,
      sessionPaidPart: amount,
      extraAdvanceAmount: preview.extraAdvanceToNextMonths,
      adjustmentBreakdown: preview.breakdown,
      mode: 'Cash',
      session: activeStudent.academicSession || '2026-27',
      isPartialPayment: false,
      paidByParentName: activeStudent.parentName,
      collectedBy: instituteConfig.founder,
      remarks: `Paid on ${todayStr} (${paidInMo}) for ${monthLabel}`
    };
    onRecordFeePayment(activeStudent.id, newPayment);
    setLedgerBannerMessage(
      `Recorded ₹${amount} on ${todayStr} (Paid in ${paidInMo}, Receipt ${newPayment.receiptNo}) for ${monthLabel}.`
    );
  };

  // Pre-fill Collection Box for Partial Month Payment
  const handlePrefillPartialForMonth = (monthLabel: string, remainingAmt: number) => {
    const suggested = Math.max(50, Math.round(remainingAmt / 2));
    setCollectAmount(String(suggested));
    setCollectRemarks(
      `Partial installment collected in ${collectPaidInMonth} toward ${monthLabel} (₹${remainingAmt} due)`
    );
    setCollectErrorMsg(null);
    const boxEl = document.getElementById('ledger-payment-collection-box');
    if (boxEl) {
      boxEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Submit Parent Partial / Back-Due + Extra Advance Payment Collection
  const handlePartialCollectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent || !activeFinancials) return;
    setCollectErrorMsg(null);

    const amountNum = Math.round(Number(collectAmount) || 0);
    if (amountNum <= 0) {
      setCollectErrorMsg('Please enter a valid collected amount greater than ₹0.');
      return;
    }

    const payerName = collectParentName.trim() || activeStudent.parentName;
    const dateUsed = collectDate || new Date().toISOString().slice(0, 10);
    const paidInMo = collectPaidInMonth || formatMonthYearFromDate(dateUsed);

    const preview = previewSmartPaymentAllocation(
      activeStudent,
      feePlans,
      amountNum,
      dateUsed,
      paidInMo,
      includePrevYearInAuto
    );

    const isPartial = preview.remainingCombinedAfter > 0;
    const summaryTags: string[] = [];
    if (preview.prevYearCleared > 0) {
      summaryTags.push(`Prev. Yr ₹${preview.prevYearCleared}`);
    }
    if (preview.backDuesCleared > 0) {
      summaryTags.push(`Back Dues ₹${preview.backDuesCleared}`);
    }
    if (preview.currentMonthPaid > 0) {
      summaryTags.push(`${paidInMo} ₹${preview.currentMonthPaid}`);
    }
    if (preview.extraAdvanceToNextMonths > 0) {
      summaryTags.push(`Next Mo. Adv. ₹${preview.extraAdvanceToNextMonths}`);
    }

    const receiptMonthLabel =
      summaryTags.length > 0
        ? `Paid in ${paidInMo} (${summaryTags.join(' · ')})`
        : `Paid in ${paidInMo}`;

    const newPayment: FeePaymentItem = {
      id: `fp-${Date.now()}`,
      receiptNo: `${
        preview.extraAdvanceToNextMonths > 0 ? 'ADV' : isPartial ? 'PART' : 'REC'
      }-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: dateUsed,
      paidInMonth: paidInMo,
      monthLabel: receiptMonthLabel,
      session: activeStudent.academicSession || '2026-27',
      prevYearClearedPart: preview.prevYearCleared,
      sessionPaidPart: preview.sessionPaidDelta,
      extraAdvanceAmount: preview.extraAdvanceToNextMonths,
      adjustmentBreakdown: preview.breakdown,
      isPreviousYearClearance: preview.prevYearCleared > 0 && preview.sessionPaidDelta === 0,
      isPartialPayment: isPartial,
      paidByParentName: payerName,
      collectedBy: instituteConfig.founder,
      remarks:
        collectRemarks.trim() ||
        (preview.extraAdvanceToNextMonths > 0
          ? `Cleared previous dues; extra ₹${preview.extraAdvanceToNextMonths} adjusted to next month(s)`
          : isPartial
          ? `Partial installment paid by ${payerName} on ${dateUsed}`
          : `Full dues cleared by ${payerName} on ${dateUsed}`),
      amount: amountNum,
      mode: collectMode
    };

    onRecordFeePayment(activeStudent.id, newPayment);
    setLedgerBannerMessage(
      `Saved ${newPayment.receiptNo}: ₹${amountNum.toLocaleString('en-IN')} collected on ${dateUsed} (Paid in ${paidInMo}). ${
        preview.extraAdvanceToNextMonths > 0
          ? `Previous dues cleared & extra ₹${preview.extraAdvanceToNextMonths.toLocaleString('en-IN')} adjusted forward to next month(s)!`
          : `Remaining Balance Due: ₹${preview.remainingCombinedAfter.toLocaleString('en-IN')}.`
      }`
    );
    setCollectAmount('');
    setCollectRemarks('');
  };

  // Clear Previous Year Pending Fee handler
  const handleClearPrevDueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;
    const paidNum = Number(prevPayAmount) || 0;
    const updatedTotalNum =
      editPrevTotalAmount.trim() !== '' ? Number(editPrevTotalAmount) : undefined;

    if (paidNum <= 0 && updatedTotalNum === undefined) return;

    onClearPreviousYearFee(activeStudent.id, paidNum, prevPayMode, updatedTotalNum);
    setPrevPayAmount('');
    setEditPrevTotalAmount('');
    setLedgerBannerMessage(
      paidNum > 0
        ? `Cleared ₹${paidNum} toward Previous Academic Year (2025-26) pending fee for ${activeStudent.studentName}.`
        : `Updated Previous Academic Year pending fee ledger for ${activeStudent.studentName}.`
    );
  };

  // Open Ledger or Promotion for a specific student
  const inspectStudentInTab = (
    student: StudentRecord,
    targetTab: 'ledger' | 'promotion'
  ) => {
    setSelectedStudentId(student.id);
    const nextNum = Math.min(12, student.classNum + 1);
    setPromoTargetClassNum(nextNum);
    const matchingBatch = batches.find((b) => b.classNum === nextNum);
    if (matchingBatch) setPromoTargetBatchCode(matchingBatch.batchCode);
    setDashboardSubTab(targetTab);
  };

  // Handle Single Student Class Promotion
  const handleSinglePromoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent || !activeFinancials) return;

    const targetClassObj =
      ALL_CLASSES.find((c) => c.classNum === promoTargetClassNum) || ALL_CLASSES[10];
    const carryForwardAmount = promoCarryForwardDues
      ? activeFinancials.currentSessionPending
      : 0;

    onPromoteStudent(
      activeStudent.id,
      targetClassObj.classNum,
      targetClassObj.fullLabel,
      promoTargetBatchCode,
      promoTargetSession,
      carryForwardAmount,
      promoRemarks.trim() ||
        `Promoted from ${activeStudent.classLevel} to ${targetClassObj.fullLabel}`
    );

    setPromoSuccessMsg(
      `${activeStudent.studentName} (${activeStudent.studentIdCode}) promoted to ${targetClassObj.fullLabel} (${promoTargetSession}). Carry-forward dues added to Previous Year Pending Fee: ₹${carryForwardAmount}.`
    );
    setPromoRemarks('');
  };

  // Handle Bulk Class-Wise Promotion
  const handleBulkPromoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClassObj =
      ALL_CLASSES.find((c) => c.classNum === bulkToClassNum) || ALL_CLASSES[10];
    const matchingBatch =
      batches.find((b) => b.classNum === bulkToClassNum) || batches[0];

    const count = onBulkPromoteClass(
      bulkFromClassNum,
      targetClassObj.classNum,
      targetClassObj.fullLabel,
      matchingBatch?.batchCode || 'BATCH-GEN',
      bulkSession,
      bulkRemarks
    );

    setPromoSuccessMsg(
      count > 0
        ? `Bulk Class Promotion Complete: ${count} student(s) promoted from Class ${bulkFromClassNum === 0 ? 'Nursery/UKG' : bulkFromClassNum} to ${targetClassObj.shortLabel} (${bulkSession}). Unpaid dues carried forward.`
        : `No active enrolled students found in Class ${bulkFromClassNum === 0 ? 'Nursery/UKG' : bulkFromClassNum} to promote.`
    );
  };

  return (
    <section
      id="student-dashboard"
      className="py-10 bg-slate-100 border-b border-slate-200 scroll-mt-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header + Academic Wing Switcher (Primary / Secondary / High Class) */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-emerald-800/60 mb-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Layers className="w-3.5 h-3.5" />
                <span>Wing-Wise & Class-Wise Student ERP Dashboard</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Student Academic, Fee Ledger & Class Promotion Dashboard
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Filter by <strong className="text-emerald-300">Primary Class (Nursery–5th)</strong>,{' '}
                <strong className="text-emerald-300">Secondary Class (6th–10th)</strong>,{' '}
                <strong className="text-emerald-300">High Class (11th–12th)</strong>, or inspect{' '}
                <strong className="text-amber-300">each class separately</strong> with monthly/session
                fee ledgers, previous year pending dues & class promotion.
              </p>
            </div>

            {/* 4 Academic Division / Wing Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
              {(
                [
                  { id: 'All', label: 'All Wings', sub: 'Nursery–12th' },
                  { id: 'Primary Class', label: 'Primary Class', sub: 'Nursery to 5th' },
                  { id: 'Secondary Class', label: 'Secondary Class', sub: 'Class 6th to 10th' },
                  { id: 'High Class', label: 'High Class', sub: 'Class 11th & 12th' }
                ] as { id: AcademicWing; label: string; sub: string }[]
              ).map((wing) => {
                const active = selectedWing === wing.id;
                const wingStudents = students.filter((s) =>
                  wing.id === 'All' ? true : getWingForClass(s.classNum) === wing.id
                );
                const wingCount = wingStudents.length;
                const wingOverdueCount = wingStudents.filter(
                  (s) => computeStudentFinancials(s).totalCombinedPending > 0
                ).length;
                return (
                  <button
                    key={wing.id}
                    type="button"
                    onClick={() => handleSelectWing(wing.id)}
                    className={`px-3 py-2 rounded-lg text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold">{wing.label}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          active
                            ? 'bg-emerald-900/70 text-emerald-200'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {wingCount}
                      </span>
                      {wingOverdueCount > 0 && (
                        <span
                          title={`${wingOverdueCount} student(s) with overdue payments`}
                          className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-600 text-white"
                        >
                          {wingOverdueCount} due
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[10px] ${
                        active ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      {wing.sub}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Separate Class-Wise Filter Bar (Nursery to Class 12th) */}
          <div className="pt-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                <span>
                  Access Class-Wise Separately ({selectedWing === 'All' ? 'Nursery to Class 12th' : selectedWing}):
                </span>
              </span>
              {selectedClassNum !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedClassNum('all')}
                  className="text-[11px] font-bold text-amber-300 hover:underline cursor-pointer"
                >
                  Reset to All Classes in {selectedWing}
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedClassNum('all')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedClassNum === 'all'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                }`}
              >
                All {selectedWing === 'All' ? 'Classes' : selectedWing} ({
                  students.filter((s) =>
                    selectedWing === 'All' ? true : getWingForClass(s.classNum) === selectedWing
                  ).length
                })
              </button>

              {visibleClasses.map((cls) => {
                const classStudents = students.filter(
                  (s) => s.classNum === cls.classNum
                );
                const countInClass = classStudents.length;
                const overdueInClass = classStudents.filter(
                  (s) => computeStudentFinancials(s).totalCombinedPending > 0
                ).length;
                const isSelected = selectedClassNum === cls.classNum;
                return (
                  <button
                    key={cls.classNum}
                    type="button"
                    onClick={() => setSelectedClassNum(cls.classNum)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : overdueInClass > 0
                        ? 'bg-slate-800 text-white hover:bg-slate-700 border border-red-500/80'
                        : countInClass > 0
                        ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                        : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800/80'
                    }`}
                    title={
                      overdueInClass > 0
                        ? `${overdueInClass} student(s) overdue in ${cls.shortLabel}`
                        : `${countInClass} student(s) in ${cls.shortLabel}`
                    }
                  >
                    <span>{cls.shortLabel}</span>
                    <span
                      className={`text-[10px] font-mono px-1 rounded ${
                        isSelected
                          ? 'bg-slate-950 text-amber-300'
                          : countInClass > 0
                          ? 'bg-emerald-900/80 text-emerald-300'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {countInClass}
                    </span>
                    {overdueInClass > 0 && (
                      <span
                        className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-900/60"
                        aria-label={`${overdueInClass} overdue`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5 KPI Summary Cards for Selected Wing & Class */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs">
            <p className="text-[11px] font-bold uppercase text-slate-400">
              Filtered Students
            </p>
            <p className="text-xl font-black text-slate-900 font-mono mt-0.5">
              {summaryStats.studentCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Promoted: {summaryStats.promotedCount} · Disenrolled: {summaryStats.disenrolledCount}
            </p>
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-emerald-200 shadow-2xs">
            <p className="text-[11px] font-bold uppercase text-emerald-700">
              Session Fees Paid (2026-27)
            </p>
            <p className="text-xl font-black text-emerald-700 font-mono mt-0.5">
              ₹{summaryStats.currentPaid.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Current academic session receipts
            </p>
          </div>

          <div
            className={`bg-white rounded-xl p-3.5 shadow-2xs border ${
              summaryStats.currentPending > 0 ? 'border-red-300 bg-red-50/40' : 'border-emerald-200'
            }`}
          >
            <p
              className={`text-[11px] font-bold uppercase ${
                summaryStats.currentPending > 0 ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              Current Session Pending
            </p>
            <p
              className={`text-xl font-black font-mono mt-0.5 ${
                summaryStats.currentPending > 0 ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              ₹{summaryStats.currentPending.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Billed months balance due
            </p>
          </div>

          <div
            className={`bg-white rounded-xl p-3.5 shadow-2xs border ${
              summaryStats.prevYearPending > 0 ? 'border-red-300 bg-red-50/40' : 'border-slate-200'
            }`}
          >
            <p
              className={`text-[11px] font-bold uppercase ${
                summaryStats.prevYearPending > 0 ? 'text-red-700' : 'text-slate-500'
              }`}
            >
              Prev. Year Pending (2025-26)
            </p>
            <p
              className={`text-xl font-black font-mono mt-0.5 ${
                summaryStats.prevYearPending > 0 ? 'text-red-700' : 'text-slate-700'
              }`}
            >
              ₹{summaryStats.prevYearPending.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              Cleared: ₹{summaryStats.prevYearCleared.toLocaleString('en-IN')}
            </p>
          </div>

          <div
            className={`rounded-xl p-3.5 border shadow-2xs col-span-2 sm:col-span-1 text-white ${
              summaryStats.totalCombinedDue > 0
                ? 'bg-gradient-to-br from-red-700 to-rose-800 border-red-500'
                : 'bg-emerald-900 border-emerald-700'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <p className="text-[11px] font-bold uppercase text-red-100">
                {summaryStats.totalCombinedDue > 0 ? 'Overdue Collections' : 'Collections Status'}
              </p>
              {summaryStats.totalCombinedDue > 0 ? (
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              )}
            </div>
            <p className="text-xl font-black text-white font-mono mt-0.5">
              ₹{summaryStats.totalCombinedDue.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-red-100/90 mt-0.5 font-semibold">
              {summaryStats.totalCombinedDue > 0
                ? `${summaryStats.overdueCount} student(s) overdue`
                : 'All accounts cleared'}
            </p>
          </div>
        </div>

        {/* Visual Pending Collections Alert Strip */}
        {scopeFeeOverview.overdueCount > 0 ? (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-300 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-extrabold text-red-900">
                  Pending Collections Alert: {scopeFeeOverview.overdueCount} student(s) have overdue fee balances (₹
                  {scopeFeeOverview.overdueAmount.toLocaleString('en-IN')} total due)
                </p>
                <p className="text-[11px] text-red-700">
                  Overdue rows are highlighted in red below for quick follow-up and collection.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDashboardSubTab('reminders')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Send WhatsApp / In-App Reminders ({overdueReminderTargets.length})</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setFeeStatusFilter(feeStatusFilter === 'Overdue' ? 'All' : 'Overdue')
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  feeStatusFilter === 'Overdue'
                    ? 'bg-red-700 text-white shadow-2xs'
                    : 'bg-white text-red-700 border border-red-300 hover:bg-red-100'
                }`}
              >
                {feeStatusFilter === 'Overdue'
                  ? `Showing Overdue Only (${scopeFeeOverview.overdueCount})`
                  : `Show Overdue Only (${scopeFeeOverview.overdueCount})`}
              </button>
              {feeStatusFilter !== 'All' && (
                <button
                  type="button"
                  onClick={() => setFeeStatusFilter('All')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Show All ({baseFilteredStudents.length})
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <p className="text-xs font-bold text-emerald-900">
              All {baseFilteredStudents.length} student(s) in this selection have cleared their billed fee balances.
            </p>
          </div>
        )}

        {/* Sub-Section Navigation Bar (Minimizes vertical scrolling) */}
        <div className="bg-white rounded-xl p-2 border border-slate-200/90 shadow-xs mb-5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDashboardSubTab('directory')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                dashboardSubTab === 'directory'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>1. Class-Wise Student Directory & Lifecycle ({filteredStudents.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setDashboardSubTab('ledger')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                dashboardSubTab === 'ledger'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>2. Monthly-Wise & Session-Wise Fee Ledger + Prev. Year Dues</span>
            </button>

            <button
              type="button"
              onClick={() => setDashboardSubTab('promotion')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                dashboardSubTab === 'promotion'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>3. Class Promotion & Session Upgrade</span>
            </button>

            <button
              type="button"
              onClick={() => setDashboardSubTab('reminders')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                dashboardSubTab === 'reminders'
                  ? 'bg-red-600 text-white shadow-xs'
                  : overdueReminderTargets.length > 0
                  ? 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BellRing className="w-4 h-4" />
              <span>4. Fee Reminders ({overdueReminderTargets.length})</span>
            </button>
          </div>

          {/* Search & Session Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, student, class..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-600 w-44 sm:w-52"
              />
            </div>

            <select
              value={feeStatusFilter}
              onChange={(e) => setFeeStatusFilter(e.target.value as 'All' | 'Overdue' | 'Cleared')}
              className={`px-2.5 py-1.5 border rounded-lg text-xs font-bold ${
                feeStatusFilter === 'Overdue'
                  ? 'bg-red-50 border-red-300 text-red-800'
                  : feeStatusFilter === 'Cleared'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="All">All Fee Status ({baseFilteredStudents.length})</option>
              <option value="Overdue">Overdue Only ({scopeFeeOverview.overdueCount})</option>
              <option value="Cleared">Cleared / No Due ({scopeFeeOverview.clearedCount})</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="All">All Status</option>
              <option value="Enrolled">Enrolled</option>
              <option value="Re-enrolled">Re-enrolled</option>
              <option value="Disenrolled">Disenrolled</option>
            </select>

            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="All">All Sessions</option>
              <option value="2026-27">Session 2026-27</option>
              <option value="2027-28">Session 2027-28</option>
            </select>
          </div>
        </div>

        {/* =================================================================== */}
        {/* SUB-SECTION 1: CLASS-WISE STUDENT DIRECTORY & LIFECYCLE SUMMARY     */}
        {/* =================================================================== */}
        {dashboardSubTab === 'directory' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedWing === 'All' ? 'All Academic Wings' : selectedWing} —{' '}
                  {selectedClassNum === 'all'
                    ? 'All Classes Combined'
                    : ALL_CLASSES.find((c) => c.classNum === selectedClassNum)?.fullLabel}
                </h3>
                <p className="text-xs text-slate-500">
                  Complete view of Date of Admission, Disenrollment Date, Fees Paid, Current Pending,
                  Previous Academic Year Pending Fee, and Class Promotion status.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                  Showing {filteredStudents.length} Student(s)
                </span>
                {onOpenPdfExport && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenPdfExport({
                        type: 'register',
                        students: filteredStudents,
                        filterTitle: `${selectedWing} — ${
                          selectedClassNum === 'all'
                            ? 'All Classes'
                            : ALL_CLASSES.find((c) => c.classNum === selectedClassNum)?.shortLabel
                        }`
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-300" />
                    <span>Export Register PDF</span>
                  </button>
                )}
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-bold text-slate-700">
                  No students found in {selectedWing}{' '}
                  {selectedClassNum !== 'all' ? `(Class ${selectedClassNum})` : ''}.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Select another class pill above or reset filters to view enrolled students.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200">
                      <th className="py-3 px-4">Student & ID</th>
                      <th className="py-3 px-3">Fee Status</th>
                      <th className="py-3 px-3">Wing & Class</th>
                      <th className="py-3 px-3">Admission / Disenrollment Dates</th>
                      <th className="py-3 px-3">Session Fees Paid</th>
                      <th className="py-3 px-3">Current Pending</th>
                      <th className="py-3 px-3">Prev. Year Pending</th>
                      <th className="py-3 px-3">Class Promotion</th>
                      <th className="py-3 px-4 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 text-xs">
                    {filteredStudents.map((stu) => {
                      const fin = computeStudentFinancials(stu);
                      const wing = getWingForClass(stu.classNum);
                      const isOverdue = fin.totalCombinedPending > 0;
                      return (
                        <tr
                          key={stu.id}
                          className={`transition-colors border-l-4 ${
                            isOverdue
                              ? 'bg-red-50/85 hover:bg-red-100/80 border-l-red-600'
                              : stu.isCharitySeat
                              ? 'hover:bg-purple-50/40 border-l-purple-400'
                              : 'hover:bg-slate-50/90 border-l-emerald-500'
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              {isOverdue && (
                                <span
                                  className="w-2 h-2 rounded-full bg-red-600 shrink-0"
                                  title="Overdue fee payment pending"
                                />
                              )}
                              <span
                                className={`font-mono font-bold ${
                                  isOverdue ? 'text-red-700' : 'text-emerald-700'
                                }`}
                              >
                                {stu.studentIdCode}
                              </span>
                            </div>
                            <span className="font-bold text-slate-900 text-sm">
                              {stu.studentName}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              G: {stu.parentName} · {stu.phone}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            {isOverdue ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wide shadow-2xs">
                                  <AlertTriangle className="w-3 h-3" />
                                  Overdue
                                </span>
                                <span className="block font-mono font-extrabold text-red-700 text-[11px]">
                                  ₹{fin.totalCombinedPending.toLocaleString('en-IN')} Due
                                </span>
                              </div>
                            ) : stu.isCharitySeat ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold">
                                <Sparkles className="w-3 h-3" />
                                Charity Waived
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                Paid / Clear
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded mb-1 ${
                                wing === 'Primary Class'
                                  ? 'bg-sky-100 text-sky-800'
                                  : wing === 'Secondary Class'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {wing}
                            </span>
                            <p className="font-bold text-slate-800">{stu.classLevel}</p>
                            <p className="text-[11px] font-mono text-slate-500">
                              {stu.batchCode} · Session {stu.academicSession || '2026-27'}
                            </p>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                                  Adm: {stu.enrollmentDate}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    stu.enrollmentStatus === 'Enrolled'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : stu.enrollmentStatus === 'Re-enrolled'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {stu.enrollmentStatus}
                                </span>
                              </div>
                              {stu.disenrollmentDate ? (
                                <p className="text-[11px] font-semibold text-rose-700">
                                  Disenrolled: {stu.disenrollmentDate}
                                </p>
                              ) : (
                                <p className="text-[11px] text-slate-400">
                                  Disenrolled: —
                                </p>
                              )}
                              {stu.reEnrollmentDate && (
                                <p className="text-[11px] font-semibold text-blue-700">
                                  Re-Enrolled: {stu.reEnrollmentDate}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-3 font-mono">
                            <span className="font-bold text-emerald-700 text-sm">
                              ₹{fin.currentSessionPaid.toLocaleString('en-IN')}
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              Net ₹{stu.netMonthlyFee}/mo
                            </span>
                          </td>

                          <td className="py-3.5 px-3 font-mono">
                            {fin.currentSessionPending > 0 ? (
                              <span className="font-extrabold text-red-700 text-sm">
                                ₹{fin.currentSessionPending.toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                No Due
                              </span>
                            )}
                            <span className="block text-[10px] text-slate-500">
                              of ₹{fin.currentSessionBilled} billed
                            </span>
                          </td>

                          <td className="py-3.5 px-3 font-mono">
                            {fin.prevYearRemainingDue > 0 ? (
                              <div>
                                <span className="font-extrabold text-red-700 text-sm">
                                  ₹{fin.prevYearRemainingDue.toLocaleString('en-IN')}
                                </span>
                                <span className="block text-[10px] text-slate-500">
                                  Cleared: ₹{fin.prevYearCleared}
                                </span>
                              </div>
                            ) : fin.prevYearTotalAssigned > 0 ? (
                              <div>
                                <span className="text-emerald-700 font-bold text-xs">
                                  ₹0 (Cleared)
                                </span>
                                <span className="block text-[10px] text-slate-400">
                                  Paid ₹{fin.prevYearCleared}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">₹0 Nil</span>
                            )}
                          </td>

                          <td className="py-3.5 px-3">
                            {stu.promotedFromClass ? (
                              <div>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                                  <ArrowUpRight className="w-3 h-3" />
                                  Promoted
                                </span>
                                <p className="text-[11px] text-slate-600 mt-0.5 truncate max-w-[140px]">
                                  From: {stu.promotedFromClass}
                                </p>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                Direct Admission
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              {isOverdue && (
                                <a
                                  href={buildWhatsAppParentUrl(
                                    stu.phone,
                                    buildFeeReminderMessage(
                                      stu,
                                      fin,
                                      instituteConfig,
                                      feeReminderSettings.activeDeadlineDate,
                                      daysPastDeadline,
                                      feeReminderSettings.defaultLanguage
                                    )
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() =>
                                    createAndDispatchReminder(
                                      stu,
                                      fin.totalCombinedPending,
                                      buildFeeReminderMessage(
                                        stu,
                                        fin,
                                        instituteConfig,
                                        feeReminderSettings.activeDeadlineDate,
                                        daysPastDeadline,
                                        feeReminderSettings.defaultLanguage
                                      ),
                                      'WhatsApp + In-App'
                                    )
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs"
                                  title={`Send WhatsApp Fee Reminder to ${stu.parentName} (${stu.phone})`}
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>Remind Parent</span>
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => inspectStudentInTab(stu, 'ledger')}
                                className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer ${
                                  isOverdue
                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-2xs'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {isOverdue ? 'Collect / Ledger' : 'Fee Ledger'}
                              </button>
                              {onOpenPdfExport && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenPdfExport({
                                      type: 'student-ledger',
                                      studentId: stu.id
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-200 inline-flex items-center gap-1 cursor-pointer"
                                  title="Export Individual Student Ledger Card PDF"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>Ledger PDF</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => inspectStudentInTab(stu, 'promotion')}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] cursor-pointer"
                              >
                                Promote
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-SECTION 2: MONTHLY-WISE & SESSION-WISE FEE LEDGER + PREV YEAR   */}
        {/* =================================================================== */}
        {dashboardSubTab === 'ledger' && activeStudent && activeFinancials && (
          <div className="space-y-5">
            {/* Student Selector Bar + Admission/Disenrollment Lifecycle Strip */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Select Student for Complete Fee Ledger
                    </label>
                    <select
                      value={activeStudent.id}
                      onChange={(e) => {
                        setSelectedStudentId(e.target.value);
                        setLedgerBannerMessage(null);
                      }}
                      className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    >
                      {students.map((s) => {
                        const sFin = computeStudentFinancials(s);
                        return (
                          <option key={s.id} value={s.id}>
                            {s.studentIdCode} — {s.studentName} ({s.classLevel})
                            {sFin.totalCombinedPending > 0
                              ? ` [OVERDUE ₹${sFin.totalCombinedPending}]`
                              : ' [Paid]'}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {getWingForClass(activeStudent.classNum)}
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-800">
                      Session: {activeStudent.academicSession || '2026-27'}
                    </span>
                    {activeFinancials.totalCombinedPending > 0 ? (
                      <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-red-600 text-white inline-flex items-center gap-1.5 shadow-2xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        OVERDUE: ₹{activeFinancials.totalCombinedPending.toLocaleString('en-IN')} Due
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Fee Status: Cleared
                      </span>
                    )}
                  </div>
                </div>

                {/* Toggle Monthly-Wise vs Session-Wise View + Export Ledger Card PDF */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setLedgerMode('monthly')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        ledgerMode === 'monthly'
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Monthly-Wise Ledger (12 Months)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLedgerMode('session')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        ledgerMode === 'session'
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Session-Wise & Prev. Year Ledger
                    </button>
                  </div>

                  {onOpenPdfExport && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenPdfExport({
                          type: 'student-ledger',
                          studentId: activeStudent.id
                        })
                      }
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-300" />
                      <span>Export Ledger Card (PDF)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Admission Date, Disenrollment Date, Re-Enrollment Date & Quick Lifecycle Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-emerald-700">
                      Date of Admission
                    </p>
                    <p className="text-sm font-black font-mono text-slate-900 mt-0.5">
                      {activeStudent.enrollmentDate}
                    </p>
                  </div>
                  <Calendar className="w-4 h-4 text-emerald-600" />
                </div>

                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-rose-700">
                      Disenrollment Date
                    </p>
                    <p className="text-sm font-black font-mono text-slate-900 mt-0.5">
                      {activeStudent.disenrollmentDate || 'Active (Not Disenrolled)'}
                    </p>
                  </div>
                  {activeStudent.enrollmentStatus !== 'Disenrolled' ? (
                    <button
                      type="button"
                      onClick={() =>
                        onDisenrollStudent(
                          activeStudent.id,
                          new Date().toISOString().slice(0, 10),
                          'Marked disenrolled from Student Dashboard'
                        )
                      }
                      className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <UserMinus className="w-3 h-3" />
                      <span>Disenroll</span>
                    </button>
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                </div>

                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-blue-700">
                      Re-Enrollment Date
                    </p>
                    <p className="text-sm font-black font-mono text-slate-900 mt-0.5">
                      {activeStudent.reEnrollmentDate || '—'}
                    </p>
                  </div>
                  {activeStudent.enrollmentStatus === 'Disenrolled' ? (
                    <button
                      type="button"
                      onClick={() =>
                        onReEnrollStudent(
                          activeStudent.id,
                          new Date().toISOString().slice(0, 10)
                        )
                      }
                      className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Re-Enroll</span>
                    </button>
                  ) : (
                    <UserCheck className="w-4 h-4 text-blue-600" />
                  )}
                </div>

                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                  <p className="text-[10px] font-bold uppercase text-amber-800">
                    Previous Academic Year Pending
                  </p>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-sm font-black font-mono text-rose-700">
                      ₹{activeFinancials.prevYearRemainingDue.toLocaleString('en-IN')} Due
                    </span>
                    <span className="text-[11px] font-mono text-emerald-700 font-bold">
                      Paid: ₹{activeFinancials.prevYearCleared}
                    </span>
                  </div>
                </div>
              </div>

              {ledgerBannerMessage && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-900 text-white text-xs font-bold flex items-center justify-between">
                  <span>{ledgerBannerMessage}</span>
                  <button
                    type="button"
                    onClick={() => setLedgerBannerMessage(null)}
                    className="text-emerald-200 hover:text-white underline text-[11px] cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            {/* PARENT PARTIAL PAYMENT COLLECTION & LOG BOX (Back Dues + Date/Month Paid + Next-Month Advance) */}
            <div
              id="ledger-payment-collection-box"
              className="grid grid-cols-1 lg:grid-cols-12 gap-5"
            >
              {/* Left 5 Cols: Collect Partial / Back-Due + Extra Advance Payment Form */}
              <form
                onSubmit={handlePartialCollectionSubmit}
                className="lg:col-span-5 bg-white rounded-2xl p-5 border-2 border-emerald-200 shadow-xs space-y-3.5"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 mb-1">
                      <Wallet className="w-3 h-3" />
                      <span>Parent Installment & Advance Desk</span>
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      Collect Payment (Back Dues + Next Month Adjust)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Clears previous back dues first; any remaining extra adjusts into the next month automatically.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Total Pending
                    </span>
                    <span
                      className={`font-mono text-base font-black ${
                        activeFinancials.totalCombinedPending > 0
                          ? 'text-red-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      ₹{activeFinancials.totalCombinedPending.toLocaleString('en-IN')}
                    </span>
                    {activeFinancials.advanceCreditNextMonths > 0 && (
                      <span className="block font-mono text-[10px] font-bold text-sky-700">
                        +₹{activeFinancials.advanceCreditNextMonths.toLocaleString('en-IN')} Adv. Credit
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Partial / Full / Advance Preset Buttons */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Quick Partial / Full / Advance Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        label: `50% Mo (₹${Math.max(50, Math.round((activeStudent.netMonthlyFee || 500) / 2))})`,
                        val: Math.max(50, Math.round((activeStudent.netMonthlyFee || 500) / 2))
                      },
                      {
                        label: `1 Mo (₹${activeStudent.netMonthlyFee || 0})`,
                        val: activeStudent.netMonthlyFee || 0
                      },
                      ...(activeFinancials.currentSessionPending > 0
                        ? [
                            {
                              label: `Session Due (₹${activeFinancials.currentSessionPending})`,
                              val: activeFinancials.currentSessionPending
                            }
                          ]
                        : []),
                      ...(activeFinancials.totalCombinedPending > 0
                        ? [
                            {
                              label: `All Back Dues (₹${activeFinancials.totalCombinedPending})`,
                              val: activeFinancials.totalCombinedPending
                            },
                            {
                              label: `Clear + 1 Mo Adv (₹${
                                activeFinancials.totalCombinedPending +
                                (activeStudent.netMonthlyFee || 0)
                              })`,
                              val:
                                activeFinancials.totalCombinedPending +
                                (activeStudent.netMonthlyFee || 0)
                            }
                          ]
                        : [
                            {
                              label: `Advance Next Mo (₹${activeStudent.netMonthlyFee || 500})`,
                              val: activeStudent.netMonthlyFee || 500
                            }
                          ])
                    ]
                      .filter((p) => p.val > 0)
                      .map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setCollectAmount(String(preset.val));
                            setCollectErrorMsg(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-800 hover:text-emerald-900 border border-slate-200 text-[11px] font-bold font-mono transition-colors cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                  </div>
                </div>

                {collectErrorMsg && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                    {collectErrorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      required
                      value={collectDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCollectDate(val);
                        if (val) setCollectPaidInMonth(formatMonthYearFromDate(val));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Paid In Month (Logged Month)
                    </label>
                    <select
                      value={collectPaidInMonth}
                      onChange={(e) => setCollectPaidInMonth(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                    >
                      {SESSION_MONTHS.map((m) => (
                        <option key={m.key} value={m.label}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Amount Collected (₹)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={collectAmount}
                      onChange={(e) => {
                        setCollectAmount(e.target.value);
                        setCollectErrorMsg(null);
                      }}
                      placeholder="e.g. 1200"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={collectMode}
                      onChange={(e) => setCollectMode(e.target.value as 'Cash' | 'UPI / Online')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                    >
                      <option value="UPI / Online">UPI / Online</option>
                      <option value="Cash">Cash at Desk</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Paid By (Parent / Guardian)
                    </label>
                    <input
                      type="text"
                      value={collectParentName}
                      onChange={(e) => setCollectParentName(e.target.value)}
                      placeholder={activeStudent.parentName}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Remarks / Promise Note
                    </label>
                    <input
                      type="text"
                      value={collectRemarks}
                      onChange={(e) => setCollectRemarks(e.target.value)}
                      placeholder="Optional note..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900"
                    />
                  </div>

                  {activeFinancials.prevYearRemainingDue > 0 && (
                    <label className="sm:col-span-2 flex items-start gap-2 p-2.5 rounded-xl bg-rose-50/80 border border-rose-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includePrevYearInAuto}
                        onChange={(e) => setIncludePrevYearInAuto(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-700"
                      />
                      <span className="text-[11px] text-rose-950 leading-snug">
                        <strong>Clear Prev. Year (2025-26) Back Dues First (₹{activeFinancials.prevYearRemainingDue})</strong>{' '}
                        before current session months &amp; next-month advance adjustment.
                      </span>
                    </label>
                  )}
                </div>

                {/* Live Back-Due Clearing & Next-Month Advance Adjustment Preview */}
                {livePaymentPreview && (
                  <div className="p-3 rounded-xl bg-slate-900 text-white space-y-2 text-[11px]">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                      <span className="font-bold text-emerald-300 uppercase tracking-wider text-[10px]">
                        Live Adjustment Preview ({collectPaidInMonth})
                      </span>
                      <span className="font-mono font-bold text-amber-300">
                        Remaining Due: ₹{livePaymentPreview.remainingCombinedAfter.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {livePaymentPreview.breakdown.map((b, i) => (
                        <span
                          key={`${b.label}-${i}`}
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            b.type === 'prev-year'
                              ? 'bg-rose-500/25 text-rose-200 border border-rose-400/40'
                              : b.type === 'back-due'
                              ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                              : b.type === 'current-month'
                              ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                              : 'bg-sky-500/30 text-sky-200 border border-sky-400/50'
                          }`}
                        >
                          {b.label}: ₹{b.amount}
                        </span>
                      ))}
                    </div>

                    {livePaymentPreview.extraAdvanceToNextMonths > 0 && (
                      <p className="text-[10px] text-sky-300 font-semibold">
                        ✓ Previous dues cleared — remaining extra ₹
                        {livePaymentPreview.extraAdvanceToNextMonths.toLocaleString('en-IN')} will be
                        adjusted to the next month(s).
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>
                    Save Payment Log{' '}
                    {Number(collectAmount) > 0
                      ? `(₹${Number(collectAmount).toLocaleString('en-IN')} · ${collectPaidInMonth})`
                      : ''}
                  </span>
                </button>
              </form>

              {/* Right 7 Cols: Payment Collection Log Box */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 mb-1">
                      <Receipt className="w-3 h-3 text-emerald-700" />
                      <span>Payment Collection Log Box</span>
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      Date & Month-Wise Payment Log ({(activeStudent.feePayments || []).length})
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                      Total Paid: ₹
                      {(
                        activeFinancials.currentSessionPaid + activeFinancials.prevYearCleared
                      ).toLocaleString('en-IN')}
                    </span>
                    {onOpenPdfExport && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenPdfExport({
                            type: 'student-ledger',
                            studentId: activeStudent.id
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3 text-amber-300" />
                        <span>Print Log</span>
                      </button>
                    )}
                  </div>
                </div>

                {(activeStudent.feePayments || []).length === 0 ? (
                  <div className="py-10 text-center rounded-xl bg-slate-50 border border-dashed border-slate-300">
                    <p className="text-xs font-bold text-slate-700">
                      No payment collection entries logged yet for {activeStudent.studentName}.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Use the Collection Form on the left to save payment date, paid month &amp; next-month adjustment.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase border-b border-slate-200 z-10">
                        <tr>
                          <th className="py-2 px-3">Receipt, Date & Paid Month</th>
                          <th className="py-2 px-3">Back Dues & Next-Month Adjustment</th>
                          <th className="py-2 px-3">Parent & Remarks</th>
                          <th className="py-2 px-3">Mode</th>
                          <th className="py-2 px-3 text-right">Collected</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70">
                        {(activeStudent.feePayments || []).map((p) => {
                          const paidInMo = p.paidInMonth || formatMonthYearFromDate(p.date);
                          return (
                            <tr
                              key={p.id}
                              className={
                                p.extraAdvanceAmount && p.extraAdvanceAmount > 0
                                  ? 'bg-sky-50/50 hover:bg-sky-50'
                                  : p.isPartialPayment
                                  ? 'bg-amber-50/50 hover:bg-amber-50'
                                  : 'hover:bg-slate-50/80'
                              }
                            >
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className="font-mono font-bold text-emerald-800 block">
                                  {p.receiptNo}
                                </span>
                                <span className="font-mono text-[10px] text-slate-600 block">
                                  Date: <strong>{p.date}</strong>
                                </span>
                                <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-slate-900 text-white text-[10px] font-semibold">
                                  Paid in: {paidInMo}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 max-w-[240px]">
                                <span className="font-bold text-slate-900 block">
                                  {p.monthLabel}
                                </span>
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  {p.isPartialPayment ? (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold">
                                      Partial Paid
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                      Settled
                                    </span>
                                  )}
                                  {p.extraAdvanceAmount && p.extraAdvanceAmount > 0 ? (
                                    <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-900 border border-sky-300 text-[10px] font-extrabold">
                                      +₹{p.extraAdvanceAmount} Adjusted to Next Mo.
                                    </span>
                                  ) : null}
                                  {p.isPreviousYearClearance && (
                                    <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                                      Prev. Year
                                    </span>
                                  )}
                                </div>
                                {p.adjustmentBreakdown && p.adjustmentBreakdown.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {p.adjustmentBreakdown.map((adj, idx) => (
                                      <span
                                        key={`${p.id}-adj-${idx}`}
                                        className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                                          adj.type === 'prev-year'
                                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                            : adj.type === 'back-due'
                                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                            : adj.type === 'next-month-advance'
                                            ? 'bg-sky-100 text-sky-900 border border-sky-200'
                                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        }`}
                                      >
                                        {adj.label}: ₹{adj.amount}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 max-w-[180px]">
                                <span className="font-semibold text-slate-800 block truncate">
                                  {p.paidByParentName || activeStudent.parentName}
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  {p.remarks || `Session ${p.session || '2026-27'}`}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                  {p.mode}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-700 whitespace-nowrap">
                                +₹{p.amount.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                  <span>
                    Net Monthly Fee: <strong className="font-mono text-slate-900">₹{activeStudent.netMonthlyFee}/mo</strong> · FIFO clears back dues first &amp; advances extra into next month.
                  </span>
                  <span
                    className={`font-mono font-extrabold ${
                      activeFinancials.totalCombinedPending > 0
                        ? 'text-red-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {activeFinancials.advanceCreditNextMonths > 0
                      ? `Next-Mo. Adv. Credit: ₹${activeFinancials.advanceCreditNextMonths.toLocaleString('en-IN')}`
                      : `Balance Due: ₹${activeFinancials.totalCombinedPending.toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>
            </div>

            {/* MONTHLY-WISE LEDGER VIEW (With Back Dues Advanced & Extra Adjusted Forward) */}
            {ledgerMode === 'monthly' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Monthly-Wise Tuition Fee Ledger ({activeStudent.academicSession || '2026-27'}) —{' '}
                      {activeStudent.studentName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Unpaid previous back dues advance into the next month&apos;s payable; extra payments after clearing dues adjust forward automatically.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="text-emerald-700 font-bold">
                      Session Paid: ₹{activeFinancials.currentSessionPaid}
                    </span>
                    {activeFinancials.advanceCreditNextMonths > 0 && (
                      <span className="font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-200">
                        Adv. Adjusted: ₹{activeFinancials.advanceCreditNextMonths}
                      </span>
                    )}
                    <span
                      className={`font-bold px-2 py-0.5 rounded ${
                        activeFinancials.currentSessionPending > 0
                          ? 'bg-red-600 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      Current Due: ₹{activeFinancials.currentSessionPending}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200">
                        <th className="py-2.5 px-4">Academic Month</th>
                        <th className="py-2.5 px-3">Prev. Back Due / Adv.</th>
                        <th className="py-2.5 px-3">Month Fee</th>
                        <th className="py-2.5 px-3">Total Payable</th>
                        <th className="py-2.5 px-3">Paid & Date / Month</th>
                        <th className="py-2.5 px-3">Status & Carried Forward</th>
                        <th className="py-2.5 px-4 text-right">Quick Collect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 text-xs">
                      {monthlyLedgerRows.map((row) => {
                        const inactive =
                          row.status === 'Before Admission' ||
                          row.status === 'Disenrolled Break';
                        return (
                          <tr
                            key={row.key}
                            className={
                              row.status === 'Partially Paid'
                                ? 'bg-amber-50/70 hover:bg-amber-100/60'
                                : row.status === 'Pending' && row.key <= '2026-11'
                                ? 'bg-red-50/70 hover:bg-red-100/60'
                                : row.isAdvanceAdjusted
                                ? 'bg-sky-50/50 hover:bg-sky-50'
                                : 'hover:bg-slate-50/80'
                            }
                          >
                            <td className="py-2.5 px-4 font-bold text-slate-900">
                              {row.label}
                              {row.key === '2026-12' && (
                                <span className="block text-[10px] font-normal text-slate-500">
                                  Next Billing Month
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 font-mono">
                              {inactive || row.status === 'Waived' ? (
                                <span className="text-slate-400">—</span>
                              ) : row.backDueCarriedIn > 0 ? (
                                <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 font-extrabold text-[11px]">
                                  +₹{row.backDueCarriedIn} Back Due
                                </span>
                              ) : row.advanceCreditIn > 0 ? (
                                <span className="inline-block px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-200 font-extrabold text-[11px]">
                                  -₹{row.advanceCreditIn} Adv. Adjusted
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">₹0</span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 font-mono">
                              <span className="font-bold text-slate-900">₹{row.netPayable}</span>
                              {row.discountPercent > 0 && (
                                <span className="block text-[10px] text-emerald-700">
                                  Base ₹{row.baseFee} (-{row.discountPercent}%)
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 font-mono font-extrabold text-slate-900">
                              {inactive ? (
                                <span className="text-slate-400 font-normal">—</span>
                              ) : (
                                <>
                                  <span>₹{row.totalPayableWithBackDues}</span>
                                  {row.backDueCarriedIn > 0 && (
                                    <span className="block text-[10px] font-normal text-red-700">
                                      (₹{row.netPayable} + ₹{row.backDueCarriedIn} back due)
                                    </span>
                                  )}
                                </>
                              )}
                            </td>

                            <td className="py-2.5 px-3">
                              {inactive ? (
                                <span className="text-slate-400">—</span>
                              ) : row.paidAmount > 0 ? (
                                <div>
                                  <span className="font-mono font-bold text-emerald-700">
                                    ₹{row.paidAmount} Paid
                                  </span>
                                  <span className="block font-mono text-[10px] text-slate-600">
                                    {row.receiptNo} · {row.receiptDate}
                                  </span>
                                  <span className="block text-[10px] font-semibold text-slate-700">
                                    {row.isAdvanceAdjusted
                                      ? `Extra Adv. from ${row.paidInMonthDisplay}`
                                      : row.isBackDueClearedLater
                                      ? `Back Due Cleared in ${row.paidInMonthDisplay}`
                                      : `Paid in: ${row.paidInMonthDisplay}`}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-mono text-[11px] font-bold text-red-700">
                                  ₹0 Paid (Due: ₹{row.remainingAmount})
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3">
                              {row.status === 'Paid' && (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[11px] ${
                                    row.isAdvanceAdjusted
                                      ? 'bg-sky-100 text-sky-900 border border-sky-200'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  {row.isAdvanceAdjusted ? 'Paid (Advance Adj.)' : 'Paid'}
                                </span>
                              )}
                              {row.status === 'Partially Paid' && (
                                <div>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px]">
                                    <Clock className="w-3 h-3" />
                                    {row.isAdvanceAdjusted
                                      ? 'Partial (Adv. Adjusted)'
                                      : 'Partially Paid'}
                                  </span>
                                  {row.backDueCarriedForward > 0 && (
                                    <span className="block font-mono text-[10px] font-bold text-red-700 mt-0.5">
                                      Fwd to Next Mo: ₹{row.backDueCarriedForward}
                                    </span>
                                  )}
                                </div>
                              )}
                              {row.status === 'Pending' && (
                                <div>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 font-bold text-[11px]">
                                    <AlertTriangle className="w-3 h-3" />
                                    {row.key <= '2026-11' ? 'Pending / Back Due' : 'Upcoming'}
                                  </span>
                                  {row.backDueCarriedForward > 0 && (
                                    <span className="block font-mono text-[10px] font-bold text-red-700 mt-0.5">
                                      Fwd to Next Mo: ₹{row.backDueCarriedForward}
                                    </span>
                                  )}
                                </div>
                              )}
                              {row.status === 'Waived' && (
                                <span className="inline-block px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[11px]">
                                  100% Charity Waived
                                </span>
                              )}
                              {row.status === 'Before Admission' && (
                                <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-400 font-semibold text-[11px]">
                                  Prior to Admission
                                </span>
                              )}
                              {row.status === 'Disenrolled Break' && (
                                <span className="inline-block px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold text-[11px]">
                                  Disenrolled Break
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-4 text-right">
                              {(row.status === 'Pending' || row.status === 'Partially Paid') &&
                              row.remainingAmount > 0 ? (
                                <div className="inline-flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePrefillPartialForMonth(row.label, row.remainingAmount)
                                    }
                                    className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-[11px] cursor-pointer"
                                    title={`Collect partial amount toward ${row.label}`}
                                  >
                                    Partial
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuickPayMonth(
                                        row.label,
                                        row.backDueCarriedIn + row.remainingAmount
                                      )
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                    title={
                                      row.backDueCarriedIn > 0
                                        ? `Settle ₹${row.backDueCarriedIn} back due + ₹${row.remainingAmount} ${row.label}`
                                        : `Pay ₹${row.remainingAmount} for ${row.label}`
                                    }
                                  >
                                    <PlusCircle className="w-3 h-3" />
                                    <span>
                                      Pay ₹{row.backDueCarriedIn + row.remainingAmount}
                                    </span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SESSION-WISE & PREVIOUS ACADEMIC YEAR PENDING FEE LEDGER VIEW */}
            {ledgerMode === 'session' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left Card: Session-Wise Comparison Table (2025-26 vs 2026-27) */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Session-Wise Fee Ledger Breakdown
                      </h4>
                      <p className="text-xs text-slate-500">
                        Compares Previous Academic Year (2025-26) arrears & Current Session (
                        {activeStudent.academicSession || '2026-27'})
                      </p>
                    </div>
                    <IndianRupee className="w-5 h-5 text-emerald-700" />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 text-[11px] font-bold uppercase">
                          <th className="py-2.5 px-3">Academic Session</th>
                          <th className="py-2.5 px-3">Class</th>
                          <th className="py-2.5 px-3">Billed / Arrears</th>
                          <th className="py-2.5 px-3">Paid</th>
                          <th className="py-2.5 px-3">Pending</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        <tr>
                          <td className="py-3 px-3 font-sans font-bold text-slate-800">
                            2025-26 (Prev. Year)
                          </td>
                          <td className="py-3 px-3 font-sans text-slate-600">
                            {activeStudent.promotedFromClass || 'Prev. Class'}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            ₹{activeFinancials.prevYearTotalAssigned}
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-700">
                            ₹{activeFinancials.prevYearCleared}
                          </td>
                          <td className="py-3 px-3 font-bold text-rose-700">
                            ₹{activeFinancials.prevYearRemainingDue}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3 font-sans font-bold text-emerald-900">
                            {activeStudent.academicSession || '2026-27'} (Current)
                          </td>
                          <td className="py-3 px-3 font-sans text-slate-800 font-semibold">
                            {activeStudent.classLevel}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            ₹{activeFinancials.currentSessionBilled}
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-700">
                            ₹{activeFinancials.currentSessionPaid}
                          </td>
                          <td className="py-3 px-3 font-bold text-amber-700">
                            ₹{activeFinancials.currentSessionPending}
                          </td>
                        </tr>
                        <tr className="bg-slate-900 text-white font-bold">
                          <td className="py-3 px-3 font-sans" colSpan={2}>
                            Combined Grand Total
                          </td>
                          <td className="py-3 px-3">
                            ₹
                            {activeFinancials.prevYearTotalAssigned +
                              activeFinancials.currentSessionBilled}
                          </td>
                          <td className="py-3 px-3 text-emerald-300">
                            ₹
                            {activeFinancials.prevYearCleared +
                              activeFinancials.currentSessionPaid}
                          </td>
                          <td className="py-3 px-3 text-amber-300">
                            ₹{activeFinancials.totalCombinedPending}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* All Recorded Fee Receipts List */}
                  <div className="pt-2">
                    <p className="text-xs font-bold uppercase text-slate-500 mb-2">
                      Recorded Payment Receipts ({activeStudent.feePayments?.length || 0})
                    </p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {(activeStudent.feePayments || []).map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-emerald-800 mr-2">
                              {p.receiptNo}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {p.monthLabel}
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              Date: {p.date} · Mode: {p.mode} · Session:{' '}
                              {p.session || (p.isPreviousYearClearance ? '2025-26' : '2026-27')}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            ₹{p.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Card: Previous Academic Year Pending Fee Management & Clearance */}
                <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 mb-1">
                      Arrears & Carry-Forward Control
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      Previous Academic Year (2025-26) Pending Fee Clearance
                    </h4>
                    <p className="text-xs text-slate-500">
                      Record arrear payments or update carry-forward balance from previous class.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 bg-rose-50/60 p-3.5 rounded-xl border border-rose-200/80 font-mono">
                    <div>
                      <span className="text-[10px] font-sans font-bold uppercase text-slate-500 block">
                        Prev. Year Billed
                      </span>
                      <span className="text-base font-black text-slate-900">
                        ₹{activeFinancials.prevYearTotalAssigned}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-sans font-bold uppercase text-emerald-700 block">
                        Arrear Cleared
                      </span>
                      <span className="text-base font-black text-emerald-700">
                        ₹{activeFinancials.prevYearCleared}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-sans font-bold uppercase text-rose-700 block">
                        Remaining Due
                      </span>
                      <span className="text-base font-black text-rose-700">
                        ₹{activeFinancials.prevYearRemainingDue}
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleClearPrevDueSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Receive Arrear Payment Now (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={Math.max(10000, activeFinancials.prevYearRemainingDue)}
                          value={prevPayAmount}
                          onChange={(e) => setPrevPayAmount(e.target.value)}
                          placeholder={`e.g. ${activeFinancials.prevYearRemainingDue}`}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Payment Mode
                        </label>
                        <select
                          value={prevPayMode}
                          onChange={(e) => setPrevPayMode(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                        >
                          <option value="Cash">Cash at Office Desk</option>
                          <option value="UPI / Online">UPI / Online Transfer</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Or Adjust Total Previous Year Pending Fee Assigned (Optional ₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={editPrevTotalAmount}
                        onChange={(e) => setEditPrevTotalAmount(e.target.value)}
                        placeholder={`Current assigned: ₹${activeFinancials.prevYearTotalAssigned}`}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Save Previous Year Fee Clearance / Adjustment
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-SECTION 3: CLASS PROMOTION & ACADEMIC SESSION UPGRADE           */}
        {/* =================================================================== */}
        {dashboardSubTab === 'promotion' && (
          <div className="space-y-5">
            {promoSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-900 text-white text-xs font-bold flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{promoSuccessMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPromoSuccessMsg(null)}
                  className="text-emerald-200 hover:text-white underline ml-4 cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Card: Individual Student Class Promotion */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 mb-1">
                    Individual Promotion
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Promote Student to Next Class & Academic Session
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upgrades student class, assigns new batch ID, and optionally carries forward
                    unpaid current-session balance into Previous Year Pending Fee.
                  </p>
                </div>

                {activeStudent && activeFinancials && (
                  <form onSubmit={handleSinglePromoteSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Select Student to Promote
                      </label>
                      <select
                        value={activeStudent.id}
                        onChange={(e) => {
                          const found = students.find((s) => s.id === e.target.value);
                          setSelectedStudentId(e.target.value);
                          if (found) {
                            const nextClass = Math.min(12, found.classNum + 1);
                            setPromoTargetClassNum(nextClass);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50"
                      >
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.studentIdCode} — {s.studentName} (Currently: {s.classLevel})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">
                          Current Class & Session
                        </span>
                        <span className="font-bold text-slate-900">
                          {activeStudent.classLevel} ({activeStudent.academicSession || '2026-27'})
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-slate-500 block text-[10px] font-sans uppercase font-bold">
                          Unpaid Current Session Fee
                        </span>
                        <span className="font-bold text-amber-700">
                          ₹{activeFinancials.currentSessionPending}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Promote To Class
                        </label>
                        <select
                          value={promoTargetClassNum}
                          onChange={(e) => setPromoTargetClassNum(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                        >
                          {ALL_CLASSES.map((c) => (
                            <option key={c.classNum} value={c.classNum}>
                              {c.shortLabel} ({c.wing})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          New Academic Session
                        </label>
                        <select
                          value={promoTargetSession}
                          onChange={(e) => setPromoTargetSession(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                        >
                          <option value="2026-27">2026-27</option>
                          <option value="2027-28">2027-28</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Assign New Batch ID
                        </label>
                        <select
                          value={promoTargetBatchCode}
                          onChange={(e) => setPromoTargetBatchCode(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                        >
                          {batches.map((b) => (
                            <option key={b.id} value={b.batchCode}>
                              {b.batchCode} ({b.shift})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={promoCarryForwardDues}
                        onChange={(e) => setPromoCarryForwardDues(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-700"
                      />
                      <span className="text-xs text-slate-800">
                        <strong>Carry Forward Unpaid Current Dues (₹{activeFinancials.currentSessionPending})</strong>{' '}
                        into student&apos;s <strong>Previous Academic Year Pending Fee</strong> and reset
                        new session paid counter to ₹0.
                      </span>
                    </label>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Promotion Remarks / Exam Result Note
                      </label>
                      <input
                        type="text"
                        value={promoRemarks}
                        onChange={(e) => setPromoRemarks(e.target.value)}
                        placeholder="e.g. Passed Annual Exam with 88%; promoted to next class"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Promote {activeStudent.studentName} Now</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Right Card: Bulk Class-Wise Promotion */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 mb-1">
                    Whole-Class Upgrade
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Bulk Class-Wise Promotion (Promote Entire Class)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Promote all active enrolled students of a specific class to the next higher class
                    in one click, automatically carrying forward any pending dues.
                  </p>
                </div>

                <form onSubmit={handleBulkPromoteSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        From Source Class
                      </label>
                      <select
                        value={bulkFromClassNum}
                        onChange={(e) => {
                          const fromVal = Number(e.target.value);
                          setBulkFromClassNum(fromVal);
                          setBulkToClassNum(Math.min(12, fromVal + 1));
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                      >
                        {ALL_CLASSES.map((c) => {
                          const cnt = students.filter(
                            (s) =>
                              s.classNum === c.classNum &&
                              s.enrollmentStatus !== 'Disenrolled'
                          ).length;
                          return (
                            <option key={c.classNum} value={c.classNum}>
                              {c.shortLabel} ({cnt} active)
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Promote To Target Class
                      </label>
                      <select
                        value={bulkToClassNum}
                        onChange={(e) => setBulkToClassNum(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                      >
                        {ALL_CLASSES.map((c) => (
                          <option key={c.classNum} value={c.classNum}>
                            {c.shortLabel} ({c.wing})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Target Session
                      </label>
                      <select
                        value={bulkSession}
                        onChange={(e) => setBulkSession(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                      >
                        <option value="2026-27">2026-27</option>
                        <option value="2027-28">2027-28</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Batch Promotion Note
                    </label>
                    <input
                      type="text"
                      value={bulkRemarks}
                      onChange={(e) => setBulkRemarks(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4 text-amber-400" />
                    <span>
                      Bulk Promote Entire{' '}
                      {ALL_CLASSES.find((c) => c.classNum === bulkFromClassNum)?.shortLabel} Batch
                    </span>
                  </button>
                </form>

                {/* Promotion History Log */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                    <History className="w-4 h-4 text-emerald-700" />
                    <span>Recent Class Promotion History Log</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {students
                      .flatMap((s) =>
                        (s.promotionHistory || []).map((ph) => ({
                          ...ph,
                          studentName: s.studentName,
                          studentIdCode: s.studentIdCode
                        }))
                      )
                      .map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-bold text-slate-900">
                              {item.studentName} ({item.studentIdCode})
                            </span>
                            <p className="text-[11px] text-emerald-800 font-semibold">
                              {item.fromClass} → {item.toClass} (Session {item.session})
                            </p>
                            {item.remarks && (
                              <p className="text-[10px] text-slate-500">{item.remarks}</p>
                            )}
                          </div>
                          <div className="text-right font-mono shrink-0">
                            <span className="text-[10px] text-slate-500 block">{item.date}</span>
                            <span className="text-[11px] font-bold text-rose-700">
                              Carry Due: ₹{item.carryForwardDues}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-SECTION 4: AUTOMATED WHATSAPP & IN-APP PARENT FEE REMINDERS     */}
        {/* =================================================================== */}
        {dashboardSubTab === 'reminders' && (
          <div className="space-y-5">
            {/* Deadline Configuration & Bulk Dispatch Toolbar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-extrabold text-red-700 uppercase tracking-wider mb-1">
                    <BellRing className="w-4 h-4" />
                    <span>Automated Fee Deadline Reminder & Parent Notification Hub</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Remind Parents of Students Exceeding Payment Deadline ({overdueReminderTargets.length}{' '}
                    Overdue)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Automatically pushes In-App Fee Alerts to Student Portal accounts past deadline and prepares personalized WhatsApp parent reminders.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBulkSendInAppReminders}
                    disabled={overdueReminderTargets.length === 0}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      Send In-App Alerts to All Overdue ({overdueReminderTargets.length})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyBulkWhatsAppMessages}
                    disabled={overdueReminderTargets.length === 0}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedBulkQueue ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied Queue!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-300" />
                        <span>Copy All WhatsApp Queue</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Deadline Rule Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Active Payment Deadline Date
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={feeReminderSettings.activeDeadlineDate}
                      onChange={(e) =>
                        onUpdateReminderSettings({
                          ...feeReminderSettings,
                          activeDeadlineDate: e.target.value
                        })
                      }
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                    />
                    <span
                      className={`px-2 py-1 rounded-md text-[10px] font-extrabold shrink-0 ${
                        daysPastDeadline > 0
                          ? 'bg-red-600 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {daysPastDeadline > 0
                        ? `${daysPastDeadline}d Overdue`
                        : 'Upcoming'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Reminder Message Language
                  </label>
                  <select
                    value={feeReminderSettings.defaultLanguage}
                    onChange={(e) =>
                      onUpdateReminderSettings({
                        ...feeReminderSettings,
                        defaultLanguage: e.target.value as FeeReminderLanguage
                      })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    <option value="Bilingual">Bilingual (English + Hindi)</option>
                    <option value="English">English Only</option>
                    <option value="Hindi">Hindi Only (हिंदी)</option>
                  </select>
                </div>

                <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Auto-Trigger In-App Alerts
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Automatically notifies parents past deadline
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={feeReminderSettings.autoTriggerInAppOnLoad}
                    onChange={(e) =>
                      onUpdateReminderSettings({
                        ...feeReminderSettings,
                        autoTriggerInAppOnLoad: e.target.checked
                      })
                    }
                    className="w-4 h-4 text-emerald-600"
                  />
                </label>
              </div>

              {reminderBannerMsg && (
                <div className="p-3 rounded-xl bg-emerald-900 text-white text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>{reminderBannerMsg}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setReminderBannerMsg(null)}
                    className="text-emerald-200 hover:text-white underline ml-4 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            {/* Overdue Deadline Queue Table */}
            <div className="bg-white rounded-2xl border border-red-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 bg-red-50/80 border-b border-red-200 flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-red-950">
                  Students Exceeding Payment Deadline ({overdueReminderTargets.length})
                </h4>
                <span className="text-[11px] font-mono font-bold text-red-700">
                  Deadline: {feeReminderSettings.activeDeadlineDate}
                </span>
              </div>

              {overdueReminderTargets.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-900">
                    Zero overdue students past the payment deadline!
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    All enrolled students have cleared their billed balances.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200">
                        <th className="py-3 px-4">Student & Class</th>
                        <th className="py-3 px-3">Parent / Guardian Phone</th>
                        <th className="py-3 px-3">Deadline Status</th>
                        <th className="py-3 px-3">Overdue Balance</th>
                        <th className="py-3 px-3">Last Notification</th>
                        <th className="py-3 px-4 text-right">Dispatch Reminder</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70">
                      {overdueReminderTargets.map((item) => {
                        const { student, financials, messageText, waUrl, latestReminder } = item;
                        const isCopied = copiedReminderStudentId === student.id;
                        return (
                          <tr
                            key={student.id}
                            className="bg-red-50/40 hover:bg-red-50/90 border-l-4 border-l-red-600"
                          >
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-bold text-red-700 block">
                                {student.studentIdCode}
                              </span>
                              <span className="font-bold text-slate-900 text-sm">
                                {student.studentName}
                              </span>
                              <span className="block text-[11px] text-slate-500">
                                {student.classLevel} · {student.batchCode}
                              </span>
                            </td>

                            <td className="py-3.5 px-3">
                              <span className="font-bold text-slate-900 block">
                                {student.parentName}
                              </span>
                              <span className="font-mono text-[11px] text-slate-600">
                                {student.phone}
                              </span>
                            </td>

                            <td className="py-3.5 px-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-extrabold uppercase">
                                <Clock className="w-3 h-3" />
                                {daysPastDeadline > 0
                                  ? `${daysPastDeadline} Days Past Due`
                                  : 'Deadline Due'}
                              </span>
                              <span className="block text-[10px] font-mono text-slate-500 mt-1">
                                Due Date: {feeReminderSettings.activeDeadlineDate}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 font-mono">
                              <span className="font-extrabold text-red-700 text-sm block">
                                ₹{financials.totalCombinedPending.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Curr: ₹{financials.currentSessionPending}
                                {financials.prevYearRemainingDue > 0
                                  ? ` · Prev: ₹${financials.prevYearRemainingDue}`
                                  : ''}
                              </span>
                            </td>

                            <td className="py-3.5 px-3">
                              {latestReminder ? (
                                <div>
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                      latestReminder.status === 'Acknowledged'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : latestReminder.status === 'Automated Trigger'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-sky-100 text-sky-800'
                                    }`}
                                  >
                                    {latestReminder.status}
                                  </span>
                                  <span className="block text-[10px] text-slate-500 mt-0.5">
                                    {latestReminder.channel} · {latestReminder.sentAt}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">
                                  Not sent yet
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() =>
                                    createAndDispatchReminder(
                                      student,
                                      financials.totalCombinedPending,
                                      messageText,
                                      'WhatsApp + In-App'
                                    )
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>WhatsApp Parent</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={() =>
                                    createAndDispatchReminder(
                                      student,
                                      financials.totalCombinedPending,
                                      messageText,
                                      'In-App Notification'
                                    )
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <BellRing className="w-3 h-3" />
                                  <span>In-App Alert</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(messageText);
                                      setCopiedReminderStudentId(student.id);
                                      setTimeout(() => setCopiedReminderStudentId(null), 2000);
                                    } catch {
                                      // Ignore clipboard error
                                    }
                                  }}
                                  className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                  title="Copy Reminder Text"
                                >
                                  {isCopied ? (
                                    <Check className="w-3 h-3 text-emerald-700" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sent Reminders & Parent Read Receipts Log */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Dispatched WhatsApp & In-App Parent Notification Log ({feeReminders.length})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Tracks automated deadline triggers, manual WhatsApp dispatches, and parent portal acknowledgements.
                  </p>
                </div>
                {feeReminders.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearFeeReminders}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Log</span>
                  </button>
                )}
              </div>

              {feeReminders.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No fee reminders dispatched yet.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {feeReminders.map((rem) => (
                    <div
                      key={rem.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono font-bold text-emerald-800">
                            {rem.studentIdCode}
                          </span>
                          <span className="font-bold text-slate-900">
                            {rem.studentName}
                          </span>
                          <span className="text-slate-500">
                            (Parent: {rem.parentName} · {rem.parentPhone})
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold">
                            {rem.channel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 whitespace-pre-line">
                          {rem.messageText}
                        </p>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <span className="font-mono font-extrabold text-red-700 block">
                          ₹{rem.dueAmount.toLocaleString('en-IN')} Due
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            rem.status === 'Acknowledged'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rem.status === 'Automated Trigger'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {rem.status === 'Acknowledged'
                            ? '✓ Parent Acknowledged'
                            : rem.status}
                        </span>
                        <span className="block text-[10px] text-slate-400">{rem.sentAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
