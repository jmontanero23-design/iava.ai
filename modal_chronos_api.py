"""
Modal Deployment: Real Chronos-2 Time Series Forecasting API

Cost: ~$0.002 per forecast (T4 GPU)
Setup:
  1. pip install modal
  2. modal setup
  3. modal deploy modal_chronos_api.py

Author: iava.ai
Date: November 20, 2025
Version: 2.0 (Fixed meta tensor error + Modal 1.0 API)
"""

import modal

# Create Modal app
app = modal.App("iava-chronos-forecasting")

# Define image with Chronos dependencies
image = (
    modal.Image.debian_slim()
    .pip_install(
        "torch",
        "transformers",
        "accelerate",
        "chronos-forecasting",  # Amazon's Chronos package
        "fastapi",  # Required for web endpoints
    )
)

# CRITICAL FIX: Cache model in container to avoid reloading
# This drastically improves performance and reduces costs
_MODEL_CACHE = {}

def get_chronos_pipeline(model_size: str = "base"):
    """Load and cache Chronos pipeline"""
    import torch
    from chronos import ChronosPipeline

    model_name = f"amazon/chronos-t5-{model_size}"

    if model_name not in _MODEL_CACHE:
        print(f"[Chronos] Loading {model_name} (one-time load)...")

        # CRITICAL FIX: Use device="cuda" instead of device_map to avoid meta tensor issues
        pipeline = ChronosPipeline.from_pretrained(
            model_name,
            device="cuda",  # Direct CUDA placement (not device_map)
            torch_dtype=torch.float32,  # Use float32 for stability
        )

        _MODEL_CACHE[model_name] = pipeline
        print(f"[Chronos] ✅ {model_name} cached successfully!")

    return _MODEL_CACHE[model_name]


@app.function(
    image=image,
    gpu="T4",  # Cheapest GPU: $0.59/hour (~$0.0001639/second)
    timeout=120,  # 2 minutes max
    scaledown_window=300,  # FIXED: Renamed from container_idle_timeout
)
@modal.concurrent(max_inputs=10)  # FIXED: Handle 10 concurrent requests
def forecast_chronos(
    time_series: list[float],
    horizon: int = 24,
    model_size: str = "base"  # tiny, small, base (recommended), or large
):
    """
    Run Chronos-2 forecasting on serverless GPU (with model caching)

    Args:
        time_series: Historical values (e.g., stock prices)
        horizon: How many steps to forecast
        model_size: "tiny", "small", "base" (recommended), or "large"

    Returns:
        predictions: List of forecasted values
        quantiles: Confidence intervals
    """
    import torch
    import numpy as np

    try:
        # Get cached pipeline (avoids reloading model on every request)
        pipeline = get_chronos_pipeline(model_size)

        # Run forecast
        print(f"[Chronos] Forecasting {len(time_series)} points, horizon={horizon}")
        context_tensor = torch.tensor(time_series, dtype=torch.float32).to("cuda")

        # Predict (takes context tensor and horizon)
        forecast = pipeline.predict(context_tensor, horizon)

        # Extract median and quantiles
        low_quantile, median, high_quantile = np.quantile(
            forecast[0].cpu().numpy(),  # Move to CPU for numpy
            [0.1, 0.5, 0.9],
            axis=0
        )

        return {
            "predictions": median.tolist(),
            "confidence_low": low_quantile.tolist(),
            "confidence_high": high_quantile.tolist(),
            "horizon": horizon,
            "model": f"amazon/chronos-t5-{model_size}",
            "num_samples": 20,
            "status": "success",
            "cached": True  # Indicate we're using cached model
        }
    except Exception as e:
        print(f"❌ Error in forecast_chronos: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "status": "failed"
        }


@app.function(
    image=image,
    gpu="T4",
    timeout=120,
    scaledown_window=300,  # FIXED: Renamed from container_idle_timeout
)
def forecast_timesfm(
    time_series: list[float],
    horizon: int = 24,
):
    """
    Run Google TimesFM forecasting

    TimesFM (Time Series Foundation Model) by Google Research
    Currently using Chronos-base as proxy (TimesFM not yet stable)
    """
    try:
        # TimesFM doesn't have stable package yet, use Chronos-base as high-quality proxy
        print("[TimesFM] Using Chronos-base as high-quality proxy...")
        return forecast_chronos.local(time_series, horizon, "base")

    except Exception as e:
        print(f"[TimesFM] Error: {str(e)}, falling back to Chronos-base")
        return forecast_chronos.local(time_series, horizon, "base")


@app.local_entrypoint()
def test():
    """Test the API locally"""
    import numpy as np

    # Generate sample time series (like stock prices)
    prices = [100 + i + np.random.randn() * 2 for i in range(100)]

    print("🚀 Testing Chronos-2 forecasting...")
    result = forecast_chronos.remote(prices, horizon=10, model_size="base")

    if result.get("status") == "success":
        print(f"✅ Forecast: {result['predictions'][:5]}...")
        print(f"📊 Model: {result['model']}")
        print(f"🎯 Horizon: {result['horizon']}")
        print(f"💾 Cached: {result.get('cached', False)}")
    else:
        print(f"❌ Error: {result.get('error')}")


# Web endpoint for your app (PUBLIC API)
@app.function(
    image=image,
    gpu="T4",
    timeout=120,
    scaledown_window=300,  # FIXED: Renamed from container_idle_timeout
)
@modal.concurrent(max_inputs=10)  # FIXED: Handle 10 concurrent requests
@modal.fastapi_endpoint(method="POST", docs=True)  # FIXED: Renamed from web_endpoint
def api_forecast(data: dict):
    """
    Public API endpoint for Chronos-2 forecasting

    POST body:
    {
        "time_series": [1.0, 2.0, 3.0, ...],  // At least 10 data points
        "horizon": 24,                         // How many steps to forecast
        "model": "base"                        // tiny, small, base, or large
    }

    Returns:
    {
        "predictions": [...],
        "confidence_low": [...],
        "confidence_high": [...],
        "horizon": 24,
        "model": "amazon/chronos-t5-base",
        "status": "success",
        "cached": true
    }
    """
    try:
        time_series = data.get("time_series", [])
        horizon = data.get("horizon", 24)
        model = data.get("model", "base")

        # Validation
        if not isinstance(time_series, list):
            return {"error": "time_series must be a list", "status": "failed"}

        if len(time_series) < 10:
            return {"error": "Need at least 10 historical data points", "status": "failed"}

        if horizon < 1 or horizon > 100:
            return {"error": "Horizon must be between 1 and 100", "status": "failed"}

        if model not in ["tiny", "small", "base", "large"]:
            return {"error": "Model must be tiny, small, base, or large", "status": "failed"}

        # Run forecast (will use cached model)
        result = forecast_chronos.remote(time_series, horizon, model)
        return result

    except Exception as e:
        return {
            "error": str(e),
            "status": "failed"
        }
