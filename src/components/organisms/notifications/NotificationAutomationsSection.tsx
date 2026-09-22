import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Sparkles,
  ClipboardList,
  Dumbbell,
  CalendarClock,
  Moon,
  ShieldCheck,
  Eye,
  Check,
} from 'lucide-react'
import { Card, Button } from '../../atoms'

export const NotificationAutomationsSection: React.FC = () => {
  const { t } = useTranslation('notifications')

  const [previewTemplate, setPreviewTemplate] = useState<{
    title: string
    content: string
  } | null>(null)

  const triggers = [
    {
      id: 'WELCOME_ANAMNESIS',
      icon: ClipboardList,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      title: t('automations.welcomeTitle'),
      description: t('automations.welcomeDesc'),
      defaultMessage:
        'Olá, {nome}! Seja bem-vindo à minha consultoria fitness. Para começarmos sua periodização personalizada, preencha sua anamnese de saúde aqui: {link}.',
    },
    {
      id: 'WORKOUT_LINK',
      icon: Dumbbell,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      title: t('automations.workoutTitle'),
      description: t('automations.workoutDesc'),
      defaultMessage:
        'Fala, {nome}! Sua nova ficha de treinos está pronta no aplicativo. Acesse a qualquer momento aqui: {link}. Bons treinos!',
    },
    {
      id: 'EXPIRATION_ALERT',
      icon: CalendarClock,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      title: t('automations.expirationTitle'),
      description: t('automations.expirationDesc'),
      defaultMessage:
        'Olá, {nome}! Sua ficha de treino atual está próxima do vencimento. Em breve iniciaremos sua nova fase!',
    },
  ]

  return (
    <div className="space-y-6" data-testid="notification-automations-section">
      {/* DND Info Banner */}
      <Card className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl border-none shadow-md">
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl flex-shrink-0">
              <Moon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{t('automations.dndTitle')}</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t('automations.dndActive')}
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-indigo-200/90 leading-relaxed max-w-2xl">
                {t('automations.dndDesc')}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Triggers List */}
      <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">{t('automations.title')}</h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">{t('automations.description')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {triggers.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between p-5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl border ${item.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      <Check className="h-3 w-3" />
                      Ativo
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200/60 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPreviewTemplate({
                        title: item.title,
                        content: item.defaultMessage,
                      })
                    }
                    className="text-xs text-slate-700 bg-white"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" />
                    Ver Modelo
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">{previewTemplate.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {previewTemplate.content}
            </div>

            <div className="flex justify-end">
              <Button type="button" size="sm" onClick={() => setPreviewTemplate(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
