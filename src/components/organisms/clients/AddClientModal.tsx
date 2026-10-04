import React, { useState } from 'react'
import { HeartPulse, ChevronDown, Bell, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../../../states/stores/store'
import { ClientStatus, ClientModality } from '../../../types'
import type { Client, CheckInFrequency, Plan, MedicalHistory } from '../../../types'
import { Card, Button, Input, Select, Label } from '../../atoms'

export const formatPlanLabel = (plan: Plan, perMonth: string) => {
  const sessionsPerMonth = plan.sessionsPerWeek * 4
  const duration = plan.durationMinutes ? ` ${plan.durationMinutes}min` : ''
  return `${plan.name} — ${sessionsPerMonth}x${perMonth}${duration} · R$ ${plan.price.toFixed(2)}`
}

interface AddClientModalProps {
  onClose: () => void
  onSave: (clientData: Omit<Client, 'id' | 'avatar'>, customPlanData?: Omit<Plan, 'id'>) => void
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ onClose, onSave }) => {
  const { t } = useTranslation('clients')
  const { t: tco } = useTranslation('common')
  const { plans } = useStore()

  const [modality, setModality] = useState<ClientModality>('PRESENCIAL')
  const [status, setStatus] = useState<ClientStatus>('ACTIVE')
  const [notificationEnabled, setNotificationEnabled] = useState(true)
  const [isCustomPlan, setIsCustomPlan] = useState(false)
  const [showMedical, setShowMedical] = useState(false)

  // Medical history state
  const [hasHeartDisease, setHasHeartDisease] = useState(false)
  const [smoker, setSmoker] = useState(false)
  const [drinker, setDrinker] = useState(false)

  const [customPlan, setCustomPlan] = useState<Omit<Plan, 'id'>>({
    type: 'PRESENCIAL',
    name: '',
    sessionsPerWeek: 2,
    durationMinutes: 60,
    price: 400,
  })

  const handleCustomPlanChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setCustomPlan((prev) => ({ ...prev, [name]: name === 'name' ? value : Number(value) }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const injuries = (formData.get('injuries') as string) || undefined
    const medications = (formData.get('medications') as string) || undefined
    const surgeries = (formData.get('surgeries') as string) || undefined
    const observations = (formData.get('medicalObservations') as string) || undefined

    const hasAnyMedical = showMedical && (injuries || medications || surgeries || observations || hasHeartDisease || smoker || drinker)

    const medicalHistory: MedicalHistory | undefined = hasAnyMedical
      ? {
          injuries,
          medications,
          surgeries,
          observations,
          hasHeartDisease,
          smoker,
          drinker,
        }
      : undefined

    const phoneVal = (formData.get('phone') as string) || ''
    const notesVal = (formData.get('notes') as string) || undefined
    const planIdVal = formData.get('planId') as string

    const newClient: Omit<Client, 'id' | 'avatar'> = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: phoneVal,
      dateOfBirth: (formData.get('dateOfBirth') as string) || undefined,
      status: (formData.get('status') as ClientStatus) || status,
      modality: (formData.get('modality') as ClientModality) || modality,
      checkInFrequency: modality === 'ONLINE' || modality === 'HYBRID' ? (formData.get('frequency') as CheckInFrequency) : undefined,
      goal: (formData.get('goal') as string) || undefined,
      notes: notesVal,
      notificationEnabled,
      planId: isCustomPlan || !planIdVal ? undefined : planIdVal,
      medicalHistory,
    }

    const customPlanData = isCustomPlan ? { ...customPlan, name: customPlan.name || `${newClient.name}'s Plan` } : undefined

    onSave(newClient, customPlanData)
    onClose()
  }

  return (
    <div data-testid="add-client-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl bg-white shadow-xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t('addClient')}</h2>
            <p className="text-xs text-slate-500">Cadastre um novo aluno com perfil unificado, modalidade e histórico.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Identificação Básica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t('fullName')}</Label>
              <Input id="name" name="name" required placeholder={t('namePlaceholder')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateOfBirth">{t('dateOfBirth')}</Label>
              <Input id="dateOfBirth" name="dateOfBirth" type="date" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" name="email" type="email" required placeholder={t('emailPlaceholder')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">{t('phone')}</Label>
              <Input id="phone" name="phone" required placeholder={t('phonePlaceholder')} />
            </div>
          </div>

          {/* Modalidade, Status e Objetivo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="modality">{t('modality')}</Label>
              <Select id="modality" name="modality" value={modality} onChange={(e) => setModality(e.target.value as ClientModality)}>
                <option value="PRESENCIAL">{t('modalityPresencial')}</option>
                <option value="ONLINE">{t('modalityOnline')}</option>
                <option value="HYBRID">{t('modalityHybrid')}</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">{t('status')}</Label>
              <Select id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value as ClientStatus)}>
                <option value={ClientStatus.ACTIVE}>{t('status.active', { ns: 'common' })}</option>
                <option value={ClientStatus.PAUSED}>{t('status.paused', { ns: 'common' })}</option>
                <option value={ClientStatus.OVERDUE}>{t('status.overdue', { ns: 'common' })}</option>
                <option value={ClientStatus.LEAD}>{t('status.lead', { ns: 'common' })}</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal">{t('primaryGoal')}</Label>
              <Input id="goal" name="goal" placeholder={t('goalPlaceholder')} />
            </div>
          </div>

          {(modality === 'ONLINE' || modality === 'HYBRID') && (
            <div className="space-y-1.5 p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100">
              <Label htmlFor="frequency" className="text-indigo-900 font-semibold">
                {t('checkInFrequency')}
              </Label>
              <Select id="frequency" name="frequency" className="border-indigo-200 focus:ring-indigo-500 bg-white">
                <option value="Weekly">{t('frequencyWeekly')}</option>
                <option value="Bi-weekly">{t('frequencyBiweekly')}</option>
                <option value="Monthly">{t('frequencyMonthly')}</option>
              </Select>
            </div>
          )}

          {/* Plano de Assinatura */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <Label>{t('subscriptionPlan')}</Label>
              <Button type="button" variant="ghost" className="h-auto p-1 text-xs text-indigo-600 hover:text-indigo-800" onClick={() => setIsCustomPlan(!isCustomPlan)}>
                {isCustomPlan ? t('selectExistingPlan') : t('createCustomPlan')}
              </Button>
            </div>
            {isCustomPlan ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <Input name="name" placeholder={t('planTitle', { ns: 'workouts' })} value={customPlan.name} onChange={handleCustomPlanChange} />
                <div className="grid grid-cols-2 gap-2">
                  <Input name="sessionsPerWeek" type="number" min="1" max="6" value={customPlan.sessionsPerWeek} onChange={handleCustomPlanChange} />
                  <Input name="price" type="number" step="10" value={customPlan.price} onChange={handleCustomPlanChange} />
                </div>
              </div>
            ) : (
              <Select id="planId" name="planId">
                <option value="">{t('selectPlan')}</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {formatPlanLabel(plan, tco('perMonth'))}
                  </option>
                ))}
              </Select>
            )}
          </div>

          {/* Observações Gerais */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <Label htmlFor="notes" className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-slate-500" />
              {t('notes')}
            </Label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder={t('notesPlaceholder')}
              className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-slate-800 resize-y"
            />
          </div>

          {/* Notificações WhatsApp Toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none bg-slate-50 p-3 rounded-lg border border-slate-200/80 hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                name="notificationEnabled"
                checked={notificationEnabled}
                onChange={(e) => setNotificationEnabled(e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <Bell className="h-4 w-4 text-indigo-600" />
              <span className="text-xs sm:text-sm font-medium text-slate-700">{t('notificationEnabled')}</span>
            </label>
          </div>

          {/* Histórico Médico e Limitações */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" className="w-full flex items-center justify-between" onClick={() => setShowMedical(!showMedical)}>
              <span className="flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-rose-500" /> {t('medicalHistoryOptional')}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showMedical ? 'rotate-180' : ''}`} />
            </Button>

            {showMedical && (
              <div className="p-4 bg-slate-50/90 border border-slate-200 rounded-xl space-y-3 animate-in fade-in">
                <div className="space-y-1.5">
                  <Label>{t('injuries')}</Label>
                  <Input name="injuries" placeholder={t('injuriesPlaceholder')} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('medications')}</Label>
                  <Input name="medications" placeholder={t('medicationsPlaceholder')} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('surgeries')}</Label>
                  <Input name="surgeries" placeholder={t('surgeriesPlaceholder')} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={hasHeartDisease}
                      onChange={(e) => setHasHeartDisease(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {t('hasHeartDisease')}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input type="checkbox" checked={smoker} onChange={(e) => setSmoker(e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    {t('smoker')}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input type="checkbox" checked={drinker} onChange={(e) => setDrinker(e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    {t('drinker')}
                  </label>
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label>{t('healthObservations')}</Label>
                  <Input name="medicalObservations" placeholder={t('healthObservationsPlaceholder')} />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              {tco('cancel')}
            </Button>
            <Button type="submit">{t('addClient')}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
