/**
 * AI Context Personality Bridge
 * 
 * NEW FILE - Add to src/utils/
 * 
 * Bridges the personality system with AI context generation.
 * Inject personality-aware context into your existing aiContext.js
 * 
 * USAGE:
 * In your aiContext.js, add:
 *   import { getPersonalityContext } from './aiPersonalityBridge.js'
 *   const personalityContext = getPersonalityContext()
 *   // Append to your system prompt
 */

import { 
  determineArchetype, 
  detectEmotionalState,
  generateAVAMindContext,
  TRADING_ARCHETYPES,
  EMOTIONAL_STATES 
} from '../services/avaMindPersonality.js'

/**
 * Get full personality context for AI system prompt
 * @returns {string} Personality context to append to system prompt
 */
export function getPersonalityContext() {
  try {
    const personalityStr = localStorage.getItem('ava.mind.personality')
    if (!personalityStr) return ''
    
    const personality = JSON.parse(personalityStr)
    const archetype = determineArchetype(personality)
    
    // Get recent trades for emotional state
    const tradesStr = localStorage.getItem('ava.mind.trades')
    const trades = tradesStr ? JSON.parse(tradesStr).slice(0, 5) : []
    const emotionalState = detectEmotionalState(trades)
    
    return generateAVAMindContext(personality, archetype, emotionalState)
  } catch (e) {
    console.error('[AIPersonalityBridge] Error:', e)
    return ''
  }
}

/**
 * Get personality-aware response style instructions
 * @returns {string} Style instructions for AI
 */
export function getResponseStyleFromPersonality() {
  try {
    const personalityStr = localStorage.getItem('ava.mind.personality')
    if (!personalityStr) return ''
    
    const p = JSON.parse(personalityStr)
    const archetype = determineArchetype(p)
    const a = archetype?.primary?.archetype
    
    if (!a) return ''
    
    const styles = []
    
    // Communication depth
    if (p.analyticalDepth > 70) {
      styles.push('Provide detailed technical analysis with specific indicator readings')
      styles.push('Include multiple data points to support recommendations')
      styles.push('The user appreciates thorough breakdowns')
    } else if (p.analyticalDepth < 40) {
      styles.push('Keep explanations brief and actionable')
      styles.push('Lead with the conclusion, then support')
      styles.push('User prefers bottom-line insights over lengthy analysis')
    }
    
    // Confidence level
    if (p.confidenceLevel > 70) {
      styles.push('Be direct with recommendations - user values conviction')
      styles.push('State your view clearly, then caveats')
    } else {
      styles.push('Present balanced pros/cons')
      styles.push('Acknowledge uncertainty explicitly')
    }
    
    // Risk communication
    if (p.riskTolerance > 70) {
      styles.push('User is comfortable with aggressive plays - don\'t over-warn')
      styles.push('Focus on upside potential alongside risk')
    } else if (p.riskTolerance < 40) {
      styles.push('Emphasize risk management and downside protection')
      styles.push('User prefers conservative, high-probability setups')
    }
    
    // Time horizon
    if (p.timeHorizon < 40) {
      styles.push('Focus on short-term setups and intraday levels')
      styles.push('User is a short-term trader')
    } else if (p.timeHorizon > 70) {
      styles.push('Include longer-term context and weekly/monthly levels')
      styles.push('User thinks in weeks/months, not hours')
    }
    
    // Contrarian
    if (p.contrarianScore > 70) {
      styles.push('User appreciates contrarian perspectives')
      styles.push('Point out when crowd may be wrong')
    }
    
    return `
## Response Style (Personalized for ${a.name})

${styles.map(s => `- ${s}`).join('\n')}

**Archetype-Specific Notes:**
- ${a.name}s excel at: ${a.strengths.join(', ')}
- Watch out for: ${a.weaknesses[0]}
- Ideal strategies: ${a.idealStrategies.join(', ')}
`
  } catch (e) {
    return ''
  }
}

/**
 * Get emotional state warning for AI
 * @returns {string|null} Warning if emotional state is concerning
 */
export function getEmotionalStateWarning() {
  try {
    const tradesStr = localStorage.getItem('ava.mind.trades')
    const trades = tradesStr ? JSON.parse(tradesStr).slice(0, 5) : []
    const state = detectEmotionalState(trades)
    
    if (!state?.state) return null
    
    const concerningStates = ['fearful', 'frustrated', 'greedy', 'anxious']
    if (concerningStates.includes(state.state.id) && state.intensity > 0.5) {
      return `
⚠️ **EMOTIONAL STATE ALERT**
User appears to be in a ${state.state.name} state (${Math.round(state.intensity * 100)}% intensity).
${state.state.advice}

Adjust your response to:
- Be more measured and calming
- Gently suggest caution if they're making impulsive decisions
- Remind them of their trading rules if relevant
`
    }
    
    return null
  } catch (e) {
    return null
  }
}

/**
 * Generate complete AI context with personality
 * Call this in your buildAIContext function
 * 
 * @param {Object} marketData - Current market data
 * @returns {string} Full context string
 */
