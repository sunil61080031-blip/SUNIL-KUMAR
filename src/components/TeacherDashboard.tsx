import React, { useMemo, useState } from 'react';
import {
  AttendanceRecord,
  AttendanceStatus,
  BatchItem,
  FeePlan,
  FeeReminderSettings,
  InstituteConfig,
  NoticeCategory,
  NoticeItem,
  StaffMember,
  StudentRecord
} from '../types';
import { computeStudentFinancials, PdfExportRequest } from '../utils/ledgerHelpers';
import { computeDaysPastDeadline } from '../utils/reminderHelpers';
import {
  Bell,
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  LogOut,
  MessageCircle,
  PlusCircle,
  Printer,
  Search,
  Users
} from 'lucide-react';

interface TeacherDashboardProps {
  staff: StaffMember;
  instituteConfig: InstituteConfig;
  batches: BatchItem[];
  students: StudentRecord[];
  feePlans: FeePlan[];
  notices: NoticeItem[];
  feeReminderSettings: FeeReminderSettings;
  onRecordAttendance: (studentId: string, record: AttendanceRecord) => void;
  onAddNotice: (notice: NoticeItem) => void;
  onPrintNotice: (notice: NoticeItem) => void;
  onOpenPdfExport: (req: PdfExportRequest) => void;
  onLogout: () => void;
}

