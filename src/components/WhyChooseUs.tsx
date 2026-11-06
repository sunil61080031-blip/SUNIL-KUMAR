import React from 'react';
import { Award, BookCheck, ClipboardCheck, HelpCircle, FileSpreadsheet, Quote } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const pillars = [
    {
      icon: BookCheck,
      title: 'Line-by-Line NCERT Decoding',
      hindiTitle: 'एनसीईआरटी की एक-एक पंक्ति का गहन विश्लेषण',
      description: 'We do not rush into shortcuts. Every theory, diagram, and scientific principle is broken down using real-life examples so students understand the "why" before memorizing.',
    },
    {
      icon: ClipboardCheck,
      title: 'Weekly Sunday OMR Mock Exams',
      hindiTitle: 'साप्ताहिक OMR मॉडल टेस्ट एवं मूल्यांकन',
      description: 'Weekly simulated examinations with 50-mark objective OMR practice. Instant score reports help students identify weak areas and master board-level exam speed.',
    },
    {
      icon: HelpCircle,
      title: "Sunil Sir's Daily Doubt Clinic",
      hindiTitle: 'प्रतिदिन संध्याकालीन व्यक्तिगत संदेह निवारण',
      description: 'Every evening from 5:30 PM to 7:00 PM, Sunil Sir sits 1-on-1 with students who struggled with particular geometry theorems, chemical equations, or algebra proofs.',
    },
    {
      icon: FileSpreadsheet,
      title: 'Printed Formula Books & 10-Yr PYQs',
      hindiTitle: 'मुद्रित सूत्र पुस्तिकाएं एवं पिछले 10 वर्षों के हल प्रश्न',
      description: 'Each enrolled student receives curated chapter-wise question banks, previous 10 years BSEB board matric questions, and model answer framing guides.',
    },
  ];

  const testimonials = [
    {
      student: 'Aman Kumar (Matric 2026 - 452/500)',
      village: 'Bhaptiyahi Bazar',
      quote: 'Sunil Sir taught Mathematics with such patience. His geometry theorem drills and Sunday OMR tests made the final Matric exam feel effortless.',
    },
    {
      student: 'Pooja Kumari (Class 9th Topper)',
      village: 'Gadhiya Ward No. 04',
      quote: 'Science numericals used to terrify me. At Shiksha Niketan, the daily evening doubt clinic cleared all my physics doubts.',
    },
    {
      student: 'Rajeshwar Yadav (Parent)',
      village: 'Saraigarh-Bhaptiyahi',
      quote: 'The monthly parent review meetings keep us completely informed. There is no coaching in our block that gives this level of personal discipline.',
    },
  ];

  return (
    <section id="why-choose-us" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Award className="w-4 h-4 text-emerald-700" />
            <span>Academic Rigor & Discipline</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Why Shiksha Niketan Stands Apart
          </h2>
          <p className="text-sm font-semibold text-emerald-800 font-hindi mt-0.5">
            शिक्षा निकेतन ही क्यों? — हमारा अध्यापन दर्शन एवं अनुशासन
          </p>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            In our rural and semi-urban community, students have tremendous talent but often lack step-by-step guidance. We bridge that gap with dedicated mentors and structured testing.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-xs font-bold text-emerald-700 font-hindi">
                    {item.hindiTitle}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Proof of Trust / Testimonials */}
        <div className="pt-8 border-t border-slate-200">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">
              Words from Students & Guardians in Supaul
            </h3>
            <p className="text-xs text-slate-500 font-hindi">
              छात्रों एवं अभिभावकों के वास्तविक अनुभव
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
              >
                <Quote className="w-6 h-6 text-emerald-600/40" />
                <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                  "{t.quote}"
                </p>
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{t.student}</p>
                  <p className="text-[11px] text-slate-500">{t.village}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
