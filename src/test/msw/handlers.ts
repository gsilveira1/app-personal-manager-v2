import { http, HttpResponse } from 'msw'
import {
  mockUser,
  mockClients,
  mockSessions,
  mockPlans,
  mockWorkouts,
  mockEvaluations,
  mockSystemFeatures,
} from './mockData'

const API = 'http://localhost:9090/api'

export const handlers = [
  // Auth
  http.get(`${API}/auth/me`, () => {
    return HttpResponse.json(mockUser)
  }),

  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    if (body.email === 'trainer@test.com' && body.password === 'password123') {
      return HttpResponse.json({ access_token: 'mock-jwt-token', user: mockUser })
    }
    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
  }),

  // Clients
  http.get(`${API}/clients`, () => {
    return HttpResponse.json(mockClients)
  }),

  http.post(`${API}/clients`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 'client-new', ...body }, { status: 201 })
  }),

  // Sessions
  http.get(`${API}/sessions`, () => {
    return HttpResponse.json(mockSessions)
  }),

  // Plans
  http.get(`${API}/plans`, () => {
    return HttpResponse.json(mockPlans)
  }),

  // Workouts
  http.get(`${API}/workouts`, () => {
    return HttpResponse.json(mockWorkouts)
  }),

  // Evaluations
  http.get(`${API}/evaluations`, () => {
    return HttpResponse.json(mockEvaluations)
  }),

  // System Features
  http.get(`${API}/system-features`, () => {
    return HttpResponse.json(mockSystemFeatures)
  }),
]

export const errorHandlers = {
  unauthorized: http.get(`${API}/auth/me`, () => {
    return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }),
  serverError: http.get(`${API}/clients`, () => {
    return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }),
}
