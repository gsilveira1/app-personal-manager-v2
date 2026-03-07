import React, { useState, useEffect } from 'react'
import { Trash2, Edit2, Plus, X, Repeat, Clock, Bot, Tag } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../store/store'
import { type Plan } from '../types'
import { Card, Button, Input, Label, Select } from '../components/ui'

export const Settings = () => {
  const { t } = useTranslation('settings')
  const { plans, addPlan, updatePlan, deletePlan, aiPromptInstructions, updateAiPromptInstructions } = useStore()
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
          <textarea
            id="ai-instructions"
            name="ai-instructions"
            rows={5}
            className="mt-2 w-full p-3 text-sm border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 ring-offset-white focus-visible:outline-none placeholder:text-slate-500"
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
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t('newPlan')}
          </Button>
        </div>
        <div className="p-6 space-y-8">
          {presencialPlans.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">{t('inPersonSection')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {presencialPlans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} onEdit={() => handleEdit(plan)} onDelete={() => handleDelete(plan.id)} />
                ))}
              </div>
            </div>
          )}
          {consultoriaPlans.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">{t('onlineConsultingSection')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {consultoriaPlans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} onEdit={() => handleEdit(plan)} onDelete={() => handleDelete(plan.id)} />
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

      {isModalOpen && <PlanEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingPlan} />}
    </div>
  )
}

interface PlanCardProps {
  plan: Plan
  onEdit: () => void
  onDelete: () => void
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onEdit, onDelete }) => {
  const { t } = useTranslation('settings')
  return (
    <Card className="flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-base font-bold text-slate-900 leading-tight">{plan.name}</h3>
          <div className="flex items-center space-x-1 shrink-0 ml-2">
            <Button variant="ghost" className="h-7 w-7 p-0" onClick={onEdit}>
              <Edit2 className="h-4 w-4 text-slate-400" />
            </Button>
            <Button variant="ghost" className="h-7 w-7 p-0" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center">
            <Repeat className="h-4 w-4 mr-2 text-indigo-400" />
            <span>
              <strong>{plan.sessionsPerWeek}x</strong>/sem
              {plan.type === 'PRESENCIAL' && <span className="text-slate-400"> ({plan.sessionsPerWeek * 4}x/mês)</span>}
            </span>
          </div>
          {plan.durationMinutes && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-indigo-400" />
              <span><strong>{plan.durationMinutes}</strong> {t('perSession')}</span>
            </div>
          )}
        </div>
      </div>
      <div className="bg-indigo-600 text-white px-5 py-3 rounded-b-lg flex items-center justify-between">
        <span className="text-xs opacity-80">{t('monthlyRate')}</span>
        <span className="text-lg font-bold">R$ {plan.price.toFixed(2)}</span>
      </div>
    </Card>
  )
}

const defaultPresencial = { type: 'PRESENCIAL' as const, name: '', sessionsPerWeek: 2, durationMinutes: 60, price: 400 }
const defaultConsultoria = { type: 'CONSULTORIA' as const, name: '', sessionsPerWeek: 1, durationMinutes: undefined, price: 150 }

const PlanEditorModal = ({ isOpen, onClose, onSave, initialData }: { isOpen: boolean; onClose: () => void; onSave: (p: Omit<Plan, 'id'>) => void; initialData: Plan | null }) => {
  const { t } = useTranslation('settings')
  const { t: tc } = useTranslation('common')
  const [planType, setPlanType] = useState<'PRESENCIAL' | 'CONSULTORIA'>(initialData?.type ?? 'PRESENCIAL')
  const [plan, setPlan] = useState<Omit<Plan, 'id'>>(initialData ?? defaultPresencial)

  useEffect(() => {
    if (initialData) {
      setPlan(initialData)
      setPlanType(initialData.type)
    } else {
      setPlanType('PRESENCIAL')
      setPlan(defaultPresencial)
    }
  }, [initialData])

  const handleTypeChange = (newType: 'PRESENCIAL' | 'CONSULTORIA') => {
    setPlanType(newType)
    setPlan(newType === 'PRESENCIAL' ? defaultPresencial : defaultConsultoria)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setPlan((prev) => ({
      ...prev,
      [name]: name === 'name' ? value : name === 'durationMinutes' ? (value ? Number(value) : undefined) : Number(value),
    }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSave({ ...plan, type: planType })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-white shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">{initialData ? t('editPlan') : t('newPlan')}</h2>
          <Button variant="ghost" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Plan type selector */}
          <div className="space-y-2">
            <Label>{t('planType')}</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('PRESENCIAL')}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${planType === 'PRESENCIAL' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                {t('inPerson')}
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('CONSULTORIA')}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${planType === 'CONSULTORIA' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                {t('consulting')}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t('planName')}</Label>
            <Input id="name" name="name" value={plan.name} onChange={handleChange} required placeholder={planType === 'PRESENCIAL' ? t('planNamePlaceholderInPerson') : t('planNamePlaceholderConsulting')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionsPerWeek">{planType === 'PRESENCIAL' ? t('sessionsPerWeek') : t('checkInsPerWeek')}</Label>
              <Select id="sessionsPerWeek" name="sessionsPerWeek" value={plan.sessionsPerWeek} onChange={handleChange}>
                {planType === 'PRESENCIAL'
                  ? [1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}x/sem</option>)
                  : [1, 2].map((n) => <option key={n} value={n}>{n}x/sem</option>)
                }
              </Select>
            </div>

            {planType === 'PRESENCIAL' && (
              <div className="space-y-2">
                <Label htmlFor="durationMinutes">{t('duration')}</Label>
                <Select id="durationMinutes" name="durationMinutes" value={plan.durationMinutes ?? 60} onChange={handleChange}>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                </Select>
              </div>
            )}
          </div>

          {planType === 'PRESENCIAL' && (
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
              {t('totalSessionsMonth')}: <strong>{(plan.sessionsPerWeek ?? 2) * 4}</strong>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="price">{t('monthlyValue')}</Label>
            <Input id="price" name="price" type="number" step="10" value={plan.price} onChange={handleChange} required min="0" />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              {tc('cancel')}
            </Button>
            <Button type="submit">{t('saveSettings')}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
