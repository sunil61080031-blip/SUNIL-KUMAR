import React from 'react';
import { NoticeItem, InstituteConfig } from '../types';
import { Printer, X, CheckCircle, Award } from 'lucide-react';

interface PrintNoticeModalProps {
  notice: NoticeItem | null;
  instituteConfig: InstituteConfig;
  onClose: () => void;
}

export const PrintNoticeModal: React.FC<PrintNoticeModalProps> = ({
  notice,
  instituteConfig,
  onClose
}) => {
  if (!notice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 no-print border border-slate-200">
        {/* Modal Toolbar (hidden during print) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm">Official Notice Slip — Print Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Notice Paper Area */}
        <div id="printable-notice-area" className="p-8 sm:p-10 bg-white text-slate-900 space-y-6">
          {/* Institutional Letterhead */}
          <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1 relative">
            <div className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md mb-1">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>Reg. Coaching Institute (Nursery to Class 12th · {instituteConfig.studyCentres.length} Study Centres)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
              {instituteConfig.name}
            </h1>
            <p className="text-base font-bold text-emerald-800 font-hindi">
              {instituteConfig.hindiName}
            </p>
            <p className="text-xs text-slate-600">
              {instituteConfig.address}
            </p>
            <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-700 pt-1">
              <span>Helpline: {instituteConfig.phoneDisplay}</span>
              <span>·</span>
              <span>Classes: Nursery to 12th (Morning / Evening / Night)</span>
            </div>
          </div>

          {/* Reference and Date Bar */}
          <div className="flex items-center justify-between text-xs font-semibold border-b border-slate-200 pb-3 text-slate-700">
            <div>
              <span className="text-slate-500">Ref. No: </span>
              <span className="font-mono font-bold text-slate-900">{notice.refNo}</span>
            </div>
            <div>
              <span className="text-slate-500">Date of Issue: </span>
              <span className="font-bold text-slate-900">{notice.date}</span>
            </div>
          </div>

          {/* Applicable Scope */}
          <div className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-700">Applicable For: {notice.applicableClasses}</span>
            <span className="font-bold text-emerald-700 uppercase">Category: {notice.category}</span>
          </div>

          {/* Notice Subject & Content */}
          <div className="space-y-4 pt-2">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subject / विषय</span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                {notice.title}
              </h2>
              {notice.hindiTitle && (
                <p className="text-base font-semibold text-emerald-900 font-hindi mt-1">
                  {notice.hindiTitle}
                </p>
              )}
            </div>

            <div className="space-y-3 text-sm leading-relaxed text-slate-800 pt-2 border-t border-slate-100">
              <p className="whitespace-pre-line">{notice.content}</p>
              {notice.hindiContent && (
                <p className="whitespace-pre-line font-hindi text-slate-700 bg-amber-50/50 p-3 rounded-lg border border-amber-100/70">
                  {notice.hindiContent}
                </p>
              )}
            </div>
          </div>

          {/* Verification & Sign-off */}
          <div className="pt-8 mt-6 border-t border-slate-200 flex items-end justify-between">
            <div className="text-xs text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Digitally Verified Circular</span>
              </div>
              <p>Main Office: {instituteConfig.address}</p>
            </div>

            <div className="text-center space-y-1">
              <div className="w-32 border-b border-slate-900 pb-1 mx-auto text-center font-serif italic text-sm font-bold text-slate-800">
                {instituteConfig.founder}
              </div>
              <p className="text-xs font-bold text-slate-900">{instituteConfig.founder}</p>
              <p className="text-[11px] text-slate-600">{instituteConfig.role}</p>
              <p className="text-[10px] text-slate-500">{instituteConfig.name}</p>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between no-print">
          <p className="text-xs text-slate-500">
            Tip: Use print layout 'Portrait' with background graphics enabled.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-md transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
