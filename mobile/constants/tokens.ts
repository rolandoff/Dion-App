// ── Light mode — main app screens (Home, Capture, Profile) ────────────────────
export const Colors = {
  background: '#F5F2EC',        // Soft Bone
  surface: '#FFFFFF',
  surfaceHigh: '#EDE8DF',       // Warm elevated surface
  border: 'rgba(21,21,21,0.10)',
  borderSubtle: 'rgba(21,21,21,0.06)',

  textPrimary: '#151515',
  textSecondary: '#5C5549',     // Warm brown-gray
  textMuted: '#9C9285',         // Muted warm gray
  textInverse: '#FFFFFF',

  accent: '#7E8A68',            // Muted Olive — primary brand accent
  accentMuted: '#B5BCA8',       // Muted Sage
  accentWarm: '#C4A882',        // Warm accent
  accentDark: '#4B5E3C',        // Dark Olive — for filled buttons

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  error: '#C0453A',
  success: '#7E8A68',
} as const;

// ── Dark mode — onboarding screens only ───────────────────────────────────────
export const DarkColors = {
  background: '#151515',        // Charcoal Black
  surface: '#1E1E1E',
  surfaceHigh: '#252525',
  border: 'rgba(255,255,255,0.10)',
  borderSubtle: 'rgba(255,255,255,0.06)',

  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.72)',
  textMuted: 'rgba(255,255,255,0.40)',
  textInverse: '#151515',

  accent: '#7E8A68',
  accentMuted: '#B5BCA8',
  accentWarm: '#C4A882',
  accentDark: '#4B5E3C',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  error: '#E07060',
  success: '#7E8A68',
} as const;

// ── Spacing ───────────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,        // primary horizontal padding per spec
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// ── Radius — soft luxury, 20–28px per spec ────────────────────────────────────
export const Radius = {
  sm: 12,
  md: 20,        // default card radius
  lg: 24,
  xl: 32,
  full: 999,
} as const;

// ── Typography — per spec: Body 18px, Caption 13px, Display 52px ──────────────
export const FontSize = {
  xs: 13,        // Caption (13–14px per spec)
  sm: 15,        // Small support text
  base: 18,      // Body L (18–20px per spec) — preferred default
  md: 22,        // Heading M low-end
  lg: 28,        // Heading L
  xl: 34,        // Heading XL
  xxl: 42,       // Display L
  xxxl: 52,      // Display XL
} as const;

export const FontFamily = {
  light: 'Montserrat_300Light',
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semiBold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
} as const;

export const LineHeight = {
  tight: 1.1,
  normal: 1.5,
  relaxed: 1.6,
} as const;
