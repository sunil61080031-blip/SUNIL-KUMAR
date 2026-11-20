import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import {
  InstituteConfig,
  SecurityConfig,
  SecurityLogItem,
  StaffMember,
  StudentRecord
} from '../types';
import {
  DEFAULT_ADMIN_PASSWORD,
  generateSixDigitOtp,
  maskEmail,
  maskPhone,
  verifySecret
} from '../utils/securityHelpers';
import { EducationalDoodleBackdrop } from './EducationalDoodleBackdrop';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export type LoginRoleType = 'admin' | 'teacher' | 'student';

export const APP_VERSION = 'v2.4.0';
export const DEFAULT_TEACHER_PASSWORD = 'teacher2026';

const ROLE_ASSETS: Record<
  LoginRoleType,
  {
    title: string;
    shortTitle: string;
    subtitle: string;
    imageSrc: string;
    imageAlt: string;
    imageScaleClass: string;
    ringFrom: string;
    ringVia: string;
    ringTo: string;
  }
> = {
  admin: {
    title: 'ADMINISTRATOR LOGIN',
    shortTitle: 'Administrator Portal',
    subtitle: 'Manage institute settings, students, fees, staff & cloud backups',
    imageSrc: '/src/assets/images/login_admin_3d_1795065339103.jpg',
    imageAlt:
      '3D cartoon illustration of an administrator sitting with a laptop and student profile cards',
    imageScaleClass: 'scale-[1.15]',
    ringFrom: '#60c8ff',
    ringVia: '#1570ef',
    ringTo: '#0c40a6'
  },
  teacher: {
    title: 'TEACHER LOGIN',
    shortTitle: 'Teacher Portal',
    subtitle: 'Mark batch attendance, track student progress & post notices',
    imageSrc: '/src/assets/images/login_teacher_3d_1795065339495.jpg',
    imageAlt:
      '3D cartoon illustration of a teacher smiling while holding a notebook and pen',
    imageScaleClass: 'scale-[1.12]',
    ringFrom: '#5eead4',
    ringVia: '#0b86d6',
    ringTo: '#0f4aa8'
  },
  student: {
    title: 'STUDENT LOGIN',
    shortTitle: 'Student Portal',
    subtitle: 'View fee ledger, attendance record, timetable & report card',
    imageSrc: '/src/assets/images/login_student_3d_1795065339612.jpg',
    imageAlt:
      '3D cartoon illustration of a cheerful student learning on a laptop with books',
    imageScaleClass: 'scale-[1.10]',
    ringFrom: '#7dd3fc',
    ringVia: '#0ea5e9',
    ringTo: '#164ea8'
  }
};

interface LoginSelectionScreenProps {
  instituteConfig: InstituteConfig;
  securityConfig: SecurityConfig;
  staffList: StaffMember[];
  students: StudentRecord[];
  onVerifyAdminPassword: (candidate: string) => Promise<boolean>;
  onAdminAuthenticated: (method: 'Password' | 'OTP' | '2FA') => void;
  onTeacherAuthenticated: (staff: StaffMember, method: 'Password' | 'OTP') => void;
  onStudentAuthenticated: (
    student: StudentRecord,
    method: 'Password' | 'PIN' | 'OTP'
  ) => void;
  onSecurityLog: (
    actor: string,
    event: string,
    method: SecurityLogItem['method'],
    status: SecurityLogItem['status']
  ) => void;
}

