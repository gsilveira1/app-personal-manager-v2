import React from 'react'
import { Trash2, Edit2, Repeat, Clock, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { type Plan } from '../../../types'
import { Card, Button } from '../../atoms'

interface PlanCardProps {
  plan: Plan
  onEdit: () => void
  onDelete: () => void
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, onEdit, onDelete }) => {
  const { t } = useTranslation('settings')
  const { t: tc } = useTranslation('common')
  return (
    <Card className="flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-base font-bold text-slate-900 leading-tight">{plan.name}</h3>
          <div className="flex items-center space-x-1 shrink-0 ml-2">
            <Button variant="ghost" className="h-7 w-7 p-0" onClick={onEdit}>
              <Edit2 className="h-4 w-4 text-slate-400" />
            </Button>
            <Button variant="ghost" className="h-7 w-7 p-0" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center">
            <Repeat className="h-4 w-4 mr-2 text-indigo-400" />
            <span>
              <strong>{plan.sessionsPerWeek}x</strong>{t('perWeek')}
              {plan.type === 'PRESENCIAL' && <span className="text-slate-400"> ({plan.sessionsPerWeek * 4}x{tc('perMonth')})</span>}
            </span>
          </div>
          {plan.durationMinutes && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-indigo-400" />
              <span>
                <strong>{plan.durationMinutes}</strong> {t('perSession')}
              </span>
            </div>
          )}
        </div>

        {plan.features && plan.features.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-400 mb-2">{t('features')}</p>
            <div className="flex flex-wrap gap-1">
              {plan.features.map((pf) => (
                <span key={pf.featureId} className="inline-flex items-center text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                  <Zap className="h-3 w-3 mr-1" />
                  {pf.feature.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="bg-indigo-600 text-white px-5 py-3 rounded-b-lg flex items-center justify-between">
        <span className="text-xs opacity-80">{t('monthlyRate')}</span>
        <span className="text-lg font-bold">R$ {plan.price.toFixed(2)}</span>
      </div>
    </Card>
  )
}
