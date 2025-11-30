/**
 * PersonalizedScoreService.js
 * 
 * THE BRIDGE: Converts objective Unicorn Score into personalized trading recommendations.
 * 
 * This service does NOT modify the Unicorn Score calculation.
 * It AUGMENTS it with personality-based translation.
 * 
 * Architecture:
 * ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────────┐
 * │  Unicorn Score  │ --> │  This Service   │ --> │ Personalized Signal     │
 * │  (Objective)    │     │  (Translation)  │     │ (Subjective + Context)  │
 * └─────────────────┘     └─────────────────┘     └─────────────────────────┘
 * 
 * @author iAVA.ai
 * @version 1.0.0
 * @license MIT
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Base position sizes by Unicorn Score classification
 * These are the OBJECTIVE starting points before personality adjustments
 */
const BASE_POSITION_SIZES = {
  'Ultra Elite': 0.15,   // 15% max for 95+ scores
  'Elite':       0.12,   // 12% for 90-94
  'Strong':      0.10,   // 10% for 80-89
  'Moderate':    0.08,   // 8% for 65-79
  'Weak':        0.05,   // 5% for 50-64
  'Avoid':       0.00    // 0% for <50
};

/**
 * Archetype multipliers for position sizing
 * These reflect each archetype's inherent risk appetite
 */
const ARCHETYPE_POSITION_MULTIPLIERS = {
  'Surgeon':         0.70,   // -30% Conservative, precision entries
  'Sniper':          0.85,   // -15% Selective, high-conviction only
  'Momentum Rider':  1.00,   // Base Standard sizing
  'Contrarian':      0.90,   // -10% Slightly reduced for counter-trend
  'Guardian':        0.60,   // -40% Capital preservation focus
  'Hunter':          1.30    // +30% Aggressive, high risk tolerance
};

/**
 * Archetype multipliers for stop loss distance
 * Higher = wider stops, Lower = tighter stops
 */
const ARCHETYPE_STOP_MULTIPLIERS = {
  'Surgeon':         0.75,   // Tight stops for precise entries
  'Sniper':          1.00,   // Standard stops
  'Momentum Rider':  1.25,   // Wider stops for noise tolerance
  'Contrarian':      1.50,   // Widest for counter-trend positions
  'Guardian':        0.80,   // Tight for capital protection
  'Hunter':          1.30    // Wide for letting winners run
};

/**
 * Archetype profit target multipliers
 */
const ARCHETYPE_PROFIT_MULTIPLIERS = {
  'Surgeon':         1.00,   // Standard targets
  'Sniper':          1.20,   // Extended targets for high conviction
  'Momentum Rider':  1.50,   // Let momentum run
  'Contrarian':      0.80,   // Take profits earlier on reversals
  'Guardian':        0.75,   // Conservative profit taking
  'Hunter':          1.50    // Go for home runs
};

/**
 * Emotional state configurations
 * These override normal behavior when detected
 */
const EMOTIONAL_STATE_CONFIG = {
  'Confident': {
    positionMultiplier: 1.00,
    requireConfirmation: false,
    message: null,
    suggestPaperTrade: false,
    suggestBreak: false
  },
  'Cautious': {
    positionMultiplier: 0.85,
    requireConfirmation: false,
    message: "You've been more cautious lately. Trust your analysis if the setup is solid.",
    suggestPaperTrade: false,
    suggestBreak: false
  },
  'Frustrated': {
    positionMultiplier: 0.50,
    requireConfirmation: true,
    message: "You're on a losing streak. Consider paper trading or reducing size to break the cycle.",
    suggestPaperTrade: true,
    suggestBreak: false
  },
  'Fearful': {
    positionMultiplier: 0.75,
    requireConfirmation: false,
    message: "You've been hesitant on entries lately. If your thesis is solid, trust it.",
    suggestPaperTrade: false,
    suggestBreak: false
  },
  'Greedy': {
    positionMultiplier: 0.80,
    requireConfirmation: true,
    message: "Hot streak detected! Don't let FOMO override your sizing rules.",
    suggestPaperTrade: false,
    suggestBreak: false,
    forceMaxPosition: true
  },
  'Neutral': {
    positionMultiplier: 1.00,
    requireConfirmation: false,
    message: null,
    suggestPaperTrade: false,
    suggestBreak: false
  },
  'Exhausted': {
    positionMultiplier: 0.50,
    requireConfirmation: true,
    message: "You've placed many trades today. Consider taking a break to reset.",
    suggestPaperTrade: false,
    suggestBreak: true
  }
};

