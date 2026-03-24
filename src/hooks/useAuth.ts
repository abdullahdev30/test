"use client";

import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api/Auth';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Restore session on page load via HttpOnly cookie
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await authApi.getMe();
        setUser(res.user || res);
      } catch {
        setUser(null);
      }
    };
    initAuth();
  }, []);

  const login = async (formData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.login(formData);
      setUser(res.user || res);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  return { user, error, isLoading, login, logout };
};