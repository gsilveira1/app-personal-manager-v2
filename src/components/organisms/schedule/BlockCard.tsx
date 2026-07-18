import { Ban, Repeat, Trash2 } from 'lucide-react'
import { parseISO } from 'date-fns'
import { formatLocalized } from '../../../utils/dateLocale'
import { type MaterializedBlock } from '../../../types'

interface BlockCardProps {
  block: MaterializedBlock
  onClick?: () => void
  onDelete?: () => void
  compact?: boolean
}

export const BlockCard = ({ block, onClick, onDelete, compact }: BlockCardProps) => {
  const startTime = formatLocalized(parseISO(block.start), 'h:mm a')
  const endTime = formatLocalized(parseISO(block.end), 'h:mm a')

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-[10px] truncate">
        <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-slate-400" />
        <span className="text-slate-500">{block.title}</span>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className="relative p-3 rounded-lg border-2 border-dashed border-slate-300 bg-slate-100 cursor-pointer hover:border-slate-400 transition-colors"
      style={{
        backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(148,163,184,0.15) 4px, rgba(148,163,184,0.15) 8px)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Ban className="h-4 w-4 text-slate-500 shrink-0" />
          <span className="font-medium text-sm text-slate-700 truncate">{block.title}</span>
          {block.isRecurring && <Repeat className="h-3 w-3 text-slate-400 shrink-0" />}
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 text-slate-400 hover:text-red-500 transition-colors shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="text-xs text-slate-500 mt-1">
        {startTime} — {endTime}
      </div>
      {block.notes && <div className="text-xs text-slate-400 mt-1 truncate">{block.notes}</div>}
    </div>
  )
}
