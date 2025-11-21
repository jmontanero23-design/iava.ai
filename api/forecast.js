/**
 * Chronos Forecast API Endpoint
 * Proxies requests to Modal GPU for REAL AI forecasting
 *
 * This keeps the Modal URL server-side only (security best practice)
 */

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
    const { prices, horizon = 24, symbol } = req.body;

    if (!prices || !Array.isArray(prices) || prices.length < 10) {
      return res.status(400).json({
        error: 'Need at least 10 price points',
        received: prices?.length || 0
      });
    }

    const modalEndpoint = process.env.MODAL_CHRONOS_API;

    console.log(`[Forecast API] Request for ${symbol || 'unknown'} with ${prices.length} data points`);
    console.log(`[Forecast API] Modal endpoint configured: ${!!modalEndpoint}`);

    // Try Modal API first (REAL AI)
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

          // Calculate directional score
          const lastPrice = prices[prices.length - 1];
          const forecastScore = calculateForecastScore(lastPrice, result.predictions);

          console.log(`[Forecast API] REAL AI Success: ${forecastScore.direction} (${forecastScore.score}/100)`);

          return res.status(200).json({
            success: true,
            predictions: result.predictions,
            confidence_low: result.confidence_low,
            confidence_high: result.confidence_high,
            horizon: horizon,
            model: 'Chronos-T5-Base (REAL)',
            direction: forecastScore.direction,
            percentChange: forecastScore.percentChange,
            accuracy_score: forecastScore.score / 100
          });
        } else {
          const errorText = await response.text();
          console.warn(`[Forecast API] Modal returned ${response.status}: ${errorText}`);
        }
      } catch (modalError) {
        console.warn('[Forecast API] Modal API failed:', modalError.message);
      }
    }

    // Fallback: Smart trend-based forecast
    console.log('[Forecast API] Using fallback forecast...');
    const fallbackResult = generateSmartForecast(prices, horizon);

    return res.status(200).json({
      success: true,
      ...fallbackResult,
      fallback: true
    });

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
 * Fallback: Smart trend-based forecast
 */
function generateSmartForecast(timeseries, horizon) {
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

  // Generate predictions
  const predictions = [];
  for (let i = 0; i < horizon; i++) {
    const trendComponent = lastValue + trend * (i + 1);
    const noise = (Math.random() - 0.5) * volatility;
    predictions.push(trendComponent + noise);
  }

  const forecastScore = calculateForecastScore(lastValue, predictions);

  return {
    predictions,
    horizon,
    model: 'Smart Trend (Fallback)',
    direction: forecastScore.direction,
    percentChange: forecastScore.percentChange,
    accuracy_score: forecastScore.score / 100
  };
}
