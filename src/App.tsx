/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  NoticeItem,
  InquiryItem,
  BatchItem,
  InstituteConfig,
  StaffMember,
  FeePlan,
  StudentRecord,
  FeeDiscountType,
  FeePaymentItem,
  AttendanceRecord,
  SecurityConfig,
  SecurityLogItem,
  FeeReminderSettings,
  FeeReminderLogItem
} from './types';
import {
  createInitialSecurityConfig,
  DEFAULT_ADMIN_PASSWORD,
  generateRandomSalt,
  hashSecret,
  verifySecret
} from './utils/securityHelpers';
import { computeStudentFinancials } from './utils/ledgerHelpers';
import {
  DEFAULT_FEE_REMINDER_SETTINGS,
  computeDaysPastDeadline,
  buildFeeReminderMessage
} from './utils/reminderHelpers';
import {
  INITIAL_NOTICES,
  INITIAL_BATCHES,
  INITIAL_INSTITUTE_CONFIG,
  INITIAL_STAFF,
  FEE_PLANS,
  INITIAL_STUDENTS
} from './data/seedData';
import { UrgentTicker } from './components/UrgentTicker';
import { Navbar, MainSectionType } from './components/Navbar';
import { Hero } from './components/Hero';
import { NoticeBoard } from './components/NoticeBoard';
import { CourseBatches } from './components/CourseBatches';
import { StudentDashboard } from './components/StudentDashboard';
import { StudentPortal } from './components/StudentPortal';
import { FeeEstimator } from './components/FeeEstimator';
import { WhatsAppInquiry } from './components/WhatsAppInquiry';
import { Footer } from './components/Footer';
import { PrintNoticeModal } from './components/PrintNoticeModal';
import { PrintPdfExportModal } from './components/PrintPdfExportModal';
import { AdminPortalModal, AdminTabType } from './components/AdminPortalModal';
import { PdfExportRequest } from './utils/ledgerHelpers';
import {
  Building2,
  GraduationCap,
  BookOpen,
  UserPlus,
  Calculator,
  Bell,
  Layers,
  LayoutDashboard
} from 'lucide-react';

const INSTITUTE_CONFIG_KEY = 'sntc_institute_config_v5';
const STAFF_STORAGE_KEY = 'sntc_staff_v3';
const BATCHES_STORAGE_KEY = 'sntc_batches_v3';
const FEES_STORAGE_KEY = 'sntc_fees_v3';
const STUDENTS_STORAGE_KEY = 'sntc_students_v6';
const NOTICES_STORAGE_KEY = 'sntc_notices_v3';
const INQUIRIES_STORAGE_KEY = 'sntc_inquiries_v3';
const ADMIN_SESSION_KEY = 'sntc_admin_active_v1';
const SECURITY_CONFIG_KEY = 'sntc_security_config_v1';
const SECURITY_LOGS_KEY = 'sntc_security_logs_v1';
const REMINDER_SETTINGS_KEY = 'sntc_reminder_settings_v1';
const REMINDER_LOGS_KEY = 'sntc_fee_reminders_v1';

