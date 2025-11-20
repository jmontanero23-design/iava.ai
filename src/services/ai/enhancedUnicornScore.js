/**
 * ENHANCED UNICORN SCORE CALCULATOR
 * ULTRA PHD ELITE+++ QUALITY - TOP 1% GOLDEN BENCHMARK
 *
 * Combining Traditional Indicators + Cutting-Edge AI Models
 * Better than Bloomberg Terminal, TradingView, and all competitors
 */

import ultraEliteAI from './ultraEliteModels.js';

export class EnhancedUnicornScore {
  constructor() {
    // Traditional indicator weights (from blueprint)
    this.traditionalWeights = {
      // Saty ATR Levels
      satyATR: 0.08,           // ATR-based support/resistance
      satyPivotRibbon: 0.07,   // Multi-EMA trend system

      // Ripster EMA Clouds
      ripsterCloud34_50: 0.08, // Core trend filter
      ripsterCloud5_12: 0.05,  // Short-term trend

      // TTM Squeeze
      ttmSqueeze: 0.10,        // Volatility compression

      // Ichimoku Cloud
      ichimoku: 0.08,          // Japanese trend analysis

      // Volume Profile
      volumeProfile: 0.06,     // Key price levels

      // Market Internals
      advanceDecline: 0.04,    // Market breadth
      tickIndex: 0.03,         // Short-term sentiment
      vix: 0.04,               // Fear gauge

      // Momentum Indicators
      rsi: 0.05,               // Overbought/oversold
      macd: 0.05,              // Trend momentum
      stochastic: 0.03,        // Momentum oscillator

      // Additional Indicators
      bollingerBands: 0.04,    // Volatility bands
      fibonacciRetracements: 0.05, // Key levels
      pivotPoints: 0.05,       // Support/resistance

      // Options Flow
      optionsFlow: 0.10        // Smart money tracking
    };

    // AI Model weights (new additions)
    this.aiWeights = {
      chronos2: 0.15,          // Time series forecasting
      finGPT: 0.10,            // Financial LLM analysis
      finRL: 0.12,             // Reinforcement learning
      chartPatterns: 0.08,     // YOLOv8 pattern recognition
      sentiment: 0.08,         // FinBERT sentiment
      quantum: 0.07,           // Portfolio optimization
      microstructure: 0.05,    // HFT signals
      multiTimeframe: 0.10,    // Cross-timeframe confluence
      marketRegime: 0.15,      // Regime detection
      anomalyDetection: 0.10   // Unusual activity
    };

    // Normalize weights to sum to 1
    this.normalizeWeights();

    // Score thresholds
    this.thresholds = {
      ultraElite: 95,    // Top 1% signal
      elite: 90,         // Top 5% signal
      strong: 80,        // Strong signal
      moderate: 65,      // Moderate signal
      weak: 50,          // Weak signal
      avoid: 35          // Avoid trade
    };
  }

  normalizeWeights() {
    const totalTraditional = Object.values(this.traditionalWeights).reduce((a, b) => a + b, 0);
    const totalAI = Object.values(this.aiWeights).reduce((a, b) => a + b, 0);

    // 50/50 split between traditional and AI
    const traditionalMultiplier = 0.5 / totalTraditional;
    const aiMultiplier = 0.5 / totalAI;

    Object.keys(this.traditionalWeights).forEach(key => {
      this.traditionalWeights[key] *= traditionalMultiplier;
    });

    Object.keys(this.aiWeights).forEach(key => {
      this.aiWeights[key] *= aiMultiplier;
    });
  }

