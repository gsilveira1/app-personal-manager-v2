/** Page envelope shared by every paginated list. */
export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  totalPages: number
}

export type WhatsappStatus = 'CONNECTED' | 'DISCONNECTED' | 'PENDING'
export type AccountStatus = 'ACTIVE' | 'BLOCKED' | 'OVERDUE'
export type UserRole = 'admin' | 'trainer'

/** Do-not-disturb window applied to queued notifications (`User.settings.dnd`). */
export interface DndConfig {
  enabled: boolean
  startHour: number // 0–23
  endHour: number // 0–23
  timezone: string
}

/** Account limits written by admins only (`User.settings.limits`). */
export interface AccountLimits {
  maxStudents: number
  canUploadVideos: boolean
  whatsappAlerts: boolean
}

/** `User.settings` as returned by the API, defaults already resolved. */
export interface UserSettings {
  aiInstructions?: string
  language: 'pt-BR' | 'en' | 'es'
  workHours: WorkHoursConfig
  dnd: DndConfig
  limits: AccountLimits
}

/**
 * The authenticated trainer (`UserView`). Branding, the WhatsApp connection and the
 * setup flag live here: there is no separate tenant entity.
 */
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: AccountStatus
  avatar: string | null
  phone: string | null
  bio: string | null
  slug: string
  primaryColor: string | null
  logoUrl: string | null
  whatsappInstanceName: string | null
  whatsappStatus: WhatsappStatus
  setupCompleted: boolean
  settings: UserSettings
  createdAt: string
  updatedAt: string
}

/** Body of `PATCH /users/profile`. Unknown properties are rejected by the API. */
export interface UpdateProfileBody {
  name?: string
  email?: string
  password?: string
  avatar?: string
  phone?: string
  bio?: string
  slug?: string
}

