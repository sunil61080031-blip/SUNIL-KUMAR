import React, { useEffect, useMemo, useState } from 'react';
import {
  AutoSuspensionConfig,
  FeePlan,
  SecurityLogItem,
  StudentRecord
} from '../types';
import {
  computeConsecutiveMissedMonths,
  computeStudentFinancials,
  ConsecutiveMissedSummary,
  StudentFinancials
} from '../utils/ledgerHelpers';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Undo2
} from 'lucide-react';

interface SuspendedStudentsDashboardTabProps {
  students: StudentRecord[];
  feePlans: FeePlan[];
  autoSuspensionConfig: AutoSuspensionConfig;
  securityLogs: SecurityLogItem[];
  onRunAutoSuspensionScan: () => { suspendedCount: number; reinstatedCount: number };
  onOverrideSuspension: (studentId: string, overrideNote?: string) => void;
  onOpenPolicySettings: () => void;
  onShowToast: (msg: string) => void;
}

interface SuspendedRowModel {
  student: StudentRecord;
  missed: ConsecutiveMissedSummary;
  financials: StudentFinancials;
  lastPaidDateLabel: string | null;
  displayReason: string;
}

type SortKey = 'overdue_desc' | 'streak_desc' | 'missed_date_desc' | 'name_asc';

function formatIsoDateShort(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];
  const mIdx = Number(parts[1]) - 1;
  const monthLabel = months[mIdx] || parts[1];
  return `${parts[2]} ${monthLabel} ${parts[0]}`;
}

