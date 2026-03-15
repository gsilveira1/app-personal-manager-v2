import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Client } from '../../../types'
import { type LeadStage, STAGES } from '../../../utils/leadHelpers'
import { LeadCard } from './LeadCard'

interface LeadKanbanProps {
  stages: typeof STAGES
  byStage: Record<LeadStage, Client[]>
  onLeadClick: (lead: Client) => void
}

export const LeadKanban: React.FC<LeadKanbanProps> = ({ stages, byStage, onLeadClick }) => {
  const { t } = useTranslation('leads')

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {stages.map((stage) => (
        <div key={stage.id} className="flex flex-col gap-3">
          {/* Column header */}
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${stage.dot}`} />
            <h3 className="font-semibold text-slate-700 text-sm">{t(stage.labelKey)}</h3>
            <span className="ml-auto text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {byStage[stage.id].length}
            </span>
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-3 min-h-[120px]">
            {byStage[stage.id].map((lead) => (
              <LeadCard
                key={lead.id}
                client={lead}
                stage={stage.id}
                onClick={() => onLeadClick(lead)}
              />
            ))}
            {byStage[stage.id].length === 0 && (
              <div className="flex items-center justify-center h-16 border-2 border-dashed border-slate-200 rounded-xl text-slate-300 text-sm">
                {t('noLeadsInColumn')}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
