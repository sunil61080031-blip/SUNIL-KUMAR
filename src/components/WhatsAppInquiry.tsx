import React, { useState, useEffect } from 'react';
import {
  InquiryItem,
  StudentRecord,
  BatchItem,
  FeePlan,
  InstituteConfig,
  FeeDiscountType,
  EnrollmentStatus
} from '../types';
import { DISCOUNT_OPTIONS } from '../data/seedData';
import {
  Send,
  CheckCircle2,
  MessageCircle,
  UserCheck,
  AlertCircle,
  Calendar,
  HeartHandshake,
  RotateCcw,
  UserMinus,
  UserPlus,
  Search
} from 'lucide-react';

interface WhatsAppInquiryProps {
  instituteConfig: InstituteConfig;
  batches: BatchItem[];
  feePlans: FeePlan[];
  students: StudentRecord[];
  totalEnrolledCount: number;
  initialClass?: string;
  initialBatchCode?: string;
  initialEstimatedFee?: number;
  initialDiscountType?: FeeDiscountType;
  initialIsCharity?: boolean;
  isAdmin: boolean;
  onInquirySubmitted: (inquiry: InquiryItem) => void;
  onAddOrUpdateStudent: (student: StudentRecord) => void;
  onDisenrollStudent: (studentId: string, date: string, reason?: string) => void;
  onReEnrollStudent: (studentId: string, date: string, batchCode?: string) => void;
}

