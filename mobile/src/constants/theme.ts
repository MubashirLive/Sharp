/**
 * Sharp — Design System Tokens
 *
 * Instagram Monochromatic Black & White Theme.
 * Pure Black (#000000), Pure White (#FFFFFF), crisp grays. Zero blue/teal.
 */

import '@/global.css';

import { Platform } from 'react-native';

// ─── Color Palette ──────────────────────────────────────────────────────────

/** Instagram Monochrome Accent Ramp */
export const Accent = {
  /** Primary interactive: buttons, active elements, badges */
  default: '#000000',
  /** Pressed/active state */
  pressed: '#262626',
  /** Soft backgrounds: active tab pill, selected row, tags */
  light: '#EFEFEF',
  /** Very light background: subtle highlight */
  subtle: '#FAFAFA',
  /** Dark accent for high-contrast elements */
  dark: '#000000',
} as const;

/** Semantic Status Colors */
export const StatusColors = {
  destructive:     { light: '#ED4956', dark: '#FF453A' },
  success:         { light: '#000000', dark: '#FFFFFF' },
  warning:         { light: '#FF9500', dark: '#FF9F0A' },
  info:            { light: '#000000', dark: '#FFFFFF' },
} as const;

/** Full semantic color palette — light & dark */
export const Colors = {
  light: {
    // ── Backgrounds
    background:          '#FFFFFF',
    backgroundSecondary: '#FAFAFA',
    backgroundTertiary:  '#FFFFFF',
    backgroundElevated:  '#FFFFFF',

    // ── Fills
    fill:                'rgba(0,0,0,0.08)',
    fillSecondary:       'rgba(0,0,0,0.04)',
    fillTertiary:        'rgba(0,0,0,0.02)',

    // ── Separators
    separator:           '#DBDBDB',
    separatorOpaque:     '#EFEFEF',

    // ── Labels / Text
    label:               '#000000',
    labelSecondary:      '#737373',
    labelTertiary:       '#8E8E8E',
    labelQuaternary:     '#C7C7C7',

    // ── Accent (Pure Black in light mode)
    accent:              '#000000',
    accentPressed:       '#262626',
    accentLight:         '#EFEFEF',
    accentSubtle:        '#FAFAFA',
    accentDark:          '#000000',

    // ── Semantic
    destructive:         '#ED4956',
    success:             '#262626',
    warning:             '#FF9500',

    // ── Tab Bar
    tabInactive:         '#8E8E8E',

    // ── Legacy compat (used by ThemedText / ThemedView)
    text:                '#000000',
    textSecondary:       '#737373',
    backgroundElement:   '#FAFAFA',
    backgroundSelected:  '#EFEFEF',
  },
  dark: {
    // ── Backgrounds
    background:          '#000000',
    backgroundSecondary: '#121212',
    backgroundTertiary:  '#262626',
    backgroundElevated:  '#262626',

    // ── Fills
    fill:                'rgba(255,255,255,0.15)',
    fillSecondary:       'rgba(255,255,255,0.08)',
    fillTertiary:        'rgba(255,255,255,0.04)',

    // ── Separators
    separator:           '#262626',
    separatorOpaque:     '#363636',

    // ── Labels / Text
    label:               '#FFFFFF',
    labelSecondary:      '#A8A8A8',
    labelTertiary:       '#737373',
    labelQuaternary:     '#363636',

    // ── Accent (Pure White in dark mode)
    accent:              '#FFFFFF',
    accentPressed:       '#E5E5E5',
    accentLight:         '#262626',
    accentSubtle:        '#121212',
    accentDark:          '#FFFFFF',

    // ── Semantic
    destructive:         '#FF453A',
    success:             '#FFFFFF',
    warning:             '#FF9F0A',

    // ── Tab Bar
    tabInactive:         '#737373',

    // ── Legacy compat
    text:                '#FFFFFF',
    textSecondary:       '#A8A8A8',
    backgroundElement:   '#121212',
    backgroundSelected:  '#262626',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// ─── Typography ─────────────────────────────────────────────────────────────

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    rounded: '"SF Pro Rounded", system-ui, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
});

export const TypeScale = {
  largeTitle:  { fontSize: 34, lineHeight: 41, fontWeight: '700' as const, letterSpacing: 0.37 },
  title1:      { fontSize: 28, lineHeight: 34, fontWeight: '700' as const, letterSpacing: 0.36 },
  title2:      { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing: 0.35 },
  title3:      { fontSize: 20, lineHeight: 25, fontWeight: '600' as const, letterSpacing: 0.38 },
  headline:    { fontSize: 17, lineHeight: 22, fontWeight: '600' as const, letterSpacing: -0.41 },
  body:        { fontSize: 17, lineHeight: 22, fontWeight: '400' as const, letterSpacing: -0.41 },
  callout:     { fontSize: 16, lineHeight: 21, fontWeight: '400' as const, letterSpacing: -0.32 },
  subheadline: { fontSize: 15, lineHeight: 20, fontWeight: '400' as const, letterSpacing: -0.24 },
  footnote:    { fontSize: 13, lineHeight: 18, fontWeight: '400' as const, letterSpacing: -0.08 },
  caption1:    { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, letterSpacing: 0 },
  caption2:    { fontSize: 11, lineHeight: 13, fontWeight: '400' as const, letterSpacing: 0.07 },
} as const;

export type TypeStyle = keyof typeof TypeScale;

// ─── Spacing (8pt Grid) ─────────────────────────────────────────────────────

export const Spacing = {
  half: 2,
  one: 4,
  oneHalf: 6,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  eight: 32,
  ten: 40,
  navBar: 44,
} as const;

// ─── Corner Radius ──────────────────────────────────────────────────────────

export const Radius = {
  tiny: 4,
  small: 6,
  medium: 10,
  large: 14,
  xl: 16,
  bubble: 18,
  full: 38,
  pill: 999,
} as const;

// ─── Shadows ────────────────────────────────────────────────────────────────

export const Shadows = Platform.select({
  ios: {
    none: {},
    xs: { shadowColor: '#000', shadowOffset: { width: 0, height: 0.5 }, shadowOpacity: 0.04, shadowRadius: 1 },
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24 },
    xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 48 },
  },
  default: {
    none: {},
    xs: { elevation: 1 },
    sm: { elevation: 2 },
    md: { elevation: 6 },
    lg: { elevation: 12 },
    xl: { elevation: 24 },
  },
}) ?? { none: {}, xs: {}, sm: {}, md: {}, lg: {}, xl: {} };

export const AvatarSizes = {
  xs: 28,
  sm: 36,
  md: 40,
  lg: 56,
  xl: 80,
  '2xl': 120,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
export const MinTouchTarget = 44;
export const TabBarHeight = 49;
export const NavigationBarHeight = 44;
export const ScreenPadding = 16;
