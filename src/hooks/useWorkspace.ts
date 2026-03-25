'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import {
  createWorkspace,
  getMyWorkspace,
  updateMyWorkspace,
  deleteMyWorkspace,
  getBusinessProfile,
  upsertBusinessProfile,
  patchBusinessProfile,
  getKeywords,
  addKeyword,
  replaceKeywords,
  deleteAllKeywords,
  updateKeyword,
  deleteKeyword,
  getOnboardingStatus,
  completeOnboarding,
  type Workspace,
  type BusinessProfile,
  type BusinessKeyword,
  type OnboardingStatus,
} from '@/lib/api/workspace';
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  BusinessProfileInput,
  UpdateBusinessProfileInput,
  KeywordInput,
  ReplaceKeywordsInput,
  CompleteOnboardingInput,
} from '@/lib/schemas';

export interface UseWorkspaceReturn {
  workspace: Workspace | null;
  businessProfile: BusinessProfile | null;
  keywords: BusinessKeyword[];
  onboardingStatus: OnboardingStatus | null;
  hasWorkspace: boolean;
  isLoading: boolean;
  error: string | null;
  createWorkspace: (data: CreateWorkspaceInput) => Promise<{ success: boolean; error?: string }>;
  updateWorkspace: (data: UpdateWorkspaceInput) => Promise<{ success: boolean; error?: string }>;
  deleteWorkspace: () => Promise<{ success: boolean; error?: string }>;
  upsertBusinessProfile: (data: BusinessProfileInput) => Promise<{ success: boolean; error?: string }>;
  patchBusinessProfile: (data: UpdateBusinessProfileInput) => Promise<{ success: boolean; error?: string }>;
  addKeyword: (data: KeywordInput) => Promise<{ success: boolean; error?: string }>;
  replaceKeywords: (data: ReplaceKeywordsInput) => Promise<{ success: boolean; error?: string }>;
  deleteAllKeywords: () => Promise<{ success: boolean; error?: string }>;
  updateKeyword: (id: string, data: Partial<KeywordInput>) => Promise<{ success: boolean; error?: string }>;
  deleteKeyword: (id: string) => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: (data?: CompleteOnboardingInput) => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useWorkspace(): UseWorkspaceReturn {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [keywords, setKeywords] = useState<BusinessKeyword[]>([]);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  /** Fetch workspace, profile, keywords and onboarding status */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [wsResult, bpResult, kwResult, onboardingResult] = await Promise.allSettled([
        getMyWorkspace(),
        getBusinessProfile(),
        getKeywords(),
        getOnboardingStatus(),
      ]);

      if (wsResult.status === 'fulfilled' && wsResult.value.success) {
        setWorkspace(wsResult.value.workspace);
      } else {
        setWorkspace(null);
      }
      if (bpResult.status === 'fulfilled' && bpResult.value.success) {
        setBusinessProfile(bpResult.value.businessProfile);
      } else {
        setBusinessProfile(null);
      }

      if (kwResult.status === 'fulfilled' && kwResult.value.success) {
        setKeywords(kwResult.value.keywords);
      } else {
        setKeywords([]);
      }

      if (onboardingResult.status === 'fulfilled' && onboardingResult.value.success) {
        setOnboardingStatus(onboardingResult.value.onboardingStatus);
      } else {
        setOnboardingStatus(null);
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

  const handleDeleteWorkspace = useCallback(
    async (): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          const result = await deleteMyWorkspace();
          if (result.success) {
            setWorkspace(null);
            setBusinessProfile(null);
            setKeywords([]);
            setOnboardingStatus(null);
          } else {
            setError(result.error ?? 'Failed to delete workspace');
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

  const handlePatchBusinessProfile = useCallback(
    async (data: UpdateBusinessProfileInput): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          const result = await patchBusinessProfile(data);
          if (result.success) {
            const bpResult = await getBusinessProfile();
            if (bpResult.success) setBusinessProfile(bpResult.businessProfile);
          } else {
            setError(result.error ?? 'Failed to update business profile');
          }
          resolve({ success: result.success, error: result.error ?? undefined });
        });
      });
    },
    [startTransition],
  );

  const handleAddKeyword = useCallback(
    async (data: KeywordInput): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          const result = await addKeyword(data);
          if (result.success) {
            const kwResult = await getKeywords();
            if (kwResult.success) setKeywords(kwResult.keywords);
          } else {
            setError(result.error ?? 'Failed to add keyword');
          }
          resolve({ success: result.success, error: result.error ?? undefined });
        });
      });
    },
    [startTransition],
  );

  const handleReplaceKeywords = useCallback(
    async (data: ReplaceKeywordsInput): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          const result = await replaceKeywords(data);
          if (result.success) {
            setKeywords(result.keywords ?? []);
          } else {
            setError(result.error ?? 'Failed to replace keywords');
          }
          resolve({ success: result.success, error: result.error ?? undefined });
        });
      });
    },
    [startTransition],
  );

  const handleDeleteAllKeywords = useCallback(
    async (): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          const result = await deleteAllKeywords();
          if (result.success) {
            setKeywords([]);
          } else {
            setError(result.error ?? 'Failed to delete all keywords');
          }
          resolve({ success: result.success, error: result.error ?? undefined });
        });
      });
    },
    [startTransition],
  );

  const handleUpdateKeyword = useCallback(
    async (id: string, data: Partial<KeywordInput>): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          const result = await updateKeyword(id, data);
          if (result.success) {
            const kwResult = await getKeywords();
            if (kwResult.success) setKeywords(kwResult.keywords);
          } else {
            setError(result.error ?? 'Failed to update keyword');
          }
          resolve({ success: result.success, error: result.error ?? undefined });
        });
      });
    },
    [startTransition],
  );

  const handleDeleteKeyword = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          const result = await deleteKeyword(id);
          if (result.success) {
            setKeywords((prev) => prev.filter((k) => k.id !== id));
          } else {
            setError(result.error ?? 'Failed to delete keyword');
          }
          resolve({ success: result.success, error: result.error ?? undefined });
        });
      });
    },
    [startTransition],
  );

  const handleCompleteOnboarding = useCallback(
    async (data: CompleteOnboardingInput = { confirm: true }): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          const result = await completeOnboarding(data);
          if (result.success) {
            const statusResult = await getOnboardingStatus();
            if (statusResult.success) {
              setOnboardingStatus(statusResult.onboardingStatus);
            }
          } else {
            setError(result.error ?? 'Failed to complete onboarding');
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
    keywords,
    onboardingStatus,
    hasWorkspace: !!workspace,
    isLoading,
    error,
    createWorkspace: handleCreateWorkspace,
    updateWorkspace: handleUpdateWorkspace,
    deleteWorkspace: handleDeleteWorkspace,
    upsertBusinessProfile: handleUpsertBusinessProfile,
    patchBusinessProfile: handlePatchBusinessProfile,
    addKeyword: handleAddKeyword,
    replaceKeywords: handleReplaceKeywords,
    deleteAllKeywords: handleDeleteAllKeywords,
    updateKeyword: handleUpdateKeyword,
    deleteKeyword: handleDeleteKeyword,
    completeOnboarding: handleCompleteOnboarding,
    refresh,
    clearError,
  };
}
