import React, { useState } from 'react';
import { InstituteConfig } from '../types';
import { Menu, X, Lock, ShieldCheck, GraduationCap, Phone, Settings } from 'lucide-react';

export type MainSectionType =
  | 'home'
  | 'student-dashboard'
  | 'student-portal'
  | 'batches'
  | 'fee-calculator'
  | 'enrollment'
  | 'notice-board'
  | 'all';

interface NavbarProps {
  instituteConfig: InstituteConfig;
  isAdmin: boolean;
  onOpenAdmin: (
    tab?: 'branding' | 'students' | 'staff' | 'batches' | 'notices' | 'security'
  ) => void;
  onLogoutAdmin: () => void;
  noticeCount: number;
  enrolledStudentCount: number;
  activeMainSection?: MainSectionType;
  onSelectMainSection?: (section: MainSectionType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  instituteConfig,
  isAdmin,
  onOpenAdmin,
  onLogoutAdmin,
  noticeCount,
  enrolledStudentCount,
  activeMainSection = 'home',
  onSelectMainSection
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (e: React.MouseEvent, section: MainSectionType) => {
    if (onSelectMainSection) {
      e.preventDefault();
      onSelectMainSection(section);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs no-print">
      {/* Admin Mode Ribbon if logged in */}
      {isAdmin && (
        <div className="bg-emerald-900 text-white text-xs py-1.5 px-4 border-b border-emerald-700">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-200">Admin Mode Active:</span>
              <span>
                {instituteConfig.founder} ({instituteConfig.role})
              </span>
              <span className="hidden md:inline text-emerald-300">
                · Enrolled: {enrolledStudentCount}/{instituteConfig.maxStudentCapacity}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenAdmin('branding')}
                className="text-amber-300 hover:text-white font-bold underline flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Edit Institute / Centres</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAdmin('students')}
                className="text-emerald-200 hover:text-white font-bold underline cursor-pointer"
              >
                Manage / Clear Students
              </button>
              <button
                type="button"
                onClick={() => onOpenAdmin('security')}
                className="text-sky-200 hover:text-white font-bold underline cursor-pointer"
              >
                Security (Password / OTP)
              </button>
              <button
                type="button"
                onClick={onLogoutAdmin}
                className="text-rose-300 hover:text-rose-100 font-semibold text-[11px] cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Strict 3-zone Header Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Single text wordmark */}
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, 'home')}
            className="flex items-center gap-3 shrink-0 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-emerald-100" />
            </div>
            <div className="whitespace-nowrap">
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                {instituteConfig.name}
              </span>
              <p className="text-[11px] font-bold text-emerald-700 font-hindi -mt-0.5">
                {instituteConfig.hindiName}
              </p>
            </div>
          </a>

          {/* Zone 2: Concise single-line nav links */}
          <nav className="hidden lg:flex items-center gap-4 text-xs font-bold text-slate-600">
            <a
              href="#home"
              onClick={(e) => handleNavClick(e, 'home')}
              className={`transition-colors whitespace-nowrap shrink-0 ${
                activeMainSection === 'home'
                  ? 'text-emerald-700 underline underline-offset-4'
                  : 'hover:text-emerald-700'
              }`}
            >
              Overview
            </a>
            <a
              href="#student-dashboard"
              onClick={(e) => handleNavClick(e, 'student-dashboard')}
              className={`transition-colors whitespace-nowrap shrink-0 ${
                activeMainSection === 'student-dashboard'
                  ? 'text-emerald-700 underline underline-offset-4'
                  : 'hover:text-emerald-700'
              }`}
            >
              Student Dashboard
            </a>
            <a
              href="#student-portal"
              onClick={(e) => handleNavClick(e, 'student-portal')}
              className={`transition-colors whitespace-nowrap shrink-0 ${
                activeMainSection === 'student-portal'
                  ? 'text-emerald-700 underline underline-offset-4'
                  : 'hover:text-emerald-700'
              }`}
            >
              Student Portal
            </a>
            <a
              href="#batches"
              onClick={(e) => handleNavClick(e, 'batches')}
              className={`transition-colors whitespace-nowrap shrink-0 ${
                activeMainSection === 'batches'
                  ? 'text-emerald-700 underline underline-offset-4'
                  : 'hover:text-emerald-700'
              }`}
            >
              Batches & Staff
            </a>
            <a
              href="#fee-calculator"
              onClick={(e) => handleNavClick(e, 'fee-calculator')}
              className={`transition-colors whitespace-nowrap shrink-0 ${
                activeMainSection === 'fee-calculator'
                  ? 'text-emerald-700 underline underline-offset-4'
                  : 'hover:text-emerald-700'
              }`}
            >
              Fees & Charity
            </a>
            <a
              href="#notice-board"
              onClick={(e) => handleNavClick(e, 'notice-board')}
              className={`transition-colors whitespace-nowrap shrink-0 ${
                activeMainSection === 'notice-board'
                  ? 'text-emerald-700 underline underline-offset-4'
                  : 'hover:text-emerald-700'
              }`}
            >
              Notices ({noticeCount})
            </a>
          </nav>

          {/* Zone 3: 1 primary action (+ Admin trigger) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenAdmin(isAdmin ? 'branding' : undefined)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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
              onClick={(e) => handleNavClick(e, 'enrollment')}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              Admission ({enrolledStudentCount}/{instituteConfig.maxStudentCapacity})
            </a>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-700 hover:text-slate-900 rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-2 shadow-lg">
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, 'home')}
            className="block py-2 px-3 rounded-md text-xs font-bold text-slate-800 hover:bg-slate-50"
          >
            1. Institute Overview, Study Centres & Reviews
          </a>
          <a
            href="#student-dashboard"
            onClick={(e) => handleNavClick(e, 'student-dashboard')}
            className="block py-2 px-3 rounded-md text-xs font-bold text-emerald-900 bg-emerald-100/80 hover:bg-emerald-200"
          >
            2. Class-Wise Student Dashboard (Primary / Secondary / High Class, Ledger & Promotion)
          </a>
          <a
            href="#student-portal"
            onClick={(e) => handleNavClick(e, 'student-portal')}
            className="block py-2 px-3 rounded-md text-xs font-bold text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100"
          >
            3. Student Login Portal (Fee Balance, Attendance & Timetable)
          </a>
          <a
            href="#batches"
            onClick={(e) => handleNavClick(e, 'batches')}
            className="block py-2 px-3 rounded-md text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            4. Batches (Morning / Evening / Night) & Assigned Staff
          </a>
          <a
            href="#enrollment"
            onClick={(e) => handleNavClick(e, 'enrollment')}
            className="block py-2 px-3 rounded-md text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            5. Student Admission, Re-Enrollment & Register ({enrolledStudentCount}/
            {instituteConfig.maxStudentCapacity})
          </a>
          <a
            href="#fee-calculator"
            onClick={(e) => handleNavClick(e, 'fee-calculator')}
            className="block py-2 px-3 rounded-md text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            6. Class-Wise Fees, Discounts & Charity Calculator
          </a>
          <a
            href="#notice-board"
            onClick={(e) => handleNavClick(e, 'notice-board')}
            className="flex items-center justify-between py-2 px-3 rounded-md text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            <span>7. Official Notice Board</span>
            <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-sm">
              {noticeCount} Notices
            </span>
          </a>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <a
              href={`tel:${instituteConfig.phone}`}
              className="w-full py-2 px-3 bg-slate-100 text-slate-800 rounded-lg text-center text-xs font-bold flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-700" />
              <span>Call Helpline ({instituteConfig.phoneDisplay})</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin('branding');
              }}
              className="w-full py-2 px-3 bg-slate-900 text-white rounded-lg text-center text-xs font-bold shadow-xs"
            >
              Open Admin Control Suite
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
