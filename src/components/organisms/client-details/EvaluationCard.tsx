import React, { useState } from 'react'
import { Activity, Edit2, Trash2, ChevronDown, Ruler, Droplets } from 'lucide-react'
import { parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'

import { Card } from '../../atoms'
import { formatLocalized } from '../../../utils/dateLocale'
import { useStore } from '../../../store/store'
import { EvaluationModal } from './EvaluationModal'
import { ConfirmationModal } from './ConfirmationModal'
import type { Evaluation } from '../../../types'

interface EvaluationCardProps {
  evaluation: Evaluation
}

export const EvaluationCard: React.FC<EvaluationCardProps> = ({ evaluation }) => {
  const { t } = useTranslation('clients')
  const [expanded, setExpanded] = useState(false)
  const [isEditEvalModalOpen, setIsEditEvalModalOpen] = useState(false)
  const [isRemoveEvalModalOpen, setIsRemoveEvalModalOpen] = useState(false)
  const { updateEvaluation, deleteEvaluation } = useStore()

  const editEvaluation = (evaluationId: string, data: Partial<Evaluation>) => {
    updateEvaluation(evaluationId, data)
    setIsEditEvalModalOpen(false)
  }

  const removeEvaluation = (evaluationId: string) => {
    deleteEvaluation(evaluationId)
    setIsRemoveEvalModalOpen(false)
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900">
                {t('evaluation')} - {formatLocalized(parseISO(evaluation.date), 'MMMM d, yyyy')}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsEditEvalModalOpen(true)
                  }}
                  className="text-slate-400 hover:text-indigo-600"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsRemoveEvalModalOpen(true)
                  }}
                  className="text-slate-400 hover:text-indigo-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="text-xs text-slate-500">{evaluation.notes}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm shrink-0">
            <div className="text-center">
              <div className="font-bold text-slate-800">{evaluation.weight}kg</div>
              <div className="text-xs text-slate-500">{t('weight')}</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-slate-800">{evaluation.bodyFatPercentage || '-'}%</div>
              <div className="text-xs text-slate-500">{t('bodyFat')}</div>
            </div>
            <button className="p-2 text-slate-400 hover:text-indigo-600">
              <ChevronDown className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
        {expanded && (
          <div className="p-6 bg-slate-50/50 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-in fade-in">
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                <Ruler className="h-4 w-4 mr-2 text-slate-500" />
                {t('perimetersCm')}
              </h4>
              <dl className="text-sm space-y-2">
                {Object.entries(evaluation.perimeters || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-slate-200 pb-1">
                    <dt className="text-slate-500">{t(`perimeterLabel.${key}`)}</dt>
                    <dd className="font-medium text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                <Droplets className="h-4 w-4 mr-2 text-slate-500" />
                {t('skinfoldsMm')}
              </h4>
              <dl className="text-sm space-y-2">
                {Object.entries(evaluation.skinfolds || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-slate-200 pb-1">
                    <dt className="text-slate-500">{t(`skinfoldLabel.${key}`)}</dt>
                    <dd className="font-medium text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}
      </Card>
      {isEditEvalModalOpen && (
        <EvaluationModal clientId={evaluation.clientId} initialData={evaluation} onClose={() => setIsEditEvalModalOpen(false)} onSave={(data) => editEvaluation(evaluation.id, data)} />
      )}
      {isRemoveEvalModalOpen && (
        <ConfirmationModal
          title={t('deleteEvaluation')}
          message={t('deleteEvaluationConfirm')}
          onConfirm={() => removeEvaluation(evaluation.id)}
          onCancel={() => setIsRemoveEvalModalOpen(false)}
        />
      )}
    </>
  )
}
