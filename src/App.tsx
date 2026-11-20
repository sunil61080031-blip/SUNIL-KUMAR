/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
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
  FeeReminderLogItem,
  AutoSuspensionConfig
} from './types';
import {
  createInitialSecurityConfig,
  DEFAULT_ADMIN_PASSWORD,
  generateRandomSalt,
  hashSecret,
  verifySecret
} from './utils/securityHelpers';
import {
  computeConsecutiveMissedMonths,
  computeStudentFinancials,
  DEFAULT_AUTO_SUSPENSION_CONFIG,
  PdfExportRequest,
  reconcileStudentPaidTotals
} from './utils/ledgerHelpers';
import {
  DEFAULT_FEE_REMINDER_SETTINGS,
  computeDaysPastDeadline,
  buildFeeReminderMessage
} from './utils/reminderHelpers';
import {
  AppDataBundle,
  CloudBackupEntry,
  CloudWorkspaceMeta,
  createCloudBackupSnapshot,
  deleteCloudBackupSnapshot,
  fetchCloudWorkspaceMeta,
  listCloudBackups,
  pullWorkspaceFromCloud,
  pushWorkspaceToCloud,
  restoreCloudBackupSnapshot,
  RestoreScopeSelection
} from './utils/backupSyncHelpers';
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
import { CloudUserInfo } from './components/DataSyncBackupTab';
import { LoginSelectionScreen } from './components/LoginSelectionScreen';
import { TeacherDashboard } from './components/TeacherDashboard';
import { FeePaymentSlipSection } from './components/FeePaymentSlipSection';
import {
  applyDashboardThemeToDom,
  DASHBOARD_THEME_STORAGE_KEY,
  DashboardThemeConfig,
  getDashboardThemePreset,
  loadDashboardTheme
} from './utils/dashboardTheme';
import {
  Building2,
  GraduationCap,
  BookOpen,
  UserPlus,
  Calculator,
  Bell,
  Layers,
  LayoutDashboard,
  Cloud,
  LogOut,
  Palette,
  Receipt
} from 'lucide-react';

const ACTIVE_ROLE_SESSION_KEY = 'sntc_active_role_session_v1';

