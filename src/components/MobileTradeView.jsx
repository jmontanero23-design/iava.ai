/**
 * LEGENDARY Mobile Trade View
 *
 * Mobile-optimized trade view with symbol header
 * Based on: iAVA-ULTIMATE-LEGENDARY-MOBILE.html (Trade Tab section)
 */

import { useState, useEffect } from 'react'
import MobileSymbolHeader from './MobileSymbolHeader'
import ChartToolbar from './ChartToolbar'
import AppChart from '../AppChart'
import { colors, spacing } from '../styles/tokens'

export default function MobileTradeView({
  symbol = 'SPY',
  onSymbolClick,
  onSelectSymbol,
}) {
  const [isMobile, setIsMobile] = useState(false)
  const [symbolData, setSymbolData] = useState({
    symbol: symbol,
    companyName: 'SPDR S&P 500 ETF',
    price: 594.82,
    change: 3.47,
    changePercent: 0.59,
    score: 87,
  })

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Update symbol data when symbol changes
  useEffect(() => {
    // In production, this would fetch real data
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

    setSymbolData(prev => ({
      ...prev,
      symbol: symbol,
      companyName: companyNames[symbol] || symbol,
    }))
  }, [symbol])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        margin: isMobile ? `-${spacing[4]}px` : 0, // Offset parent padding on mobile
      }}
    >
      {/* Symbol Header - Mobile only */}
      {isMobile && (
        <div style={{ padding: spacing[4], paddingBottom: 0 }}>
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
      <div style={{ padding: `${spacing[3]}px ${spacing[4]}px` }}>
        <ChartToolbar
          activeTimeframe="15m"
          onTimeframeChange={(tf) => console.log('Timeframe:', tf)}
          onFullscreen={() => console.log('Fullscreen')}
        />
      </div>

      {/* Chart */}
      <div
        style={{
          flex: 1,
          minHeight: isMobile ? 'calc(100vh - 300px)' : 'auto',
        }}
      >
        <AppChart />
      </div>
    </div>
  )
}
