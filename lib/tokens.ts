export const color = {
  bg: 'var(--color-bg)',
  bgInverse: 'var(--color-bg-inverse)',
  bg2: 'var(--color-bg-2)',
  text: 'var(--color-text)',
  textMuted: 'var(--color-text-muted)',
  textLight: 'var(--color-text-light)',
  textInverse: 'var(--color-text-inverse)',
  primary: 'var(--color-primary)',
  primaryText: 'var(--color-primary-text)',
  border: 'var(--color-border)',
  borderLight: 'var(--color-border-light)',
  success: 'var(--color-success)',
  successBg: 'var(--color-success-bg)',
  danger: 'var(--color-danger)',
  dangerBg: 'var(--color-danger-bg)',
  starEmpty: 'var(--color-star-empty)',
  starFilled: 'var(--color-star-filled)',
} as const

export const font = {
  primary: 'var(--font-primary)',
  body: 'var(--font-body)',
  numeric: 'var(--font-primary)',
} as const

export const raw = {
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    900: '#111827',
    800: '#1F2937',
    500: '#6B7280',
    400: '#9CA3AF',
    300: '#D1D5DB',
    200: '#E5E7EB',
  },
}
