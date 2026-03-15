import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { UserPlus, Clock, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../store/store'
import { ClientStatus } from '../types'
import { StatCard } from '../components/molecules/StatCard'
import { EmptyState } from '../components/molecules/EmptyState'
import { LeadDrawer } from '../components/organisms/leads/LeadDrawer'
import { LeadKanban } from '../components/organisms/leads/LeadKanban'
import { type LeadStage, STAGES, parseStage, encodeNotes } from '../utils/leadHelpers'
import type { Client } from '../types'

export const Leads = () => {
  const { t } = useTranslation('leads')
  const navigate = useNavigate()
  const { clients, plans, updateClient, convertLead } = useStore()
  const [selectedLead, setSelectedLead] = useState<Client | null>(null)

  const leads = useMemo(() => clients.filter((c) => c.status === ClientStatus.Lead), [clients])

  const totalThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86_400_000
    return leads.filter((l) => new Date((l as any).createdAt ?? 0).getTime() > weekAgo).length
  }, [leads])

  const totalClients = clients.filter((c) => c.status === ClientStatus.Active).length
  const conversionRate = totalClients + leads.length > 0 ? Math.round((totalClients / (totalClients + leads.length)) * 100) : 0

  const avgAgeDays = useMemo(() => {
    if (leads.length === 0) return 0
    const sum = leads.reduce((acc, l) => acc + Math.floor((Date.now() - new Date((l as any).createdAt ?? 0).getTime()) / 86_400_000), 0)
    return Math.round(sum / leads.length)
  }, [leads])

  const byStage = useMemo(() => {
    const groups: Record<LeadStage, Client[]> = { New: [], Contacted: [], Interested: [], Won: [], Lost: [] }
    for (const lead of leads) groups[parseStage(lead.notes)].push(lead)
    return groups
  }, [leads])

  const handleStageChange = async (id: string, stage: LeadStage, userNotes: string) => {
    await updateClient(id, { notes: encodeNotes(stage, userNotes) })
  }

  const handleConvert = async (id: string, planId?: string) => {
    await convertLead(id, planId)
    setSelectedLead(null)
    navigate(`/clients/${id}`)
  }

  const handleMarkLost = async (id: string) => {
    if (window.confirm(t('markAsLostConfirm'))) {
      await updateClient(id, { status: ClientStatus.Inactive })
      setSelectedLead(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title={t('newThisWeek')} value={String(totalThisWeek)} icon={Clock} description={t('newThisWeek')} />
        <StatCard title={t('conversionRate')} value={`${conversionRate}%`} icon={TrendingUp} description={t('conversionRate')} />
        <StatCard title={t('avgLeadAge')} value={`${avgAgeDays}d`} icon={UserPlus} description={t('avgLeadAge')} />
      </div>

      {leads.length === 0 && <EmptyState icon={UserPlus} title={t('noLeads')} description={t('noLeadsMessage')} />}

      {leads.length > 0 && <LeadKanban stages={STAGES} byStage={byStage} onLeadClick={setSelectedLead} />}

      {selectedLead && (
        <LeadDrawer lead={selectedLead} plans={plans} onClose={() => setSelectedLead(null)} onStageChange={handleStageChange} onConvert={handleConvert} onMarkLost={handleMarkLost} />
      )}
    </div>
  )
}
