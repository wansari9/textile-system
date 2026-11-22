/**
 * AmirtexOS design system — the single source of truth.
 *
 * Every colour, font, radius, shadow, status rule, chart style and reusable
 * component style lives here. The Vite `designSystem` plugin turns this file
 * into the app's CSS theme (see `vite.config.ts`), and components import the
 * style maps directly. Do not hardcode design values anywhere else.
 */

/* ------------------------------------------------------------------ */
/* Foundations                                                        */
/* ------------------------------------------------------------------ */

export const colors = {
  canvas: '#F4F1E8',
  paper: '#FBF9F3',
  surface: '#FFFDF8',
  cotton: '#ECE7DC',
  ink: '#161616',
  inkSoft: '#55534C',
  muted: '#8B877C',
  carbon: '#151515',
  rule: '#E2DCD0',
  thread: '#B8B0A5',
  steel: '#A8B8C8',
  white: '#FFFFFF',

  lime: '#C8F169',
  limeSoft: '#EDF9D3',
  limeDeep: '#4F6B14',
  green: '#10A661',
  greenSoft: '#EDFBF4',
  amber: '#E8A020',
  amberSoft: '#FEF6E8',
  risk: '#D92D20',
  riskSoft: '#FDECEA',
  riskLight: '#FFB4AB',
} as const;

export const fonts = {
  sans: "'Geist', system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
  serif: "'Newsreader', Georgia, serif",
  googleHref:
    'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap',
} as const;

export const radius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
} as const;

export const shadows = {
  card: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
  cardHover: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
  modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
} as const;

/* ------------------------------------------------------------------ */
/* Status rules                                                       */
/* ------------------------------------------------------------------ */

export const thresholds = {
  onTarget: 100,
  atRisk: 70,
  qualityGood: 95,
  qualityWarning: 80,
} as const;

export type Tone = 'onTarget' | 'atRisk' | 'behind' | 'idle' | 'maintenance';

export interface ToneStyle {
  label: string;
  text: string;
  dot: string;
  fill: string;
  soft: string;
  border: string;
}

export const tones: Record<Tone, ToneStyle> = {
  onTarget: {
    label: 'On target',
    text: 'text-lime-deep',
    dot: 'bg-lime-deep',
    fill: 'bg-lime',
    soft: 'bg-lime-soft',
    border: 'border-lime-deep/20',
  },
  atRisk: {
    label: 'At risk',
    text: 'text-caution-amber',
    dot: 'bg-caution-amber',
    fill: 'bg-caution-amber',
    soft: 'bg-amber-bg',
    border: 'border-caution-amber/20',
  },
  behind: {
    label: 'Behind',
    text: 'text-risk',
    dot: 'bg-risk',
    fill: 'bg-risk',
    soft: 'bg-risk-soft',
    border: 'border-risk/20',
  },
  idle: {
    label: 'Unassigned',
    text: 'text-muted',
    dot: 'bg-muted',
    fill: 'bg-rule',
    soft: 'bg-raw-cotton',
    border: 'border-rule',
  },
  maintenance: {
    label: 'Maintenance',
    text: 'text-cool-gray',
    dot: 'bg-cool-gray',
    fill: 'bg-cool-gray',
    soft: 'bg-raw-cotton',
    border: 'border-rule',
  },
};

export const toneFor = (pct: number | null, lineStatus?: string): Tone => {
  if (lineStatus === 'MAINTENANCE') return 'maintenance';
  if (pct === null) return 'idle';
  if (pct >= thresholds.onTarget) return 'onTarget';
  if (pct >= thresholds.atRisk) return 'atRisk';
  return 'behind';
};

export const statusFor = (pct: number | null, lineStatus?: string): ToneStyle =>
  tones[toneFor(pct, lineStatus)];

export const qualityTone = (pct: number): Tone =>
  pct >= thresholds.qualityGood
    ? 'onTarget'
    : pct >= thresholds.qualityWarning
      ? 'atRisk'
      : 'behind';

/* ------------------------------------------------------------------ */
/* Charts                                                             */
/* ------------------------------------------------------------------ */

const tooltipBase = {
  borderRadius: 8,
  fontSize: 12,
  border: `1px solid ${colors.rule}`,
  backgroundColor: colors.paper,
  color: colors.ink,
  boxShadow: shadows.card,
};

