import { useState, useEffect } from 'react'
import { Flame, CheckCircle, Calendar, Trophy } from 'lucide-react'
import { Card } from '../../atoms'
import * as api from '../../../services/api/apiService'
import type { ActivityHeatmapData, ActivityHeatmapDay } from '../../../types'

interface ConsistencyHeatmapProps {
  clientId: string
}

export const ConsistencyHeatmap = ({ clientId }: ConsistencyHeatmapProps) => {
  const [data, setData] = useState<ActivityHeatmapData | null>(null)
  const [daysCount, setDaysCount] = useState<30 | 60>(30)
  const [hoveredDay, setHoveredDay] = useState<ActivityHeatmapDay | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    api
      .getActivityHeatmap(clientId, daysCount)
      .then((res) => {
        if (isMounted) setData(res)
      })
      .catch((err) => console.error('Error fetching activity heatmap:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [clientId, daysCount])

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-500">Carregando mapa de consistência...</div>
  }

  const days = data?.days || []

  return (
    <Card className="p-6 space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-emerald-800">Treinos no Mês</span>
            <span className="text-xl font-bold text-emerald-950">{data?.totalCompletedMonth || 0}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-amber-800">Sequência Atual (Streak)</span>
            <span className="text-xl font-bold text-amber-950">{data?.currentStreak || 0} dias</span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-indigo-800">Último Treino Feito</span>
            <span className="text-sm font-bold text-indigo-950">{data?.lastWorkoutDate ? new Date(data.lastWorkoutDate).toLocaleDateString() : 'Nenhum'}</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center text-sm font-bold text-slate-800">
            <Calendar className="mr-2 h-4 w-4 text-slate-500" />
            Consistência nos últimos {daysCount} dias
          </h4>
          <div className="flex gap-1">
            <button
              onClick={() => setDaysCount(30)}
              className={`px-2.5 py-1 text-xs font-medium rounded ${daysCount === 30 ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              30 dias
            </button>
            <button
              onClick={() => setDaysCount(60)}
              className={`px-2.5 py-1 text-xs font-medium rounded ${daysCount === 60 ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              60 dias
            </button>
          </div>
        </div>

        {/* Heatmap Squares */}
        <div className="relative">
          <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            {days.map((day) => {
              const isCompleted = day.status === 'COMPLETED'
              const isExpired = day.status === 'EXPIRED'

              let bgClass = 'bg-slate-200/80 hover:ring-1 hover:ring-slate-400'
              if (isCompleted) bgClass = 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
              else if (isExpired) bgClass = 'bg-amber-500 hover:bg-amber-600 shadow-sm'

              return (
                <div
                  key={day.date}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`h-6 w-6 cursor-pointer rounded-md transition-all duration-150 ${bgClass}`}
                />
              )
            })}
          </div>

          {/* Hover Tooltip */}
          {hoveredDay && (
            <div className="mt-2 p-2.5 rounded-lg bg-slate-900 text-white text-xs shadow-lg animate-in fade-in duration-100 flex items-center justify-between">
              <div>
                <span className="font-semibold">{hoveredDay.date}</span>
                {hoveredDay.workoutName && <span className="ml-2 text-slate-300">• {hoveredDay.workoutName}</span>}
              </div>
              <div>{hoveredDay.durationMinutes ? <span className="font-semibold text-emerald-400">{hoveredDay.durationMinutes} min</span> : <span className="text-slate-400">Sem treino</span>}</div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
          <span className="font-medium text-slate-600">Legenda:</span>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-emerald-600" />
            <span>Treino Concluído</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-amber-500" />
            <span>Link Aberto (Incompleto)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-slate-200" />
            <span>Sem Atividade</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
