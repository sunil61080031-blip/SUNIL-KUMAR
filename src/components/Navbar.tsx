import React, { useState } from 'react';
import { InstituteConfig } from '../types';
import { Menu, X, Lock, ShieldCheck, GraduationCap, Phone, Settings } from 'lucide-react';

interface NavbarProps {
  instituteConfig: InstituteConfig;
  isAdmin: boolean;
  onOpenAdmin: (tab?: 'branding' | 'students' | 'staff' | 'batches' | 'notices') => void;
  onLogoutAdmin: () => void;
  noticeCount: number;
  enrolledStudentCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  instituteConfig,
  isAdmin,
  onOpenAdmin,
  onLogoutAdmin,
  noticeCount,
  enrolledStudentCount
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs no-print">
      {/* Admin Mode Ribbon if logged in */}
      {isAdmin && (
        <div className="bg-emerald-900 text-white text-xs py-1.5 px-4 border-b border-emerald-700">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-200">Admin Mode Active:</span>
              <span>{instituteConfig.founder} ({instituteConfig.role})</span>
              <span className="hidden md:inline text-emerald-300">
                · Enrolled: {enrolledStudentCount}/{instituteConfig.maxStudentCapacity}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenAdmin('branding')}
                className="text-amber-300 hover:text-white font-bold underline flex items-center gap-1"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Edit Institute / Centres</span>
              </button>
              <button
                onClick={() => onOpenAdmin('students')}
                className="text-emerald-200 hover:text-white font-bold underline"
              >
                Manage Students & Staff
              </button>
              <button
                onClick={onLogoutAdmin}
                className="text-rose-300 hover:text-rose-100 font-semibold text-[11px]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Strict 3-zone Header Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-20">
          {/* Zone 1: Single text wordmark */}
          <a href="#home" className="flex items-center gap-3 shrink-0 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 text-emerald-100" />
            </div>
            <div className="whitespace-nowrap">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                {instituteConfig.name}
              </span>
              <p className="text-[11px] font-bold text-emerald-700 font-hindi -mt-0.5">
                {instituteConfig.hindiName}
              </p>
            </div>
          </a>

          {/* Zone 2: 4-5 concise single-line nav links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#student-portal" className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0">
              Student Portal
            </a>
            <a href="#batches" className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0">
              Batches & Staff
            </a>
            <a href="#fee-calculator" className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0">
              Fees & Charity
            </a>
            <a href="#enrollment" className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0">
              Admission ({enrolledStudentCount}/{instituteConfig.maxStudentCapacity})
            </a>
            <a href="#notice-board" className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0">
              Notices ({noticeCount})
            </a>
          </nav>

          {/* Zone 3: 1 primary action (+ Admin trigger) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onOpenAdmin(isAdmin ? 'branding' : undefined)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                isAdmin
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title={isAdmin ? 'Open Admin Control Suite' : 'Admin Portal Login'}
            >
              {isAdmin ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span className="hidden sm:inline">Admin Control</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-600" />
                  <span className="hidden sm:inline">Admin</span>
                </>
              )}
            </button>

            <a
              href="#enrollment"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              Student Admission
            </a>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-3 shadow-lg">
          <a
            href="#student-portal"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-md text-sm font-bold text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100"
          >
            Student Login Portal (Schedule, Staff & Fee Balance)
          </a>
          <a
            href="#home"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-md text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Home & Study Centres
          </a>
          <a
            href="#notice-board"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between py-2 px-3 rounded-md text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            <span>Notice Board & Circulars</span>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-sm">
              {noticeCount} Notices
            </span>
          </a>
          <a
            href="#batches"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-md text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Batches (Morning / Evening / Night) & Staff
          </a>
          <a
            href="#fee-calculator"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-md text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Class-Wise Fees, Discounts & Charity Option
          </a>
          <a
            href="#enrollment"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-md text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Student Enrollment, Disenrollment & Re-enrollment
          </a>
          <a
            href="#location"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-md text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Study Centres & Contact
          </a>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <a
              href={`tel:${instituteConfig.phone}`}
              className="w-full py-2.5 px-3 bg-slate-100 text-slate-800 rounded-lg text-center text-xs font-bold flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-emerald-700" />
              <span>Call Helpline ({instituteConfig.phoneDisplay})</span>
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin('branding');
              }}
              className="w-full py-2.5 px-3 bg-slate-900 text-white rounded-lg text-center text-xs font-bold shadow-xs"
            >
              Open Admin Control Suite
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
