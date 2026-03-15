import React, { useState } from 'react'
import { HeartPulse, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../../../store/store'
import { ClientStatus } from '../../../types'
import type { Client, ClientType, CheckInFrequency, Plan, MedicalHistory } from '../../../types'
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
  const [clientType, setClientType] = useState<ClientType>('In-Person')
  const [isCustomPlan, setIsCustomPlan] = useState(false)
  const [showMedical, setShowMedical] = useState(false)

  const [customPlan, setCustomPlan] = useState<Omit<Plan, 'id'>>({ type: 'PRESENCIAL', name: '', sessionsPerWeek: 2, durationMinutes: 60, price: 400 })

  const handleCustomPlanChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setCustomPlan((prev) => ({ ...prev, [name]: name === 'name' ? value : Number(value) }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const medicalHistory: MedicalHistory = {
      injuries: formData.get('injuries') as string,
      medications: formData.get('medications') as string,
      surgeries: formData.get('surgeries') as string,
    }

    const newClient: Omit<Client, 'id' | 'avatar'> = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      dateOfBirth: formData.get('dateOfBirth') as string,
      status: formData.get('status') as ClientStatus,
      type: clientType,
      checkInFrequency: clientType === 'Online' ? (formData.get('frequency') as CheckInFrequency) : undefined,
      goal: formData.get('goal') as string,
      planId: isCustomPlan ? undefined : (formData.get('planId') as string),
      medicalHistory: showMedical ? medicalHistory : undefined,
    }

    const customPlanData = isCustomPlan ? { ...customPlan, name: customPlan.name || `${newClient.name}'s Plan` } : undefined

    onSave(newClient, customPlanData)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg bg-white shadow-xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-900">{t('addClient')}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* ... basic info fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('fullName')}</Label>
              <Input id="name" name="name" required placeholder={t('namePlaceholder')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">{t('dateOfBirth')}</Label>
              <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" name="email" type="email" required placeholder={t('emailPlaceholder')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone')}</Label>
              <Input id="phone" name="phone" required placeholder={t('phonePlaceholder')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">{t('status')}</Label>
              <Select id="status" name="status">
                <option value={ClientStatus.Active}>{t(`status.${ClientStatus.Active.toLowerCase()}`, { ns: 'common' })}</option>
                <option value={ClientStatus.Inactive}>{t(`status.${ClientStatus.Inactive.toLowerCase()}`, { ns: 'common' })}</option>
                <option value={ClientStatus.Lead}>{t(`status.${ClientStatus.Lead.toLowerCase()}`, { ns: 'common' })}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">{t('type')}</Label>
              <Select id="type" name="type" value={clientType} onChange={(e) => setClientType(e.target.value as ClientType)}>
                <option value="In-Person">{t('inPerson')}</option>
                <option value="Online">{t('online')}</option>
              </Select>
            </div>
          </div>
          {clientType === 'Online' && (
            <div className="space-y-2 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <Label htmlFor="frequency" className="text-indigo-900">
                {t('checkInFrequency')}
              </Label>
              <Select id="frequency" name="frequency" className="border-indigo-200 focus:ring-indigo-500">
                <option value="Weekly">{t('frequencyWeekly')}</option>
                <option value="Bi-weekly">{t('frequencyBiweekly')}</option>
                <option value="Monthly">{t('frequencyMonthly')}</option>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="goal">{t('primaryGoal')}</Label>
            <Input id="goal" name="goal" placeholder={t('goalPlaceholder')} />
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <Label>{t('subscriptionPlan')}</Label>
              <Button type="button" variant="ghost" className="h-auto p-1 text-xs text-indigo-600 hover:text-indigo-800" onClick={() => setIsCustomPlan(!isCustomPlan)}>
                {isCustomPlan ? t('selectExistingPlan') : t('createCustomPlan')}
              </Button>
            </div>
            {isCustomPlan ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
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

          <div className="space-y-2 pt-2">
            <Button type="button" variant="outline" className="w-full" onClick={() => setShowMedical(!showMedical)}>
              <HeartPulse className="h-4 w-4 mr-2" /> {t('medicalHistoryOptional')} <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${showMedical ? 'rotate-180' : ''}`} />
            </Button>
            {showMedical && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 animate-in fade-in">
                <div className="space-y-2">
                  <Label>{t('injuries')}</Label>
                  <Input name="injuries" placeholder={t('injuriesPlaceholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('medications')}</Label>
                  <Input name="medications" placeholder={t('medicationsPlaceholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('surgeries')}</Label>
                  <Input name="surgeries" placeholder={t('surgeriesPlaceholder')} />
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
