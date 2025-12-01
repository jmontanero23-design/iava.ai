/**
 * LEGENDARY Micro-Interactions
 *
 * Reusable animation utilities for premium UI feedback
 * Based on: Apple Human Interface Guidelines and Material Motion
 */

import { animation } from '../styles/tokens'

/**
 * CSS transition presets for common interactions
 */
export const transitions = {
  // Fast response for immediate feedback
  fast: `all ${animation.duration.fast}ms ${animation.easing.smooth}`,

  // Normal timing for most interactions
  normal: `all ${animation.duration.normal}ms ${animation.easing.smooth}`,

  // Slow for dramatic reveals
  slow: `all ${animation.duration.slow}ms ${animation.easing.smooth}`,

  // Spring physics for playful interactions
  spring: `all ${animation.duration.normal}ms ${animation.easing.spring}`,

  // Scale only
  scale: `transform ${animation.duration.fast}ms ${animation.easing.spring}`,

  // Opacity only
  fade: `opacity ${animation.duration.normal}ms ${animation.easing.smooth}`,

  // Background color only
  bgColor: `background-color ${animation.duration.fast}ms ${animation.easing.smooth}`,

  // Border only
  border: `border-color ${animation.duration.fast}ms ${animation.easing.smooth}`,

  // Box shadow only
  shadow: `box-shadow ${animation.duration.normal}ms ${animation.easing.smooth}`,
}

/**
 * Keyframe animation definitions (CSS strings)
 */
export const keyframes = {
  // Fade in from transparent
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,

  // Fade out to transparent
  fadeOut: `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `,

  // Slide up from bottom
  slideUp: `
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,

  // Slide down from top
  slideDown: `
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,

  // Scale up from small
  scaleUp: `
    @keyframes scaleUp {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
  `,

  // Scale down from large
  scaleDown: `
    @keyframes scaleDown {
      from { opacity: 0; transform: scale(1.1); }
      to { opacity: 1; transform: scale(1); }
    }
  `,

  // Pop in with spring
  popIn: `
    @keyframes popIn {
      0% { opacity: 0; transform: scale(0.8); }
      70% { transform: scale(1.05); }
      100% { opacity: 1; transform: scale(1); }
    }
  `,

  // Bounce in
  bounceIn: `
    @keyframes bounceIn {
      0% { opacity: 0; transform: scale(0.3); }
      50% { transform: scale(1.05); }
      70% { transform: scale(0.95); }
      100% { opacity: 1; transform: scale(1); }
    }
  `,

  // Pulse glow effect
  pulseGlow: `
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.3); }
      50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.5); }
    }
  `,

  // Shimmer loading effect
  shimmer: `
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `,

  // Spin rotation
  spin: `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,

  // Shake for errors
  shake: `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-5px); }
      40%, 80% { transform: translateX(5px); }
    }
  `,

  // Success checkmark
  successCheck: `
    @keyframes successCheck {
      0% { stroke-dashoffset: 50; }
      100% { stroke-dashoffset: 0; }
    }
  `,

  // Float up and down
  float: `
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `,

  // Subtle breathing effect
  breathe: `
    @keyframes breathe {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.02); opacity: 0.9; }
    }
  `,

  // Ring pulse for score
  ringPulse: `
    @keyframes ringPulse {
      0%, 100% { stroke-opacity: 1; }
      50% { stroke-opacity: 0.6; }
    }
  `,

  // Typing indicator dots
  typingDots: `
    @keyframes typingDots {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-4px); }
    }
  `,
}

/**
 * Get animation CSS for a keyframe
 * @param {string} name - Keyframe name
 * @param {string} duration - Animation duration
 * @param {string} timing - Timing function
 * @param {string} iterationCount - Number of iterations
 */
export function getAnimation(
  name,
  duration = animation.duration.normal + 'ms',
  timing = animation.easing.smooth,
  iterationCount = '1'
) {
  return `${name} ${duration} ${timing} ${iterationCount}`
}

/**
 * Button press effect styles
 */
export const buttonPress = {
  // Resting state
  rest: {
    transform: 'scale(1)',
    transition: transitions.spring,
  },
  // Pressed state
  pressed: {
    transform: 'scale(0.98)',
  },
  // Hover state
  hover: {
    transform: 'scale(1.02)',
  },
}

/**
 * Card hover effect styles
 */
export const cardHover = {
  rest: {
    transform: 'translateY(0)',
    boxShadow: 'none',
    transition: transitions.normal,
  },
  hover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
  },
}

/**
 * Stagger animation helper for lists
 * @param {number} index - Item index
 * @param {number} baseDelay - Base delay in ms
 * @param {number} staggerDelay - Delay between items in ms
 */
export function getStaggerDelay(index, baseDelay = 0, staggerDelay = 50) {
  return `${baseDelay + index * staggerDelay}ms`
}

/**
 * Get stagger animation style for list items
 */
export function getStaggerStyle(index, animationName = 'slideUp') {
  return {
    animation: `${animationName} ${animation.duration.normal}ms ${animation.easing.smooth} forwards`,
    animationDelay: getStaggerDelay(index),
    opacity: 0,
  }
}

/**
 * Intersection Observer based reveal animation hook helper
 */
export function createRevealObserver(callback, options = {}) {
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '0px',
    ...options,
  }

  if (typeof IntersectionObserver === 'undefined') {
    return null
  }

  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry.target)
      }
    })
  }, defaultOptions)
}

/**
 * All keyframes combined as a single CSS string for injection
 */
export const allKeyframes = Object.values(keyframes).join('\n')

export default {
  transitions,
  keyframes,
  allKeyframes,
  getAnimation,
  buttonPress,
  cardHover,
  getStaggerDelay,
  getStaggerStyle,
  createRevealObserver,
}