type ActiveRoleSession =
  | { role: 'admin'; method: 'Password' | 'OTP' | '2FA' }
  | { role: 'teacher'; staffId: string; method: 'Password' | 'OTP' }
  | { role: 'student'; studentId: string; method: 'Password' | 'PIN' | 'OTP' }
  | null;

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
const AUTO_CLOUD_SYNC_KEY = 'sntc_auto_cloud_sync_v1';
const AUTO_SUSPENSION_CONFIG_KEY = 'sntc_auto_suspension_config_v1';

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

  // 1B. State: Interactive Admin Dashboard Theme & Appearance Preferences
  const [dashboardTheme, setDashboardTheme] = useState<DashboardThemeConfig>(() =>
    loadDashboardTheme()
  );
  const activeThemePreset = useMemo(
    () => getDashboardThemePreset(dashboardTheme.themeId),
    [dashboardTheme.themeId]
  );

  useEffect(() => {
    applyDashboardThemeToDom(dashboardTheme);
    try {
      localStorage.setItem(
        DASHBOARD_THEME_STORAGE_KEY,
        JSON.stringify(dashboardTheme)
      );
    } catch (e) {
      console.error('Failed persisting dashboard theme', e);
    }
  }, [dashboardTheme]);

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

  // State: Active Role Session (null = show Login Selection Screen)
  const [activeRoleSession, setActiveRoleSession] = useState<ActiveRoleSession>(() => {
    try {
      const saved = sessionStorage.getItem(ACTIVE_ROLE_SESSION_KEY);
      if (saved) return JSON.parse(saved) as ActiveRoleSession;
    } catch {
      return null;
    }
    return null;
  });

  // State: Admin authentication
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      const savedRole = sessionStorage.getItem(ACTIVE_ROLE_SESSION_KEY);
      if (savedRole) {
        const parsed = JSON.parse(savedRole) as ActiveRoleSession;
        return parsed?.role === 'admin';
      }
      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (activeRoleSession) {
        sessionStorage.setItem(
          ACTIVE_ROLE_SESSION_KEY,
          JSON.stringify(activeRoleSession)
        );
      } else {
        sessionStorage.removeItem(ACTIVE_ROLE_SESSION_KEY);
      }
    } catch (e) {
      console.error('Failed persisting active role session', e);
    }
  }, [activeRoleSession]);

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

  // State: Automated Fee-Default Suspension Policy Configuration
  const [autoSuspensionConfig, setAutoSuspensionConfig] = useState<AutoSuspensionConfig>(() => {
    try {
      const saved = localStorage.getItem(AUTO_SUSPENSION_CONFIG_KEY);
      if (saved) {
        return { ...DEFAULT_AUTO_SUSPENSION_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading auto-suspension config', e);
    }
    return DEFAULT_AUTO_SUSPENSION_CONFIG;
  });

  // Modals
  const [selectedPrintNotice, setSelectedPrintNotice] = useState<NoticeItem | null>(null);
  const [pdfExportRequest, setPdfExportRequest] = useState<PdfExportRequest | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTabType>('branding');
  const [editingBatch, setEditingBatch] = useState<BatchItem | null>(null);
  const [selectedSlipStudentId, setSelectedSlipStudentId] = useState<string | undefined>(
    undefined
  );

  // Form Pre-fill
  const [enrollmentClass, setEnrollmentClass] = useState<string>('Class 10th (Matric Target)');
  const [enrollmentBatchCode, setEnrollmentBatchCode] = useState<string | undefined>(undefined);
  const [enrollmentEstimatedFee, setEnrollmentEstimatedFee] = useState<number | undefined>(
    undefined
  );
  const [enrollmentDiscountType, setEnrollmentDiscountType] = useState<FeeDiscountType>('None');
  const [enrollmentIsCharity, setEnrollmentIsCharity] = useState<boolean>(false);

  // Cloud Sync & Backup State
  const [cloudUser, setCloudUser] = useState<CloudUserInfo | null>(null);
  const [cloudSyncState, setCloudSyncState] = useState<
    'idle' | 'syncing' | 'synced' | 'error' | 'offline'
  >('idle');
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);
  const [autoCloudSync, setAutoCloudSync] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTO_CLOUD_SYNC_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [lastSyncedMeta, setLastSyncedMeta] = useState<CloudWorkspaceMeta | null>(null);
  const [cloudRemoteMeta, setCloudRemoteMeta] = useState<CloudWorkspaceMeta | null>(null);
  const [cloudBackups, setCloudBackups] = useState<CloudBackupEntry[]>([]);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const skipNextAutoSyncRef = useRef(false);

  const currentDataBundle: AppDataBundle = useMemo(
    () => ({
      instituteConfig,
      staffList,
      batches,
      feePlans,
      students,
      notices,
      inquiries,
      securityConfig,
      securityLogs,
      feeReminderSettings,
      feeReminders
    }),
    [
      instituteConfig,
      staffList,
      batches,
      feePlans,
      students,
      notices,
      inquiries,
      securityConfig,
      securityLogs,
      feeReminderSettings,
      feeReminders
    ]
  );

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
    setSecurityLogs((prev) => [newItem, ...prev].slice(0, 80));
  };

  useEffect(() => {
    try {
      localStorage.setItem(AUTO_SUSPENSION_CONFIG_KEY, JSON.stringify(autoSuspensionConfig));
    } catch (e) {
      console.error('Failed to sync auto-suspension config', e);
    }
  }, [autoSuspensionConfig]);

  // Refs for the background auto-suspension listener so periodic checks read latest state safely
  const studentsRef = useRef(students);
  const feePlansRef = useRef(feePlans);
  const autoSuspensionConfigRef = useRef(autoSuspensionConfig);

  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  useEffect(() => {
    feePlansRef.current = feePlans;
  }, [feePlans]);

  useEffect(() => {
    autoSuspensionConfigRef.current = autoSuspensionConfig;
  }, [autoSuspensionConfig]);

  const runAutoSuspensionEvaluation = useCallback(
    (options?: { ignoreOverrides?: boolean; manualTrigger?: boolean }) => {
      const cfg = autoSuspensionConfigRef.current;
      if (!cfg.enabled && !options?.manualTrigger) {
        return { suspendedCount: 0, reinstatedCount: 0 };
      }

      const threshold = Math.max(
        1,
        Math.min(12, Math.floor(cfg.consecutiveMissedMonthsThreshold || 3))
      );
      const currentStudents = studentsRef.current;
      const currentFeePlans = feePlansRef.current;
      const todayIso = new Date().toISOString().split('T')[0];
      const nowStamp = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });

      let hasStudentChanges = false;
      let suspendedCount = 0;
      let reinstatedCount = 0;
      const newAuditLogs: SecurityLogItem[] = [];

      const nextStudents = currentStudents.map((stu) => {
        if (stu.enrollmentStatus === 'Disenrolled') return stu;

        const missed = computeConsecutiveMissedMonths(stu, currentFeePlans, {
          includePartialAsMissed: cfg.includePartialAsMissed
        });

        if (missed.isExempt) {
          if (stu.suspensionOverrideUntilCount !== undefined) {
            hasStudentChanges = true;
            return { ...stu, suspensionOverrideUntilCount: undefined };
          }
          return stu;
        }

        // Suspend active student when consecutive missed payments reach configured threshold
        if (
          stu.enrollmentStatus !== 'Suspended' &&
          missed.consecutiveMissedMonths >= threshold
        ) {
          if (
            !options?.ignoreOverrides &&
            typeof stu.suspensionOverrideUntilCount === 'number' &&
            missed.consecutiveMissedMonths <= stu.suspensionOverrideUntilCount
          ) {
            return stu;
          }

          hasStudentChanges = true;
          suspendedCount += 1;
          const monthsSummary = missed.missedMonthLabels.join(', ');
          const reason = `Auto-suspended: ${missed.consecutiveMissedMonths} consecutive missed monthly payment${
            missed.consecutiveMissedMonths === 1 ? '' : 's'
          } (${monthsSummary}) reached policy threshold of ${threshold}.`;

          newAuditLogs.push({
            id: `sec-susp-${Date.now()}-${suspendedCount}-${Math.floor(Math.random() * 1000)}`,
            timestamp: nowStamp,
            actor: options?.manualTrigger
              ? 'Auto-Suspension Policy (Manual Scan)'
              : 'Auto-Suspension Listener',
            event: `Auto-suspended ${stu.studentName} (${stu.studentIdCode}) — ${missed.consecutiveMissedMonths} consecutive missed payments (${monthsSummary}) [Threshold: ${threshold}]`,
            method: 'System',
            status: 'Suspended'
          });

          return {
            ...stu,
            enrollmentStatus: 'Suspended' as const,
            suspendedDate: todayIso,
            suspensionReason: reason,
            suspensionOverrideUntilCount: undefined
          };
        }

        // Auto-reinstate suspended student if arrears were cleared below threshold
        if (
          stu.enrollmentStatus === 'Suspended' &&
          cfg.autoReinstateOnPayment &&
          missed.consecutiveMissedMonths < threshold
        ) {
          hasStudentChanges = true;
          reinstatedCount += 1;

          newAuditLogs.push({
            id: `sec-reinst-${Date.now()}-${reinstatedCount}-${Math.floor(Math.random() * 1000)}`,
            timestamp: nowStamp,
            actor: 'Auto-Suspension Listener',
            event: `Auto-reinstated ${stu.studentName} (${stu.studentIdCode}) to Enrolled — consecutive missed payments dropped to ${missed.consecutiveMissedMonths} (below threshold ${threshold})`,
            method: 'System',
            status: 'Success'
          });

          return {
            ...stu,
            enrollmentStatus: 'Enrolled' as const,
            suspendedDate: undefined,
            suspensionReason: undefined,
            suspensionOverrideUntilCount: undefined
          };
        }

        // Clear stale manual override once student's missed streak falls below threshold
        if (
          stu.enrollmentStatus !== 'Suspended' &&
          missed.consecutiveMissedMonths < threshold &&
          stu.suspensionOverrideUntilCount !== undefined
        ) {
          hasStudentChanges = true;
          return { ...stu, suspensionOverrideUntilCount: undefined };
        }

        return stu;
      });

      if (hasStudentChanges) {
        studentsRef.current = nextStudents;
        setStudents(nextStudents);
      }

      if (newAuditLogs.length > 0) {
        setSecurityLogs((prev) => [...newAuditLogs, ...prev].slice(0, 80));
      }

      return { suspendedCount, reinstatedCount };
    },
    []
  );

  // Reactive background listener: evaluates whenever student ledgers, fee plans, or policy config change
  useEffect(() => {
    if (!autoSuspensionConfig.enabled) return;
    runAutoSuspensionEvaluation();
  }, [students, feePlans, autoSuspensionConfig, runAutoSuspensionEvaluation]);

  // Periodic background listener: continuously monitors enrollment compliance on the configured interval
  useEffect(() => {
    if (!autoSuspensionConfig.enabled) return;
    const intervalMs = Math.max(5, autoSuspensionConfig.checkIntervalSeconds || 15) * 1000;
    const timer = window.setInterval(() => {
      runAutoSuspensionEvaluation();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [
    autoSuspensionConfig.enabled,
    autoSuspensionConfig.checkIntervalSeconds,
    runAutoSuspensionEvaluation
  ]);

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
    setActiveRoleSession({ role: 'admin', method });
    setActiveMainSection('student-dashboard');
    addSecurityLog('Admin', `Admin Control Suite unlocked via ${method}`, method, 'Success');
  };

  const handleTeacherAuthenticated = (
    staff: StaffMember,
    method: 'Password' | 'OTP'
  ) => {
    setIsAdmin(false);
    setActiveRoleSession({ role: 'teacher', staffId: staff.id, method });
  };

  const handleStudentAuthenticated = (
    student: StudentRecord,
    method: 'Password' | 'PIN' | 'OTP'
  ) => {
    setIsAdmin(false);
    setActiveRoleSession({ role: 'student', studentId: student.id, method });
  };

  const handleSwitchLoginRole = () => {
    setIsAdmin(false);
    setIsAdminModalOpen(false);
    setActiveRoleSession(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setActiveRoleSession(null);
    addSecurityLog('Admin', 'Admin signed out and locked suite', 'System', 'Success');
  };

  const openAdminSuite = (tab: AdminTabType = 'branding') => {
    setAdminInitialTab(tab);
    setIsAdminModalOpen(true);
  };

  // Student Lifecycle Handlers (Enroll / Edit / Disenroll / Re-enroll)
  const handleAddOrUpdateStudent = (student: StudentRecord) => {
    const existing = students.find((s) => s.id === student.id);

    const existingWasSuspended = existing?.enrollmentStatus === 'Suspended';
    const nextIsSuspended = student.enrollmentStatus === 'Suspended';
    const currentMissedForStudent = computeConsecutiveMissedMonths(student, feePlans, {
      includePartialAsMissed: autoSuspensionConfig.includePartialAsMissed
    });
    const todayIso = new Date().toISOString().split('T')[0];

    const normalizedStudent: StudentRecord = {
      ...student,
      suspendedDate: nextIsSuspended ? student.suspendedDate || todayIso : undefined,
      suspensionReason: nextIsSuspended
        ? student.suspensionReason || 'Manually suspended by Administrator'
        : undefined,
      suspensionOverrideUntilCount:
        existingWasSuspended && !nextIsSuspended && student.enrollmentStatus !== 'Disenrolled'
          ? currentMissedForStudent.consecutiveMissedMonths >=
            autoSuspensionConfig.consecutiveMissedMonthsThreshold
            ? currentMissedForStudent.consecutiveMissedMonths
            : undefined
          : nextIsSuspended
          ? undefined
          : student.suspensionOverrideUntilCount
    };

    setStudents((prev) => {
      if (existing) {
        return prev.map((s) => (s.id === normalizedStudent.id ? { ...s, ...normalizedStudent } : s));
      }
      return [normalizedStudent, ...prev];
    });

    if (!existing) {
      if (normalizedStudent.enrollmentStatus !== 'Disenrolled') {
        setBatches((prev) =>
          prev.map((b) =>
            b.batchCode === normalizedStudent.batchCode
              ? { ...b, enrolledCount: Math.min(b.totalSeats, b.enrolledCount + 1) }
              : b
          )
        );
      }
      return;
    }

    // Reconcile batch seat counts only when batch or active status actually changed
    const wasActive = existing.enrollmentStatus !== 'Disenrolled';
    const isNowActive = normalizedStudent.enrollmentStatus !== 'Disenrolled';
    const batchChanged = existing.batchCode !== normalizedStudent.batchCode;

    if (batchChanged || wasActive !== isNowActive) {
      setBatches((prev) =>
        prev.map((b) => {
          let nextCount = b.enrolledCount;
          if (wasActive && b.batchCode === existing.batchCode && (!isNowActive || batchChanged)) {
            nextCount = Math.max(0, nextCount - 1);
          }
          if (
            isNowActive &&
            b.batchCode === normalizedStudent.batchCode &&
            (!wasActive || batchChanged)
          ) {
            nextCount = Math.min(b.totalSeats, nextCount + 1);
          }
          return nextCount === b.enrolledCount ? b : { ...b, enrolledCount: nextCount };
        })
      );
    }

    if (!existingWasSuspended && nextIsSuspended) {
      addSecurityLog(
        'Admin',
        `Manually suspended ${normalizedStudent.studentName} (${normalizedStudent.studentIdCode})`,
        'System',
        'Suspended'
      );
    } else if (existingWasSuspended && !nextIsSuspended) {
      addSecurityLog(
        'Admin',
        `Reinstated ${normalizedStudent.studentName} (${normalizedStudent.studentIdCode}) to ${normalizedStudent.enrollmentStatus}`,
        'System',
        'Success'
      );
    } else {
      addSecurityLog(
        'Admin',
        `Updated student details for ${normalizedStudent.studentName} (${normalizedStudent.studentIdCode})`,
        'System',
        'Success'
      );
    }
  };

  const handleReinstateSuspendedStudent = (studentId: string, overrideNote?: string) => {
    const target = students.find((s) => s.id === studentId);
    if (!target) return;
    const missed = computeConsecutiveMissedMonths(target, feePlans, {
      includePartialAsMissed: autoSuspensionConfig.includePartialAsMissed
    });
    const overrideCount =
      missed.consecutiveMissedMonths >= autoSuspensionConfig.consecutiveMissedMonthsThreshold
        ? missed.consecutiveMissedMonths
        : undefined;
    const trimmedNote = overrideNote?.trim();

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              enrollmentStatus: 'Enrolled',
              suspendedDate: undefined,
              suspensionReason: undefined,
              suspensionOverrideUntilCount: overrideCount
            }
          : s
      )
    );

    addSecurityLog(
      'Admin (Manual Override)',
      `Manual suspension override for ${target.studentName} (${target.studentIdCode}) — status restored to Enrolled${
        trimmedNote ? ` · Note: ${trimmedNote}` : ''
      }${
        overrideCount ? ` (override active until >${overrideCount} missed months)` : ''
      }`,
      'System',
      'Success'
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
        // Prevent duplicate payment ID or duplicate receipt number
        const existingPayments = s.feePayments || [];
        if (
          existingPayments.some(
            (p) => p.id === payment.id || p.receiptNo === payment.receiptNo
          )
        ) {
          return s;
        }
        const updatedPayments = [payment, ...existingPayments];
        const reconciled = reconcileStudentPaidTotals(s, updatedPayments);
        return {
          ...s,
          paidAmount: reconciled.paidAmount,
          previousYearClearedAmount: reconciled.previousYearClearedAmount,
          feePayments: updatedPayments
        };
      })
    );
  };

  const handleEditOrCancelPayment = (
    studentId: string,
    paymentId: string,
    update: {
      action: 'Edited' | 'Cancelled';
      reason: string;
      newAmount?: number;
      newMode?: FeePaymentItem['mode'];
      newTransactionId?: string;
      newRemarks?: string;
    }
  ) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const existingPayments = s.feePayments || [];
        const updatedPayments = existingPayments.map((p) => {
          if (p.id !== paymentId) return p;
          const auditEntry = {
            id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            timestamp: new Date().toLocaleString('en-IN'),
            action: update.action,
            actor: instituteConfig.founder,
            reason: update.reason,
            previousAmount: p.amount,
            newAmount: update.action === 'Edited' ? update.newAmount : 0
          };
          const nextHistory = [...(p.auditHistory || []), auditEntry];

          if (update.action === 'Cancelled') {
            return {
              ...p,
              status: 'Cancelled' as const,
              auditHistory: nextHistory
            };
          }

          const nextAmt =
            typeof update.newAmount === 'number' ? update.newAmount : p.amount;
          const nextSessionPart = p.isPreviousYearClearance
            ? 0
            : typeof p.prevYearClearedPart === 'number'
            ? Math.max(0, nextAmt - Math.min(nextAmt, p.prevYearClearedPart))
            : nextAmt;
          const nextPrevPart = p.isPreviousYearClearance
            ? nextAmt
            : typeof p.prevYearClearedPart === 'number'
            ? Math.min(nextAmt, p.prevYearClearedPart)
            : 0;
          const nextBreakdown = p.feeBreakdown
            ? {
                ...p.feeBreakdown,
                currentPayment: nextAmt,
                remainingDues: Math.max(
                  0,
                  p.feeBreakdown.totalPayable -
                    p.feeBreakdown.previouslyPaid -
                    nextAmt
                )
              }
            : undefined;
          const nextPaymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid' =
            nextBreakdown
              ? nextBreakdown.remainingDues === 0
                ? 'Paid'
                : nextAmt + nextBreakdown.previouslyPaid > 0
                ? 'Partially Paid'
                : 'Unpaid'
              : p.paymentStatus || 'Paid';

          return {
            ...p,
            amount: nextAmt,
            sessionPaidPart: nextSessionPart,
            prevYearClearedPart: nextPrevPart,
            mode: update.newMode || p.mode,
            transactionId:
              update.newTransactionId !== undefined
                ? update.newTransactionId || undefined
                : p.transactionId,
            remarks:
              update.newRemarks !== undefined
                ? update.newRemarks || undefined
                : p.remarks,
            feeBreakdown: nextBreakdown,
            paymentStatus: nextPaymentStatus,
            isPartialPayment: nextPaymentStatus === 'Partially Paid',
            auditHistory: nextHistory
          };
        });

        const reconciled = reconcileStudentPaidTotals(s, updatedPayments);
        return {
          ...s,
          paidAmount: reconciled.paidAmount,
          previousYearClearedAmount: reconciled.previousYearClearedAmount,
          feePayments: updatedPayments
        };
      })
    );
    addSecurityLog(
      instituteConfig.founder,
      `${update.action} fee receipt (${update.reason})`,
      'System',
      'Success'
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

  // Persist Auto-Sync preference
  useEffect(() => {
    try {
      localStorage.setItem(AUTO_CLOUD_SYNC_KEY, autoCloudSync ? 'true' : 'false');
    } catch {
      // ignore storage quota errors
    }
  }, [autoCloudSync]);

  const refreshCloudMetadata = useCallback(async (uid: string) => {
    setIsCloudLoading(true);
    setCloudSyncError(null);
    try {
      const [meta, backups] = await Promise.all([
        fetchCloudWorkspaceMeta(uid),
        listCloudBackups(uid)
      ]);
      setCloudRemoteMeta(meta);
      setCloudBackups(backups);
      if (meta) {
        setCloudSyncState((prev) => (prev === 'syncing' ? prev : 'synced'));
      }
    } catch (err) {
      setCloudSyncState('error');
      setCloudSyncError(
        err instanceof Error ? err.message : 'Unable to fetch cloud sync metadata.'
      );
    } finally {
      setIsCloudLoading(false);
    }
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const info: CloudUserInfo = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        };
        setCloudUser(info);
        refreshCloudMetadata(user.uid);
      } else {
        setCloudUser(null);
        setCloudRemoteMeta(null);
        setLastSyncedMeta(null);
        setCloudBackups([]);
        setCloudSyncState('idle');
      }
    });
    return () => unsub();
  }, [refreshCloudMetadata]);

  const applyRestoredDataBundle = useCallback(
    (
      data: AppDataBundle,
      scope: RestoreScopeSelection,
      sourceLabel: string
    ) => {
      skipNextAutoSyncRef.current = true;
      if (scope.instituteAndCentres && data.instituteConfig) {
        setInstituteConfig(data.instituteConfig);
      }
      if (scope.studentsAndLedgers && Array.isArray(data.students)) {
        setStudents(data.students);
      }
      if (scope.batchesAndFees) {
        if (Array.isArray(data.batches)) setBatches(data.batches);
        if (Array.isArray(data.feePlans) && data.feePlans.length > 0) {
          setFeePlans(data.feePlans);
        }
      }
      if (scope.staffAndNotices) {
        if (Array.isArray(data.staffList)) setStaffList(data.staffList);
        if (Array.isArray(data.notices)) setNotices(data.notices);
        if (Array.isArray(data.inquiries)) setInquiries(data.inquiries);
      }
      if (scope.securityAndReminders) {
        if (data.securityConfig) setSecurityConfig(data.securityConfig);
        if (Array.isArray(data.securityLogs)) setSecurityLogs(data.securityLogs);
        if (data.feeReminderSettings) {
          setFeeReminderSettings(data.feeReminderSettings);
        }
        if (Array.isArray(data.feeReminders)) setFeeReminders(data.feeReminders);
      }
      addSecurityLog(
        'Admin',
        `Restored app data from ${sourceLabel}`,
        'System',
        'Success'
      );
    },
    []
  );

  const handleCloudSignInGoogle = async () => {
    setIsCloudLoading(true);
    setCloudSyncError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      addSecurityLog(
        cred.user.email || 'Admin',
        'Connected Google account for Online Cloud Sync',
        'System',
        'Success'
      );
    } catch (err) {
      setCloudSyncError(
        err instanceof Error
          ? err.message
          : 'Google sign-in popup was closed or blocked.'
      );
    } finally {
      setIsCloudLoading(false);
    }
  };

  const handleCloudSignOutGoogle = async () => {
    setIsCloudLoading(true);
    try {
      await signOut(auth);
      setAutoCloudSync(false);
      addSecurityLog('Admin', 'Disconnected Google Cloud Sync', 'System', 'Reset');
    } catch (err) {
      setCloudSyncError(
        err instanceof Error ? err.message : 'Could not sign out cleanly.'
      );
    } finally {
      setIsCloudLoading(false);
    }
  };

  const handlePushToCloud = useCallback(async () => {
    if (!cloudUser) return;
    setCloudSyncState('syncing');
    setCloudSyncError(null);
    try {
      const meta = await pushWorkspaceToCloud(
        cloudUser.uid,
        cloudUser.email || 'admin',
        currentDataBundle
      );
      setLastSyncedMeta(meta);
      setCloudRemoteMeta(meta);
      setCloudSyncState('synced');
      addSecurityLog(
        cloudUser.email || 'Admin',
        `Pushed workspace sync (${meta.studentCount} students) to Cloud`,
        'System',
        'Success'
      );
    } catch (err) {
      setCloudSyncState('error');
      setCloudSyncError(
        err instanceof Error ? err.message : 'Failed to push data to cloud.'
      );
    }
  }, [cloudUser, currentDataBundle]);

  const handlePullFromCloud = async () => {
    if (!cloudUser) return;
    setIsCloudLoading(true);
    setCloudSyncState('syncing');
    setCloudSyncError(null);
    try {
      const res = await pullWorkspaceFromCloud(cloudUser.uid);
      if (!res) {
        setCloudSyncError('No synced cloud workspace found for this account yet.');
        setCloudSyncState('idle');
        return;
      }
      applyRestoredDataBundle(
        res.bundle,
        {
          instituteAndCentres: true,
          studentsAndLedgers: true,
          batchesAndFees: true,
          staffAndNotices: true,
          securityAndReminders: true
        },
        'Cloud Sync Workspace'
      );
      setLastSyncedMeta(res.meta);
      setCloudRemoteMeta(res.meta);
      setCloudSyncState('synced');
    } catch (err) {
      setCloudSyncState('error');
      setCloudSyncError(
        err instanceof Error ? err.message : 'Failed to pull data from cloud.'
      );
    } finally {
      setIsCloudLoading(false);
    }
  };

  const handleCreateCloudBackup = async (label: string) => {
    if (!cloudUser) return;
    setIsCloudLoading(true);
    setCloudSyncError(null);
    try {
      const created = await createCloudBackupSnapshot(
        cloudUser.uid,
        cloudUser.email || 'admin',
        label,
        currentDataBundle
      );
      setCloudBackups((prev) => [created, ...prev]);
      addSecurityLog(
        cloudUser.email || 'Admin',
        `Created Cloud Backup "${created.label}" (${created.studentCount} students)`,
        'System',
        'Success'
      );
    } catch (err) {
      setCloudSyncError(
        err instanceof Error ? err.message : 'Failed to create cloud backup.'
      );
    } finally {
      setIsCloudLoading(false);
    }
  };

  const handleRestoreCloudBackup = async (backupId: string, label: string) => {
    if (!cloudUser) return;
    setIsCloudLoading(true);
    setCloudSyncError(null);
    try {
      const restored = await restoreCloudBackupSnapshot(cloudUser.uid, backupId);
      applyRestoredDataBundle(
        restored,
        {
          instituteAndCentres: true,
          studentsAndLedgers: true,
          batchesAndFees: true,
          staffAndNotices: true,
          securityAndReminders: true
        },
        `Cloud Backup (${label})`
      );
      setCloudSyncState('synced');
    } catch (err) {
      setCloudSyncError(
        err instanceof Error ? err.message : 'Failed to restore cloud backup.'
      );
    } finally {
      setIsCloudLoading(false);
    }
  };

  const handleDeleteCloudBackup = async (backupId: string) => {
    if (!cloudUser) return;
    setIsCloudLoading(true);
    setCloudSyncError(null);
    try {
      await deleteCloudBackupSnapshot(cloudUser.uid, backupId);
      setCloudBackups((prev) => prev.filter((b) => b.backupId !== backupId));
    } catch (err) {
      setCloudSyncError(
        err instanceof Error ? err.message : 'Failed to delete cloud backup.'
      );
    } finally {
      setIsCloudLoading(false);
    }
  };

  // Debounced background auto-sync when signed in & Auto-Sync enabled
  useEffect(() => {
    if (!cloudUser || !cloudUser.emailVerified || !autoCloudSync) return;
    if (skipNextAutoSyncRef.current) {
      skipNextAutoSyncRef.current = false;
      return;
    }

    const timer = window.setTimeout(async () => {
      setCloudSyncState('syncing');
      setCloudSyncError(null);
      try {
        const meta = await pushWorkspaceToCloud(
          cloudUser.uid,
          cloudUser.email || 'admin',
          currentDataBundle
        );
        setLastSyncedMeta(meta);
        setCloudRemoteMeta(meta);
        setCloudSyncState('synced');
      } catch (err) {
        setCloudSyncState('error');
        setCloudSyncError(
          err instanceof Error ? err.message : 'Auto-sync to cloud failed.'
        );
      }
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [cloudUser, autoCloudSync, currentDataBundle]);

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

  // 1. Login Selection Screen (Initial View when no role is signed in)
  if (!activeRoleSession) {
    return (
      <LoginSelectionScreen
        instituteConfig={instituteConfig}
        securityConfig={securityConfig}
        staffList={staffList}
        students={students}
        onVerifyAdminPassword={handleVerifyAdminPassword}
        onAdminAuthenticated={handleCompleteAdminLogin}
        onTeacherAuthenticated={handleTeacherAuthenticated}
        onStudentAuthenticated={handleStudentAuthenticated}
        onSecurityLog={addSecurityLog}
      />
    );
  }

  // 2. Role-Based Teacher Dashboard
  if (activeRoleSession.role === 'teacher') {
    const activeTeacher =
      staffList.find((s) => s.id === activeRoleSession.staffId) || staffList[0];

    if (!activeTeacher) {
      return (
        <LoginSelectionScreen
          instituteConfig={instituteConfig}
          securityConfig={securityConfig}
          staffList={staffList}
          students={students}
          onVerifyAdminPassword={handleVerifyAdminPassword}
          onAdminAuthenticated={handleCompleteAdminLogin}
          onTeacherAuthenticated={handleTeacherAuthenticated}
          onStudentAuthenticated={handleStudentAuthenticated}
          onSecurityLog={addSecurityLog}
        />
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 print:bg-white">
        <div className={isPrintModalActive ? 'no-print' : ''}>
          <TeacherDashboard
            staff={activeTeacher}
            instituteConfig={instituteConfig}
            batches={batches}
            students={students}
            feePlans={feePlans}
            notices={notices}
            feeReminderSettings={feeReminderSettings}
            onRecordAttendance={handleRecordAttendance}
            onAddNotice={handleAddNotice}
            onPrintNotice={(notice) => setSelectedPrintNotice(notice)}
            onOpenPdfExport={setPdfExportRequest}
            onLogout={handleSwitchLoginRole}
          />
        </div>
        <PrintNoticeModal
          notice={selectedPrintNotice}
          instituteConfig={instituteConfig}
          onClose={() => setSelectedPrintNotice(null)}
        />
        <PrintPdfExportModal
          request={pdfExportRequest}
          allStudents={students}
          feePlans={feePlans}
          instituteConfig={instituteConfig}
          onClose={() => setPdfExportRequest(null)}
        />
      </div>
    );
  }

  // 3. Role-Based Student Dashboard
  if (activeRoleSession.role === 'student') {
    const activeStudent = students.find((s) => s.id === activeRoleSession.studentId);

    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 print:bg-white">
        <div className={isPrintModalActive ? 'no-print flex-1 flex flex-col' : 'flex-1 flex flex-col'}>
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-display text-base sm:text-lg font-extrabold text-slate-900 truncate">
                  Shiksha Niketan · Student Portal
                </h1>
                <p className="text-xs text-slate-500 truncate">
                  {activeStudent
                    ? `${activeStudent.studentName} · ${activeStudent.studentIdCode} · ${activeStudent.classLevel}`
                    : 'Enrolled Student Session'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSwitchLoginRole}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch Login</span>
              </button>
            </div>
          </header>

          <main className="flex-1">
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
              initialLoggedInStudentId={activeRoleSession.studentId}
              initialVerifiedMethod={activeRoleSession.method}
              onExternalLogout={handleSwitchLoginRole}
            />
          </main>
        </div>

        <PrintNoticeModal
          notice={selectedPrintNotice}
          instituteConfig={instituteConfig}
          onClose={() => setSelectedPrintNotice(null)}
        />
        <PrintPdfExportModal
          request={pdfExportRequest}
          allStudents={students}
          feePlans={feePlans}
          instituteConfig={instituteConfig}
          onClose={() => setPdfExportRequest(null)}
        />
      </div>
    );
  }

  // 4. Role-Based Administrator Full Management Suite
  return (
    <div className="min-h-screen flex flex-col dash-themed-canvas text-slate-800 print:bg-white">
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
        onSwitchLoginRole={handleSwitchLoginRole}
        noticeCount={notices.length}
        enrolledStudentCount={totalEnrolledCount}
        activeMainSection={activeMainSection}
        onSelectMainSection={navigateToSection}
        cloudSyncState={cloudSyncState}
        cloudUserEmail={cloudUser?.email || null}
      />

      {/* Workspace Section Switcher Bar (Organizes all sections + sub-sections to minimize scrolling) */}
      <div className="dash-themed-bar text-white border-b py-2 px-4 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="text-[11px] font-bold uppercase tracking-wider mr-1"
              style={{ color: activeThemePreset.barLabelText }}
            >
              Sections:
            </span>
            <button
              type="button"
              onClick={() => navigateToSection('home')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMainSection === 'home'
                  ? 'text-white shadow-xs'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white'
              }`}
              style={
                activeMainSection === 'home'
                  ? { backgroundColor: activeThemePreset.accentHex }
                  : undefined
              }
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>1. Overview</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('student-dashboard')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMainSection === 'student-dashboard'
                  ? 'text-white shadow-xs'
                  : 'bg-white/10 text-amber-200 hover:bg-white/20 hover:text-white border border-amber-400/30'
              }`}
              style={
                activeMainSection === 'student-dashboard'
                  ? { backgroundColor: activeThemePreset.accentHex }
                  : undefined
              }
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>2. Student Dashboard (Class-Wise)</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('student-portal')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMainSection === 'student-portal'
                  ? 'text-white shadow-xs'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white'
              }`}
              style={
                activeMainSection === 'student-portal'
                  ? { backgroundColor: activeThemePreset.accentHex }
                  : undefined
              }
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>3. Student Portal</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('batches')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMainSection === 'batches'
                  ? 'text-white shadow-xs'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white'
              }`}
              style={
                activeMainSection === 'batches'
                  ? { backgroundColor: activeThemePreset.accentHex }
                  : undefined
              }
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>4. Batches & Staff ({batches.length})</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('enrollment')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMainSection === 'enrollment'
                  ? 'text-white shadow-xs'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white'
              }`}
              style={
                activeMainSection === 'enrollment'
                  ? { backgroundColor: activeThemePreset.accentHex }
                  : undefined
              }
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>
                5. Admission ({totalEnrolledCount}/{instituteConfig.maxStudentCapacity})
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('fee-slip')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMainSection === 'fee-slip'
                  ? 'bg-[#7a1426] text-white shadow-xs'
                  : 'bg-white/10 text-rose-200 hover:bg-white/20 hover:text-white border border-rose-400/35'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Fee Payment Slip</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('fee-calculator')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMainSection === 'fee-calculator'
                  ? 'text-white shadow-xs'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white'
              }`}
              style={
                activeMainSection === 'fee-calculator'
                  ? { backgroundColor: activeThemePreset.accentHex }
                  : undefined
              }
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>6. Fees & Charity</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('notice-board')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMainSection === 'notice-board'
                  ? 'text-white shadow-xs'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white'
              }`}
              style={
                activeMainSection === 'notice-board'
                  ? { backgroundColor: activeThemePreset.accentHex }
                  : undefined
              }
            >
              <Bell className="w-3.5 h-3.5" />
              <span>7. Notices ({notices.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openAdminSuite('theme')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer bg-white/10 hover:bg-white/20 text-white border border-white/20 whitespace-nowrap"
              title="Customize Dashboard Theme & Interactive Look"
            >
              <Palette
                className="w-3.5 h-3.5"
                style={{ color: activeThemePreset.barLabelText }}
              />
              <span>Theme: {activeThemePreset.name}</span>
            </button>

            <button
              type="button"
              onClick={() => openAdminSuite('backup-sync')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border whitespace-nowrap ${
                cloudUser
                  ? 'bg-emerald-900/80 text-emerald-200 border-emerald-600 hover:bg-emerald-800'
                  : 'bg-white/10 text-sky-200 border-white/15 hover:bg-white/20'
              }`}
              title="Open Online Cloud Sync, Backup & Restore"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>
                {cloudSyncState === 'syncing'
                  ? 'Syncing...'
                  : cloudUser
                  ? 'Synced · Backup'
                  : 'Sync & Backup'}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                navigateToSection(activeMainSection === 'all' ? 'home' : 'all')
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeMainSection === 'all'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-white/10 text-amber-200 hover:bg-white/20 border border-white/15'
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
            onOpenFeeSlipForStudent={(studentId) => {
              setSelectedSlipStudentId(studentId);
              navigateToSection('fee-slip');
            }}
          />
        )}

        {/* 2B. Dynamic Official Tuition Fee Payment Slip (Synchronized with Student Ledger) */}
        {(activeMainSection === 'fee-slip' || activeMainSection === 'all') && (
          <FeePaymentSlipSection
            students={students}
            batches={batches}
            feePlans={feePlans}
            instituteConfig={instituteConfig}
            isAdmin={isAdmin}
            initialStudentId={selectedSlipStudentId}
            onRecordFeePayment={handleRecordFeePayment}
            onEditOrCancelPayment={handleEditOrCancelPayment}
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
        onUpdateStudent={handleAddOrUpdateStudent}
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
        dataBundle={currentDataBundle}
        cloudUser={cloudUser}
        cloudSyncState={cloudSyncState}
        cloudSyncError={cloudSyncError}
        autoCloudSync={autoCloudSync}
        onToggleAutoCloudSync={setAutoCloudSync}
        lastSyncedMeta={lastSyncedMeta}
        cloudRemoteMeta={cloudRemoteMeta}
        cloudBackups={cloudBackups}
        isCloudLoading={isCloudLoading}
        onSignInGoogle={handleCloudSignInGoogle}
        onSignOutGoogle={handleCloudSignOutGoogle}
        onPushToCloud={handlePushToCloud}
        onPullFromCloud={handlePullFromCloud}
        onCreateCloudBackup={handleCreateCloudBackup}
        onRestoreCloudBackup={handleRestoreCloudBackup}
        onDeleteCloudBackup={handleDeleteCloudBackup}
        onRefreshCloudState={async () => {
          if (cloudUser) await refreshCloudMetadata(cloudUser.uid);
        }}
        onApplyRestoreBundle={applyRestoredDataBundle}
        dashboardTheme={dashboardTheme}
        onUpdateDashboardTheme={setDashboardTheme}
        autoSuspensionConfig={autoSuspensionConfig}
        onUpdateAutoSuspensionConfig={setAutoSuspensionConfig}
        onRunAutoSuspensionScan={() =>
          runAutoSuspensionEvaluation({ ignoreOverrides: false, manualTrigger: true })
        }
        onReinstateStudent={handleReinstateSuspendedStudent}
      />
    </div>
  );
}