const RoleIllustrationAvatar: React.FC<{
  role: LoginRoleType;
  sizeClass: string;
}> = ({ role, sizeClass }) => {
  const [imgError, setImgError] = useState(false);
  const meta = ROLE_ASSETS[role];

  return (
    <div
      className={`relative rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-sky-400 via-blue-600 to-cyan-600 ${sizeClass}`}
    >
      {!imgError ? (
        <img
          src={meta.imageSrc}
          alt={meta.imageAlt}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover ${meta.imageScaleClass} select-none pointer-events-none`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white">
          {role === 'admin' && <ShieldCheck className="w-12 h-12" />}
          {role === 'teacher' && <BookOpen className="w-12 h-12" />}
          {role === 'student' && <GraduationCap className="w-12 h-12" />}
        </div>
      )}
    </div>
  );
};

export const LoginSelectionScreen: React.FC<LoginSelectionScreenProps> = ({
  instituteConfig,
  securityConfig,
  staffList,
  students,
  onVerifyAdminPassword,
  onAdminAuthenticated,
  onTeacherAuthenticated,
  onStudentAuthenticated,
  onSecurityLog
}) => {
  const [selectedRole, setSelectedRole] = useState<LoginRoleType | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Shared auth state (reset whenever switching roles)
  const [authTab, setAuthTab] = useState<'password' | 'otp'>('password');
  const [identifierInput, setIdentifierInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rate-limit lockout
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // OTP state
  const [otpChannel, setOtpChannel] = useState<'mobile' | 'email'>('mobile');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [admin2FaStep, setAdmin2FaStep] = useState<'password' | 'otp'>('password');
  const [otpTargetLabel, setOtpTargetLabel] = useState('');
  const [otpTargetEntityId, setOtpTargetEntityId] = useState<string | null>(null);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setLockoutSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lockoutSeconds]);

  useEffect(() => {
    if (otpExpiresIn <= 0 && otpCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setOtpExpiresIn((prev) => {
        if (prev <= 1) {
          setGeneratedOtp(null);
          return 0;
        }
        return prev - 1;
      });
      setOtpCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpExpiresIn, otpCooldown]);

  const resetFormState = (nextRole: LoginRoleType | null) => {
    setSelectedRole(nextRole);
    setAuthError('');
    setAuthSuccess('');
    setIdentifierInput('');
    setPasswordInput('');
    setShowPassword(false);
    setGeneratedOtp(null);
    setOtpInput('');
    setOtpExpiresIn(0);
    setOtpCooldown(0);
    setOtpTargetLabel('');
    setOtpTargetEntityId(null);
    setAdmin2FaStep('password');
    setFailedAttempts(0);
    setLockoutSeconds(0);

    if (nextRole === 'admin') {
      setAuthTab(securityConfig.adminAuthMode === 'otp' ? 'otp' : 'password');
    } else if (nextRole === 'student') {
      setAuthTab(
        !securityConfig.allowStudentPasswordLogin && securityConfig.allowStudentOtpLogin
          ? 'otp'
          : 'password'
      );
    } else {
      setAuthTab('password');
    }
  };

  const registerFailure = (msg: string) => {
    const nextCount = failedAttempts + 1;
    setFailedAttempts(nextCount);
    if (nextCount >= 5) {
      setLockoutSeconds(30);
      setFailedAttempts(0);
      setAuthError('Too many failed login attempts. Please wait 30 seconds before retrying.');
    } else {
      setAuthError(msg);
    }
  };

  const findStaffByIdentifier = (raw: string): StaffMember | undefined => {
    const normalized = raw.trim().toLowerCase();
    const digits = raw.replace(/\D/g, '');
    return staffList.find((s) => {
      const phoneDigits = s.phone.replace(/\D/g, '');
      return (
        s.staffCode.toLowerCase() === normalized ||
        s.name.toLowerCase() === normalized ||
        (digits.length >= 10 && phoneDigits.endsWith(digits.slice(-10)))
      );
    });
  };

  const findStudentByIdentifier = (raw: string): StudentRecord | undefined => {
    const normalized = raw.trim().toLowerCase();
    const digits = raw.replace(/\D/g, '');
    return students.find((s) => {
      const phoneDigits = s.phone.replace(/\D/g, '');
      return (
        s.studentIdCode.toLowerCase() === normalized ||
        (digits.length >= 10 && phoneDigits.endsWith(digits.slice(-10)))
      );
    });
  };

  const handleRequestOtp = () => {
    setAuthError('');
    setAuthSuccess('');
    if (lockoutSeconds > 0 || otpCooldown > 0) return;

    if (selectedRole === 'admin') {
      const code = generateSixDigitOtp();
      setGeneratedOtp(code);
      setOtpExpiresIn(120);
      setOtpCooldown(20);
      const target =
        otpChannel === 'mobile'
          ? maskPhone(securityConfig.adminOtpPhone)
          : maskEmail(securityConfig.adminOtpEmail);
      setOtpTargetLabel(target);
      setOtpTargetEntityId('admin');
      onSecurityLog(
        'Administrator',
        `Requested login OTP via ${otpChannel === 'mobile' ? 'Mobile' : 'Email'}`,
        'OTP',
        'Success'
      );
      return;
    }

    if (selectedRole === 'teacher') {
      if (!identifierInput.trim()) {
        setAuthError('Enter your Staff Code (e.g. STF-001) or registered mobile number first.');
        return;
      }
      const staff = findStaffByIdentifier(identifierInput);
      if (!staff) {
        setAuthError('No faculty account found for that Staff Code or mobile number.');
        return;
      }
      const code = generateSixDigitOtp();
      setGeneratedOtp(code);
      setOtpExpiresIn(120);
      setOtpCooldown(20);
      setOtpTargetLabel(`${staff.name} (${maskPhone(staff.phone)})`);
      setOtpTargetEntityId(staff.id);
      onSecurityLog(
        `${staff.name} (${staff.staffCode})`,
        'Requested teacher portal login OTP',
        'OTP',
        'Success'
      );
      return;
    }

    if (selectedRole === 'student') {
      if (!identifierInput.trim()) {
        setAuthError('Enter your Student ID (e.g. STU-2026-001) or registered parent mobile first.');
        return;
      }
      const student = findStudentByIdentifier(identifierInput);
      if (!student) {
        setAuthError('No student record matched that Student ID or mobile number.');
        return;
      }
      const code = generateSixDigitOtp();
      setGeneratedOtp(code);
      setOtpExpiresIn(120);
      setOtpCooldown(20);
      setOtpTargetLabel(`${student.studentName} (${maskPhone(student.phone)})`);
      setOtpTargetEntityId(student.id);
      onSecurityLog(
        `${student.studentName} (${student.studentIdCode})`,
        'Requested student portal login OTP',
        'OTP',
        'Success'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || lockoutSeconds > 0 || isSubmitting) return;
    setAuthError('');
    setAuthSuccess('');
    setIsSubmitting(true);

    try {
      // 1. ADMINISTRATOR AUTH
      if (selectedRole === 'admin') {
        const is2Fa = securityConfig.adminAuthMode === 'both';

        if ((!is2Fa && authTab === 'password') || (is2Fa && admin2FaStep === 'password')) {
          if (!passwordInput.trim()) {
            setAuthError('Please enter the administrator password.');
            return;
          }
          const ok = await onVerifyAdminPassword(passwordInput.trim());
          if (!ok) {
            onSecurityLog('Administrator', 'Invalid admin password entered', 'Password', 'Failed');
            registerFailure('Incorrect administrator password. Please check and try again.');
            return;
          }
          if (is2Fa) {
            setAdmin2FaStep('otp');
            setAuthSuccess('Password verified. Complete Step 2 with a 6-digit OTP.');
            const code = generateSixDigitOtp();
            setGeneratedOtp(code);
            setOtpExpiresIn(120);
            setOtpCooldown(20);
            setOtpTargetLabel(maskPhone(securityConfig.adminOtpPhone));
            return;
          }
          onAdminAuthenticated('Password');
          return;
        }

        // OTP verification (standalone or 2FA Step 2)
        if (!generatedOtp || otpExpiresIn <= 0) {
          setAuthError('Please generate a valid 6-digit OTP first.');
          return;
        }
        if (otpInput.trim() !== generatedOtp) {
          onSecurityLog('Administrator', 'Incorrect admin OTP entered', 'OTP', 'Failed');
          registerFailure('The 6-digit OTP does not match. Please verify and try again.');
          return;
        }
        onAdminAuthenticated(is2Fa ? '2FA' : 'OTP');
        return;
      }

      // 2. TEACHER AUTH
      if (selectedRole === 'teacher') {
        if (authTab === 'password') {
          if (!identifierInput.trim() || !passwordInput.trim()) {
            setAuthError('Please enter both your Staff Code / Mobile and Password / PIN.');
            return;
          }
          const staff = findStaffByIdentifier(identifierInput);
          if (!staff) {
            onSecurityLog(identifierInput.trim(), 'Unknown teacher login attempt', 'Password', 'Failed');
            registerFailure('Staff account not found. Check your Staff Code (e.g. STF-001).');
            return;
          }
          const phoneDigits = staff.phone.replace(/\D/g, '');
          const last4 = phoneDigits.slice(-4);
          const candidate = passwordInput.trim();
          const valid = candidate === last4 || candidate === DEFAULT_TEACHER_PASSWORD;
          if (!valid) {
            onSecurityLog(
              `${staff.name} (${staff.staffCode})`,
              'Incorrect teacher PIN / password',
              'Password',
              'Failed'
            );
            registerFailure(
              'Incorrect Teacher PIN. Use the last 4 digits of your registered phone or default staff password.'
            );
            return;
          }
          onSecurityLog(
            `${staff.name} (${staff.staffCode})`,
            'Signed in to Teacher Dashboard',
            'Password',
            'Success'
          );
          onTeacherAuthenticated(staff, 'Password');
          return;
        }

        // Teacher OTP
        const staff =
          staffList.find((s) => s.id === otpTargetEntityId) ||
          findStaffByIdentifier(identifierInput);
        if (!staff || !generatedOtp || otpExpiresIn <= 0) {
          setAuthError('Please request a fresh 6-digit OTP first.');
          return;
        }
        if (otpInput.trim() !== generatedOtp) {
          onSecurityLog(
            `${staff.name} (${staff.staffCode})`,
            'Incorrect teacher OTP',
            'OTP',
            'Failed'
          );
          registerFailure('Invalid 6-digit OTP. Please try again.');
          return;
        }
        onSecurityLog(
          `${staff.name} (${staff.staffCode})`,
          'Signed in to Teacher Dashboard via OTP',
          'OTP',
          'Success'
        );
        onTeacherAuthenticated(staff, 'OTP');
        return;
      }

      // 3. STUDENT AUTH
      if (selectedRole === 'student') {
        if (authTab === 'password') {
          if (!identifierInput.trim() || !passwordInput.trim()) {
            setAuthError('Please enter your Student ID / Mobile and Password / Last-4 PIN.');
            return;
          }
          const student = findStudentByIdentifier(identifierInput);
          if (!student) {
            onSecurityLog(identifierInput.trim(), 'Unknown student login attempt', 'Password', 'Failed');
            registerFailure('Student record not found. Check your Student ID (e.g. STU-2026-001).');
            return;
          }

          const candidate = passwordInput.trim();
          let isVerified = false;
          let method: 'Password' | 'PIN' = 'PIN';

          if (student.hasCustomPassword && student.portalPasswordHash && student.portalPasswordSalt) {
            isVerified = await verifySecret(
              candidate,
              student.portalPasswordSalt,
              student.portalPasswordHash
            );
            method = 'Password';
          } else {
            const last4 = student.phone.replace(/\D/g, '').slice(-4);
            isVerified = candidate === last4;
            method = 'PIN';
          }

          if (!isVerified) {
            onSecurityLog(
              `${student.studentName} (${student.studentIdCode})`,
              'Failed student password/PIN login',
              'Password',
              'Failed'
            );
            registerFailure(
              student.hasCustomPassword
                ? 'Incorrect student portal password.'
                : 'Incorrect PIN. Enter the last 4 digits of the registered parent mobile number.'
            );
            return;
          }

          onSecurityLog(
            `${student.studentName} (${student.studentIdCode})`,
            `Signed in to Student Portal via ${method}`,
            'Password',
            'Success'
          );
          onStudentAuthenticated(student, method);
          return;
        }

        // Student OTP
        const student =
          students.find((s) => s.id === otpTargetEntityId) ||
          findStudentByIdentifier(identifierInput);
        if (!student || !generatedOtp || otpExpiresIn <= 0) {
          setAuthError('Please request a 6-digit OTP first.');
          return;
        }
        if (otpInput.trim() !== generatedOtp) {
          onSecurityLog(
            `${student.studentName} (${student.studentIdCode})`,
            'Failed student OTP verification',
            'OTP',
            'Failed'
          );
          registerFailure('Incorrect 6-digit OTP. Please try again.');
          return;
        }
        onSecurityLog(
          `${student.studentName} (${student.studentIdCode})`,
          'Signed in to Student Portal via OTP',
          'OTP',
          'Success'
        );
        onStudentAuthenticated(student, 'OTP');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOrder: LoginRoleType[] = ['admin', 'teacher', 'student'];

  const adminAllowsPassword =
    securityConfig.adminAuthMode === 'password_or_otp' ||
    securityConfig.adminAuthMode === 'password' ||
    securityConfig.adminAuthMode === 'both';
  const adminAllowsOtp =
    securityConfig.adminAuthMode === 'password_or_otp' ||
    securityConfig.adminAuthMode === 'otp' ||
    securityConfig.adminAuthMode === 'both';

  const canSwitchAuthTab =
    selectedRole === 'admin'
      ? securityConfig.adminAuthMode === 'password_or_otp'
      : selectedRole === 'teacher'
      ? true
      : securityConfig.allowStudentPasswordLogin && securityConfig.allowStudentOtpLogin;

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-between overflow-x-hidden text-white">
      <EducationalDoodleBackdrop />

      {/* Top Institute Brand Title */}
      <header className="relative z-10 w-full pt-8 sm:pt-10 pb-3 px-5 text-center shrink-0">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md mx-auto"
        >
          <h1
            className="font-display font-extrabold text-[1.75rem] sm:text-[2.25rem] tracking-[0.14em] text-white leading-tight uppercase"
            style={{
              textShadow: '0 4px 18px rgba(4, 34, 88, 0.38)'
            }}
          >
            SHIKSHA NIKETAN
          </h1>
          <p className="mt-1 text-[11px] sm:text-xs font-semibold tracking-[0.28em] text-cyan-100/95 uppercase">
            TUITION CENTRE
          </p>
        </motion.div>
      </header>

      {/* Center Interactive Zone: 3 Circular Role Buttons OR Selected Role Login Page */}
      <main className="relative z-10 flex-1 w-full flex flex-col items-center justify-center px-5 py-4">
        <AnimatePresence mode="wait">
          {!selectedRole ? (
            <motion.section
              key="role-selection-hub"
              aria-label="Select login role"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-sm mx-auto flex flex-col items-center justify-center gap-6 sm:gap-7 py-2"
            >
              {roleOrder.map((role, index) => {
                const item = ROLE_ASSETS[role];
                return (
                  <motion.button
                    key={role}
                    type="button"
                    onClick={() => resetFormState(role)}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.28,
                      delay: index * 0.07,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    whileHover={{ scale: 1.045, y: -3 }}
                    whileTap={{ scale: 0.955 }}
                    className="group relative flex flex-col items-center focus:outline-none focus-visible:ring-4 focus-visible:ring-white/80 rounded-3xl p-1.5 cursor-pointer"
                  >
                    {/* Soft ambient radial glow behind each 3D circle */}
                    <span
                      aria-hidden="true"
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[58%] w-40 h-40 sm:w-44 sm:h-44 rounded-full opacity-45 group-hover:opacity-85 transition-opacity duration-200 blur-xl pointer-events-none"
                      style={{
                        background:
                          'radial-gradient(circle, rgba(165,243,252,0.85) 0%, rgba(14,165,233,0.18) 65%, transparent 100%)'
                      }}
                    />

                    {/* 3D Circular Blue Medallion Button */}
                    <div
                      className="relative w-[8.5rem] h-[8.5rem] sm:w-[9.5rem] sm:h-[9.5rem] rounded-full p-[7px] transition-shadow duration-200"
                      style={{
                        background: `linear-gradient(155deg, ${item.ringFrom} 0%, ${item.ringVia} 55%, ${item.ringTo} 100%)`,
                        boxShadow:
                          '0 18px 34px -8px rgba(4, 34, 88, 0.52), 0 6px 14px -4px rgba(14, 165, 233, 0.45), inset 0 2px 5px rgba(255, 255, 255, 0.72), inset 0 -4px 8px rgba(6, 40, 108, 0.48)'
                      }}
                    >
                      {/* Outer subtle crisp light halo ring */}
                      <div className="w-full h-full rounded-full p-[3px] bg-white/85 shadow-inner">
                        <RoleIllustrationAvatar role={role} sizeClass="w-full h-full" />
                      </div>

                      {/* Subtle top specular glass arc for 3D button feel */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-5 top-2 h-6 rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-200"
                        style={{
                          background:
                            'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 100%)'
                        }}
                      />
                    </div>

                    {/* Crisp White Role Label Directly Underneath */}
                    <span
                      className="mt-3 font-display text-[13px] sm:text-sm font-extrabold tracking-[0.12em] text-white group-hover:text-cyan-100 transition-colors whitespace-nowrap"
                      style={{
                        textShadow: '0 2px 10px rgba(4, 34, 88, 0.5)'
                      }}
                    >
                      {item.title}
                    </span>
                  </motion.button>
                );
              })}
            </motion.section>
          ) : (
            <motion.section
              key={`auth-${selectedRole}`}
              aria-label={ROLE_ASSETS[selectedRole].shortTitle}
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md mx-auto"
            >
              <div className="bg-white/95 backdrop-blur-md text-slate-900 rounded-3xl shadow-[0_24px_56px_-12px_rgba(4,34,88,0.45)] border border-white/70 p-6 sm:p-7">
                {/* Top Back Navigation + Role Header */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => resetFormState(null)}
                    className="min-h-[44px] px-3 -ml-2 rounded-xl text-xs font-bold text-sky-800 hover:bg-sky-50 active:scale-[0.97] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>All Logins</span>
                  </button>
                  <span className="text-xs font-semibold text-slate-500">
                    Secure Access
                  </span>
                </div>

                {/* Role 3D Circular Avatar + Heading */}
                <div className="flex flex-col items-center text-center mb-5">
                  <div
                    className="w-24 h-24 rounded-full p-1.5 mb-3"
                    style={{
                      background: `linear-gradient(155deg, ${ROLE_ASSETS[selectedRole].ringFrom} 0%, ${ROLE_ASSETS[selectedRole].ringVia} 58%, ${ROLE_ASSETS[selectedRole].ringTo} 100%)`,
                      boxShadow:
                        '0 12px 24px -6px rgba(12, 64, 166, 0.35), inset 0 2px 4px rgba(255,255,255,0.6)'
                    }}
                  >
                    <div className="w-full h-full rounded-full p-[2px] bg-white">
                      <RoleIllustrationAvatar
                        role={selectedRole}
                        sizeClass="w-full h-full"
                      />
                    </div>
                  </div>
                  <h2 className="font-display text-xl font-extrabold text-slate-900 tracking-tight">
                    {ROLE_ASSETS[selectedRole].shortTitle}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-xs leading-relaxed">
                    {ROLE_ASSETS[selectedRole].subtitle}
                  </p>
                </div>

                {/* Auth Mode Switcher (Password vs 6-Digit OTP) */}
                {canSwitchAuthTab && (
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('password');
                        setAuthError('');
                      }}
                      className={`min-h-[40px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        authTab === 'password'
                          ? 'bg-white text-sky-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>
                        {selectedRole === 'admin' ? 'Password' : 'PIN / Password'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('otp');
                        setAuthError('');
                      }}
                      className={`min-h-[40px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        authTab === 'otp'
                          ? 'bg-white text-sky-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>6-Digit OTP</span>
                    </button>
                  </div>
                )}

                {/* Feedback Banners */}
                {authError && (
                  <div
                    role="alert"
                    className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>{authError}</span>
                  </div>
                )}
                {authSuccess && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                {/* Authentication Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Identifier Field for Teacher & Student */}
                  {selectedRole !== 'admin' && (
                    <div>
                      <label
                        htmlFor="login-identifier"
                        className="block text-xs font-bold text-slate-700 mb-1.5"
                      >
                        {selectedRole === 'teacher'
                          ? 'Staff Code or Registered Mobile'
                          : 'Student ID or Parent Mobile'}
                      </label>
                      <input
                        id="login-identifier"
                        type="text"
                        required
                        autoComplete="username"
                        value={identifierInput}
                        onChange={(e) => setIdentifierInput(e.target.value)}
                        placeholder={
                          selectedRole === 'teacher'
                            ? 'e.g. STF-001 or 9650952919'
                            : 'e.g. STU-2026-001 or parent mobile'
                        }
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  )}

                  {/* Password / PIN Input */}
                  {((selectedRole === 'admin' &&
                    adminAllowsPassword &&
                    ((securityConfig.adminAuthMode !== 'both' && authTab === 'password') ||
                      (securityConfig.adminAuthMode === 'both' &&
                        admin2FaStep === 'password'))) ||
                    (selectedRole !== 'admin' && authTab === 'password')) && (
                    <div>
                      <label
                        htmlFor="login-password"
                        className="block text-xs font-bold text-slate-700 mb-1.5"
                      >
                        {selectedRole === 'admin'
                          ? 'Administrator Password'
                          : selectedRole === 'teacher'
                          ? 'Teacher PIN (Last 4 Digits of Phone) or Password'
                          : 'Student Password or Last 4 Digits of Mobile'}
                      </label>
                      <div className="relative">
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoComplete="current-password"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="Enter secure credential"
                          className="w-full h-11 pl-3.5 pr-11 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* OTP Flow */}
                  {((selectedRole === 'admin' &&
                    adminAllowsOtp &&
                    ((securityConfig.adminAuthMode !== 'both' && authTab === 'otp') ||
                      (securityConfig.adminAuthMode === 'both' && admin2FaStep === 'otp'))) ||
                    (selectedRole !== 'admin' && authTab === 'otp')) && (
                    <div className="space-y-3">
                      {selectedRole === 'admin' && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setOtpChannel('mobile')}
                            className={`h-10 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                              otpChannel === 'mobile'
                                ? 'bg-sky-50 border-sky-500 text-sky-900'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>Mobile SMS</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setOtpChannel('email')}
                            className={`h-10 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                              otpChannel === 'email'
                                ? 'bg-sky-50 border-sky-500 text-sky-900'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Email OTP</span>
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={otpCooldown > 0 || lockoutSeconds > 0}
                        onClick={handleRequestOtp}
                        className="w-full h-11 rounded-xl bg-sky-50 hover:bg-sky-100 disabled:opacity-50 border border-sky-200 text-sky-900 text-xs font-bold transition-colors cursor-pointer"
                      >
                        {otpCooldown > 0
                          ? `Resend OTP in ${otpCooldown}s`
                          : generatedOtp
                          ? 'Regenerate 6-Digit OTP'
                          : 'Send 6-Digit Verification OTP'}
                      </button>

                      {generatedOtp && otpExpiresIn > 0 && (
                        <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-950 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sky-800">
                              OTP sent to {otpTargetLabel}
                            </span>
                            <span className="font-mono tabular-nums font-bold text-sky-900">
                              {otpExpiresIn}s
                            </span>
                          </div>
                          {securityConfig.showDemoLoginHelpers && (
                            <p className="text-[11px] text-sky-900">
                              Instant Preview OTP:{' '}
                              <strong className="font-mono tracking-widest text-sm">
                                {generatedOtp}
                              </strong>
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <label
                          htmlFor="login-otp-input"
                          className="block text-xs font-bold text-slate-700 mb-1.5"
                        >
                          Enter 6-Digit OTP
                        </label>
                        <input
                          id="login-otp-input"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          required
                          value={otpInput}
                          onChange={(e) =>
                            setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                          }
                          placeholder="000000"
                          className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-center font-mono text-lg tracking-[0.35em] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={isSubmitting || lockoutSeconds > 0}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-[#0a6fd4] to-[#0ca9c2] hover:from-[#085db5] hover:to-[#0a93aa] disabled:opacity-50 text-white text-sm font-bold shadow-md shadow-sky-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>
                      {lockoutSeconds > 0
                        ? `Locked (${lockoutSeconds}s)`
                        : isSubmitting
                        ? 'Verifying...'
                        : selectedRole === 'admin'
                        ? securityConfig.adminAuthMode === 'both' &&
                          admin2FaStep === 'password'
                          ? 'Verify Password & Continue'
                          : 'Sign In as Administrator'
                        : selectedRole === 'teacher'
                        ? 'Sign In as Teacher'
                        : 'Sign In as Student'}
                    </span>
                  </button>

                  {/* Forgot Password Link */}
                  <div className="text-center pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="inline-flex items-center justify-center min-h-[36px] px-2 text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline underline-offset-4 transition-colors cursor-pointer"
                    >
                      Forgot Password? Need help signing in
                    </button>
                  </div>
                </form>

                {/* Helpful Quick-Fill Demo Credentials (respects securityConfig.showDemoLoginHelpers) */}
                {securityConfig.showDemoLoginHelpers && (
                  <div className="mt-5 pt-4 border-t border-slate-200 text-[11px] text-slate-600 space-y-2">
                    {selectedRole === 'admin' && (
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          Default Password:{' '}
                          <strong className="font-mono text-slate-900">
                            {DEFAULT_ADMIN_PASSWORD}
                          </strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthTab('password');
                            setPasswordInput(DEFAULT_ADMIN_PASSWORD);
                            setAuthError('');
                          }}
                          className="text-sky-700 hover:text-sky-900 font-bold underline cursor-pointer"
                        >
                          Auto-fill
                        </button>
                      </div>
                    )}

                    {selectedRole === 'teacher' && staffList.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="font-semibold text-slate-700">
                          Quick Faculty Access (PIN = last 4 digits of phone):
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {staffList.slice(0, 3).map((stf) => {
                            const last4 = stf.phone.replace(/\D/g, '').slice(-4);
                            return (
                              <button
                                key={stf.id}
                                type="button"
                                onClick={() => {
                                  setIdentifierInput(stf.staffCode);
                                  setPasswordInput(last4);
                                  setAuthTab('password');
                                  setAuthError('');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-900 text-slate-800 font-medium transition-colors cursor-pointer"
                              >
                                {stf.name.split(' ')[0]} · {stf.staffCode}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {selectedRole === 'student' && students.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="font-semibold text-slate-700">
                          Quick Student Access (PIN = last 4 digits of mobile):
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {students.slice(0, 3).map((stu) => {
                            const last4 = stu.phone.replace(/\D/g, '').slice(-4);
                            return (
                              <button
                                key={stu.id}
                                type="button"
                                onClick={() => {
                                  setIdentifierInput(stu.studentIdCode);
                                  setPasswordInput(last4);
                                  setAuthTab('password');
                                  setAuthError('');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-900 text-slate-800 font-medium transition-colors cursor-pointer"
                              >
                                {stu.studentName.split(' ')[0]} · {stu.studentIdCode}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Clean Footer: Version bottom-left, "Powered by Shiksha Niketan" bottom-centre */}
      <footer className="relative z-10 w-full px-5 pb-5 pt-3 shrink-0">
        <div className="relative max-w-2xl mx-auto flex items-center justify-center min-h-[24px]">
          <span className="absolute left-0 text-[11px] sm:text-xs font-mono tabular-nums text-white/80">
            {APP_VERSION}
          </span>
          <p className="text-xs sm:text-[13px] font-semibold tracking-wide text-white/95 text-center">
            Powered by Shiksha Niketan
          </p>
        </div>
      </footer>

      {/* Credential Recovery Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        role={selectedRole || 'student'}
        instituteConfig={instituteConfig}
        onClose={() => setShowForgotModal(false)}
      />
    </div>
  );
};
