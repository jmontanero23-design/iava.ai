/**
 * AVA Mind Component Library
 *
 * World-class AI Digital Twin visualization components for iAVA.ai
 *
 * Main export is AVAMindDashboard - the full-screen dashboard experience.
 * Individual components can be imported for custom layouts.
 */

// Main dashboard (default export)
export { default } from './AVAMindDashboard.jsx'
export { default as AVAMindDashboard } from './AVAMindDashboard.jsx'

// Individual visualization components
export { default as AVAOrb, AVAOrbMini } from './AVAOrb.jsx'
export { default as HexGrid, HexGridCompact } from './HexGrid.jsx'
export { default as EmotionTimeline, EmotionIndicator } from './EmotionTimeline.jsx'
export { default as TradingPatternChart } from './TradingPatternChart.jsx'
export {
  default as InsightCard,
  InsightList,
  WhatWouldAVADo
} from './InsightCard.jsx'
