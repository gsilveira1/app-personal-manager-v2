import { http, HttpResponse } from 'msw'
import { mockUser, mockClients, mockSessions, mockPlans, mockWorkoutTemplates, mockEvaluations, mockPlanFeatures } from './mockData'

const API = 'http://localhost:9090/api'

export const handlers = [
  // Auth
  http.get(`${API}/auth/me`, () => {
    return HttpResponse.json(mockUser)
  }),

  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    if (body.email === 'trainer@test.com' && body.password === 'password123') {
      return HttpResponse.json({ access_token: 'mock-jwt-token', accessToken: 'mock-jwt-token', tokenType: 'Bearer', expiresIn: 86400, user: mockUser })
    }
    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
  }),

  // Clients
  // `GET /clients` is paginated (`Paginated<ClientListItem>`)
  http.get(`${API}/clients`, () => {
    return HttpResponse.json({ items: mockClients, total: mockClients.length, page: 1, totalPages: 1 })
  }),

  http.post(`${API}/clients`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 'client-new', ...body, welcomeMessage: 'QUEUED' }, { status: 201 })
  }),

  // Sessions
  http.get(`${API}/sessions`, () => {
    return HttpResponse.json(mockSessions)
  }),

  // Plans
  http.get(`${API}/plans`, () => {
    return HttpResponse.json(mockPlans)
  }),

  // Workout library = the trainer's templates
  http.get(`${API}/workout-templates`, () => {
    return HttpResponse.json(mockWorkoutTemplates)
  }),

  // Evaluations
  http.get(`${API}/evaluations`, () => {
    return HttpResponse.json(mockEvaluations)
  }),

  // Plan feature catalogue
  http.get(`${API}/plan-features`, () => {
    return HttpResponse.json(mockPlanFeatures)
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
