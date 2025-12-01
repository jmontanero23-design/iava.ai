/**
 * LEGENDARY Layout Shell
 *
 * Responsive layout that transforms between:
 * - DESKTOP: 4-column grid (IconRail | Watchlist | Main | AIPanel)
 * - MOBILE: Full-screen with bottom navigation
 *
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html & iAVA-ULTIMATE-LEGENDARY-MOBILE.html
 */

import { useState, useEffect } from 'react'
import { colors, gradients, layout, zIndex, animation } from '../../styles/tokens'

// Ambient Orbs - Floating gradient background elements
function AmbientOrbs() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Purple orb - top left */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'orbFloat1 20s ease-in-out infinite',
        }}
      />
      {/* Cyan orb - bottom right */}
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'orbFloat2 25s ease-in-out infinite',
        }}
      />
      {/* Indigo orb - center */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '30%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'orbFloat3 30s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 20px) scale(1.1); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, -30px) scale(1.15); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -25px) scale(1.05); }
        }
      `}</style>
    </div>
  )
}

export default function LegendaryLayout({
  children,
  iconRail,
  watchlistPanel,
  aiPanel,
  topBar,
  bottomNav,
  showPanels = { watchlist: true, ai: true },
}) {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  // Responsive breakpoint detection
  useEffect(() => {
    const checkBreakpoints = () => {
      const width = window.innerWidth
      setIsMobile(width < 768) // Mobile: < 768px
      setIsTablet(width >= 768 && width < 1280) // Tablet: 768-1279px
    }

    checkBreakpoints()
    window.addEventListener('resize', checkBreakpoints)
    return () => window.removeEventListener('resize', checkBreakpoints)
  }, [])

  // Calculate grid columns based on visible panels
  const getGridColumns = () => {
    if (isMobile) return '1fr'
    if (isTablet) {
      // Tablet: Icon rail + main content (no side panels)
      return `${layout.desktop.iconRail}px 1fr`
    }
    // Desktop: Full 4-column layout
    const cols = [`${layout.desktop.iconRail}px`]
    if (showPanels.watchlist) cols.push(`${layout.desktop.watchlistPanel}px`)
    cols.push('1fr')
    if (showPanels.ai) cols.push(`${layout.desktop.aiPanel}px`)
    return cols.join(' ')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.voidSoft,
        position: 'relative',
      }}
    >
      {/* Ambient background orbs */}
      <AmbientOrbs />

      {/* TopBar - Fixed at top */}
      {topBar && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: layout.desktop.topBar,
            zIndex: zIndex.topbar,
          }}
        >
          {topBar}
        </div>
      )}

      {/* Main grid container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: getGridColumns(),
          minHeight: '100vh',
          paddingTop: topBar ? layout.desktop.topBar : 0,
          paddingBottom: isMobile && bottomNav ? layout.mobile.bottomNav : 0,
          position: 'relative',
          zIndex: zIndex.content,
        }}
      >
        {/* Icon Rail - Desktop/Tablet only */}
        {!isMobile && iconRail && (
          <div
            style={{
              position: 'fixed',
              left: 0,
              top: topBar ? layout.desktop.topBar : 0,
              bottom: 0,
              width: layout.desktop.iconRail,
              background: colors.glass.bgHeavy,
              backdropFilter: 'blur(20px)',
              borderRight: `1px solid ${colors.glass.border}`,
              zIndex: zIndex.nav,
              overflowY: 'auto',
            }}
          >
            {iconRail}
          </div>
        )}

        {/* Watchlist Panel - Desktop only */}
        {!isMobile && !isTablet && showPanels.watchlist && watchlistPanel && (
          <div
            style={{
              position: 'fixed',
              left: layout.desktop.iconRail,
              top: topBar ? layout.desktop.topBar : 0,
              bottom: 0,
              width: layout.desktop.watchlistPanel,
              background: colors.glass.bg,
              backdropFilter: 'blur(20px)',
              borderRight: `1px solid ${colors.glass.border}`,
              zIndex: zIndex.content,
              overflowY: 'auto',
            }}
          >
            {watchlistPanel}
          </div>
        )}

        {/* Main Content Area */}
        <main
          style={{
            marginLeft: isMobile
              ? 0
              : isTablet
                ? layout.desktop.iconRail
                : layout.desktop.iconRail + (showPanels.watchlist ? layout.desktop.watchlistPanel : 0),
            marginRight: isMobile || isTablet || !showPanels.ai
              ? 0
              : layout.desktop.aiPanel,
            minHeight: '100%',
            position: 'relative',
            transition: `margin ${animation.duration.normal}ms ${animation.easing.smooth}`,
          }}
        >
          {children}
        </main>

        {/* AI Panel - Desktop only */}
        {!isMobile && !isTablet && showPanels.ai && aiPanel && (
          <div
            style={{
              position: 'fixed',
              right: 0,
              top: topBar ? layout.desktop.topBar : 0,
              bottom: 0,
              width: layout.desktop.aiPanel,
              background: colors.glass.bg,
              backdropFilter: 'blur(20px)',
              borderLeft: `1px solid ${colors.glass.border}`,
              zIndex: zIndex.content,
              overflowY: 'auto',
            }}
          >
            {aiPanel}
          </div>
        )}
      </div>

      {/* Bottom Navigation - Mobile only */}
      {isMobile && bottomNav && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: zIndex.nav,
          }}
        >
          {bottomNav}
        </div>
      )}
    </div>
  )
}
