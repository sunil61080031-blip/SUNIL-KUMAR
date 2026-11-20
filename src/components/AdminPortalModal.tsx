import React, { useState, useEffect } from 'react';
import {
  NoticeItem,
  InquiryItem,
  NoticeCategory,
  InstituteConfig,
  StudyCentre,
  StaffMember,
  BatchItem,
  BatchShift,
  FeePlan,
  StudentRecord,
  SecurityConfig,
  SecurityLogItem,
  AuthSecurityMode,
  FeeDiscountType,
  EnrollmentStatus,
  AutoSuspensionConfig
} from '../types';
import { computeConsecutiveMissedMonths } from '../utils/ledgerHelpers';
import { DISCOUNT_OPTIONS } from '../data/seedData';
import {
  X,
  Lock,
  ShieldCheck,
  PlusCircle,
  Users,
  Trash2,
  Pin,
  Download,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Building2,
  Briefcase,
  BookOpen,
  Bell,
  Upload,
  Save,
  RotateCcw,
  Pencil,
  KeyRound,
  Smartphone,
  Mail,
  Clock,
  RefreshCw,
  ShieldAlert,
  Shield,
  Cloud,
  Search,
  Palette
} from 'lucide-react';
import {
  DEFAULT_ADMIN_PASSWORD,
  evaluatePasswordStrength,
  generateSixDigitOtp,
  maskEmail,
  maskPhone
} from '../utils/securityHelpers';
import { CloudUserInfo, DataSyncBackupTab } from './DataSyncBackupTab';
import {
  AppDataBundle,
  CloudBackupEntry,
  CloudWorkspaceMeta,
  RestoreScopeSelection
} from '../utils/backupSyncHelpers';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { DashboardThemeTab } from './DashboardThemeTab';
import {
  DashboardThemeConfig,
  getDashboardThemePreset
} from '../utils/dashboardTheme';
import { SuspendedStudentsDashboardTab } from './SuspendedStudentsDashboardTab';

