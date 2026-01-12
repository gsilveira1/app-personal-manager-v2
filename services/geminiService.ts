import { GoogleGenAI, Type } from "@google/genai";
import { Client, Evaluation, WorkoutPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface GenerateWorkoutParams {
  clientName: string;
  goal: string;
  experienceLevel: string;
  limitations?: string;
  daysPerWeek: number;
}

export const generateWorkoutPlan = async (params: GenerateWorkoutParams) => {
  const prompt = `
    Create a detailed workout plan for a client named ${params.clientName}.
    Goal: ${params.goal}
    Experience Level: ${params.experienceLevel}
    Physical Limitations: ${params.limitations || 'None'}
    Frequency: ${params.daysPerWeek} days per week.

    Please provide a structured response with a title, description, and a list of exercises for a single representative session.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
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
                }
              }
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });
    const jsonString = response.text?.trim();
    if (!jsonString) {
      throw new Error("Received an empty response from the AI.");
    }
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error generating workout:", error);
    throw error;
  }
};

interface WorkoutInsightParams {
    client: Client;
    latestEvaluation?: Evaluation;
    archivedPlans: WorkoutPlan[];
    customInstructions?: string;
}

export const generateWorkoutInsights = async ({ client, latestEvaluation, archivedPlans, customInstructions }: WorkoutInsightParams) => {
    const age = client.dateOfBirth ? new Date().getFullYear() - new Date(client.dateOfBirth).getFullYear() : 'N/A';
    
    const prompt = `
      You are an expert personal trainer and fitness consultant assisting another trainer.
      Your task is to provide actionable suggestions for a new workout plan based on the client's detailed profile.

      ${customInstructions ? `IMPORTANT GENERAL INSTRUCTIONS FROM THE TRAINER:\n${customInstructions}\n` : ''}

      CLIENT PROFILE:
      - Name: ${client.name}
      - Age: ${age}
      - Primary Goal: ${client.goal}
      - Notes from Trainer: ${client.notes || 'None'}
      - Medical History & Limitations: ${client.medicalHistory?.injuries || client.medicalHistory?.surgeries || 'None specified'}

      LATEST EVALUATION DATA (if available):
      - Weight: ${latestEvaluation?.weight} kg
      - Body Fat: ${latestEvaluation?.bodyFatPercentage}%
      - Evaluation Notes: ${latestEvaluation?.notes || 'None'}

      PAST WORKOUTS (Archived Plans):
      ${archivedPlans.length > 0 ? archivedPlans.map(p => `- ${p.title}: ${p.description}`).join('\n') : 'No past plans available.'}

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
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
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
                      required: ['name', 'sets', 'reps']
                    },
                    reason: { type: Type.STRING },
                  },
                  required: ['suggestion', 'reason']
                },
              },
            },
            required: ['insights']
          },
        },
      });
      const jsonString = response.text?.trim();
      if (!jsonString) {
        throw new Error("Received an empty response from the AI.");
      }
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Error generating workout insights:", error);
      throw new Error("Failed to get insights from AI. Please check your connection or API key.");
    }
}