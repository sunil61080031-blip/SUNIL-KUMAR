import React from 'react';
import { NoticeItem, InstituteConfig } from '../types';
import { Phone, Bell, ChevronRight, Building2 } from 'lucide-react';

interface UrgentTickerProps {
  notices: NoticeItem[];
  instituteConfig: InstituteConfig;
  onSelectNotice: (notice: NoticeItem) => void;
}

export const UrgentTicker: React.FC<UrgentTickerProps> = ({
  notices,
  instituteConfig,
  onSelectNotice
}) => {
  const urgentNotices = notices.filter(n => n.isUrgent);
  const activeTickerItems = urgentNotices.length > 0 ? urgentNotices : notices.slice(0, 2);

  return (
    <div className="bg-slate-900 text-white text-xs border-b border-slate-800 relative z-30 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
        {/* Urgent Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="bg-rose-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-1 shadow-xs">
            <Bell className="w-3 h-3 text-white" />
            <span>Circular</span>
          </span>
        </div>

        {/* Marquee ticker content */}
        <div className="overflow-hidden relative w-full flex items-center">
          <div className="animate-marquee text-emerald-100 text-xs font-medium cursor-pointer">
            {activeTickerItems.map((notice, idx) => (
              <span
                key={`${notice.id}-${idx}`}
                onClick={() => onSelectNotice(notice)}
                className="inline-flex items-center gap-1.5 px-6 hover:text-amber-300 transition-colors"
              >
                <span className="text-amber-400 font-bold">[{notice.category}]</span>
                <span className="font-semibold">{notice.title}</span>
                <span className="text-slate-400 text-[11px]">({notice.date})</span>
                <ChevronRight className="w-3 h-3 text-emerald-400 inline" />
                <span className="text-slate-600 mx-3">|</span>
              </span>
            ))}
          </div>
        </div>

        {/* Study Centres count & Quick Phone Action */}
        <div className="hidden sm:flex items-center gap-4 shrink-0 text-xs">
          <span className="text-slate-300 flex items-center gap-1 font-medium">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{instituteConfig.studyCentres.length} Study Centres</span>
          </span>
          <a
            href={`tel:${instituteConfig.phone}`}
            className="text-emerald-300 hover:text-white transition-colors flex items-center gap-1.5 font-semibold"
          >
            <Phone className="w-3.5 h-3.5 text-amber-400" />
            <span>{instituteConfig.phoneDisplay}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
