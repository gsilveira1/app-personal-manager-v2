import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card, Button, Label, Input } from '../../atoms'
import type { Evaluation, Perimeters, Skinfolds } from '../../../types'

export const initialEvalState: Omit<Evaluation, 'id' | 'clientId' | 'date'> = {
  weight: 0,
  height: 0,
  bodyFatPercentage: 0,
  leanMass: 0,
  notes: '',
  perimeters: {},
  skinfolds: {},
}

export const perimeterFields: (keyof Perimeters)[] = [
  'relaxedArm', 'flexedArm', 'forearm', 'chest', 'waist', 'abdomen', 'hip', 'thigh', 'calf',
]

export const skinfoldFields: (keyof Skinfolds)[] = [
  'triceps', 'biceps', 'subscapular', 'pectoral', 'suprailiac', 'axillary', 'abdominal', 'thigh', 'calf', 'supraSpinal',
]

interface EvaluationModalProps {
  clientId: string
  onClose: () => void
  onSave: (e: Omit<Evaluation, 'id'>) => void
  initialData?: Evaluation | null
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({ clientId, onClose, onSave, initialData }) => {
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')
  const [data, setData] = useState(initialData || initialEvalState)
  const [tab, setTab] = useState('vitals')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newEval: Omit<Evaluation, 'id'> = { ...data, clientId, date: initialData?.date || new Date().toISOString() }
    onSave(newEval)
    onClose()
  }

  const handleNumericChange = (key: keyof Evaluation, value: string) =>
    setData((d) => ({ ...d, [key]: value === '' ? undefined : parseFloat(value) }))

  const handleNestedChange = (category: 'perimeters' | 'skinfolds', key: string, value: string) =>
    setData((d) => ({ ...d, [category]: { ...d[category], [key]: value === '' ? undefined : parseFloat(value) } }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">{t('addEvaluation')}</h3>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="border-b border-slate-200 px-4 flex items-center gap-4">
          <button onClick={() => setTab('vitals')} className={`py-3 text-sm font-medium ${tab === 'vitals' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>
            {t('vitals')}
          </button>
          <button onClick={() => setTab('perimeters')} className={`py-3 text-sm font-medium ${tab === 'perimeters' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>
            {t('perimeters')}
          </button>
          <button onClick={() => setTab('skinfolds')} className={`py-3 text-sm font-medium ${tab === 'skinfolds' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>
            {t('skinfolds')}
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto">
          <div className="p-6 space-y-4">
            {tab === 'vitals' && (
              <>
                {' '}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('weightKg')}</Label>
                    <Input type="number" step="0.1" value={data.weight || ''} onChange={(e) => handleNumericChange('weight', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('heightM')}</Label>
                    <Input type="number" step="0.01" value={data.height || ''} onChange={(e) => handleNumericChange('height', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('bodyFatPercent')}</Label>
                    <Input type="number" step="0.1" value={data.bodyFatPercentage || ''} onChange={(e) => handleNumericChange('bodyFatPercentage', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('leanMassKg')}</Label>
                    <Input type="number" step="0.1" value={data.leanMass || ''} onChange={(e) => handleNumericChange('leanMass', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('evalNotes')}</Label>
                  <Input value={data.notes || ''} onChange={(e) => setData((d) => ({ ...d, notes: e.target.value }))} />
                </div>
              </>
            )}{' '}
            {tab === 'perimeters' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {perimeterFields.map((key) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-slate-600">{t(`perimeterLabel.${key}`)}</Label>
                    <Input type="number" step="0.1" value={data.perimeters?.[key] || ''} onChange={(e) => handleNestedChange('perimeters', key, e.target.value)} />
                  </div>
                ))}
              </div>
            )}{' '}
            {tab === 'skinfolds' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {skinfoldFields.map((key) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-slate-600">{t(`skinfoldLabel.${key}`)}</Label>
                    <Input type="number" step="0.1" value={data.skinfolds?.[key] || ''} onChange={(e) => handleNestedChange('skinfolds', key, e.target.value)} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-3 p-4 border-t border-slate-100 bg-slate-50">
            <Button type="button" variant="outline" onClick={onClose}>
              {tc('cancel')}
            </Button>
            <Button type="submit">{tc('save')}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
