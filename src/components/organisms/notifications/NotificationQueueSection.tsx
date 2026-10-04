import React from 'react'
import { useTranslation } from 'react-i18next'
import { WhatsAppQueueManager } from './WhatsAppQueueManager'

export const NotificationQueueSection: React.FC = () => {
  const { t } = useTranslation('notifications')

  return (
    <div className="space-y-4" data-testid="notification-queue-section">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">{t('queue.title')}</h2>
        <p className="text-sm text-slate-600 mt-1">{t('queue.subtitle')}</p>
      </div>

      <WhatsAppQueueManager />
    </div>
  )
}
