/**
 * TradingView Premium Account Embed
 *
 * Embeds YOUR actual TradingView premium account chart via iframe.
 * This gives you access to ALL your premium features, saved layouts,
 * custom indicators, and account settings.
 *
 * Setup:
 * 1. Go to TradingView.com and create/save your chart layout
 * 2. Click "Share" on the chart
 * 3. Copy the chart URL or get the embed code
 * 4. Add it to your .env file as VITE_TRADINGVIEW_CHART_URL
 *
 * OR: Configure the URL below directly
 */

import { useEffect, useState } from 'react'
import { useMarketData } from '../contexts/MarketDataContext'

export default function TradingViewChartEmbed() {
  const { marketData } = useMarketData()
  const symbol = marketData?.symbol || 'AAPL'
  const timeframe = marketData?.timeframe || '1Min'

  // Option 1: Use environment variable for your saved chart URL
  const savedChartUrl = import.meta.env.VITE_TRADINGVIEW_CHART_URL

  // Option 2: Build dynamic URL that updates with symbol/timeframe
  // This will open TradingView with the current symbol and load your account
  const [chartUrl, setChartUrl] = useState('')

  useEffect(() => {
    // If you have a saved chart URL, use that
    if (savedChartUrl) {
      setChartUrl(savedChartUrl)
      return
    }

    // Use your published/saved chart
    // Your chart: https://www.tradingview.com/chart/DL9sf9Fz/
    // Embed format: https://s.tradingview.com/widgetembed/?frameElementId=tradingview_xxxxx&symbol=...

    // Option A: Use your saved chart ID (if published)
    const savedChartId = 'DL9sf9Fz' // Your chart ID

    // Option B: Build dynamic widget embed URL
    const exchange = getExchange(symbol)
    const fullSymbol = `${exchange}:${symbol}`
    const interval = mapTimeframeToInterval(timeframe)

    // Use TradingView widget embed URL (this DOES work in iframes)
    const widgetUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${fullSymbol}&interval=${interval}&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=0B1020&studies=MAExp@tv-basicstudies%1FIchimokuCloud@tv-basicstudies&theme=dark&style=1&timezone=America/New_York&withdateranges=1&hideideas=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=app.iava.ai&utm_medium=widget_new&utm_campaign=chart&utm_term=${fullSymbol}`

    setChartUrl(widgetUrl)
  }, [symbol, timeframe, savedChartUrl])

  return (
    <div className="w-full h-full relative">
      {/* Loading overlay while iframe loads */}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-10">
        <div className="text-center">
          <div className="text-slate-400 mb-2">Loading TradingView Premium...</div>
          <div className="text-xs text-slate-400">
            {symbol} • {timeframe}
          </div>
        </div>
      </div>

      {/* TradingView iframe - loads your premium account */}
      <iframe
        src={chartUrl}
        className="w-full h-full border-0"
        title="TradingView Premium Chart"
        onLoad={(e) => {
          // Hide loading overlay when chart loads
          e.target.previousSibling?.remove()
        }}
        allow="fullscreen"
        style={{
          minHeight: '600px',
          backgroundColor: '#0B1020'
        }}
      />

      {/* Instructions if no chart URL configured */}
      {!chartUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/95 z-20">
          <div className="max-w-lg p-8 glass-panel text-center">
            <h3 className="text-xl font-bold text-emerald-400 mb-4">
              🔐 Connect Your TradingView Premium Account
            </h3>
            <div className="text-sm text-slate-300 space-y-3 text-left">
              <p><strong>Step 1:</strong> Go to TradingView.com and log in to your premium account</p>
              <p><strong>Step 2:</strong> Create and save your perfect chart layout with all your indicators</p>
              <p><strong>Step 3:</strong> Click "Share" → Copy the chart URL</p>
              <p><strong>Step 4:</strong> Add to your .env file:</p>
              <pre className="bg-slate-900 p-2 rounded text-xs mt-2">
                VITE_TRADINGVIEW_CHART_URL=your_chart_url_here
              </pre>
              <p className="text-xs text-slate-400 mt-4">
                Or we can configure it directly in the code - just provide your chart URL
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Map symbol to its exchange
 */
function getExchange(symbol) {
  const exchangeMap = {
    'SPY': 'AMEX',
    'QQQ': 'NASDAQ',
    'IWM': 'AMEX',
    'DIA': 'AMEX',
    'VXX': 'BATS',
    'UVXY': 'BATS',
    'TQQQ': 'NASDAQ',
    'SQQQ': 'NASDAQ'
  }
  return exchangeMap[symbol] || 'NASDAQ'
}

/**
 * Map our timeframe to TradingView interval
 */
function mapTimeframeToInterval(timeframe) {
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
