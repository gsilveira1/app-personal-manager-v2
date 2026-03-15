import React, { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { type Plan, type SystemFeature } from '../../../types'
import { Button, Input, Label, Select } from '../../atoms'
import { ModalShell } from '../../molecules'

const defaultPresencial = { type: 'PRESENCIAL' as const, name: '', sessionsPerWeek: 2, durationMinutes: 60, price: 400 }
const defaultConsultoria = { type: 'CONSULTORIA' as const, name: '', sessionsPerWeek: 1, durationMinutes: undefined, price: 150 }

interface PlanEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (p: Omit<Plan, 'id'>) => void
  initialData: Plan | null
  availableFeatures: SystemFeature[]
}

export const PlanEditorModal: React.FC<PlanEditorModalProps> = ({ isOpen, onClose, onSave, initialData, availableFeatures }) => {
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
    <ModalShell title={initialData ? t('editPlan') : t('newPlan')} onClose={onClose}>
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
                      {n}x/{tc('weekAcronym')}
                    </option>
                  ))
                : [1, 2].map((n) => (
                    <option key={n} value={n}>
                      {n}x/{tc('weekAcronym')}
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
    </ModalShell>
  )
}

export { defaultPresencial, defaultConsultoria }
