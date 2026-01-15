
export interface User {
  id: string;
  name: string;
  email: string;
}

export enum ClientStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Lead = 'Lead'
}

export enum PaymentMethod {
  CreditCard = 'Credit Card',
  Pix = 'Pix',
  Cash = 'Cash',
  Transfer = 'Transfer'
}

export enum PaymentStatus {
  Paid = 'Paid',
  Pending = 'Pending',
  Overdue = 'Overdue'
}

export type ClientType = 'In-Person' | 'Online';
export type CheckInFrequency = 'Weekly' | 'Bi-weekly' | 'Monthly';

export interface Plan {
  id: string;
  name: string;
  sessionsPerWeek: number;
  sessionDurationMinutes: number;
  pricePerSession: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'Evaluation' | 'Workout Template' | 'Digital Product' | 'Other';
}

// New detailed types for Evaluation
export interface Skinfolds {
  triceps?: number;
  biceps?: number;
  subscapular?: number;
  pectoral?: number;
  suprailiac?: number;
  axillary?: number;
  abdominal?: number;
  thigh?: number;
  calf?: number;
  supraSpinal?: number;
}

export interface Perimeters {
  relaxedArm?: number;
  flexedArm?: number;
  forearm?: number;
  chest?: number;
  waist?: number;
  abdomen?: number;
  hip?: number;
  thigh?: number;
  calf?: number;
}

// New type for Client medical history
export interface MedicalHistory {
  objective?: string[]; // e.g., ['Health', 'Aesthetics']
  hasHeartDisease?: boolean;
  medications?: string;
  injuries?: string;
  surgeries?: string;
  smoker?: boolean;
  drinker?: boolean;
  observations?: string;
}

export interface Client {
  id:string;
  name: string;
  email: string;
  phone: string;
  status: ClientStatus;
  type: ClientType;
  dateOfBirth?: string;
  checkInFrequency?: CheckInFrequency;
  goal?: string; // Keep for simple goals
  medicalHistory?: MedicalHistory;
  notes?: string;
  avatar?: string;
  planId?: string; // Links to a Plan
}

export interface Session {
  id: string;
  clientId: string;
  date: string; // ISO string
  durationMinutes: number;
  type: 'In-Person' | 'Online';
  category: 'Workout' | 'Check-in';
  completed: boolean;
  notes?: string;
  linkedWorkoutId?: string; // ID of the specific workout plan performed
  recurrenceId?: string; // ID for the series of recurring events
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  notes?: string;
  isWarmup?: boolean;
}

export interface WorkoutPlan {
  id: string;
  clientId?: string; // If present, belongs to a specific client (Prescription)
  status?: 'Active' | 'Archived';
  title: string;
  description?: string;
  exercises: WorkoutExercise[];
  tags: string[];
  createdAt: string;
}

export type TransactionType = 'Subscription' | 'OneTime';

export interface FinanceRecord {
  id: string;
  clientId: string;
  amount: number;
  date: string;
  status: PaymentStatus;
  method: PaymentMethod;
  description: string;
  type: TransactionType;
  relatedId?: string; // planId or productId
}

export interface Evaluation {
  id: string;
  clientId: string;
  date: string;
  weight: number; // Massa Total
  height?: number; // Estatura
  bodyFatPercentage?: number;
  leanMass?: number; // Corresponds to Massa Magra
  idealWeight?: number; // Peso Ideal
  absoluteBodyFat?: number; // Gordura Absoluta
  notes?: string;
  skinfolds?: Skinfolds;
  perimeters?: Perimeters;
}