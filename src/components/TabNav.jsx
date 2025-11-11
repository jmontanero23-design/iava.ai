/**
 * Tab Navigation Component
 * Main navigation for switching between Chart and AI features
 */

export default function TabNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'chart', label: 'Trading Chart', icon: '📈' },
    { id: 'ai-dashboard', label: 'AI Features', icon: '🤖' },
    { id: 'ai-chat', label: 'AI Chat', icon: '💬' },
    { id: 'nlp-scanner', label: 'NLP Scanner', icon: '🔍' },
    { id: 'monitoring', label: 'Model Monitoring', icon: '📊' }
  ]

  return (
    <nav className="glass-panel p-2 mb-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
