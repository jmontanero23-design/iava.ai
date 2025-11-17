/**
 * Risk Controls Panel - PhD++ Professional Risk Management
 *
 * Provides comprehensive risk management controls including:
 * - Position sizing configuration
 * - Exposure limits
 * - Daily loss limits
 * - Cooldown mechanisms
 * - Real-time risk metrics
 */

import { useState, useEffect } from 'react'
import InfoPopover from './InfoPopover.jsx'
import {
  getRiskConfig,
  saveRiskConfig,
  resetRiskConfig,
  getDailyStats,
  clearDailyStats
} from '../utils/riskControls.js'

export default function RiskControlsPanel() {
  const [config, setConfig] = useState(getRiskConfig())
  const [dailyStats, setDailyStats] = useState(getDailyStats())
  const [account, setAccount] = useState(null)
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  // Load account and positions
  const loadAccountData = async () => {
    try {
      setLoading(true)
      const [accountRes, positionsRes] = await Promise.all([
        fetch('/api/alpaca/account'),
        fetch('/api/alpaca/positions')
      ])

      if (accountRes.ok) {
        const accountData = await accountRes.json()
        setAccount(accountData)
      }

      if (positionsRes.ok) {
        const positionsData = await positionsRes.json()
        setPositions(Array.isArray(positionsData) ? positionsData : [])
      }
    } catch (e) {
      console.error('[Risk Controls] Failed to load account data:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccountData()
    const interval = setInterval(loadAccountData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  // Refresh daily stats every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      setDailyStats(getDailyStats())
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleSave = () => {
    const saved = saveRiskConfig(config)
    if (saved) {
      setSaveStatus('✅ Saved')
      setTimeout(() => setSaveStatus(''), 2000)
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Risk controls updated', type: 'success', ttl: 3000 }
      }))
    } else {
      setSaveStatus('❌ Error')
      setTimeout(() => setSaveStatus(''), 2000)
    }
  }

  const handleReset = () => {
    if (window.confirm('Reset all risk controls to default settings?')) {
      const defaults = resetRiskConfig()
      if (defaults) {
        setConfig(defaults)
        window.dispatchEvent(new CustomEvent('iava.toast', {
          detail: { text: 'Risk controls reset to defaults', type: 'info', ttl: 3000 }
        }))
      }
    }
  }

  const handleClearDailyStats = () => {
    if (window.confirm('Clear today\'s trading statistics?')) {
      const cleared = clearDailyStats()
      if (cleared) {
        setDailyStats(cleared)
        window.dispatchEvent(new CustomEvent('iava.toast', {
          detail: { text: 'Daily stats cleared', type: 'info', ttl: 3000 }
        }))
      }
    }
  }

  // Calculate current metrics
  const equity = parseFloat(account?.equity || account?.portfolio_value || 100000)
  const currentExposure = positions.reduce((sum, p) => {
    return sum + Math.abs(parseFloat(p.market_value || 0))
  }, 0)
  const exposurePct = (currentExposure / equity) * 100

  // Estimate current risk (conservative: 0.5% per position)
  const estimatedRisk = positions.reduce((sum, p) => {
    return sum + (Math.abs(parseFloat(p.market_value || 0)) * 0.005)
  }, 0)
  const riskPct = (estimatedRisk / equity) * 100

  // Daily stats
  const tradesRemaining = Math.max(0, config.dailyMaxTrades - dailyStats.tradesCount)
  const lossLimitRemaining = config.dailyLossLimitPct + dailyStats.realizedPnLPct

  return (
    <div className="card overflow-hidden">
      {/* Premium Header */}
      <div className="panel-header">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 blur-2xl animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />

        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="panel-icon" style={{ fontSize: 'var(--text-2xl)' }}>🛡️</span>
              <h3 className="font-bold bg-gradient-to-r from-rose-200 to-amber-300 bg-clip-text text-transparent inline-flex items-center gap-2" style={{ fontSize: 'var(--text-lg)' }}>
                Risk Controls
                <InfoPopover title="Risk Controls">
                  Professional risk management system with:
                  {'\n• '}Position sizing based on account equity & ATR
                  {'\n• '}Daily loss limits and trade count limits
                  {'\n• '}Exposure caps and concurrent risk limits
                  {'\n• '}Cooldown mechanisms after losses
                  {'\n• '}Trading hours enforcement
                  {'\n\n'}All trades are validated against these rules before execution.
                </InfoPopover>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {loading && <div className="spinner-sm" />}
              <button onClick={loadAccountData} className="btn-ghost btn-xs" title="Refresh account data">
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Emergency Halt Toggle */}
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-rose-600/20 to-orange-600/20 border border-rose-500/30 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer flex-1">
              <input
                type="checkbox"
                className="toggle toggle-error"
                checked={config.haltTrading}
                onChange={e => setConfig({ ...config, haltTrading: e.target.checked })}
              />
              <div>
                <div className="text-sm font-bold text-rose-300">Emergency Trading Halt</div>
                <div className="text-xs text-slate-400">
                  {config.haltTrading ? '🚨 All trading STOPPED' : '✅ Trading enabled'}
                </div>
              </div>
            </label>
            <InfoPopover title="Emergency Halt">
              Master switch to immediately stop all automated trading.
              {'\n\n'}Use this during extreme market conditions, technical issues, or when you need to step away.
            </InfoPopover>
          </div>
        </div>
      </div>

      {/* Real-time Metrics Dashboard */}
      <div className="p-5 space-y-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Real-Time Metrics</h4>
          <InfoPopover title="Live Risk Metrics">Current exposure and risk calculated from your active positions</InfoPopover>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Account Equity */}
          <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">Account Equity</div>
            <div className="text-lg font-bold text-emerald-400">${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>

          {/* Open Positions */}
          <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">Open Positions</div>
            <div className="text-lg font-bold text-cyan-400">
              {positions.length} / {config.maxConcurrentPositions}
            </div>
            {positions.length >= config.maxConcurrentPositions && (
              <div className="text-xs text-rose-400 mt-1">⚠️ Limit reached</div>
            )}
          </div>

          {/* Total Exposure */}
          <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">Total Exposure</div>
            <div className="text-lg font-bold text-purple-400">{exposurePct.toFixed(1)}%</div>
            {exposurePct > config.maxTotalExposurePct && (
              <div className="text-xs text-rose-400 mt-1">⚠️ Over limit</div>
            )}
          </div>

          {/* At-Risk Capital */}
          <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">Estimated Risk</div>
            <div className="text-lg font-bold text-amber-400">{riskPct.toFixed(2)}%</div>
            {riskPct > config.maxConcurrentRiskPct && (
              <div className="text-xs text-rose-400 mt-1">⚠️ Over limit</div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Statistics */}
      <div className="p-5 space-y-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Today's Performance</h4>
          <button onClick={handleClearDailyStats} className="btn-ghost btn-xs">Clear Stats</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Trades Count */}
          <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">Trades Today</div>
            <div className="text-lg font-bold text-slate-200">
              {dailyStats.tradesCount} / {config.dailyMaxTrades}
            </div>
            {tradesRemaining === 0 && (
              <div className="text-xs text-rose-400 mt-1">⚠️ Limit reached</div>
            )}
          </div>

          {/* Daily P&L */}
          <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">Daily P&L</div>
            <div className={`text-lg font-bold ${dailyStats.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {dailyStats.realizedPnL >= 0 ? '+' : ''}{dailyStats.realizedPnLPct.toFixed(2)}%
            </div>
          </div>

          {/* Win Rate */}
          <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">Win Rate</div>
            <div className="text-lg font-bold text-indigo-400">
              {dailyStats.tradesCount > 0 ? ((dailyStats.wins / dailyStats.tradesCount) * 100).toFixed(0) : 0}%
            </div>
            <div className="text-xs text-slate-500">{dailyStats.wins}W / {dailyStats.losses}L</div>
          </div>

          {/* Loss Limit Buffer */}
          <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">Loss Buffer</div>
            <div className={`text-lg font-bold ${lossLimitRemaining <= 0.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {lossLimitRemaining.toFixed(2)}%
            </div>
            {lossLimitRemaining <= 0 && (
              <div className="text-xs text-rose-400 mt-1">🚨 Halted</div>
            )}
          </div>

          {/* Trades Remaining */}
          <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">Trades Left</div>
            <div className="text-lg font-bold text-cyan-400">{tradesRemaining}</div>
          </div>
        </div>
      </div>

      {/* Configuration Sections */}
      <div className="p-5 space-y-6">
        {/* Position Sizing */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            Position Sizing
            <InfoPopover title="Position Sizing">
              Controls how many shares/contracts to trade based on risk parameters.
              {'\n\n'}Formula: qty = (risk% × equity) / |entry – stop|
            </InfoPopover>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-slate-400">Per-Trade Risk %</span>
              <input
                type="number"
                min={config.minRiskPct}
                max={config.maxRiskPct}
                step="0.1"
                value={config.perTradeRiskPct}
                onChange={e => setConfig({ ...config, perTradeRiskPct: parseFloat(e.target.value) })}
                className="input w-full"
              />
              <span className="text-xs text-slate-500">Default: 0.5%</span>
            </label>

            <label className="space-y-1">
              <span className="text-xs text-slate-400">Max Position Size %</span>
              <input
                type="number"
                min="1"
                max="50"
                step="1"
                value={config.maxPositionSizePct}
                onChange={e => setConfig({ ...config, maxPositionSizePct: parseFloat(e.target.value) })}
                className="input w-full"
              />
              <span className="text-xs text-slate-500">Max % of account per position</span>
            </label>

            <label className="space-y-1">
              <span className="text-xs text-slate-400">Min Position Value $</span>
              <input
                type="number"
                min="0"
                step="10"
                value={config.minPositionSizeDollars}
                onChange={e => setConfig({ ...config, minPositionSizeDollars: parseFloat(e.target.value) })}
                className="input w-full"
              />
              <span className="text-xs text-slate-500">Minimum dollar amount</span>
            </label>
          </div>
        </div>

        {/* Daily Limits */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            Daily Limits
            <InfoPopover title="Daily Limits">
              Automatic safeguards to prevent excessive trading and losses.
              {'\n\n'}Trading halts automatically when limits are reached.
            </InfoPopover>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-slate-400">Daily Loss Limit %</span>
              <input
                type="number"
                min="1"
                max="10"
                step="0.5"
                value={config.dailyLossLimitPct}
                onChange={e => setConfig({ ...config, dailyLossLimitPct: parseFloat(e.target.value) })}
                className="input w-full"
              />
              <span className="text-xs text-slate-500">Stop trading if down X%</span>
            </label>

            <label className="space-y-1">
              <span className="text-xs text-slate-400">Max Trades Per Day</span>
              <input
                type="number"
                min="1"
                max="50"
                step="1"
                value={config.dailyMaxTrades}
                onChange={e => setConfig({ ...config, dailyMaxTrades: parseInt(e.target.value, 10) })}
                className="input w-full"
              />
              <span className="text-xs text-slate-500">Maximum number of trades</span>
            </label>
          </div>
        </div>

        {/* Exposure Management */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            Exposure Management
            <InfoPopover title="Exposure Management">
              Controls maximum capital deployment and risk exposure.
              {'\n\n'}Prevents overconcentration in positions.
            </InfoPopover>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-slate-400">Max Concurrent Positions</span>
              <input
                type="number"
                min="1"
                max="20"
                step="1"
                value={config.maxConcurrentPositions}
                onChange={e => setConfig({ ...config, maxConcurrentPositions: parseInt(e.target.value, 10) })}
                className="input w-full"
              />
              <span className="text-xs text-slate-500">Max open positions</span>
            </label>

            <label className="space-y-1">
              <span className="text-xs text-slate-400">Max Total Exposure %</span>
              <input
                type="number"
                min="10"
                max="100"
                step="5"
                value={config.maxTotalExposurePct}
                onChange={e => setConfig({ ...config, maxTotalExposurePct: parseFloat(e.target.value) })}
                className="input w-full"
              />
              <span className="text-xs text-slate-500">Max % of account deployed</span>
            </label>

            <label className="space-y-1">
              <span className="text-xs text-slate-400">Max Concurrent Risk %</span>
              <input
                type="number"
                min="0.5"
                max="10"
                step="0.5"
                value={config.maxConcurrentRiskPct}
                onChange={e => setConfig({ ...config, maxConcurrentRiskPct: parseFloat(e.target.value) })}
                className="input w-full"
              />
              <span className="text-xs text-slate-500">Max total at-risk capital</span>
            </label>
          </div>
        </div>

        {/* Cooldown Mechanisms */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            Cooldown Periods
            <InfoPopover title="Cooldowns">
              Enforces waiting periods between trades to prevent impulsive decisions.
              {'\n\n'}Particularly important after losses to avoid revenge trading.
            </InfoPopover>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-slate-400">Cooldown After Loss (seconds)</span>
              <input
                type="number"
                min="0"
                max="3600"
                step="60"
                value={config.cooldownAfterLossSec}
                onChange={e => setConfig({ ...config, cooldownAfterLossSec: parseInt(e.target.value, 10) })}
                className="input w-full"
              />
              <span className="text-xs text-slate-500">Wait time after losing trade</span>
            </label>

            <label className="space-y-1">
              <span className="text-xs text-slate-400">Min Time Between Trades (seconds)</span>
              <input
                type="number"
                min="0"
                max="600"
                step="30"
                value={config.minTimeBetweenTradesSec}
                onChange={e => setConfig({ ...config, minTimeBetweenTradesSec: parseInt(e.target.value, 10) })}
                className="input w-full"
              />
              <span className="text-xs text-slate-500">Minimum interval between any trades</span>
            </label>
          </div>
        </div>

        {/* Trading Hours */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            Trading Hours
            <InfoPopover title="Trading Hours">
              Controls when automated trading is allowed.
              {'\n\n'}Regular hours: 9:30 AM - 4:00 PM ET
            </InfoPopover>
          </h4>

          <div className="flex items-center gap-4 flex-wrap">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="checkbox"
                checked={config.allowPreMarket}
                onChange={e => setConfig({ ...config, allowPreMarket: e.target.checked })}
              />
              <span className="text-sm text-slate-300">Allow Pre-Market</span>
            </label>

            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="checkbox"
                checked={config.allowAfterHours}
                onChange={e => setConfig({ ...config, allowAfterHours: e.target.checked })}
              />
              <span className="text-sm text-slate-300">Allow After-Hours</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-700/50">
          <button onClick={handleSave} className="btn-primary">
            💾 Save Changes {saveStatus}
          </button>
          <button onClick={handleReset} className="btn-secondary">
            🔄 Reset to Defaults
          </button>
          <div className="ml-auto text-xs text-slate-500">
            Changes take effect immediately
          </div>
        </div>
      </div>
    </div>
  )
}
