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
    <nav className="glass-panel p-3 mb-6 border-2 border-indigo-500/20">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative group px-4 py-2.5 rounded-lg text-sm font-semibold transition-all overflow-hidden ${
                isActive ? '' : 'hover:scale-105'
              }`}
            >
              {isActive ? (
                <>
                  {/* Active state - premium gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-lg opacity-50" />
                  <span className="relative text-white flex items-center gap-2">
                    <span>{tab.icon}</span>
                    {tab.label}
                  </span>
                </>
              ) : (
                <>
                  {/* Inactive state - subtle hover */}
                  <div className="absolute inset-0 bg-slate-800/50 group-hover:bg-slate-700/50 transition-all" />
                  <span className="relative text-slate-300 group-hover:text-white flex items-center gap-2 transition-colors">
                    <span>{tab.icon}</span>
                    {tab.label}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
