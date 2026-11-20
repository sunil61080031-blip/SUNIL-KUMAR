import React, { useMemo, useRef, useState } from 'react';
import {
  BatchItem,
  FeePaymentItem,
  FeePlan,
  InstituteConfig,
  PaymentAuditEntry,
  StudentRecord
} from '../types';
import {
  buildMonthlyLedgerRows,
  computePaymentSlipSnapshot,
  computeStudentFinancials,
  formatMonthYearFromDate,
  generateUniqueReceiptNumber,
  previewSmartPaymentAllocation,
  SESSION_MONTHS
} from '../utils/ledgerHelpers';
import {
  INSTITUTE_CREST_URL,
  OfficialFeeSlipDocument
} from './OfficialFeeSlipDocument';
import {
  BulkFeeSlipSheets,
  BulkGridOrientation,
  BulkPrintScale,
  BulkSlipEntry
} from './BulkFeeSlipPrintSheet';
import { FeeRevenueSummaryDashboard } from './FeeRevenueSummaryDashboard';
import { FeePrintQueuePanel } from './FeePrintQueuePanel';
import {
  CollectionEfficiencySummaryPanel,
  EfficiencyPeriodMode
} from './CollectionEfficiencySummaryPanel';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Ban,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  Edit3,
  FileSpreadsheet,
  FileText,
  History,
  Layers,
  LayoutGrid,
  MessageCircle,
  Plus,
  Printer,
  Receipt,
  Scissors,
  Search,
  ShieldCheck,
  Trash2,
  X
} from 'lucide-react';

interface FeePaymentSlipSectionProps {
  students: StudentRecord[];
  batches: BatchItem[];
  feePlans: FeePlan[];
  instituteConfig: InstituteConfig;
  isAdmin: boolean;
  initialStudentId?: string;
  onRecordFeePayment: (studentId: string, payment: FeePaymentItem) => void;
  onEditOrCancelPayment: (
    studentId: string,
    paymentId: string,
    update: {
      action: 'Edited' | 'Cancelled';
      reason: string;
      newAmount?: number;
      newMode?: FeePaymentItem['mode'];
      newTransactionId?: string;
      newRemarks?: string;
    }
  ) => void;
}

type SlipModuleTab = 'generate' | 'history' | 'statement' | 'bulk';

interface ReceiptLookupRow {
  student: StudentRecord;
  payment: FeePaymentItem;
}

interface PrintQueueItem {
  studentId: string;
  paymentId: string;
}

const PRINT_QUEUE_STORAGE_KEY = 'sntc_fee_print_queue_v1';

const getQueueKey = (studentId: string, paymentId: string) =>
  `${studentId}::${paymentId}`;

