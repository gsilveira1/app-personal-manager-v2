import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ListChecks, MessageCircle, Zap } from 'lucide-react'
import { TabBar } from '../../components/molecules/TabBar'
import { NotificationQueueSection, WhatsAppConnectionCard, NotificationAutomationsSection } from '../../components/organisms/notifications'

const TAB_PARAM = 'tab'
const DEFAULT_TAB = 'queue'

/** One entry per tab: its `?tab=` value, its icon and the section it mounts. */
const TABS = [
  { id: 'queue', icon: ListChecks, Section: NotificationQueueSection },
  { id: 'whatsapp', icon: MessageCircle, Section: WhatsAppConnectionCard },
  { id: 'automations', icon: Zap, Section: NotificationAutomationsSection },
] as const

type NotificationTab = (typeof TABS)[number]['id']

const findTab = (id: string | null) => TABS.find((tab) => tab.id === id) ?? TABS[0]

export const Notifications: React.FC = () => {
  const { t } = useTranslation('notifications')
  const [searchParams, setSearchParams] = useSearchParams()
  const active = findTab(searchParams.get(TAB_PARAM))

  const handleTabChange = (tab: NotificationTab) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (tab === DEFAULT_TAB) next.delete(TAB_PARAM)
      else next.set(TAB_PARAM, tab)
      return next
    })
  }

  const tabs = TABS.map(({ id, icon }) => ({ id, icon, label: t(`tabs.${id}`) }))

  return (
    <div className="space-y-6" data-testid="notifications-page">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('title')}</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">{t('subtitle')}</p>
      </div>

      <TabBar tabs={tabs} activeTab={active.id} onChange={handleTabChange} ariaLabel={t('tabs.ariaLabel')} className="w-fit" />

      <div role="tabpanel" aria-label={t(`tabs.${active.id}`)}>
        <active.Section />
      </div>
    </div>
  )
}
export default Notifications
