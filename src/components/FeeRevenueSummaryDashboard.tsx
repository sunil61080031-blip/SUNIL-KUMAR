import React, { useMemo, useState } from 'react';
import { BatchItem, FeePlan, StudentRecord } from '../types';
import {
  ALL_CLASSES,
  buildMonthlyLedgerRows,
  computeStudentFinancials,
  formatMonthYearFromDate,
  getMonthKeyFromLabel,
  SESSION_MONTHS
} from '../utils/ledgerHelpers';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  TrendingUp
} from 'lucide-react';

interface FeeRevenueSummaryDashboardProps {
  students: StudentRecord[];
  batches: BatchItem[];
  feePlans: FeePlan[];
  selectedMonthLabel: string;
  selectedStudent: StudentRecord | null;
  onSelectStudentForPayment: (studentId: string) => void;
}

type GroupingMode = 'batch' | 'class';
type PeriodScope = 'month' | 'session';

interface CohortBreakdownRow {
  key: string;
  label: string;
  sublabel: string;
  studentCount: number;
  expected: number;
  collected: number;
  pending: number;
  rate: number;
}

interface StudentCashFlowRow {
  student: StudentRecord;
  expected: number;
  collected: number;
  pending: number;
  status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Waived';
}

export const FeeRevenueSummaryDashboard: React.FC<
  FeeRevenueSummaryDashboardProps
