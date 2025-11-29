/**
 * Input - Elite UI Input Components
 *
 * Features:
 * - Text, number, search, password variants
 * - Error states with messages
 * - Label and helper text
 * - Icon support
 * - 44px+ touch targets
 */

import React, { useState, forwardRef } from 'react'

// Base Input
const Input = forwardRef(({
  type = 'text',
  label,
  error,
  helper,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false)

  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-sm min-h-[44px]',
    lg: 'px-4 py-4 text-base min-h-[52px]'
  }

  const baseClasses = `
    ${fullWidth ? 'w-full' : ''}
    ${sizes[size]}
    bg-slate-800/50 border rounded-xl
    text-white placeholder-slate-500
    focus:outline-none transition-all duration-150
    ${error
      ? 'border-red-500/50 focus:ring-2 focus:ring-red-500/30'
      : 'border-slate-700/50 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50'
    }
    ${icon ? (iconPosition === 'left' ? 'pl-11' : 'pr-11') : ''}
  `

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className={`
            absolute top-1/2 -translate-y-1/2 text-slate-500
            ${iconPosition === 'left' ? 'left-4' : 'right-4'}
            ${focused ? 'text-cyan-400' : ''}
            transition-colors
          `}>
            {icon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          className={baseClasses}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </div>
      {(error || helper) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-red-400' : 'text-slate-500'}`}>
          {error || helper}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
export default Input

// Search Input
export function SearchInput({
  placeholder = 'Search...',
  onSearch,
  onClear,
  loading = false,
  className = '',
  ...props
}) {
  const [value, setValue] = useState('')

  const handleChange = (e) => {
    setValue(e.target.value)
    onSearch?.(e.target.value)
  }

  const handleClear = () => {
    setValue('')
    onClear?.()
  }

  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
        {loading ? (
          <svg className="w-5 h-5 animate-spin\" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
      </span>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-12 pr-10 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 min-h-[44px]"
        {...props}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-500 hover:text-white rounded-full hover:bg-slate-700/50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

// Textarea
export const Textarea = forwardRef(({
  label,
  error,
  helper,
  rows = 4,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full px-4 py-3 bg-slate-800/50 border rounded-xl
          text-white placeholder-slate-500 resize-none
          focus:outline-none focus:ring-2 transition-all
          ${error
            ? 'border-red-500/50 focus:ring-red-500/30'
            : 'border-slate-700/50 focus:ring-cyan-500/30 focus:border-cyan-500/50'
          }
        `}
        {...props}
      />
      {(error || helper) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-red-400' : 'text-slate-500'}`}>
          {error || helper}
        </p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'

// Select
export const Select = forwardRef(({
  label,
  error,
  options = [],
  placeholder = 'Select...',
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full px-4 py-3 bg-slate-800/50 border rounded-xl
          text-white appearance-none cursor-pointer min-h-[44px]
          focus:outline-none focus:ring-2 transition-all
          ${error
            ? 'border-red-500/50 focus:ring-red-500/30'
            : 'border-slate-700/50 focus:ring-cyan-500/30 focus:border-cyan-500/50'
          }
        `}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.75rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em'
        }}
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="bg-slate-900"
          >
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
})

Select.displayName = 'Select'

// Toggle Switch
export function Toggle({
  checked = false,
  onChange,
  label,
  size = 'md',
  disabled = false,
  className = ''
}) {
  const sizes = {
    sm: { track: 'w-8 h-5', thumb: 'w-4 h-4', translate: 'translate-x-3' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-8', thumb: 'w-7 h-7', translate: 'translate-x-6' }
  }

  const s = sizes[size]

  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange?.(e.target.checked)}
          className="sr-only"
        />
        <div className={`
          ${s.track} rounded-full transition-colors
          ${checked ? 'bg-cyan-500' : 'bg-slate-700'}
        `} />
        <div className={`
          absolute top-0.5 left-0.5 ${s.thumb} rounded-full bg-white shadow-lg
          transition-transform duration-200
          ${checked ? s.translate : 'translate-x-0'}
        `} />
      </div>
      {label && <span className="text-sm text-slate-300">{label}</span>}
    </label>
  )
}
