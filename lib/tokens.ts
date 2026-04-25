// Design tokens — use these everywhere instead of raw CSS vars
// so TypeScript catches typos and refactors are safe

export const c = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  border: 'var(--border)',
  borderHover: 'var(--border-hover)',
  primary: 'var(--primary)',
  accent: 'var(--accent)',
  accentLight: 'var(--accent-light)',
  accentBorder: 'var(--accent-border)',
  text1: 'var(--text-1)',
  text2: 'var(--text-2)',
  text3: 'var(--text-3)',
  green: 'var(--green)',
  greenLight: 'var(--green-light)',
  greenBorder: 'var(--green-border)',
  orange: 'var(--orange)',
  blue: 'var(--blue)',
  blueLight: 'var(--blue-light)',
} as const

export const f = {
  serif: 'var(--font-serif)',
  sans: 'var(--font-sans)',
} as const

export const r = {
  sm: 'var(--r-sm)',
  md: 'var(--r-md)',
  lg: 'var(--r-lg)',
  xl: 'var(--r-xl)',
  full: 'var(--r-full)',
} as const

export const sh = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
} as const

// Raw values for calculations / non-CSS-var usage
export const raw = {
  bg: '#F8F8F5',
  surface: '#FFFFFF',
  border: '#E8E8E4',
  primary: '#1A1A2E',
  accent: '#E63946',
  text1: '#0D0D0D',
  text2: '#4A4A4A',
  text3: '#9A9A9A',
  green: '#2D6A4F',
  orange: '#E76F51',
} as const
