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
  StudentRecord
} from '../types';
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
  Building2,
  Briefcase,
  BookOpen,
  Bell,
  Upload,
  Save,
  RotateCcw,
  Pencil
} from 'lucide-react';

export type AdminTabType = 'branding' | 'students' | 'staff' | 'batches' | 'notices';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onLogin: (pass: string) => boolean;
  onLogout: () => void;
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
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  onLogin,
  onLogout,
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
  initialTab = 'branding'
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTabType>(initialTab);
  const [saveBanner, setSaveBanner] = useState('');
  const [confirmClearAllStudents, setConfirmClearAllStudents] = useState(false);

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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = onLogin(passwordInput);
    if (!success) {
      setLoginError('Invalid password. Default password is: sunil2026');
    } else {
      setPasswordInput('');
    }
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
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {instForm.name} — Admin Control Suite
              </h2>
              <p className="text-[11px] text-emerald-300">
                Institute Branding · Multi-Study Centres · 500-Student Register · Staff Roles · Edit Active Batch IDs
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

        {/* Not Logged In: Password Gate */}
        {!isAdmin ? (
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto space-y-6 my-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-700">
              <Lock className="w-8 h-8 text-emerald-700" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Institute Head / Admin Login
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Sign in to change institute name, contact number, images, study centres, assign staff roles, edit active batch IDs, and control the 500-student register.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter Admin Password (sunil2026)"
                className="w-full px-4 py-2.5 text-xs text-center font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:bg-white"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
              >
                Unlock Admin Suite
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => onLogin('sunil2026')}
                className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs rounded-xl transition-colors"
              >
                Instant 1-Click Admin Demo Login
              </button>
              <p className="text-[11px] text-slate-400">
                Default Access Password:{' '}
                <code className="font-mono font-bold text-slate-700">sunil2026</code>
              </p>
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'notices'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>5. Notices ({notices.length})</span>
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
                    <div className="space-y-2.5">
                      {students.map((stu) => (
                        <div
                          key={stu.id}
                          className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
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
                              {stu.disenrollmentDate
                                ? ` | Disenrolled: ${stu.disenrollmentDate}`
                                : ''}
                              {stu.reEnrollmentDate
                                ? ` | Re-Enrolled: ${stu.reEnrollmentDate}`
                                : ''}
                              {' · '}Receipts: {stu.feePayments?.length || 0} · Attendance Logs:{' '}
                              {stu.attendanceRecords?.length || 0}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
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

                            {stu.enrollmentStatus === 'Disenrolled' ? (
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
