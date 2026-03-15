import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../store/store'
import { type WorkoutPlan } from '../types'
import { TabBar } from '../components/molecules/TabBar'
import { WorkoutLibrary } from '../components/organisms/workouts/WorkoutLibrary'
import { AIWorkoutGenerator } from '../components/organisms/workouts/AIWorkoutGenerator'
import { WorkoutEditorModal } from '../components/WorkoutEditorModal'

export const Workouts = () => {
  const { t } = useTranslation('workouts')
  const { workouts, addWorkout, updateWorkout, deleteWorkout } = useStore()
  const [activeTab, setActiveTab] = useState<'library' | 'ai'>('library')
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<WorkoutPlan | null>(null)

  const libraryWorkouts = workouts.filter((w) => !w.clientId)

  const handleCreate = () => { setEditingWorkout(null); setIsEditorOpen(true) }
  const handleEdit = (workout: WorkoutPlan) => { setEditingWorkout(workout); setIsEditorOpen(true) }
  const handleDelete = (id: string) => { if (window.confirm(t('deleteWorkoutConfirm'))) deleteWorkout(id) }

  const handleSaveWorkout = (workout: Omit<WorkoutPlan, 'id' | 'createdAt'>) => {
    if (editingWorkout) updateWorkout(editingWorkout.id, { ...editingWorkout, ...workout })
    else addWorkout(workout)
    setIsEditorOpen(false)
  }

  const tabs = [
    { id: 'library' as const, label: t('templates') },
    { id: 'ai' as const, label: t('aiGenerator'), icon: Sparkles },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'library' ? (
        <WorkoutLibrary workouts={libraryWorkouts} onCreate={handleCreate} onEdit={handleEdit} onDelete={handleDelete} />
      ) : (
        <AIWorkoutGenerator onSave={(w) => { addWorkout(w); setActiveTab('library') }} />
      )}

      {isEditorOpen && <WorkoutEditorModal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} onSave={handleSaveWorkout} initialData={editingWorkout} />}
    </div>
  )
}
