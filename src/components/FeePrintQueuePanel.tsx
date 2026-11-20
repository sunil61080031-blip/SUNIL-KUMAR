import React from 'react';
import {
  BulkGridOrientation,
  BulkPrintScale,
  BulkSlipEntry
} from './BulkFeeSlipPrintSheet';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Layers,
  Printer,
  Trash2,
  X
} from 'lucide-react';

interface FeePrintQueuePanelProps {
  entries: BulkSlipEntry[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  scalePercent: BulkPrintScale;
  onScaleChange: (scale: BulkPrintScale) => void;
  orientation: BulkGridOrientation;
  onOrientationChange: (orientation: BulkGridOrientation) => void;
  autoQueueOnSave: boolean;
  onToggleAutoQueueOnSave: (enabled: boolean) => void;
  onRemoveEntry: (studentId: string, paymentId: string) => void;
  onMoveEntry: (index: number, direction: -1 | 1) => void;
  onClearQueue: () => void;
  onOpenQueueInStudio: () => void;
  onPrintQueueBatch: () => void;
}

export const FeePrintQueuePanel: React.FC<FeePrintQueuePanelProps> = ({
  entries,
  isExpanded,
  onToggleExpand,
  scalePercent,
  onScaleChange,
  orientation,
  onOrientationChange,
  autoQueueOnSave,
  onToggleAutoQueueOnSave,
  onRemoveEntry,
  onMoveEntry,
  onClearQueue,
  onOpenQueueInStudio,
  onPrintQueueBatch
}) => {
  const count = entries.length;
  const sheetCount = count > 0 ? Math.ceil(count / 6) : 0;
  const currentSheetFilled = count === 0 ? 0 : count % 6 === 0 ? 6 : count % 6;
  const remainingSlotsOnLastSheet = count === 0 ? 6 : 6 - currentSheetFilled;
  const totalQueuedAmount = entries.reduce(
    (sum, item) => sum + item.breakdown.currentPayment,
    0
  );

  return (
    <div
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden no-print"
      aria-label="Receipt Print Queue"
    >
      {/* Top Compact Command Strip */}
      <div className="px-4 sm:px-5 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Queue Identity, Sheet Optimization Math & 6-Slot Fill Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#7a1426]/[0.08] text-[#7a1426] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-sm font-extrabold text-slate-900 whitespace-nowrap">
                  Batch Print Queue
                </h3>
                <span className="text-slate-300" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs font-mono tabular-nums font-bold text-[#7a1426] whitespace-nowrap">
                  {count} {count === 1 ? 'receipt' : 'receipts'}
                </span>
                {count > 0 && (
                  <>
                    <span className="text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-xs font-mono tabular-nums font-semibold text-slate-700 whitespace-nowrap">
                      {sheetCount} A4 {sheetCount === 1 ? 'sheet' : 'sheets'}
                    </span>
                    <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-xs font-mono tabular-nums font-semibold text-emerald-700 hidden sm:inline whitespace-nowrap">
                      ₹{totalQueuedAmount.toLocaleString('en-IN')}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
                {/* 6-slot visual indicator for current 3x2 A4 sheet */}
                <div
                  className="inline-flex items-center gap-1"
                  aria-label={`${currentSheetFilled} of 6 slots filled on current A4 sheet`}
                >
                  {[0, 1, 2, 3, 4, 5].map((slot) => (
                    <span
                      key={slot}
                      className={`h-1.5 w-3.5 rounded-[2px] transition-colors ${
                        slot < currentSheetFilled ? 'bg-[#7a1426]' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-mono tabular-nums">
                  {count === 0
                    ? 'Select processed receipts from any list to queue 6 per A4 sheet'
                    : remainingSlotsOnLastSheet === 0
                    ? `Full 3×2 A4 sheet ready (${orientation === '3x2-landscape' ? '3×2 Landscape' : '2×3 Portrait'} · ${scalePercent}%)`
                    : `${currentSheetFilled}/6 filled on sheet ${sheetCount} (${remainingSlotsOnLastSheet} open ${remainingSlotsOnLastSheet === 1 ? 'slot' : 'slots'})`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick 3x2 Print Settings & Primary Batch Action */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Quick Scale Selector (80% / 90% / 100%) */}
          <div
            className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg text-[11px]"
            role="group"
            aria-label="Queue print scale"
          >
            {([80, 90, 100] as const).map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => onScaleChange(pct)}
                className={`px-2 py-1.5 rounded-md font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  scalePercent === pct
                    ? 'bg-white text-[#7a1426] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Quick Grid Orientation */}
          <div
            className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg text-[11px]"
            role="group"
            aria-label="Queue A4 layout orientation"
          >
            <button
              type="button"
              onClick={() => onOrientationChange('3x2-landscape')}
              className={`px-2 py-1.5 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                orientation === '3x2-landscape'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3×2
            </button>
            <button
              type="button"
              onClick={() => onOrientationChange('2x3-portrait')}
              className={`px-2 py-1.5 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                orientation === '2x3-portrait'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2×3
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleExpand}
            className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>{isExpanded ? 'Hide Queue' : `Manage Queue (${count})`}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          {count > 0 && (
            <button
              type="button"
              onClick={onOpenQueueInStudio}
              className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#7a1426]" />
              <span>3×2 Preview</span>
            </button>
          )}

          <button
            type="button"
            disabled={count === 0}
            onClick={onPrintQueueBatch}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#7a1426] hover:bg-[#5e0f1d] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>
              {count === 0 ? 'Print Queue (0)' : `Print Batch (${count})`}
            </span>
          </button>
        </div>
      </div>

      {/* Expandable Queue Manager List */}
      {isExpanded && (
        <div className="border-t border-slate-200 bg-slate-50/70">
          <div className="px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoQueueOnSave}
                onChange={(e) => onToggleAutoQueueOnSave(e.target.checked)}
                className="w-4 h-4 accent-[#7a1426] rounded cursor-pointer"
              />
              <span>
                Automatically add newly generated receipts to Print Queue
              </span>
            </label>

            {count > 0 && (
              <button
                type="button"
                onClick={onClearQueue}
                className="text-xs font-semibold text-rose-700 hover:text-rose-800 hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All ({count})</span>
              </button>
            )}
          </div>

          {count === 0 ? (
            <div className="px-5 py-7 text-center space-y-1.5">
              <p className="text-xs font-semibold text-slate-800">
                Your batch print queue is currently empty.
              </p>
              <p className="text-xs text-slate-500 max-w-xl mx-auto">
                Check receipts in <strong>Quick Receipt Lookup</strong> or{' '}
                <strong>Search &amp; Duplicates</strong>, or click{' '}
                <strong>Add to Print Queue</strong> after saving a payment to batch up to 6 slips per A4 sheet.
              </p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-200/80 bg-white">
              {entries.map((entry, idx) => {
                const sheetNum = Math.floor(idx / 6) + 1;
                const slotNum = (idx % 6) + 1;
                const paymentId = entry.paymentId || '';

                return (
                  <div
                    key={entry.key}
                    className="px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/80"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono tabular-nums text-[11px] font-semibold text-slate-400 w-12 shrink-0">
                        P{sheetNum}·#{slotNum}
                      </span>
                      <span className="font-mono font-bold text-[#7a1426] shrink-0">
                        {entry.receiptNo}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 truncate block sm:inline">
                          {entry.student.studentName}
                        </span>
                        <span className="text-[11px] text-slate-500 sm:ml-2 font-mono">
                          {entry.student.studentIdCode} · {entry.feeMonth} ·{' '}
                          {entry.paymentMode}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono tabular-nums font-bold text-emerald-700 mr-1">
                        ₹{entry.breakdown.currentPayment.toLocaleString('en-IN')}
                      </span>

                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => onMoveEntry(idx, -1)}
                        aria-label={`Move ${entry.receiptNo} up in print queue`}
                        title="Move up"
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 text-slate-600 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === count - 1}
                        onClick={() => onMoveEntry(idx, 1)}
                        aria-label={`Move ${entry.receiptNo} down in print queue`}
                        title="Move down"
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 text-slate-600 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveEntry(entry.student.id, paymentId)}
                        aria-label={`Remove ${entry.receiptNo} from print queue`}
                        title="Remove from queue"
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-700 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
