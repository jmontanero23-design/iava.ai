/**
 * ArchetypeReveal - Dramatic Archetype Reveal Component
 * 
 * NEW FILE - Add to src/components/ava-mind/
 * 
 * Shows a beautiful animated reveal when user completes onboarding
 * and discovers their trading archetype.
 */

import React, { useState, useEffect } from 'react'
import { TRADING_ARCHETYPES, PERSONALITY_DIMENSIONS } from '../../services/avaMindPersonality.js'

export default function ArchetypeReveal({ archetype, profile, onContinue, onRetake }) {
  const [stage, setStage] = useState('loading') // loading, reveal, details
  const [showTraits, setShowTraits] = useState(false)
  
  const primary = archetype?.primary
  const secondary = archetype?.secondary
  const a = primary?.archetype
  
  // Animation sequence
  useEffect(() => {
    const timer1 = setTimeout(() => setStage('reveal'), 1500)
    const timer2 = setTimeout(() => setShowTraits(true), 2500)
    const timer3 = setTimeout(() => setStage('details'), 3000)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])
  
  if (!a) return null
  
  // Get top 4 traits
  const sortedTraits = Object.entries(PERSONALITY_DIMENSIONS)
    .map(([id, dim]) => ({
      ...dim,
      value: profile?.[id] || 50
    }))
    .sort((a, b) => Math.abs(b.value - 50) - Math.abs(a.value - 50))
    .slice(0, 4)
  
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-30 animate-pulse"
          style={{ 
            background: `radial-gradient(circle, ${a.color}40, transparent)`,
            top: '10%',
            left: '20%',
            animationDuration: '4s'
          }}
        />
        <div 
          className="absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ 
            background: `radial-gradient(circle, ${a.color}30, transparent)`,
            bottom: '20%',
            right: '15%',
            animationDuration: '5s',
            animationDelay: '1s'
          }}
        />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(${a.color}20 1px, transparent 1px), linear-gradient(90deg, ${a.color}20 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl">
        
        {/* Loading state */}
        {stage === 'loading' && (
          <div className="animate-pulse">
            <div className="text-6xl mb-6">🧠</div>
            <p className="text-slate-400 text-lg">Analyzing your trading DNA...</p>
            <div className="mt-8 flex justify-center gap-2">
              {[0, 1, 2].map(i => (
                <div 
                  key={i}
                  className="w-3 h-3 rounded-full bg-violet-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Reveal state */}
        {stage !== 'loading' && (
          <>
            {/* Archetype emoji with glow */}
            <div 
              className={`text-8xl mb-6 transition-all duration-1000 ${
                stage === 'reveal' ? 'scale-100 opacity-100' : 'scale-150 opacity-0'
              }`}
              style={{
                filter: `drop-shadow(0 0 40px ${a.color}80)`,
                animation: 'float 3s ease-in-out infinite'
              }}
            >
              {a.emoji}
            </div>
            
            {/* Archetype name */}
            <h1 
              className={`text-5xl md:text-6xl font-bold mb-3 transition-all duration-700 delay-300 ${
                stage === 'reveal' ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ color: a.color }}
            >
              {a.name}
            </h1>
            
            {/* Tagline */}
            <p 
              className={`text-xl text-slate-300 mb-2 transition-all duration-700 delay-500 ${
                stage === 'reveal' ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
            >
              "{a.tagline}"
            </p>
            
            {/* Match percentage */}
            <div 
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 transition-all duration-700 delay-700 ${
                stage === 'reveal' ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ backgroundColor: `${a.color}20`, border: `1px solid ${a.color}40` }}
            >
              <span style={{ color: a.color }} className="font-bold text-lg">
                {primary.score}%
              </span>
              <span className="text-slate-400">match</span>
            </div>
            
            {/* Description */}
            <p 
              className={`text-slate-300 text-lg leading-relaxed mb-8 transition-all duration-700 delay-1000 ${
                stage === 'details' ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
            >
              {a.description}
            </p>
            
            {/* Personality traits */}
            {showTraits && (
              <div className="grid grid-cols-2 gap-3 mb-8">
                {sortedTraits.map((trait, i) => (
                  <div 
                    key={trait.id}
                    className="glass-panel p-3 text-left transition-all duration-500"
                    style={{ 
                      animationDelay: `${i * 100}ms`,
                      opacity: stage === 'details' ? 1 : 0,
                      transform: stage === 'details' ? 'translateY(0)' : 'translateY(20px)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">{trait.emoji} {trait.name}</span>
                      <span className="text-sm font-bold" style={{ color: trait.color }}>
                        {trait.value}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${trait.value}%`,
                          background: `linear-gradient(90deg, ${trait.color}80, ${trait.color})`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Strengths & Weaknesses */}
            {stage === 'details' && (
              <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                <div className="glass-panel p-4">
                  <h4 className="text-emerald-400 text-sm font-semibold mb-3 flex items-center gap-2">
                    <span>✨</span> Your Superpowers
                  </h4>
                  {a.strengths.map((s, i) => (
                    <div key={i} className="text-sm text-slate-300 mb-1.5 flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
                <div className="glass-panel p-4">
                  <h4 className="text-amber-400 text-sm font-semibold mb-3 flex items-center gap-2">
                    <span>⚠️</span> Watch Out For
                  </h4>
                  {a.weaknesses.map((w, i) => (
                    <div key={i} className="text-sm text-slate-300 mb-1.5 flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">!</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Secondary archetype hint */}
            {secondary && stage === 'details' && (
              <p className="text-sm text-slate-500 mb-8">
                Secondary influence: {secondary.archetype.emoji} {secondary.archetype.name} ({secondary.score}%)
              </p>
            )}
            
            {/* Action buttons */}
            {stage === 'details' && (
              <div className="flex justify-center gap-4">
                <button
                  onClick={onRetake}
                  className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
                >
                  Retake Quiz
                </button>
                <button
                  onClick={onContinue}
                  className={`px-8 py-3 rounded-xl font-semibold text-white transition-all bg-gradient-to-r ${a.gradient} hover:scale-105 shadow-lg`}
                  style={{ boxShadow: `0 8px 32px ${a.color}40` }}
                >
                  Meet Your AVA →
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* CSS for float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .glass-panel {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 12px;
        }
      `}</style>
    </div>
  )
}
