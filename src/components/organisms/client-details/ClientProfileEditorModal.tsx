import React, { useState, useEffect } from 'react'
import { X, HeartPulse, ChevronDown, Bell, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button, Input, Select, Label } from '../../atoms'
import { useStore } from '../../../states/stores/store'
import { ClientStatus, ClientModality } from '../../../types'
import type { Client, MedicalHistory, CheckInFrequency } from '../../../types'

interface ClientProfileEditorModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client
}

type FormData = {
  name: string
  email: string
  phone: string
  status: ClientStatus
  modality: ClientModality
  dateOfBirth?: string
  checkInFrequency?: CheckInFrequency
  goal?: string
  planId?: string
  notes?: string
  notificationEnabled: boolean
  medicalHistory?: MedicalHistory
}

export const ClientProfileEditorModal: React.FC<ClientProfileEditorModalProps> = ({ isOpen, onClose, client }) => {
  const { t } = useTranslation('clients')
  const { t: tco } = useTranslation('common')
  const { updateClient, plans } = useStore()
  const [showMedical, setShowMedical] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    name: client.name,
    email: client.email,
    phone: client.phone,
    status: client.status || ClientStatus.ACTIVE,
    modality: client.modality || ClientModality.PRESENCIAL,
    dateOfBirth: client.dateOfBirth ? client.dateOfBirth.split('T')[0] : '',
    checkInFrequency: client.checkInFrequency || undefined,
    goal: client.goal || '',
    planId: client.planId || '',
    notes: client.notes || '',
    notificationEnabled: client.notificationEnabled !== undefined ? client.notificationEnabled : true,
    medicalHistory: client.medicalHistory,
  })

  // Medical history local fields
  const [injuries, setInjuries] = useState(client.medicalHistory?.injuries || '')
  const [medications, setMedications] = useState(client.medicalHistory?.medications || '')
  const [surgeries, setSurgeries] = useState(client.medicalHistory?.surgeries || '')
  const [observations, setObservations] = useState(client.medicalHistory?.observations || '')
  const [hasHeartDisease, setHasHeartDisease] = useState(client.medicalHistory?.hasHeartDisease || false)
  const [smoker, setSmoker] = useState(client.medicalHistory?.smoker || false)
  const [drinker, setDrinker] = useState(client.medicalHistory?.drinker || false)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        status: client.status || ClientStatus.ACTIVE,
        modality: client.modality || ClientModality.PRESENCIAL,
        dateOfBirth: client.dateOfBirth ? client.dateOfBirth.split('T')[0] : '',
        checkInFrequency: client.checkInFrequency || undefined,
        goal: client.goal || '',
        planId: client.planId || '',
        notes: client.notes || '',
        notificationEnabled: client.notificationEnabled !== undefined ? client.notificationEnabled : true,
        medicalHistory: client.medicalHistory,
      })

      setInjuries(client.medicalHistory?.injuries || '')
      setMedications(client.medicalHistory?.medications || '')
      setSurgeries(client.medicalHistory?.surgeries || '')
      setObservations(client.medicalHistory?.observations || '')
      setHasHeartDisease(client.medicalHistory?.hasHeartDisease || false)
      setSmoker(client.medicalHistory?.smoker || false)
      setDrinker(client.medicalHistory?.drinker || false)
    }
  }, [isOpen, client])

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const hasAnyMedical = injuries || medications || surgeries || observations || hasHeartDisease || smoker || drinker
    const medicalHistory: MedicalHistory | undefined = hasAnyMedical
      ? {
          ...client.medicalHistory,
          injuries: injuries || undefined,
          medications: medications || undefined,
          surgeries: surgeries || undefined,
          observations: observations || undefined,
          hasHeartDisease,
          smoker,
          drinker,
        }
      : undefined

    updateClient(client.id, {
      ...formData,
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
      medicalHistory,
      planId: formData.planId || undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{t('editProfile')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Atualize os dados cadastrais, plano e histórico do aluno.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Identificação Básica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('fullName')}</label>
              <Input name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('dateOfBirth')}</label>
              <Input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('email')}</label>
              <Input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('phone')}</label>
              <Input name="phone" value={formData.phone} onChange={handleChange} required />
            </div>
          </div>

          {/* Modalidade, Status e Objetivo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('modality')}</label>
              <Select name="modality" value={formData.modality} onChange={handleChange}>
                <option value="PRESENCIAL">{t('modalityPresencial')}</option>
                <option value="ONLINE">{t('modalityOnline')}</option>
                <option value="HYBRID">{t('modalityHybrid')}</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('status')}</label>
              <Select name="status" value={formData.status} onChange={handleChange}>
                <option value={ClientStatus.ACTIVE}>{t('status.active', { ns: 'common' })}</option>
                <option value={ClientStatus.PAUSED}>{t('status.paused', { ns: 'common' })}</option>
                <option value={ClientStatus.OVERDUE}>{t('status.overdue', { ns: 'common' })}</option>
                <option value={ClientStatus.LEAD}>{t('status.lead', { ns: 'common' })}</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('primaryGoal')}</label>
              <Input name="goal" value={formData.goal || ''} onChange={handleChange} placeholder={t('goalPlaceholder')} />
            </div>
          </div>

          {/* Check-in e Plano */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(formData.modality === 'ONLINE' || formData.modality === 'HYBRID') ? (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">{t('checkInFrequency')}</label>
                <Select name="checkInFrequency" value={formData.checkInFrequency || ''} onChange={handleChange}>
                  <option value="">{t('none')}</option>
                  <option value="Weekly">{t('frequencyWeekly')}</option>
                  <option value="Bi-weekly">{t('frequencyBiweekly')}</option>
                  <option value="Monthly">{t('frequencyMonthly')}</option>
                </Select>
              </div>
            ) : <div />}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('subscriptionPlan')}</label>
              <Select name="planId" value={formData.planId || ''} onChange={handleChange}>
                <option value="">{t('noPlan')}</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Observações Gerais */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-slate-500" />
              {t('notes')}
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder={t('notesPlaceholder')}
              className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-slate-800 resize-y"
            />
          </div>

          {/* Notificações WhatsApp */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none bg-slate-50 p-3 rounded-lg border border-slate-200/80 hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                name="notificationEnabled"
                checked={formData.notificationEnabled}
                onChange={(e) => setFormData((prev) => ({ ...prev, notificationEnabled: e.target.checked }))}
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
                <HeartPulse className="h-4 w-4 text-rose-500" /> {t('medicalHistory')}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showMedical ? 'rotate-180' : ''}`} />
            </Button>

            {showMedical && (
              <div className="p-4 bg-slate-50/90 border border-slate-200 rounded-xl space-y-3 animate-in fade-in">
                <div className="space-y-1.5">
                  <Label>{t('injuries')}</Label>
                  <Input value={injuries} onChange={(e) => setInjuries(e.target.value)} placeholder={t('injuriesPlaceholder')} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('medications')}</Label>
                  <Input value={medications} onChange={(e) => setMedications(e.target.value)} placeholder={t('medicationsPlaceholder')} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('surgeries')}</Label>
                  <Input value={surgeries} onChange={(e) => setSurgeries(e.target.value)} placeholder={t('surgeriesPlaceholder')} />
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
                    <input
                      type="checkbox"
                      checked={smoker}
                      onChange={(e) => setSmoker(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {t('smoker')}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={drinker}
                      onChange={(e) => setDrinker(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {t('drinker')}
                  </label>
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label>{t('healthObservations')}</Label>
                  <Input value={observations} onChange={(e) => setObservations(e.target.value)} placeholder={t('healthObservationsPlaceholder')} />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={onClose}>
              {tco('cancel')}
            </Button>
            <Button type="submit">{tco('save')}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
