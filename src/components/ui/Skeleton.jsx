/**
 * LEGENDARY Skeleton Components
 *
 * Features:
 * - Multiple shapes (text, circle, rectangle, card)
 * - Shimmer animation with unicorn gradient
 * - Customizable dimensions
 * - Dark mode optimized for THE VOID
 * Based on: LEGENDARY design system
 */

import React from 'react'
import { colors, radius, spacing } from '../../styles/tokens'

// Base Skeleton
export default function Skeleton({
  width,
  height,
  circle = false,
  rounded = 'lg',
  animate = true,
  className = ''
}) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full'
  }

  return (
    <div
      className={`
        bg-slate-800/50 relative overflow-hidden
        ${circle ? 'rounded-full' : roundedClasses[rounded]}
        ${animate ? 'animate-pulse' : ''}
        ${className}
      `}
      style={{
        width: width || '100%',
        height: height || '20px'
      }}
    >
      {animate && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-slate-700/30 to-transparent" />
      )}
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  )
}

// Text Skeleton
export function SkeletonText({
  lines = 3,
  lastLineWidth = '60%',
  spacing = 'md',
  className = ''
}) {
  const spacingClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4'
  }

  return (
    <div className={`flex flex-col ${spacingClasses[spacing]} ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="16px"
          width={i === lines - 1 ? lastLineWidth : '100%'}
          rounded="md"
        />
      ))}
    </div>
  )
}

// Avatar Skeleton
export function SkeletonAvatar({
  size = 'md',
  className = ''
}) {
  const sizes = {
    sm: '32px',
    md: '40px',
    lg: '48px',
    xl: '64px'
  }

  return (
    <Skeleton
      width={sizes[size]}
      height={sizes[size]}
      circle
      className={className}
    />
  )
}

// Card Skeleton
export function SkeletonCard({
  hasImage = true,
  hasAvatar = false,
  lines = 3,
  className = ''
}) {
  return (
    <div className={`bg-slate-900/50 rounded-2xl border border-slate-800/50 overflow-hidden ${className}`}>
      {hasImage && (
        <Skeleton height="160px" rounded="none" />
      )}
      <div className="p-4">
        {hasAvatar && (
          <div className="flex items-center gap-3 mb-4">
            <SkeletonAvatar size="md" />
            <div className="flex-1">
              <Skeleton height="16px" width="40%" className="mb-2" />
              <Skeleton height="12px" width="25%" />
            </div>
          </div>
        )}
        <SkeletonText lines={lines} />
      </div>
    </div>
  )
}

// Stats Skeleton
export function SkeletonStats({ className = '' }) {
  return (
    <div className={`bg-slate-900/50 rounded-2xl border border-slate-800/50 p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton height="14px" width="60%" className="mb-3" />
          <Skeleton height="32px" width="80%" className="mb-2" />
          <Skeleton height="14px" width="40%" />
        </div>
        <Skeleton width="48px" height="48px" rounded="xl" />
      </div>
    </div>
  )
}

// Table Row Skeleton
export function SkeletonTableRow({
  columns = 5,
  className = ''
}) {
  return (
    <div className={`flex items-center gap-4 py-3 ${className}`}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          height="14px"
          width={i === 0 ? '30%' : `${Math.random() * 20 + 10}%`}
          className="flex-shrink-0"
        />
      ))}
    </div>
  )
}

// Chart Skeleton
export function SkeletonChart({
  height = '200px',
  className = ''
}) {
  return (
    <div className={`bg-slate-900/50 rounded-2xl border border-slate-800/50 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton height="20px" width="30%" />
        <div className="flex gap-2">
          <Skeleton height="28px" width="60px" rounded="lg" />
          <Skeleton height="28px" width="60px" rounded="lg" />
        </div>
      </div>
      <div className="flex items-end gap-1" style={{ height }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            width="8%"
            height={`${Math.random() * 60 + 20}%`}
            rounded="sm"
            animate={false}
            className="bg-slate-700/30"
          />
        ))}
      </div>
    </div>
  )
}

// List Skeleton
export function SkeletonList({
  items = 5,
  hasAvatar = true,
  className = ''
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-xl">
          {hasAvatar && <SkeletonAvatar size="md" />}
          <div className="flex-1">
            <Skeleton height="14px" width={`${Math.random() * 30 + 40}%`} className="mb-2" />
            <Skeleton height="12px" width={`${Math.random() * 20 + 20}%`} />
          </div>
          <Skeleton height="14px" width="60px" />
        </div>
      ))}
    </div>
  )
}

// Dashboard Skeleton
export function SkeletonDashboard({ className = '' }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton height="28px" width="200px" className="mb-2" />
          <Skeleton height="16px" width="150px" />
        </div>
        <div className="flex gap-2">
          <Skeleton height="40px" width="100px" rounded="xl" />
          <Skeleton height="40px" width="40px" rounded="xl" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStats key={i} />
        ))}
      </div>

      {/* Chart */}
      <SkeletonChart height="250px" />

      {/* List */}
      <SkeletonList items={5} />
    </div>
  )
}

// LEGENDARY Unicorn Score Ring Skeleton
export function SkeletonScoreRing({ size = 'lg' }) {
  const sizes = {
    sm: 60,
    md: 80,
    lg: 120,
    xl: 160,
  }
  const dimension = sizes[size] || sizes.lg

  return (
    <div
      style={{
        width: dimension,
        height: dimension,
        borderRadius: '50%',
        background: `conic-gradient(from 0deg, ${colors.depth2}, ${colors.depth3}, ${colors.depth2})`,
        animation: 'spinSkeleton 2s linear infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: dimension - 16,
          height: dimension - 16,
          borderRadius: '50%',
          background: colors.depth1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Skeleton width={`${dimension / 2}px`} height={`${dimension / 4}px`} rounded="md" />
      </div>
      <style>{`
        @keyframes spinSkeleton {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// LEGENDARY Watchlist Item Skeleton
export function SkeletonWatchlistItem() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
        padding: spacing[3],
        background: colors.depth1,
        borderRadius: radius.xl,
        border: `1px solid ${colors.glass.border}`,
      }}
    >
      <Skeleton width="44px" height="44px" rounded="lg" />
      <div style={{ flex: 1 }}>
        <Skeleton width="50%" height="16px" rounded="md" className="mb-1" />
        <Skeleton width="35%" height="12px" rounded="md" />
      </div>
      <div style={{ textAlign: 'right' }}>
        <Skeleton width="60px" height="16px" rounded="md" className="mb-1" />
        <Skeleton width="40px" height="12px" rounded="md" />
      </div>
    </div>
  )
}

