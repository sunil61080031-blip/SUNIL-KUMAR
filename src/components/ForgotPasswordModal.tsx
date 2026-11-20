import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  Clock,
  Copy,
  KeyRound,
  Mail,
  MessageCircle,
  Phone,
  X
} from 'lucide-react';
import { InstituteConfig } from '../types';

export type RecoveryRoleType = 'admin' | 'teacher' | 'student';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  role: RecoveryRoleType;
  instituteConfig: InstituteConfig;
  onClose: () => void;
}

const ROLE_RECOVERY_COPY: Record<
  RecoveryRoleType,
  { heading: string; guidance: string; subject: string }
> = {
  admin: {
    heading: 'Administrator Credential Recovery',
    guidance:
      'Contact the institute director or technical support desk using the verified phone or email below to reset administrator login credentials.',
    subject: 'Administrator Password Recovery Request - Shiksha Niketan'
  },
  teacher: {
    heading: 'Teacher Credential Recovery',
    guidance:
      'Reach out to the institute office with your Staff Code (e.g. STF-001) and registered mobile number to verify your identity and reset your Teacher PIN.',
    subject: 'Teacher Login Credential Recovery - Shiksha Niketan'
  },
  student: {
    heading: 'Student Credential Recovery',
    guidance:
      'Contact the institute helpdesk with your Student Enrollment ID and registered parent mobile number to recover or reset your Student Portal password.',
    subject: 'Student Portal Password Recovery - Shiksha Niketan'
  }
};

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  role,
  instituteConfig,
  onClose
}) => {
  const [copiedField, setCopiedField] = useState<'phone' | 'email' | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const copyToClipboard = async (value: string, field: 'phone' | 'email') => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      }
      setCopiedField(field);
      window.setTimeout(() => {
        setCopiedField((prev) => (prev === field ? null : prev));
      }, 2000);
    } catch {
      // Ignore clipboard failures in restricted contexts
    }
  };

  const copy = ROLE_RECOVERY_COPY[role];
  const phoneDisplay = instituteConfig.phoneDisplay || '+91 9650952919';
  const rawPhoneDigits = (instituteConfig.phone || phoneDisplay).replace(/\D/g, '');
  const telHref = `tel:${rawPhoneDigits.startsWith('91') ? `+${rawPhoneDigits}` : `+91${rawPhoneDigits.slice(-10)}`}`;
  const waHref = `https://wa.me/${rawPhoneDigits.startsWith('91') ? rawPhoneDigits : `91${rawPhoneDigits.slice(-10)}`}?text=${encodeURIComponent(
    `Namaste ${instituteConfig.founder || 'Shiksha Niketan Support'}, I need help recovering my ${role} login credentials for Shiksha Niketan Tuition Centre.`
  )}`;
  const emailAddress = instituteConfig.email || 'sntc.csdms@gmail.com';
  const mailtoHref = `mailto:${emailAddress}?subject=${encodeURIComponent(copy.subject)}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-password-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    id="forgot-password-title"
                    className="font-display text-lg font-extrabold text-slate-900 leading-snug"
                  >
                    {copy.heading}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Shiksha Niketan Tuition Centre · Support Desk
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close credential recovery dialog"
                className="min-w-[40px] min-h-[40px] -mr-2 -mt-1 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                {copy.guidance}
              </p>

              {/* Support Phone Row */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Phone className="w-4 h-4 text-sky-700 shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[11px] font-semibold text-slate-500">
                        Support Phone Number
                      </span>
                      <a
                        href={telHref}
                        className="text-sm font-bold font-mono tabular-nums text-slate-900 hover:text-sky-700 transition-colors"
                      >
                        {phoneDisplay}
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(phoneDisplay, 'phone')}
                    className="min-h-[38px] px-3 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedField === 'phone' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={telHref}
                    className="min-h-[40px] px-3 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Support</span>
                  </a>
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[40px] px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Desk</span>
                  </a>
                </div>
              </div>

              {/* Support Email Row */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Mail className="w-4 h-4 text-sky-700 shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[11px] font-semibold text-slate-500">
                        Official Support Email
                      </span>
                      <a
                        href={mailtoHref}
                        className="block text-sm font-bold text-slate-900 hover:text-sky-700 truncate transition-colors"
                      >
                        {emailAddress}
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(emailAddress, 'email')}
                    className="min-h-[38px] px-3 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedField === 'email' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <a
                  href={mailtoHref}
                  className="w-full min-h-[40px] px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-sky-700" />
                  <span>Send Recovery Email</span>
                </a>
              </div>

              {/* Office Info Metadata */}
              <div className="pt-1 flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700">
                    Office In-Charge: {instituteConfig.founder || 'Sunil Kumar'}
                  </span>
                  <span aria-hidden="true"> · </span>
                  <span>{instituteConfig.address}</span>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="px-6 pb-6 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
