/**
 * Tooltip - Elite UI Tooltip Component
 *
 * Features:
 * - Multiple positions (top, bottom, left, right)
 * - Delay options
 * - Arrow indicator
 * - Dark/light variants
 */

import React, { useState, useRef, useEffect } from 'react'

const positions = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2'
}

const arrows = {
  top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-800',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-800',
  left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-800',
  right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-800'
}

export default function Tooltip({
  children,
  content,
  position = 'top',
  delay = 200,
  disabled = false,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const timeoutRef = useRef(null)
  const triggerRef = useRef(null)

  const showTooltip = () => {
    if (disabled) return
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (!content) return children

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      {isVisible && (
        <div
          className={`
            absolute z-50 ${positions[position]}
            px-3 py-2 text-sm text-white
            bg-slate-800 rounded-lg shadow-xl
            whitespace-nowrap
            animate-tooltip-in
            ${className}
          `}
          role="tooltip"
        >
          {content}

          {/* Arrow */}
          <div
            className={`
              absolute w-0 h-0 border-4
              ${arrows[position]}
            `}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes tooltip-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .animate-tooltip-in {
          animation: tooltip-in 0.15s ease-out;
        }
      `}</style>
    </div>
  )
}

// Info Tooltip (with icon)
export function InfoTooltip({
  content,
  position = 'top',
  iconSize = 'sm'
}) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <Tooltip content={content} position={position}>
      <span className={`${sizes[iconSize]} text-slate-500 hover:text-slate-400 cursor-help inline-flex items-center justify-center`}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
    </Tooltip>
  )
}

// Popover (click-triggered tooltip with richer content)
export function Popover({
  children,
  content,
  trigger,
  position = 'bottom',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={popoverRef} className="relative inline-flex">
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`
            absolute z-50 ${positions[position]}
            p-4 min-w-[200px]
            bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl
            animate-tooltip-in
            ${className}
          `}
        >
          {content}
        </div>
      )}

      <style jsx>{`
        @keyframes tooltip-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .animate-tooltip-in {
          animation: tooltip-in 0.15s ease-out;
        }
      `}</style>
    </div>
  )
}

// Keyboard Shortcut Tooltip
export function KeyboardTooltip({
  children,
  shortcut,
  description,
  position = 'top'
}) {
  return (
    <Tooltip
      position={position}
      content={
        <div className="flex items-center gap-2">
          <span>{description}</span>
          <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs font-mono">
            {shortcut}
          </kbd>
        </div>
      }
    >
      {children}
    </Tooltip>
  )
}
