import React, { useState } from 'react'
import { Activity, Edit2, Trash2, ChevronDown, Ruler, Droplets } from 'lucide-react'
import { parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'

import { Card } from '../../atoms'
import { formatLocalized } from '../../../utils/dateLocale'
import { useStore } from '../../../states/stores/store'
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

  const protocolName =
    evaluation.protocol === 'POLLOCK_7' ? 'Pollock 7' : evaluation.protocol === 'PETROSKI_4' ? 'Petroski 4' : evaluation.protocol === 'DURNIN_WOMERSLEY_4' ? 'Durnin & Womersley 4' : 'Pollock 3'

  const equationName = evaluation.equation === 'BROZEK' ? 'Brozek' : 'Siri'

  return (
    <>
      <Card data-testid={`evaluation-card-${evaluation.id}`} className="overflow-hidden border-slate-200 hover:border-indigo-200 transition-colors">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <span>
                  {t('evaluation')} - {formatLocalized(parseISO(evaluation.date), 'MMMM d, yyyy')}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditEvalModalOpen(true)
                    }}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsRemoveEvalModalOpen(true)
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                  {protocolName} ({equationName})
                </span>
                {evaluation.notes && <span>• {evaluation.notes}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 text-sm shrink-0">
            <div className="text-center">
              <div className="font-bold text-slate-800">{evaluation.weight} kg</div>
              <div className="text-xs text-slate-500">{t('weight')}</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-indigo-600">{evaluation.bodyFatPercentage || '-'}%</div>
              <div className="text-xs text-slate-500">{t('bodyFat')}</div>
            </div>
            <div className="text-center hidden sm:block">
              <div className="font-bold text-emerald-600">{evaluation.leanMass || '-'} kg</div>
              <div className="text-xs text-slate-500">{t('leanMassKg')}</div>
            </div>
            <button className="p-2 text-slate-400 hover:text-indigo-600">
              <ChevronDown className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="p-6 bg-slate-50/50 border-t border-slate-200 space-y-6 animate-in fade-in">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Massa Gorda:</span>
                <span className="font-bold text-rose-600 ml-1">{evaluation.fatMass ?? '-'} kg</span>
              </div>
              <div>
                <span className="text-slate-500">Massa Magra:</span>
                <span className="font-bold text-emerald-600 ml-1">{evaluation.leanMass ?? '-'} kg</span>
              </div>
              <div>
                <span className="text-slate-500">Densidade ($D_c$):</span>
                <span className="font-bold text-slate-700 ml-1">{evaluation.bodyDensity ?? '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">Protocolo:</span>
                <span className="font-bold text-indigo-600 ml-1">{protocolName}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center text-sm">
                  <Ruler className="h-4 w-4 mr-2 text-slate-500" />
                  {t('perimetersCm')}
                </h4>
                {evaluation.perimeters && Object.keys(evaluation.perimeters).length > 0 ? (
                  <dl className="text-sm space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                    {Object.entries(evaluation.perimeters).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b border-slate-100 last:border-0 pb-1">
                        <dt className="text-slate-500">{t(`perimeterLabel.${key}`)}</dt>
                        <dd className="font-medium text-slate-900">{value} cm</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div className="text-xs text-slate-400 italic">Nenhuma circunferência registrada.</div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center text-sm">
                  <Droplets className="h-4 w-4 mr-2 text-slate-500" />
                  {t('skinfoldsMm')}
                </h4>
                {evaluation.skinfolds && Object.keys(evaluation.skinfolds).length > 0 ? (
                  <dl className="text-sm space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                    {Object.entries(evaluation.skinfolds).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b border-slate-100 last:border-0 pb-1">
                        <dt className="text-slate-500">{t(`skinfoldLabel.${key}`)}</dt>
                        <dd className="font-medium text-slate-900">{value} mm</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div className="text-xs text-slate-400 italic">Nenhuma dobra cutânea registrada.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {isEditEvalModalOpen && (
        <EvaluationModal clientId={evaluation.clientId} initialData={evaluation} onClose={() => setIsEditEvalModalOpen(false)} onSave={(data) => editEvaluation(evaluation.id, data)} />
      )}
      {isRemoveEvalModalOpen && (
        <ConfirmationModal title={t('deleteEvaluation')} message={t('deleteEvaluationConfirm')} onConfirm={() => removeEvaluation(evaluation.id)} onCancel={() => setIsRemoveEvalModalOpen(false)} />
      )}
    </>
  )
}
