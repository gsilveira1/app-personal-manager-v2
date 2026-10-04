import type { NewSession, Session, SessionStatus, SessionUpdate } from '../../../types'

/** `SessionView` exactly as the API sends it (contract v2 §6.4). */
export interface SessionWire {
  id: string
  date: string
  durationMinutes: number
  type: 'In-Person' | 'Online'
  category: string
  notes: string | null
  status: SessionStatus
  completed: boolean
  cancelled: boolean
  clientId: string
  userId: string
  client: { name: string; avatar: string | null }
  workoutSheetId: string | null
  workoutSegmentId: string | null
  workout: { id: string; name: string; letter: string } | null
  timezone: string
  isVirtual: boolean
  recurringEventId: string | null
  recurrenceId: string | null
  originalStartTime: string | null
  exceptionId: string | null
  rrule: string | null
}

const orUndefined = <T>(value: T | null | undefined): T | undefined => (value === null ? undefined : value)

/** Wire → view model: nulls become absent values. */
export const toSession = (wire: SessionWire): Session => ({
  id: wire.id,
  clientId: wire.clientId,
  date: wire.date,
  durationMinutes: wire.durationMinutes,
  type: wire.type,
  category: wire.category,
  completed: wire.completed,
  notes: orUndefined(wire.notes),
  status: wire.status,
  cancelled: wire.cancelled,
  workoutSheetId: orUndefined(wire.workoutSheetId),
  workoutSegmentId: orUndefined(wire.workoutSegmentId),
  workout: orUndefined(wire.workout),
  client: wire.client,
  timezone: wire.timezone,
  isVirtual: wire.isVirtual,
  recurringEventId: orUndefined(wire.recurringEventId),
  recurrenceId: orUndefined(wire.recurrenceId ?? wire.recurringEventId),
  originalStartTime: orUndefined(wire.originalStartTime),
  exceptionId: orUndefined(wire.exceptionId),
  rrule: orUndefined(wire.rrule),
  userId: wire.userId,
})

const CREATE_KEYS = ['date', 'durationMinutes', 'type', 'category', 'clientId', 'workoutSheetId', 'workoutSegmentId', 'notes', 'completed', 'rrule', 'timezone'] as const
const UPDATE_KEYS = ['date', 'durationMinutes', 'type', 'category', 'notes', 'completed', 'cancelled'] as const
const LINK_KEYS = ['workoutSheetId', 'workoutSegmentId'] as const

const isBlank = (value: unknown) => value === undefined || value === null || value === ''

/**
 * `CreateSessionBody`. The API rejects unknown properties, so only the contract's
 * keys are copied, and blank optional values (an unselected workout, empty notes)
 * are left out. With `rrule` the session is created as a recurring series.
 */
export const toSessionCreateBody = (session: NewSession): Record<string, unknown> => {
  const body: Record<string, unknown> = {}
  for (const key of CREATE_KEYS) {
    if (!isBlank(session[key])) body[key] = session[key]
  }
  return body
}

/**
 * `UpdateSessionBody`. `clientId` and every read-only field are dropped. A workout
 * link key that is present but blank is sent as `null`, which unlinks the workout.
 */
export const toSessionUpdateBody = (updates: SessionUpdate): Record<string, unknown> => {
  const body: Record<string, unknown> = {}
  for (const key of UPDATE_KEYS) {
    if (updates[key] !== undefined && updates[key] !== null) body[key] = updates[key]
  }
  for (const key of LINK_KEYS) {
    if (key in updates && updates[key] !== undefined) body[key] = isBlank(updates[key]) ? null : updates[key]
  }
  return body
}

/**
 * Id that addresses one occurrence of a recurring series:
 * `<seriesId>_<ISO originalStartTime>`. Patching or deleting it writes an
 * exception for that occurrence only.
 */
export const occurrenceId = (seriesId: string, originalStartTime: string | Date): string => `${seriesId}_${new Date(originalStartTime).toISOString()}`

/** Splits an occurrence id into its series id and original start; null for a plain UUID. */
export const parseOccurrenceId = (id: string): { seriesId: string; originalStartTime: string } | null => {
  const at = id.indexOf('_')
  if (at <= 0) return null
  const originalStartTime = id.slice(at + 1)
  if (Number.isNaN(Date.parse(originalStartTime))) return null
  return { seriesId: id.slice(0, at), originalStartTime }
}

/** Series master id of a session, whether it is an occurrence or a stored exception. */
export const seriesIdOf = (session: Pick<Session, 'id' | 'recurringEventId' | 'recurrenceId'>): string | undefined =>
  session.recurringEventId ?? session.recurrenceId ?? parseOccurrenceId(session.id)?.seriesId
