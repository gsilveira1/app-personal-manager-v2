import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Repeat, AlertTriangle } from 'lucide-react'
import { format, parseISO, add } from 'date-fns'
import { Card, Button, Label, Select, Input } from '../../atoms'
import { isTimeSlotTaken } from '../../../utils/scheduleUtils'
import { formatLocalized } from '../../../utils/dateLocale'
import { type Client, type Session } from '../../../types'
import { WEEKDAYS, buildRrule, rruleHumanText } from '../../../utils/rruleHelpers'

const SessionEditorModal = ({ isOpen, onClose, onSaveNew, onSaveRecurring: _onSaveRecurring, onSaveRecurringEvent, onUpdate, sessionToEdit, clients, sessions, initialDate }: any) => {
  const { t } = useTranslation('schedule')
  const { t: tco } = useTranslation('common')
  const [formData, setFormData] = useState({
    clientId: clients[0]?.id || '',
    date: format(initialDate, 'yyyy-MM-dd'),
    time: format(initialDate, 'HH:mm'),
    durationMinutes: 60,
    notes: '',
    linkedWorkoutId: '',
  })
  const [isRecurring, setIsRecurring] = useState(false)

  // RRULE builder state
  const [rruleFreq, setRruleFreq] = useState('WEEKLY')
  const [rruleInterval, setRruleInterval] = useState(1)
  const [rruleDays, setRruleDays] = useState<string[]>(() => {
    // Pre-select day matching initialDate
    const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
    return [dayMap[initialDate.getDay()]]
  })
  const [rruleEndType, setRruleEndType] = useState<'until' | 'count'>('count')
  const [rruleUntil, setRruleUntil] = useState(format(add(initialDate, { months: 3 }), 'yyyy-MM-dd'))
  const [rruleCount, setRruleCount] = useState(12)

  const [isRecurrencePromptOpen, setIsRecurrencePromptOpen] = useState(false)
  const [pendingUpdate, setPendingUpdate] = useState<Partial<Session> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (sessionToEdit) {
      const d = parseISO(sessionToEdit.date)
      setFormData({
        clientId: sessionToEdit.clientId,
        date: format(d, 'yyyy-MM-dd'),
        time: format(d, 'HH:mm'),
        durationMinutes: sessionToEdit.durationMinutes,
        notes: sessionToEdit.notes || '',
        linkedWorkoutId: sessionToEdit.linkedWorkoutId || '',
      })
      setIsRecurring(!!sessionToEdit.recurrenceId)
    }
  }, [sessionToEdit])

  const toggleDay = (day: string) =>
    setRruleDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day])

  const client = clients.find((c: Client) => c.id === formData.clientId)
  const sessionType: 'Online' | 'In-Person' = client?.type === 'Online' ? 'Online' : 'In-Person'
  const sessionCategory: 'Check-in' | 'Workout' = client?.type === 'Online' ? 'Check-in' : 'Workout'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const combinedDate = new Date(`${formData.date}T${formData.time}`)

    const conflictingSession = isTimeSlotTaken(sessions, combinedDate, Number(formData.durationMinutes), sessionToEdit?.id)
    if (conflictingSession) {
      const conflictClientName = clients.find((c: any) => c.id === conflictingSession.clientId)?.name || t('aClient')
      setError(t('timeConflict', { clientName: conflictClientName, time: formatLocalized(parseISO(conflictingSession.date), 'h:mm a') }))
      return
    }

    const baseSession = {
      clientId: formData.clientId,
      date: combinedDate.toISOString(),
      durationMinutes: Number(formData.durationMinutes),
      type: sessionType,
      category: sessionCategory,
      notes: formData.notes,
      linkedWorkoutId: formData.linkedWorkoutId,
    }

    if (sessionToEdit) {
      const dateChanged = combinedDate.toISOString() !== sessionToEdit.date
      if ((sessionToEdit.recurrenceId || sessionToEdit.recurringEventId) && dateChanged) {
        setPendingUpdate(baseSession)
        setIsRecurrencePromptOpen(true)
      } else {
        onUpdate(sessionToEdit.id, baseSession, 'single')
        onClose()
      }
    } else {
      if (isRecurring) {
        // Use RRULE-based recurring event
        const rrule = buildRrule(rruleFreq, rruleInterval, rruleDays, rruleEndType, rruleUntil, rruleCount)
        onSaveRecurringEvent({
          rrule,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          dtstart: combinedDate.toISOString(),
          durationMinutes: Number(formData.durationMinutes),
          type: sessionType,
          category: sessionCategory,
          clientId: formData.clientId,
          linkedWorkoutId: formData.linkedWorkoutId || undefined,
          notes: formData.notes || undefined,
        })
      } else {
        onSaveNew(baseSession)
      }
      onClose()
    }
  }
  if (!isOpen) return null

  const rrulePreview = isRecurring
    ? rruleHumanText(rruleFreq, rruleInterval, rruleDays, rruleEndType, rruleUntil, rruleCount)
    : ''

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <Card className="w-full max-w-md bg-white shadow-xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
          <div className="p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
            <h2 className="text-lg font-bold text-slate-900">{sessionToEdit ? t('editSession') : t('newSession')}</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>{t('client')}</Label>
              <Select name="clientId" value={formData.clientId} onChange={handleChange}>
                {clients
                  .filter((c: Client) => c.status === 'Active')
                  .map((c: Client) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('date')}</Label>
                <Input name="date" type="date" required value={formData.date} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>{t('time')}</Label>
                <Input name="time" type="time" required value={formData.time} onChange={handleChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('duration')}</Label>
              <Select name="durationMinutes" value={formData.durationMinutes} onChange={handleChange}>
                <option value="30">{tco('durationMin', { minutes: 30 })}</option>
                <option value="45">{tco('durationMin', { minutes: 45 })}</option>
                <option value="60">{tco('durationMin', { minutes: 60 })}</option>
                <option value="90">{tco('durationMin', { minutes: 90 })}</option>
              </Select>
            </div>

            {/* ── Recurrence toggle (only for new sessions) ── */}
            {!sessionToEdit && (
              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="rounded" />
                  <Repeat className="h-4 w-4 text-indigo-500" /> {t('makeRecurring')}
                </label>
              </div>
            )}

            {/* ── RRULE Builder ── */}
            {isRecurring && !sessionToEdit && (
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg space-y-4 animate-in fade-in">
                {/* Frequency + Interval */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{t('frequency')}</Label>
                    <Select value={rruleFreq} onChange={(e) => setRruleFreq(e.target.value)}>
                      <option value="DAILY">{t('daily')}</option>
                      <option value="WEEKLY">{t('weekly')}</option>
                      <option value="MONTHLY">{t('monthly')}</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('every')}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="52"
                        value={rruleInterval}
                        onChange={(e) => setRruleInterval(Number(e.target.value))}
                        className="w-16 text-center"
                      />
                      <span className="text-sm text-slate-500">{rruleFreq === 'DAILY' ? t('intervalDays') : rruleFreq === 'WEEKLY' ? t('intervalWeeks') : t('intervalMonths')}</span>
                    </div>
                  </div>
                </div>

                {/* Day-of-week selector (only for WEEKLY) */}
                {rruleFreq === 'WEEKLY' && (
                  <div className="space-y-1.5">
                    <Label>{t('onDays')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map(({ label, rruleDay }) => (
                        <button
                          key={rruleDay}
                          type="button"
                          onClick={() => toggleDay(rruleDay)}
                          className={`w-10 h-10 rounded-full text-xs font-semibold border transition-all ${rruleDays.includes(rruleDay)
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                            }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* End condition */}
                <div className="space-y-2">
                  <Label>{t('ends')}</Label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="radio" name="endType" value="count" checked={rruleEndType === 'count'} onChange={() => setRruleEndType('count')} />
                      {t('after')}
                    </label>
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="radio" name="endType" value="until" checked={rruleEndType === 'until'} onChange={() => setRruleEndType('until')} />
                      {t('onDate')}
                    </label>
                  </div>
                  {rruleEndType === 'count' ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={rruleCount}
                        onChange={(e) => setRruleCount(Number(e.target.value))}
                        className="w-20 text-center"
                      />
                      <span className="text-sm text-slate-500">{t('occurrences')}</span>
                    </div>
                  ) : (
                    <Input type="date" value={rruleUntil} onChange={(e) => setRruleUntil(e.target.value)} />
                  )}
                </div>

                {/* Human-readable preview */}
                {rrulePreview && (
                  <p className="text-xs text-indigo-700 bg-indigo-100 px-3 py-2 rounded-md font-medium">
                    {rrulePreview}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('notes')}</Label>
              <Input name="notes" placeholder={t('sessionNotesPlaceholder')} value={formData.notes} onChange={handleChange} />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-md flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('cancel', { ns: 'common' })}
              </Button>
              <Button type="submit">{t('save', { ns: 'common' })}</Button>
            </div>
          </form>
        </Card>
      </div>
      {isRecurrencePromptOpen && (
        <RecurrenceUpdateModal
          onConfirm={(scope: any) => {
            onUpdate(sessionToEdit.id, pendingUpdate, scope)
            onClose()
          }}
          onCancel={() => setIsRecurrencePromptOpen(false)}
        />
      )}
    </>
  )
}

const RecurrenceUpdateModal = ({ onConfirm, onCancel }: any) => {
  const { t } = useTranslation('schedule')
  const { t: tco } = useTranslation('common')
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-sm p-6 text-center shadow-2xl animate-in zoom-in-90">
        <div className="mx-auto bg-amber-100 h-12 w-12 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>
        <h3 className="text-lg font-bold mt-4 text-slate-900">{t('editRecurring')}</h3>
        <p className="text-sm text-slate-500 mt-2">{t('recurrenceUpdateMessage')}</p>
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={() => onConfirm('future')}>{t('thisAndFuture')}</Button>
          <Button variant="secondary" onClick={() => onConfirm('single')}>
            {t('onlyThis')}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            {tco('cancel')}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export { SessionEditorModal, RecurrenceUpdateModal }
