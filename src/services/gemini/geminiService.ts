import apiClient from '../../utils/apiClient'
import { type Client, type Evaluation, type WorkoutPlan } from '../../types'

interface GenerateWorkoutParams {
  clientName: string
  goal: string
  experienceLevel: string
  limitations?: string
  daysPerWeek: number
  client?: Client
  latestEvaluation?: Evaluation
  customInstructions?: string
}

export const generateWorkoutPlan = async (params: GenerateWorkoutParams) => {
  try {
    return await apiClient<WorkoutPlan>('/ai/workout-plan', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  } catch (error) {
    console.error('Error generating workout:', error)
    throw error
  }
}

interface WorkoutInsightParams {
  client: Client
  latestEvaluation?: Evaluation
  archivedPlans: WorkoutPlan[]
  customInstructions?: string
}

export const generateWorkoutInsights = async (params: WorkoutInsightParams) => {
  try {
    return await apiClient<{ insights: any[] }>('/ai/workout-insights', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  } catch (error) {
    console.error('Error generating workout insights:', error)
    throw new Error('Failed to get insights from AI. Please check your connection or API key.')
  }
}