export type AdminTabType =
  | 'branding'
  | 'students'
  | 'staff'
  | 'batches'
  | 'notices'
  | 'security'
  | 'backup-sync'
  | 'theme'
  | 'suspended';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onVerifyPassword: (pass: string) => Promise<boolean>;
  onCompleteLogin: (method: 'Password' | 'OTP' | '2FA') => void;
  onLogout: () => void;
  securityConfig: SecurityConfig;
  onUpdateSecurityConfig: (config: SecurityConfig) => void;
  onUpdateAdminPassword: (newPassword: string) => Promise<void>;
  onSetStudentPortalPassword: (studentId: string, newPassword: string) => Promise<void>;
  securityLogs: SecurityLogItem[];
  onSecurityLog: (
    actor: string,
    event: string,
    method: SecurityLogItem['method'],
    status: SecurityLogItem['status']
  ) => void;
  instituteConfig: InstituteConfig;
  onUpdateInstituteConfig: (config: InstituteConfig) => void;
  staffList: StaffMember[];
  onAddStaff: (staff: StaffMember) => void;
  onUpdateStaff: (staff: StaffMember) => void;
  onDeleteStaff: (id: string) => void;
  batches: BatchItem[];
  onAddBatch: (batch: BatchItem) => void;
  onUpdateBatch: (batch: BatchItem) => void;
  onDeleteBatch: (id: string) => void;
  initialEditingBatch?: BatchItem | null;
  onClearEditingBatch?: () => void;
  feePlans: FeePlan[];
  onUpdateFeePlan: (classNum: number, monthly: number, quarterly: number, reg: number) => void;
  students: StudentRecord[];
  onUpdateStudent: (student: StudentRecord) => void;
  onDisenrollStudent: (id: string, date: string, reason?: string) => void;
  onReEnrollStudent: (id: string, date: string, batchCode?: string) => void;
  onDeleteStudent: (id: string) => void;
  onClearAllStudentsPreData: () => void;
  onClearStudentsHistoryPreData: () => void;
  onClearSingleStudentPreData: (id: string) => void;
  onRestoreDefaultStudents: () => void;
  notices: NoticeItem[];
  onAddNotice: (notice: NoticeItem) => void;
  onDeleteNotice: (id: string) => void;
  onTogglePinNotice: (id: string) => void;
  onPreviewNotice: (notice: NoticeItem) => void;
  inquiries: InquiryItem[];
  onUpdateInquiryStatus: (id: string, status: InquiryItem['status']) => void;
  onResetData: () => void;
  initialTab?: AdminTabType;
  dataBundle: AppDataBundle;
  cloudUser: CloudUserInfo | null;
  cloudSyncState: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
  cloudSyncError: string | null;
  autoCloudSync: boolean;
  onToggleAutoCloudSync: (enabled: boolean) => void;
  lastSyncedMeta: CloudWorkspaceMeta | null;
  cloudRemoteMeta: CloudWorkspaceMeta | null;
  cloudBackups: CloudBackupEntry[];
  isCloudLoading: boolean;
  onSignInGoogle: () => Promise<void>;
  onSignOutGoogle: () => Promise<void>;
  onPushToCloud: () => Promise<void>;
  onPullFromCloud: () => Promise<void>;
  onCreateCloudBackup: (label: string) => Promise<void>;
  onRestoreCloudBackup: (backupId: string, label: string) => Promise<void>;
  onDeleteCloudBackup: (backupId: string) => Promise<void>;
  onRefreshCloudState: () => Promise<void>;
  onApplyRestoreBundle: (
    data: AppDataBundle,
    scope: RestoreScopeSelection,
    sourceLabel: string
  ) => void;
  dashboardTheme: DashboardThemeConfig;
  onUpdateDashboardTheme: (next: DashboardThemeConfig) => void;
  autoSuspensionConfig: AutoSuspensionConfig;
  onUpdateAutoSuspensionConfig: (config: AutoSuspensionConfig) => void;
  onRunAutoSuspensionScan: () => { suspendedCount: number; reinstatedCount: number };
  onReinstateStudent: (studentId: string, overrideNote?: string) => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  onVerifyPassword,
  onCompleteLogin,
  onLogout,
  securityConfig,
  onUpdateSecurityConfig,
  onUpdateAdminPassword,
  onSetStudentPortalPassword,
  securityLogs,
  onSecurityLog,
  instituteConfig,
  onUpdateInstituteConfig,
  staffList,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  batches,
  onAddBatch,
  onUpdateBatch,
  onDeleteBatch,
  initialEditingBatch,
  onClearEditingBatch,
  feePlans,
  onUpdateFeePlan,
  students,
  onUpdateStudent,
  onDisenrollStudent,
  onReEnrollStudent,
  onDeleteStudent,
  onClearAllStudentsPreData,
  onClearStudentsHistoryPreData,
  onClearSingleStudentPreData,
  onRestoreDefaultStudents,
  notices,
  onAddNotice,
  onDeleteNotice,
  onTogglePinNotice,
  onPreviewNotice,
  onResetData,
  initialTab = 'branding',
  dataBundle,
  cloudUser,
  cloudSyncState,
  cloudSyncError,
  autoCloudSync,
  onToggleAutoCloudSync,
  lastSyncedMeta,
  cloudRemoteMeta,
  cloudBackups,
  isCloudLoading,
  onSignInGoogle,
  onSignOutGoogle,
  onPushToCloud,
  onPullFromCloud,
  onCreateCloudBackup,
  onRestoreCloudBackup,
  onDeleteCloudBackup,
  onRefreshCloudState,
  onApplyRestoreBundle,
  dashboardTheme,
  onUpdateDashboardTheme,
  autoSuspensionConfig,
  onUpdateAutoSuspensionConfig,
  onRunAutoSuspensionScan,
  onReinstateStudent
}) => {
  const activeThemePreset = getDashboardThemePreset(dashboardTheme.themeId);
  const [auditLogFilter, setAuditLogFilter] = useState<'all' | 'suspension' | 'security'>('all');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccessNote, setLoginSuccessNote] = useState('');
  const [authMethodTab, setAuthMethodTab] = useState<'password' | 'otp' | 'forgot'>('password');
  const [twoFactorStage, setTwoFactorStage] = useState<'password' | 'otp'>('password');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // OTP state for Admin Login & Password Reset
  const [otpChannel, setOtpChannel] = useState<'phone' | 'email'>('phone');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Forgot password reset via OTP & Support Recovery Modal
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [showForgotSupportModal, setShowForgotSupportModal] = useState(false);

  // Security Settings Tab state
  const [secCurrentPass, setSecCurrentPass] = useState('');
  const [secNewPass, setSecNewPass] = useState('');
  const [secConfirmPass, setSecConfirmPass] = useState('');
  const [secPassMessage, setSecPassMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );
  const [secForm, setSecForm] = useState<SecurityConfig>(securityConfig);

  const [activeTab, setActiveTab] = useState<AdminTabType>(initialTab);
  const [saveBanner, setSaveBanner] = useState('');
  const [confirmClearAllStudents, setConfirmClearAllStudents] = useState(false);

  useEffect(() => {
    setSecForm(securityConfig);
  }, [securityConfig]);

  useEffect(() => {
    if (securityConfig.adminAuthMode === 'otp') {
      setAuthMethodTab('otp');
    } else if (securityConfig.adminAuthMode === 'password') {
      setAuthMethodTab('password');
    } else if (securityConfig.adminAuthMode === 'both') {
      setAuthMethodTab('password');
      setTwoFactorStage('password');
    }
  }, [securityConfig.adminAuthMode, isOpen]);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const id = window.setInterval(() => {
      setLockoutSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [lockoutSeconds]);

  useEffect(() => {
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

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // 1. Institute Branding & Study Centres state
  const [instForm, setInstForm] = useState<InstituteConfig>(instituteConfig);
  useEffect(() => {
    setInstForm(instituteConfig);
  }, [instituteConfig]);

  // Study Centre form (Create or Edit)
  const [editingCentreId, setEditingCentreId] = useState<string | null>(null);
  const [centreName, setCentreName] = useState('');
  const [centreCode, setCentreCode] = useState('');
  const [centreLocation, setCentreLocation] = useState('');
  const [centrePhone, setCentrePhone] = useState('');
  const [centreInCharge, setCentreInCharge] = useState('');
  const [centreCapacity, setCentreCapacity] = useState(150);
  const [centreImage, setCentreImage] = useState(
    '/src/assets/images/hero_tuition_classroom_1793865164763.jpg'
  );

  // 1b. Student Details Edit state (Tab 2: Students)
  const [studentListSearch, setStudentListSearch] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [stuEditError, setStuEditError] = useState('');
  const [stuCode, setStuCode] = useState('');
  const [stuName, setStuName] = useState('');
  const [stuParentName, setStuParentName] = useState('');
  const [stuPhone, setStuPhone] = useState('');
  const [stuCentreId, setStuCentreId] = useState(
    instituteConfig.studyCentres[0]?.id || 'centre-1'
  );
  const [stuBatchCode, setStuBatchCode] = useState(batches[0]?.batchCode || '');
  const [stuBoard, setStuBoard] = useState<'BSEB (Bihar Board)' | 'CBSE'>('BSEB (Bihar Board)');
  const [stuVillage, setStuVillage] = useState('');
  const [stuSession, setStuSession] = useState('2026-27');
  const [stuEnrollDate, setStuEnrollDate] = useState('');
  const [stuStatus, setStuStatus] = useState<EnrollmentStatus>('Enrolled');
  const [stuDiscountType, setStuDiscountType] = useState<FeeDiscountType>('None');
  const [stuCharityNote, setStuCharityNote] = useState('');
  const [stuPrevDues, setStuPrevDues] = useState<number>(0);
  const [stuNotes, setStuNotes] = useState('');

  // 2. Staff Assignment form (Create or Edit)
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffCodeInput, setStaffCodeInput] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [staffResponsibility, setStaffResponsibility] = useState('');
  const [staffQualification, setStaffQualification] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffCentreId, setStaffCentreId] = useState(
    instituteConfig.studyCentres[0]?.id || 'centre-1'
  );
  const [staffBatchesInput, setStaffBatchesInput] = useState('BATCH-M10, BATCH-N10');
  const [staffShift, setStaffShift] = useState('Morning & Night Class');

  // 3. Batch Creation & Edit form (Active Batch ID editor)
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [batchCode, setBatchCode] = useState('');
  const [batchClassNum, setBatchClassNum] = useState(10);
  const [batchClassLevel, setBatchClassLevel] = useState('Class 10th (Special Batch)');
  const [batchHindiSub, setBatchHindiSub] = useState('विशेष टारगेट बैच');
  const [batchBadge, setBatchBadge] = useState('BSEB & CBSE');
  const [batchShift, setBatchShift] = useState<BatchShift>('Night Class');
  const [batchTiming, setBatchTiming] = useState('06:30 PM – 08:45 PM');
  const [batchCentreId, setBatchCentreId] = useState(
    instituteConfig.studyCentres[0]?.id || 'centre-1'
  );
  const [batchStaffName, setBatchStaffName] = useState(instituteConfig.founder);
  const [batchSubjects, setBatchSubjects] = useState('Mathematics, Science, English');
  const [batchTotalSeats, setBatchTotalSeats] = useState(60);
  const [batchEnrolledCount, setBatchEnrolledCount] = useState(0);
  const [batchMedium, setBatchMedium] = useState('Hindi & English Medium');
  const [batchIsActive, setBatchIsActive] = useState(true);

  const loadBatchIntoEditor = (b: BatchItem) => {
    setEditingBatchId(b.id);
    setBatchCode(b.batchCode);
    setBatchClassNum(b.classNum);
    setBatchClassLevel(b.classLevel);
    setBatchHindiSub(b.hindiSubtitle || '');
    setBatchBadge(b.badge || b.shift);
    setBatchShift(b.shift);
    setBatchTiming(b.timing);
    setBatchCentreId(b.centreId);
    setBatchStaffName(b.assignedStaffName || b.mentor);
    setBatchSubjects(b.subjects.join(', '));
    setBatchTotalSeats(b.totalSeats);
    setBatchEnrolledCount(b.enrolledCount);
    setBatchMedium(b.medium || 'Hindi & English Medium');
    setBatchIsActive(b.isActive !== false);
    setActiveTab('batches');
  };

  const resetBatchForm = () => {
    setEditingBatchId(null);
    setBatchCode('');
    setBatchClassNum(10);
    setBatchClassLevel('');
    setBatchHindiSub('विशेष टारगेट बैच');
    setBatchBadge('BSEB & CBSE');
    setBatchShift('Night Class');
    setBatchTiming('06:30 PM – 08:45 PM');
    setBatchCentreId(instituteConfig.studyCentres[0]?.id || 'centre-1');
    setBatchStaffName(instituteConfig.founder);
    setBatchSubjects('Mathematics, Science, English');
    setBatchTotalSeats(60);
    setBatchEnrolledCount(0);
    setBatchMedium('Hindi & English Medium');
    setBatchIsActive(true);
    if (onClearEditingBatch) onClearEditingBatch();
  };

  // Load initialEditingBatch if passed from CourseBatches card click
  useEffect(() => {
    if (initialEditingBatch) {
      loadBatchIntoEditor(initialEditingBatch);
    }
  }, [initialEditingBatch]);

  // 4. Notice Creation form
  const [newTitle, setNewTitle] = useState('');
  const [newHindiTitle, setNewHindiTitle] = useState('');
  const [newCategory, setNewCategory] = useState<NoticeCategory>('Exam');
  const [newClasses, setNewClasses] = useState('All Classes (Nursery to 12th)');
  const [newContent, setNewContent] = useState('');
  const [newHindiContent, setNewHindiContent] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setSaveBanner(msg);
    setTimeout(() => setSaveBanner(''), 3000);
  };

  const handleSendAdminOtp = (purpose: 'login' | '2fa' | 'reset') => {
    if (lockoutSeconds > 0) return;
    const code = generateSixDigitOtp();
    setGeneratedOtp(code);
    setOtpInput('');
    setOtpExpiresIn(120);
    setOtpCooldown(25);
    setLoginError('');
    setLoginSuccessNote(
      `6-digit OTP sent via ${otpChannel === 'phone' ? 'SMS/WhatsApp' : 'Email'} (${
        otpChannel === 'phone'
          ? maskPhone(securityConfig.adminOtpPhone)
          : maskEmail(securityConfig.adminOtpEmail)
      }) for ${purpose === 'reset' ? 'Password Reset' : 'Admin Verification'}. Valid for 2 minutes.`
    );
    onSecurityLog(
      'Admin',
      `6-Digit OTP dispatched to ${
        otpChannel === 'phone'
          ? maskPhone(securityConfig.adminOtpPhone)
          : maskEmail(securityConfig.adminOtpEmail)
      } (${purpose})`,
      'OTP',
      'Success'
    );
  };

  const registerFailedAttempt = (reason: string) => {
    const nextCount = failedAttempts + 1;
    setFailedAttempts(nextCount);
    if (nextCount >= 5) {
      setLockoutSeconds(30);
      setFailedAttempts(0);
      setLoginError('Too many failed verification attempts. Locked for 30 seconds.');
      onSecurityLog('Admin', 'Account temporarily locked (5 failed attempts)', 'System', 'Failed');
    } else {
      setLoginError(`${reason} (${5 - nextCount} attempts left before 30s lock)`);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    setLoginError('');
    setLoginSuccessNote('');

    const success = await onVerifyPassword(passwordInput);
    if (!success) {
      registerFailedAttempt('Incorrect password.');
      return;
    }

    setFailedAttempts(0);
    setPasswordInput('');

    if (securityConfig.adminAuthMode === 'both') {
      setTwoFactorStage('otp');
      handleSendAdminOtp('2fa');
      return;
    }

    onCompleteLogin('Password');
  };

  const handleOtpLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    setLoginError('');

    if (!generatedOtp || otpExpiresIn <= 0) {
      setLoginError('OTP has expired or not been requested yet. Please click Send 6-Digit OTP.');
      return;
    }

    if (otpInput.trim() !== generatedOtp) {
      onSecurityLog('Admin', 'Invalid Admin OTP code entered', 'OTP', 'Failed');
      registerFailedAttempt('Invalid 6-digit OTP.');
      return;
    }

    const used2FA = securityConfig.adminAuthMode === 'both';
    setGeneratedOtp(null);
    setOtpInput('');
    setOtpExpiresIn(0);
    setFailedAttempts(0);
    setTwoFactorStage('password');
    onCompleteLogin(used2FA ? '2FA' : 'OTP');
  };

  const handleForgotPasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!generatedOtp || otpExpiresIn <= 0) {
      setLoginError('Please request and enter a valid 6-digit OTP first.');
      return;
    }
    if (otpInput.trim() !== generatedOtp) {
      onSecurityLog('Admin', 'Invalid OTP during password reset', 'OTP', 'Failed');
      registerFailedAttempt('Invalid 6-digit OTP.');
      return;
    }
    if (forgotNewPass.trim().length < 6) {
      setLoginError('New password must be at least 6 characters.');
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setLoginError('New password and confirm password do not match.');
      return;
    }

    await onUpdateAdminPassword(forgotNewPass);
    setGeneratedOtp(null);
    setOtpInput('');
    setForgotNewPass('');
    setForgotConfirmPass('');
    setAuthMethodTab('password');
    setLoginSuccessNote('Admin password reset via OTP! You can now sign in with your new password.');
  };

  const handleChangeAdminPasswordInTab = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecPassMessage(null);
    const verified = await onVerifyPassword(secCurrentPass);
    if (!verified) {
      setSecPassMessage({ type: 'err', text: 'Current password is incorrect.' });
      return;
    }
    if (secNewPass.trim().length < 6) {
      setSecPassMessage({ type: 'err', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (secNewPass !== secConfirmPass) {
      setSecPassMessage({ type: 'err', text: 'New password and confirmation do not match.' });
      return;
    }

    await onUpdateAdminPassword(secNewPass);
    setSecCurrentPass('');
    setSecNewPass('');
    setSecConfirmPass('');
    setSecPassMessage({
      type: 'ok',
      text: 'Admin password updated securely with salted SHA-256 hash!'
    });
    showToast('Admin password updated!');
  };

  const handleImageFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'heroImage' | 'directorImage' | 'centreImage'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      if (field === 'centreImage') {
        setCentreImage(result);
      } else {
        setInstForm((prev) => ({ ...prev, [field]: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveInstituteBranding = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateInstituteConfig(instForm);
    showToast('Institute Name, Contact, Images & Capacity updated successfully!');
  };

  const handleSaveStudyCentre = (e: React.FormEvent) => {
    e.preventDefault();
    if (!centreName.trim() || !centreLocation.trim()) return;

    if (editingCentreId) {
      const updatedCentres = instForm.studyCentres.map((c) =>
        c.id === editingCentreId
          ? {
              ...c,
              centreCode: centreCode.trim().toUpperCase() || c.centreCode,
              name: centreName.trim(),
              location: centreLocation.trim(),
              phone: centrePhone.trim() || instForm.phoneDisplay,
              inCharge: centreInCharge.trim() || instForm.founder,
              maxCapacity: Number(centreCapacity) || 150,
              image: centreImage
            }
          : c
      );
      const updatedConfig = { ...instForm, studyCentres: updatedCentres };
      setInstForm(updatedConfig);
      onUpdateInstituteConfig(updatedConfig);
      setEditingCentreId(null);
      showToast(`Updated Study Centre: ${centreName}`);
    } else {
      const newCentre: StudyCentre = {
        id: `centre-${Date.now()}`,
        centreCode:
          centreCode.trim().toUpperCase() ||
          `CTR-0${instForm.studyCentres.length + 1}`,
        name: centreName.trim(),
        location: centreLocation.trim(),
        phone: centrePhone.trim() || instForm.phoneDisplay,
        inCharge: centreInCharge.trim() || instForm.founder,
        maxCapacity: Number(centreCapacity) || 150,
        image: centreImage
      };
      const updatedConfig: InstituteConfig = {
        ...instForm,
        studyCentres: [...instForm.studyCentres, newCentre]
      };
      setInstForm(updatedConfig);
      onUpdateInstituteConfig(updatedConfig);
      showToast(`Added Study Centre: ${newCentre.name}`);
    }

    setCentreName('');
    setCentreCode('');
    setCentreLocation('');
    setCentrePhone('');
    setCentreInCharge('');
  };

  const handleDeleteStudyCentre = (id: string) => {
    if (instForm.studyCentres.length <= 1) return;
    const updatedConfig: InstituteConfig = {
      ...instForm,
      studyCentres: instForm.studyCentres.filter((c) => c.id !== id)
    };
    setInstForm(updatedConfig);
    onUpdateInstituteConfig(updatedConfig);
    showToast('Study Centre removed.');
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffRole.trim()) return;

    if (editingStaffId) {
      const updatedStaff: StaffMember = {
        id: editingStaffId,
        staffCode: staffCodeInput.trim() || 'STF-UPD',
        name: staffName.trim(),
        role: staffRole.trim(),
        responsibility: staffResponsibility.trim() || 'Subject Teaching & Batch Evaluation',
        qualification: staffQualification.trim() || 'Graduate / B.Ed.',
        phone: staffPhone.trim() || instForm.phoneDisplay,
        assignedCentreId: staffCentreId,
        assignedBatchIds: staffBatchesInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        shift: staffShift
      };
      onUpdateStaff(updatedStaff);
      setEditingStaffId(null);
      showToast(`Updated Staff Member: ${updatedStaff.name}`);
    } else {
      const newStaff: StaffMember = {
        id: `stf-${Date.now()}`,
        staffCode: `STF-00${staffList.length + 1}`,
        name: staffName.trim(),
        role: staffRole.trim(),
        responsibility: staffResponsibility.trim() || 'Subject Teaching & Batch Evaluation',
        qualification: staffQualification.trim() || 'Graduate / B.Ed.',
        phone: staffPhone.trim() || instForm.phoneDisplay,
        assignedCentreId: staffCentreId,
        assignedBatchIds: staffBatchesInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        shift: staffShift
      };
      onAddStaff(newStaff);
      showToast(`Assigned Staff Member: ${newStaff.name}`);
    }

    setStaffName('');
    setStaffRole('');
    setStaffResponsibility('');
    setStaffQualification('');
    setStaffPhone('');
  };

  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchCode.trim() || !batchClassLevel.trim()) return;

    const batchPayload: BatchItem = {
      id: editingBatchId || `b-${Date.now()}`,
      batchCode: batchCode.trim().toUpperCase(),
      classNum: Number(batchClassNum),
      classLevel: batchClassLevel.trim(),
      hindiSubtitle: batchHindiSub.trim() || batchClassLevel.trim(),
      badge: batchBadge.trim() || batchShift,
      timing: batchTiming.trim(),
      shift: batchShift,
      centreId: batchCentreId,
      assignedStaffName: batchStaffName.trim() || instForm.founder,
      subjects: batchSubjects
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      focusPillars: ['NCERT Conceptual Clarity', 'Weekly OMR Assessment'],
      mentor: batchStaffName.trim() || instForm.founder,
      totalSeats: Math.max(1, Number(batchTotalSeats) || 50),
      enrolledCount: Math.max(0, Number(batchEnrolledCount) || 0),
      medium: batchMedium.trim() || 'Hindi & English Medium',
      isActive: batchIsActive
    };

    if (editingBatchId) {
      onUpdateBatch(batchPayload);
      showToast(`Updated filled data for Batch ID: ${batchPayload.batchCode}`);
    } else {
      onAddBatch(batchPayload);
      showToast(`Created Batch ID: ${batchPayload.batchCode} (${batchPayload.shift})`);
    }

    resetBatchForm();
  };

  const handleToggleBatchActiveStatus = (batch: BatchItem) => {
    const updated: BatchItem = {
      ...batch,
      isActive: batch.isActive === false ? true : false
    };
    onUpdateBatch(updated);
    showToast(
      `Batch ${batch.batchCode} marked as ${updated.isActive ? 'Active' : 'Inactive'}`
    );
  };

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const notice: NoticeItem = {
      id: `n-${Date.now()}`,
      refNo: `SNTC/${new Date().getFullYear()}/N-${100 + notices.length + 1}`,
      title: newTitle.trim(),
      hindiTitle: newHindiTitle.trim(),
      category: newCategory,
      applicableClasses: newClasses,
      content: newContent.trim(),
      hindiContent: newHindiContent.trim(),
      isUrgent,
      isPinned,
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      issuedBy: `${instForm.founder} (Director)`
    };

    onAddNotice(notice);
    setNewTitle('');
    setNewHindiTitle('');
    setNewContent('');
    setNewHindiContent('');
    setIsUrgent(false);
    setIsPinned(false);
    showToast('Official Notice Published!');
  };

  const loadStudentIntoEditor = (stu: StudentRecord) => {
    setEditingStudentId(stu.id);
    setStuEditError('');
    setStuCode(stu.studentIdCode);
    setStuName(stu.studentName);
    setStuParentName(stu.parentName);
    setStuPhone(stu.phone);
    setStuCentreId(stu.centreId);
    setStuBatchCode(stu.batchCode);
    setStuBoard(stu.board);
    setStuVillage(stu.village);
    setStuSession(stu.academicSession || '2026-27');
    setStuEnrollDate(stu.enrollmentDate);
    setStuStatus(stu.enrollmentStatus);
    setStuDiscountType(stu.discountType);
    setStuCharityNote(stu.charityNote || '');
    setStuPrevDues(stu.previousYearPendingFee || 0);
    setStuNotes(stu.notes || '');
  };

  const cancelStudentEdit = () => {
    setEditingStudentId(null);
    setStuEditError('');
  };

  const handleSaveStudentDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentId) return;
    setStuEditError('');

    const existing = students.find((s) => s.id === editingStudentId);
    if (!existing) return;

    if (!stuName.trim() || !stuParentName.trim()) {
      setStuEditError('Student name and guardian name are required.');
      return;
    }
    const cleanPhone = stuPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setStuEditError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const normalizedCode = (stuCode.trim() || existing.studentIdCode).toUpperCase();
    const duplicateCode = students.some(
      (s) => s.id !== existing.id && s.studentIdCode.toUpperCase() === normalizedCode
    );
    if (duplicateCode) {
      setStuEditError(`Student ID "${normalizedCode}" is already used by another student.`);
      return;
    }

    const selectedBatch = batches.find((b) => b.batchCode === stuBatchCode) || batches[0];
    const plan =
      feePlans.find((fp) => fp.classNum === selectedBatch?.classNum) ||
      feePlans.find((fp) => fp.classNum === existing.classNum) ||
      feePlans[0];
    const baseFee = plan ? plan.monthlyFee : existing.baseMonthlyFee;
    const discMeta =
      DISCOUNT_OPTIONS.find((d) => d.label === stuDiscountType) || DISCOUNT_OPTIONS[0];
    const isCharity = Boolean(discMeta.isCharity);
    const netFee = Math.max(0, Math.round(baseFee * (1 - discMeta.percent / 100)));

    const updated: StudentRecord = {
      ...existing,
      studentIdCode: normalizedCode,
      studentName: stuName.trim(),
      parentName: stuParentName.trim(),
      phone: cleanPhone,
      classLevel: selectedBatch ? selectedBatch.classLevel : existing.classLevel,
      classNum: selectedBatch ? selectedBatch.classNum : existing.classNum,
      batchId: selectedBatch ? selectedBatch.id : existing.batchId,
      batchCode: selectedBatch ? selectedBatch.batchCode : existing.batchCode,
      shift: selectedBatch ? selectedBatch.shift : existing.shift,
      centreId: stuCentreId,
      board: stuBoard,
      village: stuVillage.trim() || existing.village,
      academicSession: stuSession.trim() || existing.academicSession || '2026-27',
      enrollmentDate: stuEnrollDate || existing.enrollmentDate,
      enrollmentStatus: stuStatus,
      disenrollmentDate:
        stuStatus === 'Disenrolled'
          ? existing.disenrollmentDate || todayStr
          : existing.disenrollmentDate,
      reEnrollmentDate:
        stuStatus === 'Re-enrolled'
          ? existing.reEnrollmentDate || todayStr
          : existing.reEnrollmentDate,
      suspendedDate:
        stuStatus === 'Suspended' ? existing.suspendedDate || todayStr : undefined,
      suspensionReason:
        stuStatus === 'Suspended'
          ? existing.suspensionReason || 'Suspended by Administrator'
          : undefined,
      baseMonthlyFee: baseFee,
      discountType: stuDiscountType,
      discountPercent: discMeta.percent,
      isCharitySeat: isCharity,
      charityNote: isCharity
        ? stuCharityNote.trim() || existing.charityNote || 'Charity Quota Applied'
        : stuCharityNote.trim() || undefined,
      netMonthlyFee: netFee,
      previousYearPendingFee: Math.max(0, Number(stuPrevDues) || 0),
      notes: stuNotes.trim()
    };

    onUpdateStudent(updated);
    setEditingStudentId(null);
    showToast(`Updated details for ${updated.studentName} (${updated.studentIdCode})`);
  };

  const exportStudentsCSV = () => {
    if (students.length === 0) return;
    const headers = [
      'Student ID',
      'Name',
      'Guardian',
      'Phone',
      'Class',
      'Batch ID',
      'Shift',
      'Status',
      'Enrollment Date',
      'Disenrollment Date',
      'Re-Enrollment Date',
      'Base Fee',
      'Discount/Charity',
      'Net Fee'
    ];
    const rows = students.map((s) => [
      s.studentIdCode,
      `"${s.studentName}"`,
      `"${s.parentName}"`,
      s.phone,
      `"${s.classLevel}"`,
      s.batchCode,
      `"${s.shift}"`,
      s.enrollmentStatus,
      s.enrollmentDate,
      s.disenrollmentDate || '',
      s.reEnrollmentDate || '',
      s.baseMonthlyFee,
      `"${s.discountType}"`,
      s.netMonthlyFee
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute(
      'download',
      `Student_Enrollment_Register_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto no-print">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6 border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div
          className="text-white px-6 py-4 flex items-center justify-between shrink-0 transition-colors duration-200"
          style={{ backgroundColor: activeThemePreset.barBg }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg text-white flex items-center justify-center"
              style={{ backgroundColor: activeThemePreset.accentHex }}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {instForm.name} — Admin Control Suite
              </h2>
              <p
                className="text-[11px]"
                style={{ color: activeThemePreset.barLabelText }}
              >
                Institute Branding · Multi-Study Centres · 500-Student Register · Staff Roles · Dashboard Theme
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast notification */}
        {saveBanner && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-6 py-2 flex items-center justify-between shrink-0">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveBanner}</span>
            </span>
          </div>
        )}

        {/* Not Logged In: Password / 6-Digit OTP / 2FA Security Gate */}
        {!isAdmin ? (
          <div className="p-6 sm:p-10 max-w-md mx-auto space-y-5 my-auto w-full">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7 text-emerald-700" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Institute Head / Admin Security Gate
              </h3>
              <p className="text-xs text-slate-500">
                {securityConfig.adminAuthMode === 'both'
                  ? 'Two-Factor Security Active: Verify Password + 6-Digit OTP to unlock.'
                  : securityConfig.adminAuthMode === 'otp'
                  ? 'OTP-Only Security Active: Verify via 6-Digit Mobile or Email OTP.'
                  : securityConfig.adminAuthMode === 'password'
                  ? 'Password Security Active: Enter Admin Password to unlock.'
                  : 'Sign in using your Admin Password OR a 6-Digit Verification OTP.'}
              </p>
            </div>

            {/* Method Switcher (Password vs 6-Digit OTP vs Forgot Reset) */}
            {twoFactorStage === 'password' && (
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                {securityConfig.adminAuthMode !== 'otp' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethodTab('password');
                      setLoginError('');
                    }}
                    className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                      authMethodTab === 'password'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Password</span>
                  </button>
                )}
                {securityConfig.adminAuthMode !== 'password' &&
                  securityConfig.adminAuthMode !== 'both' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethodTab('otp');
                        setLoginError('');
                      }}
                      className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                        authMethodTab === 'otp'
                          ? 'bg-white text-emerald-800 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>6-Digit OTP</span>
                    </button>
                  )}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethodTab('forgot');
                    setLoginError('');
                    setGeneratedOtp(null);
                  }}
                  className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    authMethodTab === 'forgot'
                      ? 'bg-white text-amber-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  } ${
                    securityConfig.adminAuthMode === 'otp' ||
                    securityConfig.adminAuthMode === 'password' ||
                    securityConfig.adminAuthMode === 'both'
                      ? 'col-span-2'
                      : ''
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset via OTP</span>
                </button>
              </div>
            )}

            {lockoutSeconds > 0 && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                <span>Security Lockout Active — Retry in {lockoutSeconds}s</span>
              </div>
            )}

            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {loginSuccessNote && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{loginSuccessNote}</span>
              </div>
            )}

            {/* Simulated OTP Delivery Preview Toast so browser testing works 100% */}
            {generatedOtp && otpExpiresIn > 0 && (
              <div className="p-3 rounded-xl bg-slate-900 text-white border border-emerald-500/40 flex items-center justify-between gap-3">
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    OTP Notification ({otpChannel === 'phone' ? 'SMS' : 'Email'}) · {otpExpiresIn}s
                  </p>
                  <p className="text-sm font-mono font-black tracking-widest text-amber-300 mt-0.5">
                    {generatedOtp}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpInput(generatedOtp)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer shrink-0"
                >
                  Auto-Fill OTP
                </button>
              </div>
            )}

            {/* 1. PASSWORD LOGIN FORM (or 2FA Step 1) */}
            {twoFactorStage === 'password' && authMethodTab === 'password' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={lockoutSeconds > 0}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter Admin Password"
                    className="w-full pl-4 pr-10 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={lockoutSeconds > 0}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  {securityConfig.adminAuthMode === 'both'
                    ? 'Step 1: Verify Password & Send OTP'
                    : 'Unlock Admin Suite'}
                </button>
              </form>
            )}

            {/* 2. 6-DIGIT OTP LOGIN FORM (or 2FA Step 2) */}
            {(twoFactorStage === 'otp' || authMethodTab === 'otp') && (
              <form onSubmit={handleOtpLoginSubmit} className="space-y-3">
                {twoFactorStage === 'otp' && (
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <span>✓ Password Verified (Step 1/2)</span>
                    <button
                      type="button"
                      onClick={() => setTwoFactorStage('password')}
                      className="underline text-slate-600 cursor-pointer"
                    >
                      Back
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpChannel('phone')}
                    className={`p-2 rounded-xl border text-left text-[11px] cursor-pointer ${
                      otpChannel === 'phone'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <Smartphone className="w-3 h-3" /> SMS / WhatsApp
                    </span>
                    <span className="font-mono text-[10px] block mt-0.5">
                      {maskPhone(securityConfig.adminOtpPhone)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpChannel('email')}
                    className={`p-2 rounded-xl border text-left text-[11px] cursor-pointer ${
                      otpChannel === 'email'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email OTP
                    </span>
                    <span className="font-mono text-[10px] block mt-0.5 truncate">
                      {maskEmail(securityConfig.adminOtpEmail)}
                    </span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-Digit OTP"
                    className="flex-1 px-4 py-2.5 text-sm text-center tracking-widest font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    disabled={otpCooldown > 0 || lockoutSeconds > 0}
                    onClick={() =>
                      handleSendAdminOtp(twoFactorStage === 'otp' ? '2fa' : 'login')
                    }
                    className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shrink-0 cursor-pointer"
                  >
                    {otpCooldown > 0
                      ? `Resend (${otpCooldown}s)`
                      : generatedOtp
                      ? 'Resend OTP'
                      : 'Send OTP'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={lockoutSeconds > 0}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  {twoFactorStage === 'otp'
                    ? 'Step 2: Verify OTP & Unlock'
                    : 'Verify OTP & Unlock Admin'}
                </button>
              </form>
            )}

            {/* 3. FORGOT PASSWORD RESET VIA OTP */}
            {authMethodTab === 'forgot' && twoFactorStage === 'password' && (
              <form onSubmit={handleForgotPasswordResetSubmit} className="space-y-2.5 text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-700">
                    Reset to: {maskPhone(securityConfig.adminOtpPhone)}
                  </span>
                  <button
                    type="button"
                    disabled={otpCooldown > 0}
                    onClick={() => handleSendAdminOtp('reset')}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    {otpCooldown > 0 ? `Wait ${otpCooldown}s` : 'Send Reset OTP'}
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-Digit Reset OTP"
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={forgotNewPass}
                  onChange={(e) => setForgotNewPass(e.target.value)}
                  placeholder="New Admin Password (min 6 chars)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={forgotConfirmPass}
                  onChange={(e) => setForgotConfirmPass(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Verify OTP & Reset Password
                </button>
              </form>
            )}

            {securityConfig.showDemoLoginHelpers &&
              securityConfig.adminAuthMode !== 'both' &&
              securityConfig.adminAuthMode !== 'otp' &&
              authMethodTab === 'password' && (
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => setPasswordInput(DEFAULT_ADMIN_PASSWORD)}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Fill Default Demo Password
                  </button>
                  <p className="text-[11px] text-slate-400">
                    Initial Password:{' '}
                    <code className="font-mono font-bold text-slate-700">
                      {DEFAULT_ADMIN_PASSWORD}
                    </code>{' '}
                    (changeable in Tab 6: Security)
                  </p>
                </div>
              )}

            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setShowForgotSupportModal(true)}
                className="inline-flex items-center justify-center min-h-[36px] px-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline underline-offset-4 transition-colors cursor-pointer"
              >
                Forgot Password? Contact Support Desk
              </button>
            </div>
          </div>
        ) : (
          /* Logged In: Full 5-Tab Management Suite */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Top Navigation Tabs */}
            <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('branding')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'branding'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>1. Institute & Study Centres ({instForm.studyCentres.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('students')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'students'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    2. Students ({students.length}/{instForm.maxStudentCapacity})
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('staff')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'staff'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>3. Assign Staff Roles ({staffList.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('batches')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'batches'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>4. Batch IDs & Class Fees ({batches.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('notices')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'notices'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>5. Notices ({notices.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'security'
                      ? 'bg-slate-900 text-amber-300 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>6. Security (Password & OTP)</span>
                </button>

                <button
                  onClick={() => setActiveTab('backup-sync')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'backup-sync'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>7. Data Sync, Backup & Restore</span>
                </button>

                <button
                  onClick={() => setActiveTab('theme')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'theme'
                      ? 'text-white shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-200'
                  }`}
                  style={
                    activeTab === 'theme'
                      ? { backgroundColor: activeThemePreset.accentHex }
                      : undefined
                  }
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>8. Theme &amp; Look</span>
                </button>

                <button
                  onClick={() => setActiveTab('suspended')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'suspended'
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-50'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span className="tabular-nums">
                    9. Suspended (
                    {students.filter((s) => s.enrollmentStatus === 'Suspended').length})
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClearAllStudentsPreData();
                    setActiveTab('students');
                    showToast('All pre-loaded student records & batch counts cleared to 0!');
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer"
                  title="Clear all pre-loaded student records and reset batch enrolled counts to 0"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Student Pre-Data</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onResetData();
                    showToast('Reset to default seed data.');
                  }}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Defaults</span>
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* TAB 1: INSTITUTE BRANDING, CONTACT, IMAGES & MULTI-STUDY CENTRES */}
              {activeTab === 'branding' && (
                <div className="space-y-8">
                  {/* Form A: Main Institute Details & Images */}
                  <form
                    onSubmit={handleSaveInstituteBranding}
                    className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Assign / Change Institute Name, Contact, Location & Images
                        </h3>
                        <p className="text-xs text-slate-500">
                          Changes apply immediately across Header, Hero, Print Slips, WhatsApp & Footer.
                        </p>
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Institute Profile</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">
                          Institute / App Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={instForm.name}
                          onChange={(e) =>
                            setInstForm({ ...instForm, name: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">
                          Hindi Subtitle / Slogan
                        </label>
                        <input
                          type="text"
                          value={instForm.hindiName}
                          onChange={(e) =>
                            setInstForm({ ...instForm, hindiName: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-hindi"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">
                          Max Student Capacity (Up to 500+)
                        </label>
                        <input
                          type="number"
                          min={50}
                          max={2000}
                          value={instForm.maxStudentCapacity}
                          onChange={(e) =>
                            setInstForm({
                              ...instForm,
                              maxStudentCapacity: Number(e.target.value) || 500
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">
                          Director / Head Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={instForm.founder}
                          onChange={(e) =>
                            setInstForm({ ...instForm, founder: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">
                          Contact / WhatsApp Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={instForm.phoneDisplay}
                          onChange={(e) =>
                            setInstForm({
                              ...instForm,
                              phoneDisplay: e.target.value,
                              phone: e.target.value.replace(/\s+/g, '')
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">
                          Primary Location / Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={instForm.address}
                          onChange={(e) =>
                            setInstForm({ ...instForm, address: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Image URL & Upload Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">
                            Institute Classroom / Banner Image
                          </label>
                          <label className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md text-[11px] font-bold cursor-pointer flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            <span>Upload Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageFileUpload(e, 'heroImage')}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          value={instForm.heroImage}
                          onChange={(e) =>
                            setInstForm({ ...instForm, heroImage: e.target.value })
                          }
                          placeholder="Image URL or upload from device"
                          className="w-full px-2.5 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg font-mono"
                        />
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">
                            Director / Head Portrait Image
                          </label>
                          <label className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md text-[11px] font-bold cursor-pointer flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            <span>Upload Portrait</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageFileUpload(e, 'directorImage')}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          value={instForm.directorImage}
                          onChange={(e) =>
                            setInstForm({ ...instForm, directorImage: e.target.value })
                          }
                          placeholder="Director image URL or upload"
                          className="w-full px-2.5 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                    </div>
                  </form>

                  {/* Form B: Multi-Study Centres Management */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Manage Multiple Study Centres ({instForm.studyCentres.length} Active Branches)
                      </h3>
                      <p className="text-xs text-slate-500">
                        If the same institute operates different study centres, assign or edit each branch's name, location, contact number, image, and student capacity.
                      </p>
                    </div>

                    {/* Existing Centres List */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {instForm.studyCentres.map((c) => (
                        <div
                          key={c.id}
                          className={`p-4 rounded-xl bg-white border shadow-xs flex flex-col justify-between space-y-3 ${
                            editingCentreId === c.id
                              ? 'border-amber-500 ring-2 ring-amber-200'
                              : 'border-slate-200'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                                {c.centreCode}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-500">
                                Cap: {c.maxCapacity} Students
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                            <p className="text-xs text-slate-600">{c.location}</p>
                            <p className="text-[11px] text-slate-500">
                              In-Charge: <strong>{c.inCharge}</strong> · {c.phone}
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCentreId(c.id);
                                setCentreName(c.name);
                                setCentreCode(c.centreCode);
                                setCentreLocation(c.location);
                                setCentrePhone(c.phone);
                                setCentreInCharge(c.inCharge);
                                setCentreCapacity(c.maxCapacity);
                                setCentreImage(c.image);
                              }}
                              className="text-xs text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit Branch</span>
                            </button>
                            {instForm.studyCentres.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteStudyCentre(c.id)}
                                className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add / Edit Study Centre Form */}
                    <form
                      onSubmit={handleSaveStudyCentre}
                      className={`p-5 rounded-xl border space-y-3 ${
                        editingCentreId
                          ? 'bg-amber-50/70 border-amber-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          {editingCentreId
                            ? `Editing Study Centre Branch (${centreCode})`
                            : '+ Add Another Study Centre Branch'}
                        </h4>
                        {editingCentreId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCentreId(null);
                              setCentreName('');
                              setCentreCode('');
                              setCentreLocation('');
                              setCentrePhone('');
                              setCentreInCharge('');
                            }}
                            className="text-xs font-bold text-slate-600 hover:text-slate-900 underline"
                          >
                            Cancel Edit
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          required
                          value={centreName}
                          onChange={(e) => setCentreName(e.target.value)}
                          placeholder="Study Centre Name (e.g. Simrahi Bazar Branch) *"
                          className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                        <input
                          type="text"
                          value={centreCode}
                          onChange={(e) => setCentreCode(e.target.value)}
                          placeholder="Branch Code (e.g. CTR-SIM-04)"
                          className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                        />
                        <input
                          type="text"
                          required
                          value={centreLocation}
                          onChange={(e) => setCentreLocation(e.target.value)}
                          placeholder="Full Address / Location *"
                          className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <input
                          type="text"
                          value={centrePhone}
                          onChange={(e) => setCentrePhone(e.target.value)}
                          placeholder="Branch Contact Phone"
                          className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                        />
                        <input
                          type="text"
                          value={centreInCharge}
                          onChange={(e) => setCentreInCharge(e.target.value)}
                          placeholder="Branch In-Charge Name"
                          className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                        <input
                          type="number"
                          value={centreCapacity}
                          onChange={(e) => setCentreCapacity(Number(e.target.value))}
                          placeholder="Student Capacity (e.g. 150)"
                          className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          {editingCentreId ? (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Save Branch Changes</span>
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-4 h-4" />
                              <span>Add Study Centre</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 2: 500-STUDENT ENROLLMENT, DISENROLLMENT & RE-ENROLLMENT REGISTER */}
              {activeTab === 'students' && (
                <div className="space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Student Enrollment Register ({students.length} / {instForm.maxStudentCapacity} Capacity)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Manage Enrollment Date, Disenrollment, Re-Enrollment, or Clear Pre-Loaded Student Data to start fresh.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {students.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              onClearStudentsHistoryPreData();
                              showToast(
                                'Cleared pre-filled fee receipts & attendance history for all students!'
                              );
                            }}
                            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Clear Fee & Attendance Logs Only</span>
                          </button>

                          {!confirmClearAllStudents ? (
                            <button
                              type="button"
                              onClick={() => setConfirmClearAllStudents(true)}
                              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Clear All Student Pre-Data ({students.length})</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 px-2.5 py-1 rounded-lg">
                              <span className="text-[11px] font-bold text-rose-800">
                                Wipe all {students.length} students?
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  onClearAllStudentsPreData();
                                  setConfirmClearAllStudents(false);
                                  showToast(
                                    'All pre-loaded student data cleared! Register is now at 0 students.'
                                  );
                                }}
                                className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded text-[11px] font-bold cursor-pointer"
                              >
                                Yes, Clear All
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmClearAllStudents(false)}
                                className="px-2 py-1 bg-white text-slate-600 border border-slate-200 rounded text-[11px] font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {students.length === 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            onRestoreDefaultStudents();
                            showToast('Restored default demo student records.');
                          }}
                          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore Sample Students</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={exportStudentsCSV}
                        disabled={students.length === 0}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>

                  {editingStudentId && (() => {
                    const previewBatch = batches.find((b) => b.batchCode === stuBatchCode);
                    const previewPlan =
                      feePlans.find((fp) => fp.classNum === previewBatch?.classNum) || feePlans[0];
                    const previewBase = previewPlan ? previewPlan.monthlyFee : 500;
                    const previewDisc =
                      DISCOUNT_OPTIONS.find((d) => d.label === stuDiscountType) ||
                      DISCOUNT_OPTIONS[0];
                    const previewNet = Math.max(
                      0,
                      Math.round(previewBase * (1 - previewDisc.percent / 100))
                    );

                    return (
                      <form
                        onSubmit={handleSaveStudentDetails}
                        className="p-5 bg-amber-50/80 rounded-2xl border border-amber-300 space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-2.5">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              <Pencil className="w-4 h-4 text-amber-700" />
                              <span>Edit Student Details ({stuCode})</span>
                            </h4>
                            <p className="text-[11px] text-amber-900">
                              Fee receipts, attendance history, promotion logs & portal login remain untouched.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={cancelStudentEdit}
                            className="text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                          >
                            Cancel Edit
                          </button>
                        </div>

                        {stuEditError && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{stuEditError}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Student ID / Roll Code *
                            </label>
                            <input
                              type="text"
                              required
                              value={stuCode}
                              onChange={(e) => setStuCode(e.target.value)}
                              className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Student Full Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={stuName}
                              onChange={(e) => setStuName(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Father / Guardian Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={stuParentName}
                              onChange={(e) => setStuParentName(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              WhatsApp / Contact Phone *
                            </label>
                            <input
                              type="tel"
                              required
                              maxLength={12}
                              value={stuPhone}
                              onChange={(e) => setStuPhone(e.target.value)}
                              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Study Centre
                            </label>
                            <select
                              value={stuCentreId}
                              onChange={(e) => setStuCentreId(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                            >
                              {instForm.studyCentres.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.centreCode})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Class, Batch ID & Shift
                            </label>
                            <select
                              value={stuBatchCode}
                              onChange={(e) => setStuBatchCode(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                            >
                              {batches.map((b) => (
                                <option key={b.id} value={b.batchCode}>
                                  [{b.batchCode}] {b.classLevel} — {b.shift}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Board
                            </label>
                            <select
                              value={stuBoard}
                              onChange={(e) =>
                                setStuBoard(e.target.value as 'BSEB (Bihar Board)' | 'CBSE')
                              }
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                            >
                              <option value="BSEB (Bihar Board)">BSEB (Bihar Board)</option>
                              <option value="CBSE">CBSE</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Village / Ward / Address
                            </label>
                            <input
                              type="text"
                              value={stuVillage}
                              onChange={(e) => setStuVillage(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Enrollment Date
                            </label>
                            <input
                              type="date"
                              value={stuEnrollDate}
                              onChange={(e) => setStuEnrollDate(e.target.value)}
                              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Academic Session
                            </label>
                            <input
                              type="text"
                              value={stuSession}
                              onChange={(e) => setStuSession(e.target.value)}
                              placeholder="2026-27"
                              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Enrollment Status
                            </label>
                            <select
                              value={stuStatus}
                              onChange={(e) =>
                                setStuStatus(e.target.value as EnrollmentStatus)
                              }
                              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg"
                            >
                              <option value="Enrolled">Enrolled</option>
                              <option value="Re-enrolled">Re-enrolled</option>
                              <option value="Suspended">Suspended</option>
                              <option value="Disenrolled">Disenrolled</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Prev. Year Back Dues (₹)
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={stuPrevDues}
                              onChange={(e) =>
                                setStuPrevDues(Math.max(0, Number(e.target.value) || 0))
                              }
                              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Discount / Charity Plan (Base: ₹{previewBase}/mo)
                            </label>
                            <select
                              value={stuDiscountType}
                              onChange={(e) =>
                                setStuDiscountType(e.target.value as FeeDiscountType)
                              }
                              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg"
                            >
                              {DISCOUNT_OPTIONS.map((opt) => (
                                <option key={opt.label} value={opt.label}>
                                  {opt.label} (-{opt.percent}%)
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Charity / Scholarship Note
                            </label>
                            <input
                              type="text"
                              value={stuCharityNote}
                              onChange={(e) => setStuCharityNote(e.target.value)}
                              placeholder="Optional verification note"
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Remarks / Notes
                            </label>
                            <input
                              type="text"
                              value={stuNotes}
                              onChange={(e) => setStuNotes(e.target.value)}
                              placeholder="Admin remarks"
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <span className="text-xs font-mono font-bold text-emerald-800">
                            Updated Net Tuition Fee: ₹{previewNet}/mo (Base ₹{previewBase} ·{' '}
                            {stuDiscountType})
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={cancelStudentEdit}
                              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Student Details</span>
                            </button>
                          </div>
                        </div>
                      </form>
                    );
                  })()}

                  {students.length === 0 ? (
                    <div className="p-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        All Pre-Loaded Student Data Cleared (0 Enrolled Students)
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        The student register and batch enrollment counters are now completely clean. You can enroll new students from the Student Admission Form on the main page, or restore sample demo data below.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onRestoreDefaultStudents();
                          showToast('Restored sample student records.');
                        }}
                        className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore Sample Student Pre-Data</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative max-w-sm">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={studentListSearch}
                          onChange={(e) => setStudentListSearch(e.target.value)}
                          placeholder="Search student by ID, name, guardian, batch..."
                          className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:border-emerald-600"
                        />
                      </div>

                      <div className="space-y-2.5">
                        {students
                          .filter((s) => {
                            if (!studentListSearch.trim()) return true;
                            const q = studentListSearch.toLowerCase();
                            return (
                              s.studentName.toLowerCase().includes(q) ||
                              s.studentIdCode.toLowerCase().includes(q) ||
                              s.parentName.toLowerCase().includes(q) ||
                              s.batchCode.toLowerCase().includes(q) ||
                              s.phone.includes(q)
                            );
                          })
                          .map((stu) => (
                            <div
                              key={stu.id}
                              className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                                editingStudentId === stu.id
                                  ? 'bg-amber-50/70 border-amber-300'
                                  : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-sm">
                                    {stu.studentIdCode}
                                  </span>
                                  <span className="font-bold text-slate-900 text-sm">
                                    {stu.studentName}
                                  </span>
                                  <span className="font-mono text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-sm">
                                    {stu.batchCode} ({stu.shift})
                                  </span>
                                  <span
                                    className={`text-[11px] font-bold px-2 py-0.5 rounded-sm ${
                                      stu.enrollmentStatus === 'Enrolled'
                                        ? 'bg-emerald-100 text-emerald-900'
                                        : stu.enrollmentStatus === 'Re-enrolled'
                                        ? 'bg-indigo-100 text-indigo-900'
                                        : stu.enrollmentStatus === 'Suspended'
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : 'bg-rose-100 text-rose-900'
                                    }`}
                                  >
                                    {stu.enrollmentStatus}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600">
                                  Guardian: <strong>{stu.parentName}</strong> · Phone: {stu.phone} ·{' '}
                                  {stu.classLevel} · Net Fee: <strong>₹{stu.netMonthlyFee}/mo</strong> (
                                  {stu.discountType})
                                </p>
                                <p className="text-[11px] font-mono text-slate-500">
                                  Enrolled: {stu.enrollmentDate}
                                  {stu.suspendedDate ? ` | Suspended: ${stu.suspendedDate}` : ''}
                                  {stu.disenrollmentDate
                                    ? ` | Disenrolled: ${stu.disenrollmentDate}`
                                    : ''}
                                  {stu.reEnrollmentDate
                                    ? ` | Re-Enrolled: ${stu.reEnrollmentDate}`
                                    : ''}
                                  {' · '}Receipts: {stu.feePayments?.length || 0} · Attendance Logs:{' '}
                                  {stu.attendanceRecords?.length || 0}
                                </p>
                                {stu.enrollmentStatus === 'Suspended' && stu.suspensionReason && (
                                  <p className="text-[11px] text-amber-800 font-medium">
                                    {stu.suspensionReason}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => loadStudentIntoEditor(stu)}
                                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                                  title="Edit Student Details"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>Edit Details</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    onClearSingleStudentPreData(stu.id);
                                    showToast(
                                      `Cleared pre-filled fee & attendance data for ${stu.studentName}`
                                    );
                                  }}
                                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                  title="Clear this student's pre-filled fee receipts and attendance history"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Clear Pre-Data</span>
                                </button>

                                {stu.enrollmentStatus === 'Suspended' ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onReinstateStudent(stu.id);
                                      showToast(
                                        `Reinstated ${stu.studentName} to Enrolled status.`
                                      );
                                    }}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                                  >
                                    Reinstate
                                  </button>
                                ) : stu.enrollmentStatus === 'Disenrolled' ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onReEnrollStudent(stu.id, todayStr, stu.batchCode);
                                      showToast(`Re-enrolled ${stu.studentName}`);
                                    }}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                                  >
                                    Re-Enroll
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDisenrollStudent(stu.id, todayStr, 'Disenrolled by Admin');
                                      showToast(`Marked ${stu.studentName} as Disenrolled`);
                                    }}
                                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold cursor-pointer"
                                  >
                                    Disenroll
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteStudent(stu.id);
                                    showToast(`Removed ${stu.studentName} from register`);
                                  }}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  title="Delete Student Record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ASSIGN & EDIT STAFF FOR ROLES & RESPONSIBILITIES */}
              {activeTab === 'staff' && (
                <div className="space-y-6">
                  <form
                    onSubmit={handleSaveStaff}
                    className={`p-5 rounded-2xl border space-y-4 ${
                      editingStaffId
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">
                        {editingStaffId
                          ? `Edit Staff Member Role & Responsibility (${staffCodeInput})`
                          : 'Assign New Staff Member Role & Responsibility'}
                      </h3>
                      {editingStaffId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStaffId(null);
                            setStaffName('');
                            setStaffRole('');
                            setStaffResponsibility('');
                            setStaffQualification('');
                            setStaffPhone('');
                          }}
                          className="text-xs font-bold text-slate-600 hover:text-slate-900 underline"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        required
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        placeholder="Staff Full Name *"
                        className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        required
                        value={staffRole}
                        onChange={(e) => setStaffRole(e.target.value)}
                        placeholder="Role (e.g. Senior Physics Faculty / Night Batch Head) *"
                        className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={staffQualification}
                        onChange={(e) => setStaffQualification(e.target.value)}
                        placeholder="Qualification (e.g. M.Sc., B.Ed.)"
                        className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={staffResponsibility}
                        onChange={(e) => setStaffResponsibility(e.target.value)}
                        placeholder="Assigned Responsibility (e.g. Class 10-12 Numericals & Sunday OMR Evaluation) *"
                        className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={staffBatchesInput}
                        onChange={(e) => setStaffBatchesInput(e.target.value)}
                        placeholder="Assigned Batch IDs (comma-separated, e.g. BATCH-M12, BATCH-N10)"
                        className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <select
                        value={staffCentreId}
                        onChange={(e) => setStaffCentreId(e.target.value)}
                        className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        {instForm.studyCentres.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={staffShift}
                        onChange={(e) => setStaffShift(e.target.value)}
                        placeholder="Shift Duty (e.g. Morning & Night)"
                        className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={staffPhone}
                        onChange={(e) => setStaffPhone(e.target.value)}
                        placeholder="Staff Contact Number"
                        className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        {editingStaffId ? (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Save Staff Changes</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-4 h-4" />
                            <span>Assign Staff</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  <div className="space-y-3">
                    {staffList.map((stf) => (
                      <div
                        key={stf.id}
                        className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                              {stf.staffCode}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{stf.name}</h4>
                            <span className="text-xs font-semibold text-emerald-700">
                              · {stf.role}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            <strong>Responsibility:</strong> {stf.responsibility}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            Batches: {stf.assignedBatchIds.join(', ')} · Shift: {stf.shift} ·{' '}
                            {stf.phone}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStaffId(stf.id);
                              setStaffCodeInput(stf.staffCode);
                              setStaffName(stf.name);
                              setStaffRole(stf.role);
                              setStaffResponsibility(stf.responsibility);
                              setStaffQualification(stf.qualification);
                              setStaffPhone(stf.phone);
                              setStaffCentreId(stf.assignedCentreId);
                              setStaffBatchesInput(stf.assignedBatchIds.join(', '));
                              setStaffShift(stf.shift);
                            }}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteStaff(stf.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: CREATE OR EDIT FILLED DATA IN ACTIVE BATCH IDs & CLASS-WISE FEES */}
              {activeTab === 'batches' && (
                <div className="space-y-8">
                  {/* Create OR Edit Active Batch ID Form */}
                  <form
                    onSubmit={handleSaveBatch}
                    className={`p-5 rounded-2xl border space-y-4 transition-all ${
                      editingBatchId
                        ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          {editingBatchId ? (
                            <>
                              <Pencil className="w-4 h-4 text-amber-700" />
                              <span>
                                Editing Filled Data in Batch ID:{' '}
                                <span className="font-mono text-emerald-800">{batchCode}</span>
                              </span>
                            </>
                          ) : (
                            <span>
                              Create or Edit Batch ID (Morning, Afternoon, Evening, Night Class)
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {editingBatchId
                            ? 'Modify any filled field below (Batch ID, Shift, Timing, Staff, Subjects, Enrolled Count, Max Seats, or Active status) and click Save.'
                            : 'Select any batch from the Active Batch IDs list below to edit its filled data, or fill out the form to add a new Batch ID.'}
                        </p>
                      </div>

                      {editingBatchId && (
                        <button
                          type="button"
                          onClick={resetBatchForm}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold"
                        >
                          Cancel Edit / Create New
                        </button>
                      )}
                    </div>

                    {/* Row 1: Batch ID, Shift, Class Level, Hindi Subtitle */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Batch ID Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={batchCode}
                          onChange={(e) => setBatchCode(e.target.value)}
                          placeholder="e.g. BATCH-M12 *"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Batch Shift *
                        </label>
                        <select
                          value={batchShift}
                          onChange={(e) => setBatchShift(e.target.value as BatchShift)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                        >
                          <option value="Morning Batch">Morning Batch</option>
                          <option value="Afternoon Batch">Afternoon Batch</option>
                          <option value="Evening Batch">Evening Batch</option>
                          <option value="Night Class">Night Class</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Class Name / Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={batchClassLevel}
                          onChange={(e) => setBatchClassLevel(e.target.value)}
                          placeholder="e.g. Class 10th (Matric Target) *"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Hindi Subtitle
                        </label>
                        <input
                          type="text"
                          value={batchHindiSub}
                          onChange={(e) => setBatchHindiSub(e.target.value)}
                          placeholder="e.g. मैट्रिक बोर्ड विशेष बैच"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-hindi"
                        />
                      </div>
                    </div>

                    {/* Row 2: Timing, Study Centre, Assigned Staff, Badge */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Batch Timing *
                        </label>
                        <input
                          type="text"
                          required
                          value={batchTiming}
                          onChange={(e) => setBatchTiming(e.target.value)}
                          placeholder="e.g. 06:00 AM – 08:30 AM *"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Assigned Study Centre
                        </label>
                        <select
                          value={batchCentreId}
                          onChange={(e) => setBatchCentreId(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        >
                          {instForm.studyCentres.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.centreCode})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Assigned Staff / Faculty
                        </label>
                        <input
                          type="text"
                          value={batchStaffName}
                          onChange={(e) => setBatchStaffName(e.target.value)}
                          placeholder="e.g. Sunil Kumar"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Badge Label & Class Tier
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={batchBadge}
                            onChange={(e) => setBatchBadge(e.target.value)}
                            placeholder="Badge (e.g. BSEB & CBSE)"
                            className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                          />
                          <select
                            value={batchClassNum}
                            onChange={(e) => setBatchClassNum(Number(e.target.value))}
                            className="px-2 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                            title="Class Tier Number (0=Nursery to 12=Class 12th)"
                          >
                            <option value={12}>12th</option>
                            <option value={11}>11th</option>
                            <option value={10}>10th</option>
                            <option value={9}>9th</option>
                            <option value={8}>6-8th</option>
                            <option value={5}>1-5th</option>
                            <option value={0}>Nursery</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Subjects, Enrolled Count, Max Seats, Status & Save Button */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-5 space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Subjects Covered (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={batchSubjects}
                          onChange={(e) => setBatchSubjects(e.target.value)}
                          placeholder="Physics, Chemistry, Mathematics, Biology, English"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Filled / Enrolled
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={500}
                          value={batchEnrolledCount}
                          onChange={(e) => setBatchEnrolledCount(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Max Seats
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={batchTotalSeats}
                          onChange={(e) => setBatchTotalSeats(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                        />
                      </div>

                      <div className="sm:col-span-3 flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white px-2.5 py-2 rounded-lg border border-slate-300 cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={batchIsActive}
                            onChange={(e) => setBatchIsActive(e.target.checked)}
                            className="rounded text-emerald-600"
                          />
                          <span>{batchIsActive ? 'Active' : 'Inactive'}</span>
                        </label>

                        <button
                          type="submit"
                          className={`flex-1 py-2 px-3 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs ${
                            editingBatchId
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-emerald-700 hover:bg-emerald-800'
                          }`}
                        >
                          {editingBatchId ? (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Save Batch</span>
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-4 h-4" />
                              <span>Add Batch</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Active Batch IDs List with Full Edit & Active/Inactive Controls */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Active & Registered Batch IDs ({batches.length}) — Click "Edit Filled Data" to Modify Any Batch
                        </h4>
                        <p className="text-xs text-slate-500">
                          Edit Batch ID code, shift, timing, assigned staff, subjects, or filled student count anytime.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {batches.map((b) => {
                        const isCurrentlyEditing = editingBatchId === b.id;
                        const centreObj = instForm.studyCentres.find(
                          (c) => c.id === b.centreId
                        );
                        return (
                          <div
                            key={b.id}
                            className={`p-4 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                              isCurrentlyEditing
                                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200'
                                : b.isActive === false
                                ? 'bg-slate-100 border-slate-300 opacity-75'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-mono font-extrabold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-sm">
                                  {b.batchCode}
                                </span>
                                <span className="font-bold text-slate-900 text-sm">
                                  {b.classLevel}
                                </span>
                                <span className="font-semibold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-sm">
                                  {b.shift}
                                </span>
                                <span className="text-slate-600 font-medium">
                                  · {b.timing}
                                </span>
                                <span
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded-sm ${
                                    b.isActive === false
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-emerald-50 text-emerald-800'
                                  }`}
                                >
                                  {b.isActive === false ? 'Inactive Batch' : 'Active Batch'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600">
                                <strong>Staff:</strong> {b.assignedStaffName || b.mentor} ·{' '}
                                <strong>Centre:</strong> {centreObj?.name || 'Main Campus'} ·{' '}
                                <strong>Seats Filled:</strong>{' '}
                                <span className="font-mono font-bold text-slate-900">
                                  {b.enrolledCount} / {b.totalSeats}
                                </span>
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                <strong>Subjects:</strong> {b.subjects.join(', ')}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => loadBatchIntoEditor(b)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit Filled Data</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleBatchActiveStatus(b)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                  b.isActive === false
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                {b.isActive === false ? 'Mark Active' : 'Mark Inactive'}
                              </button>

                              <button
                                type="button"
                                onClick={() => onDeleteBatch(b.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200"
                                title="Delete Batch ID"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Edit Class-Wise Tuition Fees Table */}
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <h3 className="text-base font-bold text-slate-900">
                      Customize Class-Wise Tuition Fees (Nursery to Class 12th)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {feePlans.map((fp) => (
                        <div
                          key={fp.classNum}
                          className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">{fp.classLevel}</p>
                            <p className="text-[11px] text-slate-500">
                              Monthly: ₹{fp.monthlyFee} · Quarterly: ₹{fp.quarterlyFee} · Reg: ₹
                              {fp.registrationFee}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] font-bold text-slate-500">₹/Mo:</label>
                            <input
                              type="number"
                              value={fp.monthlyFee}
                              onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value) || 0);
                                onUpdateFeePlan(
                                  fp.classNum,
                                  val,
                                  Math.round(val * 2.75),
                                  fp.registrationFee
                                );
                              }}
                              className="w-20 px-2 py-1 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: OFFICIAL NOTICES */}
              {activeTab === 'notices' && (
                <div className="space-y-6">
                  <form
                    onSubmit={handleCreateNotice}
                    className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
                  >
                    <h3 className="text-base font-bold text-slate-900">
                      Publish New Institute Circular
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as NoticeCategory)}
                        className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="Exam">Exams & Test Series</option>
                        <option value="Batch">Batch & Admission</option>
                        <option value="Holiday">Holidays</option>
                        <option value="General">General Circular</option>
                      </select>
                      <input
                        type="text"
                        required
                        value={newClasses}
                        onChange={(e) => setNewClasses(e.target.value)}
                        placeholder="Applicable Classes (e.g. Nursery to 12th)"
                        className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Notice Title (English) *"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={newHindiTitle}
                      onChange={(e) => setNewHindiTitle(e.target.value)}
                      placeholder="Notice Title in Hindi (वैकल्पिक)"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-hindi"
                    />
                    <textarea
                      required
                      rows={2}
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Detailed Notice Content *"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-xs font-semibold">
                          <input
                            type="checkbox"
                            checked={isUrgent}
                            onChange={(e) => setIsUrgent(e.target.checked)}
                          />
                          <span>Urgent Ticker</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-semibold">
                          <input
                            type="checkbox"
                            checked={isPinned}
                            onChange={(e) => setIsPinned(e.target.checked)}
                          />
                          <span>Pin to Top</span>
                        </label>
                      </div>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl"
                      >
                        Publish Circular
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2.5">
                    {notices.map((n) => (
                      <div
                        key={n.id}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {n.refNo} · {n.date} · {n.applicableClasses}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => onTogglePinNotice(n.id)}
                            className={`p-1.5 rounded border text-xs ${
                              n.isPinned
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onPreviewNotice(n)}
                            className="p-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteNotice(n.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: SECURITY SETTINGS (PASSWORD, 6-DIGIT OTP, 2FA & AUDIT LOG) */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Admin Auth Mode & OTP Destinations */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-700" />
                            <span>Admin Login Policy (Password / OTP / 2FA)</span>
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Choose whether Admin Suite unlocks via Password, 6-Digit OTP, or both.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {(
                          [
                            {
                              id: 'password_or_otp',
                              title: 'Password OR 6-Digit OTP (Flexible)',
                              desc: 'Login screen allows choosing Password or OTP anytime.'
                            },
                            {
                              id: 'password',
                              title: 'Password Only',
                              desc: 'Requires Admin Password (OTP still available for reset).'
                            },
                            {
                              id: 'otp',
                              title: '6-Digit OTP Only',
                              desc: 'Passwordless sign-in verified via Mobile / Email OTP.'
                            },
                            {
                              id: 'both',
                              title: 'Two-Factor Auth (Password + 6-Digit OTP)',
                              desc: 'Maximum protection: requires password followed by OTP.'
                            }
                          ] as { id: AuthSecurityMode; title: string; desc: string }[]
                        ).map((opt) => (
                          <label
                            key={opt.id}
                            className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                              secForm.adminAuthMode === opt.id
                                ? 'bg-emerald-50 border-emerald-400'
                                : 'bg-white border-slate-200 hover:bg-slate-100/70'
                            }`}
                          >
                            <input
                              type="radio"
                              name="adminAuthMode"
                              checked={secForm.adminAuthMode === opt.id}
                              onChange={() =>
                                setSecForm({ ...secForm, adminAuthMode: opt.id })
                              }
                              className="mt-0.5 text-emerald-600"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-900 block">
                                {opt.title}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {opt.desc}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            OTP Mobile Number
                          </label>
                          <input
                            type="text"
                            value={secForm.adminOtpPhone}
                            onChange={(e) =>
                              setSecForm({ ...secForm, adminOtpPhone: e.target.value })
                            }
                            className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            OTP Recovery Email
                          </label>
                          <input
                            type="email"
                            value={secForm.adminOtpEmail}
                            onChange={(e) =>
                              setSecForm({ ...secForm, adminOtpEmail: e.target.value })
                            }
                            className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block">
                            Inactivity Auto-Lock Timer
                          </label>
                          <span className="text-[10px] text-slate-500">
                            Automatically locks Admin Suite when idle
                          </span>
                        </div>
                        <select
                          value={secForm.sessionTimeoutMinutes}
                          onChange={(e) =>
                            setSecForm({
                              ...secForm,
                              sessionTimeoutMinutes: Number(e.target.value)
                            })
                          }
                          className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg"
                        >
                          <option value={0}>Disabled</option>
                          <option value={15}>15 Minutes</option>
                          <option value={30}>30 Minutes</option>
                          <option value={60}>60 Minutes</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSecurityConfig(secForm);
                          onSecurityLog(
                            'Admin',
                            `Updated security policy (${secForm.adminAuthMode})`,
                            'System',
                            'Success'
                          );
                          showToast('Security policy & OTP contacts saved!');
                        }}
                        className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Security Policy</span>
                      </button>
                    </div>

                    {/* Right: Change Admin Password & Student Portal Security */}
                    <div className="space-y-6">
                      <form
                        onSubmit={handleChangeAdminPasswordInTab}
                        className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3"
                      >
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-emerald-700" />
                          <span>Change Admin Password (SHA-256 Encrypted)</span>
                        </h3>

                        {secPassMessage && (
                          <div
                            className={`p-2.5 rounded-lg text-xs font-bold border ${
                              secPassMessage.type === 'ok'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}
                          >
                            {secPassMessage.text}
                          </div>
                        )}

                        <input
                          type="password"
                          required
                          value={secCurrentPass}
                          onChange={(e) => setSecCurrentPass(e.target.value)}
                          placeholder="Current Admin Password"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                        />

                        <div className="space-y-1.5">
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={secNewPass}
                            onChange={(e) => setSecNewPass(e.target.value)}
                            placeholder="New Password (min 6 characters)"
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                          />
                          {secNewPass && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    evaluatePasswordStrength(secNewPass).barColor
                                  }`}
                                  style={{
                                    width: `${
                                      evaluatePasswordStrength(secNewPass).score * 25
                                    }%`
                                  }}
                                />
                              </div>
                              <span
                                className={`text-[10px] font-bold ${
                                  evaluatePasswordStrength(secNewPass).textColor
                                }`}
                              >
                                {evaluatePasswordStrength(secNewPass).label}
                              </span>
                            </div>
                          )}
                        </div>

                        <input
                          type="password"
                          required
                          minLength={6}
                          value={secConfirmPass}
                          onChange={(e) => setSecConfirmPass(e.target.value)}
                          placeholder="Confirm New Password"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                        />

                        <button
                          type="submit"
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Update Admin Password
                        </button>
                      </form>

                      {/* Student Portal Access Controls */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Student Portal Authentication Controls
                        </h3>
                        <div className="space-y-2 text-xs">
                          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                            <div>
                              <span className="font-bold text-slate-900 block">
                                Require Password / OTP on Student Portal
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Locks Student Portal until student authenticates
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={secForm.requireStudentAuth}
                              onChange={(e) => {
                                const updated = {
                                  ...secForm,
                                  requireStudentAuth: e.target.checked
                                };
                                setSecForm(updated);
                                onUpdateSecurityConfig(updated);
                              }}
                              className="w-4 h-4 text-emerald-600"
                            />
                          </label>

                          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                            <div>
                              <span className="font-bold text-slate-900 block">
                                Allow Student 6-Digit OTP Login
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Students can unlock via registered mobile OTP
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={secForm.allowStudentOtpLogin}
                              onChange={(e) => {
                                const updated = {
                                  ...secForm,
                                  allowStudentOtpLogin: e.target.checked
                                };
                                setSecForm(updated);
                                onUpdateSecurityConfig(updated);
                              }}
                              className="w-4 h-4 text-emerald-600"
                            />
                          </label>

                          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                            <div>
                              <span className="font-bold text-slate-900 block">
                                Show Demo Test Credential Helpers
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Turn off in production to hide demo hints & quick-fill
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={secForm.showDemoLoginHelpers}
                              onChange={(e) => {
                                const updated = {
                                  ...secForm,
                                  showDemoLoginHelpers: e.target.checked
                                };
                                setSecForm(updated);
                                onUpdateSecurityConfig(updated);
                              }}
                              className="w-4 h-4 text-emerald-600"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Automated Fee-Default Suspension Background Listener Policy */}
                  {(() => {
                    const threshold = Math.max(
                      1,
                      Math.min(12, autoSuspensionConfig.consecutiveMissedMonthsThreshold)
                    );
                    const suspendedStudents = students.filter(
                      (s) => s.enrollmentStatus === 'Suspended'
                    );
                    const monitoredStudents = students.filter(
                      (s) =>
                        s.enrollmentStatus !== 'Disenrolled' &&
                        !s.isCharitySeat &&
                        s.netMonthlyFee > 0
                    );
                    const atRiskStudents = monitoredStudents.filter((s) => {
                      if (s.enrollmentStatus === 'Suspended') return false;
                      const summary = computeConsecutiveMissedMonths(s, feePlans, {
                        includePartialAsMissed: autoSuspensionConfig.includePartialAsMissed
                      });
                      return (
                        summary.consecutiveMissedMonths > 0 &&
                        summary.consecutiveMissedMonths >= Math.max(1, threshold - 1)
                      );
                    });

                    return (
                      <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3.5">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <ShieldAlert className="w-4 h-4 text-amber-700" />
                              <h4 className="text-sm font-bold text-slate-900">
                                Automated Fee-Default Suspension Listener
                              </h4>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                                  autoSuspensionConfig.enabled
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                    : 'bg-slate-100 text-slate-600 border border-slate-300'
                                }`}
                              >
                                {autoSuspensionConfig.enabled
                                  ? 'Listener Active'
                                  : 'Listener Paused'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              Monitors monthly fee ledgers in the background and automatically updates
                              a student&apos;s enrollment status to <strong>Suspended</strong> when
                              consecutive missed monthly payments reach the configured threshold,
                              recording each action in the audit log.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const res = onRunAutoSuspensionScan();
                              if (res.suspendedCount > 0 || res.reinstatedCount > 0) {
                                showToast(
                                  `Policy check complete: ${res.suspendedCount} suspended, ${res.reinstatedCount} reinstated.`
                                );
                              } else {
                                showToast(
                                  'Policy check complete: no new enrollment status changes required.'
                                );
                              }
                            }}
                            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Run Policy Check Now</span>
                          </button>
                        </div>

                        {/* Live Compliance KPI Strip */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
                            <div>
                              <span className="text-[11px] font-semibold text-amber-900 block">
                                Currently Suspended
                              </span>
                              <span className="text-[10px] text-amber-700">
                                Reached {threshold}+ missed months
                              </span>
                            </div>
                            <span className="text-xl font-extrabold font-mono tabular-nums text-amber-900">
                              {suspendedStudents.length}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                            <div>
                              <span className="text-[11px] font-semibold text-slate-700 block">
                                Near Threshold (At Risk)
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Active accounts with overdue streak
                              </span>
                            </div>
                            <span className="text-xl font-extrabold font-mono tabular-nums text-slate-900">
                              {atRiskStudents.length}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                            <div>
                              <span className="text-[11px] font-semibold text-emerald-900 block">
                                Monitored Fee Accounts
                              </span>
                              <span className="text-[10px] text-emerald-700">
                                Excludes Charity &amp; Disenrolled
                              </span>
                            </div>
                            <span className="text-xl font-extrabold font-mono tabular-nums text-emerald-900">
                              {monitoredStudents.length}
                            </span>
                          </div>
                        </div>

                        {/* Policy Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                            <div>
                              <span className="font-bold text-slate-900 block">
                                Enable Background Auto-Suspension Listener
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Automatically checks ledgers on update and every{' '}
                                {autoSuspensionConfig.checkIntervalSeconds}s
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={autoSuspensionConfig.enabled}
                              onChange={(e) => {
                                onUpdateAutoSuspensionConfig({
                                  ...autoSuspensionConfig,
                                  enabled: e.target.checked
                                });
                                showToast(
                                  e.target.checked
                                    ? 'Auto-suspension background listener enabled.'
                                    : 'Auto-suspension background listener paused.'
                                );
                              }}
                              className="w-4 h-4 text-emerald-600"
                            />
                          </label>

                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                            <div>
                              <label
                                htmlFor="auto-suspend-threshold"
                                className="font-bold text-slate-900 block"
                              >
                                Consecutive Missed Months Threshold
                              </label>
                              <span className="text-[11px] text-slate-500">
                                Suspend when trailing unpaid months hit this count
                              </span>
                            </div>
                            <select
                              id="auto-suspend-threshold"
                              value={autoSuspensionConfig.consecutiveMissedMonthsThreshold}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                onUpdateAutoSuspensionConfig({
                                  ...autoSuspensionConfig,
                                  consecutiveMissedMonthsThreshold: val
                                });
                                showToast(
                                  `Auto-suspension threshold set to ${val} consecutive missed month${
                                    val === 1 ? '' : 's'
                                  }.`
                                );
                              }}
                              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 tabular-nums"
                            >
                              {[1, 2, 3, 4, 5, 6].map((n) => (
                                <option key={n} value={n}>
                                  {n} {n === 1 ? 'Month' : 'Months'}
                                </option>
                              ))}
                            </select>
                          </div>

                          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                            <div>
                              <span className="font-bold text-slate-900 block">
                                Count Partially Paid Months as Missed
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Treat incomplete monthly dues toward the suspension streak
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={autoSuspensionConfig.includePartialAsMissed}
                              onChange={(e) =>
                                onUpdateAutoSuspensionConfig({
                                  ...autoSuspensionConfig,
                                  includePartialAsMissed: e.target.checked
                                })
                              }
                              className="w-4 h-4 text-emerald-600"
                            />
                          </label>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer gap-2">
                              <div>
                                <span className="font-bold text-slate-900 block">
                                  Auto-Reinstate on Payment
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Restore to Enrolled once cleared
                                </span>
                              </div>
                              <input
                                type="checkbox"
                                checked={autoSuspensionConfig.autoReinstateOnPayment}
                                onChange={(e) =>
                                  onUpdateAutoSuspensionConfig({
                                    ...autoSuspensionConfig,
                                    autoReinstateOnPayment: e.target.checked
                                  })
                                }
                                className="w-4 h-4 text-emerald-600 shrink-0"
                              />
                            </label>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                              <div>
                                <label
                                  htmlFor="auto-suspend-interval"
                                  className="font-bold text-slate-900 block"
                                >
                                  Scan Interval
                                </label>
                                <span className="text-[10px] text-slate-500">Background poll</span>
                              </div>
                              <select
                                id="auto-suspend-interval"
                                value={autoSuspensionConfig.checkIntervalSeconds}
                                onChange={(e) =>
                                  onUpdateAutoSuspensionConfig({
                                    ...autoSuspensionConfig,
                                    checkIntervalSeconds: Number(e.target.value)
                                  })
                                }
                                className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs tabular-nums"
                              >
                                <option value={10}>10s</option>
                                <option value={15}>15s</option>
                                <option value={30}>30s</option>
                                <option value={60}>60s</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Quick Reinstatement List for Currently Suspended Students */}
                        {suspendedStudents.length > 0 && (
                          <div className="pt-2 border-t border-slate-200 space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wide text-amber-900 block">
                              Suspended Accounts ({suspendedStudents.length})
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                              {suspendedStudents.map((stu) => (
                                <div
                                  key={stu.id}
                                  className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-2 text-xs"
                                >
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 truncate">
                                      {stu.studentName}{' '}
                                      <span className="font-mono text-[11px] text-amber-900">
                                        ({stu.studentIdCode})
                                      </span>
                                    </p>
                                    <p className="text-[10px] text-amber-800 truncate">
                                      {stu.suspensionReason || 'Suspended for missed payments'}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onReinstateStudent(stu.id);
                                      showToast(`Reinstated ${stu.studentName} to Enrolled.`);
                                    }}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer shrink-0"
                                  >
                                    Reinstate
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Student Portal Password Reset Table + Recent Security & Policy Audit Logs */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                      <h4 className="text-sm font-bold text-slate-900">
                        Student Portal Password Status ({students.length})
                      </h4>
                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
                        {students.map((stu) => (
                          <div
                            key={stu.id}
                            className="py-2.5 flex items-center justify-between gap-2"
                          >
                            <div>
                              <span className="font-mono font-bold text-emerald-700">
                                {stu.studentIdCode}
                              </span>{' '}
                              <span className="font-bold text-slate-900">
                                {stu.studentName}
                              </span>
                              <span className="block text-[11px] text-slate-500">
                                {stu.hasCustomPassword
                                  ? 'Custom SHA-256 Password Set'
                                  : `Default PIN: Last 4 digits (${stu.phone
                                      .replace(/\D/g, '')
                                      .slice(-4)})`}
                              </span>
                            </div>
                            {stu.hasCustomPassword ? (
                              <button
                                type="button"
                                onClick={() => {
                                  onSetStudentPortalPassword(stu.id, '');
                                  showToast(`Reset ${stu.studentIdCode} password to default PIN.`);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[11px] cursor-pointer"
                              >
                                Reset to PIN
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                Mobile PIN / OTP
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-emerald-700" />
                          <span>System &amp; Security Audit Log ({securityLogs.length})</span>
                        </h4>
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                          {(
                            [
                              { id: 'all', label: 'All' },
                              { id: 'suspension', label: 'Auto-Suspension' },
                              { id: 'security', label: 'Security' }
                            ] as const
                          ).map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setAuditLogFilter(tab.id)}
                              className={`px-2 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                                auditLogFilter === tab.id
                                  ? 'bg-white text-slate-900 shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {(() => {
                        const visibleLogs = securityLogs.filter((log) => {
                          const isSuspensionLog =
                            log.status === 'Suspended' ||
                            log.actor.includes('Auto-Suspension') ||
                            log.event.toLowerCase().includes('reinstated') ||
                            log.event.toLowerCase().includes('suspended');
                          if (auditLogFilter === 'suspension') return isSuspensionLog;
                          if (auditLogFilter === 'security') return !isSuspensionLog;
                          return true;
                        });

                        if (visibleLogs.length === 0) {
                          return (
                            <p className="text-xs text-slate-400 py-6 text-center">
                              No matching audit log events recorded yet.
                            </p>
                          );
                        }

                        return (
                          <div className="max-h-56 overflow-y-auto space-y-2">
                            {visibleLogs.map((log) => (
                              <div
                                key={log.id}
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                                  log.status === 'Suspended'
                                    ? 'bg-amber-50/70 border-amber-200'
                                    : 'bg-slate-50 border-slate-200/80'
                                }`}
                              >
                                <div>
                                  <p className="font-bold text-slate-900">{log.event}</p>
                                  <p className="text-[10px] text-slate-500">
                                    Actor: <strong>{log.actor}</strong> · Method:{' '}
                                    <strong>{log.method}</strong> · {log.timestamp}
                                  </p>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold shrink-0 ${
                                    log.status === 'Success'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : log.status === 'Suspended'
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : log.status === 'Reset'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {log.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: ONLINE DATA SYNC, CLOUD RESTORE POINTS & LOCAL BACKUP / RESTORE */}
              {activeTab === 'backup-sync' && (
                <DataSyncBackupTab
                  bundle={dataBundle}
                  cloudUser={cloudUser}
                  cloudSyncState={cloudSyncState}
                  cloudSyncError={cloudSyncError}
                  autoCloudSync={autoCloudSync}
                  onToggleAutoCloudSync={onToggleAutoCloudSync}
                  lastSyncedMeta={lastSyncedMeta}
                  cloudRemoteMeta={cloudRemoteMeta}
                  cloudBackups={cloudBackups}
                  isCloudLoading={isCloudLoading}
                  onSignInGoogle={onSignInGoogle}
                  onSignOutGoogle={onSignOutGoogle}
                  onPushToCloud={onPushToCloud}
                  onPullFromCloud={onPullFromCloud}
                  onCreateCloudBackup={onCreateCloudBackup}
                  onRestoreCloudBackup={onRestoreCloudBackup}
                  onDeleteCloudBackup={onDeleteCloudBackup}
                  onRefreshCloudState={onRefreshCloudState}
                  onApplyRestoreBundle={onApplyRestoreBundle}
                  onShowToast={showToast}
                />
              )}

              {/* TAB 8: DASHBOARD THEME & INTERACTIVE LOOK */}
              {activeTab === 'theme' && (
                <DashboardThemeTab
                  themeConfig={dashboardTheme}
                  onUpdateTheme={onUpdateDashboardTheme}
                  onShowToast={showToast}
                />
              )}

              {/* TAB 9: SUSPENDED STUDENTS VISUAL DASHBOARD */}
              {activeTab === 'suspended' && (
                <SuspendedStudentsDashboardTab
                  students={students}
                  feePlans={feePlans}
                  autoSuspensionConfig={autoSuspensionConfig}
                  securityLogs={securityLogs}
                  onRunAutoSuspensionScan={onRunAutoSuspensionScan}
                  onOverrideSuspension={onReinstateStudent}
                  onOpenPolicySettings={() => setActiveTab('security')}
                  onShowToast={showToast}
                />
              )}
            </div>
          </div>
        )}
      </div>
      <ForgotPasswordModal
        isOpen={showForgotSupportModal}
        role="admin"
        instituteConfig={instituteConfig}
        onClose={() => setShowForgotSupportModal(false)}
      />
    </div>
  );
};
