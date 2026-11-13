import React, { useState, useMemo } from 'react';
import {
  StudentRecord,
  BatchItem,
  StaffMember,
  FeePlan,
  InstituteConfig,
  FeePaymentItem,
  AttendanceRecord,
  AttendanceStatus,
  SecurityConfig,
  SecurityLogItem,
  FeeReminderLogItem,
  FeeReminderSettings
} from '../types';
import {
  GraduationCap,
  LogIn,
  LogOut,
  Clock,
  BookOpen,
  UserCheck,
  Building2,
  Phone,
  MessageCircle,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Printer,
  PlusCircle,
  HeartHandshake,
  Award,
  FileText,
  ShieldCheck,
  KeyRound,
  ClipboardCheck,
  XCircle,
  CalendarCheck2,
  BarChart3,
  Smartphone,
  Eye,
  EyeOff,
  ShieldAlert,
  Lock,
  BellRing,
  CheckCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import {
  PdfExportRequest,
  formatMonthYearFromDate,
  previewSmartPaymentAllocation
} from '../utils/ledgerHelpers';
import {
  evaluatePasswordStrength,
  generateSixDigitOtp,
  maskPhone,
  verifySecret
} from '../utils/securityHelpers';

interface StudentPortalProps {
  students: StudentRecord[];
  batches: BatchItem[];
  staffList: StaffMember[];
  feePlans: FeePlan[];
  instituteConfig: InstituteConfig;
  securityConfig: SecurityConfig;
  feeReminders: FeeReminderLogItem[];
  feeReminderSettings: FeeReminderSettings;
  onAcknowledgeReminder: (reminderId: string) => void;
  onSetStudentPassword: (studentId: string, newPassword: string) => Promise<void>;
  onSecurityLog: (
    actor: string,
    event: string,
    method: SecurityLogItem['method'],
    status: SecurityLogItem['status']
  ) => void;
  onRecordFeePayment: (studentId: string, payment: FeePaymentItem) => void;
  onRecordAttendance: (studentId: string, record: AttendanceRecord) => void;
  onOpenPdfExport?: (req: PdfExportRequest) => void;
}

type PortalViewTab = 'all' | 'timetable' | 'attendance' | 'fees';

export const StudentPortal: React.FC<StudentPortalProps> = ({
  students,
  batches,
  staffList,
  feePlans,
  instituteConfig,
  securityConfig,
  feeReminders,
  feeReminderSettings,
  onAcknowledgeReminder,
  onSetStudentPassword,
  onSecurityLog,
  onRecordFeePayment,
  onRecordAttendance,
  onOpenPdfExport
}) => {
  // Secure Login State (Password / Mobile PIN OR 6-Digit OTP)
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [enrollmentIdInput, setEnrollmentIdInput] = useState('');
  const [securityPinInput, setSecurityPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccessBanner, setLoginSuccessBanner] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // OTP state
  const [otpTargetStudent, setOtpTargetStudent] = useState<StudentRecord | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const [loggedInStudentId, setLoggedInStudentId] = useState<string | null>(
    securityConfig.requireStudentAuth ? null : students[0]?.id || null
  );
  const [verifiedMethod, setVerifiedMethod] = useState<'Password' | 'PIN' | 'OTP' | null>(null);

  // Student Change Password inline form
  const [showPasswordPanel, setShowPasswordPanel] = useState(false);
  const [newStuPass, setNewStuPass] = useState('');
  const [confirmStuPass, setConfirmStuPass] = useState('');
  const [stuPassFeedback, setStuPassFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  const [activeTab, setActiveTab] = useState<PortalViewTab>('fees');

  React.useEffect(() => {
    if (!securityConfig.requireStudentAuth && !loggedInStudentId && students[0]) {
      setLoggedInStudentId(students[0].id);
    }
  }, [securityConfig.requireStudentAuth, loggedInStudentId, students]);

  React.useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const id = window.setInterval(() => {
      setLockoutSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [lockoutSeconds]);

  React.useEffect(() => {
    if (otpExpiresIn <= 0 && otpCooldown <= 0) return;
    const id = window.setInterval(() => {
      setOtpExpiresIn((prev) => {
        if (prev <= 1) {
          setGeneratedOtp(null);
          return 0;
        }
        return prev - 1;
      });
      setOtpCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [otpExpiresIn, otpCooldown]);

  // Attendance Filter & Add Attendance State
  const [attendanceFilter, setAttendanceFilter] = useState<string>('All');
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [attStatus, setAttStatus] = useState<AttendanceStatus>('Present');
  const [attTopic, setAttTopic] = useState('');
  const [attRemarks, setAttRemarks] = useState('');
  const [attendanceSuccessMsg, setAttendanceSuccessMsg] = useState('');

  // Quick Record Payment Modal/Form state inside portal
  const [showPayForm, setShowPayForm] = useState(false);
  const [payMonthLabel, setPayMonthLabel] = useState('November 2026');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<'Cash' | 'UPI / Online'>('UPI / Online');
  const [payRemarks, setPayRemarks] = useState('');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');
  const [showReminderHistory, setShowReminderHistory] = useState(false);

  const activeStudent = useMemo(
    () => students.find((s) => s.id === loggedInStudentId) || null,
    [students, loggedInStudentId]
  );

  const studentReminders = useMemo(
    () =>
      activeStudent
        ? feeReminders.filter((r) => r.studentId === activeStudent.id)
        : [],
    [activeStudent, feeReminders]
  );

  const unreadReminders = useMemo(
    () => studentReminders.filter((r) => r.status !== 'Acknowledged'),
    [studentReminders]
  );

  const acknowledgedReminders = useMemo(
    () => studentReminders.filter((r) => r.status === 'Acknowledged'),
    [studentReminders]
  );

  // Match student's specific batch
  const assignedBatch = useMemo(() => {
    if (!activeStudent) return null;
    return (
      batches.find(
        (b) =>
          b.batchCode === activeStudent.batchCode || b.id === activeStudent.batchId
      ) || batches[0]
    );
  }, [activeStudent, batches]);

  // Match student's study centre
  const assignedCentre = useMemo(() => {
    if (!activeStudent) return instituteConfig.studyCentres[0];
    return (
      instituteConfig.studyCentres.find((c) => c.id === activeStudent.centreId) ||
      instituteConfig.studyCentres[0]
    );
  }, [activeStudent, instituteConfig.studyCentres]);

  // Match assigned staff for this student's batchCode or centre
  const assignedStaffMembers = useMemo(() => {
    if (!activeStudent) return [];
    const matched = staffList.filter(
      (stf) =>
        stf.assignedBatchIds.includes(activeStudent.batchCode) ||
        stf.assignedBatchIds.includes('ALL-BATCHES') ||
        stf.assignedCentreId === activeStudent.centreId
    );
    return matched.length > 0 ? matched : staffList.slice(0, 2);
  }, [activeStudent, staffList]);

  // Build Batch-Specific Day-Wise Timetable (Mon - Sun)
  const batchTimetable = useMemo(() => {
    if (!activeStudent) return [];
    const subjects = assignedBatch?.subjects || [
      'Mathematics',
      'Science (Physics, Chemistry, Biology)',
      'English & Hindi Grammar',
      'Social Studies / Board Objective'
    ];
    const s1 = subjects[0] || 'Mathematics & Numericals';
    const s2 = subjects[1] || 'Science & Concept Building';
    const s3 = subjects[2] || 'English & Language Skills';
    const s4 = subjects[3] || s1;

    const timingStr = assignedBatch?.timing || '06:00 AM – 08:30 AM';
    const leadMentor =
      assignedBatch?.assignedStaffName ||
      assignedStaffMembers[0]?.name ||
      instituteConfig.founder;
    const secondMentor =
      assignedStaffMembers[1]?.name || assignedStaffMembers[0]?.name || 'Vikash Kumar Jha';

    return [
      {
        day: 'Monday',
        hindiDay: 'सोमवार',
        timeSlot: timingStr,
        period1: s1,
        period2: s2,
        faculty: leadMentor,
        activityType: 'Core Theory & NCERT Exercise'
      },
      {
        day: 'Tuesday',
        hindiDay: 'मंगलवार',
        timeSlot: timingStr,
        period1: s1,
        period2: s2,
        faculty: leadMentor,
        activityType: 'Formula Derivation & Board Numericals'
      },
      {
        day: 'Wednesday',
        hindiDay: 'बुधवार',
        timeSlot: timingStr,
        period1: s2,
        period2: s3,
        faculty: secondMentor,
        activityType: 'Concept Lecture & Notebook Checking'
      },
      {
        day: 'Thursday',
        hindiDay: 'गुरुवार',
        timeSlot: timingStr,
        period1: s1,
        period2: s4,
        faculty: leadMentor,
        activityType: 'Chapter-Wise Question Bank Practice'
      },
      {
        day: 'Friday',
        hindiDay: 'शुक्रवार',
        timeSlot: timingStr,
        period1: s3,
        period2: s4,
        faculty: secondMentor,
        activityType: '5-Year Board PYQ Paper Solving'
      },
      {
        day: 'Saturday',
        hindiDay: 'शनिवार',
        timeSlot: timingStr,
        period1: `Doubt Clearing (${s1})`,
        period2: `Objective Rapid Revision (${s2})`,
        faculty: `${leadMentor} & ${secondMentor}`,
        activityType: '1-on-1 Weak Topic Doubt Clinic'
      },
      {
        day: 'Sunday',
        hindiDay: 'रविवार (टेस्ट)',
        timeSlot: '07:00 AM – 09:00 AM',
        period1: 'Weekly OMR Objective Test (50 Marks)',
        period2: 'Subjective Answer Writing & Copy Evaluation',
        faculty: leadMentor,
        activityType: 'Mandatory Weekly Rank Assessment'
      }
    ];
  }, [activeStudent, assignedBatch, assignedStaffMembers, instituteConfig.founder]);

  // Calculate Attendance History Summary & Filtered Records
  const attendanceSummary = useMemo(() => {
    if (!activeStudent) return null;
    const records = activeStudent.attendanceRecords || [];
    const totalSessions = records.length;
    const presentCount = records.filter((r) => r.status === 'Present').length;
    const lateCount = records.filter((r) => r.status === 'Late').length;
    const absentCount = records.filter((r) => r.status === 'Absent').length;
    const leaveCount = records.filter((r) => r.status === 'Authorized Leave').length;

    // Present + Late count as attended sessions
    const attendedCount = presentCount + lateCount;
    const attendancePercentage =
      totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 92;

    const filteredRecords =
      attendanceFilter === 'All'
        ? records
        : records.filter((r) => r.status === attendanceFilter);

    return {
      records,
      filteredRecords,
      totalSessions,
      presentCount,
      lateCount,
      absentCount,
      leaveCount,
      attendedCount,
      attendancePercentage
    };
  }, [activeStudent, attendanceFilter]);

  // Calculate personalized Fee Balance Report
  const feeReport = useMemo(() => {
    if (!activeStudent) return null;

    const matchingPlan =
      feePlans.find((fp) => fp.classNum === activeStudent.classNum) || feePlans[0];
    const registrationFee =
      activeStudent.discountPercent === 100
        ? 0
        : matchingPlan?.registrationFee || 200;

    // Generate monthly schedule from enrollmentDate up to Nov 2026
    const startParts = activeStudent.enrollmentDate.split('-');
    const startYear = Number(startParts[0]) || 2026;
    const startMonth = (Number(startParts[1]) || 7) - 1; // 0-indexed

    const endYear = 2026;
    const endMonth = 10; // November (0-indexed = 10)

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];

    const billedMonths: { label: string; fee: number }[] = [];
    let currY = startYear;
    let currM = startMonth;

    while (currY < endYear || (currY === endYear && currM <= endMonth)) {
      const label = `${monthNames[currM]} ${currY}`;
      billedMonths.push({
        label,
        fee: activeStudent.netMonthlyFee
      });
      currM++;
      if (currM > 11) {
        currM = 0;
        currY++;
      }
      if (billedMonths.length >= 12) break; // safety cap
    }

    const activeMonthsCount =
      activeStudent.enrollmentStatus === 'Disenrolled'
        ? Math.max(1, billedMonths.length - 1)
        : Math.max(1, billedMonths.length);

    const activeBilledMonths = billedMonths.slice(0, activeMonthsCount);
    const totalTuitionBilled = activeBilledMonths.length * activeStudent.netMonthlyFee;
    const totalBilled = totalTuitionBilled + registrationFee;

    const payments = activeStudent.feePayments || [];
    const totalPaid =
      payments.length > 0
        ? payments.reduce((sum, p) => sum + p.amount, 0)
        : activeStudent.paidAmount || 0;

    const balanceDue = Math.max(0, totalBilled - totalPaid);
    const paymentProgressPercent =
      totalBilled === 0
        ? 100
        : Math.min(100, Math.round((totalPaid / totalBilled) * 100));

    const chartData = [
      {
        name: 'Total Tuition',
        amount: totalBilled,
        color: '#334155' // slate-700
      },
      {
        name: 'Paid / Waived',
        amount: totalPaid,
        color: '#059669' // emerald-600
      },
      {
        name: 'Pending Due',
        amount: balanceDue,
        color: balanceDue === 0 ? '#10b981' : '#e11d48' // emerald-500 or rose-600
      }
    ];

    return {
      registrationFee,
      activeBilledMonths,
      totalTuitionBilled,
      totalBilled,
      totalPaid,
      balanceDue,
      paymentProgressPercent,
      chartData,
      payments
    };
  }, [activeStudent, feePlans]);

  const findStudentByIdentifier = (identifier: string): StudentRecord | undefined => {
    const q = identifier.trim().toLowerCase();
    const digitsOnly = q.replace(/\D/g, '');
    return students.find(
      (s) =>
        s.studentIdCode.toLowerCase() === q ||
        (digitsOnly.length >= 6 && s.phone.replace(/\D/g, '').endsWith(digitsOnly)) ||
        s.studentName.toLowerCase() === q
    );
  };

  const registerStudentFailedAttempt = (actor: string, message: string) => {
    const next = failedAttempts + 1;
    setFailedAttempts(next);
    if (next >= 5) {
      setLockoutSeconds(30);
      setFailedAttempts(0);
      setLoginError('Too many incorrect attempts. Portal locked for 30 seconds.');
      onSecurityLog(actor, 'Student portal locked (5 failed attempts)', 'System', 'Failed');
    } else {
      setLoginError(`${message} (${5 - next} attempts left)`);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    setLoginError('');
    setLoginSuccessBanner('');

    if (!enrollmentIdInput.trim()) {
      setLoginError('Please enter your Enrollment ID (e.g., STU-2026-001) or registered phone.');
      return;
    }

    const found = findStudentByIdentifier(enrollmentIdInput);
    if (!found) {
      setLoginError(
        'No matching student record found. Check your Enrollment ID (e.g., STU-2026-001) or mobile number.'
      );
      return;
    }

    if (securityConfig.requireStudentAuth) {
      if (!securityPinInput.trim()) {
        setLoginError(
          found.hasCustomPassword
            ? `Enter your custom Student Portal Password for ${found.studentIdCode}.`
            : `Enter your 4-digit Mobile PIN (last 4 digits of registered phone) for ${found.studentIdCode}.`
        );
        return;
      }

      if (found.hasCustomPassword && found.portalPasswordHash && found.portalPasswordSalt) {
        const ok = await verifySecret(
          securityPinInput.trim(),
          found.portalPasswordSalt,
          found.portalPasswordHash
        );
        if (!ok) {
          onSecurityLog(found.studentIdCode, 'Failed student portal password attempt', 'Password', 'Failed');
          registerStudentFailedAttempt(found.studentIdCode, 'Incorrect Student Portal password.');
          return;
        }
        setVerifiedMethod('Password');
        onSecurityLog(found.studentIdCode, 'Student logged in via custom Password', 'Password', 'Success');
      } else {
        const pinDigits = securityPinInput.trim().replace(/\D/g, '');
        const studentPhoneDigits = found.phone.replace(/\D/g, '');
        if (!pinDigits || !studentPhoneDigits.endsWith(pinDigits)) {
          onSecurityLog(found.studentIdCode, 'Failed student mobile PIN attempt', 'Password', 'Failed');
          registerStudentFailedAttempt(
            found.studentIdCode,
            `Invalid Security PIN for ${found.studentIdCode}.`
          );
          return;
        }
        setVerifiedMethod('PIN');
        onSecurityLog(found.studentIdCode, 'Student logged in via Mobile PIN', 'Password', 'Success');
      }
    }

    setFailedAttempts(0);
    setLoggedInStudentId(found.id);
    setEnrollmentIdInput('');
    setSecurityPinInput('');
    setShowPasswordPanel(false);
  };

  const handleSendStudentOtp = () => {
    if (lockoutSeconds > 0 || otpCooldown > 0) return;
    setLoginError('');
    setLoginSuccessBanner('');

    const found = findStudentByIdentifier(enrollmentIdInput);
    if (!found) {
      setLoginError('Enter a valid Enrollment ID or Registered Mobile Number first to receive OTP.');
      return;
    }

    const code = generateSixDigitOtp();
    setOtpTargetStudent(found);
    setGeneratedOtp(code);
    setOtpInput('');
    setOtpExpiresIn(120);
    setOtpCooldown(25);
    setLoginSuccessBanner(
      `6-Digit OTP sent to ${found.studentName}'s registered mobile ${maskPhone(found.phone)} (valid 2 min).`
    );
    onSecurityLog(
      found.studentIdCode,
      `6-Digit OTP sent to ${maskPhone(found.phone)}`,
      'OTP',
      'Success'
    );
  };

  const handleStudentOtpVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    setLoginError('');

    if (!otpTargetStudent || !generatedOtp || otpExpiresIn <= 0) {
      setLoginError('OTP expired or not sent yet. Click "Send 6-Digit OTP" first.');
      return;
    }

    if (otpInput.trim() !== generatedOtp) {
      onSecurityLog(otpTargetStudent.studentIdCode, 'Invalid Student OTP entered', 'OTP', 'Failed');
      registerStudentFailedAttempt(otpTargetStudent.studentIdCode, 'Invalid 6-digit OTP code.');
      return;
    }

    setLoggedInStudentId(otpTargetStudent.id);
    setVerifiedMethod('OTP');
    onSecurityLog(otpTargetStudent.studentIdCode, 'Student unlocked portal via 6-Digit OTP', 'OTP', 'Success');
    setGeneratedOtp(null);
    setOtpInput('');
    setOtpExpiresIn(0);
    setOtpTargetStudent(null);
    setEnrollmentIdInput('');
    setFailedAttempts(0);
    setLoginSuccessBanner('');
    setShowPasswordPanel(false);
  };

  const handleSaveStudentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;
    setStuPassFeedback(null);
    if (newStuPass.trim().length < 6) {
      setStuPassFeedback({ type: 'err', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (newStuPass !== confirmStuPass) {
      setStuPassFeedback({ type: 'err', text: 'Passwords do not match.' });
      return;
    }
    await onSetStudentPassword(activeStudent.id, newStuPass.trim());
    setNewStuPass('');
    setConfirmStuPass('');
    setStuPassFeedback({
      type: 'ok',
      text: 'Custom Portal Password saved! Use it (or 6-Digit OTP) next time you log in.'
    });
  };

  const handleAddAttendanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;

    const defaultTopic =
      assignedBatch?.subjects[0] || 'Daily Classroom Lecture & Practice';

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      date: attDate,
      status: attStatus,
      subjectTopic: attTopic.trim() || defaultTopic,
      shift: activeStudent.shift,
      markedBy:
        assignedBatch?.assignedStaffName ||
        assignedStaffMembers[0]?.name ||
        instituteConfig.founder,
      remarks: attRemarks.trim() || undefined
    };

    onRecordAttendance(activeStudent.id, newRecord);
    setAttendanceSuccessMsg(
      `Attendance logged for ${attDate} as "${attStatus}" in ${activeStudent.batchCode}.`
    );
    setAttTopic('');
    setAttRemarks('');
    setShowAttendanceForm(false);
    setTimeout(() => setAttendanceSuccessMsg(''), 3500);
  };

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent || payAmount <= 0) return;

    const amt = Number(payAmount);
    const todayStr = new Date().toISOString().slice(0, 10);
    const paidInMo = formatMonthYearFromDate(todayStr);
    const preview = previewSmartPaymentAllocation(
      activeStudent,
      feePlans,
      amt,
      todayStr,
      paidInMo,
      false
    );
    const isPartial =
      amt < (activeStudent.netMonthlyFee || 0) ||
      (feeReport ? amt < feeReport.balanceDue : false);

    const newPayment: FeePaymentItem = {
      id: `fp-${Date.now()}`,
      receiptNo: `${isPartial ? 'PART' : 'REC'}-2026-${Math.floor(300 + Math.random() * 600)}`,
      date: todayStr,
      paidInMonth: paidInMo,
      monthLabel: payMonthLabel.trim() || `Paid in ${paidInMo}`,
      session: activeStudent.academicSession || '2026-27',
      isPartialPayment: isPartial,
      prevYearClearedPart: 0,
      sessionPaidPart: amt,
      extraAdvanceAmount: preview.extraAdvanceToNextMonths,
      adjustmentBreakdown: preview.breakdown,
      paidByParentName: activeStudent.parentName,
      remarks:
        payRemarks.trim() ||
        (preview.extraAdvanceToNextMonths > 0
          ? `Paid in ${paidInMo} · ₹${preview.extraAdvanceToNextMonths} extra adjusted to next month(s)`
          : isPartial
          ? 'Partial payment logged via Student Portal'
          : undefined),
      amount: amt,
      mode: payMode
    };

    onRecordFeePayment(activeStudent.id, newPayment);
    setPaymentSuccessMsg(
      `${isPartial ? 'Partial payment' : 'Payment'} of ₹${newPayment.amount} recorded in ${paidInMo} (Receipt: ${newPayment.receiptNo})${
        preview.extraAdvanceToNextMonths > 0
          ? ` — ₹${preview.extraAdvanceToNextMonths} adjusted to next month(s)!`
          : '!'
      }`
    );
    setPayRemarks('');
    setShowPayForm(false);
    setTimeout(() => setPaymentSuccessMsg(''), 4000);
  };

  const whatsAppFeeStatementUrl = useMemo(() => {
    if (!activeStudent || !feeReport || !attendanceSummary) return '#';
    let text = `*${instituteConfig.name} — Student Portal Report*\n`;
    text += `------------------------------------\n`;
    text += `*Student:* ${activeStudent.studentName} (${activeStudent.studentIdCode})\n`;
    text += `*Class & Batch:* ${activeStudent.classLevel} [${activeStudent.batchCode} · ${activeStudent.shift}]\n`;
    text += `*Attendance:* ${attendanceSummary.attendancePercentage}% (${attendanceSummary.attendedCount}/${attendanceSummary.totalSessions} Sessions)\n`;
    text += `*Discount / Charity:* ${activeStudent.discountType}\n`;
    text += `*Net Monthly Fee:* ₹${activeStudent.netMonthlyFee}/month\n`;
    text += `*Total Session Billed:* ₹${feeReport.totalBilled}\n`;
    text += `*Total Paid:* ₹${feeReport.totalPaid}\n`;
    text += `*Net Pending Balance:* ₹${feeReport.balanceDue}\n`;
    text += `------------------------------------\n`;
    text += `Respected ${instituteConfig.founder} Sir, sharing my student portal fee & attendance statement.`;

    const targetPhone = (assignedCentre?.phone || instituteConfig.phone).replace(
      /\D/g,
      ''
    );
    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
  }, [activeStudent, feeReport, attendanceSummary, instituteConfig, assignedCentre]);

  return (
    <section
      id="student-portal"
      className="py-8 bg-slate-100/90 border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        {/* Section Header + Secure Password / OTP Login Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Password & 6-Digit OTP Protected Student Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Secure Student Portal — Fee Balance, Attendance & Timetable
            </h2>
            <p className="text-sm font-semibold text-emerald-800 font-hindi mt-0.5">
              सुरक्षित छात्र पोर्टल — पासवर्ड (Password) या 6-अंकीय ओटीपी (OTP) से लॉग इन कर शुल्क, उपस्थिति एवं समय-सारणी देखें
            </p>
          </div>

          {/* Auth Mode Switcher Pill + Lock Button when logged in */}
          {activeStudent && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPasswordPanel(!showPasswordPanel)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                <span>{activeStudent.hasCustomPassword ? 'Update Password' : 'Set Password'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoggedInStudentId(null);
                  setVerifiedMethod(null);
                  setShowPasswordPanel(false);
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                title="Lock & Logout Student Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Lock Portal</span>
              </button>
            </div>
          )}
        </div>

        {loginError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        {loginSuccessBanner && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{loginSuccessBanner}</span>
          </div>
        )}

        {/* Quick Enrolled Student Account Switcher (Fills ID in Strict Auth Mode, or Switches directly in Demo Mode) */}
        {securityConfig.showDemoLoginHelpers && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  {securityConfig.requireStudentAuth
                    ? 'Quick-Fill Student ID for Login:'
                    : 'Verified Enrollment IDs (Demo Switch):'}
                </span>
              </span>
              {students.map((stu) => {
                const isSelected = activeStudent?.id === stu.id;
                const last4 = stu.phone.replace(/\D/g, '').slice(-4);
                return (
                  <button
                    key={stu.id}
                    type="button"
                    onClick={() => {
                      setLoginError('');
                      if (securityConfig.requireStudentAuth) {
                        setEnrollmentIdInput(stu.studentIdCode);
                        if (!stu.hasCustomPassword && authMode === 'password') {
                          setSecurityPinInput(last4);
                        } else {
                          setSecurityPinInput('');
                        }
                      } else {
                        setLoggedInStudentId(stu.id);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-mono font-bold">{stu.studentIdCode}</span>
                    <span>·</span>
                    <span>{stu.studentName}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        isSelected
                          ? 'bg-emerald-800 text-emerald-100'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {stu.hasCustomPassword ? 'Custom Pwd' : `PIN:${last4}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Locked / Password or OTP Authentication Screen */}
        {!activeStudent ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-lg mx-auto space-y-5 shadow-sm">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Student Portal Security Gate
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Verify your identity using your <strong>Enrollment ID + Password/PIN</strong> OR a{' '}
                <strong>6-Digit Registered Mobile OTP</strong> to view fees, attendance & timetable.
              </p>
            </div>

            {/* Password vs OTP Toggle */}
            {securityConfig.allowStudentOtpLogin && (
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('password');
                    setLoginError('');
                  }}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    authMode === 'password'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Password / Mobile PIN</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('otp');
                    setLoginError('');
                  }}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    authMode === 'otp'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>6-Digit Mobile OTP</span>
                </button>
              </div>
            )}

            {lockoutSeconds > 0 && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                <span>Security Lockout Active — Retry in {lockoutSeconds}s</span>
              </div>
            )}

            {/* Simulated SMS OTP Gateway Preview when active */}
            {authMode === 'otp' && generatedOtp && otpExpiresIn > 0 && otpTargetStudent && (
              <div className="p-3 rounded-xl bg-slate-900 text-white border border-emerald-500/40 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    SMS OTP to {maskPhone(otpTargetStudent.phone)} · {otpExpiresIn}s left
                  </p>
                  <p className="text-base font-mono font-black tracking-widest text-amber-300 mt-0.5">
                    {generatedOtp}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpInput(generatedOtp)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer shrink-0"
                >
                  Auto-Fill OTP
                </button>
              </div>
            )}

            {authMode === 'password' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Enrollment ID or Registered Mobile
                  </label>
                  <input
                    type="text"
                    required
                    disabled={lockoutSeconds > 0}
                    value={enrollmentIdInput}
                    onChange={(e) => setEnrollmentIdInput(e.target.value)}
                    placeholder="e.g. STU-2026-001"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Portal Password or 4-Digit Mobile PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      required={securityConfig.requireStudentAuth}
                      disabled={lockoutSeconds > 0}
                      value={securityPinInput}
                      onChange={(e) => setSecurityPinInput(e.target.value)}
                      placeholder="Custom Password or Last 4 Digits of Phone"
                      className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      aria-label={showPin ? 'Hide password' : 'Show password'}
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={lockoutSeconds > 0}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Verify Password & Open Portal</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleStudentOtpVerifySubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Enrollment ID or Registered Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      disabled={lockoutSeconds > 0}
                      value={enrollmentIdInput}
                      onChange={(e) => setEnrollmentIdInput(e.target.value)}
                      placeholder="e.g. STU-2026-001 or 9876544501"
                      className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                    />
                    <button
                      type="button"
                      disabled={otpCooldown > 0 || lockoutSeconds > 0}
                      onClick={handleSendStudentOtp}
                      className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer"
                    >
                      {otpCooldown > 0 ? `${otpCooldown}s` : generatedOtp ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Enter 6-Digit Verification OTP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    disabled={lockoutSeconds > 0}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-Digit OTP Code"
                    className="w-full px-4 py-2.5 text-sm text-center tracking-widest font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={lockoutSeconds > 0}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify 6-Digit OTP & Login</span>
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Inline Student Password Update Drawer */}
            {showPasswordPanel && (
              <form
                onSubmit={handleSaveStudentPassword}
                className="bg-white rounded-2xl border border-emerald-300 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-emerald-700" />
                      <span>
                        Set Personal Portal Password — {activeStudent.studentName} (
                        {activeStudent.studentIdCode})
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Protected with salted SHA-256 hashing. You can still log in via 6-Digit OTP anytime.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPasswordPanel(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                {stuPassFeedback && (
                  <div
                    className={`p-2.5 rounded-lg text-xs font-bold border ${
                      stuPassFeedback.type === 'ok'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}
                  >
                    {stuPassFeedback.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                  <div>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newStuPass}
                      onChange={(e) => setNewStuPass(e.target.value)}
                      placeholder="New Password (min 6 chars)"
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl"
                    />
                    {newStuPass && (
                      <span
                        className={`text-[10px] font-bold block mt-1 ${
                          evaluatePasswordStrength(newStuPass).textColor
                        }`}
                      >
                        Strength: {evaluatePasswordStrength(newStuPass).label}
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmStuPass}
                    onChange={(e) => setConfirmStuPass(e.target.value)}
                    placeholder="Confirm New Password"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Save Password
                    </button>
                    {activeStudent.hasCustomPassword && (
                      <button
                        type="button"
                        onClick={async () => {
                          await onSetStudentPassword(activeStudent.id, '');
                          setStuPassFeedback({
                            type: 'ok',
                            text: 'Reverted to default 4-digit mobile PIN.'
                          });
                        }}
                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Use PIN
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )}

            {/* Student Identity & Security Status Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-extrabold bg-emerald-400 text-slate-950 px-2.5 py-0.5 rounded-sm flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>ID: {activeStudent.studentIdCode}</span>
                  </span>
                  {verifiedMethod && (
                    <span className="text-[11px] font-bold bg-sky-500/20 text-sky-200 border border-sky-400/30 px-2.5 py-0.5 rounded-sm">
                      Verified via {verifiedMethod}
                    </span>
                  )}
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-sm ${
                      activeStudent.enrollmentStatus === 'Enrolled'
                        ? 'bg-emerald-900/90 text-emerald-200 border border-emerald-700'
                        : activeStudent.enrollmentStatus === 'Re-enrolled'
                        ? 'bg-indigo-900/90 text-indigo-200 border border-indigo-700'
                        : 'bg-rose-900/90 text-rose-200 border border-rose-700'
                    }`}
                  >
                    Status: {activeStudent.enrollmentStatus}
                  </span>
                  <span className="text-xs font-mono bg-white/10 text-amber-300 px-2.5 py-0.5 rounded-sm border border-white/10">
                    Batch: {activeStudent.batchCode} ({activeStudent.shift})
                  </span>
                  <span className="text-xs text-emerald-300 font-medium">
                    · {activeStudent.board}
                  </span>
                </div>

                <h3 className="text-2xl font-extrabold text-white tracking-tight">
                  {activeStudent.studentName}{' '}
                  <span className="text-base font-normal text-emerald-300">
                    — {activeStudent.classLevel}
                  </span>
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  <span>
                    Guardian: <strong className="text-white">{activeStudent.parentName}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Verified Mobile:{' '}
                    <strong className="font-mono text-white">{activeStudent.phone}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Village/Ward: <strong className="text-white">{activeStudent.village}</strong>
                  </span>
                </div>
              </div>

              {/* Quick KPI Strip inside Banner */}
              <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/15 text-xs shrink-0">
                <div className="px-2 border-r border-white/15">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-300 block">
                    Attendance
                  </span>
                  <span className="font-mono text-lg font-black text-white tabular-nums">
                    {attendanceSummary?.attendancePercentage}%
                  </span>
                  <span className="text-[10px] text-slate-300 block">
                    {attendanceSummary?.attendedCount}/{attendanceSummary?.totalSessions} Days
                  </span>
                </div>

                <div className="px-2 border-r border-white/15">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-300 block">
                    Net Fee / Mo
                  </span>
                  <span className="font-mono text-lg font-black text-white tabular-nums">
                    ₹{activeStudent.netMonthlyFee}
                  </span>
                  <span className="text-[10px] text-amber-300 block truncate max-w-[110px]">
                    -{activeStudent.discountPercent}% Concession
                  </span>
                </div>

                <div className="px-2">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-300 block">
                    Balance Due
                  </span>
                  <span
                    className={`font-mono text-lg font-black tabular-nums ${
                      feeReport?.balanceDue === 0 ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    ₹{feeReport?.balanceDue || 0}
                  </span>
                  <span className="text-[10px] text-slate-300 block">
                    Paid: ₹{feeReport?.totalPaid || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Automated Parent Fee Deadline In-App Notification Inbox */}
            {unreadReminders.length > 0 && (
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-200 pb-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                      <BellRing className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-extrabold text-red-950">
                          Parent Fee Deadline Notification — Action Required
                        </h4>
                        <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
                          {unreadReminders.length} Unread Alert{unreadReminders.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-xs text-red-800 mt-0.5">
                        Fee payment deadline ({feeReminderSettings.activeDeadlineDate}) has been exceeded for{' '}
                        <strong>{activeStudent.studentName}</strong> (Parent: {activeStudent.parentName}).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {unreadReminders.map((rem) => (
                    <div
                      key={rem.id}
                      className="bg-white border border-red-200 rounded-xl p-4 space-y-3 shadow-2xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                            {rem.daysPastDeadline} Days Past Deadline
                          </span>
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
                            Pending Due: ₹{rem.dueAmount}
                          </span>
                          <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {rem.channel} · {rem.status}
                          </span>
                        </div>
                        <span className="font-mono text-slate-500">
                          Issued: {rem.sentAt}
                        </span>
                      </div>

                      <div className="text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-3 whitespace-pre-line leading-relaxed">
                        {rem.messageText}
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onAcknowledgeReminder(rem.id)}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Acknowledge / Mark Read</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('fees');
                            setPayAmount(activeStudent.netMonthlyFee || rem.dueAmount || 500);
                            setShowPayForm(true);
                          }}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Record / Pay Due Now</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {acknowledgedReminders.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      Parent Notification Archive ({acknowledgedReminders.length} Acknowledged)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReminderHistory(!showReminderHistory)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showReminderHistory ? 'Hide History' : 'View Read Alerts'}</span>
                    {showReminderHistory ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {showReminderHistory && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {acknowledgedReminders.map((rem) => (
                      <div
                        key={rem.id}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                          <span className="font-bold text-emerald-800">
                            ✓ Acknowledged · Deadline {rem.deadlineDate} · Due ₹{rem.dueAmount}
                          </span>
                          <span className="font-mono">{rem.sentAt}</span>
                        </div>
                        <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                          {rem.messageText}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Portal Section View Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                  Sub-Sections:
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('fees')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'fees'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>1. Fee Balance & Progress (Due: ₹{feeReport?.balanceDue})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('attendance')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'attendance'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>
                    2. Attendance History ({attendanceSummary?.attendancePercentage}%)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('timetable')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'timetable'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>3. Batch Timetable ({activeStudent.batchCode})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  4. Combined View
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 px-2">
                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                <span className="font-semibold text-slate-700">
                  {assignedCentre?.name}
                </span>
              </div>
            </div>

            {/* 1. ATTENDANCE HISTORY & MONTHLY REGISTER SECTION */}
            {(activeTab === 'all' || activeTab === 'attendance') &&
              attendanceSummary && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarCheck2 className="w-3.5 h-3.5" />
                        <span>Verified Classroom Attendance Register</span>
                      </span>
                      <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">
                        Attendance History & Topic Log — {activeStudent.studentName} (
                        {activeStudent.studentIdCode})
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAttendanceForm(!showAttendanceForm)}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>
                          {showAttendanceForm
                            ? 'Close Form'
                            : 'Mark Attendance / Leave Note'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {attendanceSuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{attendanceSuccessMsg}</span>
                    </div>
                  )}

                  {/* Inline Mark Attendance / Submit Leave Form */}
                  {showAttendanceForm && (
                    <form
                      onSubmit={handleAddAttendanceSubmit}
                      className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-950 uppercase tracking-wider">
                          Log Classroom Attendance / Leave Application ({activeStudent.batchCode})
                        </span>
                        <span className="font-mono text-[11px] text-emerald-800">
                          Shift: {activeStudent.shift}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Class Date
                          </label>
                          <input
                            type="date"
                            required
                            value={attDate}
                            onChange={(e) => setAttDate(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Attendance Status
                          </label>
                          <select
                            value={attStatus}
                            onChange={(e) =>
                              setAttStatus(e.target.value as AttendanceStatus)
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                          >
                            <option value="Present">Present (In Classroom)</option>
                            <option value="Late">Late Arrival</option>
                            <option value="Authorized Leave">Authorized Leave</option>
                            <option value="Absent">Absent</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Subject & Topic Covered
                          </label>
                          <input
                            type="text"
                            value={attTopic}
                            onChange={(e) => setAttTopic(e.target.value)}
                            placeholder="e.g. Maths — Quadratic Equations"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Remarks / Leave Reason
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={attRemarks}
                              onChange={(e) => setAttRemarks(e.target.value)}
                              placeholder="Optional note..."
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shrink-0 cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Attendance Summary KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-900 text-white">
                      <span className="text-[11px] text-slate-300 block">
                        Overall Attendance
                      </span>
                      <span className="font-mono text-2xl font-black text-emerald-400 tabular-nums">
                        {attendanceSummary.attendancePercentage}%
                      </span>
                      <span className="text-[10px] text-emerald-300 block mt-0.5">
                        {attendanceSummary.attendancePercentage >= 75
                          ? '✓ Eligible for Board Scholarship'
                          : '⚠ Below 75% Threshold'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[11px] font-semibold text-emerald-900 block">
                        Days Present
                      </span>
                      <span className="font-mono text-xl font-black text-emerald-700 tabular-nums">
                        {attendanceSummary.presentCount}
                      </span>
                      <span className="text-[10px] text-emerald-700 block mt-0.5">
                        On-time classroom sessions
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="text-[11px] font-semibold text-amber-900 block">
                        Late Arrivals
                      </span>
                      <span className="font-mono text-xl font-black text-amber-700 tabular-nums">
                        {attendanceSummary.lateCount}
                      </span>
                      <span className="text-[10px] text-amber-700 block mt-0.5">
                        Counted as attended
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200">
                      <span className="text-[11px] font-semibold text-indigo-900 block">
                        Authorized Leave
                      </span>
                      <span className="font-mono text-xl font-black text-indigo-700 tabular-nums">
                        {attendanceSummary.leaveCount}
                      </span>
                      <span className="text-[10px] text-indigo-700 block mt-0.5">
                        Guardian approved
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                      <span className="text-[11px] font-semibold text-rose-900 block">
                        Uninformed Absent
                      </span>
                      <span className="font-mono text-xl font-black text-rose-700 tabular-nums">
                        {attendanceSummary.absentCount}
                      </span>
                      <span className="text-[10px] text-rose-700 block mt-0.5">
                        Backup notes required
                      </span>
                    </div>
                  </div>

                  {/* Filter Bar & Attendance History Table */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700">
                        Session-Wise Attendance Log ({attendanceSummary.filteredRecords.length}{' '}
                        records):
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(['All', 'Present', 'Late', 'Authorized Leave', 'Absent'] as const).map(
                          (statusFilter) => (
                            <button
                              key={statusFilter}
                              type="button"
                              onClick={() => setAttendanceFilter(statusFilter)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                                attendanceFilter === statusFilter
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {statusFilter}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                            <th className="py-2.5 px-3 font-bold">Date</th>
                            <th className="py-2.5 px-3 font-bold">Status</th>
                            <th className="py-2.5 px-3 font-bold">Batch Shift</th>
                            <th className="py-2.5 px-3 font-bold">
                              Subject & Classroom Topic Covered
                            </th>
                            <th className="py-2.5 px-3 font-bold">Verified By</th>
                            <th className="py-2.5 px-3 font-bold">Faculty Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {attendanceSummary.filteredRecords.map((rec) => (
                            <tr key={rec.id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                                {rec.date}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[11px] ${
                                    rec.status === 'Present'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : rec.status === 'Late'
                                      ? 'bg-amber-100 text-amber-800'
                                      : rec.status === 'Authorized Leave'
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {rec.status === 'Present' && (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                  {rec.status === 'Absent' && (
                                    <XCircle className="w-3 h-3" />
                                  )}
                                  <span>{rec.status}</span>
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                {rec.shift}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900">
                                {rec.subjectTopic}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                                {rec.markedBy}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {rec.remarks || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            {/* 2 & 3. BATCH-SPECIFIC TIMETABLE + PERSONALIZED FEE BALANCE GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 7 Columns: Batch-Specific Weekly Timetable + Assigned Staff */}
              {(activeTab === 'all' || activeTab === 'timetable') && (
                <div
                  className={`${
                    activeTab === 'timetable' ? 'lg:col-span-12' : 'lg:col-span-7'
                  } space-y-6`}
                >
                  {/* Batch-Specific Weekly Timetable Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Batch-Specific Weekly Timetable (Mon – Sun)</span>
                        </span>
                        <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">
                          {assignedBatch?.classLevel || activeStudent.classLevel}
                        </h4>
                        {assignedBatch?.hindiSubtitle && (
                          <p className="text-xs font-semibold text-emerald-800 font-hindi">
                            {assignedBatch.hindiSubtitle}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xs font-extrabold text-emerald-900 bg-emerald-100 px-3 py-1 rounded-md block">
                          Batch ID: {activeStudent.batchCode}
                        </span>
                        <span className="text-[11px] font-bold text-indigo-700 mt-1 block">
                          {activeStudent.shift} ·{' '}
                          {assignedBatch?.timing || '06:00 AM – 08:30 AM'}
                        </span>
                      </div>
                    </div>

                    {/* Day-by-Day Structured Timetable Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                            <th className="py-2.5 px-3 font-bold">Day</th>
                            <th className="py-2.5 px-3 font-bold">Shift Timing</th>
                            <th className="py-2.5 px-3 font-bold">Period 1 Subject</th>
                            <th className="py-2.5 px-3 font-bold">Period 2 Subject</th>
                            <th className="py-2.5 px-3 font-bold">Faculty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {batchTimetable.map((row) => {
                            const isSunday = row.day === 'Sunday';
                            return (
                              <tr
                                key={row.day}
                                className={
                                  isSunday
                                    ? 'bg-amber-50/70 font-semibold'
                                    : 'hover:bg-slate-50/80'
                                }
                              >
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className="font-bold text-slate-900 block">
                                    {row.day}
                                  </span>
                                  <span className="text-[10px] text-emerald-800 font-hindi">
                                    {row.hindiDay}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                                  {row.timeSlot}
                                </td>
                                <td className="py-2.5 px-3 text-slate-900 font-medium">
                                  {row.period1}
                                </td>
                                <td className="py-2.5 px-3 text-slate-800">
                                  {row.period2}
                                </td>
                                <td className="py-2.5 px-3 text-emerald-800 font-semibold whitespace-nowrap">
                                  {row.faculty}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Assigned Staff & Faculty Mentors Card */}
                    <div className="pt-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Assigned Faculty & Mentors ({activeStudent.batchCode})</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {assignedStaffMembers.map((stf) => (
                          <div
                            key={stf.id}
                            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                  {stf.staffCode}
                                </span>
                                <h5 className="text-sm font-bold text-slate-900">
                                  {stf.name}
                                </h5>
                              </div>
                              <p className="text-xs font-semibold text-emerald-700">
                                {stf.role} ({stf.qualification})
                              </p>
                              <p className="text-[11px] text-slate-600">
                                {stf.responsibility}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href={`tel:${stf.phone.replace(/\s+/g, '')}`}
                                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Call</span>
                              </a>
                              <a
                                href={`https://wa.me/${stf.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                  `Namaste ${stf.name} Sir, I am ${activeStudent.studentName} (${activeStudent.studentIdCode}) from Batch ${activeStudent.batchCode}. I have an academic question...`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Doubt Chat</span>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Right 5 Columns: Personalized Fee Balance Report & Payment Ledger */}
              {(activeTab === 'all' || activeTab === 'fees') && feeReport && (
                <div
                  className={`${
                    activeTab === 'fees' ? 'lg:col-span-12' : 'lg:col-span-5'
                  } space-y-6`}
                >
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Personalized Fee Balance Report</span>
                        </span>
                        <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">
                          Tuition Fee & Receipt Ledger
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenPdfExport) {
                            onOpenPdfExport({
                              type: 'student-ledger',
                              studentId: activeStudent.id
                            });
                          } else {
                            window.print();
                          }
                        }}
                        className="px-3 py-1.5 text-white bg-slate-900 hover:bg-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Export Official Ledger Card (PDF)"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-300" />
                        <span>Export Ledger PDF</span>
                      </button>
                    </div>

                    {paymentSuccessMsg && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{paymentSuccessMsg}</span>
                      </div>
                    )}

                    {/* Concession / Charity Badge */}
                    <div
                      className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                        activeStudent.isCharitySeat
                          ? 'bg-amber-50 border-amber-200 text-amber-950'
                          : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {activeStudent.isCharitySeat ? (
                          <HeartHandshake className="w-4 h-4 text-amber-700 shrink-0" />
                        ) : (
                          <Award className="w-4 h-4 text-emerald-700 shrink-0" />
                        )}
                        <div>
                          <span className="font-bold block">
                            Scheme: {activeStudent.discountType}
                          </span>
                          <span className="text-[11px] opacity-80">
                            Base Fee: ₹{activeStudent.baseMonthlyFee}/mo · Net Payable: ₹
                            {activeStudent.netMonthlyFee}/mo
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-extrabold text-sm">
                        -{activeStudent.discountPercent}%
                      </span>
                    </div>

                    {/* Visual Fee Payment Progress Summary Chart (Recharts) */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>
                            Fee Payment Progress vs. Total Tuition ({activeStudent.classLevel})
                          </span>
                        </span>
                        <span
                          className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded ${
                            feeReport.paymentProgressPercent === 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {feeReport.paymentProgressPercent}% Cleared
                        </span>
                      </div>

                      <div className="h-36 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={feeReport.chartData}
                            layout="vertical"
                            margin={{ top: 4, right: 18, left: 10, bottom: 4 }}
                          >
                            <XAxis
                              type="number"
                              hide
                              domain={[0, Math.max(feeReport.totalBilled, 500)]}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              width={92}
                              tick={{ fontSize: 11, fontWeight: 700, fill: '#334155' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
                              formatter={(value: any) => [`₹${value}`, 'Amount']}
                              contentStyle={{
                                fontSize: '12px',
                                fontWeight: 700,
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                              }}
                            />
                            <Bar
                              dataKey="amount"
                              radius={[0, 6, 6, 0]}
                              barSize={20}
                            >
                              {feeReport.chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/80">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-xs bg-slate-700 inline-block" />
                          <span>Total: ₹{feeReport.totalBilled}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
                          <span>Paid: ₹{feeReport.totalPaid}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-xs inline-block ${
                              feeReport.balanceDue === 0 ? 'bg-emerald-500' : 'bg-rose-600'
                            }`}
                          />
                          <span>Due: ₹{feeReport.balanceDue}</span>
                        </span>
                      </div>
                    </div>

                    {/* Financial Summary Breakdown */}
                    <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>One-Time Registration & Kit Fee:</span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          ₹{feeReport.registrationFee}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>
                          Billed Tuition ({feeReport.activeBilledMonths.length} Months × ₹
                          {activeStudent.netMonthlyFee}):
                        </span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          ₹{feeReport.totalTuitionBilled}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-800 font-bold border-t border-slate-200 pt-2">
                        <span>Total Session Billed Amount:</span>
                        <span className="font-mono text-slate-900 tabular-nums">
                          ₹{feeReport.totalBilled}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-700 font-bold">
                        <span>Total Fee Paid / Waived:</span>
                        <span className="font-mono tabular-nums">
                          -₹{feeReport.totalPaid}
                        </span>
                      </div>

                      {/* Net Balance Due Highlight */}
                      <div
                        className={`flex items-center justify-between p-3 rounded-lg mt-2 border ${
                          feeReport.balanceDue === 0
                            ? 'bg-emerald-100/80 border-emerald-300 text-emerald-950'
                            : 'bg-rose-50 border-rose-200 text-rose-950'
                        }`}
                      >
                        <div>
                          <span className="font-extrabold block text-xs uppercase tracking-wider">
                            {feeReport.balanceDue === 0
                              ? 'All Dues Cleared'
                              : 'Pending Fee Balance'}
                          </span>
                          <span className="text-[11px] opacity-80">
                            {feeReport.balanceDue === 0
                              ? 'No outstanding balance for current session'
                              : 'Please clear dues at the centre office'}
                          </span>
                        </div>
                        <span className="font-mono text-2xl font-black tabular-nums">
                          ₹{feeReport.balanceDue}
                        </span>
                      </div>
                    </div>

                    {/* Recorded Payment Receipts List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Payment Receipts ({feeReport.payments.length})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setPayAmount(activeStudent.netMonthlyFee || 500);
                            setShowPayForm(!showPayForm);
                          }}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>{showPayForm ? 'Cancel' : 'Record Payment'}</span>
                        </button>
                      </div>

                      {/* Inline Record Payment Form */}
                      {showPayForm && (
                        <form
                          onSubmit={handleAddPaymentSubmit}
                          className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-2.5 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-bold text-emerald-950">
                              Log Partial / Full Tuition Installment
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {[
                                {
                                  label: `50% (₹${Math.max(50, Math.round((activeStudent.netMonthlyFee || 500) / 2))})`,
                                  val: Math.max(50, Math.round((activeStudent.netMonthlyFee || 500) / 2))
                                },
                                {
                                  label: `1 Mo (₹${activeStudent.netMonthlyFee || 500})`,
                                  val: activeStudent.netMonthlyFee || 500
                                }
                              ].map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => setPayAmount(preset.val)}
                                  className="px-2 py-0.5 bg-white hover:bg-emerald-100 border border-emerald-300 rounded text-[10px] font-mono font-bold text-emerald-900 cursor-pointer"
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              required
                              value={payMonthLabel}
                              onChange={(e) => setPayMonthLabel(e.target.value)}
                              placeholder="Month (e.g. Nov 2026)"
                              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                            />
                            <input
                              type="number"
                              required
                              min={1}
                              value={payAmount}
                              onChange={(e) => setPayAmount(Number(e.target.value))}
                              placeholder="Amount (₹)"
                              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                            />
                          </div>
                          <input
                            type="text"
                            value={payRemarks}
                            onChange={(e) => setPayRemarks(e.target.value)}
                            placeholder="Optional note (e.g. Partial payment by parent)"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <select
                              value={payMode}
                              onChange={(e) => setPayMode(e.target.value as any)}
                              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                            >
                              <option value="UPI / Online">UPI / Online</option>
                              <option value="Cash">Cash at Office</option>
                            </select>
                            <button
                              type="submit"
                              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg cursor-pointer"
                            >
                              Save Receipt
                            </button>
                          </div>
                        </form>
                      )}

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {feeReport.payments.map((p) => {
                          const paidInMo =
                            p.paidInMonth || formatMonthYearFromDate(p.date);
                          return (
                            <div
                              key={p.id}
                              className={`p-3 rounded-xl border flex items-start justify-between gap-2 text-xs ${
                                p.extraAdvanceAmount && p.extraAdvanceAmount > 0
                                  ? 'bg-emerald-50/50 border-emerald-200'
                                  : p.isPartialPayment
                                  ? 'bg-amber-50/60 border-amber-200'
                                  : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-mono font-bold text-emerald-800">
                                    {p.receiptNo}
                                  </span>
                                  <span className="text-slate-400">·</span>
                                  <span className="font-semibold text-slate-900">
                                    {p.monthLabel}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-900 border border-sky-200 text-[10px] font-bold">
                                    Paid in: {paidInMo}
                                  </span>
                                  {p.isPartialPayment && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                                      Partial Paid
                                    </span>
                                  )}
                                  {p.extraAdvanceAmount !== undefined &&
                                    p.extraAdvanceAmount > 0 && (
                                      <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold">
                                        +₹{p.extraAdvanceAmount} Adjusted to Next Mo.
                                      </span>
                                    )}
                                </div>
                                <span className="block text-[11px] text-slate-500 mt-0.5">
                                  Date: {p.date} · Mode: {p.mode}
                                  {p.paidByParentName ? ` · By ${p.paidByParentName}` : ''}
                                  {p.remarks ? ` · ${p.remarks}` : ''}
                                </span>
                                {p.adjustmentBreakdown &&
                                  p.adjustmentBreakdown.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {p.adjustmentBreakdown.map((item, bIdx) => (
                                        <span
                                          key={`${p.id}-bd-${bIdx}`}
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                            item.type === 'next-month-advance'
                                              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                              : item.type === 'back-due' ||
                                                item.type === 'prev-year'
                                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                                              : 'bg-white text-slate-700 border-slate-200'
                                          }`}
                                        >
                                          {item.label}: ₹{item.amount}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                              </div>
                              <span className="font-mono font-extrabold text-slate-900 tabular-nums shrink-0">
                                ₹{p.amount}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* WhatsApp Fee & Attendance Statement Button */}
                    <a
                      href={whatsAppFeeStatementUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Send Fee & Attendance Report on WhatsApp</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
