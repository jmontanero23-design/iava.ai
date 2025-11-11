/**
 * Simplified App with All AI Features Visible
 * Shows logo, navigation, and all AI features on one page
 */

import { useState } from 'react'
import Hero from './components/Hero.jsx'
import AIFeaturesDashboard from './components/AIFeaturesDashboard.jsx'
import AIChat from './components/AIChat.jsx'
import NaturalLanguageScanner from './components/NaturalLanguageScanner.jsx'
import ModelMonitoring from './components/ModelMonitoring.jsx'
import ToastHub from './components/ToastHub.jsx'
import BuildInfoFooter from './components/BuildInfoFooter.jsx'

export default function AppSimple() {
  const [selectedFeature, setSelectedFeature] = useState(null)

  return (
    <div className="min-h-screen bg-transparent text-slate-100 bg-grid">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Hero />

        {/* Quick Navigation */}
        <div className="glass-panel p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedFeature(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !selectedFeature
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              📊 All Features
            </button>
            <button
              onClick={() => setSelectedFeature('chat')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFeature === 'chat'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              💬 AI Chat
            </button>
            <button
              onClick={() => setSelectedFeature('scanner')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFeature === 'scanner'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              🔍 NLP Scanner
            </button>
            <button
              onClick={() => setSelectedFeature('monitoring')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFeature === 'monitoring'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              📈 Monitoring
            </button>
          </div>
        </div>

        {/* Content */}
        {!selectedFeature && (
          <AIFeaturesDashboard onFeatureSelect={setSelectedFeature} />
        )}

        {selectedFeature === 'chat' && (
          <AIChat marketContext={{
            message: 'AI Assistant ready - ask me anything about trading!'
          }} />
        )}

        {selectedFeature === 'scanner' && (
          <NaturalLanguageScanner onFiltersGenerated={(filters) => {
            console.log('Filters:', filters)
            window.dispatchEvent(new CustomEvent('iava.toast', {
              detail: {
                text: 'Filters generated successfully!',
                type: 'success'
              }
            }))
          }} />
        )}

        {selectedFeature === 'monitoring' && (
          <ModelMonitoring />
        )}

        <BuildInfoFooter />
      </div>
      <ToastHub />
    </div>
  )
}
