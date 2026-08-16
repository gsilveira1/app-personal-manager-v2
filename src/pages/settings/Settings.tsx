import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../../states/stores/store'
import { useAuthStore } from '../../states/stores/auth/authStore'
import { type Plan } from '../../types'
import { ProfileEditSection, WorkHoursEditor, AppFeaturesConfigSection, AiInstructionsSection, PlansSection, SystemFeaturesSection, PlanEditorModal } from '../../components/organisms/settings'

export const Settings = () => {
  const { t } = useTranslation('settings')
  const { user } = useAuthStore()
  const { plans, addPlan, updatePlan, deletePlan, aiPromptInstructions, updateAiPromptInstructions, systemFeatures, fetchSystemFeatures } = useStore()
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    fetchSystemFeatures()
  }, [fetchSystemFeatures])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)

  const handleCreate = () => {
    setEditingPlan(null)
    setIsModalOpen(true)
  }
  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setIsModalOpen(true)
  }
  const handleDelete = (id: string) => {
    if (window.confirm(t('deletePlanConfirm'))) deletePlan(id)
  }
  const handleSave = (planData: Omit<Plan, 'id'>) => {
    if (editingPlan) updatePlan(editingPlan.id, planData)
    else addPlan(planData)
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6" data-testid="settings-page">
      <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>

      <ProfileEditSection />

      <WorkHoursEditor />

      <AppFeaturesConfigSection />

      <AiInstructionsSection value={aiPromptInstructions} onChange={updateAiPromptInstructions} />

      <PlansSection plans={plans} onCreate={handleCreate} onEdit={handleEdit} onDelete={handleDelete} />

      {isAdmin && <SystemFeaturesSection />}
      {isModalOpen && <PlanEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingPlan} availableFeatures={systemFeatures} />}
    </div>
  )
}
