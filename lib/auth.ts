// lib/auth.ts
import { api } from './api';
import { STORAGE_KEYS, APP_ROUTES } from './config';

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.authToken); // ✅ Correct key
};


export async function loginUser(email: string, password: string) {
  try {
    const data = await api.auth.login(email, password);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function signupUser(email: string, password: string, displayName: string) {
  try {
    const data = await api.auth.signup(email, password, displayName);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCurrentUser() {
  try {
    const user = await api.auth.getMe();
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function logoutUser() {
  api.auth.logout();
  if (typeof window !== 'undefined') {
    window.location.href = APP_ROUTES.home;
  }
}

export function isAuthenticated(): boolean {
  return api.auth.isAuthenticated();
}


export function requireAuth() {
  if (!isAuthenticated() && typeof window !== 'undefined') {
    window.location.href = APP_ROUTES.login;
    return false;
  }
  return true;
}