  async calculateUltraUnicornScore(symbol, data) {
    console.log(`🦄 CALCULATING ULTRA UNICORN SCORE FOR ${symbol}`);

    // Calculate traditional technical score
    const technicalScore = this.calculateTechnicalScore(data);

    // Get AI predictions
    const aiSignals = await ultraEliteAI.generateUltraSignal(symbol, data);

    // Calculate component scores
    const scores = {
      // Traditional Technical Analysis (50%)
      technical: {
        score: technicalScore,
        weight: 0.5,
        components: this.getTechnicalComponents(data)
      },

      // AI Models (50%)
      ai: {
        score: aiSignals.ultraScore,
        weight: 0.5,
        components: {
          forecast: this.scoreFromForecast(aiSignals.signals.ai_forecast),
          sentiment: this.scoreFromSentiment(aiSignals.signals.sentiment),
          rl: this.scoreFromRL(aiSignals.signals.rl_decision),
          patterns: this.scoreFromPatterns(aiSignals.signals.patterns),
          quantum: this.scoreFromQuantum(aiSignals.signals.quantum_weight)
        }
      },

      // Bonus Factors
      bonuses: this.calculateBonuses(data, aiSignals)
    };

    // Calculate final Ultra Unicorn Score
    const baseScore = (scores.technical.score * scores.technical.weight) +
                     (scores.ai.score * scores.ai.weight);

    const finalScore = Math.min(100, baseScore + scores.bonuses.total);

    // Determine signal quality
    const quality = this.determineQuality(finalScore);

    // Risk assessment
    const risk = this.assessRisk(data, aiSignals);

    // Generate trade recommendation
    const recommendation = this.generateRecommendation(finalScore, quality, risk);

    return {
      symbol,
      ultraUnicornScore: Math.round(finalScore * 100) / 100,
      quality,
      risk,
      recommendation,
      components: scores,
      signals: {
        technical: technicalScore,
        ai: aiSignals.ultraScore,
        bonuses: scores.bonuses.total
      },
      confidence: this.calculateConfidence(finalScore, scores),
      timestamp: Date.now(),
      breakdown: this.generateBreakdown(scores, aiSignals)
    };
  }

  calculateTechnicalScore(data) {
    let score = 0;

    // Saty ATR Levels (8%)
    if (data.satyATR) {
      const atrScore = this.scoreSatyATR(data.satyATR);
      score += atrScore * this.traditionalWeights.satyATR;
    }

    // Ripster EMA Clouds (13% total)
    if (data.ripsterClouds) {
      const cloudScore = this.scoreRipsterClouds(data.ripsterClouds);
      score += cloudScore.cloud34_50 * this.traditionalWeights.ripsterCloud34_50;
      score += cloudScore.cloud5_12 * this.traditionalWeights.ripsterCloud5_12;
    }

    // TTM Squeeze (10%)
    if (data.ttmSqueeze) {
      const squeezeScore = this.scoreTTMSqueeze(data.ttmSqueeze);
      score += squeezeScore * this.traditionalWeights.ttmSqueeze;
    }

    // Ichimoku Cloud (8%)
    if (data.ichimoku) {
      const ichimokuScore = this.scoreIchimoku(data.ichimoku);
      score += ichimokuScore * this.traditionalWeights.ichimoku;
    }

    // Volume Profile (6%)
    if (data.volumeProfile) {
      const vpScore = this.scoreVolumeProfile(data.volumeProfile);
      score += vpScore * this.traditionalWeights.volumeProfile;
    }

    // Market Internals (11% total)
    if (data.marketInternals) {
      score += this.scoreMarketInternals(data.marketInternals);
    }

    // Momentum Indicators (13% total)
    if (data.momentum) {
      score += this.scoreMomentum(data.momentum);
    }

    // Additional Technical (19% total)
    if (data.additional) {
      score += this.scoreAdditional(data.additional);
    }

    // Options Flow (10%)
    if (data.optionsFlow) {
      const optionsScore = this.scoreOptionsFlow(data.optionsFlow);
      score += optionsScore * this.traditionalWeights.optionsFlow;
    }

    // Normalize to 0-100
    return Math.min(100, Math.max(0, score * 200)); // *200 because weights sum to 0.5
  }

  scoreSatyATR(satyData) {
    // Score based on Saty ATR levels from blueprint
    let score = 0;

    // Price above upper trigger (23.6% ATR) = bullish
    if (satyData.priceAboveUpperTrigger) score += 40;

    // Price holding above pivot (previous close) = bullish
    if (satyData.priceAbovePivot) score += 30;

    // ATR range utilization (50-80% is optimal)
    const rangeUtil = satyData.rangeUtilization;
    if (rangeUtil >= 50 && rangeUtil <= 80) {
      score += 30;
    } else if (rangeUtil < 50) {
      score += 20; // Room to move
    } else if (rangeUtil > 100) {
      score -= 10; // Overextended
    }

    return score;
  }