type TeacherTab = 'attendance' | 'students' | 'notices';

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  staff,
  instituteConfig,
  batches,
  students,
  feePlans,
  notices,
  feeReminderSettings,
  onRecordAttendance,
  onAddNotice,
  onPrintNotice,
  onOpenPdfExport,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<TeacherTab>('attendance');
  const [searchQuery, setSearchQuery] = useState('');

  // Assigned batches for this teacher
  const assignedBatches = useMemo(() => {
    const hasAll = staff.assignedBatchIds.includes('ALL-BATCHES');
    if (hasAll) return batches;
    const matched = batches.filter(
      (b) =>
        staff.assignedBatchIds.includes(b.batchCode) ||
        staff.assignedBatchIds.includes(b.id) ||
        b.assignedStaffName.toLowerCase().includes(staff.name.toLowerCase())
    );
    return matched.length > 0 ? matched : batches;
  }, [batches, staff]);

  const [selectedBatchCode, setSelectedBatchCode] = useState<string>(
    assignedBatches[0]?.batchCode || 'ALL'
  );

  // Assigned enrolled students
  const assignedStudents = useMemo(() => {
    const batchCodes = new Set(assignedBatches.map((b) => b.batchCode));
    return students.filter(
      (s) => s.enrollmentStatus !== 'Disenrolled' && batchCodes.has(s.batchCode)
    );
  }, [students, assignedBatches]);

  const batchStudents = useMemo(() => {
    return assignedStudents.filter((s) => {
      const batchMatch =
        selectedBatchCode === 'ALL' || s.batchCode === selectedBatchCode;
      const q = searchQuery.trim().toLowerCase();
      const searchMatch =
        !q ||
        s.studentName.toLowerCase().includes(q) ||
        s.studentIdCode.toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q);
      return batchMatch && searchMatch;
    });
  }, [assignedStudents, selectedBatchCode, searchQuery]);

  // Daily Attendance state
  const todayStr = new Date().toISOString().slice(0, 10);
  const [attDate, setAttDate] = useState(todayStr);
  const [attTopic, setAttTopic] = useState('Regular Classroom Lesson & Practice');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(''), 3000);
  };

  // Notice publish state
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<NoticeCategory>('General');
  const [noticeContent, setNoticeContent] = useState('');

  // Stats
  const stats = useMemo(() => {
    const daysPast = computeDaysPastDeadline(feeReminderSettings.activeDeadlineDate);
    let markedToday = 0;
    let overdueCount = 0;

    for (const stu of assignedStudents) {
      if ((stu.attendanceRecords || []).some((r) => r.date === attDate)) {
        markedToday++;
      }
      const fin = computeStudentFinancials(stu, feePlans);
      if (fin.totalCombinedPending > 0 && daysPast > 0) {
        overdueCount++;
      }
    }

    return {
      batchesCount: assignedBatches.length,
      studentsCount: assignedStudents.length,
      markedToday,
      overdueCount
    };
  }, [assignedBatches, assignedStudents, attDate, feePlans, feeReminderSettings]);

  const handleMarkSingle = (student: StudentRecord, status: AttendanceStatus) => {
    onRecordAttendance(student.id, {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: attDate,
      status,
      subjectTopic: attTopic.trim() || 'Classroom Session',
      shift: student.shift,
      markedBy: `${staff.name} (${staff.staffCode})`
    });
    showToast(`Marked ${student.studentName} as ${status} for ${attDate}.`);
  };

  const handleMarkAllPresent = () => {
    const targets = batchStudents.filter(
      (stu) => !(stu.attendanceRecords || []).some((r) => r.date === attDate)
    );
    if (targets.length === 0) {
      showToast(`Attendance already recorded for all shown students on ${attDate}.`);
      return;
    }
    targets.forEach((stu) => {
      onRecordAttendance(stu.id, {
        id: `att-${Date.now()}-${stu.id}`,
        date: attDate,
        status: 'Present',
        subjectTopic: attTopic.trim() || 'Classroom Session',
        shift: stu.shift,
        markedBy: `${staff.name} (${staff.staffCode})`
      });
    });
    showToast(`Marked ${targets.length} students Present for ${attDate}.`);
  };

  const handlePublishNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;
    const newNotice: NoticeItem = {
      id: `n-t-${Date.now()}`,
      refNo: `SNTC/${new Date().getFullYear()}/T-${Math.floor(100 + Math.random() * 900)}`,
      title: noticeTitle.trim(),
      hindiTitle: noticeTitle.trim(),
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      category: noticeCategory,
      isUrgent: noticeCategory === 'Urgent',
      isPinned: false,
      applicableClasses: assignedBatches.map((b) => b.batchCode).join(', '),
      issuedBy: `${staff.name} (${staff.role})`,
      content: noticeContent.trim(),
      hindiContent: noticeContent.trim()
    };
    onAddNotice(newNotice);
    setNoticeTitle('');
    setNoticeContent('');
    showToast('Class notice published successfully.');
  };

  const centreName =
    instituteConfig.studyCentres.find((c) => c.id === staff.assignedCentreId)?.name ||
    'Main Campus';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 lg:pb-10 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-base sm:text-lg font-extrabold text-slate-900 truncate">
              Shiksha Niketan · Teacher Portal
            </h1>
            <p className="text-xs text-slate-500 truncate">
              {staff.name} · {staff.staffCode} · {staff.shift}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-100 rounded-xl mr-2">
              {(
                [
                  { id: 'attendance', label: 'Daily Attendance', icon: ClipboardCheck },
                  { id: 'students', label: 'My Students', icon: Users },
                  { id: 'notices', label: 'Class Notices', icon: Bell }
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-white text-sky-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={onLogout}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* Toast feedback */}
        {toastMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Faculty Banner & Key KPIs */}
        <section className="bg-gradient-to-r from-[#085bb5] via-[#0c7fd1] to-[#10a8bd] text-white rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-cyan-100">
                {staff.role} · {centreName}
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold mt-0.5">
                Welcome, {staff.name}
              </h2>
              <p className="text-xs text-sky-100 mt-1 max-w-2xl">
                {staff.responsibility}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
              <div className="bg-white/15 backdrop-blur-xs rounded-xl px-3.5 py-2.5">
                <span className="text-[11px] text-cyan-100 block">Assigned Batches</span>
                <strong className="font-mono tabular-nums text-lg font-extrabold">
                  {stats.batchesCount}
                </strong>
              </div>
              <div className="bg-white/15 backdrop-blur-xs rounded-xl px-3.5 py-2.5">
                <span className="text-[11px] text-cyan-100 block">My Students</span>
                <strong className="font-mono tabular-nums text-lg font-extrabold">
                  {stats.studentsCount}
                </strong>
              </div>
              <div className="bg-white/15 backdrop-blur-xs rounded-xl px-3.5 py-2.5">
                <span className="text-[11px] text-cyan-100 block">Marked ({attDate.slice(5)})</span>
                <strong className="font-mono tabular-nums text-lg font-extrabold">
                  {stats.markedToday}/{stats.studentsCount}
                </strong>
              </div>
              <div className="bg-white/15 backdrop-blur-xs rounded-xl px-3.5 py-2.5">
                <span className="text-[11px] text-cyan-100 block">Fee Overdue</span>
                <strong className="font-mono tabular-nums text-lg font-extrabold">
                  {stats.overdueCount}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* Batch Filter Controls (shared by Attendance & Students tabs) */}
        {(activeTab === 'attendance' || activeTab === 'students') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedBatchCode('ALL')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedBatchCode === 'ALL'
                    ? 'bg-sky-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Assigned ({assignedStudents.length})
              </button>
              {assignedBatches.map((batch) => (
                <button
                  key={batch.id}
                  type="button"
                  onClick={() => setSelectedBatchCode(batch.batchCode)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    selectedBatchCode === batch.batchCode
                      ? 'bg-sky-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {batch.batchCode} · {batch.classLevel}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or ID..."
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        )}

        {/* TAB 1: DAILY ATTENDANCE */}
        {activeTab === 'attendance' && (
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Attendance Date
                  </label>
                  <input
                    type="date"
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lesson / Subject Topic
                  </label>
                  <input
                    type="text"
                    value={attTopic}
                    onChange={(e) => setAttTopic(e.target.value)}
                    placeholder="e.g. Quadratic Equations Exercise 4.2"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <CalendarCheck2 className="w-4 h-4" />
                <span>Mark Unmarked Present</span>
              </button>
            </div>

            {batchStudents.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                No students found for the selected batch filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {batchStudents.map((stu) => {
                  const existingToday = (stu.attendanceRecords || []).find(
                    (r) => r.date === attDate
                  );
                  return (
                    <div
                      key={stu.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {stu.studentName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {stu.studentIdCode} · {stu.classLevel} · {stu.batchCode}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {(
                          ['Present', 'Absent', 'Late', 'Authorized Leave'] as AttendanceStatus[]
                        ).map((st) => {
                          const isSelected = existingToday?.status === st;
                          const shortLabel = st === 'Authorized Leave' ? 'Leave' : st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleMarkSingle(stu, st)}
                              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                isSelected
                                  ? st === 'Present'
                                    ? 'bg-emerald-600 text-white'
                                    : st === 'Absent'
                                    ? 'bg-rose-600 text-white'
                                    : st === 'Late'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-sky-600 text-white'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {shortLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: MY STUDENTS & REPORT CARDS */}
        {activeTab === 'students' && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batchStudents.map((stu) => {
              const fin = computeStudentFinancials(stu, feePlans);
              const daysPast = computeDaysPastDeadline(
                feeReminderSettings.activeDeadlineDate
              );
              const isOverdue = fin.totalCombinedPending > 0 && daysPast > 0;
              const records = stu.attendanceRecords || [];
              const presentCount = records.filter(
                (r) => r.status === 'Present' || r.status === 'Late'
              ).length;
              const attPercent =
                records.length > 0
                  ? Math.round((presentCount / records.length) * 100)
                  : 100;
              const waPhone = stu.phone.replace(/\D/g, '');

              return (
                <article
                  key={stu.id}
                  className={`bg-white rounded-2xl p-4 border transition-colors flex flex-col justify-between gap-4 ${
                    isOverdue ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-extrabold text-slate-900 truncate">
                          {stu.studentName}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {stu.studentIdCode} · {stu.classLevel} · {stu.batchCode}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold shrink-0 ${
                          isOverdue
                            ? 'text-rose-700'
                            : fin.totalCombinedPending > 0
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {isOverdue
                          ? 'Overdue'
                          : fin.totalCombinedPending > 0
                          ? 'Pending'
                          : 'Cleared'}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block">Attendance</span>
                        <strong className="font-mono tabular-nums text-slate-900">
                          {attPercent}% ({presentCount}/{records.length})
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Pending Dues</span>
                        <strong
                          className={`font-mono tabular-nums ${
                            isOverdue ? 'text-rose-700' : 'text-slate-900'
                          }`}
                        >
                          ₹{fin.totalCombinedPending.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenPdfExport({
                          type: 'student-report-card',
                          studentId: stu.id
                        })
                      }
                      className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Report Card</span>
                    </button>
                    <a
                      href={`https://wa.me/91${waPhone.slice(-10)}?text=${encodeURIComponent(
                        `Namaste ${stu.parentName}, update from ${staff.name} (Shiksha Niketan) regarding ${stu.studentName} (${stu.classLevel}).`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Parent</span>
                    </a>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* TAB 3: CLASS NOTICES */}
        {activeTab === 'notices' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Publish Notice Form */}
            <form
              onSubmit={handlePublishNotice}
              className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 h-fit"
            >
              <h3 className="font-display text-base font-extrabold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-sky-700" />
                <span>Post Class Announcement</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notice Title
                </label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. Sunday Chapter-4 Maths Test Schedule"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={noticeCategory}
                  onChange={(e) => setNoticeCategory(e.target.value as NoticeCategory)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold"
                >
                  <option value="General">General</option>
                  <option value="Exam">Exam</option>
                  <option value="Batch">Batch</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notice Details
                </label>
                <textarea
                  required
                  rows={4}
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="Enter syllabus, test timing, or homework instructions..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold cursor-pointer"
              >
                Publish Notice
              </button>
            </form>

            {/* Recent Notices List */}
            <div className="lg:col-span-3 space-y-3">
              {notices.map((notice) => (
                <article
                  key={notice.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        {notice.category} · {notice.date} · {notice.refNo}
                      </p>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {notice.title}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => onPrintNotice(notice)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{notice.content}</p>
                  <p className="text-[11px] text-slate-500">
                    Issued by {notice.issuedBy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Tab Bar (Thumb-Zone Navigation, <= 15% viewport height) */}
      <nav
        aria-label="Teacher sections"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-3 h-16"
      >
        {(
          [
            { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
            { id: 'students', label: 'Students', icon: BookOpen },
            { id: 'notices', label: 'Notices', icon: Bell }
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-bold cursor-pointer ${
                active ? 'text-sky-700' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
