import React from 'react'
import { Calendar, Mail, Phone, User, Camera, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '../../atoms'
import type { Client, Plan } from '../../../types'

interface ClientProfileHeaderProps {
  client: Client
  clientPlan?: Plan
  isUploadingAvatar: boolean
  avatarInputRef: React.RefObject<HTMLInputElement | null>
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const ClientProfileHeader: React.FC<ClientProfileHeaderProps> = ({
  client,
  clientPlan,
  isUploadingAvatar,
  avatarInputRef,
  onAvatarChange,
}) => {
  const { t } = useTranslation('clients')
  const { t: tco } = useTranslation('common')

  const age = client.dateOfBirth
    ? new Date().getFullYear() - new Date(client.dateOfBirth).getFullYear()
    : 'N/A'

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
      <button
        type="button"
        className="relative h-24 w-24 rounded-full border-4 border-slate-50 overflow-hidden group shrink-0 cursor-pointer"
        onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
        disabled={isUploadingAvatar}
      >
        {client.avatar ? (
          <img src={client.avatar} alt={client.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-slate-200 flex items-center justify-center">
            <User className="h-10 w-10 text-slate-400" />
          </div>
        )}
        {isUploadingAvatar ? (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
            <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onAvatarChange}
        />
      </button>
      <div className="flex-1">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-3xl font-bold text-slate-900">{client.name}</h1>
              <Badge variant={client.status === 'Active' ? 'success' : 'default'} className="w-fit">
                {client.status}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row gap-x-4 gap-y-1 text-slate-500 text-sm">
              <span className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                {client.email}
              </span>
              <span className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                {client.phone}
              </span>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {t('yearsOld', { age })}
              </span>
            </div>
          </div>
          {clientPlan && (
            <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
              <span className="text-sm font-medium text-indigo-600">{clientPlan.name}</span>
              <span className="text-xs text-slate-500">
                {clientPlan.sessionsPerWeek}x/{tco('weekAcronym')}
                {clientPlan.durationMinutes ? ` · ${clientPlan.durationMinutes}min` : ''} · R$ {clientPlan.price.toFixed(2)}{tco('perMonth')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
