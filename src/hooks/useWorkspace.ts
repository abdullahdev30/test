'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import {
  createWorkspace,
  getMyWorkspace,
  updateMyWorkspace,
  getBusinessProfile,
  upsertBusinessProfile,
  type Workspace,
  type BusinessProfile,
} from '@/lib/api/workspace';
import type { CreateWorkspaceInput, UpdateWorkspaceInput, BusinessProfileInput } from '@/lib/schemas';

export interface UseWorkspaceReturn {
  workspace: Workspace | null;
  businessProfile: BusinessProfile | null;
  isLoading: boolean;
  error: string | null;
  createWorkspace: (data: CreateWorkspaceInput) => Promise<{ success: boolean; error?: string }>;
  updateWorkspace: (data: UpdateWorkspaceInput) => Promise<{ success: boolean; error?: string }>;
  upsertBusinessProfile: (data: BusinessProfileInput) => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useWorkspace(): UseWorkspaceReturn {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  /** Fetch both workspace and business profile */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [wsResult, bpResult] = await Promise.allSettled([
        getMyWorkspace(),
        getBusinessProfile(),
      ]);

      if (wsResult.status === 'fulfilled' && wsResult.value.success) {
        setWorkspace(wsResult.value.workspace);
      }
      if (bpResult.status === 'fulfilled' && bpResult.value.success) {
        setBusinessProfile(bpResult.value.businessProfile);
      }
    } catch {
      // Non-fatal — workspace may not exist yet (new user)
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreateWorkspace = useCallback(
    async (data: CreateWorkspaceInput): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          const result = await createWorkspace(data);
          if (result.success && result.workspace) {
            setWorkspace(result.workspace);
          } else {
            setError(result.error ?? 'Failed to create workspace');
          }
          resolve({ success: result.success, error: result.error ?? undefined });
        });
      });
    },
    [startTransition],
  );

  const handleUpdateWorkspace = useCallback(
    async (data: UpdateWorkspaceInput): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          const result = await updateMyWorkspace(data);
          if (result.success && result.workspace) {
            setWorkspace(result.workspace);
          } else {
            setError(result.error ?? 'Failed to update workspace');
          }
          resolve({ success: result.success, error: result.error ?? undefined });
        });
      });
    },
    [startTransition],
  );

  const handleUpsertBusinessProfile = useCallback(
    async (data: BusinessProfileInput): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          const result = await upsertBusinessProfile(data);
          if (result.success) {
            // Re-fetch to get the persisted profile back
            const bpResult = await getBusinessProfile();
            if (bpResult.success) setBusinessProfile(bpResult.businessProfile);
          } else {
            setError(result.error ?? 'Failed to save business profile');
          }
          resolve({ success: result.success, error: result.error ?? undefined });
        });
      });
    },
    [startTransition],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    workspace,
    businessProfile,
    isLoading,
    error,
    createWorkspace: handleCreateWorkspace,
    updateWorkspace: handleUpdateWorkspace,
    upsertBusinessProfile: handleUpsertBusinessProfile,
    refresh,
    clearError,
  };
}
