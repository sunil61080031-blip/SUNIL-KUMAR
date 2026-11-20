export type DashboardThemeId =
  | 'classic-emerald'
  | 'royal-indigo'
  | 'heritage-maroon'
  | 'ocean-teal'
  | 'executive-slate';

export type DashboardSurfaceStyle = 'flat' | 'elevated' | 'frosted';
export type DashboardCornerStyle = 'sharp' | 'rounded' | 'soft';
export type DashboardMotionStyle = 'subtle' | 'lift' | 'static';
export type DashboardDensityStyle = 'comfortable' | 'compact';

export interface DashboardThemeConfig {
  themeId: DashboardThemeId;
  surfaceStyle: DashboardSurfaceStyle;
  cornerStyle: DashboardCornerStyle;
  motionStyle: DashboardMotionStyle;
  density: DashboardDensityStyle;
}

export interface DashboardThemePreset {
  id: DashboardThemeId;
  name: string;
  tagline: string;
  canvasBg: string;
  canvasGradient: string;
  barBg: string;
  barBorder: string;
  barLabelText: string;
  accentHex: string;
  accentHoverHex: string;
  accentSoftBg: string;
  accentTextOnFill: string;
  cardBorderHex: string;
}

export const DASHBOARD_THEME_STORAGE_KEY = 'sntc_dashboard_theme_v1';

export const DEFAULT_DASHBOARD_THEME: DashboardThemeConfig = {
  themeId: 'classic-emerald',
  surfaceStyle: 'elevated',
  cornerStyle: 'rounded',
  motionStyle: 'lift',
  density: 'comfortable'
};

export const DASHBOARD_THEME_PRESETS: DashboardThemePreset[] = [
  {
    id: 'classic-emerald',
    name: 'Shiksha Classic',
    tagline: 'Crisp slate canvas with emerald active accents',
    canvasBg: '#f8fafc',
    canvasGradient:
      'radial-gradient(circle at 12% 0%, rgba(16, 185, 129, 0.06), transparent 42%), #f8fafc',
    barBg: '#0f172a',
    barBorder: '#1e293b',
    barLabelText: '#34d399',
    accentHex: '#059669',
    accentHoverHex: '#047857',
    accentSoftBg: '#ecfdf5',
    accentTextOnFill: '#ffffff',
    cardBorderHex: '#e2e8f0'
  },
  {
    id: 'royal-indigo',
    name: 'Academic Royal',
    tagline: 'Cool indigo-tinted workspace with deep navy chrome',
    canvasBg: '#f1f5fe',
    canvasGradient:
      'radial-gradient(circle at 15% 0%, rgba(79, 70, 229, 0.09), transparent 46%), #f1f5fe',
    barBg: '#1e1b4b',
    barBorder: '#312e81',
    barLabelText: '#a5b4fc',
    accentHex: '#4f46e5',
    accentHoverHex: '#4338ca',
    accentSoftBg: '#eef2ff',
    accentTextOnFill: '#ffffff',
    cardBorderHex: '#dbe4ff'
  },
  {
    id: 'heritage-maroon',
    name: 'Heritage Maroon',
    tagline: 'Warm institutional ivory matched to official fee slips',
    canvasBg: '#faf6f4',
    canvasGradient:
      'radial-gradient(circle at 14% 0%, rgba(122, 20, 38, 0.07), transparent 45%), #faf6f4',
    barBg: '#4a0d19',
    barBorder: '#691424',
    barLabelText: '#fda4af',
    accentHex: '#7a1426',
    accentHoverHex: '#5e0f1d',
    accentSoftBg: '#fdf2f4',
    accentTextOnFill: '#ffffff',
    cardBorderHex: '#eadbd9'
  },
  {
    id: 'ocean-teal',
    name: 'Coastal Horizon',
    tagline: 'Fresh sea-glass surface with deep teal workspace bar',
    canvasBg: '#f0f9f8',
    canvasGradient:
      'radial-gradient(circle at 16% 0%, rgba(13, 148, 136, 0.08), transparent 46%), #f0f9f8',
    barBg: '#0d2f33',
    barBorder: '#16464d',
    barLabelText: '#5eead4',
    accentHex: '#0d9488',
    accentHoverHex: '#0f766e',
    accentSoftBg: '#f0fdfa',
    accentTextOnFill: '#ffffff',
    cardBorderHex: '#d5ece9'
  },
  {
    id: 'executive-slate',
    name: 'Executive Obsidian',
    tagline: 'High-contrast platinum desk with obsidian bar & amber gold',
    canvasBg: '#e9eef4',
    canvasGradient:
      'radial-gradient(circle at 14% 0%, rgba(217, 119, 6, 0.08), transparent 44%), #e9eef4',
    barBg: '#090d16',
    barBorder: '#1e293b',
    barLabelText: '#fbbf24',
    accentHex: '#d97706',
    accentHoverHex: '#b45309',
    accentSoftBg: '#fffbeb',
    accentTextOnFill: '#ffffff',
    cardBorderHex: '#d3dce6'
  }
];

