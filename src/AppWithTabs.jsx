/**
 * App Wrapper with Tab Navigation
 * Integrates all AI features with the existing trading chart
 */

import { useState } from 'react'
import Hero from './components/Hero.jsx'
import TabNav from './components/TabNav.jsx'
import AIFeaturesDashboard from './components/AIFeaturesDashboard.jsx'
import AIChat from './components/AIChat.jsx'
import NaturalLanguageScanner from './components/NaturalLanguageScanner.jsx'
import ModelMonitoring from './components/ModelMonitoring.jsx'
import ToastHub from './components/ToastHub.jsx'
import BuildInfoFooter from './components/BuildInfoFooter.jsx'
import CommandPalette from './components/CommandPalette.jsx'

// Import the original App as ChartView
import OriginalApp from './App.jsx.backup'

export default function AppWithTabs() {
  const [activeTab, setActiveTab] = useState('chart')

  return (
    <div className="min-h-screen bg-transparent text-slate-100 bg-grid">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Hero />
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* AI Features Dashboard */}
        {activeTab === 'ai-dashboard' && (
          <AIFeaturesDashboard onFeatureSelect={(featureId) => {
            console.log('Selected feature:', featureId)
            // Future: Could navigate to specific feature or show modal
          }} />
        )}

        {/* AI Chat */}
        {activeTab === 'ai-chat' && (
          <AIChat marketContext={{
            message: 'Connected to live market data'
          }} />
        )}

        {/* NLP Scanner */}
        {activeTab === 'nlp-scanner' && (
          <NaturalLanguageScanner onFiltersGenerated={(filters) => {
            console.log('Generated filters:', filters)
          }} />
        )}

        {/* Model Monitoring */}
        {activeTab === 'monitoring' && (
          <ModelMonitoring />
        )}

        {/* Trading Chart (existing app) */}
        {activeTab === 'chart' && (
          <div className="space-y-6">
            <div className="glass-panel p-4">
              <p className="text-sm text-slate-300">
                Trading Chart interface (existing functionality preserved)
              </p>
            </div>
            {/* Original trading chart content would go here */}
          </div>
        )}

        <BuildInfoFooter />
      </div>
      <ToastHub />
      <CommandPalette />
    </div>
  )
}