> = ({
  students,
  batches,
  feePlans,
  selectedMonthLabel,
  selectedStudent,
  onSelectStudentForPayment
}) => {
  const [groupBy, setGroupBy] = useState<GroupingMode>('batch');
  const [selectedBatchCode, setSelectedBatchCode] = useState<string>('ALL');
  const [selectedClassNum, setSelectedClassNum] = useState<string>('ALL');
  const [periodScope, setPeriodScope] = useState<PeriodScope>('session');
  const [periodMonth, setPeriodMonth] = useState<string>(selectedMonthLabel);
  const [showDetails, setShowDetails] = useState<boolean>(true);

  // Keep local month selector aligned when parent slip month changes
  React.useEffect(() => {
    setPeriodMonth(selectedMonthLabel);
  }, [selectedMonthLabel]);

  const activeStudents = useMemo(
    () => students.filter((s) => s.enrollmentStatus !== 'Disenrolled'),
    [students]
  );

  // Batch options combining configured batches plus any batch code found on student records
  const batchOptions = useMemo(() => {
    const map = new Map<
      string,
      { batchCode: string; classLevel: string; shift: string; count: number }
    >();
    for (const b of batches) {
      map.set(b.batchCode, {
        batchCode: b.batchCode,
        classLevel: b.classLevel,
        shift: b.shift,
        count: 0
      });
    }
    for (const stu of activeStudents) {
      const existing = map.get(stu.batchCode);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(stu.batchCode, {
          batchCode: stu.batchCode,
          classLevel: stu.classLevel,
          shift: stu.shift,
          count: 1
        });
      }
    }
    return Array.from(map.values());
  }, [batches, activeStudents]);

  // Class options sorted from Nursery to Class 12
  const classOptions = useMemo(() => {
    const counts = new Map<number, number>();
    for (const stu of activeStudents) {
      counts.set(stu.classNum, (counts.get(stu.classNum) || 0) + 1);
    }
    return ALL_CLASSES.filter(
      (c) =>
        (counts.get(c.classNum) || 0) > 0 ||
        batches.some((b) => b.classNum === c.classNum)
    ).map((c) => ({
      classNum: c.classNum,
      label: c.shortLabel,
      fullLabel: c.fullLabel,
      count: counts.get(c.classNum) || 0
    }));
  }, [activeStudents, batches]);

  // Filter cohort students according to current batch/class selection
  const cohortStudents = useMemo(() => {
    if (groupBy === 'batch') {
      if (selectedBatchCode === 'ALL') return activeStudents;
      return activeStudents.filter((s) => s.batchCode === selectedBatchCode);
    }
    if (selectedClassNum === 'ALL') return activeStudents;
    const targetNum = Number(selectedClassNum);
    return activeStudents.filter((s) => s.classNum === targetNum);
  }, [activeStudents, groupBy, selectedBatchCode, selectedClassNum]);

  const activeScopeTitle = useMemo(() => {
    if (groupBy === 'batch') {
      if (selectedBatchCode === 'ALL') return 'All Active Batches';
      const found = batchOptions.find((b) => b.batchCode === selectedBatchCode);
      return found
        ? `${found.batchCode} — ${found.classLevel}`
        : selectedBatchCode;
    }
    if (selectedClassNum === 'ALL') return 'All Classes (Nursery to 12th)';
    const found = classOptions.find(
      (c) => String(c.classNum) === selectedClassNum
    );
    return found ? found.fullLabel : `Class ${selectedClassNum}`;
  }, [groupBy, selectedBatchCode, selectedClassNum, batchOptions, classOptions]);

  const monthKey = useMemo(
    () => getMonthKeyFromLabel(periodMonth) || '2026-11',
    [periodMonth]
  );

  // Per-student financial evaluation synchronized with ledgerHelpers
  const studentRows = useMemo<StudentCashFlowRow[]>(() => {
    return cohortStudents.map((stu) => {
      const fin = computeStudentFinancials(stu, feePlans);

      if (periodScope === 'session') {
        const expected = fin.currentSessionBilled + fin.prevYearTotalAssigned;
        const collected = fin.currentSessionPaid + fin.prevYearCleared;
        const pending = fin.totalCombinedPending;
        const status: StudentCashFlowRow['status'] = stu.isCharitySeat
          ? 'Waived'
          : pending <= 0
          ? 'Paid'
          : collected > 0
          ? 'Partially Paid'
          : 'Unpaid';
        return { student: stu, expected, collected, pending, status };
      }

      const ledgerRows = buildMonthlyLedgerRows(stu, feePlans);
      const targetRow = ledgerRows.find((r) => r.key === monthKey);
      if (!targetRow || targetRow.status === 'Before Admission' || targetRow.status === 'Disenrolled Break') {
        return {
          student: stu,
          expected: 0,
          collected: 0,
          pending: 0,
          status: 'Paid'
        };
      }
      if (targetRow.status === 'Waived' || stu.isCharitySeat) {
        return {
          student: stu,
          expected: 0,
          collected: 0,
          pending: 0,
          status: 'Waived'
        };
      }

      const expected = targetRow.totalPayableWithBackDues;
      const collected = targetRow.paidAmount;
      const pending = Math.max(0, targetRow.remainingAmount + targetRow.backDueCarriedIn);
      const status: StudentCashFlowRow['status'] =
        pending <= 0 ? 'Paid' : collected > 0 ? 'Partially Paid' : 'Unpaid';

      return { student: stu, expected, collected, pending, status };
    });
  }, [cohortStudents, feePlans, periodScope, monthKey]);

  // Aggregate cash-flow KPIs + Payment Mode Breakdown
  const summary = useMemo(() => {
    let expectedTotal = 0;
    let collectedTotal = 0;
    let pendingTotal = 0;
    let currentTuitionExpected = 0;
    let backDuesExpected = 0;
    let advanceCreditTotal = 0;

    let paidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;
    let waivedCount = 0;

    let cashCollected = 0;
    let upiCollected = 0;
    let bankCollected = 0;

    for (const row of studentRows) {
      expectedTotal += row.expected;
      collectedTotal += row.collected;
      pendingTotal += row.pending;

      if (row.status === 'Waived') waivedCount += 1;
      else if (row.status === 'Paid') paidCount += 1;
      else if (row.status === 'Partially Paid') partialCount += 1;
      else unpaidCount += 1;

      const fin = computeStudentFinancials(row.student, feePlans);
      advanceCreditTotal += fin.advanceCreditNextMonths;

      if (periodScope === 'session') {
        currentTuitionExpected += fin.currentSessionBilled;
        backDuesExpected += fin.prevYearTotalAssigned;
      } else {
        const ledgerRow = buildMonthlyLedgerRows(row.student, feePlans).find(
          (r) => r.key === monthKey
        );
        if (ledgerRow && ledgerRow.status !== 'Waived') {
          currentTuitionExpected += ledgerRow.netPayable;
          backDuesExpected += ledgerRow.backDueCarriedIn;
        }
      }

      // Payment mode split from active non-cancelled receipts in scope
      for (const p of row.student.feePayments || []) {
        if (p.status === 'Cancelled' || p.mode === 'Charity Waiver') continue;
        if (periodScope === 'month') {
          const pMonth = p.paidInMonth || formatMonthYearFromDate(p.date);
          const matchesMonth =
            pMonth.toLowerCase() === periodMonth.toLowerCase() ||
            p.monthLabel.toLowerCase().includes(periodMonth.toLowerCase());
          if (!matchesMonth) continue;
        }
        if (p.mode === 'Cash') cashCollected += p.amount;
        else if (p.mode === 'UPI / Online') upiCollected += p.amount;
        else if (p.mode === 'Bank Transfer') bankCollected += p.amount;
      }
    }

    const collectionRate =
      expectedTotal > 0
        ? Math.min(100, Math.round((collectedTotal / expectedTotal) * 100))
        : 100;

    const healthLabel =
      expectedTotal === 0
        ? 'No Dues Billed'
        : collectionRate >= 80
        ? 'Healthy Cash Flow'
        : collectionRate >= 50
        ? 'Moderate Pending'
        : 'Collection Attention Needed';

    return {
      expectedTotal,
      collectedTotal,
      pendingTotal,
      currentTuitionExpected,
      backDuesExpected,
      advanceCreditTotal,
      collectionRate,
      healthLabel,
      paidCount,
      partialCount,
      unpaidCount,
      waivedCount,
      cashCollected,
      upiCollected,
      bankCollected,
      modeTotal: cashCollected + upiCollected + bankCollected
    };
  }, [studentRows, feePlans, periodScope, monthKey, periodMonth]);

  // Cohort comparison bars (shown when "All Batches" or "All Classes" is selected)
  const cohortBreakdown = useMemo<CohortBreakdownRow[]>(() => {
    const isAllSelected =
      (groupBy === 'batch' && selectedBatchCode === 'ALL') ||
      (groupBy === 'class' && selectedClassNum === 'ALL');
    if (!isAllSelected) return [];

    const buckets = new Map<string, CohortBreakdownRow>();

    for (const row of studentRows) {
      const key =
        groupBy === 'batch'
          ? row.student.batchCode
          : String(row.student.classNum);

      let entry = buckets.get(key);
      if (!entry) {
        const classMeta = ALL_CLASSES.find(
          (c) => c.classNum === row.student.classNum
        );
        entry = {
          key,
          label:
            groupBy === 'batch'
              ? row.student.batchCode
              : classMeta?.shortLabel || `Class ${row.student.classNum}`,
          sublabel:
            groupBy === 'batch'
              ? `${row.student.classLevel} · ${row.student.shift}`
              : classMeta?.fullLabel || row.student.classLevel,
          studentCount: 0,
          expected: 0,
          collected: 0,
          pending: 0,
          rate: 0
        };
        buckets.set(key, entry);
      }

      entry.studentCount += 1;
      entry.expected += row.expected;
      entry.collected += row.collected;
      entry.pending += row.pending;
    }

    return Array.from(buckets.values())
      .map((item) => ({
        ...item,
        rate:
          item.expected > 0
            ? Math.min(100, Math.round((item.collected / item.expected) * 100))
            : 100
      }))
      .sort((a, b) => b.pending - a.pending || b.expected - a.expected);
  }, [studentRows, groupBy, selectedBatchCode, selectedClassNum]);

  const maxCohortExpected = useMemo(
    () => Math.max(1, ...cohortBreakdown.map((c) => c.expected)),
    [cohortBreakdown]
  );

  // Actionable student follow-up list when inspecting a specific batch or class
  const sortedStudentsForCohort = useMemo(() => {
    return [...studentRows].sort(
      (a, b) =>
        b.pending - a.pending ||
        a.student.studentName.localeCompare(b.student.studentName)
    );
  }, [studentRows]);

  const isSingleCohortSelected =
    (groupBy === 'batch' && selectedBatchCode !== 'ALL') ||
    (groupBy === 'class' && selectedClassNum !== 'ALL');

  const canMatchSelectedStudent =
    selectedStudent !== null &&
    ((groupBy === 'batch' && selectedBatchCode !== selectedStudent.batchCode) ||
      (groupBy === 'class' &&
        selectedClassNum !== String(selectedStudent.classNum)));

  const handleMatchSelectedStudent = () => {
    if (!selectedStudent) return;
    if (groupBy === 'batch') {
      setSelectedBatchCode(selectedStudent.batchCode);
    } else {
      setSelectedClassNum(String(selectedStudent.classNum));
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden no-print">
      {/* Header & Cohort Filter Controls */}
      <div className="px-5 py-4 sm:px-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#7a1426] shrink-0" />
            <h3 className="font-display text-base font-extrabold text-slate-900 truncate">
              Revenue &amp; Cash Flow Summary
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            <span>{activeScopeTitle}</span>
            <span className="mx-1.5" aria-hidden="true">
              ·
            </span>
            <span className="font-mono tabular-nums">
              {cohortStudents.length} active{' '}
              {cohortStudents.length === 1 ? 'student' : 'students'}
            </span>
            <span className="mx-1.5" aria-hidden="true">
              ·
            </span>
            <span>
              {periodScope === 'session'
                ? 'Session 2026-27 to Date'
                : periodMonth}
            </span>
          </p>
        </div>

        {/* Interactive Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Group By Segmented Control */}
          <div
            className="inline-flex items-center p-1 bg-slate-100 rounded-lg"
            role="group"
            aria-label="Filter revenue by batch or class"
          >
            <button
              type="button"
              onClick={() => setGroupBy('batch')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                groupBy === 'batch'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              By Batch
            </button>
            <button
              type="button"
              onClick={() => setGroupBy('class')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                groupBy === 'class'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              By Class
            </button>
          </div>

          {/* Batch or Class Selector */}
          {groupBy === 'batch' ? (
            <select
              aria-label="Select batch for revenue summary"
              value={selectedBatchCode}
              onChange={(e) => setSelectedBatchCode(e.target.value)}
              className="h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 max-w-[240px] truncate focus:outline-none focus:ring-2 focus:ring-[#7a1426]/30 focus:border-[#7a1426]"
            >
              <option value="ALL">
                All Batches ({activeStudents.length})
              </option>
              {batchOptions.map((b) => (
                <option key={b.batchCode} value={b.batchCode}>
                  {b.batchCode} · {b.classLevel} ({b.count})
                </option>
              ))}
            </select>
          ) : (
            <select
              aria-label="Select class for revenue summary"
              value={selectedClassNum}
              onChange={(e) => setSelectedClassNum(e.target.value)}
              className="h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 max-w-[240px] truncate focus:outline-none focus:ring-2 focus:ring-[#7a1426]/30 focus:border-[#7a1426]"
            >
              <option value="ALL">
                All Classes ({activeStudents.length})
              </option>
              {classOptions.map((c) => (
                <option key={c.classNum} value={String(c.classNum)}>
                  {c.label} ({c.count})
                </option>
              ))}
            </select>
          )}

          {/* Period Scope Selector */}
          <select
            aria-label="Select cash flow timeframe"
            value={periodScope === 'session' ? 'SESSION' : periodMonth}
            onChange={(e) => {
              if (e.target.value === 'SESSION') {
                setPeriodScope('session');
              } else {
                setPeriodScope('month');
                setPeriodMonth(e.target.value);
              }
            }}
            className="h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7a1426]/30 focus:border-[#7a1426]"
          >
            <option value="SESSION">Session to Date (2026-27)</option>
            {SESSION_MONTHS.map((m) => (
              <option key={m.key} value={m.label}>
                Month: {m.label}
              </option>
            ))}
          </select>

          {canMatchSelectedStudent && (
            <button
              type="button"
              onClick={handleMatchSelectedStudent}
              className="h-9 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
              title="Filter summary to the batch or class of the currently selected student"
            >
              Match Selected Student
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            aria-expanded={showDetails}
          >
            <span>{showDetails ? 'Hide Breakdown' : 'Show Breakdown'}</span>
            {showDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* 4-Column Tabular KPI Strip (Hairline Divided, Zero Nested Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-b border-slate-200">
        {/* KPI 1: Total Expected Revenue */}
        <div className="px-5 py-4 sm:px-6 space-y-1">
          <p className="text-xs font-semibold text-slate-500">
            Total Expected Revenue
          </p>
          <p className="font-mono tabular-nums text-2xl font-extrabold text-slate-950 tracking-tight">
            ₹{summary.expectedTotal.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 font-mono tabular-nums">
            {periodScope === 'session' ? 'Billed' : 'Tuition'} ₹
            {summary.currentTuitionExpected.toLocaleString('en-IN')}
            <span className="mx-1 font-sans">·</span>
            {periodScope === 'session' ? 'Prev. Arrears' : 'Back Dues'} ₹
            {summary.backDuesExpected.toLocaleString('en-IN')}
          </p>
        </div>

        {/* KPI 2: Actual Collected Revenue */}
        <div className="px-5 py-4 sm:px-6 space-y-1">
          <p className="text-xs font-semibold text-slate-500">
            Actual Collected Revenue
          </p>
          <p className="font-mono tabular-nums text-2xl font-extrabold text-emerald-700 tracking-tight">
            ₹{summary.collectedTotal.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 font-mono tabular-nums truncate">
            {summary.modeTotal > 0 ? (
              <>
                Cash ₹{summary.cashCollected.toLocaleString('en-IN')}
                <span className="mx-1 font-sans">·</span>
                UPI ₹{summary.upiCollected.toLocaleString('en-IN')}
                {summary.bankCollected > 0 && (
                  <>
                    <span className="mx-1 font-sans">·</span>
                    Bank ₹{summary.bankCollected.toLocaleString('en-IN')}
                  </>
                )}
              </>
            ) : (
              'No receipts logged in selected period'
            )}
          </p>
        </div>

        {/* KPI 3: Outstanding Cash Flow Gap */}
        <div className="px-5 py-4 sm:px-6 space-y-1">
          <p className="text-xs font-semibold text-slate-500">
            Outstanding Collection Gap
          </p>
          <p
            className={`font-mono tabular-nums text-2xl font-extrabold tracking-tight ${
              summary.pendingTotal > 0 ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            ₹{summary.pendingTotal.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500">
            <span className="font-mono tabular-nums font-semibold text-emerald-700">
              {summary.paidCount} Paid
            </span>
            <span className="mx-1.5" aria-hidden="true">
              ·
            </span>
            <span className="font-mono tabular-nums font-semibold text-amber-700">
              {summary.partialCount} Partial
            </span>
            <span className="mx-1.5" aria-hidden="true">
              ·
            </span>
            <span className="font-mono tabular-nums font-semibold text-rose-700">
              {summary.unpaidCount} Unpaid
            </span>
            {summary.waivedCount > 0 && (
              <>
                <span className="mx-1.5" aria-hidden="true">
                  ·
                </span>
                <span className="font-mono tabular-nums text-slate-600">
                  {summary.waivedCount} Charity
                </span>
              </>
            )}
          </p>
        </div>

        {/* KPI 4: Realized Collection Rate */}
        <div className="px-5 py-4 sm:px-6 space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-semibold text-slate-500">
              Collection Rate
            </p>
            <span
              className={`text-[11px] font-semibold ${
                summary.collectionRate >= 80
                  ? 'text-emerald-700'
                  : summary.collectionRate >= 50
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              {summary.healthLabel}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-mono tabular-nums text-2xl font-extrabold text-slate-950 tracking-tight">
              {summary.collectionRate}%
            </p>
            {summary.advanceCreditTotal > 0 && (
              <span className="text-[11px] font-mono tabular-nums text-sky-700 font-semibold">
                +₹{summary.advanceCreditTotal.toLocaleString('en-IN')} adv.
              </span>
            )}
          </div>
          <div
            className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={summary.collectionRate}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Fee collection realization percentage"
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                summary.collectionRate >= 80
                  ? 'bg-emerald-600'
                  : summary.collectionRate >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-600'
              }`}
              style={{ width: `${summary.collectionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expandable Expected vs. Collected Breakdown Panel */}
      {showDetails && (
        <div className="px-5 py-4 sm:px-6 bg-slate-50/60">
          {cohortStudents.length === 0 ? (
            <div className="py-6 text-center space-y-1">
              <p className="text-sm font-bold text-slate-800">
                No active students enrolled in {activeScopeTitle}
              </p>
              <p className="text-xs text-slate-500">
                Choose another batch or class above to review expected versus collected revenue.
              </p>
            </div>
          ) : !isSingleCohortSelected ? (
            /* All Batches / All Classes Comparative Revenue View */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-800">
                  Expected vs. Collected Comparison by{' '}
                  {groupBy === 'batch' ? 'Batch' : 'Class'} (Sorted by Highest Pending Gap)
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
                    Collected
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 inline-block" />
                    Expected Target
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-200/80 border-t border-slate-200">
                {cohortBreakdown.map((item) => {
                  const expectedBarPct = Math.max(
                    4,
                    Math.round((item.expected / maxCohortExpected) * 100)
                  );
                  const collectedFillPct =
                    item.expected > 0
                      ? Math.min(
                          100,
                          Math.round((item.collected / item.expected) * 100)
                        )
                      : 100;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        if (groupBy === 'batch') {
                          setSelectedBatchCode(item.key);
                        } else {
                          setSelectedClassNum(item.key);
                        }
                      }}
                      className="w-full py-2.5 px-2 -mx-2 rounded-lg hover:bg-white transition-colors grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center text-left cursor-pointer"
                    >
                      <div className="md:col-span-3 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.label}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {item.sublabel} · {item.studentCount} students
                        </p>
                      </div>

                      <div className="md:col-span-5">
                        <div className="w-full h-3 bg-slate-200/70 rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-slate-300 rounded-sm relative overflow-hidden"
                            style={{ width: `${expectedBarPct}%` }}
                          >
                            <div
                              className={`h-full transition-all duration-300 ${
                                item.rate >= 80
                                  ? 'bg-emerald-600'
                                  : item.rate >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-[#7a1426]'
                              }`}
                              style={{ width: `${collectedFillPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-4 flex items-center justify-between md:justify-end gap-4 font-mono tabular-nums text-xs">
                        <div className="text-right">
                          <span className="font-bold text-emerald-700">
                            ₹{item.collected.toLocaleString('en-IN')}
                          </span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-slate-700">
                            ₹{item.expected.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div
                          className={`text-right min-w-[76px] font-bold ${
                            item.pending > 0 ? 'text-rose-700' : 'text-emerald-700'
                          }`}
                        >
                          {item.pending > 0
                            ? `Due ₹${item.pending.toLocaleString('en-IN')}`
                            : 'Cleared'}
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 w-9 text-right">
                          {item.rate}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Single Selected Batch / Class Student Cash Flow Table */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-800">
                  Student Collection Breakdown — {activeScopeTitle}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (groupBy === 'batch') setSelectedBatchCode('ALL');
                    else setSelectedClassNum('ALL');
                  }}
                  className="text-xs font-semibold text-[#7a1426] hover:underline cursor-pointer"
                >
                  Compare All {groupBy === 'batch' ? 'Batches' : 'Classes'}
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="py-2.5 px-3 font-semibold">Student</th>
                      <th className="py-2.5 px-3 font-semibold">Batch</th>
                      <th className="py-2.5 px-3 font-semibold text-right">
                        Expected
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right">
                        Collected
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right">
                        Remaining
                      </th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 font-semibold text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedStudentsForCohort.map((row) => {
                      const isCurrentlyPicked =
                        selectedStudent?.id === row.student.id;
                      return (
                        <tr
                          key={row.student.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isCurrentlyPicked ? 'bg-[#7a1426]/[0.03]' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-900 block">
                              {row.student.studentName}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {row.student.studentIdCode} · {row.student.parentName}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                            {row.student.batchCode}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800">
                            ₹{row.expected.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-700">
                            ₹{row.collected.toLocaleString('en-IN')}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-mono tabular-nums font-bold ${
                              row.pending > 0 ? 'text-rose-700' : 'text-slate-400'
                            }`}
                          >
                            ₹{row.pending.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`text-xs font-semibold ${
                                row.status === 'Paid'
                                  ? 'text-emerald-700'
                                  : row.status === 'Partially Paid'
                                  ? 'text-amber-700'
                                  : row.status === 'Waived'
                                  ? 'text-slate-500'
                                  : 'text-rose-700'
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                onSelectStudentForPayment(row.student.id)
                              }
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                                row.pending > 0
                                  ? 'bg-[#7a1426] hover:bg-[#5e0f1d] text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {row.pending > 0 ? (
                                <>
                                  <IndianRupee className="w-3 h-3" />
                                  <span>Collect Fee</span>
                                </>
                              ) : (
                                <>
                                  <span>View Slip</span>
                                  <ArrowRight className="w-3 h-3" />
                                </>
                              )}
                            </button>
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
    </div>
  );
};
