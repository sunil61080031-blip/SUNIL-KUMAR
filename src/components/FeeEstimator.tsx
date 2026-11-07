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
  Settings,
  Table2
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

type FeeSubTab = 'calculator' | 'table';

export const FeeEstimator: React.FC<FeeEstimatorProps> = ({
  feePlans,
  isAdmin,
  onOpenAdminFees,
  onApplyFeeToInquiry
}) => {
  const [subTab, setSubTab] = useState<FeeSubTab>('calculator');
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
  const registrationFee =
    discountObj.percent === 100 ? 0 : selectedPlan.registrationFee;
  const charityContribution = donateToCharityFund && !isCharityOption ? 100 : 0;
  const totalPayable = afterSchemeTuition + registrationFee + charityContribution;

  return (
    <section id="fee-calculator" className="py-8 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        {/* Compact Header + Sub-Section Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <Calculator className="w-4 h-4 text-emerald-700" />
              <span>Class-Wise Tuition Fee, Discount & Charity Calculator</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Class-Wise Tuition Fees, Discounts & Charity Option
            </h2>
            <p className="text-xs font-semibold text-emerald-800 font-hindi">
              कक्षावार ट्यूशन शुल्क, छात्रवृत्ति छूट एवं निःशुल्क चैरिटी शिक्षा विकल्प
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSubTab('calculator')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  subTab === 'calculator'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>1. Interactive Fee Calculator</span>
              </button>

              <button
                type="button"
                onClick={() => setSubTab('table')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  subTab === 'table'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                <span>2. Class-Wise Fee Schedule ({feePlans.length} Classes)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenAdminFees}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isAdmin ? 'Edit Class-Wise Fees' : 'Admin: Edit Fee Table'}</span>
            </button>
          </div>
        </div>

        {/* SUB-SECTION 1: INTERACTIVE FEE & CHARITY CALCULATOR */}
        {subTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Interactive Controls */}
            <div className="lg:col-span-7 bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              {/* Step 1: Choose Class */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  1. Select Class-Wise Fee Plan (Nursery to 12th)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {feePlans.map((plan) => (
                    <button
                      key={plan.classNum}
                      type="button"
                      onClick={() => setSelectedClassNum(plan.classNum)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left cursor-pointer ${
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
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  2. Payment Interval
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
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
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingCycle('quarterly')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      billingCycle === 'quarterly'
                        ? 'bg-white border-emerald-600 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Quarterly (3 Mo)</span>
                      <span className="text-xs font-bold text-emerald-700 font-mono">
                        ₹{selectedPlan.quarterlyFee}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 3: Discount & Charity Options */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-emerald-700" />
                  <span>3. Discount & Charity Options (छूट एवं चैरिटी विकल्प)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DISCOUNT_OPTIONS.map((opt) => {
                    const active = selectedDiscount === opt.label;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setSelectedDiscount(opt.label)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
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
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                          {opt.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Extra Special Concession or Charity Welfare Support */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
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
                    className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                {!isCharityOption && (
                  <label className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-start gap-2 cursor-pointer hover:border-emerald-300">
                    <input
                      type="checkbox"
                      checked={donateToCharityFund}
                      onChange={(e) => setDonateToCharityFund(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 w-4 h-4"
                    />
                    <div className="text-[11px]">
                      <span className="font-bold text-slate-900 block">
                        Support Charity Fund (+₹100)
                      </span>
                      <span className="text-slate-500">
                        Voluntary contribution for needy students.
                      </span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Right Column: Dynamic Fee Card & Summary */}
            <div className="lg:col-span-5 bg-gradient-to-br from-emerald-900 to-slate-950 text-white rounded-2xl p-6 shadow-md space-y-4">
              <div>
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                  Class-Wise Fee & Charity Breakdown
                </span>
                <h3 className="text-xl font-bold mt-0.5 text-white">
                  {selectedPlan.classLevel}
                </h3>
                <p className="text-xs text-emerald-200 font-hindi">
                  पारदर्शी शुल्क एवं छात्रवृत्ति / चैरिटी विवरण
                </p>
              </div>

              <div className="space-y-2.5 text-xs border-y border-emerald-800/80 py-3.5">
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

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onApplyFeeToInquiry(
                      selectedPlan.classLevel,
                      afterSchemeTuition,
                      selectedDiscount,
                      isCharityOption
                    )
                  }
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>Proceed to Admission Form with this Fee Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUB-SECTION 2: CLASS-WISE FEE STRUCTURE TABLE */}
        {subTab === 'table' && (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Complete Class-Wise Tuition Fee Structure (Nursery to Class 12th)
                </h3>
                <p className="text-xs text-slate-500">
                  All classes are eligible for Sibling (10%), Merit (20%), EWS (30%), Partial Charity (50%), and 100% Charity Free Education waivers.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                    <th className="py-2.5 px-3 font-bold">Class / Group</th>
                    <th className="py-2.5 px-3 font-bold">Monthly Fee</th>
                    <th className="py-2.5 px-3 font-bold">Quarterly Fee</th>
                    <th className="py-2.5 px-3 font-bold">Registration</th>
                    <th className="py-2.5 px-3 font-bold">Key Curriculum Features</th>
                    <th className="py-2.5 px-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {feePlans.map((plan) => (
                    <tr key={plan.classNum} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {plan.classLevel}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                        ₹{plan.monthlyFee}/mo
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                        ₹{plan.quarterlyFee}/qtr
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                        ₹{plan.registrationFee}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{plan.features.slice(0, 2).join(' · ')}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClassNum(plan.classNum);
                            setSubTab('calculator');
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md font-bold text-[11px] cursor-pointer"
                        >
                          Calculate / Apply
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