// LEGENDARY AI Panel Skeleton
export function SkeletonAIPanel() {
  return (
    <div style={{ padding: spacing[4] }}>
      {/* Score area */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: spacing[6],
          marginBottom: spacing[4],
        }}
      >
        <SkeletonScoreRing size="xl" />
        <div style={{ marginTop: spacing[3], width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Skeleton width="80px" height="18px" rounded="md" className="mb-1" />
          <Skeleton width="100px" height="12px" rounded="md" />
        </div>
      </div>

      {/* Breakdown */}
      <div
        style={{
          background: colors.depth2,
          borderRadius: radius.xl,
          padding: spacing[4],
          border: `1px solid ${colors.glass.border}`,
        }}
      >
        <Skeleton width="120px" height="12px" rounded="md" className="mb-3" />
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `${spacing[2]}px 0`,
            }}
          >
            <Skeleton width="70px" height="14px" rounded="md" />
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
              <Skeleton width="80px" height="4px" rounded="full" />
              <Skeleton width="24px" height="14px" rounded="md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// LEGENDARY Mobile Header Skeleton
export function SkeletonMobileHeader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing[4],
        background: colors.glass.bg,
        backdropFilter: 'blur(20px)',
        borderRadius: radius['2xl'],
        border: `1px solid ${colors.glass.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
        <Skeleton width="48px" height="48px" rounded="xl" />
        <div>
          <Skeleton width="60px" height="18px" rounded="md" className="mb-1" />
          <Skeleton width="100px" height="12px" rounded="md" />
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <Skeleton width="80px" height="24px" rounded="md" className="mb-1" />
        <Skeleton width="60px" height="14px" rounded="md" />
      </div>
    </div>
  )
}

// LEGENDARY Signal Feed Skeleton
export function SkeletonSignalFeed({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: spacing[3],
            padding: spacing[3],
            background: colors.depth1,
            borderRadius: radius.xl,
            border: `1px solid ${colors.glass.border}`,
          }}
        >
          <Skeleton width="44px" height="44px" rounded="lg" />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing[2] }}>
              <Skeleton width="80px" height="14px" rounded="md" />
              <Skeleton width="50px" height="14px" rounded="md" />
            </div>
            <Skeleton width="90%" height="12px" rounded="md" className="mb-1" />
            <Skeleton width="60%" height="12px" rounded="md" />
          </div>
        </div>
      ))}
    </div>
  )
}

// LEGENDARY Trade Panel Skeleton
export function SkeletonTradePanel() {
  return (
    <div
      style={{
        background: colors.depth1,
        borderRadius: radius['2xl'],
        border: `1px solid ${colors.glass.border}`,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: spacing[4],
          background: colors.emerald.dim,
          borderBottom: `1px solid ${colors.glass.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
          <Skeleton width="40px" height="40px" rounded="lg" />
          <div style={{ flex: 1 }}>
            <Skeleton width="150px" height="18px" rounded="md" className="mb-1" />
            <Skeleton width="100px" height="12px" rounded="md" />
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: spacing[4] }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4], marginBottom: spacing[4] }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <Skeleton width="60px" height="12px" rounded="md" className="mb-2" />
              <Skeleton width="100%" height="40px" rounded="lg" />
            </div>
          ))}
        </div>
        <Skeleton width="100%" height="48px" rounded="xl" />
      </div>
    </div>
  )
}
