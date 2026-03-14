import React, { useState, useEffect } from 'react'
import { Trash2, Edit2, Plus, X, Repeat, Clock, Bot, Tag, Zap, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../store/store'
import { useAuthStore } from '../store/authStore'
import { type Plan, type SystemFeature } from '../types'
import { Card, Button, Input, Label, Select } from '../components/ui'
import * as api from '../services/apiService'

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

      {isAdmin && <SystemFeaturesSection />}

      {isModalOpen && <PlanEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingPlan} availableFeatures={systemFeatures} />}
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
  const { t: tc } = useTranslation('common')
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
              {plan.type === 'PRESENCIAL' && <span className="text-slate-400"> ({plan.sessionsPerWeek * 4}x{tc('perMonth')})</span>}
            </span>
          </div>
          {plan.durationMinutes && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-indigo-400" />
              <span>
                <strong>{plan.durationMinutes}</strong> {t('perSession')}
              </span>
            </div>
          )}
        </div>

        {plan.features && plan.features.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-400 mb-2">{t('features')}</p>
            <div className="flex flex-wrap gap-1">
              {plan.features.map((pf) => (
                <span key={pf.featureId} className="inline-flex items-center text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                  <Zap className="h-3 w-3 mr-1" />
                  {pf.feature.name}
                </span>
              ))}
            </div>
          </div>
        )}
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

const PlanEditorModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  availableFeatures,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (p: Omit<Plan, 'id'>) => void
  initialData: Plan | null
  availableFeatures: SystemFeature[]
}) => {
  const { t } = useTranslation('settings')
  const { t: tc } = useTranslation('common')
  const [planType, setPlanType] = useState<'PRESENCIAL' | 'CONSULTORIA'>(initialData?.type ?? 'PRESENCIAL')
  const [plan, setPlan] = useState<Omit<Plan, 'id'>>(initialData ?? defaultPresencial)
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>(() => initialData?.features?.map((pf) => pf.featureId) ?? [])

  useEffect(() => {
    if (initialData) {
      setPlan(initialData)
      setPlanType(initialData.type)
      setSelectedFeatureIds(initialData.features?.map((pf) => pf.featureId) ?? [])
    } else {
      setPlanType('PRESENCIAL')
      setPlan(defaultPresencial)
      setSelectedFeatureIds([])
    }
  }, [initialData])

  const toggleFeature = (featureId: string) => {
    setSelectedFeatureIds((prev) => (prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId]))
  }

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
    onSave({ ...plan, type: planType, featureIds: selectedFeatureIds })
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
            <Input
              id="name"
              name="name"
              value={plan.name}
              onChange={handleChange}
              required
              placeholder={planType === 'PRESENCIAL' ? t('planNamePlaceholderInPerson') : t('planNamePlaceholderConsulting')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionsPerWeek">{planType === 'PRESENCIAL' ? t('sessionsPerWeek') : t('checkInsPerWeek')}</Label>
              <Select id="sessionsPerWeek" name="sessionsPerWeek" value={plan.sessionsPerWeek} onChange={handleChange}>
                {planType === 'PRESENCIAL'
                  ? [1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n}x/sem
                      </option>
                    ))
                  : [1, 2].map((n) => (
                      <option key={n} value={n}>
                        {n}x/sem
                      </option>
                    ))}
              </Select>
            </div>

            {planType === 'PRESENCIAL' && (
              <div className="space-y-2">
                <Label htmlFor="durationMinutes">{t('duration')}</Label>
                <Select id="durationMinutes" name="durationMinutes" value={plan.durationMinutes ?? 60} onChange={handleChange}>
                  <option value="30">{tc('durationMin', { minutes: 30 })}</option>
                  <option value="45">{tc('durationMin', { minutes: 45 })}</option>
                  <option value="60">{tc('durationMin', { minutes: 60 })}</option>
                  <option value="90">{tc('durationMin', { minutes: 90 })}</option>
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

          {availableFeatures.length > 0 && (
            <div className="space-y-2">
              <Label>{t('includedFeatures')}</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-3">
                {availableFeatures.map((feature) => (
                  <label key={feature.id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedFeatureIds.includes(feature.id)}
                      onChange={() => toggleFeature(feature.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <Zap className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-slate-700">{feature.name}</span>
                    {feature.description && <span className="text-xs text-slate-400 ml-auto">{feature.description}</span>}
                  </label>
                ))}
              </div>
            </div>
          )}

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

// --- Admin: System Features Management ---

const SystemFeaturesSection = () => {
  const { t } = useTranslation('settings')
  const [allFeatures, setAllFeatures] = useState<SystemFeature[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFeature, setEditingFeature] = useState<SystemFeature | null>(null)

  const fetchAll = async () => {
    try {
      const features = await api.getSystemFeatures()
      setAllFeatures(features)
    } catch (error) {
      console.error('Failed to fetch system features:', error)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleCreate = () => {
    setEditingFeature(null)
    setIsModalOpen(true)
  }

  const handleEdit = (feature: SystemFeature) => {
    setEditingFeature(feature)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(t('deleteFeatureConfirm'))) {
      try {
        await api.deleteSystemFeature(id)
        setAllFeatures((prev) => prev.filter((f) => f.id !== id))
      } catch (error) {
        console.error('Failed to delete system feature:', error)
      }
    }
  }

  const handleToggleActive = async (feature: SystemFeature) => {
    try {
      const updated = await api.updateSystemFeature(feature.id, { isActive: !feature.isActive })
      setAllFeatures((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
    } catch (error) {
      console.error('Failed to toggle system feature:', error)
    }
  }

  const handleSave = async (data: { key: string; name: string; description?: string }) => {
    try {
      if (editingFeature) {
        const updated = await api.updateSystemFeature(editingFeature.id, data)
        setAllFeatures((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
      } else {
        const created = await api.createSystemFeature(data)
        setAllFeatures((prev) => [...prev, created])
      }
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to save system feature:', error)
    }
  }

  return (
    <Card>
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center">
            <Shield className="mr-3 h-5 w-5 text-amber-600" />
            {t('systemFeatures')}
          </h2>
          <p className="text-sm text-slate-500">{t('systemFeaturesSubtitle')}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t('newFeature')}
        </Button>
      </div>
      <div className="p-6">
        {allFeatures.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t('noFeaturesCreated')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allFeatures.map((feature) => (
              <div key={feature.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(feature)}
                    className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${feature.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${feature.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  <div>
                    <p className="font-medium text-slate-900">{feature.name}</p>
                    <p className="text-xs text-slate-400">
                      <code>{feature.key}</code>
                      {feature._count?.plans !== undefined && (
                        <span className="ml-2">
                          &middot; {feature._count.plans} {t('plansUsingFeature')}
                        </span>
                      )}
                    </p>
                    {feature.description && <p className="text-sm text-slate-500 mt-0.5">{feature.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEdit(feature)}>
                    <Edit2 className="h-4 w-4 text-slate-400" />
                  </Button>
                  <Button variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDelete(feature.id)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && <FeatureEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingFeature} />}
    </Card>
  )
}

const FeatureEditorModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { key: string; name: string; description?: string }) => void
  initialData: SystemFeature | null
}) => {
  const { t } = useTranslation('settings')
  const { t: tc } = useTranslation('common')
  const [key, setKey] = useState(initialData?.key ?? '')
  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')

  useEffect(() => {
    setKey(initialData?.key ?? '')
    setName(initialData?.name ?? '')
    setDescription(initialData?.description ?? '')
  }, [initialData])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSave({ key, name, description: description || undefined })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-white shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">{initialData ? t('editFeature') : t('newFeature')}</h2>
          <Button variant="ghost" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feature-key">{t('featureKey')}</Label>
            <Input id="feature-key" value={key} onChange={(e) => setKey(e.target.value)} placeholder={t('featureKeyPlaceholder')} required disabled={!!initialData} pattern="^[a-z][a-z0-9_]*$" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feature-name">{t('featureName')}</Label>
            <Input id="feature-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('featureNamePlaceholder')} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feature-description">{t('featureDescription')}</Label>
            <textarea
              id="feature-description"
              rows={3}
              className="w-full p-3 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 ring-offset-white focus-visible:outline-none placeholder:text-slate-500"
              placeholder={t('featureDescriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
