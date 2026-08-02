import { useState, useEffect } from 'react'
import { Bot, Plus, Tag } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../../states/stores/store'
import { useAuthStore } from '../../states/stores/auth/authStore'
import { type Plan } from '../../types'
import { Card, Button, Label } from '../../components/atoms'
import { Textarea } from '../../components/atoms'
import { PlanCard } from '../../components/organisms/settings/PlanCard'
import { PlanEditorModal } from '../../components/organisms/settings/PlanEditorModal'
import { SystemFeaturesSection } from '../../components/organisms/settings/SystemFeaturesSection'
import { WorkHoursEditor } from '../../components/organisms/settings/WorkHoursEditor'
import { AiInstructionsSection } from '../../components/organisms/settings/AiInstructionsSection'
import { PlansSection } from '../../components/organisms/settings/PlansSection'

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

  const presencialPlans = plans.filter((p) => p.type === 'PRESENCIAL')
  const consultoriaPlans = plans.filter((p) => p.type === 'CONSULTORIA')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>

      <WorkHoursEditor />

      <AiInstructionsSection
        value={aiPromptInstructions}
        onChange={updateAiPromptInstructions}
      />

      <PlansSection
        plans={plans}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {isAdmin && <SystemFeaturesSection />}
      {isModalOpen && <PlanEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingPlan} availableFeatures={systemFeatures} />}
    </div>
  )
}
