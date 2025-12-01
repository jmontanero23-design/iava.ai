/**
 * LEGENDARY Mobile Trade View
 *
 * Mobile-optimized trade view with symbol header
 * Based on: iAVA-ULTIMATE-LEGENDARY-MOBILE.html (Trade Tab section)
 */

import { useState, useEffect } from 'react'
import MobileSymbolHeader from './MobileSymbolHeader'
import ChartToolbar from './ChartToolbar'
import ChartOverlay, { ChartQuickStats, ScoreBadgeOverlay } from './ChartOverlay'
import AppChart from '../AppChart'
import { SkeletonChart, SkeletonMobileHeader } from './ui/Skeleton'
import { colors, spacing, animation, radius } from '../styles/tokens'

export default function MobileTradeView({
  symbol = 'SPY',
  onSymbolClick,
  onSelectSymbol,
}) {
  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTimeframe, setActiveTimeframe] = useState('15m')
  const [isChangingSymbol, setIsChangingSymbol] = useState(false)
  const [symbolData, setSymbolData] = useState({
    symbol: symbol,
    companyName: 'SPDR S&P 500 ETF',
    price: 594.82,
    change: 3.47,
    changePercent: 0.59,
    score: 87,
    high: 596.20,
    low: 591.50,
    volume: '42.3M',
  })

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // Update symbol data when symbol changes
  useEffect(() => {
    // Trigger symbol change animation
    setIsChangingSymbol(true)

    const companyNames = {
      SPY: 'SPDR S&P 500 ETF',
      QQQ: 'Invesco QQQ Trust',
      AAPL: 'Apple Inc',
      TSLA: 'Tesla Inc',
      NVDA: 'NVIDIA Corporation',
      AMD: 'Advanced Micro Devices',
      MSFT: 'Microsoft Corporation',
      GOOGL: 'Alphabet Inc',
      AMZN: 'Amazon.com Inc',
      META: 'Meta Platforms',
    }

    // Simulate data fetch delay
    const timer = setTimeout(() => {
      setSymbolData(prev => ({
        ...prev,
        symbol: symbol,
        companyName: companyNames[symbol] || symbol,
      }))
      setIsChangingSymbol(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [symbol])

  const handleTimeframeChange = (tf) => {
    setActiveTimeframe(tf)
    // Could trigger chart data reload here
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          gap: spacing[4],
          padding: spacing[4],
        }}
      >
        <SkeletonMobileHeader />
        <SkeletonChart height="calc(100vh - 300px)" />
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        margin: isMobile ? `-${spacing[4]}px` : 0,
        opacity: isChangingSymbol ? 0.7 : 1,
        transition: `opacity ${animation.duration.fast}ms`,
      }}
    >
      {/* Symbol Header - Mobile only */}
      {isMobile && (
        <div
          style={{
            padding: spacing[4],
            paddingBottom: 0,
            transform: isChangingSymbol ? 'translateY(-4px)' : 'translateY(0)',
            opacity: isChangingSymbol ? 0.5 : 1,
            transition: `all ${animation.duration.normal}ms ${animation.easing.smooth}`,
          }}
        >
          <MobileSymbolHeader
            symbol={symbolData.symbol}
            companyName={symbolData.companyName}
            price={symbolData.price}
            change={symbolData.change}
            changePercent={symbolData.changePercent}
            score={symbolData.score}
            onSymbolClick={onSymbolClick}
          />
        </div>
      )}

      {/* Chart Toolbar */}
      <div
        style={{
          padding: `${spacing[3]}px ${spacing[4]}px`,
          transform: isChangingSymbol ? 'scale(0.98)' : 'scale(1)',
          transition: `transform ${animation.duration.fast}ms`,
        }}
      >
        <ChartToolbar
          activeTimeframe={activeTimeframe}
          onTimeframeChange={handleTimeframeChange}
          onFullscreen={() => console.log('Fullscreen')}
        />
      </div>

      {/* Chart Container with Overlays */}
      <div
        style={{
          flex: 1,
          minHeight: isMobile ? 'calc(100vh - 300px)' : 'auto',
          position: 'relative',
          transform: isChangingSymbol ? 'scale(0.98)' : 'scale(1)',
          transition: `transform ${animation.duration.normal}ms ${animation.easing.spring}`,
        }}
      >
        {/* Chart */}
        <AppChart />

        {/* Overlays - Only show when not mobile (mobile has dedicated header) */}
        {!isMobile && (
          <>
            <ChartQuickStats
              symbol={symbolData.symbol}
              data={{
                price: symbolData.price,
                change: symbolData.change,
                changePercent: symbolData.changePercent,
                high: symbolData.high,
                low: symbolData.low,
                volume: symbolData.volume,
              }}
            />
            <ScoreBadgeOverlay score={symbolData.score} />
          </>
        )}
      </div>

      {/* Transition animation styles */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .trade-view-enter {
          animation: fadeSlideIn ${animation.duration.normal}ms ${animation.easing.smooth};
        }
      `}</style>
    </div>
  )
}