/** Row of `GET /admin/users`. */
export interface AdminUserView {
  id: string
  name: string
  email: string
  slug: string
  role: string
  status: AccountStatus
  studentsCount: number
  limits: AccountLimits
  createdAt: string
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

/** Billing state of a client's subscription; not the client status. */
export type BillingStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'INCOMPLETE'
/** Outcome of the welcome/anamnesis message triggered by creating a client. */
export type WelcomeMessageOutcome = 'QUEUED' | 'SKIPPED' | 'FAILED'
export type CheckInFrequency = 'Weekly' | 'Bi-weekly' | 'Monthly'

/** Keys a plan can enable (`PlanFeatureKey`). The catalogue lives in the API code. */
export type PlanFeatureKey = 'ai_whatsapp_bot' | 'video_exercise_upload' | 'automated_pix' | 'posture_correction' | 'advanced_metrics'

/** Row of `GET /plan-features`: display data of one plan feature key. */
export interface PlanFeatureDescriptor {
  key: PlanFeatureKey
  name: string
  description: string
}

export interface Plan {
  id: string
  type: 'PRESENCIAL' | 'CONSULTORIA'
  name: string
  sessionsPerWeek: number
  durationMinutes?: number // 30, 45, 60, 90 — null for CONSULTORIA
  price: number
  active?: boolean
  /** Feature keys enabled for the plan. */
  features?: PlanFeatureKey[]
  userId?: string
  createdAt?: string
  updatedAt?: string
  /** Live clients on the plan. */
  _count?: { clients: number }
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
  activeWorkoutSheet?: { id: string; name: string; expiresAt?: string | null } | null
  notificationEnabled?: boolean
  /** Billing status of the subscription (ACTIVE / CANCELED / …). Read-only. */
  subscriptionStatus?: BillingStatus
  userId?: string
  createdAt?: string
  updatedAt?: string
}

export type PaymentMethod = 'PIX' | 'CASH' | 'CARD'

/** A recorded payment (`PaymentView`). */
export interface Payment {
  id: string
  clientId: string
  userId: string
  provider: 'MANUAL' | 'STRIPE' | 'ASAAS' | 'MERCADOPAGO'
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  amount: number
  method?: PaymentMethod
  externalId?: string
  date: string
  periodEnd?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

/** Body of `POST /clients/:id/payments`. `amount` is required. */
export interface RecordPaymentBody {
  amount: number
  method: PaymentMethod
  periodEnd: string
  notes?: string
}

/** `AnamnesisView`: a pending request or a submitted anamnesis, flattened. */
export interface AnamnesisRecord {
  id: string
  clientId: string
  status: 'PENDING' | 'EXPIRED' | 'SUBMITTED'
  /** True for the submitted record with the latest date. */
  isCurrent: boolean
  tokenUsed: boolean
  date: string
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
  targetMuscle?: string | null
  equipment: string
  gifUrl?: string | null
  videoUrl?: string | null
  isCustom: boolean
}

/**
 * One exercise of a workout sheet (`WorkoutExerciseEntry`). `id` is stable: sessions
 * and execution logs point at it, so an edit sends it back unchanged. It is absent
 * only on an entry the builder has not saved yet.
 */
export interface WorkoutSheetExercise {
  id?: string
  exerciseId?: string | null
  exerciseName: string
  gifUrl?: string | null
  sets: number
  reps: string
  suggestedLoadKg?: number | null
  executionNotes?: string | null
  isWarmup?: boolean
  orderIndex?: number
}

export type WorkoutBlockType = 'REGULAR' | 'BISET' | 'TRISET'

export interface WorkoutSheetBlock {
  id?: string
  type: WorkoutBlockType
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

/**
 * `WorkoutSheetView`: a client's sheet, or a template when `isTemplate` is true
 * (then `clientId` is null).
 */
export interface WorkoutSheet {
  id: string
  name: string
  expiresAt?: string | null
  active: boolean
  isTemplate: boolean
  clientId: string | null
  userId?: string
  description?: string | null
  tags: string[]
  workouts: WorkoutSheetItem[]
  createdAt?: string
  updatedAt?: string
}

/** A template is a workout sheet with `isTemplate` set. */
export type WorkoutTemplate = WorkoutSheet

/** Body of the sheet and template writes (`SheetBody`). */
export interface WorkoutSheetBody {
  name: string
  expiresAt?: string
  workouts: WorkoutSheetItem[]
  description?: string
  tags?: string[]
}

/** Row of `GET /workout-sheets/expiring`. */
export interface ExpiringSheet {
  client: { id: string; name: string; avatar: string | null; phone: string }
  sheet: { id: string; name: string; expiresAt: string }
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

export type SessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'

/**
 * `SessionView`. `id` is a UUID for a stored session, or
 * `<seriesId>_<ISO originalStartTime>` for an occurrence of a recurring series.
 */
export interface Session {
  id: string
  clientId: string
  date: string // ISO string
  durationMinutes: number
  type: 'In-Person' | 'Online'
  /** 'Workout' | 'Check-in' | 'Evaluation' */
  category: string
  completed: boolean
  notes?: string
  status?: SessionStatus
  cancelled?: boolean
  /** Workout sheet (or template) linked to the session, and the item of it to run. */
  workoutSheetId?: string
  workoutSegmentId?: string
  /** The resolved segment, when the pointer still resolves. */
  workout?: { id: string; name: string; letter: string }
  client?: { name: string; avatar: string | null }
  timezone?: string
  /** True for every occurrence of a series. */
  isVirtual?: boolean
  /** Series master id (`recurrenceId` carries the same value). */
  recurringEventId?: string
  recurrenceId?: string
  originalStartTime?: string
  /** Id of the stored exception of this occurrence, if any. */
  exceptionId?: string
  /** The series rule, on occurrences. */
  rrule?: string
  userId?: string
}

/** What the schedule sends to create a session; `rrule` turns it into a series. */
export interface NewSession {
  clientId: string
  date: string
  durationMinutes: number
  type: 'In-Person' | 'Online'
  category: string
  notes?: string
  completed?: boolean
  workoutSheetId?: string
  workoutSegmentId?: string
  rrule?: string
  timezone?: string
}

/** Fields `PATCH /sessions/:id` accepts (`UpdateSessionBody`). The client cannot be changed. */
export interface SessionUpdate {
  date?: string
  durationMinutes?: number
  type?: 'In-Person' | 'Online'
  category?: string
  notes?: string
  completed?: boolean
  cancelled?: boolean
  workoutSheetId?: string | null
  workoutSegmentId?: string | null
}

/**
 * Where a flat exercise sits in the template it was read from. Kept so that saving
 * the flat editor sends the structure ids back unchanged.
 */
export interface WorkoutExerciseRef {
  id: string
  itemId: string
  blockId: string
}

export interface WorkoutExercise {
  name: string
  sets: number
  reps: string
  weight?: string
  notes?: string
  isWarmup?: boolean
  ref?: WorkoutExerciseRef
}

/**
 * Flat view of a workout template for the library and the simple editor. The API
 * stores a structured sheet; `source` keeps its items so an edit can rebuild it.
 */
export interface WorkoutPlan {
  id: string
  clientId?: string
  status?: 'Active' | 'Archived'
  title: string
  description?: string
  exercises: WorkoutExercise[]
  tags: string[]
  createdAt: string
  /** First item of the stored structure: the segment a session links to. */
  itemId?: string
  source?: WorkoutSheetItem[]
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
  client?: { name: string; avatar: string | null }
  createdAt?: string
  updatedAt?: string
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
  userId?: string
  createdAt?: string
  updatedAt?: string
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
