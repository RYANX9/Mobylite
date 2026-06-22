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

// Spacing scale (px) — stop hand-picking margin/padding numbers
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const

// Single source of truth for breakpoints. Every page currently
// hand-rolls its own numbers, all slightly different — migrate
// them to this as each file gets touched.
export const bp = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1440,
} as const

// Ready-to-interpolate media query strings for the raw <style> blocks
// used throughout the app: `${mq.lg} { .foo { display: none } }`
export const mq = {
  sm: `@media (max-width: ${bp.sm}px)`,
  md: `@media (max-width: ${bp.md}px)`,
  lg: `@media (max-width: ${bp.lg}px)`,
  xl: `@media (max-width: ${bp.xl}px)`,
  '2xl': `@media (max-width: ${bp['2xl']}px)`,
} as const

// Motion durations (ms) — replaces hardcoded "0.15s" strings
export const motion = {
  fast: 120,
  base: 150,
  slow: 220,
  slower: 300,
} as const

export const ease = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

// z-index scale — every stacking context in the app gets a named
// slot instead of a guessed magic number
export const z = {
  base: 1,
  badge: 3,
  sticky: 50,
  compareBar: 80,
  drawer: 90,
  nav: 100,
  dropdown: 200,
  toast: 999,
} as const

// Raw hex values for calculations / non-CSS-var usage (canvas, charts)
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
