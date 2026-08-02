import { Plus, Tag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, Button } from '../../atoms'
import { PlanCard } from './PlanCard'
import { type Plan } from '../../../types'

/**
 * Props for the PlansSection component.
 */
interface PlansSectionProps {
  /** List of all service plans. */
  plans: Plan[]
  /** Callback to initiate creating a new plan. */
  onCreate: () => void
  /** Callback to initiate editing an existing plan. */
  onEdit: (plan: Plan) => void
  /** Callback to handle plan deletion. */
  onDelete: (id: string) => void
}

/**
 * A section for managing service plans in the settings page.
 * Displays plans divided into in-person and online consulting.
 *
 * @param props - The component props.
 * @returns The rendered service plans section.
 */
export const PlansSection = ({ plans, onCreate, onEdit, onDelete }: PlansSectionProps) => {
  const { t } = useTranslation('settings')

  const presencialPlans = plans.filter((p) => p.type === 'PRESENCIAL')
  const consultoriaPlans = plans.filter((p) => p.type === 'CONSULTORIA')

  return (
    <Card>
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t('servicePlans')}</h2>
          <p className="text-sm text-slate-500">{t('servicePlansSubtitle')}</p>
        </div>
        <Button onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t('newPlan')}
        </Button>
      </div>
      <div className="p-6 space-y-8">
        {presencialPlans.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">{t('inPersonSection')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {presencialPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} onEdit={() => onEdit(plan)} onDelete={() => onDelete(plan.id)} />
              ))}
            </div>
          </div>
        )}
        {consultoriaPlans.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">{t('onlineConsultingSection')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {consultoriaPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} onEdit={() => onEdit(plan)} onDelete={() => onDelete(plan.id)} />
              ))}
            </div>
          </div>
        )}
        {plans.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Tag className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t('noPlansCreated')}</p>
          </div>
        )}
      </div>
    </Card>
  )
}
