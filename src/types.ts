export interface User {
  id: string
  name: string
  email: string
}

export const ClientStatus = {
  Active: 'Active',
  Inactive: 'Inactive',
  Lead: 'Lead',
} as const
export type ClientStatus = (typeof ClientStatus)[keyof typeof ClientStatus]

export type ClientType = 'In-Person' | 'Online'
export type CheckInFrequency = 'Weekly' | 'Bi-weekly' | 'Monthly'

export interface Plan {
  id: string
  type: 'PRESENCIAL' | 'CONSULTORIA'
  name: string
  sessionsPerWeek: number
  durationMinutes?: number // 30, 45, 60, 90 — null for CONSULTORIA
  price: number
  active?: boolean
  createdAt?: string
}

// New detailed types for Evaluation
export interface Skinfolds {
  triceps?: number
  biceps?: number
  subscapular?: number
  pectoral?: number
  suprailiac?: number
  axillary?: number
  abdominal?: number
  thigh?: number
  calf?: number
  supraSpinal?: number
}

export interface Perimeters {
  relaxedArm?: number
  flexedArm?: number
  forearm?: number
  chest?: number
  waist?: number
  abdomen?: number
  hip?: number
  thigh?: number
  calf?: number
}

// New type for Client medical history
export interface MedicalHistory {
  objective?: string[] // e.g., ['Health', 'Aesthetics']
  hasHeartDisease?: boolean
  medications?: string
  injuries?: string
  surgeries?: string
  smoker?: boolean
  drinker?: boolean
  observations?: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  status: ClientStatus
  type: ClientType
  dateOfBirth?: string
  checkInFrequency?: CheckInFrequency
  goal?: string
  medicalHistory?: MedicalHistory
  notes?: string
  avatar?: string
  planId?: string // Links to a Plan
}

export interface Session {
  id: string
  clientId: string
  date: string // ISO string
  durationMinutes: number
  type: 'In-Person' | 'Online'
  category: 'Workout' | 'Check-in'
  completed: boolean
  notes?: string
  linkedWorkoutId?: string
  recurrenceId?: string
}

export interface WorkoutExercise {
  name: string
  sets: number
  reps: string
  weight?: string
  notes?: string
  isWarmup?: boolean
}

export interface WorkoutPlan {
  id: string
  clientId?: string
  status?: 'Active' | 'Archived'
  title: string
  description?: string
  exercises: WorkoutExercise[]
  tags: string[]
  createdAt: string
}

export interface Evaluation {
  id: string
  clientId: string
  date: string
  weight: number
  height?: number
  bodyFatPercentage?: number
  leanMass?: number
  idealWeight?: number
  absoluteBodyFat?: number
  notes?: string
  skinfolds?: Skinfolds
  perimeters?: Perimeters
}
