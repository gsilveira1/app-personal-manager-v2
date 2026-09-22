import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Radio, Sparkles, ListOrdered } from 'lucide-react'
import {
  WhatsAppConnectionCard,
  NotificationAutomationsSection,
  NotificationQueueSection,
} from '../../components/organisms/notifications'

export const Notifications: React.FC = () => {
  const { t } = useTranslation('notifications')
  const [activeTab, setActiveTab] = useState<'connection' | 'automations' | 'queue'>('connection')

  return (
    <div className="space-y-6" data-testid="notifications-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('title')}</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">{t('subtitle')}</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('connection')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 -mb-px whitespace-nowrap ${
            activeTab === 'connection'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
          data-testid="tab-connection"
        >
          <Radio className="h-4 w-4" />
          <span>{t('tabs.connection')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('automations')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 -mb-px whitespace-nowrap ${
            activeTab === 'automations'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
          data-testid="tab-automations"
        >
          <Sparkles className="h-4 w-4" />
          <span>{t('tabs.automations')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 -mb-px whitespace-nowrap ${
            activeTab === 'queue'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
          data-testid="tab-queue"
        >
          <ListOrdered className="h-4 w-4" />
          <span>{t('tabs.queue')}</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'connection' && <WhatsAppConnectionCard />}
        {activeTab === 'automations' && <NotificationAutomationsSection />}
        {activeTab === 'queue' && <NotificationQueueSection />}
      </div>
    </div>
  )
}
export default Notifications
