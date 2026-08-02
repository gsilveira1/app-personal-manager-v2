import { Calendar as CalendarIcon, Info } from 'lucide-react'

/**
 * Props for the ScheduleOverviewBanner component.
 */
export interface ScheduleOverviewBannerProps {
  /** The text to display as the title. */
  title: string
  /** The text to display as the subtitle/header text. */
  headerText: string
  /** The statistics to display. */
  stats: Record<string, string | number>
  /** Callback fired when the banner is clicked. */
  onClick: () => void
}

/**
 * Banner displaying schedule overview statistics.
 *
 * @param props - The component props.
 * @returns The schedule overview banner component.
 */
export const ScheduleOverviewBanner = ({ title, headerText, stats, onClick }: ScheduleOverviewBannerProps) => {
  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center gap-2">
        <div className="p-2 bg-indigo-500/50 rounded-lg">
          <CalendarIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm opacity-90 capitalize flex items-center gap-1.5">
            {title} <Info className="h-3 w-3 opacity-70" />
          </h3>
          <p className="text-xs text-indigo-100">{headerText}</p>
        </div>
      </div>
      <div className="flex items-center gap-6 text-sm w-full sm:w-auto justify-between sm:justify-end">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="flex flex-col items-center sm:items-end">
            <span className="text-indigo-200 text-xs uppercase tracking-wider font-medium">{key}</span>
            <span className="font-bold text-xl">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
