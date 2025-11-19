/**
 * TradingView Chart Component - CORRECT Implementation
 *
 * Uses TradingView's official widget script method
 * Based on TradingView's documented approach: https://www.tradingview.com/widget/advanced-chart/
 */

import { useEffect, useRef, memo } from 'react'
import { useMarketData } from '../contexts/MarketDataContext'

function TradingViewChart() {
  const containerRef = useRef(null)
  const { marketData } = useMarketData()
  const symbol = marketData?.symbol || 'AAPL'
  const timeframe = marketData?.timeframe || '1Min'

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Clear any existing content
    container.innerHTML = ''

    // Create the widget container div that TradingView expects
    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    widgetDiv.style.height = '100%'
    widgetDiv.style.width = '100%'

    // Create the script element with configuration
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true

    // CRITICAL: This is the CORRECT way to pass config to TradingView
    // The script reads this JSON when it loads
    const config = {
      autosize: true,
      symbol: formatSymbolForTradingView(symbol),
      interval: mapTimeframeToTradingView(timeframe),
      timezone: 'America/New_York',
      theme: 'dark',
      style: '1', // Candlestick
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: true,
      save_image: false,
      // Technical indicators
      studies: [
        'MAExp@tv-basicstudies',
        'IchimokuCloud@tv-basicstudies',
        'VWAP@tv-basicstudies'
      ],
      // UI
      show_popup_button: true,
      popup_width: '1000',
      popup_height: '650',
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      // Colors
      backgroundColor: 'rgba(11, 16, 32, 1)',
      gridColor: 'rgba(71, 85, 105, 0.1)',
      // Features
      withdateranges: true,
      range: '1D',
      details: true,
      hotlist: false,
      calendar: false,
      support_host: 'https://www.tradingview.com'
    }

    script.textContent = JSON.stringify(config)

    // Append both to container
    container.appendChild(widgetDiv)
    widgetDiv.appendChild(script)

    console.log('[TradingView] Widget initialized:', { symbol, timeframe })

    // Cleanup
    return () => {
      if (container) {
        container.innerHTML = ''
      }
    }
  }, [symbol, timeframe])

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '600px',
        position: 'relative'
      }}
    >
      {/* TradingView widget loads here */}
      <div className="tradingview-widget-copyright" style={{ fontSize: '11px', color: '#64748b', paddingTop: '4px' }}>
        <a
          href={`https://www.tradingview.com/symbols/${formatSymbolForTradingView(symbol)}/`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span>TradingView Chart</span>
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
  if (symbol.includes(':')) return symbol

  const exchangeMap = {
    'SPY': 'AMEX:SPY',
    'QQQ': 'NASDAQ:QQQ',
    'IWM': 'AMEX:IWM',
    'DIA': 'AMEX:DIA',
    'VXX': 'BATS:VXX',
    'UVXY': 'BATS:UVXY',
    'TQQQ': 'NASDAQ:TQQQ',
    'SQQQ': 'NASDAQ:SQQQ',
  }

  if (exchangeMap[symbol]) return exchangeMap[symbol]

  const cryptoSymbols = ['BTC', 'ETH', 'BTCUSD', 'ETHUSD']
  if (cryptoSymbols.some(c => symbol.includes(c))) {
    return `BINANCE:${symbol}USD`
  }

  return `NASDAQ:${symbol}`
}

/**
 * Map timeframe to TradingView interval
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

export default memo(TradingViewChart)
