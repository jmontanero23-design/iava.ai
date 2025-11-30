/**
 * PortfolioHealthScore - Elite Portfolio Health Dashboard
 * 
 * NEW FILE - Add to src/components/
 * 
 * Features:
 * - Overall health score (0-100) with animated ring
 * - Risk breakdown (concentration, correlation, volatility)
 * - Personality alignment scoring
 * - Sector allocation visualization
 * - Actionable alerts and recommendations
 * 
 * COMPETITIVE MOAT: No competitor shows if your portfolio matches WHO YOU ARE
 */

import React, { useState, useEffect, useMemo } from 'react'
import { determineArchetype, TRADING_ARCHETYPES } from '../services/avaMindPersonality.js'

// Risk level configurations
const RISK_LEVELS = {
  low: { label: 'Low', color: '#10B981', bg: 'bg-emerald-500' },
  medium: { label: 'Medium', color: '#F59E0B', bg: 'bg-amber-500' },
  high: { label: 'High', color: '#EF4444', bg: 'bg-red-500' }
}

// Sector colors
const SECTOR_COLORS = {
  'Technology': '#8B5CF6',
  'Healthcare': '#10B981',
  'Financials': '#3B82F6',
  'Consumer': '#F59E0B',
  'Energy': '#EF4444',
  'Industrials': '#6B7280',
  'Materials': '#14B8A6',
  'Utilities': '#EC4899',
  'Real Estate': '#F97316',
  'Communications': '#06B6D4',
  'Other': '#64748B'
}