export function getDashboardThemePreset(
  themeId: DashboardThemeId
): DashboardThemePreset {
  return (
    DASHBOARD_THEME_PRESETS.find((preset) => preset.id === themeId) ||
    DASHBOARD_THEME_PRESETS[0]
  );
}

export function loadDashboardTheme(): DashboardThemeConfig {
  try {
    const raw = window.localStorage.getItem(DASHBOARD_THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_DASHBOARD_THEME;
    const parsed = JSON.parse(raw) as Partial<DashboardThemeConfig>;
    const validTheme = DASHBOARD_THEME_PRESETS.some(
      (p) => p.id === parsed.themeId
    )
      ? (parsed.themeId as DashboardThemeId)
      : DEFAULT_DASHBOARD_THEME.themeId;

    return {
      themeId: validTheme,
      surfaceStyle:
        parsed.surfaceStyle === 'flat' ||
        parsed.surfaceStyle === 'elevated' ||
        parsed.surfaceStyle === 'frosted'
          ? parsed.surfaceStyle
          : DEFAULT_DASHBOARD_THEME.surfaceStyle,
      cornerStyle:
        parsed.cornerStyle === 'sharp' ||
        parsed.cornerStyle === 'rounded' ||
        parsed.cornerStyle === 'soft'
          ? parsed.cornerStyle
          : DEFAULT_DASHBOARD_THEME.cornerStyle,
      motionStyle:
        parsed.motionStyle === 'subtle' ||
        parsed.motionStyle === 'lift' ||
        parsed.motionStyle === 'static'
          ? parsed.motionStyle
          : DEFAULT_DASHBOARD_THEME.motionStyle,
      density:
        parsed.density === 'comfortable' || parsed.density === 'compact'
          ? parsed.density
          : DEFAULT_DASHBOARD_THEME.density
    };
  } catch {
    return DEFAULT_DASHBOARD_THEME;
  }
}

export function applyDashboardThemeToDom(config: DashboardThemeConfig): void {
  const preset = getDashboardThemePreset(config.themeId);
  const root = document.documentElement;

  root.setAttribute('data-dash-theme', config.themeId);
  root.setAttribute('data-dash-surface', config.surfaceStyle);
  root.setAttribute('data-dash-corners', config.cornerStyle);
  root.setAttribute('data-dash-motion', config.motionStyle);
  root.setAttribute('data-dash-density', config.density);

  root.style.setProperty('--dash-canvas-bg', preset.canvasBg);
  root.style.setProperty('--dash-canvas-gradient', preset.canvasGradient);
  root.style.setProperty('--dash-bar-bg', preset.barBg);
  root.style.setProperty('--dash-bar-border', preset.barBorder);
  root.style.setProperty('--dash-bar-label', preset.barLabelText);
  root.style.setProperty('--dash-accent', preset.accentHex);
  root.style.setProperty('--dash-accent-hover', preset.accentHoverHex);
  root.style.setProperty('--dash-accent-soft', preset.accentSoftBg);
  root.style.setProperty('--dash-card-border', preset.cardBorderHex);

  const radius =
    config.cornerStyle === 'sharp'
      ? '0.5rem'
      : config.cornerStyle === 'soft'
      ? '1.35rem'
      : '1rem';
  root.style.setProperty('--dash-card-radius', radius);
}
