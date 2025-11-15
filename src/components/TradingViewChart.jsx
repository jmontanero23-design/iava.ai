/**
 * TradingView Advanced Chart Component
 *
 * Professional-grade charting using TradingView's free widget.
 * Leverages user's TradingView Premium subscription for real-time data.
 *
 * Features:
 * - Real-time price data (no API limits)
 * - Professional candlestick charts
 * - Drawing tools and indicators
 * - Multiple timeframes
 * - Dark theme matching iAVA design
 */

import { useEffect, useRef, memo } from 'react'
import { useMarketData } from '../contexts/MarketDataContext'

function TradingViewChart() {
  const container = useRef()
  const { marketData } = useMarketData()
  const symbol = marketData?.symbol || 'AAPL'
  const timeframe = marketData?.timeframe || '1Min'

  useEffect(() => {
    // Clear previous widget
    if (container.current) {
      container.current.innerHTML = ''
    }

    // Create TradingView widget script
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true

    // Widget configuration
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: formatSymbolForTradingView(symbol),
      interval: mapTimeframeToTradingView(timeframe),
      timezone: 'America/New_York',
      theme: 'dark',
      style: '1', // Candlestick
      locale: 'en',

      // Toolbar settings
      enable_publishing: false,
      allow_symbol_change: true,
      save_image: false,

      // Studies (indicators)
      studies: [
        'MAExp@tv-basicstudies', // EMA - shows 8/21 cloud
        'IchimokuCloud@tv-basicstudies', // Ichimoku
        'VWAP@tv-basicstudies' // VWAP
      ],

      // UI customization
      show_popup_button: true,
      popup_width: '1000',
      popup_height: '650',

      // Hide TradingView branding (allowed for free widgets)
      hide_side_toolbar: false,
      hide_top_toolbar: false,

      // Colors matching iAVA dark theme
      backgroundColor: 'rgba(11, 16, 32, 1)', // bg-slate-950
      gridColor: 'rgba(71, 85, 105, 0.1)', // slate-500 with opacity

      // Volume
      volume: true,

      // Range
      range: '1D', // Default to 1 day of data

      // Enable features
      withdateranges: true,
      details: true,
      hotlist: false,
      calendar: false,

      // Support for crypto if needed
      support_host: 'https://www.tradingview.com'
    })

    container.current.appendChild(script)

    console.log('[TradingView] Widget loaded:', { symbol, timeframe })

    // Cleanup on unmount
    return () => {
      if (container.current) {
        container.current.innerHTML = ''
      }
    }
  }, [symbol, timeframe])

  return (
    <div
      className="tradingview-widget-container w-full h-full"
      ref={container}
      style={{ height: '100%', width: '100%' }}
    >
      <div className="tradingview-widget-container__widget" style={{ height: 'calc(100% - 32px)', width: '100%' }}></div>
      <div className="tradingview-widget-copyright">
        <a href={`https://www.tradingview.com/symbols/${formatSymbolForTradingView(symbol)}/`} rel="noopener noreferrer" target="_blank">
          <span className="text-xs text-slate-500">TradingView Chart</span>
        </a>
      </div>
    </div>
  )
}

/**
 * Format symbol for TradingView (e.g., "AAPL" → "NASDAQ:AAPL")
 */
function formatSymbolForTradingView(symbol) {
  if (!symbol) return 'NASDAQ:AAPL'

  // If already has exchange prefix, return as-is
  if (symbol.includes(':')) return symbol

  // Map common symbols to their exchanges
  const exchangeMap = {
    'SPY': 'AMEX:SPY',
    'QQQ': 'NASDAQ:QQQ',
    'IWM': 'AMEX:IWM',
    'DIA': 'AMEX:DIA',
    'VXX': 'BATS:VXX',
    'UVXY': 'BATS:UVXY',
    'TQQQ': 'NASDAQ:TQQQ',
    'SQQQ': 'NASDAQ:SQQQ'
  }

  // Check if symbol is in our exchange map
  if (exchangeMap[symbol]) {
    return exchangeMap[symbol]
  }

  // For crypto, use proper crypto exchange
  const cryptoSymbols = ['BTC', 'ETH', 'BTCUSD', 'ETHUSD']
  if (cryptoSymbols.some(c => symbol.includes(c))) {
    return `BINANCE:${symbol}USD`
  }

  // Default to NASDAQ for most stocks
  return `NASDAQ:${symbol}`
}

/**
 * Map our timeframe format to TradingView's interval format
 */
function mapTimeframeToTradingView(timeframe) {
  const map = {
    '1Min': '1',
    '5Min': '5',
    '15Min': '15',
    '30Min': '30',
    '1Hour': '60',
    '4Hour': '240',
    '1Day': 'D',
    'D': 'D',
    '1W': 'W',
    'W': 'W',
    '1M': 'M',
    'M': 'M'
  }

  return map[timeframe] || '1'
}

// Memoize to prevent unnecessary re-renders
export default memo(TradingViewChart)
