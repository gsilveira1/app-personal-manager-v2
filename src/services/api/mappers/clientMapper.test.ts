// @vitest-environment node
import { describe, it, expect } from 'vitest'

import { toClient, toClientBody, toPayment, type ClientWire } from './clientMapper'

const wire = (overrides: Partial<ClientWire> = {}): ClientWire => ({
  id: 'client-1',
  name: 'Maria',
  email: 'maria@test.com',
  phone: '53999990000',
  status: 'ACTIVE',
  modality: 'ONLINE',
  goal: null,
  avatar: null,
  notes: null,
  dateOfBirth: null,
  checkInFreq: 'Weekly',
  checkInFrequency: 'Weekly',
  medicalHistory: null,
  notificationEnabled: true,
  planId: 'plan-1',
  plan: { id: 'plan-1', name: 'Consultoria' },
  subscriptionStatus: 'ACTIVE',
  currentPeriodEnd: '2026-11-01T00:00:00.000Z',
  gatewayCustomerId: null,
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('toClient', () => {
  it('maps ClientView to the view model, nulls becoming absent values', () => {
    const client = toClient(wire())

    expect(client).toMatchObject({ id: 'client-1', modality: 'ONLINE', checkInFrequency: 'Weekly', planId: 'plan-1', subscriptionStatus: 'ACTIVE', currentPeriodEnd: '2026-11-01T00:00:00.000Z' })
    expect(client.goal).toBeUndefined()
    expect(client.avatar).toBeUndefined()
    expect(client).not.toHaveProperty('type')
    expect(client).not.toHaveProperty('whatsapp')
  })

  it('carries the active sheet only when the row is a list item', () => {
    expect(toClient(wire())).not.toHaveProperty('activeWorkoutSheet')
    expect(toClient(wire({ activeWorkoutSheet: null })).activeWorkoutSheet).toBeNull()
    expect(toClient(wire({ activeWorkoutSheet: { id: 's1', name: 'Ficha', expiresAt: null } })).activeWorkoutSheet).toEqual({ id: 's1', name: 'Ficha', expiresAt: null })
  })
})

describe('toClientBody', () => {
  it('copies only the keys of CreateClientBody', () => {
    const body = toClientBody({ ...toClient(wire({ activeWorkoutSheet: null })), goal: 'Hipertrofia' })

    expect(body).toEqual({
      name: 'Maria',
      email: 'maria@test.com',
      phone: '53999990000',
      status: 'ACTIVE',
      modality: 'ONLINE',
      goal: 'Hipertrofia',
      checkInFrequency: 'Weekly',
      notificationEnabled: true,
      planId: 'plan-1',
    })
  })

  it('never sends the billing status or the removed aliases', () => {
    const body = toClientBody({ status: 'PAUSED', subscriptionStatus: 'CANCELED', type: 'Online', whatsapp: '1' } as never)

    expect(body).toEqual({ status: 'PAUSED' })
  })
})

describe('toPayment', () => {
  it('maps PaymentView, nulls becoming absent values', () => {
    const payment = toPayment({
      id: 'pay-1',
      clientId: 'client-1',
      userId: 'user-1',
      provider: 'MANUAL',
      status: 'PAID',
      amount: 150,
      method: 'PIX',
      externalId: null,
      date: '2026-10-03T00:00:00.000Z',
      periodEnd: '2026-11-03T23:59:59.000Z',
      notes: null,
      createdAt: '2026-10-03T00:00:00.000Z',
      updatedAt: '2026-10-03T00:00:00.000Z',
    })

    expect(payment).toMatchObject({ provider: 'MANUAL', status: 'PAID', amount: 150, method: 'PIX', periodEnd: '2026-11-03T23:59:59.000Z' })
    expect(payment.externalId).toBeUndefined()
    expect(payment.notes).toBeUndefined()
  })
})
