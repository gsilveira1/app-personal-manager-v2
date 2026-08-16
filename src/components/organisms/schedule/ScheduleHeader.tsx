import { Plus, Ban, LayoutGrid, List, CalendarDays } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../atoms'
import type { ViewType } from '../../../hooks/useScheduleNavigation'

/**
 * Props for the ScheduleHeader component.
 */
export interface ScheduleHeaderProps {
  /** The current view type (day, week, month). */
  view: ViewType
  /** Callback fired to change the view type. */
  onViewChange: (view: ViewType) => void
  /** Callback fired to open the block time editor. */
  onOpenBlockEditor: () => void
  /** Callback fired to open the new session editor. */
  onOpenNewSession: () => void
}

const viewIcons: Record<ViewType, React.ElementType> = { day: List, week: LayoutGrid, month: CalendarDays }

/**
 * Header section for the schedule page, containing view toggles and primary actions.
 *
 * @param props - The component props.
 * @returns The schedule header component.
 */
export const ScheduleHeader = ({ view, onViewChange, onOpenBlockEditor, onOpenNewSession }: ScheduleHeaderProps) => {
  const { t } = useTranslation('schedule')

  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full xl:w-auto">
        <div className="flex bg-slate-100 p-1 rounded-lg sm:mr-2 overflow-x-auto">
          {(['day', 'week', 'month'] as ViewType[]).map((v) => {
            const Icon = viewIcons[v]
            return (
              <button
                key={v}
                onClick={() => onViewChange(v)}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center ${view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Icon className="h-4 w-4 mr-1.5" />
                {t(v).charAt(0).toUpperCase() + t(v).slice(1)}
              </button>
            )
          })}
        </div>
        <Button variant="outline" onClick={onOpenBlockEditor} className="whitespace-nowrap">
          <Ban className="mr-2 h-4 w-4" />
          {t('blockTime', 'Bloquear')}
        </Button>
        <Button onClick={onOpenNewSession} className="whitespace-nowrap">
          <Plus className="mr-2 h-4 w-4" />
          {t('addSession')}
        </Button>
      </div>
    </div>
  )
}
