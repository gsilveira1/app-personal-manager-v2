import { GoogleGenAI, Type } from '@google/genai'
import { type Client, type Evaluation, type MedicalHistory, type WorkoutPlan } from '../types'

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_GMKEY })

const DEFAULT_PERSONA_PROMPT = `Você é um personal trainer experiente e consultor de fitness.
Priorize a segurança do aluno acima de tudo. Respeite limitações físicas e condições médicas.
Sugira progressões graduais e sempre inclua aquecimento e volta à calma.
Comunique-se de forma clara e profissional em português brasileiro.`

function buildMedicalHistoryContext(medicalHistory?: MedicalHistory): string {
  if (!medicalHistory) return 'Nenhum histórico médico registrado.'

  const parts: string[] = []

  if (medicalHistory.objective?.length) {
    parts.push(`Objetivos: ${medicalHistory.objective.join(', ')}`)
  }
  if (medicalHistory.injuries) {
    parts.push(`Lesões: ${medicalHistory.injuries}`)
  }
  if (medicalHistory.surgeries) {
    parts.push(`Cirurgias: ${medicalHistory.surgeries}`)
  }
  if (medicalHistory.medications) {
    parts.push(`Medicamentos: ${medicalHistory.medications}`)
  }
  if (medicalHistory.hasHeartDisease) {
    parts.push('Doença cardíaca: Sim')
  }
  if (medicalHistory.smoker) {
    parts.push('Fumante: Sim')
  }
  if (medicalHistory.drinker) {
    parts.push('Consome álcool: Sim')
  }
  if (medicalHistory.observations) {
    parts.push(`Observações: ${medicalHistory.observations}`)
  }

  return parts.length > 0 ? parts.join('\n      ') : 'Nenhum histórico médico registrado.'
}

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
  const personaBlock = params.customInstructions || DEFAULT_PERSONA_PROMPT

  let clientContextBlock = ''
  if (params.client) {
    const age = params.client.dateOfBirth
      ? new Date().getFullYear() - new Date(params.client.dateOfBirth).getFullYear()
      : 'N/A'
    const medicalContext = buildMedicalHistoryContext(params.client.medicalHistory)

    clientContextBlock = `
      CLIENT PROFILE:
      - Name: ${params.client.name}
      - Age: ${age}
      - Goal: ${params.client.goal || params.goal}
      - Notes: ${params.client.notes || 'None'}
      - Medical History:
      ${medicalContext}
    `
  }

  let evaluationBlock = ''
  if (params.latestEvaluation) {
    evaluationBlock = `
      LATEST EVALUATION:
      - Weight: ${params.latestEvaluation.weight} kg
      - Body Fat: ${params.latestEvaluation.bodyFatPercentage}%
      - Notes: ${params.latestEvaluation.notes || 'None'}
    `
  }

  const prompt = `
    TRAINER INSTRUCTIONS:
    ${personaBlock}

    ${clientContextBlock}
    ${evaluationBlock}

    WORKOUT PARAMETERS:
    - Client Name: ${params.clientName}
    - Goal: ${params.goal}
    - Experience Level: ${params.experienceLevel}
    - Physical Limitations: ${params.limitations || 'None'}
    - Frequency: ${params.daysPerWeek} days per week.

    Please provide a structured response with a title, description, and a list of exercises for a single representative session.
  `

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  sets: { type: Type.NUMBER },
                  reps: { type: Type.STRING },
                  notes: { type: Type.STRING },
                },
                propertyOrdering: ['name', 'sets', 'reps', 'notes'],
              },
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    })
    const jsonString = response.text ? response.text.trim() : undefined
    if (!jsonString) {
      throw new Error('Received an empty response from the AI.')
    }
    return JSON.parse(jsonString)
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

export const generateWorkoutInsights = async ({ client, latestEvaluation, archivedPlans, customInstructions }: WorkoutInsightParams) => {
  const age = client.dateOfBirth ? new Date().getFullYear() - new Date(client.dateOfBirth).getFullYear() : 'N/A'
  const personaBlock = customInstructions || DEFAULT_PERSONA_PROMPT
  const medicalContext = buildMedicalHistoryContext(client.medicalHistory)

  const prompt = `
      TRAINER INSTRUCTIONS:
      ${personaBlock}

      Your task is to provide actionable suggestions for a new workout plan based on the client's detailed profile.

      CLIENT PROFILE:
      - Name: ${client.name}
      - Age: ${age}
      - Primary Goal: ${client.goal}
      - Notes from Trainer: ${client.notes || 'None'}
      - Medical History:
      ${medicalContext}

      LATEST EVALUATION DATA (if available):
      - Weight: ${latestEvaluation?.weight} kg
      - Body Fat: ${latestEvaluation?.bodyFatPercentage}%
      - Evaluation Notes: ${latestEvaluation?.notes || 'None'}

      PAST WORKOUTS (Archived Plans):
      ${archivedPlans.length > 0 ? archivedPlans.map((p) => `- ${p.title}: ${p.description}`).join('\n') : 'No past plans available.'}

      TASK:
      Based on all of the information above, provide 3-5 specific and actionable suggestions for the new workout plan. For each suggestion, provide the rationale ("reason") and a concrete exercise suggestion with name, sets, reps, and optional notes.
      Focus on safety, effectiveness, and alignment with the client's goal. The 'reps' can be a string like '8-10' or '60s'. 'notes' should be concise.
      Return the data in the specified JSON format.

      Example suggestion:
      {
        "suggestion": {
          "name": "Bulgarian Split Squats",
          "sets": 3,
          "reps": "10-12 per leg",
          "notes": "Focus on stability."
        },
        "reason": "This addresses the client's goal of marathon prep and helps strengthen the muscles around their sensitive right knee."
      }
    `

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  suggestion: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      sets: { type: Type.NUMBER },
                      reps: { type: Type.STRING },
                      notes: { type: Type.STRING },
                    },
                    required: ['name', 'sets', 'reps'],
                  },
                  reason: { type: Type.STRING },
                },
                required: ['suggestion', 'reason'],
              },
            },
          },
          required: ['insights'],
        },
      },
    })
    const jsonString = response.text ? response.text.trim() : undefined
    if (!jsonString) {
      throw new Error('Received an empty response from the AI.')
    }
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Error generating workout insights:', error)
    throw new Error('Failed to get insights from AI. Please check your connection or API key.')
  }
}
