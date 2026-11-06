import React from 'react';
import { InstituteConfig } from '../types';
import {
  FileText,
  ArrowRight,
  Award,
  CheckCircle2,
  MapPin,
  Phone,
  Building2,
  Settings,
  Users,
  HeartHandshake
} from 'lucide-react';

interface HeroProps {
  instituteConfig: InstituteConfig;
  selectedCentreId: string;
  onSelectCentre: (centreId: string) => void;
  totalEnrolledCount: number;
  isAdmin: boolean;
  onOpenAdminBranding: () => void;
  onExploreNotices: () => void;
  onEnrollClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  instituteConfig,
  selectedCentreId,
  onSelectCentre,
  totalEnrolledCount,
  isAdmin,
  onOpenAdminBranding,
  onExploreNotices,
  onEnrollClick
}) => {
  const activeCentre =
    instituteConfig.studyCentres.find((c) => c.id === selectedCentreId) ||
    instituteConfig.studyCentres[0];

  const displayAddress =
    selectedCentreId === 'all' || !activeCentre
      ? instituteConfig.address
      : activeCentre.location;

  const displayPhone =
    selectedCentreId === 'all' || !activeCentre
      ? instituteConfig.phoneDisplay
      : activeCentre.phone;

  const displayHeroImage =
    selectedCentreId !== 'all' && activeCentre?.image
      ? activeCentre.image
      : instituteConfig.heroImage;

  const seatsRemaining = Math.max(0, instituteConfig.maxStudentCapacity - totalEnrolledCount);
  const capacityPercent = Math.min(
    100,
    Math.round((totalEnrolledCount / instituteConfig.maxStudentCapacity) * 100)
  );

  return (
    <section
      id="home"
      className="relative bg-gradient-to-b from-emerald-50/50 via-white to-slate-50 pt-8 pb-16 lg:pt-12 lg:pb-20 border-b border-slate-200/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Study Centre Switcher & Admin Quick Customization Bar */}
        <div className="mb-8 p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-1">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Select Study Centre:</span>
            </span>
            <button
              onClick={() => onSelectCentre('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedCentreId === 'all'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Centres ({instituteConfig.studyCentres.length})
            </button>
            {instituteConfig.studyCentres.map((centre) => (
              <button
                key={centre.id}
                onClick={() => onSelectCentre(centre.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedCentreId === centre.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {centre.name}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenAdminBranding}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Settings className="w-3.5 h-3.5 text-amber-700" />
            <span>
              {isAdmin
                ? 'Edit Institute Name, Contact, Image & Centres'
                : 'Admin: Customize Institute & Centres'}
            </span>
          </button>
        </div>

        {/* Main 2-column Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Column: Mission, Value proposition & CTAs */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Trust Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-900 rounded-md text-xs font-bold">
                <Award className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  {selectedCentreId === 'all'
                    ? `${instituteConfig.studyCentres.length} Study Centres · Up to ${instituteConfig.maxStudentCapacity} Students Capacity`
                    : `Active Branch: ${activeCentre?.name} (${activeCentre?.centreCode})`}
                </span>
              </div>

              {/* Dominant Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {instituteConfig.name}{' '}
                <span className="text-emerald-700">(Nursery to Class 12th)</span>
              </h1>

              {/* Hindi Title & Tagline */}
              <p className="text-base sm:text-lg font-bold text-emerald-800 font-hindi">
                {instituteConfig.hindiName}
              </p>

              {/* Prose */}
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                Under the dedicated mentorship of{' '}
                <strong className="text-slate-900 font-semibold">{instituteConfig.founder}</strong>, we
                provide complete educational care from{' '}
                <strong>Nursery, LKG, UKG & Primary (Class 1–5)</strong> up to{' '}
                <strong>
                  Middle (Class 6–8), Matric (Class 9–10), and Intermediate (Class 11–12 I.Sc, I.A &
                  I.Com)
                </strong>{' '}
                across Morning, Afternoon, Evening, and Special Night Classes, with Merit Discounts
                and 100% Charity Free Education seats for deserving students.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={onEnrollClick}
                className="w-full sm:w-auto px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>Student Admission / Re-enrollment</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreNotices}
                className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 text-sm font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>View Circulars & Batches</span>
              </button>
            </div>

            {/* Quick Location & Contact Bar */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{displayAddress}</span>
              </span>
              <span className="text-slate-300">·</span>
              <a
                href={`tel:${displayPhone.replace(/\s+/g, '')}`}
                className="flex items-center gap-1.5 font-bold text-slate-800 hover:text-emerald-700 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{displayPhone}</span>
              </a>
            </div>
          </div>

          {/* Right Column: High-Fidelity Director & Classroom Showcase */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            {/* Classroom Hero Card */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-900 group">
              <img
                src={displayHeroImage}
                alt={instituteConfig.name}
                className="w-full h-56 sm:h-64 object-cover group-hover:scale-102 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex items-end justify-between p-4">
                <div className="text-white text-xs space-y-1">
                  <p className="font-bold text-emerald-300 text-sm">
                    {selectedCentreId === 'all'
                      ? 'Offline Classrooms (Nursery to 12th)'
                      : activeCentre?.name}
                  </p>
                  <p className="text-slate-200 text-[11px]">
                    Morning, Afternoon, Evening & Board Special Night Batches
                  </p>
                </div>
              </div>
            </div>

            {/* Director / Centre Head Spotlight Box */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={instituteConfig.directorImage}
                  alt={instituteConfig.founder}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-emerald-600 shadow-xs"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    {instituteConfig.founder}
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm shrink-0">
                    {instituteConfig.role}
                  </span>
                </div>
                <p className="text-xs font-semibold text-emerald-700 font-hindi">
                  संस्थापक एवं मुख्य मार्गदर्शक
                </p>
                <p className="text-xs text-slate-600 leading-snug line-clamp-2">
                  {selectedCentreId !== 'all' && activeCentre
                    ? `Centre In-Charge: ${activeCentre.inCharge} · Capacity: ${activeCentre.maxCapacity} Students`
                    : 'Dedicated mentorship across all branches with assigned subject specialists and night study supervision.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column Academic & Capacity Pillars Strip */}
        <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wide">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Enrollment Capacity</span>
            </div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {totalEnrolledCount} / {instituteConfig.maxStudentCapacity}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              {seatsRemaining} Seats Open ({capacityPercent}% Filled)
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wide">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Multi-Centre Network</span>
            </div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {instituteConfig.studyCentres.length} Centres
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Morning, Evening & Night Classes
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wide">
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
              <span>Charity & Discounts</span>
            </div>
            <p className="text-2xl font-black text-slate-900">Up to 100%</p>
            <p className="text-xs text-slate-500 font-medium">
              Charity Free Education & Merit Aid
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wide">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>All Classes</span>
            </div>
            <p className="text-2xl font-black text-slate-900">Nursery–12th</p>
            <p className="text-xs text-slate-500 font-medium">
              Kids Wing, Matric & Inter (I.Sc/I.A)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
