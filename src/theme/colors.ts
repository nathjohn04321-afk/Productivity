// Pure dark palette. No light mode — see README for rationale.
export const colors = {
  // Backgrounds
  bg: '#0F0F11',
  bgElevated: '#16161A',
  surface: '#1C1C21',
  surfaceElevated: '#232329',
  surfaceHigh: '#2A2A32',
  border: '#2E2E36',
  borderSubtle: '#242429',

  // Text
  textPrimary: '#F5F5F7',
  textSecondary: '#A8A8B3',
  textTertiary: '#6E6E7A',
  textDisabled: '#4B4B54',

  // Accent — indigo/violet primary, teal secondary
  accent: '#7C6CF6',
  accentMuted: '#7C6CF633',
  accentSoft: '#7C6CF61A',
  teal: '#2DD4BF',
  tealMuted: '#2DD4BF33',

  // Semantic
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#60A5FA',

  // Priority scale
  priorityLow: '#60A5FA',
  priorityMedium: '#FBBF24',
  priorityHigh: '#FB923C',
  priorityCritical: '#F87171',

  // Overlays / misc
  overlay: 'rgba(6,6,8,0.6)',
  shimmer: '#232329',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const chartPalette = [
  '#7C6CF6',
  '#2DD4BF',
  '#FBBF24',
  '#FB923C',
  '#60A5FA',
  '#F472B6',
  '#34D399',
  '#F87171',
] as const;

export type ColorKey = keyof typeof colors;