export default function App() {
  // 1. State: Institute Configuration & Multi-Study Centres
  const [instituteConfig, setInstituteConfig] = useState<InstituteConfig>(() => {
    try {
      const saved = localStorage.getItem(INSTITUTE_CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading institute config', e);
    }
    return INITIAL_INSTITUTE_CONFIG;
  });

  const [selectedCentreId, setSelectedCentreId] = useState<string>('all');
  const [activeMainSection, setActiveMainSection] = useState<MainSectionType>('home');

  // 2. State: Assigned Staff & Roles
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem(STAFF_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading staff list', e);
    }
    return INITIAL_STAFF;
  });

  // 3. State: Batches (Morning, Afternoon, Evening, Night Class)
  const [batches, setBatches] = useState<BatchItem[]>(() => {
    try {
      const saved = localStorage.getItem(BATCHES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading batches', e);
    }
    return INITIAL_BATCHES;
  });

  // 4. State: Class-Wise Fee Plans
  const [feePlans, setFeePlans] = useState<FeePlan[]>(() => {
    try {
      const saved = localStorage.getItem(FEES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading fee plans', e);
    }
    return FEE_PLANS;
  });

  // 5. State: Enrolled Students Register (Up to 500 capacity)
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading students', e);
    }
    return INITIAL_STUDENTS;
  });

  // 6. State: Notices
  const [notices, setNotices] = useState<NoticeItem[]>(() => {
    try {
      const saved = localStorage.getItem(NOTICES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading notices', e);
    }
    return INITIAL_NOTICES;
  });

  // 7. State: Inquiries
  const [inquiries, setInquiries] = useState<InquiryItem[]>(() => {
    try {
      const saved = localStorage.getItem(INQUIRIES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading inquiries', e);
    }
    return [];
  });

  // State: Admin authentication
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // State: Password & OTP Security Settings + Audit Logs
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(() => {
    try {
      const saved = localStorage.getItem(SECURITY_CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading security config', e);
    }
    return createInitialSecurityConfig(
      INITIAL_INSTITUTE_CONFIG.phoneDisplay,
      INITIAL_INSTITUTE_CONFIG.email
    );
  });

  const [securityLogs, setSecurityLogs] = useState<SecurityLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(SECURITY_LOGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading security logs', e);
    }
    return [];
  });

  // State: Automated Fee Deadline Reminders & In-App Parent Notifications
  const [feeReminderSettings, setFeeReminderSettings] = useState<FeeReminderSettings>(() => {
    try {
      const saved = localStorage.getItem(REMINDER_SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading reminder settings', e);
    }
    return DEFAULT_FEE_REMINDER_SETTINGS;
  });

  const [feeReminders, setFeeReminders] = useState<FeeReminderLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(REMINDER_LOGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading fee reminders', e);
    }
    return [];
  });

  // Modals
  const [selectedPrintNotice, setSelectedPrintNotice] = useState<NoticeItem | null>(null);
  const [pdfExportRequest, setPdfExportRequest] = useState<PdfExportRequest | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTabType>('branding');
  const [editingBatch, setEditingBatch] = useState<BatchItem | null>(null);

  // Form Pre-fill
  const [enrollmentClass, setEnrollmentClass] = useState<string>('Class 10th (Matric Target)');
  const [enrollmentBatchCode, setEnrollmentBatchCode] = useState<string | undefined>(undefined);
  const [enrollmentEstimatedFee, setEnrollmentEstimatedFee] = useState<number | undefined>(
    undefined
  );
  const [enrollmentDiscountType, setEnrollmentDiscountType] = useState<FeeDiscountType>('None');
  const [enrollmentIsCharity, setEnrollmentIsCharity] = useState<boolean>(false);

  // Sync states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(INSTITUTE_CONFIG_KEY, JSON.stringify(instituteConfig));
      document.title = `${instituteConfig.name} | Coaching Portal`;
    } catch (e) {
      console.error('Failed to sync institute config', e);
    }
  }, [instituteConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staffList));
    } catch (e) {
      console.error('Failed to sync staff', e);
    }
  }, [staffList]);

  useEffect(() => {
    try {
      localStorage.setItem(BATCHES_STORAGE_KEY, JSON.stringify(batches));
    } catch (e) {
      console.error('Failed to sync batches', e);
    }
  }, [batches]);

  useEffect(() => {
    try {
      localStorage.setItem(FEES_STORAGE_KEY, JSON.stringify(feePlans));
    } catch (e) {
      console.error('Failed to sync fees', e);
    }
  }, [feePlans]);

  useEffect(() => {
    try {
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
    } catch (e) {
      console.error('Failed to sync students', e);
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(notices));
    } catch (e) {
      console.error('Failed to sync notices', e);
    }
  }, [notices]);

  useEffect(() => {
    try {
      localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(inquiries));
    } catch (e) {
      console.error('Failed to sync inquiries', e);
    }
  }, [inquiries]);

  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_SESSION_KEY, isAdmin ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to sync admin session', e);
    }
  }, [isAdmin]);

  useEffect(() => {
    try {
      localStorage.setItem(SECURITY_CONFIG_KEY, JSON.stringify(securityConfig));
    } catch (e) {
      console.error('Failed to sync security config', e);
    }
  }, [securityConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify(securityLogs));
    } catch (e) {
      console.error('Failed to sync security logs', e);
    }
  }, [securityLogs]);

  // Seed salted SHA-256 hash for default admin password on first boot
  useEffect(() => {
    if (!securityConfig.adminPasswordHash) {
      hashSecret(DEFAULT_ADMIN_PASSWORD, securityConfig.adminPasswordSalt).then(
        (hashed) => {
          setSecurityConfig((prev) =>
            prev.adminPasswordHash ? prev : { ...prev, adminPasswordHash: hashed }
          );
        }
      );
    }
  }, [securityConfig.adminPasswordHash, securityConfig.adminPasswordSalt]);

  // Admin Session Inactivity Auto-Lock
  useEffect(() => {
    if (!isAdmin || securityConfig.sessionTimeoutMinutes <= 0) return;
    const timeoutMs = securityConfig.sessionTimeoutMinutes * 60 * 1000;
    let timer = window.setTimeout(() => {
      setIsAdmin(false);
      setIsAdminModalOpen(false);
      addSecurityLog('Admin', 'Session auto-locked due to inactivity', 'System', 'Reset');
    }, timeoutMs);

    const resetTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setIsAdmin(false);
        setIsAdminModalOpen(false);
        addSecurityLog('Admin', 'Session auto-locked due to inactivity', 'System', 'Reset');
      }, timeoutMs);
    };

    window.addEventListener('pointerdown', resetTimer);
    window.addEventListener('keydown', resetTimer);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [isAdmin, securityConfig.sessionTimeoutMinutes]);

  const addSecurityLog = (
    actor: string,
    event: string,
    method: SecurityLogItem['method'],
    status: SecurityLogItem['status']
  ) => {
    const newItem: SecurityLogItem = {
      id: `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }),
      actor,
      event,
      method,
      status
    };
    setSecurityLogs((prev) => [newItem, ...prev].slice(0, 40));
  };

  useEffect(() => {
    try {
      localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(feeReminderSettings));
    } catch (e) {
      console.error('Failed to sync reminder settings', e);
    }
  }, [feeReminderSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(REMINDER_LOGS_KEY, JSON.stringify(feeReminders));
    } catch (e) {
      console.error('Failed to sync fee reminders', e);
    }
  }, [feeReminders]);

  // Automatically trigger in-app notifications for parents of students exceeding the payment deadline
  useEffect(() => {
    if (!feeReminderSettings.autoTriggerInAppOnLoad) return;
    const daysPast = computeDaysPastDeadline(feeReminderSettings.activeDeadlineDate);
    if (daysPast <= 0) return;

    const nowStamp = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    setFeeReminders((prev) => {
      const generatedForMissing: FeeReminderLogItem[] = [];
      for (const stu of students) {
        if (stu.enrollmentStatus === 'Disenrolled') continue;
        const fin = computeStudentFinancials(stu, feePlans);
        if (fin.totalCombinedPending <= 0) continue;

        const alreadyNotifiedForDeadline = prev.some(
          (r) =>
            r.studentId === stu.id &&
            r.deadlineDate === feeReminderSettings.activeDeadlineDate
        );
        if (alreadyNotifiedForDeadline) continue;

        const msg = buildFeeReminderMessage(
          stu,
          fin,
          instituteConfig,
          feeReminderSettings.activeDeadlineDate,
          daysPast,
          feeReminderSettings.defaultLanguage
        );

        generatedForMissing.push({
          id: `rem-auto-${stu.id}-${feeReminderSettings.activeDeadlineDate}`,
          studentId: stu.id,
          studentIdCode: stu.studentIdCode,
          studentName: stu.studentName,
          parentName: stu.parentName,
          parentPhone: stu.phone,
          classLevel: stu.classLevel,
          dueAmount: fin.totalCombinedPending,
          deadlineDate: feeReminderSettings.activeDeadlineDate,
          daysPastDeadline: daysPast,
          channel: 'In-App Notification',
          messageText: msg,
          sentAt: nowStamp,
          status: 'Automated Trigger',
          language: feeReminderSettings.defaultLanguage
        });
      }

      if (generatedForMissing.length === 0) return prev;
      return [...generatedForMissing, ...prev].slice(0, 120);
    });
  }, [
    students,
    feePlans,
    instituteConfig,
    feeReminderSettings.autoTriggerInAppOnLoad,
    feeReminderSettings.activeDeadlineDate,
    feeReminderSettings.defaultLanguage
  ]);

  const handleDispatchFeeReminder = (reminder: FeeReminderLogItem) => {
    setFeeReminders((prev) => [reminder, ...prev].slice(0, 120));
  };

  const handleBulkDispatchReminders = (reminders: FeeReminderLogItem[]) => {
    if (reminders.length === 0) return;
    setFeeReminders((prev) => [...reminders, ...prev].slice(0, 120));
  };

  const handleAcknowledgeReminder = (reminderId: string) => {
    setFeeReminders((prev) =>
      prev.map((r) => (r.id === reminderId ? { ...r, status: 'Acknowledged' } : r))
    );
  };

  const handleClearFeeReminders = () => {
    setFeeReminders([]);
  };

  // Calculate total active enrolled count across batches + newly added student records
  const batchEnrolledSum = batches.reduce((acc, b) => acc + b.enrolledCount, 0);
  const activeStudentRecordsCount = students.filter(
    (s) => s.enrollmentStatus !== 'Disenrolled'
  ).length;
  // Total enrolled students (capped at maxStudentCapacity, e.g., 500)
  const totalEnrolledCount = Math.min(
    instituteConfig.maxStudentCapacity,
    Math.max(batchEnrolledSum, activeStudentRecordsCount)
  );

  // Admin Auth Handlers (Password, OTP & Two-Factor)
  const handleVerifyAdminPassword = async (password: string): Promise<boolean> => {
    const matched = await verifySecret(
      password,
      securityConfig.adminPasswordSalt,
      securityConfig.adminPasswordHash
    );
    if (!matched) {
      addSecurityLog('Admin', 'Failed admin password verification attempt', 'Password', 'Failed');
    }
    return matched;
  };

  const handleCompleteAdminLogin = (method: 'Password' | 'OTP' | '2FA') => {
    setIsAdmin(true);
    addSecurityLog('Admin', `Admin Control Suite unlocked via ${method}`, method, 'Success');
  };

  const handleUpdateAdminPassword = async (newPassword: string) => {
    const newSalt = generateRandomSalt();
    const newHash = await hashSecret(newPassword, newSalt);
    setSecurityConfig((prev) => ({
      ...prev,
      adminPasswordSalt: newSalt,
      adminPasswordHash: newHash
    }));
    addSecurityLog('Admin', 'Admin portal password updated', 'Password', 'Reset');
  };

  const handleSetStudentPortalPassword = async (
    studentId: string,
    newPassword: string
  ) => {
    if (!newPassword.trim()) {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? {
                ...s,
                portalPasswordHash: undefined,
                portalPasswordSalt: undefined,
                hasCustomPassword: false
              }
            : s
        )
      );
      const stu = students.find((s) => s.id === studentId);
      addSecurityLog(
        stu ? `${stu.studentIdCode}` : 'Student',
        'Reset student portal password to default mobile PIN',
        'Password',
        'Reset'
      );
      return;
    }

    const salt = generateRandomSalt();
    const hash = await hashSecret(newPassword.trim(), salt);
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              portalPasswordHash: hash,
              portalPasswordSalt: salt,
              hasCustomPassword: true
            }
          : s
      )
    );
    const stu = students.find((s) => s.id === studentId);
    addSecurityLog(
      stu ? `${stu.studentIdCode}` : 'Student',
      'Updated custom Student Portal password',
      'Password',
      'Reset'
    );
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setIsAdminModalOpen(false);
    addSecurityLog('Admin', 'Admin signed out and locked suite', 'System', 'Success');
  };

  const openAdminSuite = (tab: AdminTabType = 'branding') => {
    setAdminInitialTab(tab);
    setIsAdminModalOpen(true);
  };

  // Student Lifecycle Handlers (Enroll / Disenroll / Re-enroll)
  const handleAddOrUpdateStudent = (student: StudentRecord) => {
    setStudents((prev) => {
      const exists = prev.some((s) => s.id === student.id);
      if (exists) {
        return prev.map((s) => (s.id === student.id ? student : s));
      }
      return [student, ...prev];
    });
    // Also increment batch enrolled count if below totalSeats
    setBatches((prev) =>
      prev.map((b) =>
        b.batchCode === student.batchCode
          ? { ...b, enrolledCount: Math.min(b.totalSeats, b.enrolledCount + 1) }
          : b
      )
    );
  };

  const handleDisenrollStudent = (studentId: string, date: string, reason?: string) => {
    const target = students.find((s) => s.id === studentId);
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              enrollmentStatus: 'Disenrolled',
              disenrollmentDate: date,
              notes: reason || s.notes
            }
          : s
      )
    );
    if (target && target.enrollmentStatus !== 'Disenrolled') {
      setBatches((prev) =>
        prev.map((b) =>
          b.batchCode === target.batchCode
            ? { ...b, enrolledCount: Math.max(0, b.enrolledCount - 1) }
            : b
        )
      );
    }
  };

  const handleReEnrollStudent = (studentId: string, date: string, batchCode?: string) => {
    const target = students.find((s) => s.id === studentId);
    const targetBatchCode = batchCode || target?.batchCode;
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              batchCode: targetBatchCode || s.batchCode,
              enrollmentStatus: 'Re-enrolled',
              reEnrollmentDate: date
            }
          : s
      )
    );
    if (target && target.enrollmentStatus === 'Disenrolled') {
      setBatches((prev) =>
        prev.map((b) =>
          b.batchCode === targetBatchCode
            ? { ...b, enrolledCount: Math.min(b.totalSeats, b.enrolledCount + 1) }
            : b
        )
      );
    }
  };

  const handleDeleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (target && target.enrollmentStatus !== 'Disenrolled') {
      setBatches((prev) =>
        prev.map((b) =>
          b.batchCode === target.batchCode
            ? { ...b, enrolledCount: Math.max(0, b.enrolledCount - 1) }
            : b
        )
      );
    }
  };

  // Clear all pre-loaded student records and reset batch seat counters to 0
  const handleClearAllStudentsPreData = () => {
    setStudents([]);
    setInquiries([]);
    setBatches((prev) => prev.map((b) => ({ ...b, enrolledCount: 0 })));
  };

  // Clear only pre-loaded fee receipts & attendance history across all students
  const handleClearStudentsHistoryPreData = () => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        paidAmount: 0,
        previousYearPendingFee: 0,
        previousYearClearedAmount: 0,
        feePayments: [],
        attendanceRecords: []
      }))
    );
  };

  // Clear a single student's pre-filled fee receipts, attendance logs & lifecycle dates
  const handleClearSingleStudentPreData = (id: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              paidAmount: 0,
              previousYearPendingFee: 0,
              previousYearClearedAmount: 0,
              feePayments: [],
              attendanceRecords: [],
              disenrollmentDate: undefined,
              reEnrollmentDate: undefined,
              enrollmentStatus: 'Enrolled'
            }
          : s
      )
    );
  };

  // Restore default sample students
  const handleRestoreDefaultStudents = () => {
    setStudents(INITIAL_STUDENTS);
    setBatches(INITIAL_BATCHES);
  };

  const handleRecordFeePayment = (studentId: string, payment: FeePaymentItem) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const updatedPayments = [payment, ...(s.feePayments || [])];
        const sessionDelta =
          typeof payment.sessionPaidPart === 'number'
            ? payment.sessionPaidPart
            : payment.isPreviousYearClearance || payment.session === '2025-26'
            ? 0
            : payment.amount;
        const prevYearDelta =
          typeof payment.prevYearClearedPart === 'number'
            ? payment.prevYearClearedPart
            : payment.isPreviousYearClearance || payment.session === '2025-26'
            ? payment.amount
            : 0;
        const currentSessionPaymentsSum = updatedPayments.reduce(
          (sum, p) =>
            sum +
            (typeof p.sessionPaidPart === 'number'
              ? p.sessionPaidPart
              : p.isPreviousYearClearance || p.session === '2025-26'
              ? 0
              : p.amount),
          0
        );
        return {
          ...s,
          paidAmount: Math.max((s.paidAmount || 0) + sessionDelta, currentSessionPaymentsSum),
          previousYearClearedAmount: (s.previousYearClearedAmount || 0) + prevYearDelta,
          feePayments: updatedPayments
        };
      })
    );
  };

  // Clear or adjust Previous Academic Year Pending Fee
  const handleClearPreviousYearFee = (
    studentId: string,
    amountPaid: number,
    mode: 'Cash' | 'UPI / Online',
    newTotalPrevPending?: number,
    meta?: { paidByParentName?: string; remarks?: string; date?: string }
  ) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const updatedPrevTotal =
          newTotalPrevPending !== undefined
            ? newTotalPrevPending
            : s.previousYearPendingFee || 0;
        const updatedPrevCleared = (s.previousYearClearedAmount || 0) + amountPaid;
        const newReceipts =
          amountPaid > 0
            ? [
                {
                  id: `fp-prv-${Date.now()}`,
                  receiptNo: `PRV-2025-${Math.floor(100 + Math.random() * 900)}`,
                  date: meta?.date || new Date().toISOString().slice(0, 10),
                  monthLabel: 'Prev Year (2025-26) Arrear Partial Clearance',
                  amount: amountPaid,
                  mode,
                  session: '2025-26',
                  isPreviousYearClearance: true,
                  isPartialPayment: updatedPrevCleared < updatedPrevTotal,
                  paidByParentName: meta?.paidByParentName || s.parentName,
                  collectedBy: instituteConfig.founder,
                  remarks: meta?.remarks
                } as FeePaymentItem,
                ...(s.feePayments || [])
              ]
            : s.feePayments || [];

        return {
          ...s,
          previousYearPendingFee: updatedPrevTotal,
          previousYearClearedAmount: updatedPrevCleared,
          feePayments: newReceipts
        };
      })
    );
  };

  // Promote single student to next class & session
  const handlePromoteStudent = (
    studentId: string,
    toClassNum: number,
    toClassLevel: string,
    toBatchCode: string,
    newSession: string,
    carryForwardDues: number,
    remarks?: string
  ) => {
    const plan = feePlans.find((fp) => fp.classNum === toClassNum);
    const matchingBatch = batches.find((b) => b.batchCode === toBatchCode);
    const today = new Date().toISOString().slice(0, 10);

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const newBaseFee = plan ? plan.monthlyFee : s.baseMonthlyFee;
        const newNetFee = s.isCharitySeat
          ? 0
          : Math.round(newBaseFee * (1 - (s.discountPercent || 0) / 100));

        const promoEntry = {
          id: `prom-${Date.now()}`,
          date: today,
          fromClass: s.classLevel,
          fromClassNum: s.classNum,
          toClass: toClassLevel,
          toClassNum,
          session: newSession,
          carryForwardDues,
          remarks
        };

        return {
          ...s,
          promotedFromClass: s.classLevel,
          lastPromotionDate: today,
          classNum: toClassNum,
          classLevel: toClassLevel,
          batchCode: toBatchCode,
          batchId: matchingBatch?.id || s.batchId,
          shift: matchingBatch?.shift || s.shift,
          academicSession: newSession,
          baseMonthlyFee: newBaseFee,
          netMonthlyFee: newNetFee,
          paidAmount: 0,
          previousYearPendingFee: (s.previousYearPendingFee || 0) + carryForwardDues,
          promotionHistory: [promoEntry, ...(s.promotionHistory || [])]
        };
      })
    );
  };

  // Bulk promote all active students in a class to target class
  const handleBulkPromoteClass = (
    fromClassNum: number,
    toClassNum: number,
    toClassLevel: string,
    toBatchCode: string,
    newSession: string,
    remarks?: string
  ): number => {
    const targets = students.filter(
      (s) => s.classNum === fromClassNum && s.enrollmentStatus !== 'Disenrolled'
    );
    if (targets.length === 0) return 0;

    const plan = feePlans.find((fp) => fp.classNum === toClassNum);
    const matchingBatch = batches.find((b) => b.batchCode === toBatchCode);
    const today = new Date().toISOString().slice(0, 10);

    setStudents((prev) =>
      prev.map((s) => {
        if (s.classNum !== fromClassNum || s.enrollmentStatus === 'Disenrolled') {
          return s;
        }
        const oldPlan = feePlans.find((fp) => fp.classNum === s.classNum);
        const oldReg = s.isCharitySeat ? 0 : oldPlan ? oldPlan.registrationFee : 200;
        const estBilled = s.isCharitySeat ? 0 : oldReg + s.netMonthlyFee * 4;
        const unpaidCurrent = Math.max(0, estBilled - (s.paidAmount || 0));

        const newBaseFee = plan ? plan.monthlyFee : s.baseMonthlyFee;
        const newNetFee = s.isCharitySeat
          ? 0
          : Math.round(newBaseFee * (1 - (s.discountPercent || 0) / 100));

        const promoEntry = {
          id: `prom-${Date.now()}-${s.id}`,
          date: today,
          fromClass: s.classLevel,
          fromClassNum: s.classNum,
          toClass: toClassLevel,
          toClassNum,
          session: newSession,
          carryForwardDues: unpaidCurrent,
          remarks
        };

        return {
          ...s,
          promotedFromClass: s.classLevel,
          lastPromotionDate: today,
          classNum: toClassNum,
          classLevel: toClassLevel,
          batchCode: toBatchCode,
          batchId: matchingBatch?.id || s.batchId,
          shift: matchingBatch?.shift || s.shift,
          academicSession: newSession,
          baseMonthlyFee: newBaseFee,
          netMonthlyFee: newNetFee,
          paidAmount: 0,
          previousYearPendingFee: (s.previousYearPendingFee || 0) + unpaidCurrent,
          promotionHistory: [promoEntry, ...(s.promotionHistory || [])]
        };
      })
    );

    return targets.length;
  };

  const handleRecordAttendance = (studentId: string, record: AttendanceRecord) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          attendanceRecords: [record, ...(s.attendanceRecords || [])]
        };
      })
    );
  };

  // Staff Handlers
  const handleAddStaff = (staff: StaffMember) => {
    setStaffList((prev) => [...prev, staff]);
  };

  const handleUpdateStaff = (updatedStaff: StaffMember) => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s))
    );
  };

  const handleDeleteStaff = (id: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== id));
  };

  // Batch & Fee Handlers
  const handleAddBatch = (batch: BatchItem) => {
    setBatches((prev) => [batch, ...prev]);
  };

  const handleUpdateBatch = (updatedBatch: BatchItem) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === updatedBatch.id ? updatedBatch : b))
    );
  };

  const handleDeleteBatch = (id: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== id));
  };

  const handleUpdateFeePlan = (
    classNum: number,
    monthly: number,
    quarterly: number,
    reg: number
  ) => {
    setFeePlans((prev) =>
      prev.map((fp) =>
        fp.classNum === classNum
          ? { ...fp, monthlyFee: monthly, quarterlyFee: quarterly, registrationFee: reg }
          : fp
      )
    );
  };

  // Notice & Inquiry Handlers
  const handleAddNotice = (newNotice: NoticeItem) => {
    setNotices((prev) => [newNotice, ...prev]);
  };

  const handleDeleteNotice = (id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  };

  const handleTogglePinNotice = (id: string) => {
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
    );
  };

  const handleUpdateInquiryStatus = (id: string, status: InquiryItem['status']) => {
    setInquiries((prev) =>
      prev.map((inq) => (inq.id === id ? { ...inq, status } : inq))
    );
  };

  const handleInquirySubmitted = (newInquiry: InquiryItem) => {
    setInquiries((prev) => [newInquiry, ...prev]);
  };

  const handleResetData = () => {
    setInstituteConfig(INITIAL_INSTITUTE_CONFIG);
    setStaffList(INITIAL_STAFF);
    setBatches(INITIAL_BATCHES);
    setFeePlans(FEE_PLANS);
    setStudents(INITIAL_STUDENTS);
    setNotices(INITIAL_NOTICES);
    setInquiries([]);
    localStorage.removeItem(INSTITUTE_CONFIG_KEY);
    localStorage.removeItem(STAFF_STORAGE_KEY);
    localStorage.removeItem(BATCHES_STORAGE_KEY);
    localStorage.removeItem(FEES_STORAGE_KEY);
    localStorage.removeItem(STUDENTS_STORAGE_KEY);
    localStorage.removeItem(NOTICES_STORAGE_KEY);
    localStorage.removeItem(INQUIRIES_STORAGE_KEY);
  };

  // Navigation Helpers
  const navigateToSection = (section: MainSectionType) => {
    setActiveMainSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBatchForInquiry = (batch: BatchItem) => {
    setEnrollmentClass(batch.classLevel);
    setEnrollmentBatchCode(batch.batchCode);
    navigateToSection('enrollment');
  };

  const handleApplyFeeToInquiry = (
    classLevel: string,
    estimatedFee: number,
    discountType: FeeDiscountType,
    isCharity: boolean
  ) => {
    setEnrollmentClass(classLevel);
    setEnrollmentEstimatedFee(estimatedFee);
    setEnrollmentDiscountType(discountType);
    setEnrollmentIsCharity(isCharity);
    navigateToSection('enrollment');
  };

  const isPrintModalActive = Boolean(selectedPrintNotice || pdfExportRequest);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 print:bg-white">
      <div className={isPrintModalActive ? 'no-print flex-1 flex flex-col' : 'flex-1 flex flex-col'}>
        {/* Top Urgent Notice Ticker */}
        <UrgentTicker
          notices={notices}
          instituteConfig={instituteConfig}
          onSelectNotice={(notice) => setSelectedPrintNotice(notice)}
        />

      {/* 3-Zone Top Navigation */}
      <Navbar
        instituteConfig={instituteConfig}
        isAdmin={isAdmin}
        onOpenAdmin={(tab) => openAdminSuite(tab || 'branding')}
        onLogoutAdmin={handleAdminLogout}
        noticeCount={notices.length}
        enrolledStudentCount={totalEnrolledCount}
        activeMainSection={activeMainSection}
        onSelectMainSection={navigateToSection}
      />

      {/* Workspace Section Switcher Bar (Organizes all sections + sub-sections to minimize scrolling) */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-2 px-4 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mr-1">
              Sections:
            </span>
            <button
              type="button"
              onClick={() => navigateToSection('home')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMainSection === 'home'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>1. Overview</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('student-dashboard')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMainSection === 'student-dashboard'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-amber-300 hover:bg-slate-700 hover:text-white border border-amber-500/30'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>2. Student Dashboard (Class-Wise)</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('student-portal')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMainSection === 'student-portal'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>3. Student Portal</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('batches')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMainSection === 'batches'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>4. Batches & Staff ({batches.length})</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('enrollment')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMainSection === 'enrollment'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>
                5. Admission ({totalEnrolledCount}/{instituteConfig.maxStudentCapacity})
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('fee-calculator')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMainSection === 'fee-calculator'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>6. Fees & Charity</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('notice-board')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMainSection === 'notice-board'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>7. Notices ({notices.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              navigateToSection(activeMainSection === 'all' ? 'home' : 'all')
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeMainSection === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              {activeMainSection === 'all'
                ? 'Switch to Focused Tab View'
                : 'View All Sections'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Page Sections (Each section has internal Sub-Section Tabs to minimize scrolling) */}
      <main className="flex-1">
        {/* 1. Hero Section (Sub-Sections: 1. Overview | 2. Study Centres | 3. Why Choose Us & Reviews) */}
        {(activeMainSection === 'home' || activeMainSection === 'all') && (
          <Hero
            instituteConfig={instituteConfig}
            selectedCentreId={selectedCentreId}
            onSelectCentre={setSelectedCentreId}
            totalEnrolledCount={totalEnrolledCount}
            isAdmin={isAdmin}
            onOpenAdminBranding={() => openAdminSuite('branding')}
            onExploreNotices={() => navigateToSection('notice-board')}
            onEnrollClick={() => navigateToSection('enrollment')}
          />
        )}

        {/* 2. Wing-Wise & Class-Wise Student Dashboard (Primary / Secondary / High Class, Fee Ledger & Promotion) */}
        {(activeMainSection === 'student-dashboard' || activeMainSection === 'all') && (
          <StudentDashboard
            students={students}
            batches={batches}
            feePlans={feePlans}
            instituteConfig={instituteConfig}
            isAdmin={isAdmin}
            feeReminders={feeReminders}
            feeReminderSettings={feeReminderSettings}
            onUpdateReminderSettings={setFeeReminderSettings}
            onDispatchFeeReminder={handleDispatchFeeReminder}
            onBulkDispatchReminders={handleBulkDispatchReminders}
            onClearFeeReminders={handleClearFeeReminders}
            onRecordFeePayment={handleRecordFeePayment}
            onClearPreviousYearFee={handleClearPreviousYearFee}
            onPromoteStudent={handlePromoteStudent}
            onBulkPromoteClass={handleBulkPromoteClass}
            onDisenrollStudent={handleDisenrollStudent}
            onReEnrollStudent={handleReEnrollStudent}
            onOpenPdfExport={setPdfExportRequest}
          />
        )}

        {/* 3. Enrolled Student Portal (Sub-Sections: 1. Fee Balance & Chart | 2. Attendance | 3. Timetable) */}
        {(activeMainSection === 'student-portal' || activeMainSection === 'all') && (
          <StudentPortal
            students={students}
            batches={batches}
            staffList={staffList}
            feePlans={feePlans}
            instituteConfig={instituteConfig}
            securityConfig={securityConfig}
            feeReminders={feeReminders}
            feeReminderSettings={feeReminderSettings}
            onAcknowledgeReminder={handleAcknowledgeReminder}
            onSetStudentPassword={handleSetStudentPortalPassword}
            onSecurityLog={addSecurityLog}
            onRecordFeePayment={handleRecordFeePayment}
            onRecordAttendance={handleRecordAttendance}
            onOpenPdfExport={setPdfExportRequest}
          />
        )}

        {/* 4. Batches & Staff (Sub-Sections: 1. Active Batch IDs | 2. Assigned Staff & Faculty) */}
        {(activeMainSection === 'batches' || activeMainSection === 'all') && (
          <CourseBatches
            batches={batches}
            staffList={staffList}
            studyCentres={instituteConfig.studyCentres}
            selectedCentreId={selectedCentreId}
            isAdmin={isAdmin}
            onSelectBatchForInquiry={handleSelectBatchForInquiry}
            onOpenAdminBatches={() => openAdminSuite('batches')}
            onEditBatch={(batch) => {
              setEditingBatch(batch);
              openAdminSuite('batches');
            }}
            onOpenAdminStaff={() => openAdminSuite('staff')}
          />
        )}

        {/* 5. Student Admission & Register (Sub-Sections: 1. Admission Form | 2. Student Register | 3. Policy) */}
        {(activeMainSection === 'enrollment' || activeMainSection === 'all') && (
          <WhatsAppInquiry
            instituteConfig={instituteConfig}
            batches={batches}
            feePlans={feePlans}
            students={students}
            totalEnrolledCount={totalEnrolledCount}
            initialClass={enrollmentClass}
            initialBatchCode={enrollmentBatchCode}
            initialEstimatedFee={enrollmentEstimatedFee}
            initialDiscountType={enrollmentDiscountType}
            initialIsCharity={enrollmentIsCharity}
            isAdmin={isAdmin}
            onInquirySubmitted={handleInquirySubmitted}
            onAddOrUpdateStudent={handleAddOrUpdateStudent}
            onDisenrollStudent={handleDisenrollStudent}
            onReEnrollStudent={handleReEnrollStudent}
            onDeleteStudent={handleDeleteStudent}
            onClearAllStudentsPreData={handleClearAllStudentsPreData}
            onOpenPdfExport={setPdfExportRequest}
          />
        )}

        {/* 6. Class-Wise Tuition Fee Calculator (Sub-Sections: 1. Interactive Calculator | 2. Fee Schedule Table) */}
        {(activeMainSection === 'fee-calculator' || activeMainSection === 'all') && (
          <FeeEstimator
            feePlans={feePlans}
            isAdmin={isAdmin}
            onOpenAdminFees={() => openAdminSuite('batches')}
            onApplyFeeToInquiry={handleApplyFeeToInquiry}
          />
        )}

        {/* 7. Dynamic Notice Board (Sub-Sections: 1. All | 2. Urgent | 3. Exams | 4. Batches | 5. Holidays) */}
        {(activeMainSection === 'notice-board' || activeMainSection === 'all') && (
          <NoticeBoard
            notices={notices}
            onPrintNotice={(notice) => setSelectedPrintNotice(notice)}
            isAdmin={isAdmin}
            onOpenAdminPost={() => openAdminSuite('notices')}
          />
        )}
      </main>

      {/* Multi-Study Centre Directory & Contact Footer */}
      <Footer
        instituteConfig={instituteConfig}
        onOpenAdminBranding={() => openAdminSuite('branding')}
      />
      </div>

      {/* Print Notice Slip Modal */}
      <PrintNoticeModal
        notice={selectedPrintNotice}
        instituteConfig={instituteConfig}
        onClose={() => setSelectedPrintNotice(null)}
      />

      {/* Printable PDF Export Modal (Full Student Register & Individual Student Ledger Cards) */}
      <PrintPdfExportModal
        request={pdfExportRequest}
        allStudents={students}
        feePlans={feePlans}
        instituteConfig={instituteConfig}
        onClose={() => setPdfExportRequest(null)}
      />

      {/* Full 6-Tab Admin Control Suite */}
      <AdminPortalModal
        isOpen={isAdminModalOpen}
        onClose={() => {
          setIsAdminModalOpen(false);
          setEditingBatch(null);
        }}
        isAdmin={isAdmin}
        onVerifyPassword={handleVerifyAdminPassword}
        onCompleteLogin={handleCompleteAdminLogin}
        onLogout={handleAdminLogout}
        securityConfig={securityConfig}
        onUpdateSecurityConfig={setSecurityConfig}
        onUpdateAdminPassword={handleUpdateAdminPassword}
        onSetStudentPortalPassword={handleSetStudentPortalPassword}
        securityLogs={securityLogs}
        onSecurityLog={addSecurityLog}
        instituteConfig={instituteConfig}
        onUpdateInstituteConfig={setInstituteConfig}
        staffList={staffList}
        onAddStaff={handleAddStaff}
        onUpdateStaff={handleUpdateStaff}
        onDeleteStaff={handleDeleteStaff}
        batches={batches}
        onAddBatch={handleAddBatch}
        onUpdateBatch={handleUpdateBatch}
        onDeleteBatch={handleDeleteBatch}
        initialEditingBatch={editingBatch}
        onClearEditingBatch={() => setEditingBatch(null)}
        feePlans={feePlans}
        onUpdateFeePlan={handleUpdateFeePlan}
        students={students}
        onDisenrollStudent={handleDisenrollStudent}
        onReEnrollStudent={handleReEnrollStudent}
        onDeleteStudent={handleDeleteStudent}
        onClearAllStudentsPreData={handleClearAllStudentsPreData}
        onClearStudentsHistoryPreData={handleClearStudentsHistoryPreData}
        onClearSingleStudentPreData={handleClearSingleStudentPreData}
        onRestoreDefaultStudents={handleRestoreDefaultStudents}
        notices={notices}
        onAddNotice={handleAddNotice}
        onDeleteNotice={handleDeleteNotice}
        onTogglePinNotice={handleTogglePinNotice}
        onPreviewNotice={(notice) => {
          setIsAdminModalOpen(false);
          setSelectedPrintNotice(notice);
        }}
        inquiries={inquiries}
        onUpdateInquiryStatus={handleUpdateInquiryStatus}
        onResetData={handleResetData}
        initialTab={adminInitialTab}
      />
    </div>
  );
}
