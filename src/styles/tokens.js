/**
 * iAVA.ai LEGENDARY Design Tokens
 * THE SINGLE SOURCE OF TRUTH
 *
 * DO NOT HARDCODE VALUES ELSEWHERE - ALWAYS IMPORT FROM HERE
 *
 * Based on: iAVA-ULTIMATE-DESIGN-SYSTEM.html
 * Version: 1.0 | November 2025
 */

// ===========================================
// COLORS
// ===========================================

export const colors = {
  // THE VOID (Backgrounds)
  void: '#000000',
  voidSoft: '#030712',
  depth1: '#0a0f1a',
  depth2: '#111827',
  depth3: '#1f2937',

  // INTELLIGENCE (Purple) - AI Features, AVA Mind
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7', // PRIMARY
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
    dim: 'rgba(168, 85, 247, 0.12)',
    glow: 'rgba(168, 85, 247, 0.5)',
  },

  // PREDICTION (Cyan) - Chronos, Forecasts
  cyan: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee', // PRIMARY
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    dim: 'rgba(34, 211, 238, 0.12)',
    glow: 'rgba(34, 211, 238, 0.5)',
  },

  // SUCCESS (Emerald) - Profit, Bullish
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399', // PRIMARY
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    dim: 'rgba(52, 211, 153, 0.12)',
    glow: 'rgba(52, 211, 153, 0.4)',
  },

  // DANGER (Red) - Loss, Bearish
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171', // PRIMARY
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    dim: 'rgba(248, 113, 113, 0.12)',
    glow: 'rgba(248, 113, 113, 0.4)',
  },

  // CAUTION (Amber)
  amber: {
    400: '#fbbf24',
    500: '#f59e0b',
    dim: 'rgba(251, 191, 36, 0.12)',
  },

  // CORE (Indigo)
  indigo: {
    400: '#818cf8',
    500: '#6366f1', // PRIMARY
    600: '#4f46e5',
    dim: 'rgba(99, 102, 241, 0.12)',
    glow: 'rgba(99, 102, 241, 0.5)',
  },

  // TEXT HIERARCHY
  text: {
    100: '#ffffff',
    90: '#f1f5f9',
    70: '#cbd5e1',
    50: '#94a3b8',
    30: '#64748b',
    20: '#475569',
  },

  // GLASS - Darker for sharper, more premium look
  glass: {
    bg: 'rgba(3, 7, 18, 0.95)',           // Much darker, higher opacity
    bgHeavy: 'rgba(0, 0, 0, 0.98)',       // Nearly opaque black
    border: 'rgba(255, 255, 255, 0.04)',  // Subtle border
    borderLight: 'rgba(255, 255, 255, 0.06)',
  },
}

// ===========================================
// GRADIENTS
// ===========================================

export const gradients = {
  // THE UNICORN GRADIENT - Signature iAVA gradient
  unicorn: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%)',
  unicornVertical: 'linear-gradient(180deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%)',

  // Action gradients
  fire: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  ocean: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
  forest: 'linear-gradient(135deg, #10b981 0%, #22d3ee 100%)',
  aurora: 'linear-gradient(135deg, #22d3ee 0%, #a855f7 50%, #f43f5e 100%)',

  // Button gradients
  buyButton: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
  sellButton: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
}

// ===========================================
// SPACING
// ===========================================

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
}

// ===========================================
// BORDER RADIUS
// ===========================================

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
}

// ===========================================
// TYPOGRAPHY
// ===========================================

export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', monospace",
  },
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
    '6xl': 40,
    '7xl': 48,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  letterSpacing: {
    tighter: '-0.04em',
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
    wider: '0.05em',
    widest: '0.1em',
  },
}

// ===========================================
// ANIMATION
// ===========================================

export const animation = {
  // Spring physics - USE THESE, NOT LINEAR
  easing: {
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  duration: {
    instant: 100,
    fast: 150,
    normal: 250,
    slow: 400,
    slower: 600,
    slowest: 1000,
  },
}

// ===========================================
// SHADOWS
// ===========================================

export const shadows = {
  xs: '0 1px 2px rgba(0, 0, 0, 0.3)',
  sm: '0 2px 8px rgba(0, 0, 0, 0.4)',
  md: '0 8px 24px rgba(0, 0, 0, 0.5)',
  lg: '0 20px 60px rgba(0, 0, 0, 0.6)',
  xl: '0 32px 80px rgba(0, 0, 0, 0.7)',
  glow: {
    purple: '0 0 40px rgba(168, 85, 247, 0.5)',
    cyan: '0 0 40px rgba(34, 211, 238, 0.5)',
    emerald: '0 0 30px rgba(52, 211, 153, 0.4)',
    red: '0 0 30px rgba(248, 113, 113, 0.4)',
    indigo: '0 0 40px rgba(99, 102, 241, 0.5)',
  },
}

// ===========================================
// Z-INDEX LAYERS
// ===========================================

export const zIndex = {
  content: 10,
  score: 20,
  nav: 30,
  topbar: 40,
  modal: 50,
  toast: 60,
}

// ===========================================
// LAYOUT
// ===========================================

export const layout = {
  // Desktop grid
  desktop: {
    iconRail: 72,
    watchlistPanel: 280,
    aiPanel: 380,
    topBar: 56,
  },
  // Mobile
  mobile: {
    bottomNav: 72,
    topBar: 56,
  },
  // Safe areas (CSS env() fallbacks)
  safeTop: 'env(safe-area-inset-top, 0px)',
  safeBottom: 'env(safe-area-inset-bottom, 0px)',
}

// ===========================================
// COMPONENT SIZES
// ===========================================

export const componentSizes = {
  // Touch targets (iOS HIG: 44px minimum)
  touchTarget: 44,

  // Score ring sizes
  scoreRing: {
    sm: { ring: 48, stroke: 4, fontSize: 14 },
    md: { ring: 64, stroke: 5, fontSize: 20 },
    lg: { ring: 80, stroke: 5, fontSize: 28 },
    xl: { ring: 100, stroke: 6, fontSize: 32 },
  },

  // Button sizes
  button: {
    sm: { height: 32, px: 12, fontSize: 12 },
    md: { height: 40, px: 16, fontSize: 14 },
    lg: { height: 48, px: 24, fontSize: 16 },
  },

  // Avatar sizes
  avatar: {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  },
}

// ===========================================
// EXPORT ALL AS DEFAULT
// ===========================================

const tokens = {
  colors,
  gradients,
  spacing,
  radius,
  typography,
  animation,
  shadows,
  zIndex,
  layout,
  componentSizes,
}

export default tokens
