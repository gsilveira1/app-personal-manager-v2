export type WhatsappStatus = 'CONNECTED' | 'DISCONNECTED' | 'PENDING'
export type TenantStatus = 'ACTIVE' | 'BLOCKED' | 'OVERDUE'

export interface Tenant {
  id: string
  name: string
  slug: string
  status?: TenantStatus
  primaryColor?: string
  logoUrl?: string | null
  whatsappInstanceName?: string | null
  whatsappStatus?: WhatsappStatus
  setupCompleted: boolean
  createdAt?: string
  updatedAt?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  phone?: string
  bio?: string
  tenantId?: string | null
  tenant?: Tenant | null
}

export const ClientStatus = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  OVERDUE: 'OVERDUE',
  LEAD: 'LEAD',
  // Backward-compatible accessors
  Active: 'ACTIVE',
  Inactive: 'OVERDUE',
  Lead: 'LEAD',
} as const
export type ClientStatus = 'ACTIVE' | 'PAUSED' | 'OVERDUE' | 'LEAD'

export const ClientModality = {
  PRESENCIAL: 'PRESENCIAL',
  ONLINE: 'ONLINE',
  HYBRID: 'HYBRID',
} as const
export type ClientModality = 'PRESENCIAL' | 'ONLINE' | 'HYBRID'

export type ClientType = 'In-Person' | 'Online'
export type StudentModality = ClientModality
export type StudentSubscriptionStatus = ClientStatus
export type CheckInFrequency = 'Weekly' | 'Bi-weekly' | 'Monthly'

export interface SystemFeature {
  id: string
  key: string
  name: string
  description?: string
  isActive: boolean
  createdAt?: string
  _count?: { plans: number }
}

export interface PlanFeature {
  planId: string
  featureId: string
  feature: SystemFeature
}

export interface Plan {
  id: string
  type: 'PRESENCIAL' | 'CONSULTORIA'
  name: string
  sessionsPerWeek: number
  durationMinutes?: number // 30, 45, 60, 90 — null for CONSULTORIA
  price: number
  active?: boolean
  createdAt?: string
  features?: PlanFeature[]
  featureIds?: string[]
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
  modality: ClientModality
  currentPeriodEnd?: string
  dateOfBirth?: string
  checkInFrequency?: CheckInFrequency
  goal?: string
  medicalHistory?: MedicalHistory
  notes?: string
  avatar?: string
  planId?: string // Links to a Plan
  plan?: Plan | { id?: string; name?: string }
  activeWorkoutSheet?: { id: string; name: string; expiresAt?: string } | null
  notificationEnabled?: boolean
  // Optional legacy fields for component graceful degradation
  whatsapp?: string
  type?: ClientType
  subscriptionStatus?: ClientStatus
}

export interface ManualPayment {
  id: string
  clientId: string
  paymentType: 'MANUAL_PIX' | 'MANUAL_CASH' | 'MANUAL_CARD'
  validUntil: string
  notes?: string
  amount?: number
  createdAt: string
}

export interface AnamnesisRecord {
  id: string
  clientId: string
  isCurrent: boolean
  token?: string
  tokenUsed?: boolean
  medicalHistory?: string
  injuriesAndPain?: string
  routineAndSchedule?: string
  fitnessGoals?: string
  experienceLevel?: string
  parqAnswers?: Record<string, boolean>
  frontPhotoUrl?: string
  backPhotoUrl?: string
  sidePhotoUrl?: string
  weightKg?: number
  measurements?: Record<string, number>
  createdAt: string
}

export interface ExerciseCatalogItem {
  id: string
  name: string
  bodyPart: string
  targetMuscle?: string
  equipment: string
  gifUrl?: string
  videoUrl?: string
  isCustom: boolean
}

export interface WorkoutSheetExercise {
  id?: string
  workoutExerciseId?: string
  exerciseId?: string
  exerciseName: string
  gifUrl?: string
  sets: number
  reps: string
  suggestedLoadKg?: number | null
  executionNotes?: string
  lastLoadKg?: number | null
  orderIndex?: number
}

export interface WorkoutSheetBlock {
  id?: string
  type: 'REGULAR' | 'BISET' | 'TRISET'
  orderIndex?: number
  restTimeSeconds: number
  exercises: WorkoutSheetExercise[]
}

export interface WorkoutSheetItem {
  id?: string
  letter: string
  name: string
  orderIndex?: number
  blocks: WorkoutSheetBlock[]
}

export interface WorkoutSheet {
  id: string
  name: string
  expiresAt?: string | null
  active: boolean
  clientId: string
  workouts: WorkoutSheetItem[]
  createdAt?: string
}

export interface WorkoutTemplate {
  id: string
  name: string
  description?: string
  structure: any
  createdAt: string
}

export interface ActivityHeatmapDay {
  date: string
  status: 'COMPLETED' | 'EXPIRED' | 'NO_ACTIVITY'
  workoutName?: string
  durationMinutes?: number
}

export interface ActivityHeatmapData {
  studentId: string
  totalCompletedMonth: number
  currentStreak: number
  lastWorkoutDate: string | null
  days: ActivityHeatmapDay[]
}

export interface AdminTenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  studentsCount: number
  features: {
    maxStudents?: number
    canUploadVideos?: boolean
    whatsappAlerts?: boolean
    isEnterprise?: boolean
    [key: string]: any
  }
  createdAt: string
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

export type ProtocolType = 'POLLOCK_3' | 'POLLOCK_7' | 'PETROSKI_4' | 'DURNIN_WOMERSLEY_4'
export type EquationType = 'SIRI' | 'BROZEK'

export interface Evaluation {
  id: string
  clientId: string
  date: string
  weight: number
  height?: number
  bodyFatPercentage?: number
  leanMass?: number
  fatMass?: number
  bodyDensity?: number
  protocol?: ProtocolType | string
  equation?: EquationType | string
  idealWeight?: number
  absoluteBodyFat?: number
  notes?: string
  skinfolds?: Skinfolds
  perimeters?: Perimeters
}

// --- Availability / Work Hours ---

export interface DaySchedule {
  enabled: boolean
  start: string // "HH:mm"
  end: string // "HH:mm"
}

export interface WorkHoursConfig {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
  slotDurationMinutes: number
}

export interface AvailabilityBlock {
  id: string
  title: string
  rrule?: string | null
  timezone: string
  dtstart: string
  dtend: string
  notes?: string | null
}

export interface MaterializedBlock {
  id: string
  blockId: string
  title: string
  start: string
  end: string
  isRecurring: boolean
  notes: string | null
}