export function buildPersonalityAwareContext(marketData = {}) {
  const sections = []
  
  // Base personality context
  const personalityContext = getPersonalityContext()
  if (personalityContext) {
    sections.push(personalityContext)
  }
  
  // Response style
  const styleContext = getResponseStyleFromPersonality()
  if (styleContext) {
    sections.push(styleContext)
  }
  
  // Emotional state warning
  const emotionalWarning = getEmotionalStateWarning()
  if (emotionalWarning) {
    sections.push(emotionalWarning)
  }
  
  // Trading history context
  const historyContext = getTradingHistoryContext()
  if (historyContext) {
    sections.push(historyContext)
  }
  
  return sections.join('\n\n')
}

/**
 * Get relevant trading history context
 * @returns {string} History context
 */
function getTradingHistoryContext() {
  try {
    const learningStr = localStorage.getItem('ava.mind.learning')
    if (!learningStr) return ''
    
    const learning = JSON.parse(learningStr)
    if (learning.totalTrades < 5) return ''
    
    const lines = ['## User Trading History']
    
    lines.push(`- Total trades: ${learning.totalTrades}`)
    lines.push(`- Win rate: ${learning.winRate?.toFixed(1)}%`)
    
    if (learning.bestSymbol) {
      lines.push(`- Best performer: ${learning.bestSymbol.key} (${learning.bestSymbol.winRate?.toFixed(0)}% win rate)`)
    }
    
    if (learning.worstSymbol) {
      lines.push(`- Struggles with: ${learning.worstSymbol.key} (${learning.worstSymbol.winRate?.toFixed(0)}% win rate)`)
    }
    
    if (learning.bestTimeframe) {
      lines.push(`- Best timeframe: ${learning.bestTimeframe.key}`)
    }
    
    if (learning.streakCurrent !== 0) {
      const streakType = learning.streakCurrent > 0 ? 'winning' : 'losing'
      lines.push(`- Currently on a ${Math.abs(learning.streakCurrent)}-trade ${streakType} streak`)
    }
    
    lines.push('')
    lines.push('Use this history to personalize suggestions - avoid recommending what historically hasn\'t worked for them.')
    
    return lines.join('\n')
  } catch (e) {
    return ''
  }
}

/**
 * Quick personality summary for chat header
 * @returns {Object} Summary object
 */
export function getPersonalitySummary() {
  try {
    const personalityStr = localStorage.getItem('ava.mind.personality')
    if (!personalityStr) return null
    
    const personality = JSON.parse(personalityStr)
    const archetype = determineArchetype(personality)
    
    const tradesStr = localStorage.getItem('ava.mind.trades')
    const trades = tradesStr ? JSON.parse(tradesStr).slice(0, 5) : []
    const emotionalState = detectEmotionalState(trades)
    
    return {
      archetype: archetype?.primary?.archetype || null,
      archetypeScore: archetype?.primary?.score || 0,
      emotionalState: emotionalState?.state || EMOTIONAL_STATES.neutral,
      emotionalIntensity: emotionalState?.intensity || 0.3,
      riskTolerance: personality.riskTolerance,
      confidenceLevel: personality.confidenceLevel
    }
  } catch (e) {
    return null
  }
}

/**
 * Check if user's request aligns with their personality
 * @param {string} action - 'buy', 'sell', 'hold'
 * @param {Object} context - Trade context (symbol, size, etc.)
 * @returns {Object|null} Alignment check result
 */
export function checkPersonalityAlignment(action, context = {}) {
  try {
    const personalityStr = localStorage.getItem('ava.mind.personality')
    if (!personalityStr) return null
    
    const p = JSON.parse(personalityStr)
    const warnings = []
    const confirmations = []
    
    // Position size check
    if (context.positionPercent > 20 && p.riskTolerance < 40) {
      warnings.push({
        type: 'position_size',
        message: `This ${context.positionPercent.toFixed(0)}% position is larger than your conservative profile typically allows.`
      })
    }
    
    // Contrarian check
    if (context.againstTrend && p.contrarianScore < 40) {
      warnings.push({
        type: 'contrarian',
        message: 'This trade goes against the trend, but your profile prefers trend-following.'
      })
    } else if (context.againstTrend && p.contrarianScore > 70) {
      confirmations.push({
        type: 'contrarian',
        message: 'Contrarian play - aligns with your fade-the-crowd style.'
      })
    }
    
    // Emotional state check
    const tradesStr = localStorage.getItem('ava.mind.trades')
    const trades = tradesStr ? JSON.parse(tradesStr).slice(0, 5) : []
    const emotionalState = detectEmotionalState(trades)
    
    if (emotionalState?.state?.id === 'frustrated' && action === 'buy') {
      warnings.push({
        type: 'emotional',
        message: 'You appear frustrated from recent losses. Is this a well-planned trade or revenge trading?'
      })
    }
    
    if (emotionalState?.state?.id === 'greedy' && context.positionPercent > 15) {
      warnings.push({
        type: 'emotional',
        message: 'You\'re on a winning streak - be careful not to overextend.'
      })
    }
    
    return {
      aligned: warnings.length === 0,
      warnings,
      confirmations
    }
  } catch (e) {
    return null
  }
}

export default {
  getPersonalityContext,
  getResponseStyleFromPersonality,
  getEmotionalStateWarning,
  buildPersonalityAwareContext,
  getPersonalitySummary,
  checkPersonalityAlignment
}
