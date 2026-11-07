import React, { useState } from 'react';
import { BatchItem, BatchShift, StaffMember, StudyCentre } from '../types';
import {
  Clock,
  BookOpen,
  Users,
  CheckCircle2,
  MessageCircle,
  Moon,
  Sun,
  Sunset,
  Building2,
  UserCheck,
  PlusCircle,
  Phone,
  Briefcase,
  Pencil
} from 'lucide-react';

interface CourseBatchesProps {
  batches: BatchItem[];
  staffList: StaffMember[];
  studyCentres: StudyCentre[];
  selectedCentreId: string;
  isAdmin: boolean;
  onSelectBatchForInquiry: (batch: BatchItem) => void;
  onOpenAdminBatches: () => void;
  onEditBatch: (batch: BatchItem) => void;
  onOpenAdminStaff: () => void;
}

type BatchesSubTab = 'batches' | 'staff';

export const CourseBatches: React.FC<CourseBatchesProps> = ({
  batches,
  staffList,
  studyCentres,
  selectedCentreId,
  isAdmin,
  onSelectBatchForInquiry,
  onOpenAdminBatches,
  onEditBatch,
  onOpenAdminStaff
}) => {
  const [subTab, setSubTab] = useState<BatchesSubTab>('batches');
  const [shiftFilter, setShiftFilter] = useState<'All' | BatchShift>('All');
  const [centreFilter, setCentreFilter] = useState<string>('all');

  const effectiveCentreFilter = selectedCentreId !== 'all' ? selectedCentreId : centreFilter;

  const filteredBatches = batches.filter((b) => {
    const matchesShift = shiftFilter === 'All' || b.shift === shiftFilter;
    const matchesCentre =
      effectiveCentreFilter === 'all' || b.centreId === effectiveCentreFilter;
    return matchesShift && matchesCentre;
  });

  const getShiftIcon = (shift: BatchShift) => {
    if (shift === 'Night Class') return <Moon className="w-3.5 h-3.5 text-indigo-600" />;
    if (shift === 'Evening Batch') return <Sunset className="w-3.5 h-3.5 text-amber-600" />;
    return <Sun className="w-3.5 h-3.5 text-emerald-600" />;
  };

  const getCentreName = (centreId: string) => {
    const found = studyCentres.find((c) => c.id === centreId);
    return found ? `${found.name} (${found.centreCode})` : 'Main Campus';
  };

  return (
    <section id="batches" className="py-8 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        {/* Compact Header + Sub-Section Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>Batches & Faculty Directory (Nursery to 12th)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Batch IDs, Shifts & Assigned Staff Roles
            </h2>
            <p className="text-xs font-semibold text-emerald-800 font-hindi">
              बैच आईडी (प्रातः, दोपहर, संध्या एवं रात्रि कक्षाएं) तथा नियुक्त शिक्षक विवरण
            </p>
          </div>

          {/* Sub-Section Tabs + Admin Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSubTab('batches')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  subTab === 'batches'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>1. Active Batch IDs ({filteredBatches.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSubTab('staff')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  subTab === 'staff'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>2. Assigned Staff & Faculty ({staffList.length})</span>
              </button>
            </div>

            {subTab === 'batches' ? (
              <button
                type="button"
                onClick={onOpenAdminBatches}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAdmin ? 'Add / Edit Batch IDs' : 'Manage Batches'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAdminStaff}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAdmin ? 'Assign / Edit Staff' : 'Assign Staff Roles'}</span>
              </button>
            )}
          </div>
        </div>

        {/* SUB-SECTION 1: ACTIVE BATCH IDs & SHIFTS */}
        {subTab === 'batches' && (
          <div className="space-y-4">
            {/* Filter Controls Bar: Shift + Study Centre */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                  Shift Filter:
                </span>
                {(
                  [
                    'All',
                    'Morning Batch',
                    'Afternoon Batch',
                    'Evening Batch',
                    'Night Class'
                  ] as const
                ).map((shift) => (
                  <button
                    key={shift}
                    type="button"
                    onClick={() => setShiftFilter(shift)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                      shiftFilter === shift
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {shift === 'Night Class' && <Moon className="w-3 h-3" />}
                    <span>{shift === 'All' ? 'All Shifts' : shift}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                  Study Centre:
                </span>
                <select
                  value={effectiveCentreFilter}
                  onChange={(e) => setCentreFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="all">All Study Centres ({studyCentres.length})</option>
                  {studyCentres.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.centreCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Compact Batch Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBatches.map((batch) => {
                const seatsRemaining = Math.max(0, batch.totalSeats - batch.enrolledCount);
                const percentageEnrolled = Math.min(
                  100,
                  Math.round((batch.enrolledCount / batch.totalSeats) * 100)
                );

                return (
                  <div
                    key={batch.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-sm">
                              {batch.batchCode}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-700">
                              · {batch.badge}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-1">
                            {batch.classLevel}
                          </h3>
                          <p className="text-[11px] font-medium text-slate-500 font-hindi">
                            {batch.hindiSubtitle}
                          </p>
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 ${
                            batch.shift === 'Night Class'
                              ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {getShiftIcon(batch.shift)}
                          <span>{batch.shift}</span>
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-700">
                        <div className="flex items-center gap-2 font-medium">
                          <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-900">{batch.timing}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">
                            Faculty:{' '}
                            <strong className="text-slate-900">
                              {batch.assignedStaffName || batch.mentor}
                            </strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-slate-600 truncate">
                            {getCentreName(batch.centreId)}
                          </span>
                        </div>
                      </div>

                      {/* Subjects Tags */}
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {batch.subjects.slice(0, 3).map((sub, i) => (
                          <span
                            key={i}
                            className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium truncate max-w-full"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>

                      {/* Seat Availability Bar */}
                      <div className="space-y-1 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-medium text-slate-600">Seats Filled:</span>
                          <span className="font-bold tabular-nums text-slate-900">
                            {batch.enrolledCount} / {batch.totalSeats}{' '}
                            <span className="text-emerald-700">({seatsRemaining} open)</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percentageEnrolled >= 90 ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${percentageEnrolled}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectBatchForInquiry(batch)}
                        disabled={batch.isActive === false}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                          batch.isActive === false
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>
                          {batch.isActive === false
                            ? `${batch.batchCode} (Inactive)`
                            : `Enroll in ${batch.batchCode}`}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditBatch(batch)}
                        className="px-2.5 py-1.5 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                        title={`Edit filled data for ${batch.batchCode}`}
                      >
                        <Pencil className="w-3 h-3 text-amber-600" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUB-SECTION 2: ASSIGNED STAFF & FACULTY ROLES */}
        {subTab === 'staff' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Assigned Staff Roles & Responsibilities ({staffList.length} Members)
                </h3>
                <p className="text-xs text-slate-500">
                  Dedicated teaching and administrative faculty assigned across study centres and batch IDs.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAdminStaff}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>+ Assign / Edit Staff Roles</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffList.map((staff) => (
                <div
                  key={staff.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-sm">
                        {staff.staffCode}
                      </span>
                      <span className="text-slate-500 font-medium">{staff.shift}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900">{staff.name}</h4>
                    <p className="text-xs font-bold text-emerald-700">{staff.role}</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Qualification: {staff.qualification}
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed pt-1 border-t border-slate-200/70">
                      <strong className="text-slate-900">Responsibility: </strong>
                      {staff.responsibility}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 space-y-1 text-[11px] text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Assigned Batches:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {staff.assignedBatchIds.join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Centre:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                        {getCentreName(staff.assignedCentreId)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                        <Phone className="w-3 h-3" />
                        {staff.phone}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Active Duty
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
