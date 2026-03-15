import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router'
import { parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'

import { useStore } from '../../../store/store'
import { type Session } from '../../../types'
import { Card, Button } from '../../atoms'
import { formatLocalized } from '../../../utils/dateLocale'

interface ConflictsCardProps {
  conflicts: Session[][]
}

export const ConflictsCard: React.FC<ConflictsCardProps> = ({ conflicts }) => {
  const { clients } = useStore()
  const { t } = useTranslation('schedule')
  const navigate = useNavigate()

  return (
    <Card className="col-span-full bg-red-50 border-red-200 animate-in fade-in">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-900">
              {t('conflictsDetected', { count: conflicts.length })}
            </h3>
            <p className="text-sm text-red-700">{t('conflictsMessage')}</p>
          </div>
        </div>
        <div className="mt-4 space-y-3 max-h-48 overflow-y-auto pr-2">
          {conflicts.map((group, index) => (
            <div key={index} className="p-3 bg-white rounded-md border border-red-200">
              <p className="text-xs font-semibold text-red-800 mb-2">{t('conflictGroup', { index: index + 1 })}</p>
              <div className="space-y-1">
                {group.map((session) => {
                  const client = clients.find((c) => c.id === session.clientId)
                  return (
                    <div key={session.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-slate-700">{client?.name || '...'}</span>
                      <span className="text-slate-500">{formatLocalized(parseISO(session.date), 'MMM d, h:mm a')}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <Button variant="danger" className="mt-4 w-full" onClick={() => navigate('/schedule')}>
          {t('resolveConflicts')}
        </Button>
      </div>
    </Card>
  )
}