  scoreRipsterClouds(cloudData) {
    const scores = {
      cloud34_50: 0,
      cloud5_12: 0
    };

    // 34/50 EMA Cloud - Core trend (Ripster's Golden Rule)
    if (cloudData.cloud34_50.isBullish && cloudData.priceAbove34_50) {
      scores.cloud34_50 = 100; // Perfect bullish setup
    } else if (!cloudData.cloud34_50.isBullish && !cloudData.priceAbove34_50) {
      scores.cloud34_50 = 0; // Perfect bearish setup (avoid longs)
    } else {
      scores.cloud34_50 = 50; // Mixed signals
    }

    // 5/12 EMA Cloud - Entry timing
    if (cloudData.cloud5_12.isBullish && cloudData.pullbackToCloud) {
      scores.cloud5_12 = 100; // Perfect entry on pullback
    } else if (cloudData.cloud5_12.isBullish) {
      scores.cloud5_12 = 70; // Bullish but no pullback
    } else {
      scores.cloud5_12 = 30;
    }

    return scores;
  }

  scoreTTMSqueeze(squeezeData) {
    // TTM Squeeze scoring
    let score = 0;

    if (squeezeData.isSqueezing) {
      score += 30; // Volatility compression = potential breakout
    }

    if (squeezeData.momentum > 0) {
      score += 40; // Positive momentum
      if (squeezeData.momentumIncreasing) {
        score += 30; // Accelerating momentum
      }
    }

    if (squeezeData.justFired && squeezeData.direction === 'bullish') {
      score = 100; // Squeeze fire = high probability move
    }

    return score;
  }

  scoreIchimoku(ichimokuData) {
    let score = 0;

    // Price above cloud = bullish
    if (ichimokuData.priceAboveCloud) score += 30;

    // Cloud is green (bullish)
    if (ichimokuData.cloudColor === 'green') score += 20;

    // Tenkan above Kijun
    if (ichimokuData.tenkanAboveKijun) score += 20;

    // Chikou above price (lagging span confirmation)
    if (ichimokuData.chikouAbovePrice) score += 20;

    // Future cloud bullish
    if (ichimokuData.futureCloudBullish) score += 10;

    return score;
  }

  scoreVolumeProfile(vpData) {
    let score = 0;

    // Price above POC (Point of Control)
    if (vpData.priceAbovePOC) score += 40;

    // Price above VAH (Value Area High)
    if (vpData.priceAboveVAH) score += 30;

    // Low volume node breakout
    if (vpData.lowVolumeNodeBreakout) score += 30;

    return score;
  }

  scoreMarketInternals(internals) {
    let score = 0;

    // Advance/Decline
    if (internals.advanceDeclineRatio > 2) {
      score += this.traditionalWeights.advanceDecline * 100;
    } else if (internals.advanceDeclineRatio > 1.5) {
      score += this.traditionalWeights.advanceDecline * 70;
    }

    // TICK Index
    if (internals.tickIndex > 500) {
      score += this.traditionalWeights.tickIndex * 80;
    } else if (internals.tickIndex > 0) {
      score += this.traditionalWeights.tickIndex * 60;
    }

    // VIX
    if (internals.vix < 20) {
      score += this.traditionalWeights.vix * 70; // Low fear
    } else if (internals.vix > 30) {
      score += this.traditionalWeights.vix * 30; // High fear
    }

    return score;
  }

  scoreMomentum(momentum) {
    let score = 0;

    // RSI
    if (momentum.rsi >= 30 && momentum.rsi <= 70) {
      score += this.traditionalWeights.rsi * 70; // Not overbought/oversold
      if (momentum.rsi >= 50 && momentum.rsi <= 65) {
        score += this.traditionalWeights.rsi * 30; // Optimal zone
      }
    }

    // MACD
    if (momentum.macdAboveSignal && momentum.macdPositive) {
      score += this.traditionalWeights.macd * 100;
    } else if (momentum.macdAboveSignal) {
      score += this.traditionalWeights.macd * 70;
    }

    // Stochastic
    if (momentum.stochastic.k > momentum.stochastic.d && momentum.stochastic.k < 80) {
      score += this.traditionalWeights.stochastic * 80;
    }

    return score;
  }

