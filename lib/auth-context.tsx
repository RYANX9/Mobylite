// lib/auth-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.authToken);
        if (token) {
          const userData = await api.auth.getMe();
          if (userData.success && userData.user) {
            setUser(userData.user);
          } else {
            localStorage.removeItem(STORAGE_KEYS.authToken);
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        localStorage.removeItem(STORAGE_KEYS.authToken);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.authToken) {
        if (!e.newValue) {
          setUser(null);
        } else {
          loadUser();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email: string, password: string, displayName?: string) => {
    const data = displayName 
      ? await api.auth.signup(email, password, displayName)
      : await api.auth.login(email, password);
    
    if (data.token) {
      localStorage.setItem(STORAGE_KEYS.authToken, data.token);
    }
    
    setUser(data.user);
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}