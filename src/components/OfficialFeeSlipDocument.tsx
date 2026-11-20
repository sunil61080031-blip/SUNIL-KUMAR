import React, { useState } from 'react';
import {
  FeePaymentItem,
  FeeReceiptBreakdown,
  InstituteConfig,
  StudentRecord
} from '../types';
import { numberToIndianWords } from '../utils/ledgerHelpers';
import { GraduationCap } from 'lucide-react';

export const INSTITUTE_CREST_URL =
  '/src/assets/images/shiksha_niketan_crest_1795156572389.jpg';

interface OfficialFeeSlipDocumentProps {
  student: StudentRecord;
  instituteConfig: InstituteConfig;
  receiptNo: string;
  paymentDate: string;
  feeMonth: string;
  paymentMode: FeePaymentItem['mode'];
  transactionId?: string;
  paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid';
  breakdown: FeeReceiptBreakdown;
  remarks?: string;
  isDuplicateCopy?: boolean;
  isCancelled?: boolean;
  isPreviewDraft?: boolean;
  collectedBy?: string;
}

const formatINR = (val: number) =>
  `₹ ${Math.max(0, Math.round(val)).toLocaleString('en-IN')}`;

export const OfficialFeeSlipDocument: React.FC<OfficialFeeSlipDocumentProps> = ({
  student,
  instituteConfig,
  receiptNo,
  paymentDate,
  feeMonth,
  paymentMode,
  transactionId,
  paymentStatus,
  breakdown,
  remarks,
  isDuplicateCopy = false,
  isCancelled = false,
  isPreviewDraft = false,
  collectedBy
}) => {
  const [logoFailed, setLogoFailed] = useState(false);

  const feeRows = [
    { sno: 1, label: 'Registration Fee', amount: breakdown.registrationFee },
    { sno: 2, label: 'Tuition Fee', amount: breakdown.tuitionFee },
    { sno: 3, label: 'Hostel Fee', amount: breakdown.hostelFee },
    { sno: 4, label: 'Examination Fee', amount: breakdown.examinationFee },
    { sno: 5, label: 'Other Charges', amount: breakdown.otherCharges },
    {
      sno: 6,
      label: "Previous Month's Back Dues",
      amount: breakdown.previousBackDues
    }
  ];

  const sessionLabel = student.academicSession || '2026-27';
  const classSectionLabel = `${student.classLevel} · ${student.batchCode}`;

  return (
    <div className="bg-white text-slate-900 w-full max-w-[794px] mx-auto shadow-md print:shadow-none">
      {/* Outer Formal Maroon Border */}
      <div className="border-[3px] border-[#7a1426] p-1.5 sm:p-2 bg-white">
        {/* Inner Maroon Hairline Certificate Border */}
        <div className="relative border border-[#7a1426]/80 px-5 py-5 sm:px-8 sm:py-6 overflow-hidden bg-white">
          {/* Center Subtle Watermark Logo */}
          {!logoFailed && (
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute inset-0 flex items-center justify-center z-0"
            >
              <img
                src={INSTITUTE_CREST_URL}
                alt=""
                referrerPolicy="no-referrer"
                className="w-72 h-72 sm:w-80 sm:h-80 object-contain opacity-[0.065] mix-blend-multiply"
              />
            </div>
          )}

          {/* Cancelled / Duplicate Watermark Stamp */}
          {isCancelled && (
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute inset-0 flex items-center justify-center z-20"
            >
              <span className="border-4 border-rose-700/70 text-rose-700/70 font-display text-4xl sm:text-5xl font-black tracking-[0.22em] px-6 py-2 -rotate-12 uppercase bg-white/60">
                CANCELLED
              </span>
            </div>
          )}

          {/* Foreground Content */}
          <div className="relative z-10 space-y-5">
            {/* 1. Institute Header with Top-Left Circular Crest */}
            <header className="flex items-center gap-4 pb-4 border-b-2 border-[#7a1426]">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[#7a1426] overflow-hidden bg-white flex items-center justify-center shrink-0">
                {!logoFailed ? (
                  <img
                    src={INSTITUTE_CREST_URL}
                    alt="Shiksha Niketan Tuition Centre Circular Emblem"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoFailed(true)}
                    className="w-full h-full object-cover scale-[1.06]"
                  />
                ) : (
                  <GraduationCap className="w-9 h-9 text-[#7a1426]" />
                )}
              </div>

              <div className="flex-1 text-center pr-0 sm:pr-12">
                <h1 className="font-display text-xl sm:text-[1.65rem] font-black tracking-wide text-[#7a1426] leading-tight uppercase">
                  SHIKSHA NIKETAN TUITION CENTRE
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5">
                  Gadhiya, Bhaptiyahi (Supaul), Bihar — 852109
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
                  Helpline: {instituteConfig.phoneDisplay} · Email: {instituteConfig.email}
                </p>
              </div>
            </header>

            {/* 2. Official Acknowledgment Heading Band */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-y border-[#7a1426] bg-[#7a1426]/[0.06] px-4 py-2">
              <div className="text-xs font-mono font-bold text-[#7a1426]">
                Receipt No.: <span className="text-slate-950">{receiptNo}</span>
              </div>
              <h2 className="font-display text-xs sm:text-sm font-extrabold tracking-[0.14em] text-[#7a1426] uppercase text-center">
                OFFICIAL TUITION FEE ACKNOWLEDGMENT
              </h2>
              <div className="text-xs font-mono font-bold text-[#7a1426]">
                {isCancelled
                  ? 'VOIDED RECEIPT'
                  : isDuplicateCopy
                  ? 'DUPLICATE COPY'
                  : isPreviewDraft
                  ? 'LIVE PREVIEW'
                  : 'ORIGINAL COPY'}
              </div>
            </div>

            {/* 3. Structured Student & Payment Details Table */}
            <div className="border border-[#7a1426]/80 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#7a1426]/40">
                {/* Left Column: Student Identity */}
                <div className="divide-y divide-[#7a1426]/25">
                  <div className="grid grid-cols-5 px-3 py-2">
                    <span className="col-span-2 font-bold text-[#7a1426]">
                      Student Name
                    </span>
                    <span className="col-span-3 font-extrabold text-slate-950">
                      : {student.studentName}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 px-3 py-2">
                    <span className="col-span-2 font-bold text-[#7a1426]">
                      Father&apos;s Name
                    </span>
                    <span className="col-span-3 font-semibold text-slate-900">
                      : {student.parentName}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 px-3 py-2">
                    <span className="col-span-2 font-bold text-[#7a1426]">
                      Roll / Adm. No.
                    </span>
                    <span className="col-span-3 font-mono font-bold text-slate-950">
                      : {student.studentIdCode}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 px-3 py-2">
                    <span className="col-span-2 font-bold text-[#7a1426]">
                      Class &amp; Section
                    </span>
                    <span className="col-span-3 font-semibold text-slate-900">
                      : {classSectionLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 px-3 py-2">
                    <span className="col-span-2 font-bold text-[#7a1426]">
                      Student Profile ID
                    </span>
                    <span className="col-span-3 font-mono text-slate-800">
                      : {student.id.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Right Column: Session & Payment Info */}
                <div className="divide-y divide-[#7a1426]/25">
                  <div className="grid grid-cols-5 px-3 py-2">
                    <span className="col-span-2 font-bold text-[#7a1426]">
                      Academic Session
                    </span>
                    <span className="col-span-3 font-mono font-bold text-slate-950">
                      : {sessionLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 px-3 py-2">
                    <span className="col-span-2 font-bold text-[#7a1426]">
                      Fee Month
                    </span>
                    <span className="col-span-3 font-bold text-slate-950">
                      : {feeMonth}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 px-3 py-2">
                    <span className="col-span-2 font-bold text-[#7a1426]">
                      Payment Date
                    </span>
                    <span className="col-span-3 font-mono font-semibold text-slate-900">
                      : {paymentDate}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 px-3 py-2">
                    <span className="col-span-2 font-bold text-[#7a1426]">
                      Payment Mode
                    </span>
                    <span className="col-span-3 font-semibold text-slate-900">
                      : {paymentMode}
                      {transactionId ? ` (Ref: ${transactionId})` : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 px-3 py-2">
                    <span className="col-span-2 font-bold text-[#7a1426]">
                      Payment Status
                    </span>
                    <span
                      className={`col-span-3 font-extrabold ${
                        isCancelled
                          ? 'text-rose-700'
                          : paymentStatus === 'Paid'
                          ? 'text-emerald-800'
                          : paymentStatus === 'Partially Paid'
                          ? 'text-amber-800'
                          : 'text-rose-700'
                      }`}
                    >
                      : {isCancelled ? 'Cancelled / Void' : paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Structured Fee Details Table (Maroon Lines) */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#7a1426] text-xs sm:text-[13px]">
                <thead>
                  <tr className="bg-[#7a1426] text-white">
                    <th className="border border-[#7a1426] px-3 py-2 text-center font-bold w-16">
                      S.No.
                    </th>
                    <th className="border border-[#7a1426] px-4 py-2 text-left font-bold">
                      Particulars
                    </th>
                    <th className="border border-[#7a1426] px-4 py-2 text-right font-bold w-40">
                      Amount (₹)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {feeRows.map((row) => (
                    <tr key={row.sno} className="bg-white/75">
                      <td className="border border-[#7a1426]/65 px-3 py-2 text-center font-mono tabular-nums text-slate-800">
                        {row.sno}
                      </td>
                      <td className="border border-[#7a1426]/65 px-4 py-2 font-medium text-slate-900">
                        {row.label}
                      </td>
                      <td className="border border-[#7a1426]/65 px-4 py-2 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatINR(row.amount)}
                      </td>
                    </tr>
                  ))}

                  {/* Summary Totals */}
                  <tr className="bg-[#7a1426]/[0.07]">
                    <td
                      colSpan={2}
                      className="border border-[#7a1426] px-4 py-2 text-right font-extrabold text-[#7a1426]"
                    >
                      Total Payable
                    </td>
                    <td className="border border-[#7a1426] px-4 py-2 text-right font-mono tabular-nums font-extrabold text-slate-950">
                      {formatINR(breakdown.totalPayable)}
                    </td>
                  </tr>
                  <tr className="bg-white/80">
                    <td
                      colSpan={2}
                      className="border border-[#7a1426]/75 px-4 py-2 text-right font-bold text-slate-700"
                    >
                      Previously Paid
                    </td>
                    <td className="border border-[#7a1426]/75 px-4 py-2 text-right font-mono tabular-nums font-bold text-slate-800">
                      {formatINR(breakdown.previouslyPaid)}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/80">
                    <td
                      colSpan={2}
                      className="border border-[#7a1426] px-4 py-2.5 text-right font-extrabold text-emerald-900"
                    >
                      Current Payment (Amount Received)
                    </td>
                    <td className="border border-[#7a1426] px-4 py-2.5 text-right font-mono tabular-nums text-sm font-black text-emerald-900">
                      {formatINR(breakdown.currentPayment)}
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
                      className={`border border-[#7a1426] px-4 py-2.5 text-right font-extrabold ${
                        breakdown.remainingDues > 0
                          ? 'text-rose-800'
                          : 'text-[#7a1426]'
                      }`}
                    >
                      Remaining Dues
                    </td>
                    <td
                      className={`border border-[#7a1426] px-4 py-2.5 text-right font-mono tabular-nums text-sm font-black ${
                        breakdown.remainingDues > 0
                          ? 'text-rose-800'
                          : 'text-emerald-800'
                      }`}
                    >
                      {formatINR(breakdown.remainingDues)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. Amount in Words & Remarks */}
            <div className="border border-[#7a1426]/65 px-4 py-2.5 text-xs bg-[#7a1426]/[0.03] space-y-1">
              <p className="text-slate-800">
                <strong className="text-[#7a1426]">Amount Received (in Words): </strong>
                <span className="font-semibold">
                  {numberToIndianWords(breakdown.currentPayment)}
                </span>
              </p>
              {remarks && (
                <p className="text-slate-700">
                  <strong className="text-[#7a1426]">Remarks: </strong>
                  <span>{remarks}</span>
                </p>
              )}
            </div>

            {/* 6. Signature & Non-Refundable Footer */}
            <footer className="pt-8 sm:pt-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 border-t border-[#7a1426]/40">
              <div className="space-y-1">
                <p className="text-xs font-extrabold text-[#7a1426] tracking-wide">
                  Shiksha Niketan &bull; Non-refundable
                </p>
                <p className="text-[11px] text-slate-600">
                  Digitally linked with Student Fee Ledger · Collected by{' '}
                  {collectedBy || instituteConfig.founder}
                </p>
              </div>

              <div className="text-center self-end min-w-[190px]">
                <div className="border-t border-[#7a1426] pt-1.5">
                  <p className="text-xs font-extrabold text-[#7a1426]">
                    Authorized Signature
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {instituteConfig.founder} (Director)
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};
