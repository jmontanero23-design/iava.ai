import { useState } from 'react'
import { predictSignalConfidence } from '../utils/predictiveConfidence.js'

export default function PredictiveConfidencePanel() {
  const [signal, setSignal] = useState({
    type: 'breakout',
    score: 75,
    winRate: 0.65,
    avgReturn: 0.05,
    riskReward: 2.5,
    volumeScore: 80,
    timingScore: 70
  })

  const [prediction, setPrediction] = useState(null)

  const handlePredict = () => {
    try {
      const result = predictSignalConfidence(signal, {})
      setPrediction(result)

      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Confidence predicted successfully', type: 'success' }
      }))
    } catch (error) {
      console.error('Prediction failed:', error)
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Prediction failed: ' + error.message, type: 'error' }
      }))
    }
  }

  const getConfidenceColor = (conf) => {
    if (conf >= 80) return 'emerald'
    if (conf >= 60) return 'cyan'
    if (conf >= 40) return 'amber'
    return 'rose'
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="card overflow-hidden">
        <div className="p-5 relative overflow-hidden border-b border-slate-700/50">
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-600 blur-lg opacity-50 animate-pulse" />
                <span className="relative text-2xl filter drop-shadow-lg">🎲</span>
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-200 to-purple-300 bg-clip-text text-transparent">
                  Predictive Confidence
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  ML-powered success probability estimation
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Signal Inputs */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Signal Type</label>
              <select
                value={signal.type}
                onChange={e => setSignal({ ...signal, type: e.target.value })}
                className="select w-full bg-slate-800/50 border-slate-700/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              >
                <option value="breakout">Breakout</option>
                <option value="pullback">Pullback</option>
                <option value="reversal">Reversal</option>
                <option value="continuation">Continuation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Signal Score (0-100)</label>
              <input
                type="number"
                value={signal.score}
                onChange={e => setSignal({ ...signal, score: parseInt(e.target.value) || 0 })}
                className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Historical Win Rate</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={signal.winRate}
                onChange={e => setSignal({ ...signal, winRate: parseFloat(e.target.value) || 0 })}
                className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Risk:Reward Ratio</label>
              <input
                type="number"
                step="0.1"
                value={signal.riskReward}
                onChange={e => setSignal({ ...signal, riskReward: parseFloat(e.target.value) || 0 })}
                className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>
          </div>

          <button
            onClick={handlePredict}
            className="w-full relative group px-6 py-3 rounded-lg text-sm font-semibold overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:from-indigo-500 group-hover:to-purple-500 transition-all" />
            <span className="relative text-white">🔮 Predict Confidence</span>
          </button>
        </div>
      </div>

      {/* Prediction Results */}
      {prediction && (
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div
              className="p-6 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${
                  getConfidenceColor(prediction.confidence) === 'emerald' ? '#10b98120' :
                  getConfidenceColor(prediction.confidence) === 'cyan' ? '#06b6d420' :
                  getConfidenceColor(prediction.confidence) === 'amber' ? '#f59e0b20' :
                  '#f4344420'
                } 0%, transparent 100%)`
              }}
            >
              <div className="relative">
                <div className="text-center mb-6">
                  <div className="text-xs text-slate-400 mb-2">Success Probability</div>
                  <div className={`text-6xl font-bold text-${getConfidenceColor(prediction.confidence)}-300`}>
                    {Math.round(prediction.confidence)}%
                  </div>
                  <div className={`text-sm text-${getConfidenceColor(prediction.confidence)}-200 mt-2 capitalize`}>
                    {prediction.action} • {prediction.level}
                  </div>
                </div>

                {prediction.breakdown && (
                  <div className="space-y-2">
                    {Object.entries(prediction.breakdown).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                        <span className="text-xs text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-sm text-slate-200 font-semibold">{Math.round(value * 100)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="card p-5">
        <div className="text-sm text-slate-400 space-y-2">
          <p><strong className="text-slate-300">Model:</strong> ML-inspired weighted scoring combining historical performance, market regime, risk/reward, and timing factors.</p>
          <p><strong className="text-slate-300">Calibration:</strong> Sigmoid function ensures realistic probability estimates (not overconfident).</p>
        </div>
      </div>
    </div>
  )
}