export const chart = {
  /** Ordered categorical palette. One accent, everything else neutral. */
  series: [
    colors.limeDeep,
    colors.ink,
    colors.amber,
    colors.risk,
    colors.thread,
    colors.muted,
    colors.green,
    colors.carbon,
  ],
  grid: colors.rule,
  axisTick: { fontSize: 11, fill: colors.muted },
  axisLine: { stroke: colors.rule },
  tooltip: {
    contentStyle: tooltipBase,
    labelStyle: { color: colors.muted },
    itemStyle: { color: colors.ink },
  },
  heroTooltip: {
    contentStyle: {
      ...tooltipBase,
      border: '1px solid rgba(255,255,255,0.12)',
      backgroundColor: colors.carbon,
      color: colors.white,
    },
    labelStyle: { color: 'rgba(255,255,255,0.55)' },
    itemStyle: { color: colors.lime },
  },
  heroBar: colors.lime,
  heroCursor: 'rgba(255,255,255,0.06)',
  barRadius: [3, 3, 0, 0] as [number, number, number, number],
  statusBarRadius: [4, 4, 0, 0] as [number, number, number, number],
} as const;

/* ------------------------------------------------------------------ */
/* Component styles                                                   */
/* ------------------------------------------------------------------ */

export const button = {
  base:
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 ' +
    'focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-50 disabled:pointer-events-none font-sans',
  variants: {
    primary: 'bg-ink text-lime hover:bg-ink/90 shadow-sm active:bg-ink',
    secondary: 'bg-raw-cotton text-ink-soft hover:bg-linen active:bg-thread border border-rule',
    outline: 'bg-paper text-ink hover:bg-lime-soft border border-rule active:bg-lime-soft',
    ghost: 'bg-transparent text-ink-soft hover:bg-raw-cotton active:bg-linen',
    danger: 'bg-risk text-white hover:bg-risk/90 shadow-sm active:bg-risk',
  },
  sizes: {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  },
} as const;

export const field = {
  label:
    'block text-[12px] font-semibold text-cool-gray uppercase tracking-wider font-sans',
  control: (hasError = false) =>
    'w-full h-10 px-3 rounded-lg border text-sm font-sans transition-all duration-150 ' +
    'placeholder:text-muted focus:outline-none focus:ring-2 disabled:bg-raw-cotton disabled:text-muted ' +
    (hasError
      ? 'border-risk focus:ring-risk/30'
      : 'border-rule focus:border-ink focus:ring-ink/10'),
  compact:
    'px-2 py-1.5 border border-rule rounded text-center text-sm bg-paper ' +
    'focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink',
  error: 'text-xs text-risk font-sans',
  helper: 'text-xs text-muted font-sans',
} as const;

export const card = {
  base:
    'bg-surface-raised rounded-xl border border-rule shadow-card transition-all duration-200',
  hover: 'hover:shadow-card-hover hover:border-thread',
  header: 'px-5 py-4 border-b border-rule',
  title: 'text-[16px] font-semibold text-ink font-sans',
  footer: 'px-5 py-3 border-t border-rule bg-canvas rounded-b-xl',
  padding: {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  },
} as const;

export const modal = {
  overlay: 'absolute inset-0 bg-ink/40 backdrop-blur-sm',
  panel:
    'relative w-full bg-surface-raised rounded-xl shadow-modal animate-[fadeIn_150ms_ease-out]',
  sizes: {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  },
  header: 'flex items-center justify-between px-5 py-4 border-b border-rule',
  title: 'text-lg font-semibold text-ink font-serif',
  close:
    'p-1 text-muted hover:text-ink rounded-lg hover:bg-raw-cotton transition-colors',
  body: 'px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto',
  footer:
    'flex items-center justify-end gap-2 px-5 py-3 border-t border-rule bg-canvas rounded-b-xl',
} as const;

