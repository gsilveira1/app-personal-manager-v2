import React from 'react'
import { HeartPulse, Edit2, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card } from '../../atoms'
import type { Client, MedicalHistory } from '../../../types'

interface MedicalHistoryCardProps {
  client: Client
  isEditing: boolean
  buffer: MedicalHistory
  onStartEdit: () => void
  onSave: () => void
  onBufferChange: (buffer: MedicalHistory) => void
}

export const MedicalHistoryCard: React.FC<MedicalHistoryCardProps> = ({
  client,
  isEditing,
  buffer,
  onStartEdit,
  onSave,
  onBufferChange,
}) => {
  const { t } = useTranslation('clients')

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
          <HeartPulse className="h-5 w-5 mr-2 text-indigo-600" />
          {t('medicalHistory')}
        </h3>
        {!isEditing ? (
          <button onClick={onStartEdit} className="text-slate-400 hover:text-indigo-600">
            <Edit2 className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={onSave} className="text-green-600 hover:text-green-700">
            <Save className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">{t('mainGoal')}:</span>
          <span className="font-medium text-slate-800">{client.medicalHistory?.objective?.join(', ') || client.goal}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">{t('injuries')}:</span>
          {isEditing ? (
            <input
              type="text"
              className="p-1 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={buffer.injuries || ''}
              onChange={(e) => onBufferChange({ ...buffer, injuries: e.target.value })}
            />
          ) : (
            <span className="font-medium text-slate-800">{client.medicalHistory?.injuries || t('none')}</span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">{t('surgeries')}:</span>
          {isEditing ? (
            <input
              type="text"
              className="p-1 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={buffer.surgeries || ''}
              onChange={(e) => onBufferChange({ ...buffer, surgeries: e.target.value })}
            />
          ) : (
            <span className="font-medium text-slate-800">{client.medicalHistory?.surgeries || t('none')}</span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">{t('medications')}:</span>
          {isEditing ? (
            <input
              type="text"
              className="p-1 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={buffer.medications || ''}
              onChange={(e) => onBufferChange({ ...buffer, medications: e.target.value })}
            />
          ) : (
            <span className="font-medium text-slate-800">{client.medicalHistory?.medications || t('none')}</span>
          )}
        </div>
      </div>
    </Card>
  )
}
