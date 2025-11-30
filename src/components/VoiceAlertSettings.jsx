/**
 * Voice Alert Settings Component
 *
 * PhD++ Quality settings panel for configuring AVA voice alerts:
 * - Enable/disable voice alerts
 * - Set confidence thresholds
 * - Configure quiet hours
 * - Toggle individual alert types
 * - Test voice output
 */

import React, { useState, useEffect } from 'react'
import {
  getVoiceSettings,
  updateVoiceSettings,
  setQuietHours,
  setAlertThreshold,
  toggleAlertType,
  setVoiceAlertsEnabled,
  testVoiceAlert,
  isQuietHours
} from '../services/voiceAlertService.js'

export default function VoiceAlertSettings({ className = '' }) {
  const [settings, setSettings] = useState(null)
  const [isInQuietHours, setIsInQuietHours] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  // Load settings
  useEffect(() => {
    setSettings(getVoiceSettings())
    setIsInQuietHours(isQuietHours())

    // Check quiet hours status every minute
    const interval = setInterval(() => {
      setIsInQuietHours(isQuietHours())
    }, 60000)

    // Listen for settings changes
    const handleChange = () => setSettings(getVoiceSettings())
    window.addEventListener('ava.voiceSettingsChanged', handleChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('ava.voiceSettingsChanged', handleChange)
    }
  }, [])

  if (!settings) {
    return <div className="animate-pulse bg-slate-800/50 rounded-xl h-64" />
  }

  const handleToggleEnabled = () => {
    const newEnabled = setVoiceAlertsEnabled(!settings.enabled)
    setSettings({ ...settings, enabled: newEnabled })
  }

  const handleToggleAlertType = (type) => {
    const newTypes = toggleAlertType(type, !settings.alertTypes[type])
    setSettings({ ...settings, alertTypes: newTypes })
  }

  const handleConfidenceChange = (value) => {
    const newSettings = setAlertThreshold('confidence', parseInt(value))
    setSettings(newSettings)
  }

  const handleChangeChange = (value) => {
    const newSettings = setAlertThreshold('change', parseFloat(value))
    setSettings(newSettings)
  }

  const handleQuietHoursToggle = () => {
    const newQH = setQuietHours(
      !settings.quietHours.enabled,
      settings.quietHours.start,
      settings.quietHours.end
    )
    setSettings({ ...settings, quietHours: newQH })
    setIsInQuietHours(isQuietHours())
  }

  const handleQuietHoursChange = (field, value) => {
    const newQH = setQuietHours(
      settings.quietHours.enabled,
      field === 'start' ? parseInt(value) : settings.quietHours.start,
      field === 'end' ? parseInt(value) : settings.quietHours.end
    )
    setSettings({ ...settings, quietHours: newQH })
    setIsInQuietHours(isQuietHours())
  }

  const handleTest = async () => {
    setIsTesting(true)
    await testVoiceAlert()
    setTimeout(() => setIsTesting(false), 3000)
  }

  const formatHour = (hour) => {
    const h = hour % 12 || 12
    const ampm = hour < 12 ? 'AM' : 'PM'
    return `${h}:00 ${ampm}`
  }

  return (
    <div className={`bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {settings.enabled ? (isInQuietHours ? '🌙' : '🔊') : '🔇'}
          </span>
          <div>
            <h3 className="text-white font-semibold">Voice Alerts</h3>
            <p className="text-xs text-slate-400">
              {settings.enabled
                ? isInQuietHours
                  ? 'Quiet hours active'
                  : 'AVA will speak alerts'
                : 'Voice alerts disabled'}
            </p>
          </div>
        </div>

        {/* Master toggle */}
        <button
          onClick={handleToggleEnabled}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            settings.enabled ? 'bg-emerald-500' : 'bg-slate-700'
          }`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              settings.enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {settings.enabled && (
        <>
          {/* Alert Types */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-400 mb-3">Alert Types</h4>
            <div className="space-y-2">
              {[
                { key: 'forecast', label: 'Forecast Alerts', icon: '🔮', desc: 'High confidence predictions' },
                { key: 'priceTarget', label: 'Price Targets', icon: '🎯', desc: 'When targets are hit' },
                { key: 'tradeExecuted', label: 'Trade Execution', icon: '💰', desc: 'Trust Mode trades' },
                { key: 'positionAlert', label: 'Position Alerts', icon: '⚠️', desc: 'Copilot warnings' },
                { key: 'dailySummary', label: 'Daily Summary', icon: '📊', desc: 'End of day recap' }
              ].map(({ key, label, icon, desc }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{icon}</span>
                    <div>
                      <div className="text-sm text-white">{label}</div>
                      <div className="text-xs text-slate-500">{desc}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleAlertType(key)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      settings.alertTypes[key] ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.alertTypes[key] ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Thresholds */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-400 mb-3">Alert Thresholds</h4>
            <div className="space-y-4">
              {/* Confidence threshold */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white">Min Confidence</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {settings.forecastConfidenceMin}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={settings.forecastConfidenceMin}
                  onChange={(e) => handleConfidenceChange(e.target.value)}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>50%</span>
                  <span>More alerts</span>
                  <span>95%</span>
                </div>
              </div>

              {/* Change threshold */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white">Min Price Change</span>
                  <span className="text-sm font-bold text-cyan-400">
                    {settings.forecastChangeMin.toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={settings.forecastChangeMin}
                  onChange={(e) => handleChangeChange(e.target.value)}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0.5%</span>
                  <span>Small moves</span>
                  <span>5%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-400">Quiet Hours</h4>
              <button
                onClick={handleQuietHoursToggle}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  settings.quietHours.enabled ? 'bg-indigo-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.quietHours.enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {settings.quietHours.enabled && (
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 block mb-1">From</label>
                    <select
                      value={settings.quietHours.start}
                      onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                      className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{formatHour(i)}</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-slate-500 mt-4">to</span>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 block mb-1">Until</label>
                    <select
                      value={settings.quietHours.end}
                      onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                      className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{formatHour(i)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {isInQuietHours && (
                  <div className="mt-3 flex items-center gap-2 text-indigo-400 text-xs">
                    <span>🌙</span>
                    <span>Quiet hours are currently active</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Test Button */}
          <button
            onClick={handleTest}
            disabled={isTesting}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${
              isTesting
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
            }`}
          >
            {isTesting ? '🔊 Testing...' : '🔊 Test Voice Alert'}
          </button>
        </>
      )}

      {/* Disabled state message */}
      {!settings.enabled && (
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">🔇</span>
          <p className="text-slate-400 text-sm">
            Voice alerts are disabled. Enable them to hear AVA speak predictions and alerts.
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Compact voice toggle for headers/toolbars
 */
export function VoiceAlertToggle({ className = '' }) {
  const [enabled, setEnabled] = useState(true)
  const [isQuiet, setIsQuiet] = useState(false)

  useEffect(() => {
    const settings = getVoiceSettings()
    setEnabled(settings.enabled)
    setIsQuiet(isQuietHours())

    const handleChange = () => {
      const settings = getVoiceSettings()
      setEnabled(settings.enabled)
      setIsQuiet(isQuietHours())
    }

    window.addEventListener('ava.voiceSettingsChanged', handleChange)
    const interval = setInterval(() => setIsQuiet(isQuietHours()), 60000)

    return () => {
      window.removeEventListener('ava.voiceSettingsChanged', handleChange)
      clearInterval(interval)
    }
  }, [])

  const handleToggle = () => {
    const newEnabled = setVoiceAlertsEnabled(!enabled)
    setEnabled(newEnabled)
  }

  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-lg transition-all ${
        enabled
          ? isQuiet
            ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
          : 'bg-slate-700/50 text-slate-500 hover:bg-slate-700'
      } ${className}`}
      title={enabled ? (isQuiet ? 'Quiet hours active' : 'Voice alerts on') : 'Voice alerts off'}
    >
      {enabled ? (isQuiet ? '🌙' : '🔊') : '🔇'}
    </button>
  )
}
