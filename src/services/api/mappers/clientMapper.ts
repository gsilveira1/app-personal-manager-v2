import type { BillingStatus, CheckInFrequency, Client, ClientModality, ClientStatus, MedicalHistory, Payment } from '../../../types'

/** `ClientView` / `ClientListItem` exactly as the API sends it (contract v2 §6.2). */
export interface ClientWire {
  id: string
  name: string
  email: string
  phone: string
  status: ClientStatus
  modality: ClientModality
  goal: string | null
  avatar: string | null
  notes: string | null
  dateOfBirth: string | null
  checkInFreq: string | null
  checkInFrequency: string | null
  medicalHistory: MedicalHistory | null
  notificationEnabled: boolean
  planId: string | null
  plan: { id: string; name: string } | null
  subscriptionStatus: BillingStatus | null
  currentPeriodEnd: string | null
  gatewayCustomerId: string | null
  userId: string
  createdAt: string
  updatedAt: string
  /** Present on list items only. */
  activeWorkoutSheet?: { id: string; name: string; expiresAt: string | null } | null
}

/** `CreateClientBody`: the only properties `POST /clients` and `PATCH /clients/:id` accept. */
export interface ClientBody {
  name?: string
  email?: string
  phone?: string
  status?: ClientStatus
  modality?: ClientModality
  goal?: string
  avatar?: string
  notes?: string
  dateOfBirth?: string
  checkInFrequency?: string
  medicalHistory?: MedicalHistory
  planId?: string
  notificationEnabled?: boolean
}

const BODY_KEYS = ['name', 'email', 'phone', 'status', 'modality', 'goal', 'avatar', 'notes', 'dateOfBirth', 'checkInFrequency', 'medicalHistory', 'planId', 'notificationEnabled'] as const

const orUndefined = <T>(value: T | null | undefined): T | undefined => (value === null ? undefined : value)

/** Wire → view model: nulls become absent values, the duplicated check-in key collapses to one. */
export const toClient = (wire: ClientWire): Client => {
  const client: Client = {
    id: wire.id,
    name: wire.name,
    email: wire.email,
    phone: wire.phone,
    status: wire.status,
    modality: wire.modality,
    goal: orUndefined(wire.goal),
    avatar: orUndefined(wire.avatar),
    notes: orUndefined(wire.notes),
    dateOfBirth: orUndefined(wire.dateOfBirth),
    checkInFrequency: orUndefined(wire.checkInFrequency ?? wire.checkInFreq) as CheckInFrequency | undefined,
    medicalHistory: orUndefined(wire.medicalHistory),
    notificationEnabled: wire.notificationEnabled,
    planId: orUndefined(wire.planId),
    plan: orUndefined(wire.plan),
    subscriptionStatus: orUndefined(wire.subscriptionStatus),
    currentPeriodEnd: orUndefined(wire.currentPeriodEnd),
    userId: wire.userId,
    createdAt: wire.createdAt,
    updatedAt: wire.updatedAt,
  }
  // Only list items carry the active sheet; leaving the key out keeps a merge from erasing it.
  if ('activeWorkoutSheet' in wire) client.activeWorkoutSheet = wire.activeWorkoutSheet ?? null
  return client
}

/**
 * View model → request body. The API rejects unknown properties, so only the
 * contract's keys are copied; read-only fields (id, plan, subscriptionStatus,
 * currentPeriodEnd, activeWorkoutSheet…) and undefined values are left out.
 */
export const toClientBody = (client: Partial<Client>): ClientBody => {
  const body: Record<string, unknown> = {}
  for (const key of BODY_KEYS) {
    const value = client[key]
    if (value !== undefined && value !== null) body[key] = value
  }
  return body as ClientBody
}

/** `PaymentView` as sent by the API. */
export interface PaymentWire extends Omit<Payment, 'method' | 'externalId' | 'periodEnd' | 'notes'> {
  method: Payment['method'] | null
  externalId: string | null
  periodEnd: string | null
  notes: string | null
}

export const toPayment = (wire: PaymentWire): Payment => ({
  ...wire,
  method: orUndefined(wire.method),
  externalId: orUndefined(wire.externalId),
  periodEnd: orUndefined(wire.periodEnd),
  notes: orUndefined(wire.notes),
})
