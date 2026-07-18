import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { format, add } from 'date-fns'
import { Repeat } from 'lucide-react'

import { ModalShell } from '../../molecules/ModalShell'
import { Button, Input, Label, Select, Textarea } from '../../atoms'
import { WEEKDAYS, buildRrule, rruleHumanText } from '../../../utils/rruleHelpers'
import { type MaterializedBlock, type AvailabilityBlock } from '../../../types'

interface BlockEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Omit<AvailabilityBlock, 'id'>) => Promise<void>
  onUpdate?: (id: string, data: Partial<AvailabilityBlock>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  blockToEdit?: MaterializedBlock | null
  initialDate?: Date
}

export const BlockEditorModal = ({ isOpen, onClose, onSave, onUpdate, onDelete, blockToEdit, initialDate }: BlockEditorModalProps) => {
  const { t } = useTranslation('schedule')
  const defaultDate = initialDate || new Date()

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(format(defaultDate, 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState(format(defaultDate, 'HH:mm'))
  const [endTime, setEndTime] = useState(format(add(defaultDate, { hours: 1 }), 'HH:mm'))
  const [notes, setNotes] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [rruleDays, setRruleDays] = useState<string[]>(() => {
    const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
    return [dayMap[defaultDate.getDay()]]
  })
  const [rruleEndType, setRruleEndType] = useState<'until' | 'count'>('count')
  const [rruleUntil, setRruleUntil] = useState(format(add(defaultDate, { months: 3 }), 'yyyy-MM-dd'))
  const [rruleCount, setRruleCount] = useState(52)
  const [saving, setSaving] = useState(false)

  const isEditing = !!blockToEdit

  useEffect(() => {
    if (blockToEdit) {
      const start = new Date(blockToEdit.start)
      const end = new Date(blockToEdit.end)
      setTitle(blockToEdit.title)
      setDate(format(start, 'yyyy-MM-dd'))
      setStartTime(format(start, 'HH:mm'))
      setEndTime(format(end, 'HH:mm'))
      setNotes(blockToEdit.notes || '')
      setIsRecurring(blockToEdit.isRecurring)
    }
  }, [blockToEdit])

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const dtstart = new Date(`${date}T${startTime}:00`)
      const dtend = new Date(`${date}T${endTime}:00`)

      const rrule = isRecurring ? buildRrule('WEEKLY', 1, rruleDays, rruleEndType, rruleUntil, rruleCount) : undefined

      if (isEditing && onUpdate) {
        await onUpdate(blockToEdit!.blockId, {
          title,
          dtstart: dtstart.toISOString(),
          dtend: dtend.toISOString(),
          notes: notes || undefined,
          rrule: rrule || null,
        })
      } else {
        await onSave({
          title,
          dtstart: dtstart.toISOString(),
          dtend: dtend.toISOString(),
          timezone: 'America/Sao_Paulo',
          notes: notes || undefined,
          rrule,
        })
      }
      onClose()
    } catch (err) {
      console.error('Failed to save block:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!blockToEdit || !onDelete) return
    if (!window.confirm(t('deleteBlockConfirm', 'Tem certeza que deseja excluir este bloqueio?'))) return
    setSaving(true)
    try {
      await onDelete(blockToEdit.blockId)
      onClose()
    } catch (err) {
      console.error('Failed to delete block:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <ModalShell title={isEditing ? t('editBlock', 'Editar Bloqueio') : t('newBlock', 'Bloquear Horário')} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div>
          <Label htmlFor="block-title">{t('blockTitle', 'Título')}</Label>
          <Input id="block-title" placeholder={t('blockTitlePlaceholder', 'Ex: Almoço, Férias, Reunião...')} value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="block-date">{t('blockDate', 'Data')}</Label>
            <Input id="block-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="block-start">{t('blockStart', 'Início')}</Label>
            <Input id="block-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="block-end">{t('blockEnd', 'Fim')}</Label>
            <Input id="block-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1" />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <Repeat className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-700">{t('recurring', 'Recorrente')}</span>
          </label>
        </div>

        {isRecurring && (
          <div className="space-y-3 pl-6 border-l-2 border-indigo-200">
            <div>
              <Label className="text-xs">{t('repeatOn', 'Repetir em')}</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {WEEKDAYS.map((wd) => (
                  <button
                    key={wd.rruleDay}
                    type="button"
                    onClick={() => setRruleDays((prev) => (prev.includes(wd.rruleDay) ? prev.filter((d) => d !== wd.rruleDay) : [...prev, wd.rruleDay]))}
                    className={`px-2 py-1 text-xs rounded-md border transition-colors ${rruleDays.includes(wd.rruleDay) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'}`}
                  >
                    {wd.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={rruleEndType} onChange={(e) => setRruleEndType(e.target.value as 'until' | 'count')} className="w-28 text-xs">
                <option value="count">{t('times', 'Vezes')}</option>
                <option value="until">{t('until', 'Até')}</option>
              </Select>
              {rruleEndType === 'count' ? (
                <Input type="number" min={1} max={200} value={rruleCount} onChange={(e) => setRruleCount(parseInt(e.target.value, 10) || 1)} className="w-20 text-xs" />
              ) : (
                <Input type="date" value={rruleUntil} onChange={(e) => setRruleUntil(e.target.value)} className="w-40 text-xs" />
              )}
            </div>

            <p className="text-xs text-slate-400">{rruleHumanText('WEEKLY', 1, rruleDays, rruleEndType, rruleUntil, rruleCount)}</p>
          </div>
        )}

        <div>
          <Label htmlFor="block-notes">{t('notes', 'Observações')}</Label>
          <Textarea id="block-notes" rows={2} placeholder={t('blockNotesPlaceholder', 'Observações opcionais...')} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
        </div>
      </div>

      <div className="p-6 border-t border-slate-100 flex justify-between">
        {isEditing && onDelete ? (
          <Button variant="outline" onClick={handleDelete} disabled={saving} className="text-red-600 hover:bg-red-50">
            {t('delete', 'Excluir')}
          </Button>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('cancel', 'Cancelar')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving ? t('saving', 'Salvando...') : isEditing ? t('update', 'Atualizar') : t('block', 'Bloquear')}
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}