/**
 * Archetype message templates for different score levels
 */
const ARCHETYPE_MESSAGES = {
  'Surgeon': {
    icon: '🔬',
    elite: 'Exceptional precision setup on',
    strong: 'Solid surgical entry opportunity on',
    moderate: 'Acceptable setup on',
    weak: 'Wait for cleaner entry on'
  },
  'Sniper': {
    icon: '🎯',
    elite: 'Perfect shot lined up on',
    strong: 'High-conviction target acquired:',
    moderate: 'Decent opportunity but not ideal:',
    weak: 'Not worth the bullet:'
  },
  'Momentum Rider': {
    icon: '🏄',
    elite: 'Massive wave forming on',
    strong: 'Strong momentum building on',
    moderate: 'Some momentum showing on',
    weak: 'Choppy waters on'
  },
  'Contrarian': {
    icon: '🔄',
    elite: 'Perfect contrarian setup on',
    strong: 'Good counter-trend opportunity on',
    moderate: 'Possible reversal brewing on',
    weak: 'Trend too strong to fade on'
  },
  'Guardian': {
    icon: '🛡️',
    elite: 'Safe high-probability setup on',
    strong: 'Reasonable risk/reward on',
    moderate: 'Proceed with caution on',
    weak: 'Too risky—protect capital, skip'
  },
  'Hunter': {
    icon: '🦁',
    elite: 'BIG opportunity—GO ALL IN on',
    strong: 'Strong prey spotted:',
    moderate: 'Worth a hunt on',
    weak: 'Small game not worth the effort:'
  }
};

/**
 * Entry strategy templates by archetype
 */
