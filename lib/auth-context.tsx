// lib/auth-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from './api';
import { STORAGE_KEYS } from './config';

interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, displayName?: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;  // NEW
  logout: () => void;
  refreshUser: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isLoadingUser = useRef(false);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.authToken);
    setUser(null);
  }, []);

  const loadUser = useCallback(async () => {
    if (isLoadingUser.current) return;
    isLoadingUser.current = true;

    try {
      const token = localStorage.getItem(STORAGE_KEYS.authToken);
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // ✅ Try to fetch user, if fails, check if it's auth issue
      try {
        const userData = await api.auth.getMe();
        if (userData.success && userData.user) {
          setUser(userData.user);
        } else if (userData.user) {
          // Some APIs return user directly without success wrapper
          setUser(userData.user);
        } else {
          logout();
        }
      } catch (error: any) {
        // ✅ Only logout on 401 or "Not authenticated"
        if (error.status === 401 || error.message?.includes('Not authenticated')) {
          console.log('Auth token invalid, logging out');
          logout();
        } else {
          console.error('Failed to verify auth, but keeping logged in:', error);
          // ✅ Keep user logged in if it's just a network error
          setLoading(false);
        }
      }
    } catch (error: any) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
      isLoadingUser.current = false;
    }
  }, [logout]);

  // ✅ Load user ONCE on mount
  useEffect(() => {
    loadUser();
  }, []); // Empty deps - only run once

  // ✅ Handle cross-tab logout only
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.authToken && !e.newValue) {
        // Token was removed in another tab
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = useCallback(async (email: string, password: string, displayName?: string) => {
    const data = displayName 
      ? await api.auth.signup(email, password, displayName)
      : await api.auth.login(email, password);
    
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.authToken, data.token);
    }
    if (data.user) {
      setUser(data.user);
    }
  }, []);

  const googleLogin = useCallback(async (credential: string) => {
    const data = await api.auth.googleOAuth(credential);
    
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.authToken, data.token);
    }
    if (data.user) {
      setUser(data.user);
    }
  }, []);


  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, logout, refreshUser}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}