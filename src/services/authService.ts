import { User } from '../types';
import apiClient from '../utils/apiClient';

// --- Auth API ---
export const login = async (email: string, pass: string) => {
  const data = await apiClient<{ user: User, token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: pass }),
  });
  localStorage.setItem('authToken', data.token);
  return { user: data.user, token: data.token };
};

export const signup = async (name: string, email: string, pass: string) => {
  const data = await apiClient<{ user: User, token: string }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password: pass }),
  });
  localStorage.setItem('authToken', data.token);
  return { user: data.user, token: data.token };
};

export const logout = async () => {
  await apiClient('/auth/logout', { method: 'POST' });
  localStorage.removeItem('authToken');
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  try {
    return await apiClient<User>('/auth/me');
  } catch (error) {
    // If token is invalid, the API will throw an error (e.g. 401)
    console.error("Failed to get current user:", error);
    localStorage.removeItem('authToken'); // Clean up invalid token
    return null;
  }
};

export const requestPasswordReset = async (email: string) => {
  return await apiClient<void>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};









