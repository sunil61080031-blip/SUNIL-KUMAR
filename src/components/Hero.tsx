import React, { useState } from 'react';
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
  HeartHandshake,
  BookCheck,
  ClipboardCheck,
  HelpCircle,
  FileSpreadsheet,
  Quote,
  Sparkles
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

type HeroSubTab = 'overview' | 'centres' | 'pillars';

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
  const [subTab, setSubTab] = useState<HeroSubTab>('overview');

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

  const seatsRemaining = Math.max(
    0,
    instituteConfig.maxStudentCapacity - totalEnrolledCount
  );
  const capacityPercent = Math.min(
    100,
    Math.round((totalEnrolledCount / instituteConfig.maxStudentCapacity) * 100)
  );

  const pillars = [
    {
      icon: BookCheck,
      title: 'Line-by-Line NCERT Decoding',
      hindiTitle: 'एनसीईआरटी की एक-एक पंक्ति का गहन विश्लेषण',
      description:
        'Every theory, diagram, and scientific principle is broken down using real-life examples so students understand concepts deeply.'
    },
    {
      icon: ClipboardCheck,
      title: 'Weekly Sunday OMR Mock Exams',
      hindiTitle: 'साप्ताहिक OMR मॉडल टेस्ट एवं मूल्यांकन',
      description:
        'Weekly simulated examinations with 50-mark objective OMR practice and instant score reports to master board exam speed.'
    },
    {
      icon: HelpCircle,
      title: "Sunil Sir's Daily Doubt Clinic",
      hindiTitle: 'प्रतिदिन संध्याकालीन व्यक्तिगत संदेह निवारण',
      description:
        '1-on-1 evening sessions for students who need extra help with geometry theorems, chemical equations, or algebra proofs.'
    },
    {
      icon: FileSpreadsheet,
      title: 'Printed Formula Books & 10-Yr PYQs',
      hindiTitle: 'मुद्रित सूत्र पुस्तिकाएं एवं पिछले 10 वर्षों के हल प्रश्न',
      description:
        'Curated chapter-wise question banks, previous 10 years BSEB & CBSE board questions, and model answer framing guides.'
    }
  ];

  const testimonials = [
    {
      student: 'Aman Kumar (Matric - 452/500)',
      village: 'Bhaptiyahi Bazar',
      quote:
        'Sunil Sir taught Mathematics with such patience. His geometry drills and Sunday OMR tests made the final Matric exam effortless.'
    },
    {
      student: 'Pooja Kumari (Class 9th Topper)',
      village: 'Gadhiya Ward No. 04',
      quote:
        'Science numericals used to terrify me. At Shiksha Niketan, the daily evening doubt clinic cleared all my physics doubts.'
    },
    {
      student: 'Rajeshwar Yadav (Guardian)',
      village: 'Saraigarh-Bhaptiyahi',
      quote:
        'The monthly parent review meetings keep us completely informed. No other coaching in our block gives this level of personal discipline.'
    }
  ];

  return (
    <section
      id="home"
      className="relative bg-gradient-to-b from-emerald-50/50 via-white to-slate-50 py-6 border-b border-slate-200/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        {/* Top Sub-Section Navigation Bar + Study Centre Filter */}
        <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Sub-Section Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
              Sub-Sections:
            </span>
            <button
              type="button"
              onClick={() => setSubTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                subTab === 'overview'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>1. Campus & Director Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('centres')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                subTab === 'centres'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>
                2. Study Centre Branches ({instituteConfig.studyCentres.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('pillars')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                subTab === 'pillars'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3. Why Choose Us & Reviews</span>
            </button>
          </div>

          {/* Right: Active Branch Selector & Admin Customize Button */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCentreId}
              onChange={(e) => onSelectCentre(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="all">
                All Study Centres ({instituteConfig.studyCentres.length})
              </option>
              {instituteConfig.studyCentres.map((centre) => (
                <option key={centre.id} value={centre.id}>
                  {centre.name} ({centre.centreCode})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onOpenAdminBranding}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-amber-700" />
              <span>{isAdmin ? 'Edit Institute & Centres' : 'Customize Institute'}</span>
            </button>
          </div>
        </div>

        {/* SUB-SECTION 1: CAMPUS & DIRECTOR OVERVIEW */}
        {subTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Column: Mission, Value proposition & CTAs */}
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-900 rounded-md text-xs font-bold">
                    <Award className="w-3.5 h-3.5 text-emerald-700" />
                    <span>
                      {selectedCentreId === 'all'
                        ? `${instituteConfig.studyCentres.length} Study Centres · Up to ${instituteConfig.maxStudentCapacity} Students Capacity`
                        : `Active Branch: ${activeCentre?.name} (${activeCentre?.centreCode})`}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {instituteConfig.name}{' '}
                    <span className="text-emerald-700">(Nursery to Class 12th)</span>
                  </h1>

                  <p className="text-sm sm:text-base font-bold text-emerald-800 font-hindi">
                    {instituteConfig.hindiName}
                  </p>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Under the mentorship of{' '}
                    <strong className="text-slate-900 font-semibold">
                      {instituteConfig.founder}
                    </strong>
                    , we provide complete education from{' '}
                    <strong>Nursery, LKG, UKG & Primary (Class 1–5)</strong> to{' '}
                    <strong>
                      Middle (Class 6–8), Matric (Class 9–10), and Intermediate (Class 11–12
                      I.Sc, I.A & I.Com)
                    </strong>{' '}
                    across Morning, Afternoon, Evening, and Night Classes, with Merit
                    Scholarships and 100% Charity Free Education seats.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onEnrollClick}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span>Student Admission / Re-enrollment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={onExploreNotices}
                    className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>View Circulars & Notices</span>
                  </button>
                </div>

                {/* Quick Location & Contact Bar */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-600">
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

              {/* Right Column: Compact Classroom & Director Showcase */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-slate-900 group flex-1 min-h-[160px]">
                  <img
                    src={displayHeroImage}
                    alt={instituteConfig.name}
                    className="w-full h-44 sm:h-48 object-cover group-hover:scale-102 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex items-end justify-between p-4">
                    <div className="text-white text-xs space-y-0.5">
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

                {/* Director Spotlight Box */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
                  <img
                    src={instituteConfig.directorImage}
                    alt={instituteConfig.founder}
                    className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-600 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {instituteConfig.founder}
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm">
                        {instituteConfig.role}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-emerald-700 font-hindi">
                      संस्थापक एवं मुख्य मार्गदर्शक
                    </p>
                    <p className="text-[11px] text-slate-600 truncate">
                      {selectedCentreId !== 'all' && activeCentre
                        ? `In-Charge: ${activeCentre.inCharge} · Cap: ${activeCentre.maxCapacity}`
                        : 'Personal supervision across Morning, Evening & Night Classes.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact 4-Column Academic & Capacity Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px] uppercase tracking-wide">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Enrollment Capacity</span>
                </div>
                <p className="text-xl font-black text-slate-900 tabular-nums mt-0.5">
                  {totalEnrolledCount} / {instituteConfig.maxStudentCapacity}
                </p>
                <p className="text-[11px] text-slate-500">
                  {seatsRemaining} Seats Open ({capacityPercent}% Filled)
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px] uppercase tracking-wide">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Multi-Centre Network</span>
                </div>
                <p className="text-xl font-black text-slate-900 tabular-nums mt-0.5">
                  {instituteConfig.studyCentres.length} Centres
                </p>
                <p className="text-[11px] text-slate-500">
                  Morning, Evening & Night Classes
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px] uppercase tracking-wide">
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Charity & Discounts</span>
                </div>
                <p className="text-xl font-black text-slate-900 mt-0.5">Up to 100%</p>
                <p className="text-[11px] text-slate-500">
                  Charity Free Education & Merit Aid
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px] uppercase tracking-wide">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>All Classes</span>
                </div>
                <p className="text-xl font-black text-slate-900 mt-0.5">Nursery–12th</p>
                <p className="text-[11px] text-slate-500">
                  Kids Wing, Matric & Inter (I.Sc/I.A)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SUB-SECTION 2: STUDY CENTRE BRANCHES */}
        {subTab === 'centres' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Institute Study Centre Branches ({instituteConfig.studyCentres.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Select any study centre branch to filter batches, or customize branch locations and capacities in Admin Control.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAdminBranding}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                + Add / Edit Study Centres
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {instituteConfig.studyCentres.map((centre) => {
                const isSelected = selectedCentreId === centre.id;
                return (
                  <div
                    key={centre.id}
                    className={`rounded-xl border overflow-hidden flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-emerald-600 ring-2 ring-emerald-100 bg-emerald-50/20'
                        : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div>
                      <img
                        src={centre.image || instituteConfig.heroImage}
                        alt={centre.name}
                        className="w-full h-32 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            {centre.centreCode}
                          </span>
                          <span className="font-semibold text-slate-600">
                            Max {centre.maxCapacity} Seats
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{centre.name}</h3>
                        <p className="text-xs text-slate-600 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          <span>{centre.location}</span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          In-Charge: <strong className="text-slate-800">{centre.inCharge}</strong> ·{' '}
                          {centre.phone}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-white border-t border-slate-200/80 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCentre(isSelected ? 'all' : centre.id);
                          setSubTab('overview');
                        }}
                        className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800'
                        }`}
                      >
                        {isSelected ? '✓ Active Study Centre' : 'Switch to This Centre'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUB-SECTION 3: WHY CHOOSE US & TESTIMONIALS */}
        {subTab === 'pillars' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900">
                Why Shiksha Niketan Stands Apart — Teaching Pillars & Student Reviews
              </h2>
              <p className="text-xs font-semibold text-emerald-800 font-hindi">
                शिक्षा निकेतन ही क्यों? — हमारा अध्यापन दर्शन एवं छात्रों के अनुभव
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pillars.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-start gap-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                      <p className="text-[11px] font-bold text-emerald-700 font-hindi">
                        {item.hindiTitle}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Quote className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900">{t.student}</span>
                  </div>
                  <p className="text-xs text-slate-600 italic leading-relaxed">
                    "{t.quote}"
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">{t.village}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