export const badge = {
  status: {
    on_target: `${tones.onTarget.soft} ${tones.onTarget.text}`,
    warning: `${tones.atRisk.soft} ${tones.atRisk.text}`,
    critical: `${tones.behind.soft} ${tones.behind.text}`,
    maintenance: `${tones.maintenance.soft} ${tones.maintenance.text}`,
    idle: `${tones.idle.soft} ${tones.idle.text}`,
    default: `${tones.idle.soft} ${tones.idle.text}`,
  } as Record<string, string>,
  dot: {
    on_target: tones.onTarget.dot,
    warning: tones.atRisk.dot,
    critical: tones.behind.dot,
    maintenance: tones.maintenance.dot,
    idle: tones.idle.dot,
    default: tones.idle.dot,
  } as Record<string, string>,
  sizes: {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-[12px]',
    lg: 'px-3 py-1.5 text-[13px]',
  },
  base: 'inline-flex items-center gap-1.5 font-medium rounded-full font-sans',
} as const;

export const toast = {
  base:
    'flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-card animate-[slideUp_200ms_ease-out]',
  styles: {
    success: `${tones.onTarget.soft} ${tones.onTarget.border}`,
    error: `${tones.behind.soft} ${tones.behind.border}`,
    warning: `${tones.atRisk.soft} ${tones.atRisk.border}`,
    info: 'bg-lime-soft border-lime-deep/20',
  },
  iconColor: {
    success: tones.onTarget.text,
    error: tones.behind.text,
    warning: tones.atRisk.text,
    info: 'text-ink',
  },
} as const;

export const table = {
  wrapper: 'overflow-x-auto',
  base: 'w-full text-sm',
  head: 'border-b border-rule text-left text-[10px] uppercase tracking-[0.14em] text-muted',
  headRow: 'border-b border-rule bg-canvas/50 text-left text-[10px] uppercase tracking-[0.14em] text-muted',
  headCell: 'pb-2 pr-4 font-medium',
  headCellPadded: 'px-5 py-3 font-medium',
  body: 'divide-y divide-rule',
  row: 'transition-colors hover:bg-paper/70',
  rowHover: 'transition-colors hover:bg-paper/70',
  cell: 'py-3 pr-4',
  cellPadded: 'px-5 py-3',
  empty: 'px-5 py-12 text-center text-sm text-muted',
  numeric: 'text-right font-mono tabular-nums',
} as const;

export const page = {
  shell: 'p-4 lg:p-6 space-y-6',
  header: 'flex flex-col sm:flex-row sm:items-center justify-between gap-3',
  title: 'text-2xl lg:text-3xl font-bold text-ink',
  subtitle: 'text-sm text-muted mt-1',
  dateInput:
    'px-3 py-2 border border-rule rounded-lg text-sm bg-paper text-ink ' +
    'focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink',
  tabs: 'flex gap-1 border-b border-rule pb-1',
  tabActive: 'bg-surface-raised border border-rule border-b-paper text-ink -mb-px',
  tabIdle: 'text-muted hover:text-ink',
  tab: 'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
} as const;

export const segmented = {
  group: 'flex gap-1 overflow-x-auto pb-1',
  item: 'px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors',
  active: 'bg-ink text-lime',
  idle: 'bg-raw-cotton text-ink-soft hover:bg-linen',
  pillGroup: 'flex items-center gap-1 rounded-lg border border-rule bg-paper p-1',
  pillItem: 'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
  pillActive: 'bg-ink text-lime',
  pillIdle: 'text-ink-soft hover:bg-raw-cotton hover:text-ink',
} as const;

export const layout = {
  shell: 'flex h-screen bg-canvas',
  sidebar:
    'fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-paper text-ink border-r border-rule transition-all duration-300',
  brandRow: 'flex items-center h-16 border-b border-rule',
  brandMark: 'flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-lime shrink-0',
  brandText: 'font-serif text-lg tracking-tight text-ink',
  navLink:
    'relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all duration-150',
  navActive: 'bg-ink text-lime',
  navIdle: 'text-ink-soft hover:text-ink hover:bg-raw-cotton',
  savedViewActive: 'bg-lime-soft font-medium text-ink',
  savedViewIdle: 'text-ink-soft hover:bg-raw-cotton hover:text-ink',
  header:
    'h-16 bg-canvas/90 backdrop-blur border-b border-rule flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30',
  pageTitle: 'font-serif text-xl text-ink',
  userCard: 'rounded-xl bg-ink p-3 text-white',
  avatar:
    'w-9 h-9 rounded-full bg-lime text-ink flex items-center justify-center text-sm font-semibold shrink-0',
  iconButton:
    'p-2 text-ink-soft hover:text-ink hover:bg-raw-cotton rounded-lg transition-colors',
} as const;

