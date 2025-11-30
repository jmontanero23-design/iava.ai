/**
 * AVA Design System - Elite UI Components
 *
 * PhD++ Quality unified component library for iAVA.ai
 *
 * Features:
 * - Consistent design tokens (colors, spacing, typography)
 * - Accessible components (WCAG 2.1 AA)
 * - Mobile-first with 44px+ touch targets
 * - Dark mode optimized
 * - Animation presets
 */

// Design Tokens
export const tokens = {
  colors: {
    // Primary
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A'
    },
    // Accent - Cyan (AVA brand)
    accent: {
      50: '#ECFEFF',
      100: '#CFFAFE',
      200: '#A5F3FC',
      300: '#67E8F9',
      400: '#22D3EE',
      500: '#06B6D4',
      600: '#0891B2',
      700: '#0E7490',
      800: '#155E75',
      900: '#164E63'
    },
    // Success
    success: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981',
      600: '#059669',
      700: '#047857',
      800: '#065F46',
      900: '#064E3B'
    },
    // Warning
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F'
    },
    // Error
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444',
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D'
    },
    // Purple (AI/AVA Mind)
    purple: {
      50: '#FAF5FF',
      100: '#F3E8FF',
      200: '#E9D5FF',
      300: '#D8B4FE',
      400: '#C084FC',
      500: '#A855F7',
      600: '#9333EA',
      700: '#7E22CE',
      800: '#6B21A8',
      900: '#581C87'
    },
    // Slate (backgrounds, text)
    slate: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
      950: '#020617'
    }
  },

  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px'
  },

  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px'
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },

  borderRadius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px'
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    glow: {
      cyan: '0 0 20px rgba(6, 182, 212, 0.3)',
      purple: '0 0 20px rgba(168, 85, 247, 0.3)',
      emerald: '0 0 20px rgba(16, 185, 129, 0.3)',
      red: '0 0 20px rgba(239, 68, 68, 0.3)'
    }
  },

  animation: {
    duration: {
      instant: '0ms',
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  },

  // Touch targets (iOS/Android guidelines)
  touchTarget: {
    min: '44px',
    comfortable: '48px',
    large: '56px'
  }
}

// Component style presets
export const presets = {
  // Card styles
  card: {
    base: 'bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50',
    elevated: 'bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-xl',
    interactive: 'bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 hover:border-slate-700/50 transition-all cursor-pointer',
    glass: 'bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10'
  },

  // Button styles
  button: {
    primary: 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 transition-all',
    secondary: 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 font-medium rounded-xl border border-slate-700/50 transition-all',
    ghost: 'hover:bg-slate-800/50 text-slate-400 hover:text-white font-medium rounded-xl transition-all',
    danger: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/25 transition-all',
    success: 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all'
  },

  // Input styles
  input: {
    base: 'w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all',
    error: 'w-full px-4 py-3 bg-red-900/20 border border-red-500/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all'
  },

  // Badge styles
  badge: {
    default: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300',
    success: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/50 text-emerald-400 border border-emerald-500/30',
    warning: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/50 text-amber-400 border border-amber-500/30',
    error: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-400 border border-red-500/30',
    info: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-900/50 text-cyan-400 border border-cyan-500/30',
    purple: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/50 text-purple-400 border border-purple-500/30'
  },

  // Text styles
  text: {
    heading: 'text-white font-bold tracking-tight',
    subheading: 'text-slate-300 font-semibold',
    body: 'text-slate-400',
    muted: 'text-slate-500',
    link: 'text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer'
  }
}

// Export components
export { default as Button } from './Button.jsx'
export { default as Card } from './Card.jsx'
export { default as Input } from './Input.jsx'
export { default as Badge } from './Badge.jsx'
export { default as Skeleton } from './Skeleton.jsx'
export { default as Modal } from './Modal.jsx'
export { default as Tooltip } from './Tooltip.jsx'

// LEGENDARY UI Components
export { default as Logo, LogoMark, LogoFull, AppIcon, LoadingLogo } from './Logo.jsx'
export { default as ScoreRing, ScoreRingMini, ScoreCard } from './ScoreRing.jsx'

// LEGENDARY Design Tokens (new)
export { default as legendaryTokens } from '../../styles/tokens.js'
export * as designTokens from '../../styles/tokens.js'
