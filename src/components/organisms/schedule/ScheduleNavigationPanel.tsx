import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, Button } from '../../atoms'

/**
 * Props for the ScheduleNavigationPanel component.
 */
export interface ScheduleNavigationPanelProps {
  /** The text to display in the header. */
  headerText: string
  /** Callback to navigate to the previous period. */
  onPrevious: () => void
  /** Callback to navigate to today. */
  onToday: () => void
  /** Callback to navigate to the next period. */
  onNext: () => void
}

/**
 * Navigation panel for the schedule (previous, today, next).
 *
 * @param props - The component props.
 * @returns The schedule navigation panel component.
 */
export const ScheduleNavigationPanel = ({ headerText, onPrevious, onToday, onNext }: ScheduleNavigationPanelProps) => {
  const { t } = useTranslation('schedule')

  return (
    <Card className="p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm border-slate-200">
      <div className="flex items-center gap-2">
        <button onClick={onPrevious} className="p-2 hover:bg-slate-100 rounded-full">
          <ChevronLeft className="h-5 w-5 text-slate-600" />
        </button>
        <Button variant="outline" onClick={onToday} className="hidden sm:flex text-xs h-8">
          {t('today')}
        </Button>
      </div>
      <div className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-[200px] sm:max-w-none">{headerText}</div>
      <button onClick={onNext} className="p-2 hover:bg-slate-100 rounded-full">
        <ChevronRight className="h-5 w-5 text-slate-600" />
      </button>
    </Card>
  )
}
