import React from 'react';
import {
  DASHBOARD_THEME_PRESETS,
  DashboardCornerStyle,
  DashboardDensityStyle,
  DashboardMotionStyle,
  DashboardSurfaceStyle,
  DashboardThemeConfig,
  DEFAULT_DASHBOARD_THEME,
  getDashboardThemePreset
} from '../utils/dashboardTheme';
import {
  Check,
  Layout,
  MousePointerClick,
  Palette,
  RotateCcw,
  SlidersHorizontal,
  Square
} from 'lucide-react';

interface DashboardThemeTabProps {
  themeConfig: DashboardThemeConfig;
  onUpdateTheme: (next: DashboardThemeConfig) => void;
  onShowToast: (msg: string) => void;
}

export const DashboardThemeTab: React.FC<DashboardThemeTabProps> = ({
  themeConfig,
  onUpdateTheme,
  onShowToast
}) => {
  const activePreset = getDashboardThemePreset(themeConfig.themeId);

  const updatePartial = (patch: Partial<DashboardThemeConfig>, label?: string) => {
    const next: DashboardThemeConfig = { ...themeConfig, ...patch };
    onUpdateTheme(next);
    if (label) {
      onShowToast(label);
    }
  };

  const previewRadius =
    themeConfig.cornerStyle === 'sharp'
      ? '8px'
      : themeConfig.cornerStyle === 'soft'
      ? '20px'
      : '14px';

  const previewCardShadow =
    themeConfig.surfaceStyle === 'flat'
      ? 'none'
      : themeConfig.surfaceStyle === 'frosted'
      ? '0 10px 26px -10px rgba(15, 23, 42, 0.14)'
      : '0 4px 14px -6px rgba(15, 23, 42, 0.1)';

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h3 className="font-display text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Palette className="w-5 h-5" style={{ color: activePreset.accentHex }} />
            <span>Dashboard Theme &amp; Interactive Look</span>
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Personalize your Admin Dashboard palette, card depth, corner geometry, hover interactions, and spacing density. Official printable A4 fee slips and statements always retain crisp print formatting.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            onUpdateTheme(DEFAULT_DASHBOARD_THEME);
            onShowToast('Dashboard appearance reset to Shiksha Classic default.');
          }}
          className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Default Theme</span>
        </button>
      </div>

      {/* Live Interactive Dashboard Preview Canvas */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-800">
            Live Interactive Preview
          </span>
          <span className="text-slate-500 font-mono text-[11px]">
            {activePreset.name} · {themeConfig.surfaceStyle} ·{' '}
            {themeConfig.cornerStyle} · {themeConfig.motionStyle} ·{' '}
            {themeConfig.density}
          </span>
        </div>

        <div
          className="p-4 sm:p-5 transition-colors duration-200"
          style={{ background: activePreset.canvasGradient }}
        >
          {/* Simulated Workspace Switcher Bar */}
          <div
            className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-white mb-4"
            style={{
              backgroundColor: activePreset.barBg,
              borderRadius: previewRadius,
              border: `1px solid ${activePreset.barBorder}`
            }}
          >
            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span style={{ color: activePreset.barLabelText }}>
                SECTIONS:
              </span>
              <span
                className="px-2.5 py-1 rounded-md"
                style={{
                  backgroundColor: activePreset.accentHex,
                  color: activePreset.accentTextOnFill
                }}
              >
                Overview
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-slate-200">
                Students
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-slate-200">
                Fee Slips
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-300">
              Admin Workspace
            </span>
          </div>

          {/* Simulated Interactive Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                label: 'Active Students',
                value: '148',
                note: '92% Attendance'
              },
              {
                label: 'Monthly Collection',
                value: '₹1,42,500',
                note: '86.4% Efficiency'
              },
              {
                label: 'Active Batches',
                value: '12',
                note: 'Morning & Evening'
              }
            ].map((card) => (
              <div
                key={card.label}
                className={`bg-white transition-all duration-200 ${
                  themeConfig.density === 'compact' ? 'p-3' : 'p-4'
                } ${
                  themeConfig.motionStyle === 'lift'
                    ? 'hover:-translate-y-0.5'
                    : ''
                }`}
                style={{
                  borderRadius: previewRadius,
                  border: `1px solid ${activePreset.cardBorderHex}`,
                  boxShadow: previewCardShadow,
                  backgroundColor:
                    themeConfig.surfaceStyle === 'frosted'
                      ? 'rgba(255,255,255,0.9)'
                      : '#ffffff'
                }}
              >
                <p className="text-[11px] font-semibold text-slate-500">
                  {card.label}
                </p>
                <p
                  className="font-mono tabular-nums text-lg font-extrabold mt-0.5"
                  style={{ color: activePreset.accentHex }}
                >
                  {card.value}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">{card.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Curated Color Theme Presets */}
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900">
            1. Color Palette &amp; Workspace Mood
          </h4>
          <p className="text-xs text-slate-500">
            Choose a curated visual palette. Every preset enforces high legibility across all tables and forms.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DASHBOARD_THEME_PRESETS.map((preset) => {
            const isSelected = themeConfig.themeId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  updatePartial(
                    { themeId: preset.id },
                    `Applied "${preset.name}" dashboard theme.`
                  )
                }
                aria-pressed={isSelected}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-slate-50 border-slate-900 ring-2 ring-slate-900/15'
                    : 'bg-white border-slate-200 hover:border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {preset.name}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {preset.tagline}
                    </p>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'text-white border-transparent'
                        : 'border-slate-300 text-transparent'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: preset.accentHex }
                        : undefined
                    }
                  >
                    <Check className="w-3 h-3" />
                  </span>
                </div>

                {/* Swatch Bar: Canvas / Workspace Bar / Primary Accent */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span
                    className="h-5 flex-1 rounded-md border border-slate-300/80"
                    style={{ backgroundColor: preset.canvasBg }}
                    title="Dashboard Canvas"
                  />
                  <span
                    className="h-5 flex-1 rounded-md"
                    style={{ backgroundColor: preset.barBg }}
                    title="Workspace Header Bar"
                  />
                  <span
                    className="h-5 flex-1 rounded-md"
                    style={{ backgroundColor: preset.accentHex }}
                    title="Active Accent"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Surface Depth, Corner Style, Interactive Motion & Layout Density */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Surface Depth */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-600" />
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">
                2. Card Surface Depth
              </h4>
              <p className="text-[11px] text-slate-500">
                Control elevation shadows and translucent finish on cards
              </p>
            </div>
          </div>

          <div
            className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg text-xs"
            role="group"
            aria-label="Card surface style"
          >
            {(
              [
                { id: 'flat', label: 'Crisp Flat' },
                { id: 'elevated', label: 'Elevated' },
                { id: 'frosted', label: 'Frosted' }
              ] as { id: DashboardSurfaceStyle; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() =>
                  updatePartial(
                    { surfaceStyle: opt.id },
                    `Surface style set to ${opt.label}.`
                  )
                }
                className={`py-2 px-2 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  themeConfig.surfaceStyle === opt.id
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Corner Geometry */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center gap-2">
            <Square className="w-4 h-4 text-slate-600" />
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">
                3. Corner Geometry
              </h4>
              <p className="text-[11px] text-slate-500">
                Adjust panel corner radius across the dashboard
              </p>
            </div>
          </div>

          <div
            className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg text-xs"
            role="group"
            aria-label="Corner radius style"
          >
            {(
              [
                { id: 'sharp', label: 'Sharp' },
                { id: 'rounded', label: 'Modern' },
                { id: 'soft', label: 'Soft' }
              ] as { id: DashboardCornerStyle; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() =>
                  updatePartial(
                    { cornerStyle: opt.id },
                    `Corner geometry set to ${opt.label}.`
                  )
                }
                className={`py-2 px-2 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  themeConfig.cornerStyle === opt.id
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Hover Motion */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-slate-600" />
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">
                4. Interactive Hover Feedback
              </h4>
              <p className="text-[11px] text-slate-500">
                Choose hover elevation and transition responsiveness
              </p>
            </div>
          </div>

          <div
            className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg text-xs"
            role="group"
            aria-label="Interactive motion preference"
          >
            {(
              [
                { id: 'lift', label: 'Interactive Lift' },
                { id: 'subtle', label: 'Subtle' },
                { id: 'static', label: 'Static' }
              ] as { id: DashboardMotionStyle; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() =>
                  updatePartial(
                    { motionStyle: opt.id },
                    `Hover interaction set to ${opt.label}.`
                  )
                }
                className={`py-2 px-2 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  themeConfig.motionStyle === opt.id
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Workspace Density */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-slate-600" />
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">
                5. Table &amp; Section Density
              </h4>
              <p className="text-[11px] text-slate-500">
                Switch between airy spacing or compact high-density rows
              </p>
            </div>
          </div>

          <div
            className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg text-xs"
            role="group"
            aria-label="Dashboard layout density"
          >
            {(
              [
                { id: 'comfortable', label: 'Comfortable' },
                { id: 'compact', label: 'Compact Data' }
              ] as { id: DashboardDensityStyle; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() =>
                  updatePartial(
                    { density: opt.id },
                    `Layout density set to ${opt.label}.`
                  )
                }
                className={`py-2 px-2 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  themeConfig.density === opt.id
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
