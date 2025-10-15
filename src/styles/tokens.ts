/**
 * Design Tokens
 *
 * Centralized design system tokens that define spacing, typography, colors, and other
 * design primitives. These tokens are consumed by Tailwind config and can be used
 * directly in components for programmatic styling.
 */

// ============================================================================
// Spacing Scale
// ============================================================================

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  18: '4.5rem', // 72px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  88: '22rem', // 352px
  96: '24rem', // 384px
  128: '32rem', // 512px
} as const

// ============================================================================
// Typography
// ============================================================================

export const fontFamily = {
  sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  serif: ['Crimson Pro', 'Georgia', 'serif'],
  mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
} as const

export const fontSize = {
  xs: ['0.75rem', { lineHeight: '1rem' }],
  sm: ['0.875rem', { lineHeight: '1.25rem' }],
  base: ['1rem', { lineHeight: '1.5rem' }],
  lg: ['1.125rem', { lineHeight: '1.75rem' }],
  xl: ['1.25rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  '5xl': ['3rem', { lineHeight: '1' }],
  '6xl': ['3.75rem', { lineHeight: '1' }],
  '7xl': ['4.5rem', { lineHeight: '1' }],
  '8xl': ['6rem', { lineHeight: '1' }],
  '9xl': ['8rem', { lineHeight: '1' }],
  // Reading-optimized sizes
  'reader-sm': ['1rem', { lineHeight: '1.6rem' }],
  'reader-base': ['1.125rem', { lineHeight: '1.8rem' }],
  'reader-lg': ['1.25rem', { lineHeight: '2rem' }],
  'reader-xl': ['1.5rem', { lineHeight: '2.4rem' }],
} as const

export const fontWeight = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const

// ============================================================================
// Colors
// ============================================================================

export const colors = {
  // Primary brand colors
  primary: {
    DEFAULT: '#b91c1c', // red-700
    foreground: '#ffffff',
    hover: '#991b1b', // red-800
    light: '#dc2626', // red-600
  },
  // Accent colors
  accent: {
    DEFAULT: '#f97316', // orange-500
    foreground: '#ffffff',
    hover: '#ea580c', // orange-600
    light: '#fb923c', // orange-400
  },
  // Semantic colors
  success: {
    DEFAULT: '#16a34a', // green-600
    foreground: '#ffffff',
    light: '#22c55e', // green-500
  },
  warning: {
    DEFAULT: '#f59e0b', // amber-500
    foreground: '#000000',
    light: '#fbbf24', // amber-400
  },
  error: {
    DEFAULT: '#dc2626', // red-600
    foreground: '#ffffff',
    light: '#ef4444', // red-500
  },
  // Background and surface colors
  background: {
    DEFAULT: '#ffffff',
    dark: '#0f172a', // slate-900
    sepia: '#f5f3ed',
  },
  surface: {
    DEFAULT: '#f8fafc', // slate-50
    dark: '#1e293b', // slate-800
    sepia: '#e8e5da',
  },
  // Border colors
  border: {
    DEFAULT: '#e2e8f0', // slate-200
    dark: '#334155', // slate-700
    sepia: '#d4cdb8',
  },
  // Text colors
  foreground: {
    DEFAULT: '#0f172a', // slate-900
    muted: '#64748b', // slate-500
    dark: '#f8fafc', // slate-50
    'dark-muted': '#94a3b8', // slate-400
    sepia: '#3e3522',
    'sepia-muted': '#6b6149',
  },
} as const

// ============================================================================
// Border Radius
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem', // 4px
  DEFAULT: '0.375rem', // 6px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem', // 32px
  full: '9999px',
} as const

// ============================================================================
// Shadows
// ============================================================================

export const boxShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
  // Focus rings (WCAG compliant)
  focus: '0 0 0 3px rgba(185, 28, 28, 0.1)',
  'focus-dark': '0 0 0 3px rgba(185, 28, 28, 0.3)',
} as const

// ============================================================================
// Z-Index Scale
// ============================================================================

export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  // Semantic layers
  dropdown: '20',
  sticky: '10',
  overlay: '30',
  popover: '40',
  modal: '50',
} as const

// ============================================================================
// Transitions & Animations
// ============================================================================

export const transitionDuration = {
  75: '75ms',
  100: '100ms',
  150: '150ms',
  200: '200ms',
  250: '250ms',
  300: '300ms',
  500: '500ms',
  700: '700ms',
  1000: '1000ms',
} as const

export const transitionTimingFunction = {
  DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const

// ============================================================================
// Breakpoints
// ============================================================================

export const screens = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get spacing value by key
 */
export function getSpacing(key: keyof typeof spacing): string {
  return spacing[key]
}

/**
 * Get color value by path (e.g., 'primary.DEFAULT', 'background.dark')
 */
export function getColor(path: string): string {
  const parts = path.split('.')
  let value: unknown = colors

  for (const part of parts) {
    if (typeof value === 'object' && value !== null && part in value) {
      value = (value as Record<string, unknown>)[part]
    } else {
      throw new Error(`Color path "${path}" not found`)
    }
  }

  if (typeof value === 'string') {
    return value
  }

  throw new Error(`Color path "${path}" does not resolve to a string`)
}

/**
 * Get border radius value by key
 */
export function getBorderRadius(key: keyof typeof borderRadius): string {
  return borderRadius[key]
}

/**
 * Get z-index value by key
 */
export function getZIndex(key: keyof typeof zIndex): string | number {
  return zIndex[key]
}

// ============================================================================
// Type Exports
// ============================================================================

export type SpacingKey = keyof typeof spacing
export type FontFamilyKey = keyof typeof fontFamily
export type FontSizeKey = keyof typeof fontSize
export type FontWeightKey = keyof typeof fontWeight
export type BorderRadiusKey = keyof typeof borderRadius
export type ZIndexKey = keyof typeof zIndex
export type TransitionDurationKey = keyof typeof transitionDuration
export type ScreenKey = keyof typeof screens
