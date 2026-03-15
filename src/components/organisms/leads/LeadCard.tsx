import React from 'react'
import { Phone, Mail, ChevronRight, Globe, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Client } from '../../../types'
import { type LeadStage, STAGES, daysAgo, interestLabel, whatsappUrl } from '../../../utils/leadHelpers'

interface LeadCardProps {
  client: Client
  stage: LeadStage
  onClick: () => void
}

export const LeadCard: React.FC<LeadCardProps> = ({ client, stage, onClick }) => {
  const { t } = useTranslation('leads')
  const { t: tc } = useTranslation('clients')
  const stageInfo = STAGES.find((s) => s.id === stage)!
  const created = (client as any).createdAt as string | undefined

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group"
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{client.name}</p>
          {created && <p className="text-xs text-slate-400">{daysAgo(created, t)}</p>}
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
      </div>

      {/* Interest + stage badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${stageInfo.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${stageInfo.dot}`} />
          {t(stageInfo.labelKey)}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
          {client.type === 'Online' ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
          {interestLabel(client.type, tc)}
        </span>
      </div>

      {/* Contact quick-links */}
      <div className="flex gap-2">
        <a
          href={whatsappUrl(client.phone)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-md transition-colors font-medium"
        >
          <Phone className="h-3 w-3" /> WhatsApp
        </a>
        <a
          href={`mailto:${client.email}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors font-medium"
        >
          <Mail className="h-3 w-3" /> {t('email', { ns: 'common' })}
        </a>
      </div>
    </button>
  )
}