export const auth = {
  shell: 'min-h-screen bg-canvas flex',
  brandPanel: 'hidden lg:flex lg:w-1/2 bg-carbon relative overflow-hidden',
  brandGlowTop: 'absolute top-20 left-20 w-72 h-72 bg-lime/10 rounded-full blur-3xl',
  brandGlowBottom: 'absolute bottom-20 right-20 w-96 h-96 bg-lime/5 rounded-full blur-3xl',
  brandMark: 'w-12 h-12 rounded-xl bg-lime text-ink flex items-center justify-center',
  brandTitle: 'font-serif text-2xl tracking-tight text-white',
  brandSubtitle: 'text-muted-steel text-sm mt-0.5 font-sans',
  headline: 'font-serif text-4xl leading-tight text-white',
  body: 'text-muted-steel text-base max-w-md font-sans',
  stat: 'font-serif text-3xl text-lime',
  formShell: 'w-full max-w-sm animate-[slideUp_300ms_ease-out]',
  card: 'bg-surface-raised rounded-xl shadow-card border border-rule p-6',
  mobileMark: 'w-10 h-10 rounded-xl bg-ink text-lime flex items-center justify-center',
  error: 'mb-4 p-3 rounded-lg bg-risk-soft border border-risk/20 text-sm text-risk font-sans',
} as const;

export const skeleton = {
  base: 'animate-pulse bg-linen',
  shapes: {
    text: 'rounded h-4',
    circle: 'rounded-full',
    rect: 'rounded-lg',
  },
} as const;

export const spinner = {
  sizes: { sm: 16, md: 24, lg: 36 },
} as const;

/* ------------------------------------------------------------------ */
/* Generated CSS (consumed by the Vite design-system plugin)          */
/* ------------------------------------------------------------------ */

const themeColors: Record<string, string> = {
  greige: colors.canvas,
  canvas: colors.canvas,
  paper: colors.paper,
  'surface-raised': colors.surface,
  'raw-cotton': colors.cotton,

  brand: colors.ink,
  'brand-light': colors.limeSoft,
  'brand-dark': colors.carbon,
  'factory-night': colors.carbon,
  'muted-steel': colors.steel,

  'loom-green': colors.green,
  'loom-green-bg': colors.greenSoft,
  'caution-amber': colors.amber,
  'amber-bg': colors.amberSoft,
  'defect-red': colors.risk,
  'defect-red-bg': colors.riskSoft,

  ink: colors.ink,
  'ink-soft': colors.inkSoft,
  muted: colors.muted,
  carbon: colors.carbon,
  slate: colors.inkSoft,
  'cool-gray': colors.muted,
  linen: colors.rule,
  rule: colors.rule,
  thread: colors.thread,

  lime: colors.lime,
  'lime-soft': colors.limeSoft,
  'lime-deep': colors.limeDeep,
  risk: colors.risk,
  'risk-soft': colors.riskSoft,
  'risk-light': colors.riskLight,
  green: colors.green,
  'green-soft': colors.greenSoft,

  border: colors.rule,
  'border-strong': colors.thread,
};

const themeVars = [
  `--font-sans: ${fonts.sans};`,
  `--font-mono: ${fonts.mono};`,
  `--font-serif: ${fonts.serif};`,
  `--font-family-sans: ${fonts.sans};`,
  `--font-family-mono: ${fonts.mono};`,
  `--font-family-serif: ${fonts.serif};`,
  ...Object.entries(themeColors).map(([name, value]) => `--color-${name}: ${value};`),
  `--radius-sm: ${radius.sm};`,
  `--radius-md: ${radius.md};`,
  `--radius-lg: ${radius.lg};`,
  `--radius-xl: ${radius.xl};`,
  `--shadow-card: ${shadows.card};`,
  `--shadow-card-hover: ${shadows.cardHover};`,
  `--shadow-modal: ${shadows.modal};`,
].join('\n  ');

export const designCss = `@import "tailwindcss";

@theme {
  ${themeVars}
}

* {
  scrollbar-width: thin;
  scrollbar-color: ${colors.rule} transparent;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: ${fonts.sans};
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: ${colors.canvas};
  color: ${colors.ink};
}

@keyframes pulse-once {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes flash-green {
  0% { background-color: ${colors.greenSoft}; }
  100% { background-color: transparent; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;
