import React, { useState, useMemo } from 'react';
import { NoticeItem } from '../types';
import {
  Search,
  Printer,
  Share2,
  Pin,
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
  Bell,
  PlusCircle
} from 'lucide-react';

interface NoticeBoardProps {
  notices: NoticeItem[];
  onPrintNotice: (notice: NoticeItem) => void;
  isAdmin: boolean;
  onOpenAdminPost: () => void;
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({
  notices,
  onPrintNotice,
  isAdmin,
  onOpenAdminPost
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories: { label: string; value: string }[] = [
    { label: '1. All Circulars', value: 'All' },
    { label: '2. Urgent Alerts', value: 'Urgent' },
    { label: '3. Exams & Tests', value: 'Exam' },
    { label: '4. Batches & Admission', value: 'Batch' },
    { label: '5. Holidays', value: 'Holiday' },
    { label: '6. General', value: 'General' }
  ];

  const filteredNotices = useMemo(() => {
    return notices
      .filter((item) => {
        if (selectedCategory === 'All') return true;
        if (selectedCategory === 'Urgent') return item.isUrgent;
        return item.category === selectedCategory;
      })
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.hindiTitle.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          item.applicableClasses.toLowerCase().includes(q) ||
          item.refNo.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
  }, [notices, selectedCategory, searchQuery]);

  const handleShare = (notice: NoticeItem) => {
    const text = `*Shiksha Niketan Tuition Notice (${notice.refNo})*\n*${notice.title}*\n${notice.content}\n\nApplicable: ${notice.applicableClasses}\nIssued by Sunil Kumar (Director)\nLocation: Gadhiya, Bhaptiyahi, Supaul`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <section id="notice-board" className="py-8 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        {/* Compact Section Header & Sub-Section Category Switcher */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <Bell className="w-4 h-4 text-emerald-700" />
                <span>Official Circulars & Announcements</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Institute Notice Board ({filteredNotices.length} Circulars)
              </h2>
              <p className="text-xs font-semibold text-emerald-800 font-hindi">
                सूचना पट्ट — परीक्षा, अवकाश एवं नया नामांकन सूचना
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search circulars by keyword..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <button
                type="button"
                onClick={onOpenAdminPost}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isAdmin ? 'Post New Notice' : 'Admin: Post Notice'}</span>
              </button>
            </div>
          </div>

          {/* Sub-Section Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Sub-Sections:
            </span>
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.value
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Compact 2-Column Notice Grid */}
        {filteredNotices.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <p className="text-xs font-semibold text-slate-600">
              No notices found matching your filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-1.5 text-xs font-bold text-emerald-700 underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotices.map((notice) => {
              const isExpanded = expandedId === notice.id;

              return (
                <div
                  key={notice.id}
                  className={`bg-white rounded-xl border p-4 flex flex-col justify-between transition-shadow space-y-3 ${
                    notice.isPinned
                      ? 'border-emerald-300 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        {notice.isPinned && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm">
                            <Pin className="w-3 h-3 text-emerald-700 rotate-45" />
                            <span>Pinned</span>
                          </span>
                        )}
                        {notice.isUrgent && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                            Urgent
                          </span>
                        )}
                        <span className="font-mono text-slate-700 font-semibold text-[11px]">
                          {notice.refNo}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>{notice.category}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1 font-medium text-slate-600 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{notice.date}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {notice.title}
                      </h3>
                      {notice.hindiTitle && (
                        <p className="text-xs font-semibold text-emerald-800 font-hindi">
                          {notice.hindiTitle}
                        </p>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-800">For: </span>
                      <span>{notice.applicableClasses}</span>
                    </div>

                    <div className="text-xs text-slate-700 leading-relaxed space-y-1.5">
                      <p className={isExpanded ? '' : 'line-clamp-2'}>{notice.content}</p>
                      {isExpanded && notice.hindiContent && (
                        <p className="p-2.5 bg-slate-50 rounded-lg text-slate-700 font-hindi border border-slate-100 text-xs">
                          {notice.hindiContent}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onPrintNotice(notice)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 rounded-md font-semibold transition-colors flex items-center gap-1 border border-slate-200 cursor-pointer"
                      >
                        <Printer className="w-3 h-3 text-emerald-700" />
                        <span>Print Slip</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShare(notice)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold transition-colors flex items-center gap-1 border border-slate-200 cursor-pointer"
                      >
                        <Share2 className="w-3 h-3 text-emerald-700" />
                        <span>WhatsApp</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : notice.id)}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Collapse' : 'Read Full'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
