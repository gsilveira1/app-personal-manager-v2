import React, { useState } from 'react'
import {
  Phone,
  Mail,
  MessageSquare,
  X,
  CheckCircle2,
  XCircle,
  Dumbbell,
  Globe,
  MapPin,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Client, Plan } from '../../../types'
import { Card, Button, Select, Label } from '../../atoms'
import { type LeadStage, STAGES, parseStage, parseUserNotes, daysAgo, interestLabel, whatsappUrl } from '../../../utils/leadHelpers'

interface LeadDrawerProps {
  lead: Client
  plans: Plan[]
  onClose: () => void
  onStageChange: (id: string, stage: LeadStage, notes: string) => void
  onConvert: (id: string, planId?: string) => void
  onMarkLost: (id: string) => void
}

export const LeadDrawer: React.FC<LeadDrawerProps> = ({ lead, plans, onClose, onStageChange, onConvert, onMarkLost }) => {
  const { t } = useTranslation('leads')
  const { t: tc } = useTranslation('clients')
  const stage = parseStage(lead.notes)
  const userNotes = parseUserNotes(lead.notes)
  const [localStage, setLocalStage] = useState<LeadStage>(stage)
  const [localNotes, setLocalNotes] = useState(userNotes)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [converting, setConverting] = useState(false)

  const handleStageChange = (newStage: LeadStage) => {
    setLocalStage(newStage)
    onStageChange(lead.id, newStage, localNotes)
  }

  const handleNotesBlur = () => {
    onStageChange(lead.id, localStage, localNotes)
  }

  const handleConvert = async () => {
    setConverting(true)
    await onConvert(lead.id, selectedPlanId || undefined)
    setConverting(false)
    setShowConvertModal(false)
  }

  const created = (lead as any).createdAt as string | undefined

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer panel */}
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{lead.name}</h2>
              {created && <p className="text-xs text-slate-400">{daysAgo(created, t)}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Contact info */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('contact')}</h3>
            <a
              href={whatsappUrl(lead.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors group"
            >
              <Phone className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">{lead.phone}</span>
              <span className="ml-auto text-xs text-green-600 font-medium opacity-0 group-hover:opacity-100">{t('openWhatsApp')}</span>
            </a>
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <Mail className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-700">{lead.email}</span>
            </a>
          </section>

          {/* Interest */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('interest')}</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                {lead.type === 'Online' ? <Globe className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                {interestLabel(lead.type, tc)}
              </span>
              {lead.goal && (
                <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  <Dumbbell className="h-3.5 w-3.5" />
                  {lead.goal}
                </span>
              )}
            </div>
          </section>

          {/* Stage */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('stage')}</h3>
            <div className="flex gap-2">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleStageChange(s.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border-2 transition-all ${localStage === s.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                >
                  {t(s.labelKey)}
                </button>
              ))}
            </div>
          </section>

          {/* Notes */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> {t('notes', { ns: 'schedule' })}
            </h3>
            <textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder={t('addNotes')}
              rows={4}
              className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </section>
        </div>

        {/* Action footer */}
        <div className="p-5 border-t border-slate-200 space-y-3">
          <Button
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setShowConvertModal(true)}
          >
            <CheckCircle2 className="h-4 w-4" />
            {t('convertToClient')}
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => onMarkLost(lead.id)}
          >
            <XCircle className="h-4 w-4" />
            {t('markAsLost')}
          </Button>
        </div>
      </div>

      {/* Convert modal (on top of drawer) */}
      {showConvertModal && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30">
          <Card className="w-full max-w-sm p-6 m-4">
            <h3 className="text-lg font-bold text-slate-900 mb-1">{t('convertLeadTitle')}</h3>
            <p className="text-sm text-slate-500 mb-5">
              {t('convertLeadSubtitle', { name: lead.name })}
            </p>
            <div className="space-y-2 mb-5">
              <Label htmlFor="plan-select">{t('subscriptionPlanOptional')}</Label>
              <Select
                id="plan-select"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
              >
                <option value="">{t('noPlanYet')}</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowConvertModal(false)}>
                {t('cancel', { ns: 'common' })}
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={converting}
                onClick={handleConvert}
              >
                {converting ? t('loading', { ns: 'common' }) : t('confirm', { ns: 'common' })}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