export const WhatsAppInquiry: React.FC<WhatsAppInquiryProps> = ({
  instituteConfig,
  batches,
  feePlans,
  students,
  totalEnrolledCount,
  initialClass = 'Class 10th (Matric Target)',
  initialBatchCode,
  initialDiscountType = 'None',
  isAdmin,
  onInquirySubmitted,
  onAddOrUpdateStudent,
  onDisenrollStudent,
  onReEnrollStudent
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [formMode, setFormMode] = useState<'New Enrollment' | 'Re-enrollment' | 'Disenrollment Request'>('New Enrollment');
  const [selectedExistingStudentId, setSelectedExistingStudentId] = useState<string>('');

  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [centreId, setCentreId] = useState<string>(
    instituteConfig.studyCentres[0]?.id || 'centre-1'
  );
  const [selectedBatchCode, setSelectedBatchCode] = useState<string>(
    initialBatchCode || batches[3]?.batchCode || 'BATCH-M10'
  );
  const [board, setBoard] = useState<'BSEB (Bihar Board)' | 'CBSE'>('BSEB (Bihar Board)');
  const [village, setVillage] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState<string>(todayStr);
  const [discountType, setDiscountType] = useState<FeeDiscountType>(initialDiscountType);
  const [charityReason, setCharityReason] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedRecord, setSubmittedRecord] = useState<StudentRecord | null>(null);

  // Student directory filter state
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | EnrollmentStatus | 'Charity'>('All');

  // Sync incoming props from Batch click or Fee Calculator
  useEffect(() => {
    if (initialBatchCode) {
      setSelectedBatchCode(initialBatchCode);
      const foundBatch = batches.find((b) => b.batchCode === initialBatchCode);
      if (foundBatch) {
        setCentreId(foundBatch.centreId);
      }
    } else if (initialClass) {
      const matchingBatch = batches.find((b) =>
        b.classLevel.toLowerCase().includes(initialClass.slice(0, 8).toLowerCase())
      );
      if (matchingBatch) {
        setSelectedBatchCode(matchingBatch.batchCode);
      }
    }
  }, [initialClass, initialBatchCode, batches]);

  useEffect(() => {
    if (initialDiscountType) {
      setDiscountType(initialDiscountType);
    }
  }, [initialDiscountType]);

  // Derived active batch & class-wise fee
  const currentBatch =
    batches.find((b) => b.batchCode === selectedBatchCode) || batches[0];

  const matchingFeePlan =
    feePlans.find((fp) => fp.classNum === currentBatch?.classNum) ||
    feePlans.find((fp) => fp.classNum === 10) ||
    feePlans[0];

  const baseMonthlyFee = matchingFeePlan ? matchingFeePlan.monthlyFee : 500;
  const discountMeta =
    DISCOUNT_OPTIONS.find((d) => d.label === discountType) || DISCOUNT_OPTIONS[0];
  const isCharitySeat = Boolean(discountMeta.isCharity);
  const netMonthlyFee = Math.max(
    0,
    Math.round(baseMonthlyFee * (1 - discountMeta.percent / 100))
  );

  // Populate fields when choosing an existing student for Re-enrollment or Disenrollment
  const handleSelectExistingStudent = (stuId: string) => {
    setSelectedExistingStudentId(stuId);
    const found = students.find((s) => s.id === stuId);
    if (found) {
      setStudentName(found.studentName);
      setParentName(found.parentName);
      setPhone(found.phone);
      setCentreId(found.centreId);
      setSelectedBatchCode(found.batchCode);
      setBoard(found.board);
      setVillage(found.village);
      setDiscountType(found.discountType);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (
      formMode === 'New Enrollment' &&
      totalEnrolledCount >= instituteConfig.maxStudentCapacity
    ) {
      setErrorMsg(
        `Maximum capacity of ${instituteConfig.maxStudentCapacity} students has been reached. Please contact Admin.`
      );
      return;
    }

    if (!studentName.trim()) {
      setErrorMsg('Please enter student full name.');
      return;
    }
    if (!parentName.trim()) {
      setErrorMsg('Please enter parent/guardian name.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    const activeCentre =
      instituteConfig.studyCentres.find((c) => c.id === centreId) ||
      instituteConfig.studyCentres[0];

    let updatedStudent: StudentRecord;

    if (formMode === 'Disenrollment Request' && selectedExistingStudentId) {
      const existing = students.find((s) => s.id === selectedExistingStudentId);
      if (existing) {
        onDisenrollStudent(existing.id, enrollmentDate, message.trim());
        updatedStudent = {
          ...existing,
          enrollmentStatus: 'Disenrolled',
          disenrollmentDate: enrollmentDate,
          notes: message.trim() || existing.notes
        };
      } else {
        return;
      }
    } else if (formMode === 'Re-enrollment' && selectedExistingStudentId) {
      const existing = students.find((s) => s.id === selectedExistingStudentId);
      if (existing) {
        onReEnrollStudent(existing.id, enrollmentDate, selectedBatchCode);
        updatedStudent = {
          ...existing,
          batchCode: selectedBatchCode,
          batchId: currentBatch.id,
          shift: currentBatch.shift,
          centreId,
          enrollmentStatus: 'Re-enrolled',
          reEnrollmentDate: enrollmentDate,
          discountType,
          discountPercent: discountMeta.percent,
          isCharitySeat,
          netMonthlyFee
        };
      } else {
        return;
      }
    } else {
      // New Enrollment (or Re-enrollment without pre-selected record)
      const nextCodeNum = String(students.length + 1).padStart(3, '0');
      updatedStudent = {
        id: `stu-${Date.now()}`,
        studentIdCode: `STU-2026-${nextCodeNum}`,
        studentName: studentName.trim(),
        parentName: parentName.trim(),
        phone: cleanPhone,
        classLevel: currentBatch.classLevel,
        classNum: currentBatch.classNum,
        batchId: currentBatch.id,
        batchCode: currentBatch.batchCode,
        shift: currentBatch.shift,
        centreId,
        board,
        village: village.trim() || activeCentre.location,
        enrollmentDate: formMode === 'New Enrollment' ? enrollmentDate : todayStr,
        reEnrollmentDate: formMode === 'Re-enrollment' ? enrollmentDate : undefined,
        enrollmentStatus: formMode === 'Re-enrollment' ? 'Re-enrolled' : 'Enrolled',
        baseMonthlyFee,
        discountType,
        discountPercent: discountMeta.percent,
        isCharitySeat,
        charityNote: isCharitySeat ? charityReason.trim() || 'Charity Quota Applied' : undefined,
        netMonthlyFee,
        notes: message.trim()
      };
      onAddOrUpdateStudent(updatedStudent);
    }

    const newInquiry: InquiryItem = {
      id: `inq-${Date.now()}`,
      studentName: studentName.trim(),
      parentName: parentName.trim(),
      phone: cleanPhone,
      classLevel: currentBatch.classLevel,
      batchCode: currentBatch.batchCode,
      shift: currentBatch.shift,
      centreId,
      board,
      village: village.trim() || 'Gadhiya / Bhaptiyahi',
      enrollmentDate,
      enrollmentType: formMode,
      discountType,
      isCharitySeat,
      netMonthlyFee,
      message: message.trim(),
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      status:
        formMode === 'Disenrollment Request'
          ? 'Disenrolled'
          : formMode === 'Re-enrollment'
          ? 'Re-enrolled'
          : 'Enrolled'
    };

    onInquirySubmitted(newInquiry);
    setSubmittedRecord(updatedStudent);
  };

  const triggerWhatsAppConfirmation = (stu: StudentRecord) => {
    const centreObj = instituteConfig.studyCentres.find((c) => c.id === stu.centreId);
    let waText = `*${instituteConfig.name} — ${formMode} Slip*\n`;
    waText += `------------------------------------\n`;
    waText += `*Student ID:* ${stu.studentIdCode}\n`;
    waText += `*Student Name:* ${stu.studentName}\n`;
    waText += `*Guardian:* ${stu.parentName}\n`;
    waText += `*Study Centre:* ${centreObj?.name || 'Main Campus'}\n`;
    waText += `*Batch ID & Shift:* ${stu.batchCode} (${stu.shift})\n`;
    waText += `*Class:* ${stu.classLevel}\n`;
    waText += `*Date (${formMode}):* ${enrollmentDate}\n`;
    waText += `*Class Base Fee:* ₹${stu.baseMonthlyFee}/month\n`;
    waText += `*Discount / Charity:* ${stu.discountType}\n`;
    waText += `*Net Payable Fee:* ₹${stu.netMonthlyFee}/month\n`;
    waText += `------------------------------------\n`;
    waText += `Respected ${instituteConfig.founder} Sir, please verify this ${formMode.toLowerCase()} record.`;

    const targetPhone = (centreObj?.phone || instituteConfig.phone).replace(/\D/g, '');
    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, '_blank');
  };

  const filteredStudents = students.filter((s) => {
    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Charity'
        ? s.isCharitySeat
        : s.enrollmentStatus === statusFilter;
    if (!matchesStatus) return false;
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      s.studentName.toLowerCase().includes(q) ||
      s.studentIdCode.toLowerCase().includes(q) ||
      s.batchCode.toLowerCase().includes(q) ||
      s.classLevel.toLowerCase().includes(q) ||
      s.village.toLowerCase().includes(q)
    );
  });

  return (
    <section id="enrollment" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Column: Capacity, Guidelines & Mode Info */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span>
                  Capacity: {totalEnrolledCount} / {instituteConfig.maxStudentCapacity} Students Enrolled
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Student Admission, Disenrollment & Re-Enrollment Form
              </h2>

              <p className="text-sm font-semibold text-emerald-800 font-hindi">
                छात्र नामांकन, पुनः नामांकन (Re-enrollment), नामांकन रद्दीकरण एवं चैरिटी शुल्क फॉर्म
              </p>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Complete student lifecycle registration supporting up to{' '}
                <strong>{instituteConfig.maxStudentCapacity} students</strong> across multiple study
                centres. Select Batch ID (Morning, Afternoon, Evening, or Night Class), Enrollment
                Date, Class-wise Tuition Fee, and Charity / Scholarship discounts.
              </p>
            </div>

            {/* Enrollment Capacity Meter */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Institute Seat Capacity Status</span>
                <span className="font-mono font-bold text-emerald-700">
                  {totalEnrolledCount} / {instituteConfig.maxStudentCapacity} Enrolled
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((totalEnrolledCount / instituteConfig.maxStudentCapacity) * 100)
                    )}%`
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px]">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <p className="font-bold text-emerald-700 text-sm tabular-nums">
                    {students.filter((s) => s.enrollmentStatus === 'Enrolled').length}
                  </p>
                  <p className="text-slate-500">Active Enrolled</p>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <p className="font-bold text-indigo-700 text-sm tabular-nums">
                    {students.filter((s) => s.enrollmentStatus === 'Re-enrolled').length}
                  </p>
                  <p className="text-slate-500">Re-Enrolled</p>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <p className="font-bold text-amber-700 text-sm tabular-nums">
                    {students.filter((s) => s.isCharitySeat).length}
                  </p>
                  <p className="text-slate-500">Charity Seats</p>
                </div>
              </div>
            </div>

            {/* Charity & Discount Highlights */}
            <div className="space-y-2.5 bg-amber-50/70 p-5 rounded-2xl border border-amber-200/80 text-xs text-slate-700">
              <p className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-amber-700" />
                <span>Charity Free Education & Discount Policy:</span>
              </p>
              <p className="text-slate-600 leading-relaxed">
                Orphaned or extremely underprivileged students can select{' '}
                <strong>Full Charity / Free Education (100%)</strong> or{' '}
                <strong>Partial Charity Aid (50%)</strong> directly in the form. Sibling (10%),
                Merit (20%), and EWS (30%) discounts are calculated automatically.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Student Admission / Re-enrollment / Disenrollment Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            {submittedRecord ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-md">
                  Student ID: {submittedRecord.studentIdCode} · Status: {submittedRecord.enrollmentStatus}
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {formMode} Recorded Successfully!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Student <strong className="text-slate-900">{submittedRecord.studentName}</strong> has been updated in Batch{' '}
                  <strong className="font-mono text-emerald-800">{submittedRecord.batchCode}</strong> ({submittedRecord.shift}). Net Monthly Tuition Fee:{' '}
                  <strong className="text-slate-900">₹{submittedRecord.netMonthlyFee}/month</strong> ({submittedRecord.discountType}).
                </p>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => setSubmittedRecord(null)}
                    className="px-4 py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Process Another Student
                  </button>
                  <button
                    onClick={() => triggerWhatsAppConfirmation(submittedRecord)}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send Official Slip on WhatsApp</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Mode Selector Tabs: New Enrollment | Re-enrollment | Disenrollment */}
                <div className="space-y-2 border-b border-slate-100 pb-4">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Select Enrollment Action Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormMode('New Enrollment');
                        setSelectedExistingStudentId('');
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                        formMode === 'New Enrollment'
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>New Enrollment</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormMode('Re-enrollment')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                        formMode === 'Re-enrollment'
                          ? 'bg-indigo-700 text-white border-indigo-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Re-Enrollment</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormMode('Disenrollment Request')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                        formMode === 'Disenrollment Request'
                          ? 'bg-rose-700 text-white border-rose-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Disenrollment</span>
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Existing Student Selector if Re-enrollment or Disenrollment */}
                {formMode !== 'New Enrollment' && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Select Registered Student for {formMode} *
                    </label>
                    <select
                      required={formMode === 'Disenrollment Request'}
                      value={selectedExistingStudentId}
                      onChange={(e) => handleSelectExistingStudent(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="">-- Choose Student by ID / Name --</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.studentIdCode} — {s.studentName} ({s.batchCode} · Current:{' '}
                          {s.enrollmentStatus})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Student & Guardian Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Rohit Kumar"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Father / Guardian Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="e.g. Rameshwar Prasad"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Mobile & Enrollment/Disenrollment/Re-enrollment Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      WhatsApp / Contact Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9650952919"
                      maxLength={12}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      <span>
                        {formMode === 'New Enrollment'
                          ? 'Enrollment Date *'
                          : formMode === 'Re-enrollment'
                          ? 'Re-Enrollment Date *'
                          : 'Disenrollment Date *'}
                      </span>
                    </label>
                    <input
                      type="date"
                      required
                      value={enrollmentDate}
                      onChange={(e) => setEnrollmentDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Study Centre & Batch ID (Morning / Evening / Night Class) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Assign Study Centre *
                    </label>
                    <select
                      value={centreId}
                      onChange={(e) => setCentreId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                    >
                      {instituteConfig.studyCentres.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.centreCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Batch ID & Shift (Morning / Evening / Night) *
                    </label>
                    <select
                      value={selectedBatchCode}
                      onChange={(e) => setSelectedBatchCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white font-medium"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.batchCode}>
                          [{b.batchCode}] {b.classLevel} — {b.shift} ({b.timing})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Class-Wise Tuition Fee & Charity / Discount Selector */}
                {formMode !== 'Disenrollment Request' && (
                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-950">
                        Class-Wise Tuition Fee & Charity / Discount Option
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-800">
                        Base Fee: ₹{baseMonthlyFee}/mo → Net Payable: ₹{netMonthlyFee}/mo
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Select Discount or Charity Option
                        </label>
                        <select
                          value={discountType}
                          onChange={(e) => setDiscountType(e.target.value as FeeDiscountType)}
                          className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-lg font-semibold text-slate-800"
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
                          Charity / Scholarship Justification Note
                        </label>
                        <input
                          type="text"
                          value={charityReason}
                          onChange={(e) => setCharityReason(e.target.value)}
                          placeholder={
                            isCharitySeat
                              ? 'Enter orphan / BPL / welfare verification details'
                              : 'Optional sibling name or school marks %'
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Target Exam Board
                    </label>
                    <select
                      value={board}
                      onChange={(e) => setBoard(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="BSEB (Bihar Board)">BSEB (Bihar Board)</option>
                      <option value="CBSE">CBSE (Central Board)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Village / Ward / Address
                    </label>
                    <input
                      type="text"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="e.g. Ward No. 08, Gadhiya, Bhaptiyahi"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                {/* Additional Note */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {formMode === 'Disenrollment Request'
                      ? 'Reason for Disenrollment *'
                      : 'Remarks / Subjects Focus (Optional)'}
                  </label>
                  <input
                    type="text"
                    required={formMode === 'Disenrollment Request'}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      formMode === 'Disenrollment Request'
                        ? 'e.g. Moving out of town / health break'
                        : 'e.g. Enrolling in Morning + Night Revision class'
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className={`w-full py-3 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm ${
                      formMode === 'Disenrollment Request'
                        ? 'bg-rose-700 hover:bg-rose-800'
                        : formMode === 'Re-enrollment'
                        ? 'bg-indigo-700 hover:bg-indigo-800'
                        : 'bg-emerald-700 hover:bg-emerald-800'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {formMode === 'New Enrollment'
                        ? `Confirm Student Enrollment (Net Fee: ₹${netMonthlyFee}/mo)`
                        : formMode === 'Re-enrollment'
                        ? 'Confirm Student Re-Enrollment'
                        : 'Record Student Disenrollment'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Live Student Enrollment, Disenrollment & Re-enrollment Directory */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Enrolled Student Register ({students.length} Records · Max {instituteConfig.maxStudentCapacity})
              </h3>
              <p className="text-xs text-slate-500">
                Track student Batch ID, Shift (Morning/Evening/Night), Enrollment Date, Disenrollment, Re-enrollment, and Charity/Discount status.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['All', 'Enrolled', 'Re-enrolled', 'Disenrolled', 'Charity'] as const).map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      statusFilter === st
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'Charity' ? 'Charity Quota' : st}
                  </button>
                )
              )}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search ID, name, batch..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Student ID & Name</th>
                  <th className="py-2.5 px-3">Batch ID & Shift</th>
                  <th className="py-2.5 px-3">Enrollment Lifecycle Dates</th>
                  <th className="py-2.5 px-3">Fee & Charity / Discount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 bg-white">
                {filteredStudents.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-emerald-800 block">
                        {stu.studentIdCode}
                      </span>
                      <span className="font-bold text-slate-900">{stu.studentName}</span>
                      <span className="text-[11px] text-slate-500 block">
                        G: {stu.parentName} · {stu.village}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-sm">
                        {stu.batchCode}
                      </span>
                      <span className="block text-slate-700 font-semibold mt-1">
                        {stu.shift}
                      </span>
                      <span className="text-[11px] text-slate-500">{stu.classLevel}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] space-y-0.5">
                      <div className="text-slate-700">
                        Enrolled: <strong>{stu.enrollmentDate}</strong>
                      </div>
                      {stu.disenrollmentDate && (
                        <div className="text-rose-600">
                          Disenrolled: <strong>{stu.disenrollmentDate}</strong>
                        </div>
                      )}
                      {stu.reEnrollmentDate && (
                        <div className="text-indigo-700">
                          Re-enrolled: <strong>{stu.reEnrollmentDate}</strong>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-slate-900 tabular-nums">
                        ₹{stu.netMonthlyFee}/mo{' '}
                        <span className="text-[10px] font-normal text-slate-400 line-through">
                          {stu.discountPercent > 0 ? `₹${stu.baseMonthlyFee}` : ''}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-semibold ${
                          stu.isCharitySeat ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {stu.discountType}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-bold text-[11px] px-2 py-0.5 rounded-sm ${
                          stu.enrollmentStatus === 'Enrolled'
                            ? 'bg-emerald-50 text-emerald-800'
                            : stu.enrollmentStatus === 'Re-enrolled'
                            ? 'bg-indigo-50 text-indigo-800'
                            : 'bg-rose-50 text-rose-800'
                        }`}
                      >
                        {stu.enrollmentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {stu.enrollmentStatus === 'Disenrolled' ? (
                        <button
                          onClick={() => onReEnrollStudent(stu.id, todayStr, stu.batchCode)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[11px] font-bold transition-colors"
                        >
                          Re-Enroll Now
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            onDisenrollStudent(
                              stu.id,
                              todayStr,
                              isAdmin ? 'Disenrolled by Admin' : 'Disenrollment recorded'
                            )
                          }
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[11px] font-bold transition-colors"
                        >
                          Disenroll
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
