/**
 * Chronos Forecast API Endpoint
 * Proxies requests to Modal GPU for REAL AI forecasting
 *
 * This keeps the Modal URL server-side only (security best practice)
 *
 * PhD+++ Enhancements:
 * - Response validation (no more NaN)
 * - Caching to save Modal costs
 * - Rich context injection
 */

// PhD+++ Simple in-memory cache to reduce Modal calls
const forecastCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCacheKey(symbol, prices) {
  // Use last 10 prices as cache key signature
  const priceSignature = prices.slice(-10).map(p => p.toFixed(2)).join(',')
  return `${symbol}:${priceSignature}`
}

function getFromCache(key) {
  const cached = forecastCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  forecastCache.delete(key)
  return null
}

function setCache(key, data) {
  // Limit cache size
  if (forecastCache.size > 50) {
    const oldestKey = forecastCache.keys().next().value
    forecastCache.delete(oldestKey)
  }
  forecastCache.set(key, { data, timestamp: Date.now() })
}

// PhD+++ Validate predictions contain valid numbers
function validatePredictions(predictions) {
  if (!Array.isArray(predictions) || predictions.length === 0) {
    return false
  }
  return predictions.every(p => typeof p === 'number' && !isNaN(p) && isFinite(p))
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prices, ohlcv, horizon = 24, symbol, context } = req.body;

    if (!prices || !Array.isArray(prices) || prices.length < 10) {
      return res.status(400).json({
        error: 'Need at least 10 price points',
        received: prices?.length || 0
      });
    }

    // PhD+++ Log rich context if provided
    if (context) {
      console.log(`[Forecast API] Rich Context:`, {
        rsi: context.rsi?.toFixed(1),
        volatility: `${context.volatility?.toFixed(2)}%`,
        momentum: `${context.shortMomentum?.toFixed(2)}%`,
        priceRange: context.priceRange
      });
    }

    const modalEndpoint = process.env.MODAL_CHRONOS_API;
    const cacheKey = getCacheKey(symbol || 'unknown', prices);

    console.log(`[Forecast API] Request for ${symbol || 'unknown'} with ${prices.length} data points`);
    console.log(`[Forecast API] Modal endpoint configured: ${!!modalEndpoint}`);

    // PhD+++ Check cache first to save Modal costs
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      console.log(`[Forecast API] 💰 Cache HIT for ${symbol || 'unknown'} - saved a Modal call!`);
      return res.status(200).json({
        ...cachedResult,
        cached: true
      });
    }

    // PhD+++ ENSEMBLE APPROACH: Run Modal Chronos AND smart fallback, combine them
    let chronosPredictions = null;
    let chronosConfidence = null;
    let modalSuccess = false;

    // Try Modal API (REAL AI)
    if (modalEndpoint) {
      try {
        console.log('[Forecast API] Calling Modal Chronos API...');

        const response = await fetch(modalEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            time_series: prices,
            horizon: horizon,
            model: 'base'
          })
        });

        if (response.ok) {
          const result = await response.json();

          if (validatePredictions(result.predictions)) {
            chronosPredictions = result.predictions;
            chronosConfidence = {
              low: result.confidence_low,
              high: result.confidence_high
            };
            modalSuccess = true;
            console.log('[Forecast API] ✅ Modal Chronos predictions received');
          } else {
            console.warn('[Forecast API] ⚠️ Modal returned invalid predictions (NaN/null)');
          }
        } else {
          const errorText = await response.text();
          console.warn(`[Forecast API] Modal returned ${response.status}: ${errorText}`);
        }
      } catch (modalError) {
        console.warn('[Forecast API] Modal API failed:', modalError.message);
      }
    }

    // PhD+++ Always generate smart fallback for ensemble
    const smartForecast = generateSmartForecast(prices, horizon, context);
    const lastPrice = prices[prices.length - 1];

    // PhD+++ ENSEMBLE: Combine predictions with intelligent weighting
    let ensemblePredictions;
    let ensembleModel;
    let ensembleWeights;

    if (modalSuccess && chronosPredictions) {
      // Weight: 70% Chronos (ML), 30% Smart Fallback (context-aware)
      const chronosWeight = 0.70;
      const fallbackWeight = 0.30;

      ensemblePredictions = chronosPredictions.map((cp, i) => {
        const fp = smartForecast.predictions[i];
        return (cp * chronosWeight) + (fp * fallbackWeight);
      });

      ensembleModel = 'Chronos+Smart Ensemble (REAL)';
      ensembleWeights = { chronos: chronosWeight, smart: fallbackWeight };

      console.log(`[Forecast API] 🎯 ENSEMBLE: ${chronosWeight * 100}% Chronos + ${fallbackWeight * 100}% Smart`);
    } else {
      // Pure fallback
      ensemblePredictions = smartForecast.predictions;
      ensembleModel = 'Smart Trend (Fallback)';
      ensembleWeights = { chronos: 0, smart: 1.0 };
    }

    // Calculate final scores
    const forecastScore = calculateForecastScore(lastPrice, ensemblePredictions);

    // PhD+++ Volatility-calibrated confidence bands
    const calibratedConfidence = calibrateConfidenceBands(
      ensemblePredictions,
      chronosConfidence,
      context,
      lastPrice
    );

    const responseData = {
      success: true,
      predictions: ensemblePredictions,
      confidence_low: calibratedConfidence.low,
      confidence_high: calibratedConfidence.high,
      confidence_score: calibratedConfidence.score,
      horizon: horizon,
      model: ensembleModel,
      direction: forecastScore.direction,
      percentChange: forecastScore.percentChange,
      accuracy_score: forecastScore.score / 100,
      // PhD+++ Ensemble details
      ensemble: {
        weights: ensembleWeights,
        chronosAvailable: modalSuccess,
        smartReason: smartForecast.trendReason
      },
      // PhD+++ Include context insights
      contextInsights: context ? {
        rsi: context.rsi,
        volatility: context.volatility,
        momentum: context.shortMomentum,
        regime: context.rsi > 70 ? 'overbought' : context.rsi < 30 ? 'oversold' : 'normal'
      } : null,
      fallback: !modalSuccess
    };

    // PhD+++ Cache the response
    setCache(cacheKey, responseData);
    console.log(`[Forecast API] 💾 Cached ensemble result for ${symbol || 'unknown'}`);

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('[Forecast API] Error:', error);
    return res.status(500).json({
      error: error.message || 'Forecast failed'
    });
  }
}

