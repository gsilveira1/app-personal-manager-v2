import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { User, Clock, Sliders, Bot, CreditCard } from 'lucide-react'

import { useStore } from '../../states/stores/store'
import { useAuthStore } from '../../states/stores/auth/authStore'
import { type Plan } from '../../types'
import { ProfileEditSection, WorkHoursEditor, AppFeaturesConfigSection, AiInstructionsSection, PlansSection, SystemFeaturesSection, PlanEditorModal } from '../../components/organisms/settings'

export type SettingsTab = 'profile' | 'schedule' | 'features' | 'ai' | 'plans'

const VALID_TABS: SettingsTab[] = ['profile', 'schedule', 'features', 'ai', 'plans']

export const Settings = () => {
  const { t } = useTranslation('settings')
  const { user } = useAuthStore()
  const { plans, addPlan, updatePlan, deletePlan, aiPromptInstructions, updateAiPromptInstructions, systemFeatures, fetchSystemFeatures } = useStore()
  const isAdmin = user?.role === 'admin'

  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as SettingsTab | null
  const activeTab: SettingsTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'profile'

  const handleTabChange = (tabId: SettingsTab) => {
    setSearchParams({ tab: tabId }, { replace: true })
  }

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
    if (window.confirm(t('deletePlanConfirm'))) {
      deletePlan(id)
    }
  }

  const handleSave = (planData: Omit<Plan, 'id'>) => {
    if (editingPlan) {
      updatePlan(editingPlan.id, planData)
    } else {
      addPlan(planData)
    }
    setIsModalOpen(false)
  }

  const tabsConfig = useMemo(
    () => [
      {
        id: 'profile' as SettingsTab,
        label: t('tabs.profile', 'Perfil do Treinador'),
        icon: User,
        testId: 'tab-profile',
      },
      {
        id: 'schedule' as SettingsTab,
        label: t('tabs.schedule', 'Configurações de Horário'),
        icon: Clock,
        testId: 'tab-schedule',
      },
      {
        id: 'features' as SettingsTab,
        label: t('tabs.features', 'Funcionalidades App e Sistema'),
        icon: Sliders,
        testId: 'tab-features',
      },
      {
        id: 'ai' as SettingsTab,
        label: t('tabs.ai', 'Configurações e Instruções de IA'),
        icon: Bot,
        testId: 'tab-ai',
      },
      {
        id: 'plans' as SettingsTab,
        label: t('tabs.plans', 'Planos de Serviço'),
        icon: CreditCard,
        testId: 'tab-plans',
      },
    ],
    [t]
  )

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px" role="tablist" aria-label={t('title')}>
          {tabsConfig.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-controls={`tabpanel-${tab.id}`}
                aria-selected={isActive}
                data-testid={tab.testId}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 py-3 px-3 sm:px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors rounded-t-lg ${
                  isActive ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="focus:outline-none">
        {activeTab === 'profile' && <ProfileEditSection />}

        {activeTab === 'schedule' && <WorkHoursEditor />}

        {activeTab === 'features' && (
          <div className="space-y-6">
            <AppFeaturesConfigSection />
            {isAdmin && <SystemFeaturesSection />}
          </div>
        )}

        {activeTab === 'ai' && <AiInstructionsSection value={aiPromptInstructions} onChange={updateAiPromptInstructions} />}

        {activeTab === 'plans' && (
          <>
            <PlansSection plans={plans} onCreate={handleCreate} onEdit={handleEdit} onDelete={handleDelete} />
            {isModalOpen && <PlanEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingPlan} availableFeatures={systemFeatures} />}
          </>
        )}
      </div>
    </div>
  )
}