export const SuspendedStudentsDashboardTab: React.FC<SuspendedStudentsDashboardTabProps> = ({
  students,
  feePlans,
  autoSuspensionConfig,
  securityLogs,
  onRunAutoSuspensionScan,
  onOverrideSuspension,
  onOpenPolicySettings,
  onShowToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [batchFilter, setBatchFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortKey>('overdue_desc');
  const [overrideNoteInput, setOverrideNoteInput] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(() =>
    new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  );

  // Refresh the real-time evaluation timestamp whenever student records or policy config update
  useEffect(() => {
    setLastUpdatedAt(
      new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    );
  }, [students, feePlans, autoSuspensionConfig]);

  const threshold = Math.max(
    1,
    Math.min(12, autoSuspensionConfig.consecutiveMissedMonthsThreshold || 3)
  );

  const { suspendedRows, atRiskCount, monitoredCount, totalOverdueAmount, avgMissedStreak } =
    useMemo(() => {
      const suspended: SuspendedRowModel[] = [];
      let atRisk = 0;
      let monitored = 0;
      let overdueSum = 0;
      let streakSum = 0;

      for (const stu of students) {
        if (stu.enrollmentStatus === 'Disenrolled') continue;
        const missed = computeConsecutiveMissedMonths(stu, feePlans, {
          includePartialAsMissed: autoSuspensionConfig.includePartialAsMissed
        });

        if (!missed.isExempt) {
          monitored += 1;
        }

        if (stu.enrollmentStatus === 'Suspended') {
          const financials = computeStudentFinancials(stu, feePlans);
          const validPayments = (stu.feePayments || [])
            .filter((p) => p.status !== 'Cancelled' && p.date)
            .sort((a, b) => (a.date < b.date ? 1 : -1));
          const latestReceiptDate = validPayments[0]?.date || null;

          const fallbackReason =
            missed.consecutiveMissedMonths > 0
              ? `${missed.consecutiveMissedMonths} consecutive missed monthly payment${
                  missed.consecutiveMissedMonths === 1 ? '' : 's'
                } (${missed.missedMonthLabels.join(', ')})`
              : 'Manually suspended by Administrator';

          suspended.push({
            student: stu,
            missed,
            financials,
            lastPaidDateLabel: latestReceiptDate ? formatIsoDateShort(latestReceiptDate) : null,
            displayReason: stu.suspensionReason || fallbackReason
          });
          overdueSum += financials.totalCombinedPending;
          streakSum += missed.consecutiveMissedMonths;
        } else if (
          !missed.isExempt &&
          missed.consecutiveMissedMonths > 0 &&
          missed.consecutiveMissedMonths >= Math.max(1, threshold - 1)
        ) {
          atRisk += 1;
        }
      }

      return {
        suspendedRows: suspended,
        atRiskCount: atRisk,
        monitoredCount: monitored,
        totalOverdueAmount: overdueSum,
        avgMissedStreak: suspended.length > 0 ? streakSum / suspended.length : 0
      };
    }, [students, feePlans, autoSuspensionConfig.includePartialAsMissed, threshold]);

  const distinctBatches = useMemo(() => {
    const set = new Set<string>();
    for (const row of suspendedRows) {
      if (row.student.batchCode) set.add(row.student.batchCode);
    }
    return Array.from(set).sort();
  }, [suspendedRows]);

  const filteredAndSortedRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = suspendedRows.filter((row) => {
      if (batchFilter !== 'All' && row.student.batchCode !== batchFilter) return false;
      if (!q) return true;
      return (
        row.student.studentName.toLowerCase().includes(q) ||
        row.student.studentIdCode.toLowerCase().includes(q) ||
        row.student.parentName.toLowerCase().includes(q) ||
        row.student.phone.toLowerCase().includes(q) ||
        row.student.batchCode.toLowerCase().includes(q) ||
        row.student.classLevel.toLowerCase().includes(q) ||
        row.displayReason.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'overdue_desc') {
        return b.financials.totalCombinedPending - a.financials.totalCombinedPending;
      }
      if (sortBy === 'streak_desc') {
        return b.missed.consecutiveMissedMonths - a.missed.consecutiveMissedMonths;
      }
      if (sortBy === 'missed_date_desc') {
        const aDate = a.missed.lastMissedPaymentIsoDate || '';
        const bDate = b.missed.lastMissedPaymentIsoDate || '';
        return bDate.localeCompare(aDate);
      }
      return a.student.studentName.localeCompare(b.student.studentName);
    });
  }, [suspendedRows, searchQuery, batchFilter, sortBy]);

  // Visual breakdown by Batch / Class
  const classBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { label: string; batchCode: string; count: number; overdue: number }
    >();
    for (const row of suspendedRows) {
      const key = `${row.student.classLevel} · ${row.student.batchCode}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.overdue += row.financials.totalCombinedPending;
      } else {
        map.set(key, {
          label: row.student.classLevel,
          batchCode: row.student.batchCode,
          count: 1,
          overdue: row.financials.totalCombinedPending
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count || b.overdue - a.overdue);
  }, [suspendedRows]);

  // Visual breakdown by Streak Severity
  const severityBuckets = useMemo(() => {
    let manualOnly = 0;
    let atThreshold = 0;
    let oneAbove = 0;
    let severe = 0;

    for (const row of suspendedRows) {
      const m = row.missed.consecutiveMissedMonths;
      if (m < threshold) manualOnly += 1;
      else if (m === threshold) atThreshold += 1;
      else if (m === threshold + 1) oneAbove += 1;
      else severe += 1;
    }

    return [
      {
        id: 'threshold',
        label: `At policy threshold (${threshold} ${threshold === 1 ? 'month' : 'months'})`,
        count: atThreshold,
        barClass: 'bg-amber-500'
      },
      {
        id: 'elevated',
        label: `Elevated (${threshold + 1} consecutive months)`,
        count: oneAbove,
        barClass: 'bg-orange-500'
      },
      {
        id: 'severe',
        label: `Severe (${threshold + 2}+ consecutive months)`,
        count: severe,
        barClass: 'bg-red-600'
      },
      {
        id: 'manual',
        label: 'Manual admin suspension',
        count: manualOnly,
        barClass: 'bg-slate-600'
      }
    ].filter((b) => b.count > 0 || suspendedRows.length === 0);
  }, [suspendedRows, threshold]);

  // Recent suspension & override audit logs
  const suspensionAuditLogs = useMemo(
    () =>
      securityLogs
        .filter(
          (log) =>
            log.status === 'Suspended' ||
            log.actor.includes('Auto-Suspension') ||
            log.actor.includes('Manual Override') ||
            log.event.toLowerCase().includes('suspended') ||
            log.event.toLowerCase().includes('reinstated') ||
            log.event.toLowerCase().includes('override')
        )
        .slice(0, 6),
    [securityLogs]
  );

  const suspendedSharePct =
    monitoredCount > 0 ? Math.round((suspendedRows.length / monitoredCount) * 100) : 0;

  const handleManualScanClick = () => {
    const res = onRunAutoSuspensionScan();
    setLastUpdatedAt(
      new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    );
    if (res.suspendedCount > 0 || res.reinstatedCount > 0) {
      onShowToast(
        `Policy scan updated ${res.suspendedCount} suspended and ${res.reinstatedCount} reinstated account(s).`
      );
    } else {
      onShowToast('Policy scan complete. All suspended accounts are up to date.');
    }
  };

  const handleOverrideRow = (row: SuspendedRowModel) => {
    onOverrideSuspension(row.student.id, overrideNoteInput);
    onShowToast(
      `Suspension overridden for ${row.student.studentName} (${row.student.studentIdCode}). Status restored to Enrolled.`
    );
  };

  const handleDownloadCsv = () => {
    const rowsToExport = filteredAndSortedRows;
    if (rowsToExport.length === 0) {
      onShowToast('No suspended students available to export.');
      return;
    }

    const escapeCsvCell = (value: string | number | null | undefined): string => {
      const str = String(value ?? '');
      if (/[",\r\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Student ID',
      'Student Name',
      'Guardian Name',
      'Phone',
      'Class',
      'Batch Code',
      'Shift',
      'Enrollment Status',
      'Suspended Date',
      'Reason for Suspension',
      'Consecutive Missed Months',
      'Missed Billing Months',
      'Last Missed Payment Date',
      'Last Payment Receipt Date',
      'Net Monthly Fee (INR)',
      'Current Session Pending (INR)',
      'Previous Year Dues (INR)',
      'Total Overdue Balance (INR)'
    ];

    const dataLines = rowsToExport.map((row) =>
      [
        row.student.studentIdCode,
        row.student.studentName,
        row.student.parentName,
        row.student.phone,
        row.student.classLevel,
        row.student.batchCode,
        row.student.shift,
        row.student.enrollmentStatus,
        row.student.suspendedDate || '',
        row.displayReason,
        row.missed.consecutiveMissedMonths,
        row.missed.missedMonthLabels.join('; '),
        row.missed.lastMissedPaymentIsoDate || 'N/A',
        row.lastPaidDateLabel || 'None recorded',
        row.student.netMonthlyFee,
        row.financials.currentSessionPending,
        row.financials.prevYearRemainingDue,
        row.financials.totalCombinedPending
      ]
        .map(escapeCsvCell)
        .join(',')
    );

    const csvContent = `\uFEFF${[headers.map(escapeCsvCell).join(','), ...dataLines].join('\r\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const todayIso = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `suspended-students-${todayIso}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onShowToast(
      `Exported ${rowsToExport.length} suspended student ${
        rowsToExport.length === 1 ? 'record' : 'records'
      } to CSV.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Suspended Students Overview
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span
              className={
                autoSuspensionConfig.enabled
                  ? 'font-semibold text-emerald-700'
                  : 'font-semibold text-slate-600'
              }
            >
              {autoSuspensionConfig.enabled ? 'Background listener active' : 'Listener paused'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              Threshold: {threshold} consecutive missed {threshold === 1 ? 'month' : 'months'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">Synced {lastUpdatedAt}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={filteredAndSortedRows.length === 0}
            className={`px-3.5 py-2 border rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              filteredAndSortedRows.length === 0
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300 cursor-pointer'
            }`}
            title={
              filteredAndSortedRows.length === 0
                ? 'No suspended students to export'
                : `Export ${filteredAndSortedRows.length} suspended student record(s) as CSV`
            }
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download as CSV</span>
          </button>
          <button
            type="button"
            onClick={onOpenPolicySettings}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Policy Settings</span>
          </button>
          <button
            type="button"
            onClick={handleManualScanClick}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Run Policy Scan</span>
          </button>
        </div>
      </div>

      {/* Real-Time KPI Summary Strip (Single-Elevation, Hairline Divided) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-slate-200 rounded-xl bg-white divide-y sm:divide-y-0 sm:divide-x divide-slate-200 overflow-hidden">
        <div className="p-4 space-y-1">
          <span className="text-xs font-medium text-slate-500 block">Suspended Students</span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-700">
              {suspendedRows.length}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {suspendedSharePct}% of {monitoredCount}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-1">
          <span className="text-xs font-medium text-slate-500 block">
            Suspended Overdue Balance
          </span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-red-700">
              ₹{totalOverdueAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-500">Combined dues</span>
          </div>
        </div>

        <div className="p-4 space-y-1">
          <span className="text-xs font-medium text-slate-500 block">
            Average Missed Streak
          </span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {avgMissedStreak.toFixed(1)}
              <span className="text-sm font-semibold text-slate-500 ml-1">mos</span>
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              Policy: {threshold}m
            </span>
          </div>
        </div>

        <div className="p-4 space-y-1">
          <span className="text-xs font-medium text-slate-500 block">
            At-Risk Watchlist
          </span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {atRiskCount}
            </span>
            <span className="text-xs text-slate-500">Near threshold</span>
          </div>
        </div>
      </div>

      {/* Visual Distribution Panels (Shown when at least 1 student is suspended) */}
      {suspendedRows.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution by Class & Batch */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-900">
                Suspensions by Class &amp; Batch
              </h4>
              <span className="text-xs text-slate-500 tabular-nums">
                {classBreakdown.length} affected {classBreakdown.length === 1 ? 'batch' : 'batches'}
              </span>
            </div>
            <div className="space-y-3">
              {classBreakdown.slice(0, 5).map((item) => {
                const widthPct = Math.max(
                  8,
                  Math.round((item.count / suspendedRows.length) * 100)
                );
                return (
                  <div key={`${item.label}-${item.batchCode}`} className="space-y-1">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-medium text-slate-800 truncate">
                        {item.label}{' '}
                        <span className="font-mono text-slate-500">· {item.batchCode}</span>
                      </span>
                      <span className="font-mono tabular-nums text-slate-700 shrink-0">
                        {item.count} {item.count === 1 ? 'student' : 'students'} · ₹
                        {item.overdue.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-sm transition-all duration-200"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Distribution by Missed Payment Severity */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-900">
                Missed Payment Streak Breakdown
              </h4>
              <span className="text-xs text-slate-500 tabular-nums">
                {suspendedRows.length} total
              </span>
            </div>
            <div className="space-y-3">
              {severityBuckets.map((bucket) => {
                const widthPct =
                  suspendedRows.length > 0
                    ? Math.max(
                        bucket.count > 0 ? 8 : 0,
                        Math.round((bucket.count / suspendedRows.length) * 100)
                      )
                    : 0;
                return (
                  <div key={bucket.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-medium text-slate-800">{bucket.label}</span>
                      <span className="font-mono tabular-nums text-slate-700">
                        {bucket.count} ({Math.round((bucket.count / suspendedRows.length) * 100)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-sm overflow-hidden">
                      <div
                        className={`h-full ${bucket.barClass} rounded-sm transition-all duration-200`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Data View: Populated Table vs. Clean Empty State */}
      {suspendedRows.length === 0 ? (
        <div className="p-10 bg-white border border-slate-200 rounded-xl text-center space-y-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-sm font-bold text-slate-900">
              No Students Currently Suspended
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              All {monitoredCount} monitored student accounts are within the policy limit of{' '}
              {threshold} consecutive missed monthly {threshold === 1 ? 'payment' : 'payments'}.
              {atRiskCount > 0
                ? ` ${atRiskCount} active account${
                    atRiskCount === 1 ? ' is' : 's are'
                  } currently approaching the threshold.`
                : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleManualScanClick}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Run Policy Scan</span>
            </button>
            <button
              type="button"
              onClick={onOpenPolicySettings}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Adjust Policy Threshold</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Toolbar: Search, Batch Filter, Sort & Optional Override Audit Note */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search suspended student, ID, batch, or reason..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filter by batch"
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-700"
                >
                  <option value="All">All Batches ({suspendedRows.length})</option>
                  {distinctBatches.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Sort suspended students"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-700"
                >
                  <option value="overdue_desc">Sort: Highest Overdue</option>
                  <option value="streak_desc">Sort: Longest Missed Streak</option>
                  <option value="missed_date_desc">Sort: Latest Missed Due Date</option>
                  <option value="name_asc">Sort: Student Name (A–Z)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
              <label
                htmlFor="manual-override-note"
                className="text-xs font-medium text-slate-600 whitespace-nowrap shrink-0"
              >
                Manual Override Audit Note (optional):
              </label>
              <input
                id="manual-override-note"
                type="text"
                value={overrideNoteInput}
                onChange={(e) => setOverrideNoteInput(e.target.value)}
                placeholder="e.g., Guardian committed payment by 25 Nov — approved by Director"
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
              />
            </div>
          </div>

          {/* High-Density Suspended Students Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Student &amp; Batch</th>
                  <th className="py-3 px-4">Reason for Suspension</th>
                  <th className="py-3 px-4">Last Missed Payment Date</th>
                  <th className="py-3 px-4 text-right">Overdue Balance</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredAndSortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-slate-500">
                      No suspended students match your current search or batch filter.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedRows.map((row) => {
                    const { student, missed, financials, lastPaidDateLabel, displayReason } = row;
                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-slate-50/80 transition-colors align-top"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 text-sm">
                            {student.studentName}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span className="font-mono font-medium text-slate-700">
                              {student.studentIdCode}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{student.classLevel}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono">{student.batchCode}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Guardian: {student.parentName} ·{' '}
                            <span className="font-mono tabular-nums">{student.phone}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex items-start gap-1.5 text-slate-800 leading-relaxed">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>{displayReason}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
                            {student.suspendedDate && (
                              <span className="font-mono tabular-nums">
                                Suspended {formatIsoDateShort(student.suspendedDate)}
                              </span>
                            )}
                            {missed.missedMonthShortLabels.length > 0 && (
                              <>
                                {student.suspendedDate && <span aria-hidden="true">·</span>}
                                <span className="font-mono text-amber-800">
                                  Missed: {missed.missedMonthShortLabels.join(', ')}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {missed.lastMissedPaymentDateLabel ? (
                            <>
                              <div className="font-mono font-bold tabular-nums text-red-700">
                                {missed.lastMissedPaymentDateLabel}
                              </div>
                              <div className="text-[11px] text-slate-600 mt-0.5">
                                {missed.lastMissedMonthLabel} due ·{' '}
                                <span className="font-mono tabular-nums font-semibold text-amber-800">
                                  {missed.consecutiveMissedMonths} consecutive missed
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="font-medium text-slate-600">
                              Manual suspension (no missed billing cycle)
                            </div>
                          )}
                          <div className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
                            {lastPaidDateLabel
                              ? `Last payment: ${lastPaidDateLabel}`
                              : 'Last payment: None recorded'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="font-mono font-bold text-sm tabular-nums text-slate-900">
                            ₹{financials.totalCombinedPending.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[11px] font-mono tabular-nums text-slate-500 mt-0.5">
                            ₹{student.netMonthlyFee.toLocaleString('en-IN')}/mo
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOverrideRow(row)}
                            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                            title="Manually override suspension, restore Enrolled status, and record audit entry"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            <span>Override Suspension</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Suspension & Manual Override Audit Trail */}
      <div className="pt-2 border-t border-slate-200 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-600" />
            <span>Recent Suspension &amp; Override Activity</span>
          </h4>
          <span className="text-xs text-slate-500 tabular-nums">
            Showing {suspensionAuditLogs.length} latest{' '}
            {suspensionAuditLogs.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {suspensionAuditLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-3">
            No suspension or manual override events have been logged yet.
          </p>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
            {suspensionAuditLogs.map((log) => (
              <div
                key={log.id}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-medium text-slate-900">{log.event}</p>
                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5">
                    <span>{log.actor}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{log.timestamp}</span>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${
                    log.status === 'Suspended'
                      ? 'text-amber-800'
                      : log.status === 'Success'
                      ? 'text-emerald-700'
                      : 'text-slate-600'
                  }`}
                >
                  {log.status === 'Suspended' ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>{log.status}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
