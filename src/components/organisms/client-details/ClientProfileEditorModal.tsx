import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '../../atoms'
import { useStore } from '../../../states/stores/store'
import type { Client } from '../../../types'

interface ClientProfileEditorModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client
}

type FormData = {
  name: string
  email: string
  phone: string
  status: Client['status']
  type: Client['type']
  dateOfBirth?: string
  checkInFrequency?: Client['checkInFrequency']
  goal?: string
  planId?: string
}

export const ClientProfileEditorModal: React.FC<ClientProfileEditorModalProps> = ({ isOpen, onClose, client }) => {
  const { t } = useTranslation('clients')
  const { t: tco } = useTranslation('common')
  const { updateClient, plans } = useStore()

  const [formData, setFormData] = useState<FormData>({
    name: client.name,
    email: client.email,
    phone: client.phone,
    status: client.status,
    type: client.type,
    dateOfBirth: client.dateOfBirth ? client.dateOfBirth.split('T')[0] : '',
    checkInFrequency: client.checkInFrequency || undefined,
    goal: client.goal || '',
    planId: client.planId || '',
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        status: client.status,
        type: client.type,
        dateOfBirth: client.dateOfBirth ? client.dateOfBirth.split('T')[0] : '',
        checkInFrequency: client.checkInFrequency || undefined,
        goal: client.goal || '',
        planId: client.planId || '',
      })
    }
  }, [isOpen, client])

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateClient(client.id, {
      ...formData,
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-900">{t('editProfile')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('fullName')}</label>
              <input 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('email')}</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('phone')}</label>
              <input 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('dateOfBirth')}</label>
              <input 
                type="date" 
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('status')}</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Lead">Lead</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('type')}</label>
              <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                <option value="In-Person">{t('inPerson')}</option>
                <option value="Online">{t('online')}</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('primaryGoal')}</label>
              <input 
                name="goal"
                value={formData.goal}
                onChange={handleChange}
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('checkInFrequency')}</label>
              <select name="checkInFrequency" value={formData.checkInFrequency || ''} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                <option value="">{t('none')}</option>
                <option value="Weekly">{t('frequencyWeekly')}</option>
                <option value="Bi-weekly">{t('frequencyBiweekly')}</option>
                <option value="Monthly">{t('frequencyMonthly')}</option>
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">{t('subscriptionPlan')}</label>
              <select name="planId" value={formData.planId || ''} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                <option value="">{t('noPlan')}</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={onClose}>{tco('cancel')}</Button>
            <Button type="submit">{tco('save')}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
