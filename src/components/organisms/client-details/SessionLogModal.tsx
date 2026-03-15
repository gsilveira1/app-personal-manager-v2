import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card, Button, Label, Input, Select } from '../../atoms'
import type { Session } from '../../../types'

interface SessionLogModalProps {
  clientId: string
  onClose: () => void
  onSave: (s: Omit<Session, 'id' | 'completed' | 'recurrenceId'>) => Promise<void>
}

export const SessionLogModal: React.FC<SessionLogModalProps> = ({ clientId, onClose, onSave }) => {
  const { t } = useTranslation('clients')
  const { t: ts } = useTranslation('schedule')
  const { t: tc } = useTranslation('common')
  const now = new Date()
  const localDateStr = now.toISOString().slice(0, 10)
  const localTimeStr = now.toTimeString().slice(0, 5)

  const [date, setDate] = useState(localDateStr)
  const [time, setTime] = useState(localTimeStr)
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [type, setType] = useState<'In-Person' | 'Online'>('In-Person')
  const [category, setCategory] = useState<'Workout' | 'Check-in'>('Workout')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const dateISO = new Date(`${date}T${time}`).toISOString()
    await onSave({ clientId, date: dateISO, durationMinutes, type, category, notes: notes || undefined })
    setIsSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-white shadow-xl">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">{t('logNewSession')}</h3>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session-date">{ts('date')}</Label>
                <Input id="session-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-time">{ts('time')}</Label>
                <Input id="session-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-duration">{t('durationMinutes')}</Label>
              <Input
                id="session-duration"
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session-type">{t('type')}</Label>
                <Select id="session-type" value={type} onChange={(e) => setType(e.target.value as 'In-Person' | 'Online')}>
                  <option value="In-Person">{t('inPerson')}</option>
                  <option value="Online">{t('online')}</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-category">{t('category')}</Label>
                <Select id="session-category" value={category} onChange={(e) => setCategory(e.target.value as 'Workout' | 'Check-in')}>
                  <option value="Workout">{t('workout')}</option>
                  <option value="Check-in">{t('checkIn')}</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-notes">{t('sessionNotes')}</Label>
              <Input id="session-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('sessionNotesPlaceholder')} />
            </div>
          </div>
          <div className="flex justify-end space-x-3 p-4 border-t border-slate-100 bg-slate-50">
            <Button type="button" variant="outline" onClick={onClose}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? tc('saving') : ts('saveSession')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
