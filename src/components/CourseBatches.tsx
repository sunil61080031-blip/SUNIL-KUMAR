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
  const [shiftFilter, setShiftFilter] = useState<'All' | BatchShift>('All');
  const [centreFilter, setCentreFilter] = useState<string>('all');

  // Sync with Hero study centre filter if selected
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
    <section id="batches" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>Batch IDs, Shifts & Assigned Faculty (Nursery to 12th)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Morning, Afternoon, Evening & Night Batches
            </h2>
            <p className="text-sm font-semibold text-emerald-800 font-hindi mt-0.5">
              बैच आईडी के साथ प्रातः, दोपहर, संध्या एवं विशेष रात्रि कक्षाएं (Night Classes)
            </p>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Every batch has a unique Batch ID, dedicated study centre, and assigned subject faculty. Total institute enrollment supports up to 500 students across all shifts.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenAdminBatches}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isAdmin ? 'Add / Edit Batch IDs' : 'Admin: Manage Batches'}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar: Shift + Study Centre */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Shift Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mr-1">
              Batch Shift:
            </span>
            {(
              ['All', 'Morning Batch', 'Afternoon Batch', 'Evening Batch', 'Night Class'] as const
            ).map((shift) => (
              <button
                key={shift}
                onClick={() => setShiftFilter(shift)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  shiftFilter === shift
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {shift === 'Night Class' && <Moon className="w-3.5 h-3.5" />}
                <span>{shift === 'All' ? 'All Shifts' : shift}</span>
              </button>
            ))}
          </div>

          {/* Centre Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider shrink-0">
              Study Centre:
            </span>
            <select
              value={effectiveCentreFilter}
              onChange={(e) => setCentreFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-emerald-600"
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

        {/* Batch Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
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
                <div className="p-5 space-y-4">
                  {/* Card Header with Batch ID & Shift */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-sm">
                          {batch.batchCode}
                        </span>
                        <span className="text-xs font-bold text-emerald-700">· {batch.badge}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1.5">
                        {batch.classLevel}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 font-hindi">
                        {batch.hindiSubtitle}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shrink-0 ${
                        batch.shift === 'Night Class'
                          ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {getShiftIcon(batch.shift)}
                      <span>{batch.shift}</span>
                    </span>
                  </div>

                  {/* Timing, Assigned Staff & Study Centre */}
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-900">{batch.timing}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Assigned Staff:{' '}
                        <strong className="text-slate-900">
                          {batch.assignedStaffName || batch.mentor}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-slate-600 truncate">
                        {getCentreName(batch.centreId)}
                      </span>
                    </div>
                  </div>

                  {/* Subjects Covered */}
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Subjects & Focus:
                    </p>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {batch.subjects.map((sub, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">·</span>
                          <span>{sub}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Seat Availability Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">Batch Capacity:</span>
                      <span className="font-bold tabular-nums text-slate-900">
                        {batch.enrolledCount} / {batch.totalSeats}
                        <span className="ml-1 text-[11px] font-medium text-emerald-700">
                          ({seatsRemaining} open)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          percentageEnrolled >= 90 ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${percentageEnrolled}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Reserve Seat & Admin Edit Batch Buttons */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => onSelectBatchForInquiry(batch)}
                    disabled={batch.isActive === false}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs ${
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
                    onClick={() => onEditBatch(batch)}
                    className="px-3 py-2 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                    title={`Edit filled data for ${batch.batchCode}`}
                  >
                    <Pencil className="w-3.5 h-3.5 text-amber-600" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Assigned Staff & Faculty Roles & Responsibilities Directory */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span>Assigned Faculty & Staff Roster</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Institute Staff Roles & Responsibilities
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dedicated teaching and administrative staff assigned across study centres and batch IDs.
              </p>
            </div>

            <button
              onClick={onOpenAdminStaff}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAdmin ? 'Assign / Edit Staff Roles' : 'Admin: Assign Staff Roles'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
            {staffList.map((staff) => (
              <div
                key={staff.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
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
      </div>
    </section>
  );
};
