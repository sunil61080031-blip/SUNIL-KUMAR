import React from 'react';
import { InstituteConfig } from '../types';
import { MapPin, Phone, Mail, Clock, GraduationCap, Building2, Settings } from 'lucide-react';

interface FooterProps {
  instituteConfig: InstituteConfig;
  onOpenAdminBranding: () => void;
}

export const Footer: React.FC<FooterProps> = ({ instituteConfig, onOpenAdminBranding }) => {
  return (
    <footer id="location" className="bg-slate-900 text-white text-xs border-t border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Study Centres Network Cards */}
        <div className="space-y-4 border-b border-slate-800 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Our Study Centres & Branch Locations ({instituteConfig.studyCentres.length})</span>
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Same institute operating across multiple study centres with unified curriculum and Up to {instituteConfig.maxStudentCapacity} Student Capacity.
              </p>
            </div>
            <button
              onClick={onOpenAdminBranding}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Add / Edit Study Centres</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {instituteConfig.studyCentres.map((centre) => (
              <div
                key={centre.id}
                className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded">
                    {centre.centreCode}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Max {centre.maxCapacity} Students
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{centre.name}</h4>
                <p className="text-slate-300 text-xs flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{centre.location}</span>
                </p>
                <div className="pt-1 border-t border-slate-700/70 flex items-center justify-between text-[11px] text-slate-300">
                  <span>In-Charge: {centre.inCharge}</span>
                  <a
                    href={`tel:${centre.phone.replace(/\s+/g, '')}`}
                    className="text-emerald-400 font-mono font-bold hover:underline"
                  >
                    {centre.phone}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight text-white">
                  {instituteConfig.name}
                </h3>
                <p className="text-[11px] font-bold text-emerald-400 font-hindi">
                  {instituteConfig.hindiName}
                </p>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Dedicated coaching from Nursery, LKG, UKG & Primary (1st–5th) to Matric (10th) & Intermediate (11th–12th BSEB & CBSE) across Morning, Afternoon, Evening & Night Batches.
            </p>
            <p className="text-xs text-slate-400">
              Head / Director: <strong className="text-slate-200">{instituteConfig.founder}</strong>
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">
              Navigation
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#home" className="hover:text-emerald-400 transition-colors">Home & Study Centres</a></li>
              <li><a href="#notice-board" className="hover:text-emerald-400 transition-colors">Official Notice Board</a></li>
              <li><a href="#batches" className="hover:text-emerald-400 transition-colors">Batch IDs & Assigned Staff</a></li>
              <li><a href="#fee-calculator" className="hover:text-emerald-400 transition-colors">Class-Wise Fees & Charity</a></li>
              <li><a href="#enrollment" className="hover:text-emerald-400 transition-colors">Enrollment / Re-enrollment Form</a></li>
            </ul>
          </div>

          {/* Main Head Office Address & Timings */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">
              Head Office & Shifts
            </h4>
            <div className="space-y-2 text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{instituteConfig.address}</span>
              </div>
              <p className="text-slate-500 pl-6 text-[11px]">
                Landmark: {instituteConfig.landmark}
              </p>
              <div className="flex items-start gap-2 pt-1">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{instituteConfig.timings}</span>
              </div>
            </div>
          </div>

          {/* Direct Contact */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">
              Contact & Helpline
            </h4>
            <div className="space-y-2 text-slate-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`tel:${instituteConfig.phone}`} className="hover:text-emerald-300 font-mono font-bold">
                  {instituteConfig.phoneDisplay}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`mailto:${instituteConfig.email}`} className="hover:text-emerald-300">
                  {instituteConfig.email}
                </a>
              </div>
              <div className="pt-2">
                <a
                  href={`https://wa.me/${instituteConfig.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition-colors"
                >
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Quiet Bottom Strip */}
        <div className="pt-6 border-t border-slate-800 text-center sm:flex sm:justify-between sm:items-center text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} {instituteConfig.name}. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">{instituteConfig.address} · Managed by {instituteConfig.founder}</p>
        </div>
      </div>
    </footer>
  );
};
