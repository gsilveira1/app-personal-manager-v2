import { API_URL, TEST_EMAIL, TEST_PASSWORD } from './constants'

let cachedToken: string | null = null

export async function getToken(): Promise<string> {
  if (cachedToken) return cachedToken

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  })
  if (!res.ok) throw new Error(`Login failed: ${res.status}`)
  const data = await res.json()
  cachedToken = data.access_token
  return cachedToken!
}

async function apiCall<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${method} ${path} failed: ${res.status} — ${text}`)
  }
  if (res.status === 204) return null as T
  return res.json()
}

// ── Clients ──

export function getClients() {
  return apiCall<any[]>('GET', '/clients')
}

export function createClient(data: {
  name: string
  email: string
  phone: string
  status?: string
  type?: string
  goal?: string
  dateOfBirth?: string
}) {
  return apiCall<any>('POST', '/clients', {
    type: 'In-Person',
    status: 'Active',
    ...data,
  })
}

export function updateClient(id: string, data: Record<string, unknown>) {
  return apiCall<any>('PATCH', `/clients/${id}`, data)
}

export function deleteClient(id: string) {
  return apiCall<void>('DELETE', `/clients/${id}`)
}

// ── Sessions ──

export function createSession(data: {
  clientId: string
  date: string
  durationMinutes: number
  type: string
  category: string
  notes?: string
}) {
  return apiCall<any>('POST', '/sessions', data)
}

export function deleteSession(id: string) {
  return apiCall<void>('DELETE', `/sessions/${id}`)
}

export function toggleSessionComplete(id: string) {
  return apiCall<any>('POST', `/sessions/${id}/toggle-complete`)
}

// ── Workouts ──

export function createWorkout(data: {
  title: string
  description?: string
  exercises: { name: string; sets: number; reps: string; notes?: string }[]
  tags?: string[]
  clientId?: string
}) {
  return apiCall<any>('POST', '/workouts', data)
}

export function deleteWorkout(id: string) {
  return apiCall<void>('DELETE', `/workouts/${id}`)
}

// ── Evaluations ──

export function createEvaluation(data: {
  clientId: string
  date: string
  weight: number
  height?: number
  bodyFatPercentage?: number
  notes?: string
}) {
  return apiCall<any>('POST', '/evaluations', data)
}

export function deleteEvaluation(id: string) {
  return apiCall<void>('DELETE', `/evaluations/${id}`)
}

// ── Plans ──

export function getPlans() {
  return apiCall<any[]>('GET', '/plans')
}

export function createPlan(data: {
  type: 'PRESENCIAL' | 'CONSULTORIA'
  name: string
  sessionsPerWeek: number
  durationMinutes?: number
  price: number
}) {
  return apiCall<any>('POST', '/plans', data)
}

export function deletePlan(id: string) {
  return apiCall<void>('DELETE', `/plans/${id}`)
}

// ── Availability Blocks ──

export function createAvailabilityBlock(data: {
  title: string
  dtstart: string
  dtend: string
  notes?: string
}) {
  return apiCall<any>('POST', '/availability-blocks', data)
}

export function deleteAvailabilityBlock(id: string) {
  return apiCall<void>('DELETE', `/availability-blocks/${id}`)
}

// ── Settings ──

export function updateLanguage(language: 'en' | 'es' | 'pt-BR') {
  return apiCall<any>('PATCH', '/settings/language', { language })
}

export function updateWorkHours(config: Record<string, unknown>) {
  return apiCall<any>('PUT', '/settings/work-hours', config)
}

export function updateAiInstructions(instructions: string) {
  return apiCall<any>('PUT', '/settings/ai-instructions', { instructions })
}
