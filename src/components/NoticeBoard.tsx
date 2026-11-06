import React, { useState, useMemo } from 'react';
import { NoticeItem, NoticeCategory } from '../types';
import { Search, Printer, Share2, Pin, Calendar, Tag, ChevronDown, ChevronUp, Bell, PlusCircle } from 'lucide-react';

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
  const [expandedId, setExpandedId] = useState<string | null>(notices[0]?.id || null);

  const categories: { label: string; value: string }[] = [
    { label: 'All Notices', value: 'All' },
    { label: 'Urgent', value: 'Urgent' },
    { label: 'Exams & Tests', value: 'Exam' },
    { label: 'Batches & Admission', value: 'Batch' },
    { label: 'Holidays', value: 'Holiday' },
    { label: 'General Circulars', value: 'General' },
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
    <section id="notice-board" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
              <Bell className="w-4 h-4 text-emerald-700" />
              <span>Official Circulars & Announcements</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Institute Notice Board
            </h2>
            <p className="text-sm font-semibold text-emerald-800 font-hindi mt-0.5">
              सूचना पट्ट — परीक्षा, अवकाश एवं नया नामांकन सूचना
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin ? (
              <button
                onClick={onOpenAdminPost}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post New Notice</span>
              </button>
            ) : null}
            <span className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-slate-900">{filteredNotices.length}</strong> active circulars
            </span>
          </div>
        </div>

        {/* Filter Tabs and Search Bar */}
        <div className="py-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circulars by keyword..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-colors"
            >
            </input>
          </div>
        </div>

        {/* Notice List */}
        {filteredNotices.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <p className="text-sm font-semibold text-slate-600">No notices found matching your criteria.</p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="mt-2 text-xs font-bold text-emerald-700 underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotices.map((notice) => {
              const isExpanded = expandedId === notice.id;

              return (
                <div
                  key={notice.id}
                  className={`bg-white rounded-xl border transition-shadow ${
                    notice.isPinned
                      ? 'border-emerald-300 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header Row */}
                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        {notice.isPinned && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm">
                            <Pin className="w-3 h-3 text-emerald-700 rotate-45" />
                            <span>Pinned</span>
                          </span>
                        )}
                        {notice.isUrgent && (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                            Urgent
                          </span>
                        )}
                        <span className="font-mono text-slate-700 font-semibold">{notice.refNo}</span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>{notice.category}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 font-medium text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{notice.date}</span>
                      </div>
                    </div>

                    {/* Notice Titles */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        {notice.title}
                      </h3>
                      {notice.hindiTitle && (
                        <p className="text-sm font-semibold text-emerald-800 font-hindi mt-0.5">
                          {notice.hindiTitle}
                        </p>
                      )}
                    </div>

                    {/* Applicable Target & Snippet */}
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">For: </span>
                      <span>{notice.applicableClasses}</span>
                    </div>

                    {/* Body Content */}
                    <div className="pt-2 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
                      <p className={isExpanded ? '' : 'line-clamp-2'}>
                        {notice.content}
                      </p>
                      {isExpanded && notice.hindiContent && (
                        <p className="p-3 bg-slate-50 rounded-lg text-slate-700 font-hindi border border-slate-100">
                          {notice.hindiContent}
                        </p>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onPrintNotice(notice)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 rounded-md font-semibold transition-colors flex items-center gap-1.5 border border-slate-200"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Official Print Slip</span>
                        </button>

                        <button
                          onClick={() => handleShare(notice)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold transition-colors flex items-center gap-1.5 border border-slate-200"
                        >
                          <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Share (WhatsApp)</span>
                        </button>
                      </div>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : notice.id)}
                        className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Collapse' : 'Read Full Notice'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
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
