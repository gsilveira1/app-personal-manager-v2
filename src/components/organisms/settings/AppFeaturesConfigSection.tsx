import React, { useState } from 'react'
import { Sliders, Sparkles, MessageSquare, Calendar, Activity, Save, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card, Button } from '../../atoms'

/**
 * Interface defining client application feature configuration flags.
 */
export interface AppFeaturesConfig {
  enableAiAssistant: boolean
  enableWorkoutFeedback: boolean
  enableOnlineBooking: boolean
  enablePostureAnalysis: boolean
}

/**
 * Initial default feature configuration settings.
 */
const DEFAULT_CONFIG: AppFeaturesConfig = {
  enableAiAssistant: true,
  enableWorkoutFeedback: true,
  enableOnlineBooking: true,
  enablePostureAnalysis: false,
}

/**
 * Organism component allowing personal trainers to configure feature flags
 * and settings for their clients' mobile app experience.
 *
 * @returns The rendered app feature configuration section component.
 */
export const AppFeaturesConfigSection: React.FC = () => {
  const { t } = useTranslation('settings')

  const [config, setConfig] = useState<AppFeaturesConfig>(() => {
    const saved = localStorage.getItem('trainer_app_features_config')
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG
  })

  const [isSaving, setIsSaving] = useState(false)
  const [showSavedFeedback, setShowSavedFeedback] = useState(false)

  const toggleFeature = (key: keyof AppFeaturesConfig) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setShowSavedFeedback(false)

    setTimeout(() => {
      localStorage.setItem('trainer_app_features_config', JSON.stringify(config))
      setIsSaving(false)
      setShowSavedFeedback(true)
      setTimeout(() => setShowSavedFeedback(false), 3000)
    }, 400)
  }

  const featureItems: Array<{
    key: keyof AppFeaturesConfig
    icon: React.ElementType
    titleKey: string
    descKey: string
  }> = [
    {
      key: 'enableAiAssistant',
      icon: Sparkles,
      titleKey: 'enableAiAssistant',
      descKey: 'enableAiAssistantDesc',
    },
    {
      key: 'enableWorkoutFeedback',
      icon: MessageSquare,
      titleKey: 'enableWorkoutFeedback',
      descKey: 'enableWorkoutFeedbackDesc',
    },
    {
      key: 'enableOnlineBooking',
      icon: Calendar,
      titleKey: 'enableOnlineBooking',
      descKey: 'enableOnlineBookingDesc',
    },
    {
      key: 'enablePostureAnalysis',
      icon: Activity,
      titleKey: 'enablePostureAnalysis',
      descKey: 'enablePostureAnalysisDesc',
    },
  ]

  return (
    <Card data-testid="app-features-config-section">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center">
          <Sliders className="mr-3 h-5 w-5 text-indigo-600" />
          {t('appFeaturesConfig')}
        </h2>
        <p className="text-sm text-slate-500 mt-1">{t('appFeaturesConfigSubtitle')}</p>
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-4">
        {showSavedFeedback && (
          <div className="p-4 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-3" role="alert">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-medium">{t('settingsSaved')}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featureItems.map((item) => {
            const Icon = item.icon
            const isEnabled = config[item.key]

            return (
              <div
                key={item.key}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start space-x-4 ${
                  isEnabled ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200 bg-slate-50/50 opacity-80'
                }`}
                onClick={() => toggleFeature(item.key)}
                data-testid={`feature-card-${item.key}`}
              >
                <div className={`p-2.5 rounded-lg ${isEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{t(item.titleKey as any)}</h3>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={isEnabled}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFeature(item.key)
                      }}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                      }`}
                      data-testid={`toggle-${item.key}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t(item.descKey as any)}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSaving} data-testid="save-app-features-btn">
            <Save className="mr-2 h-4 w-4" />
            {t('saveAppFeatures')}
          </Button>
        </div>
      </form>
    </Card>
  )
}
