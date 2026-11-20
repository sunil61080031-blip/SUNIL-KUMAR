import React, { useState } from 'react';
import {
  FeePaymentItem,
  FeeReceiptBreakdown,
  InstituteConfig,
  StudentRecord
} from '../types';
import { INSTITUTE_CREST_URL } from './OfficialFeeSlipDocument';
import { GraduationCap } from 'lucide-react';

export type BulkPrintScale = 80 | 90 | 100;
export type BulkGridOrientation = '3x2-landscape' | '2x3-portrait';

export interface BulkSlipEntry {
  key: string;
  paymentId?: string;
  student: StudentRecord;
  receiptNo: string;
  paymentDate: string;
  feeMonth: string;
  paymentMode: FeePaymentItem['mode'];
  transactionId?: string;
  paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid';
  breakdown: FeeReceiptBreakdown;
  copyLabel: string;
  isCancelled?: boolean;
  collectedBy?: string;
}

interface CompactFeeSlipCardProps {
  entry: BulkSlipEntry;
  instituteConfig: InstituteConfig;
}

const formatCompactINR = (val: number) =>
  `₹${Math.max(0, Math.round(val)).toLocaleString('en-IN')}`;

export const CompactFeeSlipCard: React.FC<CompactFeeSlipCardProps> = ({
  entry,
  instituteConfig
}) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const { student, breakdown } = entry;

  const feeRows = [
    { sno: 1, label: 'Registration Fee', amount: breakdown.registrationFee },
    { sno: 2, label: 'Tuition Fee', amount: breakdown.tuitionFee },
    { sno: 3, label: 'Hostel Fee', amount: breakdown.hostelFee },
    { sno: 4, label: 'Examination Fee', amount: breakdown.examinationFee },
    { sno: 5, label: 'Other Charges', amount: breakdown.otherCharges },
    { sno: 6, label: "Prev. Back Dues", amount: breakdown.previousBackDues }
  ];

  return (
    <div className="w-full h-full bg-white text-slate-900 border-[2px] border-[#7a1426] p-[3px] flex flex-col overflow-hidden">
      <div className="relative border border-[#7a1426]/80 px-2.5 py-2 flex-1 flex flex-col justify-between overflow-hidden bg-white">
        {/* Subtle Center Crest Watermark */}
        {!logoFailed && (
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute inset-0 flex items-center justify-center z-0"
          >
            <img
              src={INSTITUTE_CREST_URL}
              alt=""
              referrerPolicy="no-referrer"
              className="w-28 h-28 object-contain opacity-[0.06] mix-blend-multiply"
            />
          </div>
        )}

        {entry.isCancelled && (
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute inset-0 flex items-center justify-center z-20"
          >
            <span className="border-2 border-rose-700/75 text-rose-700/75 font-display text-lg font-black tracking-[0.2em] px-2 py-0.5 -rotate-12 uppercase bg-white/75">
              CANCELLED
            </span>
          </div>
        )}

        <div className="relative z-10 flex flex-col justify-between h-full gap-1">
          {/* 1. Compact Institute Header */}
          <div className="flex items-center gap-2 pb-1 border-b border-[#7a1426]">
            <div className="w-7 h-7 rounded-full border border-[#7a1426] overflow-hidden bg-white flex items-center justify-center shrink-0">
              {!logoFailed ? (
                <img
                  src={INSTITUTE_CREST_URL}
                  alt="Shiksha Niketan Emblem"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoFailed(true)}
                  className="w-full h-full object-cover scale-[1.06]"
                />
              ) : (
                <GraduationCap className="w-4 h-4 text-[#7a1426]" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-center pr-2">
              <p className="font-display text-[10px] font-black tracking-wide text-[#7a1426] leading-tight uppercase truncate">
                SHIKSHA NIKETAN TUITION CENTRE
              </p>
              <p className="text-[7.5px] font-semibold text-slate-700 leading-tight truncate">
                Gadhiya, Bhaptiyahi (Supaul) · {instituteConfig.phoneDisplay}
              </p>
            </div>
          </div>

          {/* 2. Acknowledgment Band */}
          <div className="flex items-center justify-between gap-1 bg-[#7a1426]/[0.07] border-y border-[#7a1426]/80 px-1.5 py-[2px] text-[7.5px]">
            <span className="font-mono font-bold text-[#7a1426] truncate">
              No: <strong className="text-slate-950">{entry.receiptNo}</strong>
            </span>
            <span className="font-display font-extrabold text-[#7a1426] uppercase tracking-wider shrink-0">
              FEE RECEIPT
            </span>
            <span className="font-mono font-bold text-[#7a1426] shrink-0">
              {entry.copyLabel}
            </span>
          </div>

          {/* 3. Compact Student & Payment Metadata */}
          <div className="border border-[#7a1426]/70 grid grid-cols-2 divide-x divide-[#7a1426]/40 text-[7.5px] leading-[1.3]">
            <div className="px-1.5 py-1 space-y-[1px] min-w-0">
              <p className="truncate">
                <span className="font-bold text-[#7a1426]">Name: </span>
                <strong className="text-slate-950">{student.studentName}</strong>
              </p>
              <p className="truncate">
                <span className="font-bold text-[#7a1426]">Father: </span>
                <span className="text-slate-900">{student.parentName}</span>
              </p>
              <p className="truncate">
                <span className="font-bold text-[#7a1426]">Roll/Cls: </span>
                <span className="font-mono font-semibold text-slate-950">
                  {student.studentIdCode}
                </span>{' '}
                · {student.batchCode}
              </p>
            </div>

            <div className="px-1.5 py-1 space-y-[1px] min-w-0">
              <p className="truncate">
                <span className="font-bold text-[#7a1426]">Month: </span>
                <strong className="text-slate-950">{entry.feeMonth}</strong>
              </p>
              <p className="truncate">
                <span className="font-bold text-[#7a1426]">Date: </span>
                <span className="font-mono text-slate-900">
                  {entry.paymentDate}
                </span>{' '}
                · {student.academicSession || '2026-27'}
              </p>
              <p className="truncate">
                <span className="font-bold text-[#7a1426]">Mode: </span>
                <span className="text-slate-900">{entry.paymentMode}</span>
                <span className="mx-0.5">·</span>
                <strong
                  className={
                    entry.isCancelled
                      ? 'text-rose-700'
                      : entry.paymentStatus === 'Paid'
                      ? 'text-emerald-800'
                      : entry.paymentStatus === 'Partially Paid'
                      ? 'text-amber-800'
                      : 'text-rose-700'
                  }
                >
                  {entry.isCancelled ? 'Void' : entry.paymentStatus}
                </strong>
              </p>
            </div>
          </div>

          {/* 4. Compact 6-Row Fee Details Table */}
          <table className="w-full border-collapse border border-[#7a1426] text-[7.5px] leading-[1.25]">
            <thead>
              <tr className="bg-[#7a1426] text-white">
                <th className="border border-[#7a1426] px-1 py-[2px] text-center w-6 font-bold">
                  S.N
                </th>
                <th className="border border-[#7a1426] px-1.5 py-[2px] text-left font-bold">
                  Particulars
                </th>
                <th className="border border-[#7a1426] px-1.5 py-[2px] text-right w-16 font-bold">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {feeRows.map((r) => (
                <tr key={r.sno} className="bg-white/80">
                  <td className="border border-[#7a1426]/60 px-1 py-[1.5px] text-center font-mono tabular-nums text-slate-700">
                    {r.sno}
                  </td>
                  <td className="border border-[#7a1426]/60 px-1.5 py-[1.5px] text-slate-900 font-medium truncate">
                    {r.label}
                  </td>
                  <td className="border border-[#7a1426]/60 px-1.5 py-[1.5px] text-right font-mono tabular-nums font-semibold text-slate-900">
                    {formatCompactINR(r.amount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-[#7a1426]/[0.07]">
                <td
                  colSpan={2}
                  className="border border-[#7a1426] px-1.5 py-[2px] text-right font-extrabold text-[#7a1426]"
                >
                  Total Payable
                </td>
                <td className="border border-[#7a1426] px-1.5 py-[2px] text-right font-mono tabular-nums font-extrabold text-slate-950">
                  {formatCompactINR(breakdown.totalPayable)}
                </td>
              </tr>
              <tr className="bg-white/85">
                <td
                  colSpan={2}
                  className="border border-[#7a1426]/70 px-1.5 py-[1.5px] text-right font-semibold text-slate-700"
                >
                  Previously Paid
                </td>
                <td className="border border-[#7a1426]/70 px-1.5 py-[1.5px] text-right font-mono tabular-nums font-bold text-slate-800">
                  {formatCompactINR(breakdown.previouslyPaid)}
                </td>
              </tr>
              <tr className="bg-emerald-50/85">
                <td
                  colSpan={2}
                  className="border border-[#7a1426] px-1.5 py-[2px] text-right font-extrabold text-emerald-900"
                >
                  Current Payment
                </td>
                <td className="border border-[#7a1426] px-1.5 py-[2px] text-right font-mono tabular-nums font-black text-emerald-900">
                  {formatCompactINR(breakdown.currentPayment)}
                </td>
              </tr>
              <tr
                className={
                  breakdown.remainingDues > 0
                    ? 'bg-rose-50/85'
                    : 'bg-[#7a1426]/[0.04]'
                }
              >
                <td
                  colSpan={2}
                  className={`border border-[#7a1426] px-1.5 py-[2px] text-right font-extrabold ${
                    breakdown.remainingDues > 0
                      ? 'text-rose-800'
                      : 'text-[#7a1426]'
                  }`}
                >
                  Remaining Dues
                </td>
                <td
                  className={`border border-[#7a1426] px-1.5 py-[2px] text-right font-mono tabular-nums font-black ${
                    breakdown.remainingDues > 0
                      ? 'text-rose-800'
                      : 'text-emerald-800'
                  }`}
                >
                  {formatCompactINR(breakdown.remainingDues)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 5. Compact Footer & Signature */}
          <div className="pt-1.5 flex items-end justify-between text-[7px] border-t border-[#7a1426]/40">
            <span className="font-bold text-[#7a1426]">
              Shiksha Niketan &bull; Non-refundable
            </span>
            <span className="border-t border-[#7a1426] pt-[1px] font-bold text-[#7a1426] min-w-[68px] text-center">
              Auth. Signature
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface BulkFeeSlipSheetsProps {
  entries: BulkSlipEntry[];
  instituteConfig: InstituteConfig;
  scalePercent: BulkPrintScale;
  orientation: BulkGridOrientation;
  showCutLines: boolean;
  isPrintOverlay?: boolean;
}

export const BulkFeeSlipSheets: React.FC<BulkFeeSlipSheetsProps> = ({
  entries,
  instituteConfig,
  scalePercent,
  orientation,
  showCutLines,
  isPrintOverlay = false
}) => {
  // Chunk into pages of exactly 6 slips (3x2 grid)
  const pages: BulkSlipEntry[][] = [];
  for (let i = 0; i < entries.length; i += 6) {
    pages.push(entries.slice(i, i + 6));
  }

  const isLandscape = orientation === '3x2-landscape';
  const scaleFactor = scalePercent / 100;

  return (
    <div
      id={isPrintOverlay ? 'printable-bulk-slips-area' : undefined}
      className="space-y-6 print:space-y-0"
    >
      {/* Dynamic @page orientation override strictly when rendering the print overlay */}
      {isPrintOverlay && (
        <style>{`
          @media print {
            @page {
              size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
              margin: 6mm;
            }
          }
        `}</style>
      )}

      {pages.map((pageEntries, pageIdx) => {
        const paddedSlots: (BulkSlipEntry | null)[] = [...pageEntries];
        while (paddedSlots.length < 6) {
          paddedSlots.push(null);
        }

        return (
          <div key={`sheet-${pageIdx}`} className="space-y-2 print:space-y-0">
            {/* On-screen sheet caption (hidden during print) */}
            <div className="flex items-center justify-between text-xs text-slate-600 px-1 no-print">
              <span className="font-semibold text-slate-800">
                A4 Sheet {pageIdx + 1} of {pages.length}
                <span className="mx-1.5 text-slate-300">·</span>
                {isLandscape
                  ? '3×2 Landscape (3 Cols × 2 Rows)'
                  : '2×3 Portrait (2 Cols × 3 Rows)'}
              </span>
              <span className="font-mono tabular-nums text-slate-600">
                {pageEntries.length} / 6 slips · Size {scalePercent}%
              </span>
            </div>

            {/* Physical A4 Sheet Container */}
            <div className="overflow-x-auto pb-2 print:overflow-visible print:pb-0">
              <div
                className={`bulk-a4-sheet bg-white mx-auto border border-slate-300 shadow-md print:shadow-none print:border-none ${
                  isLandscape
                    ? 'w-[285mm] h-[196mm]'
                    : 'w-[196mm] h-[285mm]'
                } p-[3mm] print:p-0`}
              >
                <div
                  className={`w-full h-full grid gap-[2.5mm] ${
                    isLandscape
                      ? 'grid-cols-3 grid-rows-2'
                      : 'grid-cols-2 grid-rows-3'
                  }`}
                >
                  {paddedSlots.map((slot, slotIdx) => (
                    <div
                      key={slot ? slot.key : `empty-${pageIdx}-${slotIdx}`}
                      className={`w-full h-full flex items-center justify-center overflow-hidden ${
                        showCutLines
                          ? 'border border-dashed border-slate-300 p-[1mm]'
                          : ''
                      }`}
                    >
                      {slot ? (
                        <div
                          className="w-full h-full"
                          style={{
                            transform: `scale(${scaleFactor})`,
                            transformOrigin: 'center center'
                          }}
                        >
                          <CompactFeeSlipCard
                            entry={slot}
                            instituteConfig={instituteConfig}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300 no-print">
                          Empty 3×2 Slot
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