/**
 * Calculate directional score from predictions
 */
function calculateForecastScore(lastPrice, predictions) {
  if (!predictions || predictions.length === 0 || !lastPrice) {
    return { score: 50, direction: 'NEUTRAL', percentChange: 0 };
  }

  const endPrediction = predictions[predictions.length - 1];
  const percentChange = ((endPrediction - lastPrice) / lastPrice) * 100;

  // Convert percent change to 0-100 score
  let score;
  if (percentChange >= 5) {
    score = 100;
  } else if (percentChange >= 2) {
    score = 70 + (percentChange - 2) * 10;
  } else if (percentChange >= 0.5) {
    score = 55 + (percentChange - 0.5) * 10;
  } else if (percentChange >= -0.5) {
    score = 45 + percentChange * 20;
  } else if (percentChange >= -2) {
    score = 30 + (percentChange + 2) * 10;
  } else if (percentChange >= -5) {
    score = 0 + (percentChange + 5) * 10;
  } else {
    score = 0;
  }

  // Determine direction label
  let direction;
  if (score >= 70) direction = 'BULLISH';
  else if (score >= 55) direction = 'slightly bullish';
  else if (score >= 45) direction = 'NEUTRAL';
  else if (score >= 30) direction = 'slightly bearish';
  else direction = 'BEARISH';

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    direction,
    percentChange
  };
}

/**
 * PhD+++ Volatility-calibrated confidence bands
 * Adjusts prediction confidence based on market conditions
 */
