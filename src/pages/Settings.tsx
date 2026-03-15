import { useState, useEffect } from 'react'
import { Bot, Plus, Tag } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../store/store'
import { useAuthStore } from '../store/authStore'
import { type Plan } from '../types'
import { Card, Button, Label } from '../components/atoms'
import { Textarea } from '../components/atoms'
import { PlanCard } from '../components/organisms/settings/PlanCard'
import { PlanEditorModal } from '../components/organisms/settings/PlanEditorModal'
import { SystemFeaturesSection } from '../components/organisms/settings/SystemFeaturesSection'

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

  const handleCreate = () => { setEditingPlan(null); setIsModalOpen(true) }
  const handleEdit = (plan: Plan) => { setEditingPlan(plan); setIsModalOpen(true) }
  const handleDelete = (id: string) => { if (window.confirm(t('deletePlanConfirm'))) deletePlan(id) }
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

      <Card>
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center">
            <Bot className="mr-3 h-5 w-5 text-indigo-600" />
            {t('aiInstructions')}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{t('aiInstructionsPlaceholder')}</p>
        </div>
        <div className="p-6">
          <Label htmlFor="ai-instructions">{t('aiInstructions')}</Label>
          <Textarea
            id="ai-instructions"
            rows={5}
            className="mt-2"
            placeholder={t('aiInstructionsPlaceholder')}
            value={aiPromptInstructions}
            onChange={(e) => updateAiPromptInstructions(e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-2">{t('autoSave')}</p>
        </div>
      </Card>

      <Card>
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t('servicePlans')}</h2>
            <p className="text-sm text-slate-500">{t('servicePlansSubtitle')}</p>
          </div>
          <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> {t('newPlan')}</Button>
        </div>
        <div className="p-6 space-y-8">
          {presencialPlans.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">{t('inPersonSection')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {presencialPlans.map((plan) => <PlanCard key={plan.id} plan={plan} onEdit={() => handleEdit(plan)} onDelete={() => handleDelete(plan.id)} />)}
              </div>
            </div>
          )}
          {consultoriaPlans.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">{t('onlineConsultingSection')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {consultoriaPlans.map((plan) => <PlanCard key={plan.id} plan={plan} onEdit={() => handleEdit(plan)} onDelete={() => handleDelete(plan.id)} />)}
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

      {isAdmin && <SystemFeaturesSection />}
      {isModalOpen && <PlanEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingPlan} availableFeatures={systemFeatures} />}
    </div>
  )
}
