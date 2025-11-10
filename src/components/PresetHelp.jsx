import React from 'react'
import InfoPopover from './InfoPopover.jsx'

export default function PresetHelp({ descriptions = {} }) {
  const items = [
    { id: 'trendDaily', label: 'Trend + Daily', hint: descriptions.trendDaily },
    { id: 'pullbackDaily', label: 'Pullback + Daily', hint: descriptions.pullbackDaily },
    { id: 'intradayBreakout', label: 'Intraday Breakout', hint: descriptions.intradayBreakout },
    { id: 'dailyTrendFollow', label: 'Daily Trend Follow', hint: descriptions.dailyTrendFollow },
    { id: 'meanRevertIntraday', label: 'Mean Revert (Intra)', hint: descriptions.meanRevertIntraday },
    { id: 'breakoutDailyStrong', label: 'Breakout (Daily, Strong)', hint: descriptions.breakoutDailyStrong },
    { id: 'momentumContinuation', label: 'Momentum Continuation', hint: descriptions.momentumContinuation },
  ]
  return (
    <InfoPopover title="Strategy Presets">
      <div className="text-sm">
        <div className="text-slate-300 mb-2">When to use each preset</div>
        <ul className="space-y-1 list-disc pl-5 text-slate-300">
          {items.map(it => (
            <li key={it.id}><span className="text-slate-200 font-medium">{it.label}:</span> {it.hint}</li>
          ))}
        </ul>
        <div className="mt-2 text-xs text-slate-400">Tip: red chips on the chart show overlays a preset expects but are currently OFF.</div>
      </div>
    </InfoPopover>
  )
}

