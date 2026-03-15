import React, { useState } from 'react'
import { Edit2, Trash2, Archive, CheckCircle2, ChevronDown, ChevronUp, Calendar, Flame } from 'lucide-react'
import { parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'

import { Card, Button, Badge } from '../../atoms'
import { formatLocalized } from '../../../utils/dateLocale'
import type { WorkoutPlan } from '../../../types'

interface WorkoutCardProps {
  workout: WorkoutPlan
  onDelete: (id: string) => void
  onArchive?: (id: string) => void
  onActivate?: (id: string) => void
  onEdit: (w: WorkoutPlan) => void
  isActive: boolean
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, onDelete, onArchive, onActivate, onEdit, isActive }) => {
  const { t } = useTranslation('workouts')
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className={`overflow-hidden transition-all ${!isActive ? 'bg-slate-50 opacity-75 hover:opacity-100' : 'bg-white'}`}>
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-slate-900 text-lg">{workout.title}</h4>
              {!isActive && (
                <Badge variant="default" className="text-xs">
                  {t('archived')}
                </Badge>
              )}
            </div>
            <p className="text-slate-500 text-sm">{workout.description}</p>
            <div className="flex gap-2 mt-2">
              {workout.tags.map((tag) => (
                <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                  #{tag}
                </span>
              ))}
              <span className="text-xs text-slate-400 flex items-center ml-2">
                <Calendar className="h-3 w-3 mr-1" /> {formatLocalized(parseISO(workout.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600" title={t('editPlan')} onClick={() => onEdit(workout)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            {isActive && onArchive && (
              <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600" title={t('archivePlan')} onClick={() => onArchive(workout.id)}>
                <Archive className="h-4 w-4" />
              </Button>
            )}
            {!isActive && onActivate && (
              <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-green-600" title={t('reactivatePlan')} onClick={() => onActivate(workout.id)}>
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600" title={t('deletePlan')} onClick={() => onDelete(workout.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="w-full mt-4 flex items-center justify-center py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
          {expanded ? (
            <>
              {t('hideItems')} <ChevronUp className="ml-1 h-3 w-3" />
            </>
          ) : (
            <>
              {t('viewItems', { count: workout.exercises.length })} <ChevronDown className="ml-1 h-3 w-3" />
            </>
          )}
        </button>
      </div>
      {expanded && (
        <div className="bg-slate-50/50 border-t border-slate-100 px-5 py-3 text-sm">
          <ul className="space-y-3">
            {workout.exercises.map((ex, idx) => (
              <li
                key={idx}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 last:border-0 last:pb-0 ${ex.isWarmup ? 'bg-orange-50/50 -mx-2 px-2 rounded' : ''}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {ex.isWarmup && <Flame className="h-3 w-3 text-orange-500 flex-shrink-0" />}
                    <span className={`font-medium ${ex.isWarmup ? 'text-orange-800' : 'text-slate-700'}`}>{ex.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-500 text-xs sm:text-sm">
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm whitespace-nowrap">
                    {ex.sets} x {ex.reps}
                  </span>
                  {ex.notes && (
                    <span className="text-slate-400 italic max-w-[150px] truncate" title={ex.notes}>
                      {ex.notes}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
