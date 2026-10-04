import type { Client, Session, Plan, WorkoutPlan, WorkoutSheet, Evaluation, User, PlanFeatureDescriptor } from '../../types'

export const mockUser: User = {
  id: 'user-1',
  name: 'Trainer Test',
  email: 'trainer@test.com',
  role: 'trainer',
  status: 'ACTIVE',
  avatar: null,
  phone: null,
  bio: null,
  slug: 'trainer-test',
  primaryColor: null,
  logoUrl: null,
  whatsappInstanceName: null,
  whatsappStatus: 'DISCONNECTED',
  setupCompleted: true,
  settings: {
    language: 'pt-BR',
    workHours: {
      monday: { enabled: true, start: '07:00', end: '19:00' },
      tuesday: { enabled: true, start: '07:00', end: '19:00' },
      wednesday: { enabled: true, start: '07:00', end: '19:00' },
      thursday: { enabled: true, start: '07:00', end: '19:00' },
      friday: { enabled: true, start: '07:00', end: '19:00' },
      saturday: { enabled: true, start: '07:00', end: '19:00' },
      sunday: { enabled: false, start: '08:00', end: '12:00' },
      slotDurationMinutes: 60,
    },
    dnd: { enabled: true, startHour: 22, endHour: 8, timezone: 'America/Sao_Paulo' },
    limits: { maxStudents: 50, canUploadVideos: true, whatsappAlerts: true },
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
}

export const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Maria Silva',
    email: 'maria@test.com',
    phone: '(53) 99999-1111',
    status: 'ACTIVE',
    modality: 'PRESENCIAL',
    planId: 'plan-1',
  },
  {
    id: 'client-2',
    name: 'João Santos',
    email: 'joao@test.com',
    phone: '(53) 99999-2222',
    status: 'ACTIVE',
    modality: 'ONLINE',
    checkInFrequency: 'Weekly',
  },
  {
    id: 'client-3',
    name: 'Ana Lead',
    email: 'ana@test.com',
    phone: '(53) 99999-3333',
    status: 'LEAD',
    modality: 'PRESENCIAL',
  },
]

const today = new Date().toISOString().split('T')[0]

export const mockSessions: Session[] = [
  {
    id: 'session-1',
    clientId: 'client-1',
    date: `${today}T09:00:00.000Z`,
    durationMinutes: 60,
    type: 'In-Person',
    category: 'Workout',
    completed: false,
  },
  {
    id: 'session-2',
    clientId: 'client-2',
    date: `${today}T10:00:00.000Z`,
    durationMinutes: 45,
    type: 'Online',
    category: 'Check-in',
    completed: true,
  },
]

export const mockPlans: Plan[] = [
  {
    id: 'plan-1',
    type: 'PRESENCIAL',
    name: 'Plano Básico',
    sessionsPerWeek: 3,
    durationMinutes: 60,
    price: 300,
    active: true,
    features: ['ai_whatsapp_bot'],
  },
  {
    id: 'plan-2',
    type: 'CONSULTORIA',
    name: 'Consultoria Online',
    sessionsPerWeek: 2,
    price: 200,
    active: true,
  },
]

/** A library template as `GET /workout-templates` sends it (`WorkoutSheetView`). */
export const mockWorkoutTemplates: WorkoutSheet[] = [
  {
    id: 'workout-1',
    name: 'Treino A - Peito/Tríceps',
    expiresAt: null,
    active: true,
    isTemplate: true,
    clientId: null,
    userId: 'user-1',
    description: null,
    tags: ['chest', 'triceps'],
    workouts: [
      {
        id: 'item-a',
        letter: 'A',
        name: 'Treino A - Peito/Tríceps',
        orderIndex: 0,
        blocks: [
          {
            id: 'block-1',
            type: 'REGULAR',
            orderIndex: 0,
            restTimeSeconds: 60,
            exercises: [
              {
                id: 'ex-1',
                exerciseId: null,
                exerciseName: 'Supino Reto',
                gifUrl: null,
                sets: 4,
                reps: '10-12',
                suggestedLoadKg: 60,
                executionNotes: null,
                isWarmup: false,
                orderIndex: 0,
              },
            ],
          },
          {
            id: 'block-2',
            type: 'REGULAR',
            orderIndex: 1,
            restTimeSeconds: 60,
            exercises: [
              {
                id: 'ex-2',
                exerciseId: null,
                exerciseName: 'Tríceps Pulley',
                gifUrl: null,
                sets: 3,
                reps: '12-15',
                suggestedLoadKg: null,
                executionNotes: null,
                isWarmup: false,
                orderIndex: 0,
              },
            ],
          },
        ],
      },
    ],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
]

/** The same template as the flat view model the library works with. */
export const mockWorkouts: WorkoutPlan[] = [
  {
    id: 'workout-1',
    title: 'Treino A - Peito/Tríceps',
    exercises: [
      {
        name: 'Supino Reto',
        sets: 4,
        reps: '10-12',
        weight: '60kg',
        isWarmup: false,
        ref: { id: 'ex-1', itemId: 'item-a', blockId: 'block-1' },
      },
      {
        name: 'Tríceps Pulley',
        sets: 3,
        reps: '12-15',
        isWarmup: false,
        ref: { id: 'ex-2', itemId: 'item-a', blockId: 'block-2' },
      },
    ],
    tags: ['chest', 'triceps'],
    createdAt: '2025-01-01T00:00:00.000Z',
    itemId: 'item-a',
  },
]

export const mockEvaluations: Evaluation[] = [
  {
    id: 'eval-1',
    clientId: 'client-1',
    date: '2025-06-01',
    weight: 75,
    height: 175,
    bodyFatPercentage: 18,
  },
]

export const mockPlanFeatures: PlanFeatureDescriptor[] = [
  {
    key: 'ai_whatsapp_bot',
    name: 'Bot de WhatsApp com IA',
    description: 'Atendimento automático por WhatsApp',
  },
  { key: 'automated_pix', name: 'PIX automático', description: 'Cobrança recorrente por PIX' },
]
