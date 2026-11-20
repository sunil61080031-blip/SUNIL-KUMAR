import React, { useMemo, useState } from 'react';
import { FeePlan, StudentRecord } from '../types';
import {
  buildMonthlyLedgerRows,
  computeStudentFinancials,
  getMonthKeyFromLabel
} from '../utils/ledgerHelpers';
import { Gauge } from 'lucide-react';

export type EfficiencyPeriodMode = 'session' | 'month';

interface CollectionEfficiencySummaryPanelProps {
  activeStudents: StudentRecord[];
  viewLabel: string;
  feePlans: FeePlan[];
  activeMonthLabel: string;
  recommendedScope: EfficiencyPeriodMode;
}

export const CollectionEfficiencySummaryPanel: React.FC<
  CollectionEfficiencySummaryPanelProps
> = ({
  activeStudents,
  viewLabel,
  feePlans,
  activeMonthLabel,
  recommendedScope
}) => {
  const [periodOverride, setPeriodOverride] =
    useState<EfficiencyPeriodMode | null>(null);

  // Reset manual override whenever the active view's natural scope changes
  React.useEffect(() => {
    setPeriodOverride(null);
  }, [recommendedScope, activeMonthLabel]);

  const effectiveScope: EfficiencyPeriodMode =
    periodOverride ?? recommendedScope;

  const monthKey = useMemo(
    () => getMonthKeyFromLabel(activeMonthLabel) || '2026-11',
    [activeMonthLabel]
  );

  // Deduplicate active students by ID so multi-receipt views never double-count a student
  const uniqueStudents = useMemo(() => {
    const map = new Map<string, StudentRecord>();
    for (const stu of activeStudents) {
      if (!map.has(stu.id)) {
        map.set(stu.id, stu);
      }
    }
    return Array.from(map.values());
  }, [activeStudents]);

  const metrics = useMemo(() => {
    let totalExpected = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let advanceCredit = 0;

    let clearedCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;
    let waivedCount = 0;

    for (const stu of uniqueStudents) {
      const fin = computeStudentFinancials(stu, feePlans);
      advanceCredit += fin.advanceCreditNextMonths;

      if (effectiveScope === 'session') {
        const expected = fin.currentSessionBilled + fin.prevYearTotalAssigned;
        const paid = fin.currentSessionPaid + fin.prevYearCleared;
        const pending = fin.totalCombinedPending;

        totalExpected += expected;
        totalPaid += paid;
        totalPending += pending;

        if (stu.isCharitySeat) waivedCount += 1;
        else if (pending <= 0) clearedCount += 1;
        else if (paid > 0) partialCount += 1;
        else unpaidCount += 1;
      } else {
        const ledgerRows = buildMonthlyLedgerRows(stu, feePlans);
        const row = ledgerRows.find((r) => r.key === monthKey);

        if (
          !row ||
          row.status === 'Before Admission' ||
          row.status === 'Disenrolled Break'
        ) {
          clearedCount += 1;
          continue;
        }
        if (row.status === 'Waived' || stu.isCharitySeat) {
          waivedCount += 1;
          continue;
        }

        const expected = row.totalPayableWithBackDues;
        const paid = row.paidAmount;
        const pending = Math.max(0, row.remainingAmount + row.backDueCarriedIn);

        totalExpected += expected;
        totalPaid += paid;
        totalPending += pending;

        if (pending <= 0) clearedCount += 1;
        else if (paid > 0) partialCount += 1;
        else unpaidCount += 1;
      }
    }

    const hasStudents = uniqueStudents.length > 0;
    const rawEfficiencyPct =
      totalExpected > 0
        ? (totalPaid / totalExpected) * 100
        : hasStudents
        ? 100
        : 0;
    const clampedBarPct = Math.max(0, Math.min(100, rawEfficiencyPct));
    const displayPct =
      !hasStudents
        ? '0.0'
        : totalExpected === 0
        ? '100.0'
        : Math.min(100, rawEfficiencyPct).toFixed(1);

    const statusTier: 'empty' | 'waived' | 'high' | 'moderate' | 'low' =
      !hasStudents
        ? 'empty'
        : totalExpected === 0
        ? 'waived'
        : rawEfficiencyPct >= 85
        ? 'high'
        : rawEfficiencyPct >= 60
        ? 'moderate'
        : 'low';

    const statusLabel =
      statusTier === 'empty'
        ? 'No Students in View'
        : statusTier === 'waived'
        ? 'Zero Dues Expected'
        : statusTier === 'high'
        ? 'High Efficiency'
        : statusTier === 'moderate'
        ? 'Moderate Efficiency'
        : 'Needs Follow-Up';

    return {
      totalExpected,
      totalPaid,
      totalPending,
      advanceCredit,
      clearedCount,
      partialCount,
      unpaidCount,
      waivedCount,
      rawEfficiencyPct,
      clampedBarPct,
      displayPct,
      statusTier,
      statusLabel
    };
  }, [uniqueStudents, feePlans, effectiveScope, monthKey]);

  const statusTextClass =
    metrics.statusTier === 'high'
      ? 'text-emerald-700'
      : metrics.statusTier === 'moderate'
      ? 'text-amber-700'
      : metrics.statusTier === 'low'
      ? 'text-rose-700'
      : 'text-slate-500';

  const progressBarClass =
    metrics.statusTier === 'high'
      ? 'bg-emerald-600'
      : metrics.statusTier === 'moderate'
      ? 'bg-amber-500'
      : metrics.statusTier === 'low'
      ? 'bg-[#7a1426]'
      : 'bg-slate-300';

  return (
    <div
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden no-print"
      aria-label="Active List Collection Efficiency Summary"
    >
      {/* Top Header Strip */}
      <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/60">
        <div className="flex items-center gap-2 min-w-0">
          <Gauge className="w-4 h-4 text-[#7a1426] shrink-0" />
          <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <h3 className="font-display font-extrabold text-slate-900 whitespace-nowrap">
              Collection Efficiency
            </h3>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-600 font-medium truncate">
              {viewLabel}
            </span>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="font-mono tabular-nums font-semibold text-slate-800 whitespace-nowrap">
              {uniqueStudents.length}{' '}
              {uniqueStudents.length === 1 ? 'student' : 'students'}
            </span>
          </div>
        </div>

        {/* Calculation Scope Switcher */}
        <div
          className="inline-flex items-center p-0.5 bg-slate-200/70 rounded-lg text-[11px] shrink-0 self-start sm:self-auto"
          role="group"
          aria-label="Collection efficiency timeframe"
        >
          <button
            type="button"
            onClick={() => setPeriodOverride('session')}
            className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              effectiveScope === 'session'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Session to Date
          </button>
          <button
            type="button"
            onClick={() => setPeriodOverride('month')}
            className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              effectiveScope === 'month'
                ? 'bg-white text-[#7a1426] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Month: {activeMonthLabel}
          </button>
        </div>
      </div>

      {/* Main Efficiency & Financial Ratios Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        {/* Left Anchor: Collection Efficiency % + Progress Bar */}
        <div className="lg:col-span-5 px-4 sm:px-5 py-4 space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600">
              Collection Efficiency %
            </span>
            <span className={`text-xs font-bold ${statusTextClass}`}>
              {metrics.statusLabel}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <p className="font-mono tabular-nums text-3xl font-black tracking-tight text-slate-950">
              {metrics.displayPct}%
            </p>
            <p className="text-[11px] font-mono tabular-nums text-slate-500">
              ₹{metrics.totalPaid.toLocaleString('en-IN')} ÷ ₹
              {metrics.totalExpected.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="space-y-1">
            <div
              className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(metrics.clampedBarPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Collection efficiency percentage for active student list"
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${progressBarClass}`}
                style={{ width: `${metrics.clampedBarPct}%` }}
              />
              {/* 85% Efficiency Benchmark Marker */}
              <div
                aria-hidden="true"
                className="absolute top-0 bottom-0 w-[1.5px] bg-slate-400/80"
                style={{ left: '85%' }}
                title="85% High Efficiency Benchmark"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-400">
              <span>0%</span>
              <span>Target 85%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Right 3-Column Tabular Figures */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          {/* Total Paid */}
          <div className="px-4 sm:px-5 py-4 flex flex-col justify-between gap-1.5">
            <span className="text-xs font-semibold text-slate-500">
              Total Paid
            </span>
            <p className="font-mono tabular-nums text-xl font-extrabold text-emerald-700 tracking-tight">
              ₹{metrics.totalPaid.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 font-mono tabular-nums">
              <span className="text-emerald-700 font-semibold">
                {metrics.clearedCount} Paid
              </span>
              <span className="mx-1 font-sans text-slate-300">·</span>
              <span className="text-amber-700 font-semibold">
                {metrics.partialCount} Partial
              </span>
            </p>
          </div>

          {/* Total Expected */}
          <div className="px-4 sm:px-5 py-4 flex flex-col justify-between gap-1.5">
            <span className="text-xs font-semibold text-slate-500">
              Total Expected
            </span>
            <p className="font-mono tabular-nums text-xl font-extrabold text-slate-950 tracking-tight">
              ₹{metrics.totalExpected.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500">
              {effectiveScope === 'session'
                ? 'Billed + Prior Arrears'
                : `${activeMonthLabel} Payable`}
              {metrics.waivedCount > 0 && (
                <>
                  <span className="mx-1 text-slate-300">·</span>
                  <span className="font-mono tabular-nums">
                    {metrics.waivedCount} Waived
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Outstanding Balance */}
          <div className="px-4 sm:px-5 py-4 flex flex-col justify-between gap-1.5">
            <span className="text-xs font-semibold text-slate-500">
              Uncollected Dues
            </span>
            <p
              className={`font-mono tabular-nums text-xl font-extrabold tracking-tight ${
                metrics.totalPending > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              ₹{metrics.totalPending.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 font-mono tabular-nums">
              {metrics.unpaidCount > 0 ? (
                <span className="text-rose-700 font-semibold">
                  {metrics.unpaidCount} Unpaid
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold">
                  0 Unpaid
                </span>
              )}
              {metrics.advanceCredit > 0 && effectiveScope === 'session' && (
                <>
                  <span className="mx-1 font-sans text-slate-300">·</span>
                  <span className="text-sky-700 font-semibold">
                    +₹{metrics.advanceCredit.toLocaleString('en-IN')} adv.
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
