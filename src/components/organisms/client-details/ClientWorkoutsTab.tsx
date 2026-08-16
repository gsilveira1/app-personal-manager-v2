import { Plus, Dumbbell, History } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../atoms'
import { WorkoutCard } from './WorkoutCard'
import type { WorkoutPlan } from '../../../types'

/**
 * Props for the ClientWorkoutsTab component.
 */
export interface ClientWorkoutsTabProps {
  /** The active workout plans for the client. */
  activePlans: WorkoutPlan[]
  /** The archived workout plans for the client. */
  archivedPlans: WorkoutPlan[]
  /** Callback fired to edit an existing workout plan. */
  onEditWorkout: (workout: WorkoutPlan) => void
  /** Callback fired to delete a workout plan. */
  onDeleteWorkout: (id: string) => void
  /** Callback fired to update the status of a workout plan. */
  onUpdateWorkoutStatus: (id: string, status: 'Active' | 'Archived') => void
}

/**
 * Displays the client's active and archived workout plans.
 *
 * @param props - The component props.
 * @returns The workout tab content.
 */
export const ClientWorkoutsTab = ({
  activePlans,
  archivedPlans,
  onEditWorkout,
  onDeleteWorkout,
  onUpdateWorkoutStatus,
}: ClientWorkoutsTabProps) => {
  const { t } = useTranslation('clients')
  const { t: tw } = useTranslation('workouts')

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">{t('workoutPlans')}</h3>
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center">
          <Dumbbell className="h-4 w-4 mr-2" /> {t('activePrescriptions')}
        </h4>
        {activePlans.length > 0 ? (
          activePlans.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              onDelete={(id) => {
                if (window.confirm(tw('deleteWorkoutConfirm'))) onDeleteWorkout(id)
              }}
              onArchive={(id) => onUpdateWorkoutStatus(id, 'Archived')}
              onEdit={(w) => onEditWorkout(w)}
              isActive
            />
          ))
        ) : (
          <div className="p-8 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center text-slate-500">
            {t('noActivePrescriptions')}
          </div>
        )}
      </div>
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center">
          <History className="h-4 w-4 mr-2" /> {t('planHistory')}
        </h4>
        {archivedPlans.length > 0 ? (
          archivedPlans.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              onDelete={(id) => {
                if (window.confirm(tw('deleteWorkoutConfirm'))) onDeleteWorkout(id)
              }}
              onActivate={(id) => onUpdateWorkoutStatus(id, 'Active')}
              onEdit={(w) => onEditWorkout(w)}
              isActive={false}
            />
          ))
        ) : (
          <div className="p-4 text-center text-sm text-slate-400 italic">{t('noArchivedPlans')}</div>
        )}
      </div>
    </div>
  )
}