export default function PortfolioHealthScore({ 
  positions = [], 
  accountInfo = null,
  className = '' 
}) {
  const [personality, setPersonality] = useState(null)
  const [archetype, setArchetype] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  
  // Load personality on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ava.mind.personality')
      if (saved) {
        const p = JSON.parse(saved)
        setPersonality(p)
        setArchetype(determineArchetype(p))
      }
    } catch (e) {
      console.error('Error loading personality:', e)
    }
  }, [])
  
  // Calculate all metrics
  const metrics = useMemo(() => {
    if (!positions || positions.length === 0) {
      return {
        healthScore: 0,
        concentration: { score: 0, level: 'low', topHolding: null, topPercent: 0 },
        correlation: { score: 0, level: 'low' },
        volatility: { score: 0, level: 'low', avgBeta: 1 },
        sectors: [],
        personalityAlignment: { score: 0, insights: [] },
        alerts: []
      }
    }
    
    const totalValue = positions.reduce((sum, p) => sum + parseFloat(p.market_value || 0), 0)
    
    // Calculate sector allocation
    const sectorMap = {}
    positions.forEach(pos => {
      // Simple sector detection (in real app, use proper sector data)
      const sector = detectSector(pos.symbol)
      if (!sectorMap[sector]) {
        sectorMap[sector] = { value: 0, positions: [] }
      }
      sectorMap[sector].value += parseFloat(pos.market_value || 0)
      sectorMap[sector].positions.push(pos.symbol)
    })
    
    const sectors = Object.entries(sectorMap)
      .map(([name, data]) => ({
        name,
        value: data.value,
        percent: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
        positions: data.positions,
        color: SECTOR_COLORS[name] || SECTOR_COLORS['Other']
      }))
      .sort((a, b) => b.percent - a.percent)
    
    // CONCENTRATION RISK
    const topHolding = positions.reduce((max, p) => 
      parseFloat(p.market_value || 0) > parseFloat(max?.market_value || 0) ? p : max
    , positions[0])
    const topPercent = totalValue > 0 ? (parseFloat(topHolding?.market_value || 0) / totalValue) * 100 : 0
    const topSectorPercent = sectors[0]?.percent || 0
    
    let concentrationLevel = 'low'
    let concentrationScore = 100
    if (topPercent > 30 || topSectorPercent > 50) {
      concentrationLevel = 'high'
      concentrationScore = 30
    } else if (topPercent > 20 || topSectorPercent > 35) {
      concentrationLevel = 'medium'
      concentrationScore = 60
    }
    
    // VOLATILITY RISK (using beta as proxy)
    const avgBeta = positions.reduce((sum, p) => {
      // Simplified beta estimation
      const beta = estimateBeta(p.symbol)
      return sum + beta
    }, 0) / positions.length
    
    let volatilityLevel = 'low'
    let volatilityScore = 100
    if (avgBeta > 1.5) {
      volatilityLevel = 'high'
      volatilityScore = 40
    } else if (avgBeta > 1.2) {
      volatilityLevel = 'medium'
      volatilityScore = 70
    }
    
    // CORRELATION RISK (simplified - count unique sectors)
    const uniqueSectors = sectors.length
    let correlationLevel = 'low'
    let correlationScore = 100
    if (uniqueSectors < 2) {
      correlationLevel = 'high'
      correlationScore = 30
    } else if (uniqueSectors < 4) {
      correlationLevel = 'medium'
      correlationScore = 60
    }
    
    // PERSONALITY ALIGNMENT
    const alignmentInsights = []
    let alignmentScore = 70 // Base score
    
    if (personality) {
      // Risk tolerance alignment
      const portfolioRisk = (100 - concentrationScore + 100 - volatilityScore) / 2
      const riskDiff = Math.abs(portfolioRisk - (100 - personality.riskTolerance))
      
      if (riskDiff < 15) {
        alignmentInsights.push({
          trait: 'Risk Tolerance',
          alignment: 'high',
          icon: '✅',
          note: `Your ${personality.riskTolerance > 60 ? 'aggressive' : 'conservative'} risk profile matches this portfolio`
        })
        alignmentScore += 10
      } else if (riskDiff > 30) {
        alignmentInsights.push({
          trait: 'Risk Tolerance',
          alignment: 'low',
          icon: '⚠️',
          note: personality.riskTolerance < 40 
            ? 'Portfolio is riskier than your conservative profile suggests'
            : 'Portfolio is more conservative than your risk appetite'
        })
        alignmentScore -= 15
      } else {
        alignmentInsights.push({
          trait: 'Risk Tolerance',
          alignment: 'medium',
          icon: '📊',
          note: 'Risk level is acceptable for your profile'
        })
      }
      
      // Concentration alignment
      if (personality.analyticalDepth > 70 && concentrationLevel !== 'low') {
        alignmentInsights.push({
          trait: 'Diversification',
          alignment: 'low',
          icon: '⚠️',
          note: 'Your analytical nature prefers diversification, but portfolio is concentrated'
        })
        alignmentScore -= 10
      } else if (personality.confidenceLevel > 70 && topPercent > 15) {
        alignmentInsights.push({
          trait: 'Conviction',
          alignment: 'high',
          icon: '✅',
          note: 'High-conviction positions match your confident trading style'
        })
        alignmentScore += 5
      }
      
      // Time horizon alignment
      const hasVolatilePositions = avgBeta > 1.3
      if (personality.timeHorizon > 70 && hasVolatilePositions) {
        alignmentInsights.push({
          trait: 'Time Horizon',
          alignment: 'medium',
          icon: '📊',
          note: 'Long-term horizon can absorb short-term volatility'
        })
      } else if (personality.timeHorizon < 40 && hasVolatilePositions) {
        alignmentInsights.push({
          trait: 'Time Horizon',
          alignment: 'high',
          icon: '✅',
          note: 'Volatile positions suit your short-term trading style'
        })
        alignmentScore += 5
      }
    }
    
    alignmentScore = Math.max(0, Math.min(100, alignmentScore))
    
    // OVERALL HEALTH SCORE
    const healthScore = Math.round(
      (concentrationScore * 0.25) +
      (volatilityScore * 0.25) +
      (correlationScore * 0.25) +
      (alignmentScore * 0.25)
    )
    
    // GENERATE ALERTS
    const alerts = []
    
    if (concentrationLevel === 'high') {
      alerts.push({
        type: 'warning',
        icon: '⚠️',
        title: 'High Concentration Risk',
        message: `${topHolding?.symbol} is ${topPercent.toFixed(0)}% of portfolio. Consider diversifying.`,
        action: 'Review Position'
      })
    }
    
    if (topSectorPercent > 50) {
      alerts.push({
        type: 'warning',
        icon: '🏭',
        title: 'Sector Concentration',
        message: `${sectors[0]?.name} sector is ${topSectorPercent.toFixed(0)}% of portfolio.`,
        action: 'Sector Analysis'
      })
    }
    
    if (avgBeta > 1.5) {
      alerts.push({
        type: 'info',
        icon: '📊',
        title: 'High Beta Portfolio',
        message: `Average beta of ${avgBeta.toFixed(2)} means 50%+ more volatile than market.`,
        action: 'Risk Review'
      })
    }
    
    if (alignmentScore < 50 && personality) {
      alerts.push({
        type: 'suggestion',
        icon: '🧠',
        title: 'Personality Mismatch',
        message: 'Portfolio structure doesn\'t match your trading personality.',
        action: 'See Insights'
      })
    }
    
    if (positions.length > 0 && healthScore > 75) {
      alerts.push({
        type: 'success',
        icon: '✅',
        title: 'Healthy Portfolio',
        message: 'Good diversification and risk management!',
        action: null
      })
    }
    
    return {
      healthScore,
      concentration: {
        score: concentrationScore,
        level: concentrationLevel,
        topHolding: topHolding?.symbol,
        topPercent
      },
      correlation: {
        score: correlationScore,
        level: correlationLevel,
        uniqueSectors
      },
      volatility: {
        score: volatilityScore,
        level: volatilityLevel,
        avgBeta
      },
      sectors,
      personalityAlignment: {
        score: alignmentScore,
        insights: alignmentInsights
      },
      alerts,
      totalValue
    }
  }, [positions, personality])
  
  // Health score color
  const getScoreColor = (score) => {
    if (score >= 75) return '#10B981'
    if (score >= 50) return '#F59E0B'
    return '#EF4444'
  }
  
  const scoreColor = getScoreColor(metrics.healthScore)
  
  if (positions.length === 0) {
    return (
      <div className={`glass-panel p-6 ${className}`}>
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">📊</span>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No Positions</h3>
          <p className="text-slate-500 text-sm">Open some positions to see your portfolio health score</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`glass-panel p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🏥</span> Portfolio Health
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Risk analysis + personality alignment
          </p>
        </div>
        
        {archetype?.primary && (
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
            style={{ 
              backgroundColor: `${archetype.primary.archetype.color}20`,
              border: `1px solid ${archetype.primary.archetype.color}40`
            }}
          >
            <span>{archetype.primary.archetype.emoji}</span>
            <span style={{ color: archetype.primary.archetype.color }}>
              {archetype.primary.archetype.name}
            </span>
          </div>
        )}
      </div>
      
      {/* Main Score + Risk Meters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        {/* Health Score Ring */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-40 h-40">
            {/* Background ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="#1E293B"
                strokeWidth="12"
              />
              {/* Score ring */}
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke={scoreColor}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(metrics.healthScore / 100) * 440} 440`}
                style={{
                  filter: `drop-shadow(0 0 8px ${scoreColor}60)`,
                  transition: 'stroke-dasharray 1s ease-out'
                }}
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span 
                className="text-4xl font-bold"
                style={{ color: scoreColor }}
              >
                {metrics.healthScore}
              </span>
              <span className="text-xs text-slate-400 mt-1">HEALTH</span>
            </div>
          </div>
          
          <p className="text-sm text-slate-400 mt-3 text-center">
            {metrics.healthScore >= 75 ? '✨ Excellent portfolio health' :
             metrics.healthScore >= 50 ? '📊 Room for improvement' :
             '⚠️ Needs attention'}
          </p>
        </div>
        
        {/* Risk Meters */}
        <div className="space-y-4">
          {/* Concentration */}
          <RiskMeter
            label="Concentration Risk"
            level={metrics.concentration.level}
            detail={`Top: ${metrics.concentration.topHolding} (${metrics.concentration.topPercent.toFixed(0)}%)`}
          />
          
          {/* Volatility */}
          <RiskMeter
            label="Volatility Risk"
            level={metrics.volatility.level}
            detail={`Beta: ${metrics.volatility.avgBeta.toFixed(2)}`}
          />
          
          {/* Correlation */}
          <RiskMeter
            label="Correlation Risk"
            level={metrics.correlation.level}
            detail={`${metrics.correlation.uniqueSectors} sectors`}
          />
        </div>
      </div>
      
      {/* Sector Allocation */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <span>📊</span> Sector Allocation
        </h3>
        <div className="space-y-2">
          {metrics.sectors.slice(0, 5).map((sector, i) => (
            <div key={sector.name} className="flex items-center gap-3">
              <div className="w-24 text-xs text-slate-400 truncate">{sector.name}</div>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${sector.percent}%`,
                    backgroundColor: sector.color
                  }}
                />
              </div>
              <div className="w-12 text-xs text-right" style={{ color: sector.color }}>
                {sector.percent.toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Personality Alignment */}
      {personality && metrics.personalityAlignment.insights.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <span>🧠</span> Personality Alignment
            <span 
              className="ml-auto text-lg font-bold"
              style={{ color: getScoreColor(metrics.personalityAlignment.score) }}
            >
              {metrics.personalityAlignment.score}%
            </span>
          </h3>
          <div className="space-y-2">
            {metrics.personalityAlignment.insights.map((insight, i) => (
              <div 
                key={i}
                className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/50"
              >
                <span className="text-lg">{insight.icon}</span>
                <div>
                  <div className="text-sm text-slate-300">{insight.trait}</div>
                  <div className="text-xs text-slate-500">{insight.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Alerts */}
      {metrics.alerts.length > 0 && (
        <div className="space-y-2">
          {metrics.alerts.map((alert, i) => (
            <div 
              key={i}
              className={`p-3 rounded-lg flex items-start gap-3 ${
                alert.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' :
                alert.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                alert.type === 'suggestion' ? 'bg-violet-500/10 border border-violet-500/20' :
                'bg-slate-800/50 border border-slate-700'
              }`}
            >
              <span className="text-xl">{alert.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-200">{alert.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{alert.message}</div>
              </div>
              {alert.action && (
                <button className="text-xs text-cyan-400 hover:text-cyan-300 whitespace-nowrap">
                  {alert.action} →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Risk meter component
function RiskMeter({ label, level, detail }) {
  const config = RISK_LEVELS[level]
  const position = level === 'low' ? 0 : level === 'medium' ? 1 : 2
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-400">{label}</span>
        <span className="text-xs text-slate-500">{detail}</span>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div 
            key={i}
            className={`h-2 flex-1 rounded-full transition-all ${
              i <= position ? config.bg : 'bg-slate-800'
            }`}
            style={{
              opacity: i <= position ? 1 : 0.3
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Helper: Detect sector (simplified - in production use real data)
function detectSector(symbol) {
  const techSymbols = ['AAPL', 'MSFT', 'GOOGL', 'GOOG', 'META', 'NVDA', 'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'NOW', 'SNOW', 'NET', 'PLTR', 'TSLA']
  const healthSymbols = ['JNJ', 'UNH', 'PFE', 'MRK', 'ABBV', 'LLY', 'TMO', 'ABT', 'BMY', 'AMGN']
  const financeSymbols = ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'AXP', 'V', 'MA']
  const energySymbols = ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'OXY', 'PSX', 'MPC', 'VLO']
  const consumerSymbols = ['AMZN', 'WMT', 'HD', 'MCD', 'NKE', 'SBUX', 'TGT', 'LOW', 'COST']
  
  const upper = symbol?.toUpperCase()
  if (techSymbols.includes(upper)) return 'Technology'
  if (healthSymbols.includes(upper)) return 'Healthcare'
  if (financeSymbols.includes(upper)) return 'Financials'
  if (energySymbols.includes(upper)) return 'Energy'
  if (consumerSymbols.includes(upper)) return 'Consumer'
  return 'Other'
}

// Helper: Estimate beta (simplified - in production use real data)
function estimateBeta(symbol) {
  const highBeta = ['TSLA', 'NVDA', 'AMD', 'COIN', 'MSTR', 'ARKK', 'SOXL', 'TQQQ']
  const lowBeta = ['JNJ', 'PG', 'KO', 'WMT', 'VZ', 'T', 'XLU', 'GLD']
  
  const upper = symbol?.toUpperCase()
  if (highBeta.includes(upper)) return 1.5 + Math.random() * 0.5
  if (lowBeta.includes(upper)) return 0.5 + Math.random() * 0.3
  return 0.9 + Math.random() * 0.4
}

export { RiskMeter, RISK_LEVELS, SECTOR_COLORS }
