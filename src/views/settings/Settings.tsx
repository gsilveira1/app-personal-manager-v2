import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../../states/stores/store'
import { type Plan } from '../../types'
import { ProfileEditSection, WorkHoursEditor, PlansSection, PlanEditorModal } from '../../components/organisms/settings'

export const Settings = () => {
  const { t } = useTranslation('settings')
  const { plans, addPlan, updatePlan, deletePlan, planFeatures, fetchPlanFeatures } = useStore()
  const [featuresError, setFeaturesError] = useState(false)

  useEffect(() => {
    fetchPlanFeatures().catch((error) => {
      console.error('Plan feature catalogue failed to load:', error)
      setFeaturesError(true)
    })
  }, [fetchPlanFeatures])

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

      {featuresError && (
        <p role="alert" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {t('planFeaturesLoadError')}
        </p>
      )}

      <PlansSection plans={plans} featureCatalog={planFeatures} onCreate={handleCreate} onEdit={handleEdit} onDelete={handleDelete} />

      {isModalOpen && <PlanEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingPlan} availableFeatures={planFeatures} />}
    </div>
  )
}
