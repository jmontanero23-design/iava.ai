/**
 * LEGENDARY Layout Shell
 *
 * Responsive layout that transforms between:
 * - DESKTOP: 4-column layout (IconRail | Watchlist | Main | AIPanel)
 * - TABLET: 2-column layout (IconRail | Main)
 * - MOBILE: Full-screen with bottom navigation
 *
 * Architecture: Fixed positioning for panels with proper margin-based content area
 * This avoids CSS Grid conflicts and ensures panels don't overlap content.
 *
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html & iAVA-ULTIMATE-LEGENDARY-MOBILE.html
 */

import { useState, useEffect } from 'react'
import { colors, layout, zIndex, animation } from '../../styles/tokens'

// Ambient Orbs - Floating gradient background elements (matches HTML mockups)
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
      {/* Purple orb - top right (larger, more visible) */}
      <div
        style={{
          position: 'absolute',
          top: '-300px',
          right: '-200px',
          width: '800px',
          height: '800px',
          background: colors.purple[500],
          borderRadius: '50%',
          filter: 'blur(120px)',
          opacity: 0.15,
          animation: 'orbFloat1 25s ease-in-out infinite',
        }}
      />
      {/* Cyan orb - bottom left */}
      <div
        style={{
          position: 'absolute',
          bottom: '-200px',
          left: '-200px',
          width: '600px',
          height: '600px',
          background: colors.cyan[400],
          borderRadius: '50%',
          filter: 'blur(120px)',
          opacity: 0.1,
          animation: 'orbFloat2 25s ease-in-out infinite',
          animationDelay: '-8s',
        }}
      />
      {/* Indigo orb - center right */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          right: '-100px',
          width: '500px',
          height: '500px',
          background: colors.indigo[500],
          borderRadius: '50%',
          filter: 'blur(120px)',
          opacity: 0.08,
          animation: 'orbFloat3 25s ease-in-out infinite',
          animationDelay: '-15s',
        }}
      />
      {/* Floating particles */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              background: i % 2 === 0 ? 'rgba(168, 85, 247, 0.6)' : 'rgba(34, 211, 238, 0.6)',
              borderRadius: '50%',
              left: `${(i * 5) % 100}%`,
              animation: `particleFloat ${15 + i * 0.5}s linear infinite`,
              animationDelay: `${-i * 0.7}s`,
            }}
          />
        ))}
      </div>
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
        @keyframes particleFloat {
          0% { opacity: 0; transform: translateY(100vh) scale(0); }
          10% { opacity: 0.6; transform: scale(1); }
          90% { opacity: 0.6; }
          100% { opacity: 0; transform: translateY(-100px) scale(0.5); }
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

  // Calculate margins for main content based on visible fixed panels
  const getContentMargins = () => {
    if (isMobile) {
      return {
        marginLeft: 0,
        marginRight: 0,
        paddingTop: 0, // Mobile uses dynamic island, no topbar
        paddingBottom: bottomNav ? layout.mobile.bottomNav : 0,
      }
    }

    if (isTablet) {
      return {
        marginLeft: layout.desktop.iconRail,
        marginRight: 0,
        paddingTop: layout.desktop.topBar,
        paddingBottom: 0,
      }
    }

    // Desktop: Full 4-column layout
    return {
      marginLeft: layout.desktop.iconRail + (showPanels.watchlist ? layout.desktop.watchlistPanel : 0),
      marginRight: showPanels.ai ? layout.desktop.aiPanel : 0,
      paddingTop: layout.desktop.topBar,
      paddingBottom: 0,
    }
  }

  const contentMargins = getContentMargins()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.void, // Pure black - THE VOID
        position: 'relative',
      }}
    >
      {/* Ambient background orbs */}
      <AmbientOrbs />

      {/* TopBar - Fixed at top (Desktop/Tablet only) */}
      {!isMobile && topBar && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: layout.desktop.topBar,
            zIndex: zIndex.topbar,
            background: colors.glass.bgHeavy,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${colors.glass.border}`,
          }}
        >
          {topBar}
        </div>
      )}

      {/* Icon Rail - Fixed left (Desktop/Tablet only) */}
      {!isMobile && iconRail && (
        <aside
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            width: layout.desktop.iconRail,
            background: colors.glass.bgHeavy,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRight: `1px solid ${colors.glass.border}`,
            zIndex: zIndex.nav,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {iconRail}
        </aside>
      )}

      {/* Watchlist Panel - Fixed left of main (Desktop only) */}
      {!isMobile && !isTablet && showPanels.watchlist && watchlistPanel && (
        <aside
          style={{
            position: 'fixed',
            left: layout.desktop.iconRail,
            top: layout.desktop.topBar,
            bottom: 0,
            width: layout.desktop.watchlistPanel,
            background: colors.glass.bg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRight: `1px solid ${colors.glass.border}`,
            zIndex: zIndex.content,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {watchlistPanel}
        </aside>
      )}

      {/* AI Panel - Fixed right (Desktop only) */}
      {!isMobile && !isTablet && showPanels.ai && aiPanel && (
        <aside
          style={{
            position: 'fixed',
            right: 0,
            top: layout.desktop.topBar,
            bottom: 0,
            width: layout.desktop.aiPanel,
            background: colors.glass.bg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderLeft: `1px solid ${colors.glass.border}`,
            zIndex: zIndex.content,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {aiPanel}
        </aside>
      )}

      {/* Main Content Area - Margins account for fixed panels */}
      <main
        style={{
          position: 'relative',
          minHeight: '100vh',
          marginLeft: contentMargins.marginLeft,
          marginRight: contentMargins.marginRight,
          paddingTop: contentMargins.paddingTop,
          paddingBottom: contentMargins.paddingBottom,
          zIndex: zIndex.content,
          transition: `margin ${animation.duration.normal}ms ${animation.easing.smooth}`,
        }}
      >
        {children}
      </main>

      {/* Bottom Navigation - Fixed bottom (Mobile only) */}
      {isMobile && bottomNav && (
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: zIndex.nav,
            background: colors.glass.bgHeavy,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: `1px solid ${colors.glass.border}`,
          }}
        >
          {bottomNav}
        </nav>
      )}
    </div>
  )
}
