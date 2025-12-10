// lib/tokens.ts
/* -------------- ROLES (never change in components) -------------- */
export const color = {
  /* surface */
  bg: '#FFFFFF',
  bgInverse: '#000000',
  
  /* text */
  text: '#111827',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  textInverse: '#FFFFFF', // 🆕 For dark backgrounds
  
  /* interactive */
  primary: '#111827',
  primaryText: '#FFFFFF',
  
  /* border */
  border: '#D1D5DB',
  borderLight: '#E5E7EB',
  
  /* feedback */
  success: '#03543F',
  successBg: '#DEF7EC',
  danger: '#991B1B',
  dangerBg: '#FEF2F2', // 🆕 Danger backgrounds
  
  /* specific */
  starEmpty: '#D1D5DB',
  starFilled: '#FBBF24',
} as const;

export const font = {
  primary:  "'Poppins', sans-serif",
  body:     "'Poppins Sans', sans-serif",
  numeric:  "'Poppins', sans-serif",
} as const;

/*  --------------  KEEP THE OLD SCALE IF YOU STILL WANT IT --------------  */
export const raw = {
  white: '#FFFFFF',
  black: '#000000',
  gray: { 900:'#111827',800:'#1F2937',500:'#6B7280',400:'#9CA3AF',300:'#D1D5DB',200:'#E5E7EB' },
};