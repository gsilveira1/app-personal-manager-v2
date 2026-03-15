import { useMemo } from 'react'
import { parseISO, isPast } from 'date-fns'
import { formatLocalized } from '../utils/dateLocale'
import type { Evaluation, Session, WorkoutPlan } from '../types'

const chartableMetrics: Record<string, { label: string; unit: string }> = {
  weight: { label: 'Weight', unit: 'kg' },
  bodyFatPercentage: { label: 'Body Fat', unit: '%' },
  leanMass: { label: 'Lean Mass', unit: 'kg' },
  'perimeters.waist': { label: 'Waist', unit: 'cm' },
  'perimeters.hip': { label: 'Hip', unit: 'cm' },
  'perimeters.chest': { label: 'Chest', unit: 'cm' },
  'skinfolds.triceps': { label: 'Triceps Skinfold', unit: 'mm' },
  'skinfolds.abdominal': { label: 'Abdominal Skinfold', unit: 'mm' },
}

function getMetricValue(evaluation: Evaluation, metricKey: string): number | undefined {
  const keys = metricKey.split('.')
  let value: unknown = evaluation as unknown
  for (const key of keys) {
    if (value === undefined || value === null) return undefined
    value = (value as Record<string, unknown>)[key]
  }
  return typeof value === 'number' ? value : undefined
}

export function useClientDetails(
  clientId: string | undefined,
  sessions: Session[],
  evaluations: Evaluation[],
  workouts: WorkoutPlan[],
  selectedMetric: string
) {
  const clientSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.clientId === clientId && isPast(parseISO(s.date)))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [sessions, clientId]
  )

  const clientEvaluations = useMemo(
    () =>
      evaluations
        .filter((e) => e.clientId === clientId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [evaluations, clientId]
  )

  const clientWorkouts = useMemo(
    () =>
      workouts
        .filter((w) => w.clientId === clientId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [workouts, clientId]
  )

  const activePlans = useMemo(() => clientWorkouts.filter((w) => w.status === 'Active' || !w.status), [clientWorkouts])
  const archivedPlans = useMemo(() => clientWorkouts.filter((w) => w.status === 'Archived'), [clientWorkouts])

  const chartData = useMemo(
    () =>
      clientEvaluations
        .map((e) => ({
          date: formatLocalized(parseISO(e.date), 'MMM d'),
          value: getMetricValue(e, selectedMetric),
        }))
        .filter((d) => d.value !== undefined)
        .reverse(),
    [clientEvaluations, selectedMetric]
  )

  return {
    clientSessions,
    clientEvaluations,
    clientWorkouts,
    activePlans,
    archivedPlans,
    chartData,
    chartableMetrics,
  }
}
