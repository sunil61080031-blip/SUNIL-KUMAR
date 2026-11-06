import React, { useState } from 'react';
import { FeePlan, FeeDiscountType } from '../types';
import { DISCOUNT_OPTIONS } from '../data/seedData';
import {
  Calculator,
  Check,
  ArrowRight,
  Sparkles,
  HeartHandshake,
  Percent,
  Settings
} from 'lucide-react';

interface FeeEstimatorProps {
  feePlans: FeePlan[];
  isAdmin: boolean;
  onOpenAdminFees: () => void;
  onApplyFeeToInquiry: (
    classLevel: string,
    estimatedFee: number,
    discountType: FeeDiscountType,
    isCharity: boolean
  ) => void;
}

export const FeeEstimator: React.FC<FeeEstimatorProps> = ({
  feePlans,
  isAdmin,
  onOpenAdminFees,
  onApplyFeeToInquiry
}) => {
  const [selectedClassNum, setSelectedClassNum] = useState<number>(10);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly'>('monthly');
  const [selectedDiscount, setSelectedDiscount] = useState<FeeDiscountType>('None');
  const [customExtraDiscount, setCustomExtraDiscount] = useState<number>(0);
  const [donateToCharityFund, setDonateToCharityFund] = useState<boolean>(false);

  const selectedPlan =
    feePlans.find((p) => p.classNum === selectedClassNum) || feePlans[0];

  const discountObj =
    DISCOUNT_OPTIONS.find((d) => d.label === selectedDiscount) || DISCOUNT_OPTIONS[0];

  const isCharityOption = Boolean(discountObj.isCharity);

  // Calculations
  const baseTuition =
    billingCycle === 'monthly' ? selectedPlan.monthlyFee : selectedPlan.quarterlyFee;
  const discountAmount = Math.round((baseTuition * discountObj.percent) / 100);
  const afterSchemeTuition = Math.max(0, baseTuition - discountAmount - customExtraDiscount);
  // Waive registration fee if 100% Charity Free Education is selected
  const registrationFee =
    discountObj.percent === 100 ? 0 : selectedPlan.registrationFee;
  const charityContribution = donateToCharityFund && !isCharityOption ? 100 : 0;
  const totalPayable = afterSchemeTuition + registrationFee + charityContribution;

  return (
    <section id="fee-calculator" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
              <Calculator className="w-4 h-4 text-emerald-700" />
              <span>Class-Wise Tuition Fee, Discount & Charity Calculator</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Class-Wise Tuition Fees, Discounts & Charity Option
            </h2>
            <p className="text-sm font-semibold text-emerald-800 font-hindi mt-0.5">
              कक्षावार ट्यूशन शुल्क, छात्रवृत्ति छूट एवं निःशुल्क चैरिटी शिक्षा विकल्प
            </p>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Select any class from Nursery to Class 12th, choose Monthly or Quarterly cycle, and apply Sibling, Merit, EWS, or Charity Free Education options.
            </p>
          </div>

          <button
            onClick={onOpenAdminFees}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isAdmin ? 'Edit Class-Wise Fees' : 'Admin: Edit Fee Table'}</span>
          </button>
        </div>

        {/* 2-Column Calculator Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Controls */}
          <div className="lg:col-span-7 bg-slate-50 rounded-2xl p-6 sm:p-7 border border-slate-200 space-y-6">
            {/* Step 1: Choose Class */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                1. Select Class-Wise Fee Plan (Nursery to 12th)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {feePlans.map((plan) => (
                  <button
                    key={plan.classNum}
                    onClick={() => setSelectedClassNum(plan.classNum)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left ${
                      selectedClassNum === plan.classNum
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="truncate">{plan.classLevel}</div>
                    <div className="text-[11px] font-mono font-semibold opacity-90 mt-0.5">
                      ₹{plan.monthlyFee}/month
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Choose Payment Cycle */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                2. Payment Interval
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-white border-emerald-600 shadow-xs'
                      : 'bg-white/60 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Monthly Tuition</span>
                    <span className="text-xs font-bold text-emerald-700 font-mono">
                      ₹{selectedPlan.monthlyFee}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Standard monthly installment.
                  </p>
                </button>

                <button
                  onClick={() => setBillingCycle('quarterly')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    billingCycle === 'quarterly'
                      ? 'bg-white border-emerald-600 shadow-xs'
                      : 'bg-white/60 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Quarterly (3 Months)</span>
                    <span className="text-xs font-bold text-emerald-700 font-mono">
                      ₹{selectedPlan.quarterlyFee}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium mt-1">
                    Includes advance quarterly savings.
                  </p>
                </button>
              </div>
            </div>

            {/* Step 3: Discount & Charity Options */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-emerald-700" />
                <span>3. Discount & Charity Options (छूट एवं चैरिटी विकल्प)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DISCOUNT_OPTIONS.map((opt) => {
                  const active = selectedDiscount === opt.label;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setSelectedDiscount(opt.label)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        active
                          ? opt.isCharity
                            ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-xs'
                            : 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold flex items-center gap-1">
                          {opt.isCharity && (
                            <HeartHandshake className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          )}
                          <span>{opt.label}</span>
                        </span>
                        <span className="text-[11px] font-mono font-bold text-emerald-700">
                          -{opt.percent}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Extra Special Concession or Charity Welfare Support */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Additional Special Discount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  max={baseTuition}
                  value={customExtraDiscount || ''}
                  onChange={(e) =>
                    setCustomExtraDiscount(Math.max(0, Number(e.target.value) || 0))
                  }
                  placeholder="0 (Director approved ₹ off)"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              {!isCharityOption && (
                <label className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5 cursor-pointer hover:border-emerald-300">
                  <input
                    type="checkbox"
                    checked={donateToCharityFund}
                    onChange={(e) => setDonateToCharityFund(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 w-4 h-4"
                  />
                  <div className="text-[11px]">
                    <span className="font-bold text-slate-900 block">
                      Support Student Charity Fund (+₹100)
                    </span>
                    <span className="text-slate-500">
                      Voluntary contribution for poor students' books & OMR kits.
                    </span>
                  </div>
                </label>
              )}
            </div>

            {/* Included Curriculum Features */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-700">
                Included in {selectedPlan.classLevel}:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {selectedPlan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Dynamic Fee Card & Summary */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-900 to-slate-950 text-white rounded-2xl p-6 sm:p-7 shadow-lg space-y-6">
            <div>
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                Class-Wise Fee & Charity Breakdown
              </span>
              <h3 className="text-xl font-bold mt-1 text-white">
                {selectedPlan.classLevel}
              </h3>
              <p className="text-xs text-emerald-200 font-hindi">
                पारदर्शी शुल्क एवं छात्रवृत्ति / चैरिटी विवरण
              </p>
            </div>

            <div className="space-y-3 text-xs border-y border-emerald-800/80 py-4">
              <div className="flex items-center justify-between text-slate-200">
                <span>
                  Base Tuition ({billingCycle === 'monthly' ? 'Monthly' : 'Quarterly'}):
                </span>
                <span className="font-mono font-bold text-white tabular-nums">
                  ₹{baseTuition}
                </span>
              </div>

              {discountObj.percent > 0 && (
                <div className="flex items-center justify-between text-amber-300 font-medium">
                  <span>{discountObj.label}:</span>
                  <span className="font-mono tabular-nums">-₹{discountAmount}</span>
                </div>
              )}

              {customExtraDiscount > 0 && (
                <div className="flex items-center justify-between text-amber-300 font-medium">
                  <span>Special Additional Concession:</span>
                  <span className="font-mono tabular-nums">-₹{customExtraDiscount}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-200">
                <span>Net Tuition Fee:</span>
                <span className="font-mono font-bold text-emerald-300 tabular-nums">
                  ₹{afterSchemeTuition}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-200">
                <span>Registration & Study Kit (One-Time):</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {registrationFee === 0 ? '₹0 (Waived)' : `₹${registrationFee}`}
                </span>
              </div>

              {charityContribution > 0 && (
                <div className="flex items-center justify-between text-emerald-300">
                  <span>Voluntary Charity Welfare Donation:</span>
                  <span className="font-mono font-bold tabular-nums">
                    +₹{charityContribution}
                  </span>
                </div>
              )}
            </div>

            {/* Total Calculation */}
            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
                  Net Payable at Admission:
                </span>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
                    ₹{totalPayable}
                  </span>
                  <p className="text-[10px] text-emerald-300">
                    {discountObj.percent === 100
                      ? '100% Free Education under Charity Quota'
                      : billingCycle === 'monthly'
                      ? 'Includes 1st month net tuition + registration'
                      : 'Includes 3 months net tuition + registration'}
                  </p>
                </div>
              </div>
              {(discountAmount > 0 || customExtraDiscount > 0) && (
                <p className="text-[11px] text-amber-300 flex items-center gap-1 pt-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Total Concession Applied: ₹{discountAmount + customExtraDiscount}
                  </span>
                </p>
              )}
            </div>

            {/* Action CTA */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() =>
                  onApplyFeeToInquiry(
                    selectedPlan.classLevel,
                    afterSchemeTuition,
                    selectedDiscount,
                    isCharityOption
                  )
                }
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Proceed to Admission Form with this Fee Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                Pre-fills Class, Discount/Charity Option & Net Fee in the Enrollment Form below.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
