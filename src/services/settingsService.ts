import apiClient from '../utils/apiClient';

// --- Settings API ---
export const getSettings = async () => apiClient<{ aiPromptInstructions: string }>('/settings');

export const updateAiPromptInstructions = async (instructions: string) => apiClient<{ aiPromptInstructions: string }>('/settings', {
  method: 'POST',
  body: JSON.stringify({ aiPromptInstructions: instructions }),
});