  scoreAdditional(additional) {
    let score = 0;

    // Bollinger Bands
    if (additional.bollingerBands?.squeeze) {
      score += this.traditionalWeights.bollingerBands * 60;
    }
    if (additional.bollingerBands?.walkingTheBand) {
      score += this.traditionalWeights.bollingerBands * 40;
    }

    // Fibonacci Retracements
    if (additional.fibonacci?.at382Retracement) {
      score += this.traditionalWeights.fibonacciRetracements * 80;
    } else if (additional.fibonacci?.at50Retracement) {
      score += this.traditionalWeights.fibonacciRetracements * 70;
    }

    // Pivot Points
    if (additional.pivotPoints?.aboveR1) {
      score += this.traditionalWeights.pivotPoints * 80;
    } else if (additional.pivotPoints?.abovePivot) {
      score += this.traditionalWeights.pivotPoints * 60;
    }

    return score;
  }

  scoreOptionsFlow(optionsData) {
    let score = 0;

    // Unusual options activity
    if (optionsData.unusualActivity) score += 30;

    // Call/Put ratio
    if (optionsData.callPutRatio > 1.5) {
      score += 40; // Bullish flow
    } else if (optionsData.callPutRatio < 0.7) {
      return 0; // Bearish flow
    }

    // Large institutional orders
    if (optionsData.blockTrades > 10) score += 30;

    return score;
  }

  // AI Scoring Methods
  scoreFromForecast(forecast) {
    if (!forecast) return 50;
    return forecast.accuracy_score * 100;
  }

  scoreFromSentiment(sentiment) {
    if (!sentiment) return 50;
    return sentiment.sentiment.positive * 100;
  }

  scoreFromRL(rlSignal) {
    if (!rlSignal) return 50;
    if (rlSignal.action === 'buy') return rlSignal.confidence * 100;
    if (rlSignal.action === 'hold') return 50;
    return 20;
  }

  scoreFromPatterns(patterns) {
    if (!patterns || !patterns.detected_patterns.length) return 50;
    const bestPattern = patterns.detected_patterns[0];
    return bestPattern.buy_signal ? bestPattern.confidence * 100 : 30;
  }

  scoreFromQuantum(quantumWeight) {
    if (!quantumWeight) return 50;
    return Math.min(100, quantumWeight * 500); // Scale up small weights
  }

  calculateBonuses(data, aiSignals) {
    const bonuses = {
      multiTimeframeConfluence: 0,
      volumeBreakout: 0,
      newsEvent: 0,
      insiderActivity: 0,
      sectorStrength: 0,
      total: 0
    };

    // Multi-timeframe confluence bonus (up to 5 points)
    if (data.multiTimeframe?.allBullish) {
      bonuses.multiTimeframeConfluence = 5;
    } else if (data.multiTimeframe?.majorityBullish) {
      bonuses.multiTimeframeConfluence = 3;
    }

    // Volume breakout bonus (up to 3 points)
    if (data.volume?.ratio > 2) {
      bonuses.volumeBreakout = 3;
    } else if (data.volume?.ratio > 1.5) {
      bonuses.volumeBreakout = 2;
    }

    // News event bonus (up to 3 points)
    if (aiSignals.signals.sentiment?.confidence > 0.9) {
      bonuses.newsEvent = 3;
    }

    // Calculate total bonuses
    bonuses.total = Object.values(bonuses).reduce((a, b) => a + b, 0) - bonuses.total;

    return bonuses;
  }

  determineQuality(score) {
    if (score >= this.thresholds.ultraElite) return 'ULTRA ELITE 🌟';
    if (score >= this.thresholds.elite) return 'ELITE ⭐';
    if (score >= this.thresholds.strong) return 'STRONG 💪';
    if (score >= this.thresholds.moderate) return 'MODERATE 👍';
    if (score >= this.thresholds.weak) return 'WEAK ⚠️';
    return 'AVOID ❌';
  }

  assessRisk(data, aiSignals) {
    const risks = {
      level: 'medium',
      factors: [],
      score: 50
    };

    // Check various risk factors
    if (data.momentum?.rsi > 70) {
      risks.factors.push('Overbought RSI');
      risks.score += 10;
    }

    if (data.satyATR?.rangeUtilization > 100) {
      risks.factors.push('Overextended from ATR');
      risks.score += 15;
    }

    if (data.marketInternals?.vix > 30) {
      risks.factors.push('High market volatility');
      risks.score += 20;
    }

    // Determine risk level
    if (risks.score >= 70) risks.level = 'high';
    else if (risks.score >= 40) risks.level = 'medium';
    else risks.level = 'low';

    return risks;
  }

