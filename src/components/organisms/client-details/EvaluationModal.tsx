import React, { useState, useMemo } from 'react'
import { X, Sparkles, Calculator, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card, Button, Label, Input } from '../../atoms'
import type { Evaluation, Perimeters, Skinfolds, ProtocolType, EquationType } from '../../../types'
import { calculateEvaluationMetrics, getRequiredSkinfoldsForProtocol } from '../../../utils/evaluationCalculator'

export const initialEvalState: Omit<Evaluation, 'id' | 'clientId' | 'date'> = {
  weight: 70,
  height: 170,
  bodyFatPercentage: undefined,
  leanMass: undefined,
  fatMass: undefined,
  bodyDensity: undefined,
  protocol: 'POLLOCK_3',
  equation: 'SIRI',
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
  const [data, setData] = useState<Omit<Evaluation, 'id' | 'clientId' | 'date'>>({
    weight: initialData?.weight ?? 70,
    height: initialData?.height ?? 170,
    bodyFatPercentage: initialData?.bodyFatPercentage,
    leanMass: initialData?.leanMass,
    fatMass: initialData?.fatMass,
    bodyDensity: initialData?.bodyDensity,
    protocol: initialData?.protocol || 'POLLOCK_3',
    equation: initialData?.equation || 'SIRI',
    notes: initialData?.notes || '',
    perimeters: initialData?.perimeters || {},
    skinfolds: initialData?.skinfolds || {},
  })
  const [tab, setTab] = useState<'vitals' | 'skinfolds' | 'perimeters'>('skinfolds')

  const requiredSkinfolds = useMemo(() => {
    return getRequiredSkinfoldsForProtocol(data.protocol || 'POLLOCK_3', 'M')
  }, [data.protocol])

  const calculatedMetrics = useMemo(() => {
    if (!data.weight || data.weight <= 0) return null
    return calculateEvaluationMetrics({
      gender: 'M',
      age: 30,
      weight: data.weight,
      height: data.height,
      skinfolds: data.skinfolds,
      perimeters: data.perimeters,
      protocol: data.protocol || 'POLLOCK_3',
      equation: data.equation || 'SIRI',
    })
  }, [data.weight, data.height, data.skinfolds, data.perimeters, data.protocol, data.equation])

  const handleApplyCalculated = () => {
    if (!calculatedMetrics) return
    setData((d) => ({
      ...d,
      bodyFatPercentage: calculatedMetrics.bodyFatPercentage,
      fatMass: calculatedMetrics.fatMass,
      leanMass: calculatedMetrics.leanMass,
      bodyDensity: calculatedMetrics.bodyDensity,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Default to calculated if user left empty
    const finalBF = data.bodyFatPercentage ?? calculatedMetrics?.bodyFatPercentage
    const finalLM = data.leanMass ?? calculatedMetrics?.leanMass
    const finalFM = data.fatMass ?? calculatedMetrics?.fatMass
    const finalDc = data.bodyDensity ?? calculatedMetrics?.bodyDensity

    const newEval: Omit<Evaluation, 'id'> = {
      ...data,
      bodyFatPercentage: finalBF,
      leanMass: finalLM,
      fatMass: finalFM,
      bodyDensity: finalDc,
      clientId,
      date: initialData?.date || new Date().toISOString(),
    }
    onSave(newEval)
    onClose()
  }

  const handleNumericChange = (key: keyof Evaluation, value: string) =>
    setData((d) => ({ ...d, [key]: value === '' ? undefined : parseFloat(value) }))

  const handleNestedChange = (category: 'perimeters' | 'skinfolds', key: string, value: string) =>
    setData((d) => ({ ...d, [category]: { ...d[category], [key]: value === '' ? undefined : parseFloat(value) } }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-3xl bg-white shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900">{t('addEvaluation')}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Calculation Preview Header */}
        {calculatedMetrics && (
          <div className="bg-indigo-50/70 border-b border-indigo-100 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-indigo-100 shadow-sm text-center">
              <div className="text-slate-500 font-medium">Densidade ($D_c$)</div>
              <div className="text-base font-bold text-indigo-700">{calculatedMetrics.bodyDensity}</div>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-indigo-100 shadow-sm text-center">
              <div className="text-slate-500 font-medium">% Gordura (%G)</div>
              <div className="text-base font-bold text-indigo-700">{calculatedMetrics.bodyFatPercentage}%</div>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-indigo-100 shadow-sm text-center">
              <div className="text-slate-500 font-medium">Massa Gorda (KG)</div>
              <div className="text-base font-bold text-rose-600">{calculatedMetrics.fatMass} kg</div>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-indigo-100 shadow-sm text-center">
              <div className="text-slate-500 font-medium">Massa Magra (KG)</div>
              <div className="text-base font-bold text-emerald-600">{calculatedMetrics.leanMass} kg</div>
            </div>
          </div>
        )}

        <div className="border-b border-slate-200 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setTab('skinfolds')} className={`py-3 text-sm font-medium transition-colors ${tab === 'skinfolds' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
              {t('skinfolds')} (Dobras)
            </button>
            <button onClick={() => setTab('perimeters')} className={`py-3 text-sm font-medium transition-colors ${tab === 'perimeters' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
              {t('perimeters')} (Circunferências)
            </button>
            <button onClick={() => setTab('vitals')} className={`py-3 text-sm font-medium transition-colors ${tab === 'vitals' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
              {t('vitals')} & Resultados
            </button>
          </div>

          <Button type="button" variant="ghost" size="sm" onClick={handleApplyCalculated} className="text-xs text-indigo-600 hover:bg-indigo-50">
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Aplicar Cálculos
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-6">
            {/* Protocol & Equation Controls */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Protocolo Científico</Label>
                <select
                  value={data.protocol || 'POLLOCK_3'}
                  onChange={(e) => setData((d) => ({ ...d, protocol: e.target.value as ProtocolType }))}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="POLLOCK_3">Jackson & Pollock (3 Dobras)</option>
                  <option value="POLLOCK_7">Jackson & Pollock (7 Dobras)</option>
                  <option value="PETROSKI_4">Petroski (4 Dobras - Pop. Brasileira)</option>
                  <option value="DURNIN_WOMERSLEY_4">Durnin & Womersley (4 Dobras)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Equação de Conversão (%G)</Label>
                <select
                  value={data.equation || 'SIRI'}
                  onChange={(e) => setData((d) => ({ ...d, equation: e.target.value as EquationType }))}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="SIRI">Siri (1961) - Padrão Geral</option>
                  <option value="BROZEK">Brozek (1953) - População Específica</option>
                </select>
              </div>
            </div>

            {tab === 'skinfolds' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">Dobras Cutâneas (mm)</h4>
                  <span className="text-xs text-indigo-600 font-medium">
                    Campos destacados são obrigatórios para {data.protocol || 'POLLOCK_3'}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {skinfoldFields.map((key) => {
                    const isRequired = requiredSkinfolds.includes(key)
                    return (
                      <div key={key} className={`space-y-1.5 p-2 rounded-lg border transition-colors ${isRequired ? 'bg-indigo-50/40 border-indigo-200' : 'border-slate-200'}`}>
                        <div className="flex justify-between items-center">
                          <Label className={`text-xs ${isRequired ? 'font-bold text-indigo-900' : 'text-slate-600'}`}>
                            {t(`skinfoldLabel.${key}`)}
                          </Label>
                          {isRequired && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />}
                        </div>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          value={data.skinfolds?.[key] || ''}
                          onChange={(e) => handleNestedChange('skinfolds', key, e.target.value)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {tab === 'perimeters' && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800">Circunferências & Perímetros (cm)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {perimeterFields.map((key) => (
                    <div key={key} className="space-y-1.5">
                      <Label className="text-xs text-slate-600">{t(`perimeterLabel.${key}`)}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={data.perimeters?.[key] || ''}
                        onChange={(e) => handleNestedChange('perimeters', key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'vitals' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t('weightKg')}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={data.weight || ''}
                      onChange={(e) => handleNumericChange('weight', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('heightM')}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="170"
                      value={data.height || ''}
                      onChange={(e) => handleNumericChange('height', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div className="space-y-1.5">
                    <Label>{t('bodyFatPercent')} (%G)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder={calculatedMetrics?.bodyFatPercentage?.toString() || '0.0'}
                      value={data.bodyFatPercentage ?? ''}
                      onChange={(e) => handleNumericChange('bodyFatPercentage', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('leanMassKg')} (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder={calculatedMetrics?.leanMass?.toString() || '0.0'}
                      value={data.leanMass ?? ''}
                      onChange={(e) => handleNumericChange('leanMass', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Massa Gorda (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder={calculatedMetrics?.fatMass?.toString() || '0.0'}
                      value={data.fatMass ?? ''}
                      onChange={(e) => handleNumericChange('fatMass', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Densidade Corporal ($D_c$)</Label>
                    <Input
                      type="number"
                      step="0.00001"
                      placeholder={calculatedMetrics?.bodyDensity?.toString() || '1.05'}
                      value={data.bodyDensity ?? ''}
                      onChange={(e) => handleNumericChange('bodyDensity', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>{t('evalNotes')}</Label>
                  <Input
                    placeholder="Observações clínicas ou meta..."
                    value={data.notes || ''}
                    onChange={(e) => setData((d) => ({ ...d, notes: e.target.value }))}
                  />
                </div>
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
