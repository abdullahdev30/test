'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUser, updateProfile, uploadAvatar } from '@/lib/user';

export interface UserProfile {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  timezone?: string;
  [key: string]: unknown;
}

export interface UserState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateUser: (data: { firstName: string; lastName: string; timezone?: string }) => Promise<{ success: boolean; error?: string }>;
  uploadUserAvatar: (formData: FormData) => Promise<{ success: boolean; avatarUrl?: string | null; error?: string }>;
}

export const useUser = (): UserState => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getUser();
      if (result.success && result.user) {
        setUser(result.user as UserProfile);
      } else {
        setUser(null);
        if (result.error) setError(result.error);
      }
    } catch {
      setUser(null);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const updateUser = useCallback(
    async (data: { firstName: string; lastName: string; timezone?: string }) => {
      const result = await updateProfile(data);
      if (result.success) {
        setUser((prev) => (prev ? { ...prev, ...data } : null));
      }
      return result;
    },
    [],
  );

  const uploadUserAvatar = useCallback(async (formData: FormData) => {
    const result = await uploadAvatar(formData);
    if (result.success && result.avatarUrl) {
      setUser((prev) => (prev ? { ...prev, avatarUrl: result.avatarUrl as string } : null));
    }
    return result;
  }, []);

  return {
    user,
    isLoading,
    error,
    refetch: fetchUser,
    updateUser,
    uploadUserAvatar,
  };
};
