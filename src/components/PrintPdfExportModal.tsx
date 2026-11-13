import React, { useState, useMemo, useEffect } from 'react';
import {
  StudentRecord,
  FeePlan,
  InstituteConfig
} from '../types';
import {
  PdfExportRequest,
  getWingForClass,
  computeStudentFinancials,
  computeStudentAttendanceSummary,
  buildMonthlyLedgerRows,
  formatMonthYearFromDate
} from '../utils/ledgerHelpers';
import {
  Printer,
  X,
  FileText,
  FileSpreadsheet,
  Award,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  UserCheck,
  ClipboardCheck,
  IndianRupee
} from 'lucide-react';

interface PrintPdfExportModalProps {
  request: PdfExportRequest | null;
  allStudents: StudentRecord[];
  feePlans: FeePlan[];
  instituteConfig: InstituteConfig;
  onClose: () => void;
}

export const PrintPdfExportModal: React.FC<PrintPdfExportModalProps> = ({
  request,
  allStudents,
  feePlans,
  instituteConfig,
  onClose
}) => {
  const [exportType, setExportType] = useState<
    'register' | 'student-ledger' | 'student-report-card'
  >(request?.type || 'register');
  const [registerScope, setRegisterScope] = useState<'requested' | 'all'>('requested');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    request?.type === 'student-ledger' || request?.type === 'student-report-card'
      ? request.studentId
      : allStudents[0]?.id || ''
  );
  const [pageOrientation, setPageOrientation] = useState<'landscape' | 'portrait'>(
    request?.type === 'register' ? 'landscape' : 'portrait'
  );
  const [batchPrintAllCards, setBatchPrintAllCards] = useState<boolean>(false);

  useEffect(() => {
    if (!request) return;
    setExportType(request.type);
    if (request.type === 'register') {
      setRegisterScope('requested');
      setPageOrientation('landscape');
      setBatchPrintAllCards(false);
    } else {
      setSelectedStudentId(request.studentId);
      setPageOrientation('portrait');
      setBatchPrintAllCards(false);
    }
  }, [request]);

  const registerStudents = useMemo(() => {
    if (!request || request.type !== 'register') return allStudents;
    return registerScope === 'requested' ? request.students : allStudents;
  }, [request, registerScope, allStudents]);

  const registerTotals = useMemo(() => {
    return registerStudents.reduce(
      (acc, stu) => {
        const fin = computeStudentFinancials(stu, feePlans);
        acc.count += 1;
        acc.active += stu.enrollmentStatus !== 'Disenrolled' ? 1 : 0;
        acc.disenrolled += stu.enrollmentStatus === 'Disenrolled' ? 1 : 0;
        acc.paid += fin.currentSessionPaid;
        acc.currentPending += fin.currentSessionPending;
        acc.prevPending += fin.prevYearRemainingDue;
        acc.prevCleared += fin.prevYearCleared;
        acc.combinedPending += fin.totalCombinedPending;
        return acc;
      },
      {
        count: 0,
        active: 0,
        disenrolled: 0,
        paid: 0,
        currentPending: 0,
        prevPending: 0,
        prevCleared: 0,
        combinedPending: 0
      }
    );
  }, [registerStudents, feePlans]);

  const activeLedgerStudent = useMemo(() => {
    return (
      allStudents.find((s) => s.id === selectedStudentId) ||
      allStudents[0] ||
      null
    );
  }, [allStudents, selectedStudentId]);

  const ledgerCardsToPrint = useMemo(() => {
    if (batchPrintAllCards) return allStudents;
    return activeLedgerStudent ? [activeLedgerStudent] : [];
  }, [batchPrintAllCards, allStudents, activeLedgerStudent]);

  if (!request) return null;

  const exportedTimestamp = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const scopeTitle =
    request.type === 'register' && registerScope === 'requested' && request.filterTitle
      ? request.filterTitle
      : 'Complete Institute Register (Nursery to Class 12th)';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 print:static print:inset-auto print:bg-white print:p-0 print:overflow-visible">
      {/* Dynamic @page size directive so Save-as-PDF picks Portrait or Landscape cleanly */}
      <style>{`@media print { @page { size: A4 ${pageOrientation}; margin: 9mm; } }`}</style>

      <div
        className={`mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:max-w-none print:rounded-none print:shadow-none print:border-0 ${
          pageOrientation === 'landscape' ? 'max-w-6xl' : 'max-w-4xl'
        }`}
      >
        {/* Modal Action & Configuration Toolbar (Hidden during Print/PDF Export) */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 border-b border-slate-800 space-y-3 no-print">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Printable PDF Export & Record-Keeping Preview
                </h3>
                <p className="text-[11px] text-slate-300">
                  Click &ldquo;Print / Save as PDF&rdquo; and choose <strong>Save as PDF</strong> in your
                  browser print dialog for permanent archive.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close PDF preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Interactive Export Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
            {/* Switch between Register PDF and Individual Student Ledger Card PDF */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setExportType('register');
                  setPageOrientation('landscape');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer ${
                  exportType === 'register'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Full Student Register Table</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExportType('student-ledger');
                  setPageOrientation('portrait');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer ${
                  exportType === 'student-ledger'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Individual Student Ledger Card</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExportType('student-report-card');
                  setPageOrientation('portrait');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer ${
                  exportType === 'student-report-card'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Student Report Card Summary</span>
              </button>
            </div>

            {/* Mode-Specific Options */}
            <div className="flex flex-wrap items-center gap-2">
              {exportType === 'register' ? (
                <>
                  {request.type === 'register' && (
                    <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setRegisterScope('requested')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                          registerScope === 'requested'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Current View ({request.students.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegisterScope('all')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                          registerScope === 'all'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Full Register ({allStudents.length})
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => {
                      setSelectedStudentId(e.target.value);
                      setBatchPrintAllCards(false);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-white"
                  >
                    {allStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.studentIdCode} — {s.studentName} ({s.classLevel})
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer text-[11px] font-bold text-emerald-300">
                    <input
                      type="checkbox"
                      checked={batchPrintAllCards}
                      onChange={(e) => setBatchPrintAllCards(e.target.checked)}
                      className="rounded text-emerald-500"
                    />
                    <span>
                      Print All {allStudents.length}{' '}
                      {exportType === 'student-report-card'
                        ? 'Report Cards'
                        : 'Ledger Cards'}{' '}
                      (1/page)
                    </span>
                  </label>
                </>
              )}

              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPageOrientation('portrait')}
                  className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                    pageOrientation === 'portrait'
                      ? 'bg-slate-600 text-white'
                      : 'text-slate-400'
                  }`}
                >
                  Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setPageOrientation('landscape')}
                  className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                    pageOrientation === 'landscape'
                      ? 'bg-slate-600 text-white'
                      : 'text-slate-400'
                  }`}
                >
                  Landscape
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* PRINTABLE PDF SHEET CONTAINER                                     */}
        {/* ================================================================= */}
        <div
          id="printable-pdf-export-area"
          className="p-5 sm:p-8 bg-white text-slate-900 space-y-6"
        >
          {/* --------------------------------------------------------------- */}
          {/* VIEW A: FULL STUDENT REGISTER TABLE PDF                         */}
          {/* --------------------------------------------------------------- */}
          {exportType === 'register' && (
            <div className="space-y-5">
              {/* Institutional Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 mb-1">
                    <Award className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Official Academic & Fee Record-Keeping Register</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                    {instituteConfig.name}
                  </h1>
                  <p className="text-sm font-bold text-emerald-800 font-hindi">
                    {instituteConfig.hindiName}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {instituteConfig.address} · Helpline: {instituteConfig.phoneDisplay} · Email:{' '}
                    {instituteConfig.email}
                  </p>
                </div>

                <div className="text-left sm:text-right text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200 shrink-0">
                  <p className="font-bold text-slate-900">Report Scope: {scopeTitle}</p>
                  <p className="text-slate-600">Academic Session: 2026–27 (Nursery–12th)</p>
                  <p className="text-slate-500 font-mono mt-0.5">
                    Exported: {exportedTimestamp}
                  </p>
                </div>
              </div>

              {/* Register Financial & Enrollment Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Total Students Listed
                  </span>
                  <span className="text-lg font-black font-mono text-slate-900">
                    {registerTotals.count}
                  </span>
                  <span className="text-[10px] text-slate-600 block">
                    Active: {registerTotals.active} · Disenrolled: {registerTotals.disenrolled}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/70">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                    Session Fees Collected
                  </span>
                  <span className="text-lg font-black font-mono text-emerald-800">
                    ₹{registerTotals.paid.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-emerald-700 block">
                    2026–27 Verified Receipts
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-amber-300 bg-amber-50/70">
                  <span className="text-[10px] font-bold uppercase text-amber-800 block">
                    Current Session Pending
                  </span>
                  <span className="text-lg font-black font-mono text-amber-800">
                    ₹{registerTotals.currentPending.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-amber-700 block">
                    Billed Tuition Balance Due
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-rose-300 bg-rose-50/70">
                  <span className="text-[10px] font-bold uppercase text-rose-800 block">
                    Prev. Year (2025-26) Dues
                  </span>
                  <span className="text-lg font-black font-mono text-rose-800">
                    ₹{registerTotals.prevPending.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-700 font-semibold block">
                    Total Due: ₹{registerTotals.combinedPending.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Full Student Register Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase tracking-wider text-[10px]">
                      <th className="py-2 px-2 border-r border-slate-700 w-7 text-center">#</th>
                      <th className="py-2 px-2.5 border-r border-slate-700">Student ID & Name</th>
                      <th className="py-2 px-2.5 border-r border-slate-700">Guardian & Contact</th>
                      <th className="py-2 px-2.5 border-r border-slate-700">Wing / Class / Batch</th>
                      <th className="py-2 px-2.5 border-r border-slate-700">Lifecycle Dates & Status</th>
                      <th className="py-2 px-2.5 border-r border-slate-700">Fee & Concession</th>
                      <th className="py-2 px-2 border-r border-slate-700 text-right">Paid (₹)</th>
                      <th className="py-2 px-2 border-r border-slate-700 text-right">Curr Due (₹)</th>
                      <th className="py-2 px-2 border-r border-slate-700 text-right">Prev Due (₹)</th>
                      <th className="py-2 px-2.5">Promotion Record</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {registerStudents.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-6 text-center text-slate-500">
                          No student records available to export.
                        </td>
                      </tr>
                    ) : (
                      registerStudents.map((stu, idx) => {
                        const fin = computeStudentFinancials(stu, feePlans);
                        const wing = getWingForClass(stu.classNum);
                        const centreObj = instituteConfig.studyCentres.find(
                          (c) => c.id === stu.centreId
                        );
                        return (
                          <tr
                            key={stu.id}
                            className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                          >
                            <td className="py-2 px-2 border-r border-slate-200 text-center font-mono font-bold text-slate-600">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-2.5 border-r border-slate-200">
                              <span className="font-mono font-bold text-emerald-800 block">
                                {stu.studentIdCode}
                              </span>
                              <span className="font-bold text-slate-900">{stu.studentName}</span>
                              <span className="block text-[10px] text-slate-500">
                                {centreObj?.centreCode || 'MAIN'} · {stu.board}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 border-r border-slate-200">
                              <span className="font-semibold text-slate-800 block">
                                {stu.parentName}
                              </span>
                              <span className="font-mono text-[10px] text-slate-700 block">
                                {stu.phone}
                              </span>
                              <span className="text-[10px] text-slate-500">{stu.village}</span>
                            </td>
                            <td className="py-2 px-2.5 border-r border-slate-200">
                              <span className="text-[9px] font-bold uppercase text-slate-600 block">
                                {wing}
                              </span>
                              <span className="font-bold text-slate-900 block">
                                {stu.classLevel}
                              </span>
                              <span className="font-mono text-[10px] text-slate-600">
                                {stu.batchCode} ({stu.shift})
                              </span>
                            </td>
                            <td className="py-2 px-2.5 border-r border-slate-200 font-mono text-[10px]">
                              <div>Adm: {stu.enrollmentDate}</div>
                              {stu.disenrollmentDate && (
                                <div className="text-rose-700">Dis: {stu.disenrollmentDate}</div>
                              )}
                              {stu.reEnrollmentDate && (
                                <div className="text-blue-700">Re-Enr: {stu.reEnrollmentDate}</div>
                              )}
                              <span
                                className={`inline-block mt-0.5 px-1.5 py-0.2 rounded font-sans font-bold text-[9px] ${
                                  stu.enrollmentStatus === 'Enrolled'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : stu.enrollmentStatus === 'Re-enrolled'
                                    ? 'bg-blue-100 text-blue-900'
                                    : 'bg-rose-100 text-rose-900'
                                }`}
                              >
                                {stu.enrollmentStatus}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 border-r border-slate-200">
                              <span className="font-mono font-bold text-slate-900 block">
                                ₹{stu.netMonthlyFee}/mo
                                {stu.discountPercent > 0 && (
                                  <span className="text-slate-400 line-through ml-1 font-normal">
                                    ₹{stu.baseMonthlyFee}
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-600 block">
                                {stu.discountType}
                              </span>
                            </td>
                            <td className="py-2 px-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-800">
                              ₹{fin.currentSessionPaid.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-2 border-r border-slate-200 text-right font-mono font-bold text-amber-800">
                              ₹{fin.currentSessionPending.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-2 border-r border-slate-200 text-right font-mono font-bold text-rose-800">
                              ₹{fin.prevYearRemainingDue.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-2.5 text-[10px]">
                              {stu.promotedFromClass ? (
                                <>
                                  <span className="font-bold text-slate-800 block">
                                    From: {stu.promotedFromClass}
                                  </span>
                                  <span className="font-mono text-slate-500">
                                    On {stu.lastPromotionDate || '—'}
                                  </span>
                                </>
                              ) : (
                                <span className="text-slate-400">Direct Admission</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-900 font-bold text-xs">
                      <td colSpan={6} className="py-2.5 px-3 text-right uppercase text-slate-800">
                        Grand Total ({registerTotals.count} Students):
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-emerald-900">
                        ₹{registerTotals.paid.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-amber-900">
                        ₹{registerTotals.currentPending.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-rose-900">
                        ₹{registerTotals.prevPending.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-2.5 font-mono text-[11px] text-slate-900">
                        All Dues: ₹{registerTotals.combinedPending.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Official Record-Keeping Sign-off Footer */}
              <div className="pt-6 border-t border-slate-300 flex flex-wrap items-end justify-between gap-4 print-avoid-break">
                <div className="text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Certified Student Register Record — {instituteConfig.name}</span>
                  </div>
                  <p>Study Centres: {instituteConfig.studyCentres.map((c) => c.name).join(' · ')}</p>
                  <p className="font-mono text-[10px]">Generated On: {exportedTimestamp}</p>
                </div>

                <div className="flex items-end gap-10">
                  <div className="text-center">
                    <div className="w-36 border-b border-slate-400 pb-4 mb-1" />
                    <p className="text-[11px] font-bold text-slate-700">Office Accountant / Clerk</p>
                  </div>
                  <div className="text-center">
                    <div className="w-40 border-b border-slate-900 pb-1 mb-1 font-serif italic text-sm font-bold text-slate-800">
                      {instituteConfig.founder}
                    </div>
                    <p className="text-[11px] font-bold text-slate-900">{instituteConfig.founder}</p>
                    <p className="text-[10px] text-slate-600">{instituteConfig.role}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* VIEW B: INDIVIDUAL STUDENT LEDGER CARD(S) PDF                   */}
          {/* --------------------------------------------------------------- */}
          {exportType === 'student-ledger' &&
            ledgerCardsToPrint.map((student, cardIdx) => {
              const fin = computeStudentFinancials(student, feePlans);
              const monthlyRows = buildMonthlyLedgerRows(student, feePlans);
              const wing = getWingForClass(student.classNum);
              const centreObj =
                instituteConfig.studyCentres.find((c) => c.id === student.centreId) ||
                instituteConfig.studyCentres[0];

              return (
                <div
                  key={student.id}
                  className={`space-y-4 ${cardIdx > 0 ? 'print-page-break pt-6 border-t-4 border-dashed border-slate-300 print:border-0 print:pt-0' : ''}`}
                >
                  {/* Institute Letterhead + Document Title */}
                  <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded mb-1">
                        <Award className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Official Student Academic &amp; Fee Ledger Card</span>
                      </div>
                      <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                        {instituteConfig.name}
                      </h1>
                      <p className="text-sm font-bold text-emerald-800 font-hindi">
                        {instituteConfig.hindiName}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {instituteConfig.address} · Helpline: {instituteConfig.phoneDisplay}
                      </p>
                    </div>

                    <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-left sm:text-right shrink-0">
                      <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold block">
                        Enrollment ID
                      </span>
                      <span className="text-base font-black font-mono tracking-tight">
                        {student.studentIdCode}
                      </span>
                      <span className="block text-[10px] text-slate-300 font-mono">
                        Session: {student.academicSession || '2026-27'}
                      </span>
                    </div>
                  </div>

                  {/* Section 1: Student Profile & Lifecycle Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs print-avoid-break">
                    <div className="sm:col-span-2 p-3.5 rounded-xl border border-slate-300 bg-slate-50/70 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Student Academic Profile</span>
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            student.enrollmentStatus === 'Enrolled'
                              ? 'bg-emerald-100 text-emerald-900'
                              : student.enrollmentStatus === 'Re-enrolled'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          Status: {student.enrollmentStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Student Full Name</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {student.studentName}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Father / Guardian</span>
                          <span className="font-semibold text-slate-800">{student.parentName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Wing &amp; Class</span>
                          <span className="font-bold text-emerald-900">
                            {wing} — {student.classLevel}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Batch ID &amp; Shift</span>
                          <span className="font-mono font-bold text-slate-800">
                            {student.batchCode} ({student.shift})
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Mobile &amp; Address</span>
                          <span className="text-slate-800">
                            <strong className="font-mono">{student.phone}</strong> · {student.village}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Study Centre &amp; Board</span>
                          <span className="text-slate-800 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-emerald-700 shrink-0" />
                            <span>
                              {centreObj?.name} ({student.board})
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Lifecycle Dates Box */}
                    <div className="p-3.5 rounded-xl border border-slate-300 bg-white space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 border-b border-slate-200 pb-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Enrollment Lifecycle Dates</span>
                      </span>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Date of Admission:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {student.enrollmentDate}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Disenrollment Date:</span>
                          <span className="font-mono font-bold text-rose-700">
                            {student.disenrollmentDate || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Re-Enrollment Date:</span>
                          <span className="font-mono font-bold text-blue-700">
                            {student.reEnrollmentDate || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-100">
                          <span className="text-slate-600">Promoted From:</span>
                          <span className="font-semibold text-slate-800 text-right max-w-[125px] truncate">
                            {student.promotedFromClass || 'Direct Admission'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Financial Summary KPI Boxes */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 print-avoid-break">
                    <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        Monthly Fee &amp; Discount
                      </span>
                      <span className="text-base font-black font-mono text-slate-900">
                        ₹{student.netMonthlyFee}/mo
                      </span>
                      <span className="text-[10px] text-emerald-800 font-semibold block">
                        {student.discountType}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/70">
                      <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                        Session Paid (2026-27)
                      </span>
                      <span className="text-base font-black font-mono text-emerald-800">
                        ₹{fin.currentSessionPaid.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-600 block">
                        Of ₹{fin.currentSessionBilled} billed
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-amber-300 bg-amber-50/70">
                      <span className="text-[10px] font-bold uppercase text-amber-800 block">
                        Current Session Pending
                      </span>
                      <span className="text-base font-black font-mono text-amber-800">
                        ₹{fin.currentSessionPending.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-600 block">
                        Due till Nov 2026
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-rose-300 bg-rose-50/70">
                      <span className="text-[10px] font-bold uppercase text-rose-800 block">
                        Prev. Year (2025-26) Due
                      </span>
                      <span className="text-base font-black font-mono text-rose-800">
                        ₹{fin.prevYearRemainingDue.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-700 font-semibold block">
                        Combined Due: ₹{fin.totalCombinedPending.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Section 3: Session-Wise Summary Table */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden print-avoid-break">
                    <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 text-[11px] font-bold uppercase text-slate-700">
                      Session-Wise Fee Ledger Summary
                    </div>
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-300 text-slate-600 text-[10px] uppercase">
                          <th className="py-1.5 px-3">Academic Session</th>
                          <th className="py-1.5 px-3">Enrolled Class</th>
                          <th className="py-1.5 px-3 text-right">Billed / Carry-Fwd</th>
                          <th className="py-1.5 px-3 text-right">Paid / Cleared</th>
                          <th className="py-1.5 px-3 text-right">Balance Pending</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        <tr>
                          <td className="py-1.5 px-3 font-sans font-bold text-slate-800">
                            2025–26 (Previous Year)
                          </td>
                          <td className="py-1.5 px-3 font-sans text-slate-600">
                            {student.promotedFromClass || 'Previous Academic Class'}
                          </td>
                          <td className="py-1.5 px-3 text-right">
                            ₹{fin.prevYearTotalAssigned.toLocaleString('en-IN')}
                          </td>
                          <td className="py-1.5 px-3 text-right text-emerald-800 font-bold">
                            ₹{fin.prevYearCleared.toLocaleString('en-IN')}
                          </td>
                          <td className="py-1.5 px-3 text-right text-rose-800 font-bold">
                            ₹{fin.prevYearRemainingDue.toLocaleString('en-IN')}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 font-sans font-bold text-emerald-900">
                            {student.academicSession || '2026-27'} (Current Session)
                          </td>
                          <td className="py-1.5 px-3 font-sans font-semibold text-slate-800">
                            {student.classLevel}
                          </td>
                          <td className="py-1.5 px-3 text-right">
                            ₹{fin.currentSessionBilled.toLocaleString('en-IN')}
                          </td>
                          <td className="py-1.5 px-3 text-right text-emerald-800 font-bold">
                            ₹{fin.currentSessionPaid.toLocaleString('en-IN')}
                          </td>
                          <td className="py-1.5 px-3 text-right text-amber-800 font-bold">
                            ₹{fin.currentSessionPending.toLocaleString('en-IN')}
                          </td>
                        </tr>
                        <tr className="bg-slate-900 text-white font-bold">
                          <td colSpan={2} className="py-1.5 px-3 font-sans uppercase text-[10px]">
                            Combined Grand Total
                          </td>
                          <td className="py-1.5 px-3 text-right">
                            ₹
                            {(
                              fin.prevYearTotalAssigned + fin.currentSessionBilled
                            ).toLocaleString('en-IN')}
                          </td>
                          <td className="py-1.5 px-3 text-right text-emerald-300">
                            ₹
                            {(fin.prevYearCleared + fin.currentSessionPaid).toLocaleString(
                              'en-IN'
                            )}
                          </td>
                          <td className="py-1.5 px-3 text-right text-amber-300">
                            ₹{fin.totalCombinedPending.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Section 4: Monthly-Wise Fee Ledger Table (12 Months) */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 text-[11px] font-bold uppercase text-slate-700 flex justify-between">
                      <span>Monthly-Wise Tuition Fee Ledger ({student.academicSession || '2026-27'})</span>
                      <span className="font-mono text-slate-500">
                        Reg. Fee: ₹{fin.regFee}
                      </span>
                    </div>
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-300 text-slate-600 text-[10px] uppercase">
                          <th className="py-1.5 px-3">Month</th>
                          <th className="py-1.5 px-2 text-right">Prev. Back Due / Adv.</th>
                          <th className="py-1.5 px-2 text-right">Month Fee</th>
                          <th className="py-1.5 px-2 text-right">Paid</th>
                          <th className="py-1.5 px-2 text-right">Fwd Due</th>
                          <th className="py-1.5 px-3">Status</th>
                          <th className="py-1.5 px-3">Receipt, Date &amp; Paid Month</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {monthlyRows.map((row) => {
                          const inactive =
                            row.status === 'Before Admission' ||
                            row.status === 'Disenrolled Break';
                          return (
                            <tr key={row.key}>
                              <td className="py-1.5 px-3 font-bold text-slate-900">{row.label}</td>
                              <td className="py-1.5 px-2 text-right font-mono">
                                {inactive || row.status === 'Waived' ? (
                                  '—'
                                ) : row.backDueCarriedIn > 0 ? (
                                  <span className="text-red-700 font-bold">
                                    +₹{row.backDueCarriedIn} Back Due
                                  </span>
                                ) : row.advanceCreditIn > 0 ? (
                                  <span className="text-sky-800 font-bold">
                                    -₹{row.advanceCreditIn} Adv.
                                  </span>
                                ) : (
                                  '₹0'
                                )}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                                ₹{row.netPayable}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono text-emerald-800 font-bold">
                                {inactive ? '—' : `₹${row.paidAmount}`}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono text-rose-800 font-bold">
                                {inactive ? '—' : `₹${row.backDueCarriedForward}`}
                              </td>
                              <td className="py-1.5 px-3">
                                {row.status === 'Paid' && (
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                      row.isAdvanceAdjusted
                                        ? 'text-sky-900 bg-sky-100'
                                        : 'text-emerald-800 bg-emerald-100'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    {row.isAdvanceAdjusted ? 'Paid (Adv. Adj.)' : 'Paid'}
                                  </span>
                                )}
                                {row.status === 'Partially Paid' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    {row.isAdvanceAdjusted ? 'Partial (Adv.)' : 'Partially Paid'}
                                  </span>
                                )}
                                {row.status === 'Pending' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-800 bg-red-100 px-1.5 py-0.5 rounded">
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    Pending
                                  </span>
                                )}
                                {row.status === 'Waived' && (
                                  <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded">
                                    100% Charity Waived
                                  </span>
                                )}
                                {row.status === 'Before Admission' && (
                                  <span className="text-[10px] text-slate-400">Prior to Admission</span>
                                )}
                                {row.status === 'Disenrolled Break' && (
                                  <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                                    Disenrolled Break
                                  </span>
                                )}
                              </td>
                              <td className="py-1.5 px-3 font-mono text-[10px] text-slate-700">
                                {row.receiptNo}
                                {row.receiptDate !== '—'
                                  ? ` · ${row.receiptDate} (${row.paidInMonthDisplay})`
                                  : ''}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Section 5: Recorded Receipts + Class Promotion History */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print-avoid-break">
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 text-[10px] font-bold uppercase text-slate-700">
                        Verified Payment Collection Log ({student.feePayments?.length || 0})
                      </div>
                      <div className="divide-y divide-slate-200 text-[11px]">
                        {(student.feePayments || []).length === 0 ? (
                          <p className="p-3 text-slate-500 text-center">No fee receipts recorded yet.</p>
                        ) : (
                          (student.feePayments || []).map((p) => (
                            <div key={p.id} className="px-3 py-1.5 flex items-center justify-between gap-2">
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-mono font-bold text-emerald-800">
                                    {p.receiptNo}
                                  </span>
                                  <span className="font-semibold text-slate-800">{p.monthLabel}</span>
                                  {p.isPartialPayment && (
                                    <span className="px-1 py-0.2 rounded bg-amber-100 text-amber-900 text-[9px] font-bold">
                                      Partial
                                    </span>
                                  )}
                                  {p.extraAdvanceAmount && p.extraAdvanceAmount > 0 ? (
                                    <span className="px-1 py-0.2 rounded bg-sky-100 text-sky-900 text-[9px] font-bold">
                                      +₹{p.extraAdvanceAmount} Next Mo. Adv.
                                    </span>
                                  ) : null}
                                </div>
                                <span className="block text-[10px] text-slate-500">
                                  {p.date} (Paid in {p.paidInMonth || formatMonthYearFromDate(p.date)}) ·{' '}
                                  {p.mode} · {p.session || '2026-27'}
                                  {p.paidByParentName ? ` · By ${p.paidByParentName}` : ''}
                                  {p.remarks ? ` (${p.remarks})` : ''}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-slate-900 shrink-0">
                                ₹{p.amount}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 text-[10px] font-bold uppercase text-slate-700">
                        Class Promotion History ({student.promotionHistory?.length || 0})
                      </div>
                      <div className="divide-y divide-slate-200 text-[11px]">
                        {(student.promotionHistory || []).length === 0 ? (
                          <p className="p-3 text-slate-500 text-center">
                            No class promotion records logged yet.
                          </p>
                        ) : (
                          (student.promotionHistory || []).map((ph) => (
                            <div key={ph.id} className="px-3 py-1.5 flex items-center justify-between gap-2">
                              <div>
                                <span className="font-bold text-slate-900 block">
                                  {ph.fromClass} → {ph.toClass}
                                </span>
                                <span className="text-[10px] text-slate-600 block">
                                  Session {ph.session} · {ph.remarks || 'Promoted'}
                                </span>
                              </div>
                              <div className="text-right font-mono shrink-0 text-[10px]">
                                <span className="block text-slate-500">{ph.date}</span>
                                <span className="font-bold text-rose-700">
                                  Carry Due: ₹{ph.carryForwardDues}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 6: Official Ledger Card Signatures */}
                  <div className="pt-5 border-t border-slate-300 flex flex-wrap items-end justify-between gap-4 print-avoid-break">
                    <div className="text-[10px] text-slate-600 space-y-0.5">
                      <p className="font-bold text-emerald-800">
                        Digitally Verified Ledger Card · Record-Keeping Copy
                      </p>
                      <p>Issued on: {exportedTimestamp}</p>
                      <p>Institute Helpline: {instituteConfig.phoneDisplay}</p>
                    </div>

                    <div className="flex items-end gap-8">
                      <div className="text-center">
                        <div className="w-32 border-b border-slate-400 pb-4 mb-1" />
                        <p className="text-[10px] font-bold text-slate-700">
                          Parent / Student Signature
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-36 border-b border-slate-900 pb-1 mb-1 font-serif italic text-xs font-bold text-slate-800">
                          {instituteConfig.founder}
                        </div>
                        <p className="text-[10px] font-bold text-slate-900">
                          {instituteConfig.founder} ({instituteConfig.role})
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

          {/* --------------------------------------------------------------- */}
          {/* VIEW C: STUDENT REPORT CARD SUMMARY (ATTENDANCE % & DUES CLEARED)*/}
          {/* --------------------------------------------------------------- */}
          {exportType === 'student-report-card' &&
            ledgerCardsToPrint.map((student, cardIdx) => {
              const fin = computeStudentFinancials(student, feePlans);
              const att = computeStudentAttendanceSummary(student);
              const wing = getWingForClass(student.classNum);
              const centreObj =
                instituteConfig.studyCentres.find((c) => c.id === student.centreId) ||
                instituteConfig.studyCentres[0];

              const totalCombinedBilled =
                fin.prevYearTotalAssigned + fin.currentSessionBilled;
              const totalDuesCleared =
                fin.prevYearCleared + fin.currentSessionPaid;
              const duesClearancePercent =
                totalCombinedBilled > 0
                  ? Math.min(
                      100,
                      Math.round((totalDuesCleared / totalCombinedBilled) * 100)
                    )
                  : 100;
              const recentReceipts = (student.feePayments || []).slice(0, 5);

              return (
                <div
                  key={`rc-${student.id}`}
                  className={`space-y-4 ${
                    cardIdx > 0
                      ? 'print-page-break pt-6 border-t-4 border-dashed border-slate-300 print:border-0 print:pt-0'
                      : ''
                  }`}
                >
                  {/* Formal Report Card Letterhead */}
                  <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-950 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300 mb-1">
                        <ClipboardCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Official Student Report Card &amp; Dues Clearance Summary</span>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                        {instituteConfig.name}
                      </h1>
                      <p className="text-sm font-bold text-emerald-800 font-hindi">
                        {instituteConfig.hindiName}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {instituteConfig.address} · Helpline: {instituteConfig.phoneDisplay}
                      </p>
                    </div>

                    <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-left sm:text-right shrink-0">
                      <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold block">
                        Report Card · ID
                      </span>
                      <span className="text-base font-black font-mono tracking-tight">
                        {student.studentIdCode}
                      </span>
                      <span className="block text-[10px] text-slate-300 font-mono">
                        Session: {student.academicSession || '2026-27'}
                      </span>
                    </div>
                  </div>

                  {/* Student Academic Identity Banner */}
                  <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs print-avoid-break">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Student Name
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm block">
                        {student.studentName}
                      </span>
                      <span className="text-[11px] text-slate-600">
                        S/O · D/O {student.parentName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Wing &amp; Class
                      </span>
                      <span className="font-bold text-emerald-900 block">
                        {student.classLevel}
                      </span>
                      <span className="text-[11px] text-slate-600">
                        {wing} ({student.board})
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Batch &amp; Centre
                      </span>
                      <span className="font-mono font-bold text-slate-900 block">
                        {student.batchCode} ({student.shift})
                      </span>
                      <span className="text-[11px] text-slate-600">
                        {centreObj?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Status &amp; Admission
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          student.enrollmentStatus === 'Enrolled'
                            ? 'bg-emerald-100 text-emerald-900'
                            : student.enrollmentStatus === 'Re-enrolled'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {student.enrollmentStatus}
                      </span>
                      <span className="block text-[11px] font-mono text-slate-600 mt-0.5">
                        Adm: {student.enrollmentDate}
                      </span>
                    </div>
                  </div>

                  {/* Primary Highlights: Attendance Percentage & Total Dues Cleared */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print-avoid-break">
                    {/* 1. Attendance Percentage KPI */}
                    <div
                      className={`p-3.5 rounded-xl border-2 space-y-1.5 ${
                        !att.hasRecords
                          ? 'bg-slate-50 border-slate-300'
                          : att.attendancePercentage >= 75
                          ? 'bg-emerald-50/70 border-emerald-400'
                          : 'bg-amber-50/70 border-amber-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          Attendance Percentage
                        </span>
                        <UserCheck className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono text-slate-900">
                          {att.hasRecords ? `${att.attendancePercentage}%` : 'N/A'}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600">
                          ({att.attendedCount}/{att.totalSessions} classes)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            att.attendancePercentage >= 75
                              ? 'bg-emerald-600'
                              : 'bg-amber-500'
                          }`}
                          style={{
                            width: `${att.hasRecords ? att.attendancePercentage : 0}%`
                          }}
                        />
                      </div>
                      <span className="block text-[10px] font-bold text-emerald-900">
                        {att.standingLabel}
                      </span>
                    </div>

                    {/* 2. Total Dues Cleared KPI */}
                    <div className="p-3.5 rounded-xl border-2 border-emerald-500 bg-emerald-50/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                          Total Dues Cleared
                        </span>
                        <IndianRupee className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono text-emerald-900">
                          ₹{totalDuesCleared.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-800">
                          ({duesClearancePercent}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-700"
                          style={{ width: `${duesClearancePercent}%` }}
                        />
                      </div>
                      <span className="block text-[10px] text-emerald-900 font-semibold">
                        2026-27: ₹{fin.currentSessionPaid.toLocaleString('en-IN')} · Prev Yr: ₹
                        {fin.prevYearCleared.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* 3. Balance Pending / Clearance Status */}
                    <div
                      className={`p-3.5 rounded-xl border-2 space-y-1.5 ${
                        fin.totalCombinedPending === 0
                          ? 'bg-sky-50/70 border-sky-400'
                          : 'bg-rose-50/70 border-rose-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                          Balance Pending Due
                        </span>
                        {fin.totalCombinedPending === 0 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-700" />
                        )}
                      </div>
                      <span
                        className={`text-2xl font-black font-mono block ${
                          fin.totalCombinedPending === 0
                            ? 'text-emerald-800'
                            : 'text-rose-800'
                        }`}
                      >
                        ₹{fin.totalCombinedPending.toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[10px] font-bold text-slate-700">
                        {fin.totalCombinedPending === 0
                          ? 'NO DUES PENDING (ALL CLEARED)'
                          : `Session Due: ₹${fin.currentSessionPending.toLocaleString('en-IN')} · Prev Due: ₹${fin.prevYearRemainingDue.toLocaleString('en-IN')}`}
                      </span>
                      {fin.advanceCreditNextMonths > 0 && (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-sky-100 text-sky-900 text-[10px] font-bold">
                          +₹{fin.advanceCreditNextMonths} Next Mo. Advance
                        </span>
                      )}
                    </div>

                    {/* 4. Fee Plan & Concession Summary */}
                    <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                        Fee Plan &amp; Receipts
                      </span>
                      <span className="text-xl font-black font-mono text-slate-900 block">
                        ₹{student.netMonthlyFee}/mo
                      </span>
                      <span className="block text-[10px] font-semibold text-emerald-800">
                        {student.discountType}
                      </span>
                      <span className="block text-[10px] text-slate-600">
                        Receipts Logged: <strong>{student.feePayments?.length || 0}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Detailed Attendance Log + Dues Clearance Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print-avoid-break">
                    {/* Left: Attendance Summary & Recent Sessions */}
                    <div className="border border-slate-300 rounded-xl overflow-hidden flex flex-col">
                      <div className="bg-slate-900 text-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>Attendance Record Summary</span>
                        <span className="font-mono text-emerald-300">
                          {att.hasRecords ? `${att.attendancePercentage}% Present` : '0 Sessions'}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 divide-x divide-slate-200 border-b border-slate-200 bg-slate-50 text-center text-[11px]">
                        <div className="p-2">
                          <span className="block text-[10px] text-slate-500">Present</span>
                          <strong className="font-mono text-emerald-800 text-sm">
                            {att.presentCount}
                          </strong>
                        </div>
                        <div className="p-2">
                          <span className="block text-[10px] text-slate-500">Late</span>
                          <strong className="font-mono text-amber-800 text-sm">
                            {att.lateCount}
                          </strong>
                        </div>
                        <div className="p-2">
                          <span className="block text-[10px] text-slate-500">Absent</span>
                          <strong className="font-mono text-rose-800 text-sm">
                            {att.absentCount}
                          </strong>
                        </div>
                        <div className="p-2">
                          <span className="block text-[10px] text-slate-500">Leave</span>
                          <strong className="font-mono text-blue-800 text-sm">
                            {att.leaveCount}
                          </strong>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-200 text-[11px] flex-1">
                        {att.recentLogs.length === 0 ? (
                          <p className="p-4 text-center text-slate-500">
                            No classroom attendance sessions have been recorded for this student yet.
                          </p>
                        ) : (
                          att.recentLogs.map((rec) => (
                            <div
                              key={rec.id}
                              className="px-3 py-2 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block truncate">
                                  {rec.subjectTopic}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {rec.date} · {rec.shift} · By {rec.markedBy}
                                </span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                  rec.status === 'Present'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : rec.status === 'Late'
                                    ? 'bg-amber-100 text-amber-900'
                                    : rec.status === 'Absent'
                                    ? 'bg-rose-100 text-rose-900'
                                    : 'bg-blue-100 text-blue-900'
                                }`}
                              >
                                {rec.status}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Right: Total Dues Cleared Summary & Recent Payments */}
                    <div className="border border-slate-300 rounded-xl overflow-hidden flex flex-col">
                      <div className="bg-slate-900 text-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>Dues Clearance &amp; Fee Statement</span>
                        <span className="font-mono text-amber-300">
                          Cleared: ₹{totalDuesCleared.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <table className="w-full text-left border-collapse text-[11px]">
                        <tbody className="divide-y divide-slate-200">
                          <tr>
                            <td className="py-1.5 px-3 font-semibold text-slate-700">
                              Previous Year (2025-26) Billed / Cleared
                            </td>
                            <td className="py-1.5 px-3 text-right font-mono">
                              ₹{fin.prevYearTotalAssigned.toLocaleString('en-IN')} /{' '}
                              <strong className="text-emerald-800">
                                ₹{fin.prevYearCleared.toLocaleString('en-IN')}
                              </strong>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 font-semibold text-slate-700">
                              Current Session ({student.academicSession || '2026-27'}) Billed / Paid
                            </td>
                            <td className="py-1.5 px-3 text-right font-mono">
                              ₹{fin.currentSessionBilled.toLocaleString('en-IN')} /{' '}
                              <strong className="text-emerald-800">
                                ₹{fin.currentSessionPaid.toLocaleString('en-IN')}
                              </strong>
                            </td>
                          </tr>
                          <tr className="bg-emerald-50/70">
                            <td className="py-2 px-3 font-extrabold text-emerald-950">
                              Combined Total Dues Cleared ({duesClearancePercent}%)
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-black text-emerald-800">
                              ₹{totalDuesCleared.toLocaleString('en-IN')}
                            </td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="py-2 px-3 font-extrabold text-slate-900">
                              Net Balance Remaining Due
                            </td>
                            <td
                              className={`py-2 px-3 text-right font-mono font-black ${
                                fin.totalCombinedPending === 0
                                  ? 'text-emerald-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              ₹{fin.totalCombinedPending.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="bg-slate-100 px-3 py-1 border-y border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                        Recent Verified Payment Receipts ({recentReceipts.length})
                      </div>
                      <div className="divide-y divide-slate-200 text-[11px] flex-1">
                        {recentReceipts.length === 0 ? (
                          <p className="p-3 text-center text-slate-500">
                            No payment receipts logged yet.
                          </p>
                        ) : (
                          recentReceipts.map((p) => (
                            <div
                              key={p.id}
                              className="px-3 py-1.5 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <span className="font-mono font-bold text-emerald-800">
                                  {p.receiptNo}
                                </span>{' '}
                                <span className="font-semibold text-slate-800">
                                  · {p.monthLabel}
                                </span>
                                <span className="block text-[10px] text-slate-500">
                                  {p.date} (Paid in {p.paidInMonth || formatMonthYearFromDate(p.date)}) · {p.mode}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-slate-900 shrink-0">
                                ₹{p.amount}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Remarks, Promotion Summary & Official Signatures */}
                  <div className="p-3 rounded-xl border border-slate-300 bg-slate-50 text-[11px] text-slate-700 flex flex-wrap items-center justify-between gap-2 print-avoid-break">
                    <div>
                      <strong>Academic &amp; Promotion Status:</strong>{' '}
                      {student.promotedFromClass
                        ? `Promoted from ${student.promotedFromClass} on ${
                            student.lastPromotionDate || '—'
                          } to ${student.classLevel}.`
                        : `Enrolled directly in ${student.classLevel} (${student.academicSession || '2026-27'}).`}
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">
                      Generated: {exportedTimestamp}
                    </span>
                  </div>

                  <div className="pt-5 border-t border-slate-300 flex flex-wrap items-end justify-between gap-4 print-avoid-break">
                    <div className="text-[10px] text-slate-600 space-y-0.5">
                      <p className="font-bold text-emerald-800">
                        Certified Student Report Card Summary · {instituteConfig.name}
                      </p>
                      <p>Study Centre: {centreObj?.name} · Helpline: {instituteConfig.phoneDisplay}</p>
                    </div>

                    <div className="flex items-end gap-8">
                      <div className="text-center">
                        <div className="w-32 border-b border-slate-400 pb-4 mb-1" />
                        <p className="text-[10px] font-bold text-slate-700">
                          Parent / Guardian Signature
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-36 border-b border-slate-900 pb-1 mb-1 font-serif italic text-xs font-bold text-slate-800">
                          {instituteConfig.founder}
                        </div>
                        <p className="text-[10px] font-bold text-slate-900">
                          {instituteConfig.founder} ({instituteConfig.role})
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Modal Bottom Controls (Hidden during Print) */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
          <p className="text-xs text-slate-600">
            <strong>PDF Tip:</strong> Enable <strong>Background graphics</strong> in your browser
            print settings so status badges and summary boxes render crisply.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