export const FeePaymentSlipSection: React.FC<FeePaymentSlipSectionProps> = ({
  students,
  batches,
  feePlans,
  instituteConfig,
  isAdmin,
  initialStudentId,
  onRecordFeePayment,
  onEditOrCancelPayment
}) => {
  const [activeTab, setActiveTab] = useState<SlipModuleTab>('generate');

  // Step 1-4: Generate Payment Slip state
  const activeStudents = useMemo(
    () => students.filter((s) => s.enrollmentStatus !== 'Disenrolled'),
    [students]
  );

  const [studentPickerSearch, setStudentPickerSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || activeStudents[0]?.id || students[0]?.id || ''
  );
  const [selectedMonthLabel, setSelectedMonthLabel] = useState<string>('November 2026');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [amountInput, setAmountInput] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<
    'Cash' | 'UPI / Online' | 'Bank Transfer'
  >('Cash');
  const [transactionId, setTransactionId] = useState('');
  const [remarks, setRemarks] = useState('');

  // Optional applicable extra charges
  const [showExtraCharges, setShowExtraCharges] = useState(false);
  const [hostelFeeInput, setHostelFeeInput] = useState<string>('0');
  const [examFeeInput, setExamFeeInput] = useState<string>('0');
  const [otherChargesInput, setOtherChargesInput] = useState<string>('0');

  // Guard against accidental double-clicks & duplicate submissions
  const [isSaving, setIsSaving] = useState(false);
  const lastSubmittedSignatureRef = useRef<{ sig: string; ts: number } | null>(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Active generated or inspected official slip
  const [savedReceiptView, setSavedReceiptView] = useState<{
    studentId: string;
    paymentId: string;
    isDuplicate: boolean;
  } | null>(null);

  // Fullscreen Printable Overlay (for crisp A4 Print / Download PDF)
  const [printMode, setPrintMode] = useState<'none' | 'slip' | 'statement' | 'bulk'>(
    'none'
  );
  const [bulkPrintTarget, setBulkPrintTarget] = useState<'studio' | 'queue'>('studio');
  const [singleSlipScale, setSingleSlipScale] = useState<BulkPrintScale>(100);

  // Persistent Batch Print Queue for processed receipts
  const [printQueueItems, setPrintQueueItems] = useState<PrintQueueItem[]>(() => {
    try {
      const raw = window.localStorage.getItem(PRINT_QUEUE_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (item): item is PrintQueueItem =>
          Boolean(item) &&
          typeof item.studentId === 'string' &&
          typeof item.paymentId === 'string'
      );
    } catch {
      return [];
    }
  });
  const [isQueueExpanded, setIsQueueExpanded] = useState(false);
  const [autoQueueOnSave, setAutoQueueOnSave] = useState(false);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(
        PRINT_QUEUE_STORAGE_KEY,
        JSON.stringify(printQueueItems)
      );
    } catch {
      // Ignore storage quota / private mode failures
    }
  }, [printQueueItems]);

  // Tab 4: Bulk 3x2 A4 Pay Slip Printing state
  const [bulkSource, setBulkSource] = useState<'queue' | 'receipts' | 'monthly-batch'>(
    'receipts'
  );
  const [bulkScale, setBulkScale] = useState<BulkPrintScale>(100);
  const [bulkOrientation, setBulkOrientation] =
    useState<BulkGridOrientation>('3x2-landscape');
  const [bulkShowCutLines, setBulkShowCutLines] = useState<boolean>(true);
  const [bulkBatchFilter, setBulkBatchFilter] = useState<string>('ALL');
  const [bulkMonthLabel, setBulkMonthLabel] = useState<string>('November 2026');
  const [bulkSearch, setBulkSearch] = useState<string>('');
  const [bulkExcludedKeys, setBulkExcludedKeys] = useState<Record<string, boolean>>({});

  // Tab 2 & Quick Lookup: Historical Fee Receipt Search & Filters
  const [receiptSearch, setReceiptSearch] = useState('');
  const [receiptModeFilter, setReceiptModeFilter] = useState<
    'ALL' | 'Cash' | 'UPI / Online' | 'Bank Transfer'
  >('ALL');
  const [receiptStatusFilter, setReceiptStatusFilter] = useState<
    'all' | 'active' | 'cancelled'
  >('all');
  const [showQuickReceiptList, setShowQuickReceiptList] = useState(false);
  const [editingEntry, setEditingEntry] = useState<{
    studentId: string;
    payment: FeePaymentItem;
    mode: 'edit' | 'cancel';
    newAmount: string;
    newMode: FeePaymentItem['mode'];
    newTxId: string;
    newRemarks: string;
    reason: string;
  } | null>(null);

  // Tab 3: Monthly Fee Statement
  const [statementMonth, setStatementMonth] = useState<string>('November 2026');
  const [statementSearch, setStatementSearch] = useState('');

  // Sync initialStudentId if passed from Student Dashboard
  React.useEffect(() => {
    if (initialStudentId && students.some((s) => s.id === initialStudentId)) {
      setSelectedStudentId(initialStudentId);
      setActiveTab('generate');
      setSavedReceiptView(null);
      setFormError('');
      setFormSuccess('');
    }
  }, [initialStudentId, students]);

  const filteredPickerStudents = useMemo(() => {
    const q = studentPickerSearch.trim().toLowerCase();
    if (!q) return activeStudents;
    return activeStudents.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        s.studentIdCode.toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q) ||
        s.batchCode.toLowerCase().includes(q)
    );
  }, [activeStudents, studentPickerSearch]);

  const selectedStudent = useMemo(
    () =>
      students.find((s) => s.id === selectedStudentId) ||
      activeStudents[0] ||
      students[0] ||
      null,
    [students, activeStudents, selectedStudentId]
  );

  // Live synchronized calculation straight from Student Ledger
  const numericAmount = Math.max(0, Math.round(Number(amountInput) || 0));
  const extraCharges = useMemo(
    () => ({
      hostelFee: Math.max(0, Math.round(Number(hostelFeeInput) || 0)),
      examinationFee: Math.max(0, Math.round(Number(examFeeInput) || 0)),
      otherCharges: Math.max(0, Math.round(Number(otherChargesInput) || 0))
    }),
    [hostelFeeInput, examFeeInput, otherChargesInput]
  );

  const liveSlipCalc = useMemo(() => {
    if (!selectedStudent) return null;
    return computePaymentSlipSnapshot(
      selectedStudent,
      feePlans,
      selectedMonthLabel,
      extraCharges,
      numericAmount
    );
  }, [selectedStudent, feePlans, selectedMonthLabel, extraCharges, numericAmount]);

  const liveStudentFinancials = useMemo(() => {
    if (!selectedStudent) return null;
    return computeStudentFinancials(selectedStudent, feePlans);
  }, [selectedStudent, feePlans]);

  // Saved receipt object (always reads fresh student record from state!)
  const activeSavedSlip = useMemo(() => {
    if (!savedReceiptView) return null;
    const stu = students.find((s) => s.id === savedReceiptView.studentId);
    if (!stu) return null;
    const pay = (stu.feePayments || []).find(
      (p) => p.id === savedReceiptView.paymentId
    );
    if (!pay) return null;

    // Fallback breakdown for legacy receipts created before this module
    const fallbackBreakdown = pay.feeBreakdown || {
      registrationFee: 0,
      tuitionFee: stu.netMonthlyFee,
      hostelFee: 0,
      examinationFee: 0,
      otherCharges: 0,
      previousBackDues: pay.prevYearClearedPart || 0,
      totalPayable: Math.max(pay.amount, stu.netMonthlyFee),
      previouslyPaid: 0,
      currentPayment: pay.amount,
      remainingDues: computeStudentFinancials(stu, feePlans).totalCombinedPending
    };

    const derivedStatus: 'Paid' | 'Partially Paid' | 'Unpaid' =
      pay.paymentStatus ||
      (fallbackBreakdown.remainingDues === 0
        ? 'Paid'
        : pay.amount > 0
        ? 'Partially Paid'
        : 'Unpaid');

    return {
      student: stu,
      payment: pay,
      breakdown: fallbackBreakdown,
      paymentStatus: derivedStatus,
      isDuplicate: savedReceiptView.isDuplicate
    };
  }, [savedReceiptView, students, feePlans]);

  // All receipts across all students for Search & Duplicate Receipts
  const allReceipts = useMemo<ReceiptLookupRow[]>(() => {
    const list: ReceiptLookupRow[] = [];
    for (const stu of students) {
      for (const pay of stu.feePayments || []) {
        list.push({ student: stu, payment: pay });
      }
    }
    return list.sort((a, b) =>
      (b.payment.date || '').localeCompare(a.payment.date || '')
    );
  }, [students]);

  const filteredReceipts = useMemo(() => {
    const q = receiptSearch.trim().toLowerCase();
    return allReceipts.filter(({ student, payment }) => {
      if (receiptStatusFilter === 'active' && payment.status === 'Cancelled') {
        return false;
      }
      if (receiptStatusFilter === 'cancelled' && payment.status !== 'Cancelled') {
        return false;
      }
      if (receiptModeFilter !== 'ALL' && payment.mode !== receiptModeFilter) {
        return false;
      }
      if (!q) return true;
      return (
        payment.receiptNo.toLowerCase().includes(q) ||
        student.studentName.toLowerCase().includes(q) ||
        student.studentIdCode.toLowerCase().includes(q) ||
        student.parentName.toLowerCase().includes(q) ||
        (payment.paidInMonth || '').toLowerCase().includes(q) ||
        (payment.transactionId || '').toLowerCase().includes(q)
      );
    });
  }, [allReceipts, receiptSearch, receiptModeFilter, receiptStatusFilter]);

  const filteredReceiptsActiveTotal = useMemo(
    () =>
      filteredReceipts.reduce(
        (sum, { payment }) =>
          payment.status === 'Cancelled' ? sum : sum + payment.amount,
        0
      ),
    [filteredReceipts]
  );

  const openHistoricalReceipt = (
    studentId: string,
    paymentId: string,
    isDuplicate: boolean,
    openPrintAfter = false
  ) => {
    setSelectedStudentId(studentId);
    setSavedReceiptView({ studentId, paymentId, isDuplicate });
    setActiveTab('generate');
    setFormError('');
    setFormSuccess('');
    if (openPrintAfter) {
      triggerPrint('slip');
    } else {
      window.setTimeout(() => {
        const slipEl = document.getElementById('official-slip-preview-panel');
        if (slipEl) {
          slipEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
    }
  };

  // Shared helper to map a processed receipt into a 3x2 BulkSlipEntry
  const buildReceiptBulkEntry = React.useCallback(
    (student: StudentRecord, payment: FeePaymentItem): BulkSlipEntry => {
      const fallbackBreakdown = payment.feeBreakdown || {
        registrationFee: 0,
        tuitionFee: student.netMonthlyFee,
        hostelFee: 0,
        examinationFee: 0,
        otherCharges: 0,
        previousBackDues: payment.prevYearClearedPart || 0,
        totalPayable: Math.max(payment.amount, student.netMonthlyFee),
        previouslyPaid: 0,
        currentPayment: payment.amount,
        remainingDues: computeStudentFinancials(student, feePlans)
          .totalCombinedPending
      };

      const derivedStatus: 'Paid' | 'Partially Paid' | 'Unpaid' =
        payment.paymentStatus ||
        (fallbackBreakdown.remainingDues === 0
          ? 'Paid'
          : payment.amount > 0
          ? 'Partially Paid'
          : 'Unpaid');

      return {
        key: `rcpt-${student.id}-${payment.id}`,
        paymentId: payment.id,
        student,
        receiptNo: payment.receiptNo,
        paymentDate: payment.date,
        feeMonth: payment.paidInMonth || payment.monthLabel,
        paymentMode: payment.mode,
        transactionId: payment.transactionId,
        paymentStatus: derivedStatus,
        breakdown: fallbackBreakdown,
        copyLabel: 'RECEIPT COPY',
        isCancelled: payment.status === 'Cancelled',
        collectedBy: payment.collectedBy
      };
    },
    [feePlans]
  );

  // Live resolved Print Queue entries (automatically filters out deleted or cancelled receipts)
  const queuedBulkEntries = useMemo<BulkSlipEntry[]>(() => {
    const receiptIndex = new Map<string, ReceiptLookupRow>();
    for (const row of allReceipts) {
      if (row.payment.status !== 'Cancelled') {
        receiptIndex.set(getQueueKey(row.student.id, row.payment.id), row);
      }
    }
    const resolved: BulkSlipEntry[] = [];
    for (const item of printQueueItems) {
      const match = receiptIndex.get(getQueueKey(item.studentId, item.paymentId));
      if (match) {
        resolved.push(buildReceiptBulkEntry(match.student, match.payment));
      }
    }
    return resolved;
  }, [allReceipts, printQueueItems, buildReceiptBulkEntry]);

  const queuedKeySet = useMemo(() => {
    const set = new Set<string>();
    for (const entry of queuedBulkEntries) {
      if (entry.paymentId) {
        set.add(getQueueKey(entry.student.id, entry.paymentId));
      }
    }
    return set;
  }, [queuedBulkEntries]);

  const isReceiptInQueue = (studentId: string, paymentId: string) =>
    queuedKeySet.has(getQueueKey(studentId, paymentId));

  const toggleReceiptInQueue = (studentId: string, paymentId: string) => {
    const key = getQueueKey(studentId, paymentId);
    setPrintQueueItems((prev) => {
      if (prev.some((item) => getQueueKey(item.studentId, item.paymentId) === key)) {
        return prev.filter(
          (item) => getQueueKey(item.studentId, item.paymentId) !== key
        );
      }
      return [...prev, { studentId, paymentId }];
    });
  };

  const addManyReceiptsToQueue = (items: PrintQueueItem[]) => {
    if (items.length === 0) return;
    setPrintQueueItems((prev) => {
      const existing = new Set(
        prev.map((item) => getQueueKey(item.studentId, item.paymentId))
      );
      const next = [...prev];
      for (const item of items) {
        const key = getQueueKey(item.studentId, item.paymentId);
        if (!existing.has(key)) {
          existing.add(key);
          next.push(item);
        }
      }
      return next;
    });
  };

  const removeManyReceiptsFromQueue = (items: PrintQueueItem[]) => {
    if (items.length === 0) return;
    const toRemove = new Set(
      items.map((item) => getQueueKey(item.studentId, item.paymentId))
    );
    setPrintQueueItems((prev) =>
      prev.filter(
        (item) => !toRemove.has(getQueueKey(item.studentId, item.paymentId))
      )
    );
  };

  const removeReceiptFromQueue = (studentId: string, paymentId: string) => {
    const key = getQueueKey(studentId, paymentId);
    setPrintQueueItems((prev) =>
      prev.filter((item) => getQueueKey(item.studentId, item.paymentId) !== key)
    );
  };

  const moveQueueItem = (index: number, direction: -1 | 1) => {
    const targetEntry = queuedBulkEntries[index];
    const swapEntry = queuedBulkEntries[index + direction];
    if (!targetEntry?.paymentId || !swapEntry?.paymentId) return;

    const keyA = getQueueKey(targetEntry.student.id, targetEntry.paymentId);
    const keyB = getQueueKey(swapEntry.student.id, swapEntry.paymentId);

    setPrintQueueItems((prev) => {
      const idxA = prev.findIndex(
        (item) => getQueueKey(item.studentId, item.paymentId) === keyA
      );
      const idxB = prev.findIndex(
        (item) => getQueueKey(item.studentId, item.paymentId) === keyB
      );
      if (idxA === -1 || idxB === -1) return prev;
      const copy = [...prev];
      const temp = copy[idxA];
      copy[idxA] = copy[idxB];
      copy[idxB] = temp;
      return copy;
    });
  };

  const clearPrintQueue = () => {
    setPrintQueueItems([]);
  };

  const filteredActiveReceipts = useMemo(
    () => filteredReceipts.filter(({ payment }) => payment.status !== 'Cancelled'),
    [filteredReceipts]
  );

  const filteredQueuedCount = useMemo(
    () =>
      filteredActiveReceipts.filter(({ student, payment }) =>
        queuedKeySet.has(getQueueKey(student.id, payment.id))
      ).length,
    [filteredActiveReceipts, queuedKeySet]
  );

  const allFilteredActiveQueued =
    filteredActiveReceipts.length > 0 &&
    filteredQueuedCount === filteredActiveReceipts.length;

  // Tab 4: Bulk 3x2 A4 Pay Slip entries (Print Queue, Recorded Receipts, or Monthly Batch Slips)
  const bulkCandidateEntries = useMemo<BulkSlipEntry[]>(() => {
    const q = bulkSearch.trim().toLowerCase();

    if (bulkSource === 'queue') {
      return queuedBulkEntries.filter((entry) => {
        if (bulkBatchFilter !== 'ALL' && entry.student.batchCode !== bulkBatchFilter) {
          return false;
        }
        if (!q) return true;
        return (
          entry.receiptNo.toLowerCase().includes(q) ||
          entry.student.studentName.toLowerCase().includes(q) ||
          entry.student.studentIdCode.toLowerCase().includes(q) ||
          entry.student.batchCode.toLowerCase().includes(q)
        );
      });
    }

    if (bulkSource === 'receipts') {
      return allReceipts
        .filter(({ student, payment }) => {
          if (payment.status === 'Cancelled') return false;
          if (bulkBatchFilter !== 'ALL' && student.batchCode !== bulkBatchFilter) {
            return false;
          }
          if (!q) return true;
          return (
            payment.receiptNo.toLowerCase().includes(q) ||
            student.studentName.toLowerCase().includes(q) ||
            student.studentIdCode.toLowerCase().includes(q) ||
            student.batchCode.toLowerCase().includes(q)
          );
        })
        .map(({ student, payment }) => buildReceiptBulkEntry(student, payment));
    }

    // Monthly Batch / Class Pay Slips derived live from Student Ledger
    const todayDate = new Date().toISOString().slice(0, 10);
    return activeStudents
      .filter((stu) => {
        if (bulkBatchFilter !== 'ALL' && stu.batchCode !== bulkBatchFilter) {
          return false;
        }
        if (!q) return true;
        return (
          stu.studentName.toLowerCase().includes(q) ||
          stu.studentIdCode.toLowerCase().includes(q) ||
          stu.batchCode.toLowerCase().includes(q) ||
          stu.classLevel.toLowerCase().includes(q)
        );
      })
      .map((stu, idx) => {
        const snap = computePaymentSlipSnapshot(
          stu,
          feePlans,
          bulkMonthLabel,
          {},
          0
        );
        return {
          key: `monthly-${stu.id}-${bulkMonthLabel}`,
          student: stu,
          receiptNo: `SLIP-${bulkMonthLabel.slice(0, 3).toUpperCase()}-${String(
            idx + 1
          ).padStart(3, '0')}`,
          paymentDate: todayDate,
          feeMonth: bulkMonthLabel,
          paymentMode: 'Cash' as const,
          paymentStatus: snap.paymentStatus,
          breakdown: {
            registrationFee: snap.registrationFee,
            tuitionFee: snap.tuitionFee,
            hostelFee: snap.hostelFee,
            examinationFee: snap.examinationFee,
            otherCharges: snap.otherCharges,
            previousBackDues: snap.previousBackDues,
            totalPayable: snap.totalPayable,
            previouslyPaid: snap.previouslyPaid,
            currentPayment: snap.currentPayment,
            remainingDues: snap.remainingDues
          },
          copyLabel: 'PAY SLIP',
          collectedBy: instituteConfig.founder
        };
      });
  }, [
    bulkSource,
    queuedBulkEntries,
    allReceipts,
    activeStudents,
    bulkBatchFilter,
    bulkSearch,
    bulkMonthLabel,
    feePlans,
    instituteConfig.founder,
    buildReceiptBulkEntry
  ]);

  const selectedBulkEntries = useMemo(
    () =>
      bulkSource === 'queue'
        ? bulkCandidateEntries
        : bulkCandidateEntries.filter((entry) => !bulkExcludedKeys[entry.key]),
    [bulkSource, bulkCandidateEntries, bulkExcludedKeys]
  );

  const bulkSheetCount = Math.ceil(selectedBulkEntries.length / 6);

  // Monthly Fee Statement dataset
  const monthlyStatementRows = useMemo(() => {
    const q = statementSearch.trim().toLowerCase();
    return activeStudents
      .map((stu) => {
        const fin = computeStudentFinancials(stu, feePlans);
        const rows = buildMonthlyLedgerRows(stu, feePlans);
        const monthRow =
          statementMonth === 'ALL'
            ? null
            : rows.find((r) => r.label === statementMonth);

        const monthReceipts = (stu.feePayments || []).filter((p) => {
          if (p.status === 'Cancelled') return false;
          if (statementMonth === 'ALL') return true;
          const pMonth = p.paidInMonth || formatMonthYearFromDate(p.date);
          return (
            pMonth.toLowerCase() === statementMonth.toLowerCase() ||
            p.monthLabel.toLowerCase().includes(statementMonth.toLowerCase())
          );
        });

        const collectedInPeriod = monthReceipts.reduce((s, p) => s + p.amount, 0);
        const billedForPeriod =
          statementMonth === 'ALL'
            ? fin.currentSessionBilled
            : monthRow
            ? monthRow.totalPayableWithBackDues
            : stu.netMonthlyFee;
        const remainingForPeriod =
          statementMonth === 'ALL'
            ? fin.totalCombinedPending
            : monthRow
            ? monthRow.remainingAmount + monthRow.backDueCarriedIn
            : fin.totalCombinedPending;

        return {
          student: stu,
          billedForPeriod,
          collectedInPeriod,
          remainingForPeriod: Math.max(0, remainingForPeriod),
          receipts: monthReceipts,
          status:
            remainingForPeriod <= 0
              ? 'Paid'
              : collectedInPeriod > 0 || (monthRow && monthRow.paidAmount > 0)
              ? 'Partially Paid'
              : 'Unpaid'
        };
      })
      .filter((row) => {
        if (!q) return true;
        return (
          row.student.studentName.toLowerCase().includes(q) ||
          row.student.studentIdCode.toLowerCase().includes(q) ||
          row.student.batchCode.toLowerCase().includes(q) ||
          row.receipts.some((r) => r.receiptNo.toLowerCase().includes(q))
        );
      });
  }, [activeStudents, feePlans, statementMonth, statementSearch]);

  const statementTotals = useMemo(() => {
    return monthlyStatementRows.reduce(
      (acc, r) => {
        acc.billed += r.billedForPeriod;
        acc.collected += r.collectedInPeriod;
        acc.remaining += r.remainingForPeriod;
        if (r.status === 'Paid') acc.paidCount += 1;
        else if (r.status === 'Partially Paid') acc.partialCount += 1;
        else acc.unpaidCount += 1;
        return acc;
      },
      {
        billed: 0,
        collected: 0,
        remaining: 0,
        paidCount: 0,
        partialCount: 0,
        unpaidCount: 0
      }
    );
  }, [monthlyStatementRows]);

  // Dynamically derive the active student list view for Collection Efficiency %
  const activeEfficiencyContext = useMemo<{
    students: StudentRecord[];
    viewLabel: string;
    activeMonthLabel: string;
    recommendedScope: EfficiencyPeriodMode;
  }>(() => {
    if (activeTab === 'history') {
      const uniqueList: StudentRecord[] = [];
      const seen = new Set<string>();
      for (const row of filteredReceipts) {
        if (!seen.has(row.student.id)) {
          seen.add(row.student.id);
          uniqueList.push(row.student);
        }
      }
      const filterParts: string[] = [];
      if (receiptSearch.trim()) filterParts.push(`"${receiptSearch.trim()}"`);
      if (receiptModeFilter !== 'ALL') filterParts.push(receiptModeFilter);
      if (receiptStatusFilter !== 'all') {
        filterParts.push(
          receiptStatusFilter === 'active' ? 'Active Receipts' : 'Cancelled'
        );
      }
      return {
        students: uniqueList,
        viewLabel:
          filterParts.length > 0
            ? `Receipt List · ${filterParts.join(' · ')}`
            : 'Processed Receipt List (All History)',
        activeMonthLabel: selectedMonthLabel,
        recommendedScope: 'session'
      };
    }

    if (activeTab === 'statement') {
      const stuList = monthlyStatementRows.map((r) => r.student);
      const periodText =
        statementMonth === 'ALL' ? 'Full Session 2026-27' : statementMonth;
      return {
        students: stuList,
        viewLabel: statementSearch.trim()
          ? `Monthly Statement · ${periodText} · "${statementSearch.trim()}"`
          : `Monthly Statement · ${periodText}`,
        activeMonthLabel:
          statementMonth === 'ALL' ? selectedMonthLabel : statementMonth,
        recommendedScope: statementMonth === 'ALL' ? 'session' : 'month'
      };
    }

    if (activeTab === 'bulk') {
      const uniqueList: StudentRecord[] = [];
      const seen = new Set<string>();
      for (const entry of selectedBulkEntries) {
        if (!seen.has(entry.student.id)) {
          seen.add(entry.student.id);
          uniqueList.push(entry.student);
        }
      }
      const sourceText =
        bulkSource === 'queue'
          ? 'Batch Print Queue'
          : bulkSource === 'monthly-batch'
          ? `Monthly Batch Slips (${bulkMonthLabel})`
          : 'Bulk Recorded Receipts';
      const detailParts = [sourceText];
      if (bulkBatchFilter !== 'ALL') detailParts.push(bulkBatchFilter);
      if (bulkSearch.trim()) detailParts.push(`"${bulkSearch.trim()}"`);

      return {
        students: uniqueList,
        viewLabel: detailParts.join(' · '),
        activeMonthLabel:
          bulkSource === 'monthly-batch' ? bulkMonthLabel : selectedMonthLabel,
        recommendedScope: bulkSource === 'monthly-batch' ? 'month' : 'session'
      };
    }

    // Tab 1: Generate Slip — tracks filtered student picker or quick receipt lookup
    if (studentPickerSearch.trim()) {
      return {
        students: filteredPickerStudents,
        viewLabel: `Active Student Picker · "${studentPickerSearch.trim()}"`,
        activeMonthLabel: selectedMonthLabel,
        recommendedScope: 'session'
      };
    }
    if (receiptSearch.trim()) {
      const uniqueList: StudentRecord[] = [];
      const seen = new Set<string>();
      for (const row of filteredReceipts) {
        if (!seen.has(row.student.id)) {
          seen.add(row.student.id);
          uniqueList.push(row.student);
        }
      }
      return {
        students: uniqueList,
        viewLabel: `Quick Receipt Lookup · "${receiptSearch.trim()}"`,
        activeMonthLabel: selectedMonthLabel,
        recommendedScope: 'session'
      };
    }
    return {
      students: activeStudents,
      viewLabel: 'All Active Enrolled Students',
      activeMonthLabel: selectedMonthLabel,
      recommendedScope: 'session'
    };
  }, [
    activeTab,
    activeStudents,
    filteredPickerStudents,
    studentPickerSearch,
    filteredReceipts,
    receiptSearch,
    receiptModeFilter,
    receiptStatusFilter,
    monthlyStatementRows,
    statementMonth,
    statementSearch,
    selectedBulkEntries,
    bulkSource,
    bulkBatchFilter,
    bulkMonthLabel,
    bulkSearch,
    selectedMonthLabel
  ]);

  const handleGenerateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedStudent || !liveSlipCalc) {
      setFormError('Please select an enrolled student first.');
      return;
    }
    if (numericAmount <= 0) {
      setFormError('Enter a valid amount received greater than ₹0.');
      return;
    }
    if (
      (paymentMode === 'UPI / Online' || paymentMode === 'Bank Transfer') &&
      !transactionId.trim()
    ) {
      setFormError(`Please enter the ${paymentMode} Transaction / Reference ID.`);
      return;
    }
    if (isSaving) return;

    // Duplicate payment guard (checks recent submission + identical active ledger entry)
    const sig = `${selectedStudent.id}|${selectedMonthLabel}|${paymentDate}|${numericAmount}|${paymentMode}|${transactionId.trim()}`;
    const now = Date.now();
    if (
      lastSubmittedSignatureRef.current &&
      lastSubmittedSignatureRef.current.sig === sig &&
      now - lastSubmittedSignatureRef.current.ts < 15000
    ) {
      setFormError(
        'Duplicate payment blocked: an identical payment entry was just recorded.'
      );
      return;
    }

    const existingDuplicate = (selectedStudent.feePayments || []).find(
      (p) =>
        p.status !== 'Cancelled' &&
        p.date === paymentDate &&
        p.amount === numericAmount &&
        p.mode === paymentMode &&
        (p.paidInMonth || p.monthLabel) === selectedMonthLabel &&
        (transactionId.trim()
          ? (p.transactionId || '').toLowerCase() ===
            transactionId.trim().toLowerCase()
          : false)
    );
    if (existingDuplicate) {
      setFormError(
        `Duplicate Transaction ID detected (already recorded under Receipt ${existingDuplicate.receiptNo}).`
      );
      return;
    }

    setIsSaving(true);
    try {
      const receiptNo = generateUniqueReceiptNumber(students, paymentDate);
      const paymentId = `fp-slip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const smartAlloc = previewSmartPaymentAllocation(
        selectedStudent,
        feePlans,
        numericAmount,
        paymentDate,
        selectedMonthLabel,
        true
      );

      const auditCreated: PaymentAuditEntry = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toLocaleString('en-IN'),
        action: 'Created',
        actor: instituteConfig.founder,
        reason: `Official Tuition Fee Acknowledgment generated (${paymentMode})`,
        newAmount: numericAmount
      };

      const newPayment: FeePaymentItem = {
        id: paymentId,
        receiptNo,
        date: paymentDate,
        paidInMonth: selectedMonthLabel,
        monthLabel: `${selectedMonthLabel} Fee Receipt`,
        session: selectedStudent.academicSession || '2026-27',
        amount: numericAmount,
        mode: paymentMode,
        transactionId: transactionId.trim() || undefined,
        paymentStatus: liveSlipCalc.paymentStatus,
        isPartialPayment: liveSlipCalc.remainingDues > 0,
        prevYearClearedPart: smartAlloc.prevYearCleared,
        sessionPaidPart: smartAlloc.sessionPaidDelta,
        extraAdvanceAmount: smartAlloc.extraAdvanceToNextMonths,
        adjustmentBreakdown: smartAlloc.breakdown,
        paidByParentName: selectedStudent.parentName,
        collectedBy: instituteConfig.founder,
        remarks: remarks.trim() || undefined,
        feeBreakdown: {
          registrationFee: liveSlipCalc.registrationFee,
          tuitionFee: liveSlipCalc.tuitionFee,
          hostelFee: liveSlipCalc.hostelFee,
          examinationFee: liveSlipCalc.examinationFee,
          otherCharges: liveSlipCalc.otherCharges,
          previousBackDues: liveSlipCalc.previousBackDues,
          totalPayable: liveSlipCalc.totalPayable,
          previouslyPaid: liveSlipCalc.previouslyPaid,
          currentPayment: liveSlipCalc.currentPayment,
          remainingDues: liveSlipCalc.remainingDues
        },
        status: 'Active',
        auditHistory: [auditCreated]
      };

      // Save to ledger FIRST before revealing official generated receipt
      onRecordFeePayment(selectedStudent.id, newPayment);
      lastSubmittedSignatureRef.current = { sig, ts: now };

      if (autoQueueOnSave) {
        addManyReceiptsToQueue([{ studentId: selectedStudent.id, paymentId }]);
      }

      setSavedReceiptView({
        studentId: selectedStudent.id,
        paymentId,
        isDuplicate: false
      });
      setFormSuccess(
        autoQueueOnSave
          ? `Payment saved, Receipt ${receiptNo} generated, and added to Print Queue.`
          : `Payment saved to student ledger & Receipt ${receiptNo} generated successfully.`
      );
      setAmountInput('');
      setTransactionId('');
      setRemarks('');
      setHostelFeeInput('0');
      setExamFeeInput('0');
      setOtherChargesInput('0');
    } finally {
      setIsSaving(false);
    }
  };

  const triggerPrint = (
    mode: 'slip' | 'statement' | 'bulk',
    target: 'studio' | 'queue' = 'studio'
  ) => {
    if (mode === 'bulk') {
      setBulkPrintTarget(target);
    }
    setPrintMode(mode);
    window.setTimeout(() => {
      window.print();
    }, 140);
  };

  const buildWhatsAppShareUrl = (
    stu: StudentRecord,
    pay: FeePaymentItem,
    remaining: number,
    isDuplicate: boolean
  ) => {
    const phoneDigits = stu.phone.replace(/\D/g, '').slice(-10);
    const lines = [
      `*SHIKSHA NIKETAN TUITION CENTRE*`,
      `Gadhiya, Bhaptiyahi (Supaul)`,
      `--------------------------------`,
      `*OFFICIAL TUITION FEE ACKNOWLEDGMENT*${isDuplicate ? ' (DUPLICATE COPY)' : ''}`,
      `Receipt No.: ${pay.receiptNo}`,
      `Date: ${pay.date}`,
      `Student: ${stu.studentName} (${stu.studentIdCode})`,
      `Father's Name: ${stu.parentName}`,
      `Class & Batch: ${stu.classLevel} (${stu.batchCode})`,
      `Fee Month: ${pay.paidInMonth || pay.monthLabel}`,
      `Payment Mode: ${pay.mode}${pay.transactionId ? ` · Txn: ${pay.transactionId}` : ''}`,
      `Amount Received: Rs. ${pay.amount.toLocaleString('en-IN')}`,
      `Remaining Dues: Rs. ${Math.max(0, remaining).toLocaleString('en-IN')}`,
      `Status: ${pay.paymentStatus || (remaining === 0 ? 'Paid' : 'Partially Paid')}`,
      `--------------------------------`,
      `Shiksha Niketan • Non-refundable`
    ];
    return `https://wa.me/91${phoneDigits}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  const handleSaveAuditMutation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry || !editingEntry.reason.trim()) return;
    onEditOrCancelPayment(editingEntry.studentId, editingEntry.payment.id, {
      action: editingEntry.mode === 'cancel' ? 'Cancelled' : 'Edited',
      reason: editingEntry.reason.trim(),
      newAmount:
        editingEntry.mode === 'edit'
          ? Math.max(0, Math.round(Number(editingEntry.newAmount) || 0))
          : undefined,
      newMode: editingEntry.mode === 'edit' ? editingEntry.newMode : undefined,
      newTransactionId:
        editingEntry.mode === 'edit' ? editingEntry.newTxId.trim() : undefined,
      newRemarks:
        editingEntry.mode === 'edit' ? editingEntry.newRemarks.trim() : undefined
    });
    setEditingEntry(null);
  };

  // Dedicated Bulk 3x2 A4 Print Overlay (supports both Print Queue Batch & Bulk Studio)
  if (printMode === 'bulk') {
    const activePrintEntries =
      bulkPrintTarget === 'queue' ? queuedBulkEntries : selectedBulkEntries;
    const activePrintSheets = Math.ceil(activePrintEntries.length / 6);

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/85 overflow-y-auto p-4 sm:p-6 print:static print:bg-white print:p-0">
        <div className="max-w-[1120px] mx-auto mb-4 flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl shadow-lg no-print">
          <div className="text-xs font-bold text-slate-900">
            {bulkPrintTarget === 'queue'
              ? 'Print Queue Batch — 3×2 A4 Print'
              : 'Bulk A4 Pay Slip Print'}{' '}
            <span className="font-mono tabular-nums text-slate-600 font-semibold">
              ({activePrintEntries.length} Slips · {activePrintSheets}{' '}
              {activePrintSheets === 1 ? 'Sheet' : 'Sheets'})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Size Scale 80% / 90% / 100% */}
            <div
              className="inline-flex items-center p-1 bg-slate-100 rounded-lg text-xs"
              role="group"
              aria-label="Bulk print size percentage"
            >
              {([80, 90, 100] as const).map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setBulkScale(pct)}
                  className={`px-2.5 py-1 rounded-md font-mono font-bold transition-colors cursor-pointer ${
                    bulkScale === pct
                      ? 'bg-[#7a1426] text-white'
                      : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>

            {/* Orientation Toggle */}
            <div
              className="inline-flex items-center p-1 bg-slate-100 rounded-lg text-xs"
              role="group"
              aria-label="A4 grid orientation"
            >
              <button
                type="button"
                onClick={() => setBulkOrientation('3x2-landscape')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                  bulkOrientation === '3x2-landscape'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600'
                }`}
              >
                3×2 Landscape
              </button>
              <button
                type="button"
                onClick={() => setBulkOrientation('2x3-portrait')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                  bulkOrientation === '2x3-portrait'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600'
                }`}
              >
                2×3 Portrait
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#7a1426] hover:bg-[#5e0f1d] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save A4 PDF</span>
            </button>

            {bulkPrintTarget === 'queue' && activePrintEntries.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearPrintQueue();
                  setPrintMode('none');
                }}
                className="min-h-[40px] px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Queue &amp; Close</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setPrintMode('none')}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        <BulkFeeSlipSheets
          entries={activePrintEntries}
          instituteConfig={instituteConfig}
          scalePercent={bulkScale}
          orientation={bulkOrientation}
          showCutLines={bulkShowCutLines}
          isPrintOverlay
        />
      </div>
    );
  }

  // Dedicated Print View Overlay (closes cleanly after printing or via button)
  if (printMode === 'slip' && activeSavedSlip) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/80 overflow-y-auto p-4 sm:p-8 print:static print:bg-white print:p-0">
        <div className="max-w-[820px] mx-auto mb-4 flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-3 rounded-2xl shadow-lg no-print">
          <div className="text-xs font-bold text-slate-800">
            Official Fee Payment Slip · {activeSavedSlip.payment.receiptNo}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex items-center p-1 bg-slate-100 rounded-lg text-xs"
              role="group"
              aria-label="Single slip print scale"
            >
              {([80, 90, 100] as const).map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setSingleSlipScale(pct)}
                  className={`px-2.5 py-1 rounded-md font-mono font-bold transition-colors cursor-pointer ${
                    singleSlipScale === pct
                      ? 'bg-[#7a1426] text-white'
                      : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#7a1426] hover:bg-[#5e0f1d] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as A4 PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setPrintMode('none')}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        <div
          id="printable-fee-slip-area"
          style={{
            transform: `scale(${singleSlipScale / 100})`,
            transformOrigin: 'top center'
          }}
        >
          <OfficialFeeSlipDocument
            student={activeSavedSlip.student}
            instituteConfig={instituteConfig}
            receiptNo={activeSavedSlip.payment.receiptNo}
            paymentDate={activeSavedSlip.payment.date}
            feeMonth={
              activeSavedSlip.payment.paidInMonth ||
              activeSavedSlip.payment.monthLabel
            }
            paymentMode={activeSavedSlip.payment.mode}
            transactionId={activeSavedSlip.payment.transactionId}
            paymentStatus={activeSavedSlip.paymentStatus}
            breakdown={activeSavedSlip.breakdown}
            remarks={activeSavedSlip.payment.remarks}
            isDuplicateCopy={activeSavedSlip.isDuplicate}
            isCancelled={activeSavedSlip.payment.status === 'Cancelled'}
            collectedBy={activeSavedSlip.payment.collectedBy}
          />
        </div>
      </div>
    );
  }

  if (printMode === 'statement') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/80 overflow-y-auto p-4 sm:p-8 print:static print:bg-white print:p-0">
        <div className="max-w-[820px] mx-auto mb-4 flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-3 rounded-2xl shadow-lg no-print">
          <div className="text-xs font-bold text-slate-800">
            Monthly Fee Statement ·{' '}
            {statementMonth === 'ALL' ? 'Full Session 2026-27' : statementMonth}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#7a1426] hover:bg-[#5e0f1d] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save Statement PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setPrintMode('none')}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        <div
          id="printable-monthly-statement-area"
          className="bg-white max-w-[794px] mx-auto border-[3px] border-[#7a1426] p-2"
        >
          <div className="border border-[#7a1426] p-6 space-y-5 bg-white">
            <div className="flex items-center gap-4 pb-3 border-b-2 border-[#7a1426]">
              <img
                src={INSTITUTE_CREST_URL}
                alt="Shiksha Niketan Crest"
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full border border-[#7a1426] object-cover"
              />
              <div className="flex-1 text-center pr-10">
                <h1 className="font-display text-lg font-black text-[#7a1426] uppercase">
                  SHIKSHA NIKETAN TUITION CENTRE
                </h1>
                <p className="text-xs text-slate-700">
                  Gadhiya, Bhaptiyahi (Supaul) · Monthly Fee Statement (
                  {statementMonth === 'ALL' ? 'Full Session' : statementMonth})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs border border-[#7a1426]/60 p-3 bg-[#7a1426]/[0.04]">
              <div>
                <span className="text-slate-600 block">Total Payable</span>
                <strong className="font-mono tabular-nums text-sm text-slate-950">
                  ₹{statementTotals.billed.toLocaleString('en-IN')}
                </strong>
              </div>
              <div>
                <span className="text-slate-600 block">Collected</span>
                <strong className="font-mono tabular-nums text-sm text-emerald-800">
                  ₹{statementTotals.collected.toLocaleString('en-IN')}
                </strong>
              </div>
              <div>
                <span className="text-slate-600 block">Remaining Dues</span>
                <strong className="font-mono tabular-nums text-sm text-rose-800">
                  ₹{statementTotals.remaining.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            <table className="w-full border-collapse border border-[#7a1426] text-[11px]">
              <thead>
                <tr className="bg-[#7a1426] text-white">
                  <th className="border border-[#7a1426] px-2 py-1.5 text-left">Roll No.</th>
                  <th className="border border-[#7a1426] px-2 py-1.5 text-left">Student Name</th>
                  <th className="border border-[#7a1426] px-2 py-1.5 text-left">Class</th>
                  <th className="border border-[#7a1426] px-2 py-1.5 text-right">Payable</th>
                  <th className="border border-[#7a1426] px-2 py-1.5 text-right">Collected</th>
                  <th className="border border-[#7a1426] px-2 py-1.5 text-right">Remaining</th>
                  <th className="border border-[#7a1426] px-2 py-1.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStatementRows.map((row) => (
                  <tr key={row.student.id}>
                    <td className="border border-[#7a1426]/60 px-2 py-1.5 font-mono">
                      {row.student.studentIdCode}
                    </td>
                    <td className="border border-[#7a1426]/60 px-2 py-1.5 font-semibold">
                      {row.student.studentName}
                    </td>
                    <td className="border border-[#7a1426]/60 px-2 py-1.5">
                      {row.student.classLevel}
                    </td>
                    <td className="border border-[#7a1426]/60 px-2 py-1.5 text-right font-mono tabular-nums">
                      ₹{row.billedForPeriod.toLocaleString('en-IN')}
                    </td>
                    <td className="border border-[#7a1426]/60 px-2 py-1.5 text-right font-mono tabular-nums text-emerald-800 font-bold">
                      ₹{row.collectedInPeriod.toLocaleString('en-IN')}
                    </td>
                    <td className="border border-[#7a1426]/60 px-2 py-1.5 text-right font-mono tabular-nums text-rose-800 font-bold">
                      ₹{row.remainingForPeriod.toLocaleString('en-IN')}
                    </td>
                    <td className="border border-[#7a1426]/60 px-2 py-1.5 text-center font-bold">
                      {row.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-8 flex items-end justify-between text-xs border-t border-[#7a1426]/40">
              <span className="font-bold text-[#7a1426]">
                Shiksha Niketan &bull; Non-refundable
              </span>
              <div className="text-center border-t border-[#7a1426] pt-1 min-w-[160px]">
                <strong className="text-[#7a1426]">Authorized Signature</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Section Heading & Mode Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-bold text-[#7a1426] uppercase tracking-wider">
            Synchronized with Live Student Fee Ledger
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Official Tuition Fee Payment Slip
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Select a student, choose the fee month, enter the payment received, and generate an official A4 receipt automatically synced with the student&apos;s ledger.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
          {(
            [
              { id: 'generate', label: 'Generate Slip', icon: Receipt },
              {
                id: 'history',
                label: `Search & Duplicates (${allReceipts.length})`,
                icon: History
              },
              {
                id: 'bulk',
                label: 'Bulk Print (3×2)',
                icon: LayoutGrid
              },
              {
                id: 'statement',
                label: 'Monthly Statement',
                icon: FileSpreadsheet
              }
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-[#7a1426] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Revenue & Cash Flow Summary Dashboard (Expected vs. Actual Collected per Batch / Class) */}
      <FeeRevenueSummaryDashboard
        students={students}
        batches={batches}
        feePlans={feePlans}
        selectedMonthLabel={selectedMonthLabel}
        selectedStudent={selectedStudent}
        onSelectStudentForPayment={(studentId) => {
          setSelectedStudentId(studentId);
          setActiveTab('generate');
          setSavedReceiptView(null);
          setFormError('');
          setFormSuccess('');
          window.setTimeout(() => {
            const el = document.getElementById('slip-amount-received');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.focus();
            }
          }, 60);
        }}
      />

      {/* Batch Print Queue Command Strip (Synced across all tabs with 3x2 A4 layout optimization) */}
      <FeePrintQueuePanel
        entries={queuedBulkEntries}
        isExpanded={isQueueExpanded}
        onToggleExpand={() => setIsQueueExpanded((prev) => !prev)}
        scalePercent={bulkScale}
        onScaleChange={setBulkScale}
        orientation={bulkOrientation}
        onOrientationChange={setBulkOrientation}
        autoQueueOnSave={autoQueueOnSave}
        onToggleAutoQueueOnSave={setAutoQueueOnSave}
        onRemoveEntry={removeReceiptFromQueue}
        onMoveEntry={moveQueueItem}
        onClearQueue={clearPrintQueue}
        onOpenQueueInStudio={() => {
          setBulkSource('queue');
          setBulkBatchFilter('ALL');
          setBulkSearch('');
          setActiveTab('bulk');
        }}
        onPrintQueueBatch={() => triggerPrint('bulk', 'queue')}
      />

      {/* Dynamic Collection Efficiency % Summary Panel for Active Student List View */}
      <CollectionEfficiencySummaryPanel
        activeStudents={activeEfficiencyContext.students}
        viewLabel={activeEfficiencyContext.viewLabel}
        feePlans={feePlans}
        activeMonthLabel={activeEfficiencyContext.activeMonthLabel}
        recommendedScope={activeEfficiencyContext.recommendedScope}
      />

      {/* TAB 1: GENERATE NEW OFFICIAL FEE PAYMENT SLIP */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          {/* Quick Historical Fee Receipt Lookup Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden no-print">
            <div className="p-4 flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="quick-fee-receipt-search"
                  type="text"
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' && receiptSearch) {
                      setReceiptSearch('');
                    }
                  }}
                  aria-label="Filter fee receipts by receipt number or student name"
                  placeholder="Quick receipt lookup — filter by Receipt No. (SNTC-...) or Student Name..."
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7a1426]/30 focus:border-[#7a1426]"
                />
                {receiptSearch && (
                  <button
                    type="button"
                    onClick={() => setReceiptSearch('')}
                    aria-label="Clear receipt search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 shrink-0 text-xs">
                <span className="text-slate-600 font-medium">
                  <strong className="font-mono tabular-nums text-slate-900">
                    {filteredReceipts.length}
                  </strong>{' '}
                  of{' '}
                  <span className="font-mono tabular-nums">{allReceipts.length}</span>{' '}
                  receipts
                  {receiptSearch.trim() && (
                    <>
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span className="font-mono tabular-nums font-bold text-emerald-700">
                        ₹{filteredReceiptsActiveTotal.toLocaleString('en-IN')}
                      </span>
                    </>
                  )}
                </span>

                <button
                  type="button"
                  onClick={() => setShowQuickReceiptList((prev) => !prev)}
                  className="h-9 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {receiptSearch.trim() || showQuickReceiptList
                    ? 'Hide Receipt List'
                    : 'Browse Recent Receipts'}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="h-9 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Full Receipt History
                </button>
              </div>
            </div>

            {(receiptSearch.trim().length > 0 || showQuickReceiptList) && (
              <div className="border-t border-slate-200 bg-slate-50/50">
                {filteredReceipts.length === 0 ? (
                  <div className="px-4 py-6 text-center space-y-2">
                    <p className="text-xs font-semibold text-slate-700">
                      No historical fee receipts matched &ldquo;{receiptSearch}&rdquo;.
                    </p>
                    <button
                      type="button"
                      onClick={() => setReceiptSearch('')}
                      className="text-xs font-bold text-[#7a1426] hover:underline cursor-pointer"
                    >
                      Clear search filter
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse bg-white">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
                        <tr>
                          <th className="px-3 py-2.5 w-9 text-center">
                            <input
                              type="checkbox"
                              aria-label="Queue all visible recent receipts"
                              checked={
                                filteredReceipts
                                  .slice(0, 12)
                                  .filter((r) => r.payment.status !== 'Cancelled')
                                  .length > 0 &&
                                filteredReceipts
                                  .slice(0, 12)
                                  .filter((r) => r.payment.status !== 'Cancelled')
                                  .every((r) =>
                                    isReceiptInQueue(r.student.id, r.payment.id)
                                  )
                              }
                              onChange={(e) => {
                                const visibleActive = filteredReceipts
                                  .slice(0, 12)
                                  .filter((r) => r.payment.status !== 'Cancelled')
                                  .map((r) => ({
                                    studentId: r.student.id,
                                    paymentId: r.payment.id
                                  }));
                                if (e.target.checked) {
                                  addManyReceiptsToQueue(visibleActive);
                                } else {
                                  removeManyReceiptsFromQueue(visibleActive);
                                }
                              }}
                              className="w-4 h-4 accent-[#7a1426] rounded cursor-pointer"
                            />
                          </th>
                          <th className="px-4 py-2.5 font-semibold">Receipt No.</th>
                          <th className="px-4 py-2.5 font-semibold">Student Name</th>
                          <th className="px-4 py-2.5 font-semibold">Month &amp; Date</th>
                          <th className="px-4 py-2.5 font-semibold">Mode</th>
                          <th className="px-4 py-2.5 font-semibold text-right">Amount</th>
                          <th className="px-4 py-2.5 font-semibold">Status</th>
                          <th className="px-4 py-2.5 font-semibold text-right">Quick Access</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredReceipts.slice(0, 12).map(({ student, payment }) => {
                          const cancelled = payment.status === 'Cancelled';
                          const queued =
                            !cancelled && isReceiptInQueue(student.id, payment.id);
                          const isLoaded =
                            savedReceiptView?.paymentId === payment.id &&
                            savedReceiptView?.studentId === student.id;
                          return (
                            <tr
                              key={`quick-${student.id}-${payment.id}`}
                              className={
                                isLoaded
                                  ? 'bg-[#7a1426]/[0.06]'
                                  : queued
                                  ? 'bg-[#7a1426]/[0.03]'
                                  : cancelled
                                  ? 'bg-rose-50/40 text-slate-500'
                                  : 'hover:bg-slate-50'
                              }
                            >
                              <td className="px-3 py-2.5 text-center">
                                <input
                                  type="checkbox"
                                  disabled={cancelled}
                                  checked={queued}
                                  onChange={() =>
                                    toggleReceiptInQueue(student.id, payment.id)
                                  }
                                  aria-label={`Select receipt ${payment.receiptNo} for Print Queue`}
                                  className="w-4 h-4 accent-[#7a1426] rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                />
                              </td>
                              <td className="px-4 py-2.5 font-mono font-bold text-[#7a1426] whitespace-nowrap">
                                {payment.receiptNo}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="font-semibold text-slate-900">
                                  {student.studentName}
                                </span>
                                <span className="text-[11px] font-mono text-slate-500 ml-1.5">
                                  {student.studentIdCode}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 whitespace-nowrap">
                                <span className="text-slate-800">
                                  {payment.paidInMonth || payment.monthLabel}
                                </span>
                                <span className="text-slate-400 mx-1">·</span>
                                <span className="font-mono text-[11px] text-slate-500">
                                  {payment.date}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 whitespace-nowrap text-slate-700">
                                {payment.mode}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                                {cancelled ? (
                                  <span className="line-through text-rose-700">
                                    ₹{payment.amount.toLocaleString('en-IN')}
                                  </span>
                                ) : (
                                  `₹${payment.amount.toLocaleString('en-IN')}`
                                )}
                              </td>
                              <td className="px-4 py-2.5 whitespace-nowrap font-semibold">
                                <span
                                  className={
                                    cancelled
                                      ? 'text-rose-700'
                                      : payment.paymentStatus === 'Paid'
                                      ? 'text-emerald-700'
                                      : 'text-amber-700'
                                  }
                                >
                                  {cancelled
                                    ? 'Cancelled'
                                    : payment.paymentStatus ||
                                      (payment.isPartialPayment ? 'Partially Paid' : 'Paid')}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openHistoricalReceipt(student.id, payment.id, false)
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold cursor-pointer"
                                  >
                                    View Slip
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openHistoricalReceipt(student.id, payment.id, true)
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-[#7a1426]/10 hover:bg-[#7a1426]/20 text-[#7a1426] font-semibold inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>Duplicate</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openHistoricalReceipt(
                                        student.id,
                                        payment.id,
                                        true,
                                        true
                                      )
                                    }
                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                                    title="Print / Download Receipt PDF"
                                    aria-label={`Print receipt ${payment.receiptNo}`}
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {filteredReceipts.length > 12 && (
                      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                        <span>
                          Showing top 12 of {filteredReceipts.length} matching receipts.
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('history')}
                          className="font-bold text-[#7a1426] hover:underline cursor-pointer"
                        >
                          View all {filteredReceipts.length} in Search &amp; Duplicates →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: 5-Step Smart Fee Entry Form */}
          <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#7a1426]" />
                <span>Record Payment &amp; Issue Receipt</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                Auto-Ledger Sync
              </span>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleGenerateReceipt} className="space-y-4">
              {/* Step 1: Select Student */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  1. Select Student (Auto-fetches Profile &amp; Ledger)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentPickerSearch}
                    onChange={(e) => setStudentPickerSearch(e.target.value)}
                    placeholder="Filter by student name, roll no., or batch..."
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7a1426]/30 focus:border-[#7a1426]"
                  />
                </div>
                <select
                  value={selectedStudent?.id || ''}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    setSavedReceiptView(null);
                    setFormError('');
                    setFormSuccess('');
                  }}
                  className="w-full h-11 px-3 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7a1426]/30 focus:border-[#7a1426]"
                >
                  {filteredPickerStudents.map((stu) => {
                    const f = computeStudentFinancials(stu, feePlans);
                    return (
                      <option key={stu.id} value={stu.id}>
                        {stu.studentIdCode} — {stu.studentName} ({stu.classLevel} · Due: ₹
                        {f.totalCombinedPending.toLocaleString('en-IN')})
                      </option>
                    );
                  })}
                </select>

                {/* Auto-fetched Read-Only Student Summary */}
                {selectedStudent && liveStudentFinancials && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] grid grid-cols-2 gap-y-1.5 gap-x-3">
                    <div>
                      <span className="text-slate-500">Father: </span>
                      <strong className="text-slate-900">
                        {selectedStudent.parentName}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Batch: </span>
                      <strong className="text-slate-900">
                        {selectedStudent.batchCode}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Monthly Fee: </span>
                      <strong className="font-mono tabular-nums text-slate-900">
                        ₹{selectedStudent.netMonthlyFee.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Ledger Pending: </span>
                      <strong
                        className={`font-mono tabular-nums ${
                          liveStudentFinancials.totalCombinedPending > 0
                            ? 'text-rose-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        ₹{liveStudentFinancials.totalCombinedPending.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Payment Month & Payment Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    2. Fee Month
                  </label>
                  <select
                    value={selectedMonthLabel}
                    onChange={(e) => {
                      setSelectedMonthLabel(e.target.value);
                      setSavedReceiptView(null);
                    }}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900"
                  >
                    {SESSION_MONTHS.map((m) => (
                      <option key={m.key} value={m.label}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Optional Hostel / Exam / Other Charges */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowExtraCharges((v) => !v)}
                  className="text-xs font-bold text-[#7a1426] hover:underline cursor-pointer"
                >
                  {showExtraCharges
                    ? 'Hide Extra Charges (Hostel / Exam / Other)'
                    : '+ Add Optional Hostel, Examination or Other Charges'}
                </button>
                {showExtraCharges && (
                  <div className="mt-2.5 grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Hostel Fee (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={hostelFeeInput}
                        onChange={(e) => setHostelFeeInput(e.target.value)}
                        className="w-full h-10 px-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Exam Fee (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={examFeeInput}
                        onChange={(e) => setExamFeeInput(e.target.value)}
                        className="w-full h-10 px-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Other (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={otherChargesInput}
                        onChange={(e) => setOtherChargesInput(e.target.value)}
                        className="w-full h-10 px-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Amount Received (Supports Full & Partial Payments) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="slip-amount-received"
                    className="text-xs font-bold text-slate-800"
                  >
                    3. Amount Received (₹)
                  </label>
                  {liveSlipCalc && (
                    <div className="flex items-center gap-2 text-[11px]">
                      {liveSlipCalc.tuitionFee > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setAmountInput(String(liveSlipCalc.tuitionFee))
                          }
                          className="text-sky-700 hover:underline font-bold cursor-pointer"
                        >
                          1 Month (₹{liveSlipCalc.tuitionFee})
                        </button>
                      )}
                      {liveSlipCalc.totalPayable - liveSlipCalc.previouslyPaid >
                        0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setAmountInput(
                              String(
                                Math.max(
                                  0,
                                  liveSlipCalc.totalPayable -
                                    liveSlipCalc.previouslyPaid
                                )
                              )
                            )
                          }
                          className="text-[#7a1426] hover:underline font-bold cursor-pointer"
                        >
                          Full Due (₹
                          {Math.max(
                            0,
                            liveSlipCalc.totalPayable -
                              liveSlipCalc.previouslyPaid
                          )}
                          )
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <input
                  id="slip-amount-received"
                  type="number"
                  min={1}
                  required
                  value={amountInput}
                  onChange={(e) => {
                    setAmountInput(e.target.value);
                    setSavedReceiptView(null);
                  }}
                  placeholder="Enter full or partial payment amount in ₹"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-mono font-bold text-slate-950 focus:outline-none focus:ring-2 focus:ring-[#7a1426]/30 focus:border-[#7a1426]"
                />
              </div>

              {/* Step 4: Payment Mode & Optional Transaction ID */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  4. Payment Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Cash', 'UPI / Online', 'Bank Transfer'] as const).map(
                    (mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        className={`min-h-[42px] px-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                          paymentMode === mode
                            ? 'bg-[#7a1426] border-[#7a1426] text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {mode}
                      </button>
                    )
                  )}
                </div>

                {(paymentMode === 'UPI / Online' ||
                  paymentMode === 'Bank Transfer') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Transaction / UTR Reference ID
                    </label>
                    <input
                      type="text"
                      required
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g. UPI432198765432 or NEFT Ref"
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Paid by Father at office counter"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Live Calculation Summary before Saving */}
              {liveSlipCalc && (
                <div className="p-3.5 rounded-xl bg-[#7a1426]/[0.05] border border-[#7a1426]/25 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Payable (incl. Back Dues):</span>
                    <strong className="font-mono tabular-nums text-slate-900">
                      ₹{liveSlipCalc.totalPayable.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Previously Paid ({selectedMonthLabel}):</span>
                    <strong className="font-mono tabular-nums text-slate-800">
                      ₹{liveSlipCalc.previouslyPaid.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Remaining After Payment:</span>
                    <strong
                      className={`font-mono tabular-nums ${
                        liveSlipCalc.remainingDues > 0
                          ? 'text-rose-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      ₹{liveSlipCalc.remainingDues.toLocaleString('en-IN')} (
                      {liveSlipCalc.paymentStatus})
                    </strong>
                  </div>
                </div>
              )}

              {/* Optional Auto-Queue toggle */}
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoQueueOnSave}
                  onChange={(e) => setAutoQueueOnSave(e.target.checked)}
                  className="w-4 h-4 accent-[#7a1426] rounded cursor-pointer"
                />
                <span>Auto-add generated receipt to 3×2 Batch Print Queue</span>
              </label>

              {/* Step 5: Generate Receipt CTA */}
              <button
                type="submit"
                disabled={isSaving || !selectedStudent}
                className="w-full min-h-[48px] rounded-xl bg-[#7a1426] hover:bg-[#5e0f1d] disabled:opacity-50 text-white text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isSaving
                    ? 'Saving to Ledger...'
                    : '5. Save Payment & Generate Official Receipt'}
                </span>
              </button>
            </form>
          </div>

          {/* Right Column: Official A4 Maroon Tuition Fee Acknowledgment Preview / Saved Receipt */}
          <div id="official-slip-preview-panel" className="xl:col-span-7 space-y-4">
            {/* Action Toolbar when Official Receipt is Saved */}
            {activeSavedSlip ? (
              <div className="bg-emerald-950 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-emerald-300">
                    {activeSavedSlip.isDuplicate
                      ? 'Duplicate Receipt Ready'
                      : 'Receipt Saved & Synced with Ledger'}
                  </p>
                  <p className="text-xs text-slate-200 font-mono truncate">
                    {activeSavedSlip.payment.receiptNo} ·{' '}
                    {activeSavedSlip.student.studentName}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {activeSavedSlip.payment.status !== 'Cancelled' && (
                    <button
                      type="button"
                      onClick={() =>
                        toggleReceiptInQueue(
                          activeSavedSlip.student.id,
                          activeSavedSlip.payment.id
                        )
                      }
                      className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                        isReceiptInQueue(
                          activeSavedSlip.student.id,
                          activeSavedSlip.payment.id
                        )
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                          : 'bg-white/15 hover:bg-white/25 text-white border border-white/25'
                      }`}
                    >
                      {isReceiptInQueue(
                        activeSavedSlip.student.id,
                        activeSavedSlip.payment.id
                      ) ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>In Print Queue</span>
                        </>
                      ) : (
                        <>
                          <Layers className="w-3.5 h-3.5" />
                          <span>Add to Print Queue</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => triggerPrint('slip')}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 text-[#7a1426]" />
                    <span>Download PDF / Print</span>
                  </button>
                  <a
                    href={buildWhatsAppShareUrl(
                      activeSavedSlip.student,
                      activeSavedSlip.payment,
                      activeSavedSlip.breakdown.remainingDues,
                      activeSavedSlip.isDuplicate
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Share WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 text-white rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs">
                <span>
                  Live Ledger Draft — Enter amount and click{' '}
                  <strong>Save Payment &amp; Generate Official Receipt</strong> to issue a numbered receipt.
                </span>
                <span className="font-mono text-amber-300 shrink-0">Unsaved Preview</span>
              </div>
            )}

            {/* Render Saved Official Receipt OR Live Preview */}
            {activeSavedSlip ? (
              <OfficialFeeSlipDocument
                student={activeSavedSlip.student}
                instituteConfig={instituteConfig}
                receiptNo={activeSavedSlip.payment.receiptNo}
                paymentDate={activeSavedSlip.payment.date}
                feeMonth={
                  activeSavedSlip.payment.paidInMonth ||
                  activeSavedSlip.payment.monthLabel
                }
                paymentMode={activeSavedSlip.payment.mode}
                transactionId={activeSavedSlip.payment.transactionId}
                paymentStatus={activeSavedSlip.paymentStatus}
                breakdown={activeSavedSlip.breakdown}
                remarks={activeSavedSlip.payment.remarks}
                isDuplicateCopy={activeSavedSlip.isDuplicate}
                isCancelled={activeSavedSlip.payment.status === 'Cancelled'}
                collectedBy={activeSavedSlip.payment.collectedBy}
              />
            ) : selectedStudent && liveSlipCalc ? (
              <OfficialFeeSlipDocument
                student={selectedStudent}
                instituteConfig={instituteConfig}
                receiptNo="AUTO-ASSIGNED ON SAVE"
                paymentDate={paymentDate}
                feeMonth={selectedMonthLabel}
                paymentMode={paymentMode}
                transactionId={transactionId.trim() || undefined}
                paymentStatus={liveSlipCalc.paymentStatus}
                breakdown={{
                  registrationFee: liveSlipCalc.registrationFee,
                  tuitionFee: liveSlipCalc.tuitionFee,
                  hostelFee: liveSlipCalc.hostelFee,
                  examinationFee: liveSlipCalc.examinationFee,
                  otherCharges: liveSlipCalc.otherCharges,
                  previousBackDues: liveSlipCalc.previousBackDues,
                  totalPayable: liveSlipCalc.totalPayable,
                  previouslyPaid: liveSlipCalc.previouslyPaid,
                  currentPayment: liveSlipCalc.currentPayment,
                  remainingDues: liveSlipCalc.remainingDues
                }}
                remarks={remarks.trim() || undefined}
                isPreviewDraft
                collectedBy={instituteConfig.founder}
              />
            ) : null}
          </div>
        </div>
        </div>
      )}

      {/* TAB 2: SEARCH RECEIPTS, DUPLICATE COPIES & AUDIT HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="history-fee-receipt-search"
                  type="text"
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' && receiptSearch) {
                      setReceiptSearch('');
                    }
                  }}
                  aria-label="Filter fee receipt history by receipt number or student name"
                  placeholder="Filter by Receipt No. (SNTC-...), Student Name, Roll No. (STU-2026-...), or Transaction ID..."
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7a1426]/30 focus:border-[#7a1426]"
                />
                {receiptSearch && (
                  <button
                    type="button"
                    onClick={() => setReceiptSearch('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <select
                  aria-label="Filter receipts by payment mode"
                  value={receiptModeFilter}
                  onChange={(e) =>
                    setReceiptModeFilter(
                      e.target.value as 'ALL' | 'Cash' | 'UPI / Online' | 'Bank Transfer'
                    )
                  }
                  className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800"
                >
                  <option value="ALL">All Payment Modes</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI / Online">UPI / Online</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>

                <div
                  className="inline-flex items-center p-1 bg-slate-100 rounded-xl"
                  role="group"
                  aria-label="Filter receipts by status"
                >
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'active', label: 'Active' },
                      { id: 'cancelled', label: 'Cancelled' }
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setReceiptStatusFilter(st.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        receiptStatusFilter === st.id
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <span>
                Showing{' '}
                <strong className="font-mono tabular-nums text-slate-900">
                  {filteredReceipts.length}
                </strong>{' '}
                of{' '}
                <span className="font-mono tabular-nums">{allReceipts.length}</span>{' '}
                historical receipts
                <span className="mx-1.5 text-slate-300">·</span>
                Active Collected Total:{' '}
                <strong className="font-mono tabular-nums text-emerald-700">
                  ₹{filteredReceiptsActiveTotal.toLocaleString('en-IN')}
                </strong>
                {filteredQueuedCount > 0 && (
                  <>
                    <span className="mx-1.5 text-slate-300">·</span>
                    <strong className="font-mono tabular-nums text-[#7a1426]">
                      {filteredQueuedCount} in Print Queue
                    </strong>
                  </>
                )}
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {filteredActiveReceipts.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        addManyReceiptsToQueue(
                          filteredActiveReceipts.map(({ student, payment }) => ({
                            studentId: student.id,
                            paymentId: payment.id
                          }))
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#7a1426]" />
                      <span>Queue Visible ({filteredActiveReceipts.length})</span>
                    </button>
                    {filteredQueuedCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeManyReceiptsFromQueue(
                            filteredActiveReceipts.map(({ student, payment }) => ({
                              studentId: student.id,
                              paymentId: payment.id
                            }))
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap"
                      >
                        Unqueue Visible
                      </button>
                    )}
                  </>
                )}

                {(receiptSearch.trim() ||
                  receiptModeFilter !== 'ALL' ||
                  receiptStatusFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptSearch('');
                      setReceiptModeFilter('ALL');
                      setReceiptStatusFilter('all');
                    }}
                    className="text-xs font-bold text-[#7a1426] hover:underline cursor-pointer whitespace-nowrap"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredReceipts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-800">
                No payment receipts match your search criteria.
              </p>
              <p className="text-xs text-slate-500">
                Try searching with a different receipt number, student name, roll number, or clear active filters.
              </p>
              {(receiptSearch.trim() ||
                receiptModeFilter !== 'ALL' ||
                receiptStatusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setReceiptSearch('');
                    setReceiptModeFilter('ALL');
                    setReceiptStatusFilter('all');
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <tr>
                      <th className="px-3 py-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={allFilteredActiveQueued}
                          disabled={filteredActiveReceipts.length === 0}
                          onChange={(e) => {
                            const items = filteredActiveReceipts.map(
                              ({ student, payment }) => ({
                                studentId: student.id,
                                paymentId: payment.id
                              })
                            );
                            if (e.target.checked) {
                              addManyReceiptsToQueue(items);
                            } else {
                              removeManyReceiptsFromQueue(items);
                            }
                          }}
                          aria-label="Select all filtered active receipts for Print Queue"
                          className="w-4 h-4 accent-[#7a1426] rounded cursor-pointer disabled:opacity-30"
                        />
                      </th>
                      <th className="px-4 py-3 font-bold">Receipt No.</th>
                      <th className="px-4 py-3 font-bold">Student &amp; Roll No.</th>
                      <th className="px-4 py-3 font-bold">Month &amp; Date</th>
                      <th className="px-4 py-3 font-bold">Mode / Txn ID</th>
                      <th className="px-4 py-3 font-bold text-right">Amount</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReceipts.map(({ student, payment }) => {
                      const cancelled = payment.status === 'Cancelled';
                      const queued =
                        !cancelled && isReceiptInQueue(student.id, payment.id);
                      return (
                        <tr
                          key={`${student.id}-${payment.id}`}
                          className={
                            cancelled
                              ? 'bg-rose-50/40 text-slate-500'
                              : queued
                              ? 'bg-[#7a1426]/[0.04]'
                              : 'hover:bg-slate-50/70'
                          }
                        >
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              disabled={cancelled}
                              checked={queued}
                              onChange={() =>
                                toggleReceiptInQueue(student.id, payment.id)
                              }
                              aria-label={`Select receipt ${payment.receiptNo} for Print Queue`}
                              className="w-4 h-4 accent-[#7a1426] rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-[#7a1426]">
                            {payment.receiptNo}
                            {payment.auditHistory && payment.auditHistory.length > 1 && (
                              <span className="block text-[10px] font-sans font-normal text-slate-500">
                                {payment.auditHistory.length} audit events
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900">
                              {student.studentName}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {student.studentIdCode} · {student.classLevel}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800">
                              {payment.paidInMonth || payment.monthLabel}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {payment.date}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold">{payment.mode}</p>
                            {payment.transactionId && (
                              <p className="text-[11px] font-mono text-slate-500">
                                {payment.transactionId}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums font-extrabold text-slate-900">
                            {cancelled ? (
                              <span className="line-through text-rose-700">
                                ₹{payment.amount.toLocaleString('en-IN')}
                              </span>
                            ) : (
                              `₹${payment.amount.toLocaleString('en-IN')}`
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold">
                            <span
                              className={
                                cancelled
                                  ? 'text-rose-700'
                                  : payment.paymentStatus === 'Paid'
                                  ? 'text-emerald-700'
                                  : 'text-amber-700'
                              }
                            >
                              {cancelled
                                ? 'Cancelled'
                                : payment.paymentStatus ||
                                  (payment.isPartialPayment ? 'Partially Paid' : 'Paid')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {!cancelled && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleReceiptInQueue(student.id, payment.id)
                                  }
                                  className={`min-h-[34px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                                    queued
                                      ? 'bg-[#7a1426] text-white hover:bg-[#5e0f1d]'
                                      : 'border border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                                  }`}
                                  title={
                                    queued
                                      ? 'Remove from 3×2 Print Queue'
                                      : 'Add to 3×2 Print Queue'
                                  }
                                >
                                  {queued ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Queued</span>
                                    </>
                                  ) : (
                                    <>
                                      <Layers className="w-3 h-3" />
                                      <span>Queue</span>
                                    </>
                                  )}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  openHistoricalReceipt(student.id, payment.id, false)
                                }
                                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <FileText className="w-3 h-3" />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openHistoricalReceipt(student.id, payment.id, true)
                                }
                                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#7a1426]/10 hover:bg-[#7a1426]/20 text-[#7a1426] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Duplicate</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openHistoricalReceipt(student.id, payment.id, true, true)
                                }
                                className="min-h-[34px] px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
                                title="Print / Save Receipt PDF"
                              >
                                <Printer className="w-3 h-3" />
                              </button>

                              {isAdmin && !cancelled && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingEntry({
                                        studentId: student.id,
                                        payment,
                                        mode: 'edit',
                                        newAmount: String(payment.amount),
                                        newMode: payment.mode,
                                        newTxId: payment.transactionId || '',
                                        newRemarks: payment.remarks || '',
                                        reason: ''
                                      })
                                    }
                                    className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
                                    title="Edit payment with audit trail"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingEntry({
                                        studentId: student.id,
                                        payment,
                                        mode: 'cancel',
                                        newAmount: String(payment.amount),
                                        newMode: payment.mode,
                                        newTxId: payment.transactionId || '',
                                        newRemarks: payment.remarks || '',
                                        reason: ''
                                      })
                                    }
                                    className="min-h-[34px] px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                                    title="Cancel receipt & recalculate ledger"
                                  >
                                    <Ban className="w-3 h-3" />
                                    <span>Cancel</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MONTHLY FEE STATEMENT */}
      {activeTab === 'statement' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="flex items-center gap-2 shrink-0">
                <Calendar className="w-4 h-4 text-[#7a1426]" />
                <label className="text-xs font-bold text-slate-800">
                  Statement Period:
                </label>
                <select
                  value={statementMonth}
                  onChange={(e) => setStatementMonth(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900"
                >
                  <option value="ALL">Full Session (2026-27)</option>
                  {SESSION_MONTHS.map((m) => (
                    <option key={m.key} value={m.label}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={statementSearch}
                  onChange={(e) => setStatementSearch(e.target.value)}
                  aria-label="Filter monthly statement by receipt number or student name"
                  placeholder="Filter by Receipt No. or Student Name..."
                  className="w-full h-10 pl-9 pr-8 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7a1426]/30 focus:border-[#7a1426]"
                />
                {statementSearch && (
                  <button
                    type="button"
                    onClick={() => setStatementSearch('')}
                    aria-label="Clear statement search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => triggerPrint('statement')}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#7a1426] hover:bg-[#5e0f1d] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download Monthly Statement PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-xs text-slate-500 block">Total Payable</span>
              <strong className="font-mono tabular-nums text-lg font-extrabold text-slate-900">
                ₹{statementTotals.billed.toLocaleString('en-IN')}
              </strong>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-xs text-slate-500 block">Total Collected</span>
              <strong className="font-mono tabular-nums text-lg font-extrabold text-emerald-700">
                ₹{statementTotals.collected.toLocaleString('en-IN')}
              </strong>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-xs text-slate-500 block">Outstanding Dues</span>
              <strong className="font-mono tabular-nums text-lg font-extrabold text-rose-700">
                ₹{statementTotals.remaining.toLocaleString('en-IN')}
              </strong>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-xs text-slate-500 block">Status Split</span>
              <strong className="font-mono tabular-nums text-xs font-bold text-slate-800 block mt-1">
                {statementTotals.paidCount} Paid · {statementTotals.partialCount} Partial ·{' '}
                {statementTotals.unpaidCount} Unpaid
              </strong>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#7a1426] text-white">
                  <tr>
                    <th className="px-4 py-3 font-bold">Roll No.</th>
                    <th className="px-4 py-3 font-bold">Student &amp; Class</th>
                    <th className="px-4 py-3 font-bold text-right">Payable</th>
                    <th className="px-4 py-3 font-bold text-right">Collected</th>
                    <th className="px-4 py-3 font-bold text-right">Remaining</th>
                    <th className="px-4 py-3 font-bold">Receipts</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyStatementRows.map((row) => (
                    <tr key={row.student.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        {row.student.studentIdCode}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">
                          {row.student.studentName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {row.student.classLevel} · {row.student.batchCode}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        ₹{row.billedForPeriod.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-emerald-700">
                        ₹{row.collectedInPeriod.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-rose-700">
                        ₹{row.remainingForPeriod.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        {row.receipts.length > 0 ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{row.receipts.map((r) => r.receiptNo).join(', ')}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const items = row.receipts.map((r) => ({
                                  studentId: row.student.id,
                                  paymentId: r.id
                                }));
                                const allInQueue = items.every((item) =>
                                  isReceiptInQueue(item.studentId, item.paymentId)
                                );
                                if (allInQueue) {
                                  removeManyReceiptsFromQueue(items);
                                } else {
                                  addManyReceiptsToQueue(items);
                                }
                              }}
                              className="font-sans text-[11px] font-bold text-[#7a1426] hover:underline cursor-pointer whitespace-nowrap"
                            >
                              {row.receipts.every((r) =>
                                isReceiptInQueue(row.student.id, r.id)
                              )
                                ? 'In Queue'
                                : `+ Queue (${row.receipts.length})`}
                            </button>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold">
                        <span
                          className={
                            row.status === 'Paid'
                              ? 'text-emerald-700'
                              : row.status === 'Partially Paid'
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BULK 3x2 A4 PAY SLIP PRINTING STUDIO (80%, 90%, 100% SCALE) */}
      {activeTab === 'bulk' && (
        <div className="space-y-5">
          {/* Bulk Print Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-display text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-[#7a1426]" />
                  <span>Bulk A4 Pay Slip Printing (3×2 Grid · 6 Slips per Sheet)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Arrange 6 official maroon pay slips per A4 page in 3×2 orientation with selectable 80%, 90%, or 100% print scale.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Slip Source Toggle */}
                <div
                  className="inline-flex items-center p-1 bg-slate-100 rounded-lg text-xs"
                  role="group"
                  aria-label="Bulk slip data source"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setBulkSource('queue');
                      setBulkExcludedKeys({});
                    }}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      bulkSource === 'queue'
                        ? 'bg-white text-[#7a1426] shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Print Queue ({queuedBulkEntries.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkSource('receipts');
                      setBulkExcludedKeys({});
                    }}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      bulkSource === 'receipts'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Recorded Receipts
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkSource('monthly-batch');
                      setBulkExcludedKeys({});
                    }}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      bulkSource === 'monthly-batch'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Monthly Batch Slips
                  </button>
                </div>

                {/* Primary Print Button */}
                <button
                  type="button"
                  disabled={selectedBulkEntries.length === 0}
                  onClick={() =>
                    triggerPrint(
                      'bulk',
                      bulkSource === 'queue' &&
                        bulkBatchFilter === 'ALL' &&
                        !bulkSearch.trim()
                        ? 'queue'
                        : 'studio'
                    )
                  }
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#7a1426] hover:bg-[#5e0f1d] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Printer className="w-4 h-4" />
                  <span>
                    Print 3×2 A4 PDF ({selectedBulkEntries.length} Slips ·{' '}
                    {bulkSheetCount} {bulkSheetCount === 1 ? 'Page' : 'Pages'})
                  </span>
                </button>
              </div>
            </div>

            {/* Layout Settings Row: Orientation | Print Size (80% / 90% / 100%) | Cut Lines */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Print Scale Selector */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-slate-800">Slip Size Scale</p>
                  <p className="text-[11px] text-slate-500">
                    Adjust print zoom per slip
                  </p>
                </div>
                <div
                  className="inline-flex items-center p-1 bg-white border border-slate-200 rounded-lg text-xs"
                  role="group"
                  aria-label="Pay slip print size percentage"
                >
                  {([80, 90, 100] as const).map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setBulkScale(pct)}
                      className={`px-2.5 py-1.5 rounded-md font-mono font-bold transition-colors cursor-pointer ${
                        bulkScale === pct
                          ? 'bg-[#7a1426] text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* A4 Orientation Selector */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-slate-800">A4 Grid Layout</p>
                  <p className="text-[11px] text-slate-500">6 slips per sheet</p>
                </div>
                <div
                  className="inline-flex items-center p-1 bg-white border border-slate-200 rounded-lg text-xs"
                  role="group"
                  aria-label="Bulk A4 sheet orientation"
                >
                  <button
                    type="button"
                    onClick={() => setBulkOrientation('3x2-landscape')}
                    className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      bulkOrientation === '3x2-landscape'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    3×2 Landscape
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkOrientation('2x3-portrait')}
                    className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      bulkOrientation === '2x3-portrait'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    2×3 Portrait
                  </button>
                </div>
              </div>

              {/* Scissor Cut Guides Toggle */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-slate-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Cut Guide Lines</p>
                    <p className="text-[11px] text-slate-500">
                      Dashed trim borders around cells
                    </p>
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkShowCutLines}
                    onChange={(e) => setBulkShowCutLines(e.target.checked)}
                    className="w-4 h-4 accent-[#7a1426] rounded cursor-pointer"
                  />
                  <span>{bulkShowCutLines ? 'On' : 'Off'}</span>
                </label>
              </div>
            </div>

            {/* Filter & Selection Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <select
                  aria-label="Filter bulk slips by batch"
                  value={bulkBatchFilter}
                  onChange={(e) => setBulkBatchFilter(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900"
                >
                  <option value="ALL">All Batches</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.batchCode}>
                      {b.batchCode} · {b.classLevel}
                    </option>
                  ))}
                </select>

                {bulkSource === 'monthly-batch' && (
                  <select
                    aria-label="Select fee month for bulk monthly slips"
                    value={bulkMonthLabel}
                    onChange={(e) => setBulkMonthLabel(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900"
                  >
                    {SESSION_MONTHS.map((m) => (
                      <option key={m.key} value={m.label}>
                        Month: {m.label}
                      </option>
                    ))}
                  </select>
                )}

                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={bulkSearch}
                    onChange={(e) => setBulkSearch(e.target.value)}
                    placeholder="Filter by Receipt No. or Student Name..."
                    className="w-full h-10 pl-9 pr-8 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7a1426]/30 focus:border-[#7a1426]"
                  />
                  {bulkSearch && (
                    <button
                      type="button"
                      onClick={() => setBulkSearch('')}
                      aria-label="Clear bulk search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
                <span className="font-mono tabular-nums text-slate-600">
                  {bulkSource === 'queue' ? 'Queued:' : 'Selected:'}{' '}
                  <strong className="text-slate-900">
                    {selectedBulkEntries.length}
                  </strong>{' '}
                  / {bulkCandidateEntries.length}
                </span>
                {bulkSource === 'queue' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer whitespace-nowrap"
                    >
                      + Pick Receipts
                    </button>
                    {queuedBulkEntries.length > 0 && (
                      <button
                        type="button"
                        onClick={clearPrintQueue}
                        className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold cursor-pointer whitespace-nowrap"
                      >
                        Clear Queue
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setBulkExcludedKeys({})}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                    >
                      Select All
                    </button>
                    {bulkSource === 'monthly-batch' && (
                      <button
                        type="button"
                        onClick={() => {
                          const next: Record<string, boolean> = {};
                          for (const entry of bulkCandidateEntries) {
                            if (entry.breakdown.remainingDues <= 0) {
                              next[entry.key] = true;
                            }
                          }
                          setBulkExcludedKeys(next);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                      >
                        Pending Only
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const next: Record<string, boolean> = {};
                        for (const entry of bulkCandidateEntries) {
                          next[entry.key] = true;
                        }
                        setBulkExcludedKeys(next);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                    >
                      Clear All
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Compact Checkbox / Reorder Strip */}
            {bulkCandidateEntries.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {bulkCandidateEntries.map((entry, idx) => {
                  if (bulkSource === 'queue') {
                    const sheetNum = Math.floor(idx / 6) + 1;
                    const slotNum = (idx % 6) + 1;
                    return (
                      <div
                        key={entry.key}
                        className="px-3.5 py-2 flex items-center justify-between gap-3 text-xs hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono tabular-nums text-[11px] font-semibold text-slate-400 w-11 shrink-0">
                            P{sheetNum}·#{slotNum}
                          </span>
                          <span className="font-mono font-bold text-[#7a1426] shrink-0">
                            {entry.receiptNo}
                          </span>
                          <span className="font-semibold text-slate-900 truncate">
                            {entry.student.studentName}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline shrink-0">
                            {entry.student.batchCode} · {entry.feeMonth}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
                          <span className="text-emerald-700 font-bold">
                            Paid ₹{entry.breakdown.currentPayment.toLocaleString('en-IN')}
                          </span>
                          <button
                            type="button"
                            disabled={idx === 0 || bulkBatchFilter !== 'ALL' || Boolean(bulkSearch.trim())}
                            onClick={() => moveQueueItem(idx, -1)}
                            aria-label={`Move ${entry.receiptNo} earlier`}
                            className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-600 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={
                              idx === bulkCandidateEntries.length - 1 ||
                              bulkBatchFilter !== 'ALL' ||
                              Boolean(bulkSearch.trim())
                            }
                            onClick={() => moveQueueItem(idx, 1)}
                            aria-label={`Move ${entry.receiptNo} later`}
                            className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-600 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              removeReceiptFromQueue(
                                entry.student.id,
                                entry.paymentId || ''
                              )
                            }
                            aria-label={`Remove ${entry.receiptNo} from queue`}
                            className="p-1 rounded border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-700 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  const checked = !bulkExcludedKeys[entry.key];
                  return (
                    <label
                      key={entry.key}
                      className="px-3.5 py-2 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setBulkExcludedKeys((prev) => ({
                              ...prev,
                              [entry.key]: checked
                            }))
                          }
                          className="w-4 h-4 accent-[#7a1426] rounded cursor-pointer shrink-0"
                        />
                        <span className="font-mono font-bold text-[#7a1426] shrink-0">
                          {entry.receiptNo}
                        </span>
                        <span className="font-semibold text-slate-900 truncate">
                          {entry.student.studentName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 hidden sm:inline shrink-0">
                          {entry.student.batchCode} · {entry.feeMonth}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono tabular-nums shrink-0">
                        <span className="text-emerald-700 font-bold">
                          Paid ₹{entry.breakdown.currentPayment.toLocaleString('en-IN')}
                        </span>
                        <span
                          className={
                            entry.breakdown.remainingDues > 0
                              ? 'text-rose-700 font-bold'
                              : 'text-slate-400'
                          }
                        >
                          Due ₹{entry.breakdown.remainingDues.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Paginated 3x2 A4 Sheet Preview */}
          {selectedBulkEntries.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2.5">
              <p className="text-sm font-semibold text-slate-800">
                {bulkSource === 'queue'
                  ? 'Your Print Queue has no receipts yet.'
                  : 'No pay slips selected for bulk printing.'}
              </p>
              <p className="text-xs text-slate-500 max-w-lg mx-auto">
                {bulkSource === 'queue'
                  ? 'Select processed receipts from Search & Duplicates or Quick Receipt Lookup, or switch to Recorded Receipts to batch all receipts at once.'
                  : 'Select one or more receipts above, or switch to Monthly Batch Slips to generate 3×2 A4 fee slips for every student in a batch.'}
              </p>
              {bulkSource === 'queue' && (
                <div className="pt-1 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="px-4 py-2 rounded-xl bg-[#7a1426] hover:bg-[#5e0f1d] text-white text-xs font-bold cursor-pointer"
                  >
                    Select Processed Receipts
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkSource('receipts')}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    Browse Recorded Receipts
                  </button>
                </div>
              )}
            </div>
          ) : (
            <BulkFeeSlipSheets
              entries={selectedBulkEntries}
              instituteConfig={instituteConfig}
              scalePercent={bulkScale}
              orientation={bulkOrientation}
              showCutLines={bulkShowCutLines}
            />
          )}
        </div>
      )}

      {/* Admin Edit / Cancel Audit Modal */}
      {editingEntry && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSaveAuditMutation}
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-display text-base font-extrabold text-slate-900">
                  {editingEntry.mode === 'cancel'
                    ? `Cancel Receipt ${editingEntry.payment.receiptNo}`
                    : `Edit Receipt ${editingEntry.payment.receiptNo}`}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  All changes are logged in the permanent receipt audit history and immediately recalculate student ledger dues.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editingEntry.mode === 'edit' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Updated Amount (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editingEntry.newAmount}
                    onChange={(e) =>
                      setEditingEntry({ ...editingEntry, newAmount: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={editingEntry.newMode}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        newMode: e.target.value as FeePaymentItem['mode']
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI / Online">UPI / Online</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Charity Waiver">Charity Waiver</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transaction ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={editingEntry.newTxId}
                    onChange={(e) =>
                      setEditingEntry({ ...editingEntry, newTxId: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mandatory Audit Reason
              </label>
              <textarea
                required
                rows={2}
                value={editingEntry.reason}
                onChange={(e) =>
                  setEditingEntry({ ...editingEntry, reason: e.target.value })
                }
                placeholder={
                  editingEntry.mode === 'cancel'
                    ? 'e.g. Duplicate cash entry voided after parent verification'
                    : 'e.g. Corrected UPI reference number and amount'
                }
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs"
              />
            </div>

            {/* Existing Audit Log Preview */}
            {editingEntry.payment.auditHistory &&
              editingEntry.payment.auditHistory.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 max-h-28 overflow-y-auto">
                  <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>Audit Trail</span>
                  </p>
                  {editingEntry.payment.auditHistory.map((aud) => (
                    <p key={aud.id} className="text-[11px] text-slate-600">
                      <strong>{aud.action}</strong> ({aud.timestamp}) by {aud.actor} —{' '}
                      {aud.reason}
                    </p>
                  ))}
                </div>
              )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className={`flex-1 min-h-[42px] rounded-xl text-white text-xs font-bold cursor-pointer ${
                  editingEntry.mode === 'cancel'
                    ? 'bg-rose-700 hover:bg-rose-800'
                    : 'bg-[#7a1426] hover:bg-[#5e0f1d]'
                }`}
              >
                {editingEntry.mode === 'cancel'
                  ? 'Confirm Cancellation & Recalculate'
                  : 'Save Audited Changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="min-h-[42px] px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