const ENTRY_STRATEGIES = {
  'Surgeon': {
    type: 'pullback',
    name: 'Precision Pullback Entry',
    description: 'Wait for pullback to SATY support level. Enter on bounce confirmation (green candle above support).',
    waitFor: 'SATY support touch + green confirmation candle',
    scaling: false
  },
  'Sniper': {
    type: 'immediate',
    name: 'Single Shot Entry',
    description: 'Single decisive entry at current price. All-or-nothing, no scaling.',
    waitFor: null,
    scaling: false
  },
  'Momentum Rider': {
    type: 'breakout',
    name: 'Momentum Breakout Entry',
    description: 'Enter on breakout confirmation. Add position on continuation above prior high.',
    waitFor: 'Break and close above prior candle high',
    scaling: true
  },
  'Contrarian': {
    type: 'fade',
    name: 'Contrarian Fade Entry',
    description: 'Scale into position as price moves against the crowd. Add on extreme readings.',
    waitFor: 'Exhaustion signal or extreme sentiment reading',
    scaling: true
  },
  'Guardian': {
    type: 'scale',
    name: 'Defensive Scale Entry',
    description: 'Enter 25% now, add 25% on each pullback. Maximum 4 entries.',
    waitFor: null,
    scaling: true
  },
  'Hunter': {
    type: 'aggressive',
    name: 'Aggressive Full Entry',
    description: 'Full position immediately on signal. Maximum exposure to capture the move.',
    waitFor: null,
    scaling: false
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// LOCAL STORAGE KEYS
// ═══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  PERSONALITY: 'ava.mind.personality',
  TRADES: 'ava.mind.trades',
  LEARNING: 'ava.mind.learning'
};


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class PersonalizedScoreService {
  constructor() {
    this.personality = null;
    this.archetype = null;
    this.emotionalState = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * THE CORE METHOD
   * 
   * Takes an objective Unicorn Score result and returns a personalized signal.
   * This is the PhD-level integration point.
   * 
   * @param {Object} unicornResult - The result from EnhancedUnicornScore.calculateUltraUnicornScore()
   * @param {string} symbol - The trading symbol
   * @param {number} currentPrice - Current market price
   * @returns {Object} Unified response with objective, personalized, and context data
   */
  getPersonalizedSignal(unicornResult, symbol, currentPrice = 0) {
    // Load user context
    this.loadUserContext();
    
    const {
      ultraUnicornScore,
      direction,
      classification,
      components = {},
      bonuses = {},
      aiComponents = {}
    } = unicornResult;

    // Apply personality filters
    const personalized = this.applyPersonalityFilter({
      unicornScore: ultraUnicornScore,
      direction,
      classification,
      components,
      currentPrice
    });

    // Generate AVA message
    const avaMessage = this.generatePersonalizedMessage(
      symbol,
      ultraUnicornScore,
      direction,
      personalized
    );

    // Determine recommended action
    const action = this.determineAction(
      ultraUnicornScore,
      direction,
      personalized
    );

    // Return unified response
    return {
      // ─── Objective (unchanged from Unicorn Score) ───
      objective: {
        score: ultraUnicornScore,
        direction,
        classification,
        components,
        bonuses,
        aiComponents
      },
      
      // ─── Personalized (adjusted for user) ───
      personalized: {
        positionSize: personalized.positionSize,
        positionPercent: `${(personalized.positionSize * 100).toFixed(1)}%`,
        stopLoss: personalized.stopLoss,
        stopLossPercent: `${(personalized.stopLoss * 100).toFixed(2)}%`,
        takeProfit: personalized.takeProfit,
        takeProfitPercent: `${(personalized.takeProfit * 100).toFixed(2)}%`,
        riskRewardRatio: (personalized.takeProfit / personalized.stopLoss).toFixed(2),
        entryStrategy: personalized.entryStrategy,
        confidenceAdjustment: personalized.confidenceAdjustment,
        warnings: personalized.warnings,
        encouragements: personalized.encouragements,
        requiresConfirmation: personalized.requiresConfirmation
      },
      
      // ─── Context ───
      context: {
        archetype: this.archetype?.name || 'Unknown',
        archetypeIcon: ARCHETYPE_MESSAGES[this.archetype?.name]?.icon || '🤖',
        archetypeConfidence: this.archetype?.confidence || 0,
        emotionalState: this.emotionalState?.state || 'Neutral',
        emotionalIntensity: this.emotionalState?.intensity || 0,
        recentPerformance: this.getRecentPerformance(),
        isArchetypeAligned: this.isArchetypeAligned(components)
      },
      
      // ─── AVA Message ───
      avaMessage,
      
      // ─── Recommended Action ───
      action
    };
  }

  /**
   * Quick method to just get position size recommendation
   */
  getRecommendedPositionSize(unicornScore, classification) {
    this.loadUserContext();
    
    const basePosition = BASE_POSITION_SIZES[classification] || 0.05;
    const archetypeMultiplier = ARCHETYPE_POSITION_MULTIPLIERS[this.archetype?.name] || 1.0;
    const riskMultiplier = this.getRiskMultiplier();
    const emotionalMultiplier = EMOTIONAL_STATE_CONFIG[this.emotionalState?.state]?.positionMultiplier || 1.0;
    
    let finalPosition = basePosition * archetypeMultiplier * riskMultiplier * emotionalMultiplier;
    finalPosition = Math.min(finalPosition, 0.25); // Hard cap at 25%
    finalPosition = Math.max(finalPosition, 0);
    
    return finalPosition;
  }

  /**
   * Get AI context string for injecting into prompts
   */
  getAIContextString() {
    this.loadUserContext();
    
    const archetype = this.archetype?.name || 'Unknown';
    const emotionalState = this.emotionalState?.state || 'Neutral';
    const performance = this.getRecentPerformance();
    
    return `
USER PERSONALITY CONTEXT:
- Trading Archetype: ${archetype}
- Current Emotional State: ${emotionalState}
- Recent Performance: ${performance.last10.wins}W-${performance.last10.losses}L (${performance.last10.winRate} win rate)
- Current Streak: ${performance.streak.count} ${performance.streak.type}
- Today's Trades: ${performance.todayTrades}

COMMUNICATION STYLE FOR ${archetype.toUpperCase()}:
${this.getArchetypeStyle()}

${this.emotionalState?.state !== 'Neutral' ? `
⚠️ EMOTIONAL STATE ALERT:
The user appears ${emotionalState.toLowerCase()}. ${EMOTIONAL_STATE_CONFIG[emotionalState]?.message || ''}
Adjust your response tone accordingly - be supportive but honest.
` : ''}
`.trim();
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Load user context from localStorage
   */
  loadUserContext() {
    this.personality = this.loadPersonality();
    this.archetype = this.determineArchetype();
    this.emotionalState = this.detectEmotionalState();
  }

  /**
   * Load personality from localStorage
   */
  loadPersonality() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PERSONALITY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load personality:', e);
    }
    
    // Return defaults
    return {
      riskTolerance: 50,
      patience: 50,
      lossAversion: 50,
      fomo: 50,
      analyticalVsIntuitive: 50,
      independenceVsConformity: 50,
      convictionLevel: 50,
      adaptability: 50
    };
  }

  /**
   * Determine archetype from personality traits
   */
  determineArchetype() {
    const p = this.personality;
    
    // Scoring algorithm for each archetype
    const scores = {
      'Surgeon': (
        (100 - p.riskTolerance) * 0.3 +
        p.patience * 0.25 +
        p.analyticalVsIntuitive * 0.25 +
        (100 - p.fomo) * 0.2
      ),
      'Sniper': (
        p.patience * 0.35 +
        p.convictionLevel * 0.35 +
        (100 - p.fomo) * 0.3
      ),
      'Momentum Rider': (
        p.adaptability * 0.3 +
        p.fomo * 0.25 +
        (100 - p.patience) * 0.25 +
        (100 - p.independenceVsConformity) * 0.2
      ),
      'Contrarian': (
        p.independenceVsConformity * 0.4 +
        p.convictionLevel * 0.3 +
        (100 - p.fomo) * 0.3
      ),
      'Guardian': (
        (100 - p.riskTolerance) * 0.35 +
        p.lossAversion * 0.35 +
        p.patience * 0.3
      ),
      'Hunter': (
        p.riskTolerance * 0.35 +
        (100 - p.lossAversion) * 0.25 +
        (100 - p.patience) * 0.2 +
        p.convictionLevel * 0.2
      )
    };
    
    // Find top archetype
    let topArchetype = 'Momentum Rider';
    let topScore = 0;
    
    for (const [archetype, score] of Object.entries(scores)) {
      if (score > topScore) {
        topScore = score;
        topArchetype = archetype;
      }
    }
    
    return {
      name: topArchetype,
      confidence: Math.round(topScore),
      scores
    };
  }

  /**
   * Detect emotional state from recent trades
   */
  detectEmotionalState() {
    const trades = this.loadRecentTrades();
    if (trades.length === 0) {
      return { state: 'Neutral', intensity: 0 };
    }
    
    // Analyze last 5 trades
    const recentTrades = trades.slice(-5);
    const wins = recentTrades.filter(t => t.outcome === 'win').length;
    const losses = recentTrades.filter(t => t.outcome === 'loss').length;
    
    // Calculate streak
    const streak = this.calculateStreak(trades);
    
    // Today's trade count
    const todayTrades = trades.filter(t => this.isToday(t.timestamp)).length;
    
    // Determine emotional state
    let state = 'Neutral';
    let intensity = 0;
    
    // Frustrated: 3+ losing streak
    if (streak.type === 'loss' && streak.count >= 3) {
      state = 'Frustrated';
      intensity = Math.min(100, 50 + (streak.count - 3) * 15);
    }
    // Greedy: 4+ winning streak
    else if (streak.type === 'win' && streak.count >= 4) {
      state = 'Greedy';
      intensity = Math.min(100, 50 + (streak.count - 4) * 15);
    }
    // Confident: Good recent performance
    else if (wins >= 4 && losses <= 1) {
      state = 'Confident';
      intensity = 60 + (wins - 4) * 10;
    }
    // Fearful: Poor recent performance but not a streak
    else if (losses >= 3 && wins <= 1) {
      state = 'Fearful';
      intensity = 50 + (losses - 3) * 10;
    }
    // Exhausted: Too many trades today
    else if (todayTrades >= 15) {
      state = 'Exhausted';
      intensity = 50 + (todayTrades - 15) * 5;
    }
    // Cautious: Mixed results
    else if (losses >= 2) {
      state = 'Cautious';
      intensity = 40;
    }
    
    return {
      state,
      intensity,
      streak,
      message: EMOTIONAL_STATE_CONFIG[state]?.message || null,
      positionMultiplier: EMOTIONAL_STATE_CONFIG[state]?.positionMultiplier || 1.0
    };
  }

  /**
   * Apply personality filters to create personalized parameters
   */
  applyPersonalityFilter({ unicornScore, direction, classification, components, currentPrice }) {
    // ─── Position Sizing ───
    const basePosition = BASE_POSITION_SIZES[classification] || 0.05;
    const archetypeMultiplier = ARCHETYPE_POSITION_MULTIPLIERS[this.archetype?.name] || 1.0;
    const riskMultiplier = this.getRiskMultiplier();
    const emotionalMultiplier = this.emotionalState?.positionMultiplier || 1.0;
    
    let positionSize = basePosition * archetypeMultiplier * riskMultiplier * emotionalMultiplier;
    positionSize = Math.min(positionSize, 0.25); // Hard cap at 25%
    positionSize = Math.max(positionSize, 0);
    
    // ─── Stop Loss ───
    const baseStop = components?.satyATR?.stopDistance || 0.02; // Default 2%
    const stopMultiplier = ARCHETYPE_STOP_MULTIPLIERS[this.archetype?.name] || 1.0;
    const lossAversionMultiplier = this.getLossAversionMultiplier();
    const stopLoss = baseStop * stopMultiplier * lossAversionMultiplier;
    
    // ─── Take Profit ───
    const baseTakeProfit = components?.satyATR?.targetDistance || 0.04; // Default 4%
    const profitMultiplier = ARCHETYPE_PROFIT_MULTIPLIERS[this.archetype?.name] || 1.0;
    const takeProfit = baseTakeProfit * profitMultiplier;
    
    // ─── Entry Strategy ───
    const entryStrategy = this.getEntryStrategy(components, currentPrice);
    
    // ─── Confidence Adjustment ───
    const confidenceAdjustment = this.calculateConfidenceAdjustment(unicornScore);
    
    // ─── Warnings & Encouragements ───
    const { warnings, encouragements } = this.generateAlerts(unicornScore, direction, components);
    
    // ─── Requires Confirmation ───
    const requiresConfirmation = 
      EMOTIONAL_STATE_CONFIG[this.emotionalState?.state]?.requireConfirmation || 
      warnings.some(w => w.severity === 'high');
    
    return {
      positionSize,
      stopLoss,
      takeProfit,
      entryStrategy,
      confidenceAdjustment,
      warnings,
      encouragements,
      requiresConfirmation
    };
  }

  /**
   * Get risk multiplier from personality
   */
  getRiskMultiplier() {
    const riskTolerance = this.personality?.riskTolerance || 50;
    return 0.5 + (riskTolerance / 100); // 0.5x to 1.5x
  }

  /**
   * Get loss aversion multiplier
   */
  getLossAversionMultiplier() {
    const lossAversion = this.personality?.lossAversion || 50;
    if (lossAversion > 70) return 0.75;      // Tight stops
    if (lossAversion < 30) return 1.25;      // Wide stops
    return 1.0;
  }

  /**
   * Get entry strategy for current archetype
   */
  getEntryStrategy(components, currentPrice) {
    const strategy = ENTRY_STRATEGIES[this.archetype?.name] || ENTRY_STRATEGIES['Sniper'];
    
    // Enhance with component data if available
    const enhanced = { ...strategy };
    
    if (strategy.type === 'pullback' && components?.satyATR) {
      enhanced.targetLevel = components.satyATR.supportLevel;
      enhanced.description = strategy.description.replace(
        'SATY support level',
        `$${components.satyATR.supportLevel?.toFixed(2) || 'N/A'}`
      );
    }
    
    return enhanced;
  }

  /**
   * Calculate confidence adjustment based on alignment
   */
  calculateConfidenceAdjustment(unicornScore) {
    let adjustment = 0;
    
    // Archetype confidence bonus
    if (this.archetype?.confidence > 80) adjustment += 5;
    else if (this.archetype?.confidence > 60) adjustment += 3;
    
    // Emotional state adjustment
    if (this.emotionalState?.state === 'Confident') adjustment += 5;
    if (this.emotionalState?.state === 'Frustrated') adjustment -= 10;
    if (this.emotionalState?.state === 'Fearful') adjustment -= 5;
    if (this.emotionalState?.state === 'Greedy') adjustment -= 3;
    
    return adjustment;
  }

  /**
   * Generate warnings and encouragements
   */
  generateAlerts(unicornScore, direction, components) {
    const warnings = [];
    const encouragements = [];
    
    // ─── Emotional Warnings ───
    const emotionalConfig = EMOTIONAL_STATE_CONFIG[this.emotionalState?.state];
    if (emotionalConfig?.message) {
      warnings.push({
        type: 'emotional',
        severity: this.emotionalState.state === 'Frustrated' ? 'high' : 'medium',
        message: emotionalConfig.message,
        action: emotionalConfig.suggestPaperTrade 
          ? 'Consider paper trading' 
          : emotionalConfig.suggestBreak 
            ? 'Consider taking a break'
            : 'Proceed with awareness'
      });
    }
    
    // ─── Archetype-Specific Warnings ───
    const archetype = this.archetype?.name;
    
    // Contrarian warning on strong sentiment
    if (archetype === 'Contrarian' && components?.sentiment?.score > 80) {
      warnings.push({
        type: 'archetype',
        severity: 'medium',
        message: 'High bullish sentiment—as a Contrarian, consider waiting for pullback',
        action: 'Wait for sentiment cooling'
      });
    }
    
    // Guardian warning on high volatility
    if (archetype === 'Guardian' && components?.volatility?.high) {
      warnings.push({
        type: 'archetype',
        severity: 'medium',
        message: 'Elevated volatility detected—as a Guardian, reduce position size',
        action: 'Use half position size'
      });
    }
    
    // Hunter warning on weak score
    if (archetype === 'Hunter' && unicornScore < 70) {
      warnings.push({
        type: 'archetype',
        severity: 'low',
        message: 'Score below 70—even Hunters need conviction',
        action: 'Wait for stronger setup'
      });
    }
    
    // ─── Encouragements ───
    if (this.emotionalState?.state === 'Confident' && unicornScore >= 85) {
      encouragements.push({
        type: 'alignment',
        message: 'Strong signal aligned with your hot streak. Execute your plan.'
      });
    }
    
    if (this.isArchetypeAligned(components)) {
      encouragements.push({
        type: 'archetype',
        message: `This setup matches your ${archetype} style perfectly.`
      });
    }
    
    if (unicornScore >= 90 && this.archetype?.confidence > 70) {
      encouragements.push({
        type: 'elite',
        message: 'Elite signal with high archetype confidence. This is your bread and butter.'
      });
    }
    
    return { warnings, encouragements };
  }

  /**
   * Check if current setup aligns with archetype preferences
   */
  isArchetypeAligned(components) {
    const archetype = this.archetype?.name;
    
    const alignmentChecks = {
      'Surgeon': components?.squeeze?.fired && (components?.volume?.ratio || 1) < 1.5,
      'Sniper': components?.score >= 85 && components?.multiTF?.aligned,
      'Momentum Rider': components?.momentum?.strong && (components?.volume?.ratio || 1) > 1.5,
      'Contrarian': components?.sentiment?.extreme || components?.rsi?.oversold || components?.rsi?.overbought,
      'Guardian': components?.score >= 80 && !components?.volatility?.high,
      'Hunter': components?.score >= 90 && components?.volume?.breakout
    };
    
    return alignmentChecks[archetype] || false;
  }

  /**
   * Generate the personalized AVA message
   */
  generatePersonalizedMessage(symbol, unicornScore, direction, personalized) {
    const archetype = this.archetype?.name || 'Unknown';
    const messages = ARCHETYPE_MESSAGES[archetype] || ARCHETYPE_MESSAGES['Momentum Rider'];
    
    // Get score-appropriate opening
    let opening;
    if (unicornScore >= 90) opening = messages.elite;
    else if (unicornScore >= 80) opening = messages.strong;
    else if (unicornScore >= 65) opening = messages.moderate;
    else opening = messages.weak;
    
    // Build message
    let message = `${messages.icon} ${opening} ${symbol} at ${unicornScore}. `;
    message += `${personalized.entryStrategy.description} `;
    message += `Position: ${personalized.positionPercent}. `;
    
    // Add emotional context if relevant
    if (this.emotionalState?.state !== 'Neutral' && this.emotionalState?.message) {
      message += this.emotionalState.message;
    }
    
    return message;
  }

  /**
   * Determine recommended action
   */
  determineAction(unicornScore, direction, personalized) {
    // Score too low
    if (unicornScore < 50) {
      return { 
        type: 'AVOID', 
        reason: 'Score below threshold',
        canOverride: false
      };
    }
    
    // High severity warnings
    if (personalized.warnings.some(w => w.severity === 'high')) {
      return { 
        type: 'CAUTION', 
        reason: 'Emotional state requires attention',
        canOverride: true
      };
    }
    
    // Strong signal with alignment
    if (unicornScore >= 80 && personalized.warnings.length === 0) {
      return { 
        type: 'EXECUTE', 
        reason: 'Strong signal, personality aligned',
        canOverride: true
      };
    }
    
    // Strong signal with minor warnings
    if (unicornScore >= 80) {
      return { 
        type: 'REVIEW', 
        reason: 'Strong signal but review warnings',
        canOverride: true
      };
    }
    
    // Moderate signal
    return { 
      type: 'CONSIDER', 
      reason: 'Moderate signal, use discretion',
      canOverride: true
    };
  }

  /**
   * Get archetype communication style for AI context
   */
  getArchetypeStyle() {
    const styles = {
      'Surgeon': 'Be precise and technical. Focus on exact entry levels, tight stops, and clean setups. This user values precision over quantity.',
      'Sniper': 'Be direct and high-conviction. Skip weak setups entirely. When you do recommend, be decisive.',
      'Momentum Rider': 'Be energetic about trends. Highlight momentum, breakouts, and continuation patterns. This user likes riding moves.',
      'Contrarian': 'Present counter-arguments. Highlight when sentiment is extreme. This user likes going against the crowd.',
      'Guardian': 'Emphasize risk management. Lead with downside protection. This user prioritizes capital preservation.',
      'Hunter': 'Be bold and aggressive. Highlight the upside potential. This user is comfortable with risk for big rewards.'
    };
    
    return styles[this.archetype?.name] || styles['Momentum Rider'];
  }

  /**
   * Load recent trades from localStorage
   */
  loadRecentTrades() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRADES);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Get recent performance summary
   */
  getRecentPerformance() {
    const trades = this.loadRecentTrades();
    const recent = trades.slice(-10);
    const wins = recent.filter(t => t.outcome === 'win').length;
    const losses = recent.filter(t => t.outcome === 'loss').length;
    
    return {
      last10: {
        wins,
        losses,
        winRate: recent.length > 0 ? `${Math.round(wins / recent.length * 100)}%` : 'N/A'
      },
      streak: this.calculateStreak(trades),
      todayTrades: trades.filter(t => this.isToday(t.timestamp)).length
    };
  }

  /**
   * Calculate current win/loss streak
   */
  calculateStreak(trades) {
    if (trades.length === 0) return { type: 'none', count: 0 };
    
    let count = 1;
    const lastOutcome = trades[trades.length - 1].outcome;
    
    for (let i = trades.length - 2; i >= 0; i--) {
      if (trades[i].outcome === lastOutcome) count++;
      else break;
    }
    
    return { type: lastOutcome, count };
  }

  /**
   * Check if timestamp is today
   */
  isToday(timestamp) {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// Singleton instance
export const personalizedScoreService = new PersonalizedScoreService();

// Class export for testing/extension
export default PersonalizedScoreService;

// Constants exports for external use
export {
  BASE_POSITION_SIZES,
  ARCHETYPE_POSITION_MULTIPLIERS,
  ARCHETYPE_STOP_MULTIPLIERS,
  ARCHETYPE_PROFIT_MULTIPLIERS,
  EMOTIONAL_STATE_CONFIG,
  ARCHETYPE_MESSAGES,
  ENTRY_STRATEGIES,
  STORAGE_KEYS
};
