import React, { useState } from 'react'
import { Dumbbell, ChevronDown, ChevronUp, Plus, Edit2, Trash2, Flame } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { type WorkoutPlan } from '../../../types'
import { Card, Badge } from '../../atoms'

interface WorkoutLibraryProps {
  workouts: WorkoutPlan[]
  onCreate: () => void
  onEdit: (w: WorkoutPlan) => void
  onDelete: (id: string) => void
}

export const WorkoutLibrary: React.FC<WorkoutLibraryProps> = ({ workouts, onCreate, onEdit, onDelete }) => {
  const { t } = useTranslation('workouts')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {workouts.map((workout) => (
        <Card key={workout.id} className="overflow-hidden flex flex-col">
          <div className="p-6 flex-1">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Dumbbell className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="flex items-center space-x-2">
                <Badge>{t('items', { count: workout.exercises.length })}</Badge>
                <div className="flex space-x-1">
                  <button onClick={() => onEdit(workout)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title={t('editTemplate')}>
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(workout.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title={t('deleteTemplate')}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{workout.title}</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{workout.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {workout.tags.map((tag) => (
                <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => setExpandedId(expandedId === workout.id ? null : workout.id)}
            className="w-full py-2 bg-slate-50 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border-t border-slate-100 flex items-center justify-center transition-colors"
          >
            {expandedId === workout.id ? (
              <>
                {t('hideDetails')} <ChevronUp className="ml-1 h-3 w-3" />
              </>
            ) : (
              <>
                {t('viewItems', { count: workout.exercises.length })} <ChevronDown className="ml-1 h-3 w-3" />
              </>
            )}
          </button>

          {expandedId === workout.id && (
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 space-y-3">
              {workout.exercises.map((ex, idx) => (
                <div
                  key={idx}
                  className={`flex justify-between text-sm items-start border-b border-slate-200 pb-2 last:border-0 last:pb-0 ${ex.isWarmup ? 'bg-orange-50/50 -mx-2 px-2 rounded-md' : ''}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {ex.isWarmup && <Flame className="h-3 w-3 text-orange-500 flex-shrink-0" />}
                      <span className={`font-medium ${ex.isWarmup ? 'text-orange-800' : 'text-slate-700'} block`}>{ex.name}</span>
                    </div>
                    {ex.notes && <span className="text-xs text-slate-400 block mt-0.5 italic">{ex.notes}</span>}
                  </div>
                  <span className="text-slate-500 font-mono text-xs bg-white px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap ml-2">
                    {ex.sets} x {ex.reps}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}

      <button
        onClick={onCreate}
        className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 transition-all group min-h-[300px]"
      >
        <div className="bg-slate-100 p-4 rounded-full mb-3 group-hover:bg-white shadow-sm transition-all">
          <Plus className="h-6 w-6" />
        </div>
        <span className="font-medium text-lg">{t('createTemplate')}</span>
        <span className="text-sm opacity-70 mt-1">{t('designFromScratch')}</span>
      </button>
    </div>
  )
}
