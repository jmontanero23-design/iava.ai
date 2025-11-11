import { useState } from 'react'
import { getRecommendedLessons, getLearningPath } from '../utils/personalizedLearning.js'

export default function PersonalizedLearningPanel() {
  const [profile, setProfile] = useState({
    style: 'swing',
    experience: 'intermediate',
    weaknesses: [],
    goals: []
  })

  const [recommendations, setRecommendations] = useState(null)
  const [learningPath, setLearningPath] = useState(null)

  const handleGeneratePath = () => {
    try {
      const lessons = getRecommendedLessons(profile)
      const path = getLearningPath(profile)

      setRecommendations(lessons)
      setLearningPath(path)

      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Learning path generated', type: 'success' }
      }))
    } catch (error) {
      console.error('Path generation failed:', error)
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Failed to generate path: ' + error.message, type: 'error' }
      }))
    }
  }

  const weaknessOptions = ['Risk Management', 'Position Sizing', 'Discipline', 'Technical Analysis', 'Market Psychology']
  const goalOptions = ['Consistency', 'Bigger Profits', 'Better Entries', 'Risk Control', 'Advanced Strategies']

  const toggleItem = (array, item) => {
    return array.includes(item) ? array.filter(i => i !== item) : [...array, item]
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="card overflow-hidden">
        <div className="p-5 relative overflow-hidden border-b border-slate-700/50">
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-600 blur-lg opacity-50 animate-pulse" />
                <span className="relative text-2xl filter drop-shadow-lg">📚</span>
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-amber-200 to-orange-300 bg-clip-text text-transparent">
                  Personalized Learning
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Adaptive education based on your profile
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2">Trading Style</label>
              <select
                value={profile.style}
                onChange={e => setProfile({ ...profile, style: e.target.value })}
                className="select w-full bg-slate-800/50 border-slate-700/50 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
              >
                <option value="scalp">Scalper</option>
                <option value="day">Day Trader</option>
                <option value="swing">Swing Trader</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Experience Level</label>
              <select
                value={profile.experience}
                onChange={e => setProfile({ ...profile, experience: e.target.value })}
                className="select w-full bg-slate-800/50 border-slate-700/50 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Areas to Improve</label>
            <div className="flex flex-wrap gap-2">
              {weaknessOptions.map(weakness => (
                <button
                  key={weakness}
                  onClick={() => setProfile({ ...profile, weaknesses: toggleItem(profile.weaknesses, weakness) })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    profile.weaknesses.includes(weakness)
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {weakness}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Learning Goals</label>
            <div className="flex flex-wrap gap-2">
              {goalOptions.map(goal => (
                <button
                  key={goal}
                  onClick={() => setProfile({ ...profile, goals: toggleItem(profile.goals, goal) })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    profile.goals.includes(goal)
                      ? 'bg-orange-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGeneratePath}
            className="w-full relative group px-6 py-3 rounded-lg text-sm font-semibold overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 group-hover:from-amber-500 group-hover:to-orange-500 transition-all" />
            <span className="relative text-white">🎯 Generate Learning Path</span>
          </button>
        </div>
      </div>

      {/* Learning Path */}
      {learningPath && learningPath.lessons && learningPath.lessons.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-amber-900/20 to-orange-900/20">
            <h3 className="text-sm font-bold text-amber-200">Your Personalized Learning Path</h3>
            <p className="text-xs text-slate-400 mt-1">{learningPath.lessons.length} lessons • {learningPath.estimatedTime} total</p>
          </div>
          <div className="p-5 space-y-3">
            {learningPath.lessons.map((lesson, idx) => (
              <div key={idx} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30 hover:border-amber-500/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="px-2 py-1 rounded bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-300">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-200 mb-1">{lesson.title}</div>
                    <div className="text-xs text-slate-400 mb-2">{lesson.description}</div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        lesson.difficulty === 'beginner' ? 'bg-emerald-500/20 text-emerald-300' :
                        lesson.difficulty === 'intermediate' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-rose-500/20 text-rose-300'
                      }`}>
                        {lesson.difficulty}
                      </div>
                      <div className="text-xs text-slate-500">• {lesson.duration}</div>
                      {lesson.concepts && lesson.concepts.length > 0 && (
                        <div className="text-xs text-slate-500">• {lesson.concepts.join(', ')}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!learningPath && (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📚</div>
          <div className="text-xl font-bold text-slate-300 mb-2">
            Personalized Learning
          </div>
          <div className="text-sm text-slate-400 mb-6">
            Set your profile above to get a customized learning path tailored to your experience level, trading style, and goals
          </div>
        </div>
      )}

      {/* Info */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-slate-700/50">
          <h3 className="text-sm font-bold text-slate-200">How It Works</h3>
        </div>
        <div className="p-5 space-y-3 text-sm text-slate-400">
          <p>
            <strong className="text-slate-300">Adaptive Curriculum:</strong> Lessons are prioritized based on your weaknesses and adjusted for your experience level.
          </p>
          <p>
            <strong className="text-slate-300">Progressive Difficulty:</strong> Start with fundamentals, gradually progress to advanced concepts as you demonstrate mastery.
          </p>
          <p>
            <strong className="text-slate-300">Goal-Oriented:</strong> Focus on skills that directly support your trading goals (consistency, profitability, risk control).
          </p>
        </div>
      </div>
    </div>
  )
}
