import { Plus, Activity } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../atoms'
import { EvaluationCard } from './EvaluationCard'
import { ProgressChart } from './ProgressChart'
import type { Evaluation } from '../../../types'

/**
 * Props for the ClientEvaluationsTab component.
 */
export interface ClientEvaluationsTabProps {
  /** The list of evaluations for the client. */
  clientEvaluations: Evaluation[]
  /** Data formatted for the progress chart. */
  chartData: any[]
  /** The currently selected metric for the chart. */
  selectedMetric: string
  /** Callback fired to change the selected metric. */
  setSelectedMetric: (metric: string) => void
  /** The metrics available to display in the chart. */
  chartableMetrics: { id: string; label: string; unit: string }[]
  /** Callback fired to open the evaluation modal for adding a new evaluation. */
  onOpenEvalModal: () => void
}

/**
 * Displays the client's evaluation history and progress chart.
 *
 * @param props - The component props.
 * @returns The evaluation tab content.
 */
export const ClientEvaluationsTab = ({
  clientEvaluations,
  chartData,
  selectedMetric,
  setSelectedMetric,
  chartableMetrics,
  onOpenEvalModal
}: ClientEvaluationsTabProps) => {
  const { t } = useTranslation('clients')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">{t('progressTracking')}</h3>
        <Button onClick={onOpenEvalModal}>
          <Plus className="mr-2 h-4 w-4" /> {t('addEvaluation')}
        </Button>
      </div>
      {clientEvaluations.length > 0 ? (
        <>
          {clientEvaluations.length > 1 && (
            <ProgressChart
              chartData={chartData}
              selectedMetric={selectedMetric}
              onMetricChange={setSelectedMetric}
              chartableMetrics={chartableMetrics}
            />
          )}
          <div className="space-y-4">
            {clientEvaluations.map((ev) => (
              <EvaluationCard key={ev.id} evaluation={ev} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900">{t('noEvaluations')}</h3>
          <Button onClick={onOpenEvalModal}>{t('addFirstEvaluation')}</Button>
        </div>
      )}
    </div>
  )
}
