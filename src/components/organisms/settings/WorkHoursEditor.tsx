import { useState, useEffect, useCallback, useRef } from 'react'
import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../../../store/store'
import { type WorkHoursConfig, type DaySchedule } from '../../../types'
import { Card, Input, Select, Label } from '../../atoms'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
type DayKey = (typeof DAYS)[number]

const DAY_LABELS: Record<string, Record<DayKey, string>> = {
  'pt-BR': { monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta', thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo' },
  en: { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' },
  es: { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' },
}

const SLOT_OPTIONS = [
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '60 min' },
  { value: '90', label: '90 min' },
]

export const WorkHoursEditor = () => {
  const { t, i18n } = useTranslation('settings')
  const { workHours, updateWorkHours } = useStore()
  const [config, setConfig] = useState<WorkHoursConfig>(workHours)
  const [saving, setSaving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setConfig(workHours)
  }, [workHours])

  const save = useCallback(
    (newConfig: WorkHoursConfig) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        setSaving(true)
        try {
          await updateWorkHours(newConfig)
        } catch (err) {
          console.error('Failed to save work hours:', err)
        } finally {
          setSaving(false)
        }
      }, 800)
    },
    [updateWorkHours]
  )

  const updateDay = (day: DayKey, field: keyof DaySchedule, value: string | boolean) => {
    const newConfig = {
      ...config,
      [day]: { ...config[day], [field]: value },
    }
    setConfig(newConfig)
    save(newConfig)
  }

  const updateSlotDuration = (value: string) => {
    const newConfig = { ...config, slotDurationMinutes: parseInt(value, 10) }
    setConfig(newConfig)
    save(newConfig)
  }

  const lang = i18n?.language || 'pt-BR'
  const labels = DAY_LABELS[lang] ?? DAY_LABELS['pt-BR']

  return (
    <Card>
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center">
          <Clock className="mr-3 h-5 w-5 text-indigo-600" />
          {t('workHoursTitle', 'Horário de Funcionamento')}
        </h2>
        <p className="text-sm text-slate-500 mt-1">{t('workHoursSubtitle', 'Defina os horários de trabalho para cada dia da semana')}</p>
      </div>
      <div className="p-6 space-y-4">
        {DAYS.map((day) => (
          <div key={day} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-24 shrink-0">
              <Label className="text-sm font-medium text-slate-700">{labels[day]}</Label>
            </div>
            <label className="flex items-center gap-2 shrink-0">
              <input
                type="checkbox"
                checked={config[day].enabled}
                onChange={(e) => updateDay(day, 'enabled', e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-600">{t('enabled', 'Ativo')}</span>
            </label>
            <div className="flex items-center gap-2">
              <Input type="time" value={config[day].start} onChange={(e) => updateDay(day, 'start', e.target.value)} disabled={!config[day].enabled} className="w-28 text-sm" />
              <span className="text-slate-400">—</span>
              <Input type="time" value={config[day].end} onChange={(e) => updateDay(day, 'end', e.target.value)} disabled={!config[day].enabled} className="w-28 text-sm" />
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Label className="text-sm font-medium text-slate-700 w-24 shrink-0">{t('slotDuration', 'Duração do Slot')}</Label>
          <Select value={String(config.slotDurationMinutes)} onChange={(e) => updateSlotDuration(e.target.value)} className="w-32">
            {SLOT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <p className="text-xs text-slate-400 mt-2">{saving ? t('saving', 'Salvando...') : t('autoSave', 'Salvo automaticamente')}</p>
      </div>
    </Card>
  )
}