function calibrateConfidenceBands(predictions, chronosConfidence, context, lastPrice) {
  if (!predictions || predictions.length === 0) {
    return { low: null, high: null, score: 0.5 };
  }

  // Base volatility multiplier (higher volatility = wider bands)
  let volatilityMultiplier = 1.0;
  if (context?.volatility) {
    // Scale: 0.5% volatility = tight bands, 5% = very wide bands
    volatilityMultiplier = 0.5 + (context.volatility / 5);
    volatilityMultiplier = Math.max(0.5, Math.min(2.5, volatilityMultiplier));
  }

  // RSI extreme positions increase uncertainty
  let rsiUncertainty = 1.0;
  if (context?.rsi) {
    if (context.rsi > 70 || context.rsi < 30) {
      // Extreme RSI = higher uncertainty (potential reversal)
      rsiUncertainty = 1.3;
    } else if (context.rsi > 60 || context.rsi < 40) {
      rsiUncertainty = 1.1;
    }
  }

  // Combined uncertainty factor
  const uncertaintyFactor = volatilityMultiplier * rsiUncertainty;

  // If we have Chronos confidence bands, calibrate them
  if (chronosConfidence?.low && chronosConfidence?.high) {
    const calibratedLow = chronosConfidence.low.map((val, i) => {
      const pred = predictions[i];
      const range = pred - val;
      return pred - (range * uncertaintyFactor);
    });

    const calibratedHigh = chronosConfidence.high.map((val, i) => {
      const pred = predictions[i];
      const range = val - pred;
      return pred + (range * uncertaintyFactor);
    });

    // Confidence score: inverse of uncertainty (higher uncertainty = lower confidence)
    const confidenceScore = Math.max(0.3, Math.min(0.95, 0.85 / uncertaintyFactor));

    console.log(`[Confidence] Calibrated: volatility=${volatilityMultiplier.toFixed(2)}, rsi=${rsiUncertainty.toFixed(2)}, score=${confidenceScore.toFixed(2)}`);

    return {
      low: calibratedLow,
      high: calibratedHigh,
      score: confidenceScore
    };
  }

  // Generate synthetic confidence bands if none from Chronos
  const baseSpread = lastPrice * 0.02 * uncertaintyFactor; // 2% base spread, scaled by uncertainty

  const syntheticLow = predictions.map((pred, i) => {
    const timeDecay = 1 + (i / predictions.length) * 0.5; // Wider bands for further predictions
    return pred - (baseSpread * timeDecay);
  });

  const syntheticHigh = predictions.map((pred, i) => {
    const timeDecay = 1 + (i / predictions.length) * 0.5;
    return pred + (baseSpread * timeDecay);
  });

  const confidenceScore = Math.max(0.3, Math.min(0.75, 0.65 / uncertaintyFactor));

  console.log(`[Confidence] Synthetic bands: spread=$${baseSpread.toFixed(2)}, score=${confidenceScore.toFixed(2)}`);

  return {
    low: syntheticLow,
    high: syntheticHigh,
    score: confidenceScore
  };
}

/**
 * PhD+++ Fallback: Context-aware smart forecast
 * Uses RSI, momentum, and volatility for better predictions
 */
function generateSmartForecast(timeseries, horizon, context = null) {
  const lastValue = timeseries[timeseries.length - 1];

  // Calculate trend from recent data
  const recent = timeseries.slice(-10);
  const trend = (recent[recent.length - 1] - recent[0]) / recent.length;

  // Calculate volatility
  const returns = [];
  for (let i = 1; i < timeseries.length; i++) {
    returns.push((timeseries[i] - timeseries[i-1]) / timeseries[i-1]);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * lastValue;

  // PhD+++ Context-aware trend adjustment
  let adjustedTrend = trend;
  let trendReason = 'trend-following';

  if (context) {
    // Mean reversion logic based on RSI
    if (context.rsi > 70) {
      // Overbought - reduce bullish trend, add bearish bias
      adjustedTrend = trend * 0.5 - (lastValue * 0.001);
      trendReason = 'overbought-reversal';
    } else if (context.rsi < 30) {
      // Oversold - reduce bearish trend, add bullish bias
      adjustedTrend = trend * 0.5 + (lastValue * 0.001);
      trendReason = 'oversold-reversal';
    }

    // Momentum confirmation
    if (context.shortMomentum && context.longMomentum) {
      const momAlignment = Math.sign(context.shortMomentum) === Math.sign(context.longMomentum);
      if (momAlignment) {
        // Strong momentum alignment - trust the trend more
        adjustedTrend *= 1.2;
        trendReason += '+momentum-aligned';
      }
    }
  }

  // Generate predictions with context-aware adjustments
  const predictions = [];
  for (let i = 0; i < horizon; i++) {
    const trendComponent = lastValue + adjustedTrend * (i + 1);
    // Reduce noise for lower volatility periods
    const noiseScale = context?.volatility ? Math.min(1, context.volatility / 2) : 1;
    const noise = (Math.random() - 0.5) * volatility * noiseScale;
    predictions.push(trendComponent + noise);
  }

  const forecastScore = calculateForecastScore(lastValue, predictions);

  console.log(`[Fallback] Trend reason: ${trendReason}, Adjusted trend: ${adjustedTrend.toFixed(4)}`);

  return {
    predictions,
    horizon,
    model: 'Smart Trend (Fallback)',
    direction: forecastScore.direction,
    percentChange: forecastScore.percentChange,
    accuracy_score: forecastScore.score / 100,
    trendReason // PhD+++ Include reasoning
  };
}
