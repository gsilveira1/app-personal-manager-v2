import React from 'react'
import { useTranslation } from 'react-i18next'
import { NotificationQueueSection } from '../../components/organisms/notifications'

export const Notifications: React.FC = () => {
  const { t } = useTranslation('notifications')

  return (
    <div className="space-y-6" data-testid="notifications-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('title')}</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">{t('subtitle')}</p>
      </div>

      {/* Main Queue & Dispatch Section */}
      <NotificationQueueSection />
    </div>
  )
}
export default Notifications