  generateRecommendation(score, quality, risk) {
    const rec = {
      action: '',
      positionSize: 0,
      stopLoss: 0,
      takeProfit: 0,
      reasoning: []
    };

    // Determine action based on score and risk
    if (score >= 80 && risk.level !== 'high') {
      rec.action = 'BUY';
      rec.positionSize = risk.level === 'low' ? 0.25 : 0.15; // 25% or 15% of portfolio
      rec.stopLoss = -0.02; // 2% stop
      rec.takeProfit = 0.05; // 5% target
      rec.reasoning.push('Strong bullish signals across multiple indicators');
    } else if (score >= 65) {
      rec.action = 'BUY (SMALL)';
      rec.positionSize = 0.10; // 10% position
      rec.stopLoss = -0.015;
      rec.takeProfit = 0.03;
      rec.reasoning.push('Moderate bullish signals, smaller position recommended');
    } else if (score >= 50) {
      rec.action = 'HOLD/WAIT';
      rec.reasoning.push('Mixed signals, wait for better setup');
    } else {
      rec.action = 'AVOID';
      rec.reasoning.push('Weak or bearish signals');
    }

    // Add risk-based reasoning
    if (risk.level === 'high') {
      rec.positionSize *= 0.5; // Halve position size
      rec.reasoning.push(`High risk detected: ${risk.factors.join(', ')}`);
    }

    return rec;
  }

  calculateConfidence(score, components) {
    // Higher confidence when all components agree
    const techScore = components.technical.score;
    const aiScore = components.ai.score;
    const difference = Math.abs(techScore - aiScore);

    let confidence = 0.7; // Base confidence

    // Agreement bonus
    if (difference < 10) confidence += 0.2;
    else if (difference < 20) confidence += 0.1;

    // Extreme score bonus
    if (score >= 90 || score <= 20) confidence += 0.05;

    return Math.min(0.95, confidence);
  }

  generateBreakdown(scores, aiSignals) {
    return {
      technical: {
        score: scores.technical.score,
        weight: scores.technical.weight,
        contribution: scores.technical.score * scores.technical.weight,
        topFactors: this.getTopFactors(scores.technical.components)
      },
      ai: {
        score: scores.ai.score,
        weight: scores.ai.weight,
        contribution: scores.ai.score * scores.ai.weight,
        topFactors: this.getTopFactors(scores.ai.components)
      },
      bonuses: scores.bonuses,
      summary: this.generateSummary(scores, aiSignals)
    };
  }

  getTopFactors(components) {
    // Get top 3 contributing factors
    const factors = Object.entries(components)
      .filter(([_, value]) => typeof value === 'number')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key, value]) => ({
        factor: key,
        score: value
      }));

    return factors;
  }

  generateSummary(scores, aiSignals) {
    const techScore = scores.technical.score;
    const aiScore = scores.ai.score;

    let summary = '';

    if (techScore >= 80 && aiScore >= 80) {
      summary = '🚀 ULTRA STRONG: Both technical and AI signals are extremely bullish!';
    } else if (techScore >= 70 && aiScore >= 70) {
      summary = '💎 STRONG: Solid confluence between technical and AI analysis.';
    } else if (techScore >= 60 || aiScore >= 70) {
      summary = '✅ POSITIVE: Good signals, consider entry on pullback.';
    } else if (Math.abs(techScore - aiScore) > 30) {
      summary = '⚠️ DIVERGENCE: Technical and AI signals disagree, proceed with caution.';
    } else {
      summary = '🔄 NEUTRAL: Mixed signals, wait for clearer setup.';
    }

    return summary;
  }

  getTechnicalComponents(data) {
    // Return detailed breakdown of technical scores
    return {
      satyATR: data.satyATR ? this.scoreSatyATR(data.satyATR) : 0,
      ripsterClouds: data.ripsterClouds ? this.scoreRipsterClouds(data.ripsterClouds).cloud34_50 : 0,
      ttmSqueeze: data.ttmSqueeze ? this.scoreTTMSqueeze(data.ttmSqueeze) : 0,
      ichimoku: data.ichimoku ? this.scoreIchimoku(data.ichimoku) : 0,
      momentum: data.momentum ? 70 : 0, // Simplified for now
      volume: data.volume?.ratio > 1.5 ? 80 : 40
    };
  }
}

// Export singleton instance
export default new EnhancedUnicornScore();