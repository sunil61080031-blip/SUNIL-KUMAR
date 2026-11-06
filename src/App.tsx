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
  AttendanceRecord
} from './types';
import {
  INITIAL_NOTICES,
  INITIAL_BATCHES,
  INITIAL_INSTITUTE_CONFIG,
  INITIAL_STAFF,
  FEE_PLANS,
  INITIAL_STUDENTS
} from './data/seedData';
import { UrgentTicker } from './components/UrgentTicker';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { NoticeBoard } from './components/NoticeBoard';
import { CourseBatches } from './components/CourseBatches';
import { StudentPortal } from './components/StudentPortal';
import { FeeEstimator } from './components/FeeEstimator';
import { WhyChooseUs } from './components/WhyChooseUs';
import { WhatsAppInquiry } from './components/WhatsAppInquiry';
import { Footer } from './components/Footer';
import { PrintNoticeModal } from './components/PrintNoticeModal';
import { AdminPortalModal, AdminTabType } from './components/AdminPortalModal';

const INSTITUTE_CONFIG_KEY = 'sntc_institute_config_v5';
const STAFF_STORAGE_KEY = 'sntc_staff_v3';
const BATCHES_STORAGE_KEY = 'sntc_batches_v3';
const FEES_STORAGE_KEY = 'sntc_fees_v3';
const STUDENTS_STORAGE_KEY = 'sntc_students_v5';
const NOTICES_STORAGE_KEY = 'sntc_notices_v3';
const INQUIRIES_STORAGE_KEY = 'sntc_inquiries_v3';
const ADMIN_SESSION_KEY = 'sntc_admin_active_v1';

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

  // Modals
  const [selectedPrintNotice, setSelectedPrintNotice] = useState<NoticeItem | null>(null);
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

  // Admin Handlers
  const handleAdminLogin = (password: string): boolean => {
    if (password === 'sunil2026') {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setIsAdminModalOpen(false);
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
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const handleRecordFeePayment = (studentId: string, payment: FeePaymentItem) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const updatedPayments = [payment, ...(s.feePayments || [])];
        const newPaidSum = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        return {
          ...s,
          paidAmount: Math.max((s.paidAmount || 0) + payment.amount, newPaidSum),
          feePayments: updatedPayments
        };
      })
    );
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
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectBatchForInquiry = (batch: BatchItem) => {
    setEnrollmentClass(batch.classLevel);
    setEnrollmentBatchCode(batch.batchCode);
    scrollToSection('enrollment');
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
    scrollToSection('enrollment');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
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
      />

      {/* Main Page Sections */}
      <main className="flex-1">
        {/* Hero Section with Study Centre Switcher & 500-Capacity Tracker */}
        <Hero
          instituteConfig={instituteConfig}
          selectedCentreId={selectedCentreId}
          onSelectCentre={setSelectedCentreId}
          totalEnrolledCount={totalEnrolledCount}
          isAdmin={isAdmin}
          onOpenAdminBranding={() => openAdminSuite('branding')}
          onExploreNotices={() => scrollToSection('notice-board')}
          onEnrollClick={() => scrollToSection('enrollment')}
        />

        {/* Dynamic Notice Board with Official Print Previews */}
        <NoticeBoard
          notices={notices}
          onPrintNotice={(notice) => setSelectedPrintNotice(notice)}
          isAdmin={isAdmin}
          onOpenAdminPost={() => openAdminSuite('notices')}
        />

        {/* Batch IDs (Morning / Afternoon / Evening / Night) & Assigned Staff Roles */}
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

        {/* Enrolled Student Portal: Batch Schedule, Attendance History & Fee Balance Reports */}
        <StudentPortal
          students={students}
          batches={batches}
          staffList={staffList}
          feePlans={feePlans}
          instituteConfig={instituteConfig}
          onRecordFeePayment={handleRecordFeePayment}
          onRecordAttendance={handleRecordAttendance}
        />

        {/* Class-Wise Tuition Fee Calculator with Charity & Discount Options */}
        <FeeEstimator
          feePlans={feePlans}
          isAdmin={isAdmin}
          onOpenAdminFees={() => openAdminSuite('batches')}
          onApplyFeeToInquiry={handleApplyFeeToInquiry}
        />

        {/* Why Choose Us & Testimonials */}
        <WhyChooseUs />

        {/* Student Admission, Disenrollment & Re-enrollment Form + 500-Student Register */}
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
        />
      </main>

      {/* Multi-Study Centre Directory & Contact Footer */}
      <Footer
        instituteConfig={instituteConfig}
        onOpenAdminBranding={() => openAdminSuite('branding')}
      />

      {/* Print Notice Slip Modal */}
      <PrintNoticeModal
        notice={selectedPrintNotice}
        instituteConfig={instituteConfig}
        onClose={() => setSelectedPrintNotice(null)}
      />

      {/* Full 5-Tab Admin Control Suite */}
      <AdminPortalModal
        isOpen={isAdminModalOpen}
        onClose={() => {
          setIsAdminModalOpen(false);
          setEditingBatch(null);
        }}
        isAdmin={isAdmin}
        onLogin={handleAdminLogin}
        onLogout={handleAdminLogout}
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
