'use server';

import { http, type HttpError } from '../http';
import { getValidToken } from './socialAuth';
import {
  CreateWorkspaceSchema,
  UpdateWorkspaceSchema,
  BusinessProfileSchema,
  UpdateBusinessProfileSchema,
  KeywordSchema,
  ReplaceKeywordsSchema,
  CompleteOnboardingSchema,
  type CreateWorkspaceInput,
  type UpdateWorkspaceInput,
  type BusinessProfileInput,
  type UpdateBusinessProfileInput,
  type KeywordInput,
  type ReplaceKeywordsInput,
  type CompleteOnboardingInput,
} from '../schemas';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  [key: string]: unknown;
}

export interface BusinessProfile {
  id?: string;
  workspaceId?: string;
  businessName?: string;
  brandSlug?: string;
  industry?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  websiteUrl?: string;
  country?: string;
  city?: string;
  timezone?: string;
  defaultLanguage?: string;
  brandTone?: string;
  targetAudience?: string;
  services?: string[];
  goals?: string[];
  preferredPlatforms?: string[];
  postingFrequency?: string;
  approvalRequired?: boolean;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface BusinessKeyword {
  id: string;
  workspaceId?: string;
  keyword: string;
  keywordType: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface OnboardingStatus {
  hasWorkspace?: boolean;
  hasBusinessProfile?: boolean;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: string | null;
  keywordsCount?: number;
  missingFields?: string[];
  [key: string]: unknown;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Read access token from httpOnly cookies — server-side only */
async function getAccessToken(): Promise<string | undefined> {
  return (await getValidToken()) ?? undefined;
}

function isUnauthorizedError(err: unknown): boolean {
  return !!(err && typeof err === 'object' && (err as HttpError).status === 401);
}

async function withAuthRetry<T>(operation: (token: string) => Promise<T>): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  try {
    return await operation(token);
  } catch (err) {
    if (isUnauthorizedError(err)) {
      const refreshed = await getValidToken({ forceRefresh: true });
      if (refreshed) {
        return operation(refreshed);
      }
    }
    throw err;
  }
}

// ─────────────────────────────────────────────
// WORKSPACE SERVER ACTIONS
// ─────────────────────────────────────────────

/** createWorkspace(data) — POST /workspace */
export async function createWorkspace(data: CreateWorkspaceInput) {
  const parsed = CreateWorkspaceSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message, workspace: null };
  }

  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Not authenticated', workspace: null };

  try {
    const result = await http.post('/workspace', parsed.data, token);
    const workspace: Workspace = result.workspace ?? result;
    return { success: true, workspace };
  } catch (err: unknown) {
    if (isUnauthorizedError(err)) {
      const refreshed = await getValidToken({ forceRefresh: true });
      if (refreshed) {
        try {
          const result = await http.post('/workspace', parsed.data, refreshed);
          const workspace: Workspace = result.workspace ?? result;
          return { success: true, workspace };
        } catch {
          // fall through to standard error handling
        }
      }
    }
    const message = err instanceof Error ? err.message : 'Failed to create workspace';
    return { success: false, error: message, workspace: null };
  }
}

/** getMyWorkspace() — GET /workspace/me */
export async function getMyWorkspace() {
  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Not authenticated', workspace: null };

  try {
    const result = await http.get('/workspace/me', token);
    const workspace: Workspace = result.workspace ?? result;
    return { success: true, workspace };
  } catch (err: unknown) {
    if (isUnauthorizedError(err)) {
      const refreshed = await getValidToken({ forceRefresh: true });
      if (refreshed) {
        try {
          const result = await http.get('/workspace/me', refreshed);
          const workspace: Workspace = result.workspace ?? result;
          return { success: true, workspace };
        } catch {
          // fall through to standard error handling
        }
      }
    }
    const message = err instanceof Error ? err.message : 'Failed to fetch workspace';
    return { success: false, error: message, workspace: null };
  }
}

/** updateMyWorkspace(data) — PATCH /workspace/me */
export async function updateMyWorkspace(data: UpdateWorkspaceInput) {
  const parsed = UpdateWorkspaceSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message, workspace: null };
  }

  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Not authenticated', workspace: null };

  try {
    const result = await http.patch('/workspace/me', parsed.data, token);
    const workspace: Workspace = result.workspace ?? result;
    return { success: true, workspace };
  } catch (err: unknown) {
    if (isUnauthorizedError(err)) {
      const refreshed = await getValidToken({ forceRefresh: true });
      if (refreshed) {
        try {
          const result = await http.patch('/workspace/me', parsed.data, refreshed);
          const workspace: Workspace = result.workspace ?? result;
          return { success: true, workspace };
        } catch {
          // fall through to standard error handling
        }
      }
    }
    const message = err instanceof Error ? err.message : 'Failed to update workspace';
    return { success: false, error: message, workspace: null };
  }
}

/** deleteMyWorkspace() — DELETE /workspace/me */
export async function deleteMyWorkspace() {
  try {
    await withAuthRetry((token) => http.delete('/workspace/me', token));
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete workspace';
    return { success: false, error: message };
  }
}

/** getBusinessProfile() — GET /workspace/me/business-profile */
export async function getBusinessProfile() {
  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Not authenticated', businessProfile: null };

  try {
    const result = await http.get('/workspace/me/business-profile', token);
    const businessProfile: BusinessProfile = result.businessProfile ?? result;
    return { success: true, businessProfile };
  } catch (err: unknown) {
    if (isUnauthorizedError(err)) {
      const refreshed = await getValidToken({ forceRefresh: true });
      if (refreshed) {
        try {
          const result = await http.get('/workspace/me/business-profile', refreshed);
          const businessProfile: BusinessProfile = result.businessProfile ?? result;
          return { success: true, businessProfile };
        } catch {
          // fall through to standard error handling
        }
      }
    }
    const message = err instanceof Error ? err.message : 'Failed to fetch business profile';
    return { success: false, error: message, businessProfile: null };
  }
}

/** upsertBusinessProfile(data) — POST /workspace/me/business-profile */
export async function upsertBusinessProfile(data: BusinessProfileInput) {
  const parsed = BusinessProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    await http.post('/workspace/me/business-profile', parsed.data, token);
    return { success: true };
  } catch (err: unknown) {
    if (isUnauthorizedError(err)) {
      const refreshed = await getValidToken({ forceRefresh: true });
      if (refreshed) {
        try {
          await http.post('/workspace/me/business-profile', parsed.data, refreshed);
          return { success: true };
        } catch {
          // fall through to standard error handling
        }
      }
    }
    const message = err instanceof Error ? err.message : 'Failed to save business profile';
    return { success: false, error: message };
  }
}

/** patchBusinessProfile(data) — PATCH /workspace/me/business-profile */
export async function patchBusinessProfile(data: UpdateBusinessProfileInput) {
  const parsed = UpdateBusinessProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await withAuthRetry((token) =>
      http.patch('/workspace/me/business-profile', parsed.data, token),
    );
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update business profile';
    return { success: false, error: message };
  }
}

/** getKeywords() — GET /workspace/me/keywords */
export async function getKeywords() {
  try {
    const result = await withAuthRetry((token) => http.get('/workspace/me/keywords', token));
    const keywords: BusinessKeyword[] = Array.isArray(result)
      ? result
      : Array.isArray((result as { keywords?: BusinessKeyword[] }).keywords)
        ? (result as { keywords: BusinessKeyword[] }).keywords
        : [];
    return { success: true, keywords };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch keywords';
    return { success: false, error: message, keywords: [] as BusinessKeyword[] };
  }
}

/** addKeyword(data) — POST /workspace/me/keywords */
export async function addKeyword(data: KeywordInput) {
  const parsed = KeywordSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const result = await withAuthRetry((token) =>
      http.post('/workspace/me/keywords', parsed.data, token),
    );

    const keyword =
      (result as { keyword?: BusinessKeyword }).keyword ??
      (result as { data?: BusinessKeyword }).data ??
      null;

    return { success: true, keyword };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add keyword';
    return { success: false, error: message, keyword: null as BusinessKeyword | null };
  }
}

/** replaceKeywords(data) — PUT /workspace/me/keywords */
export async function replaceKeywords(data: ReplaceKeywordsInput) {
  const parsed = ReplaceKeywordsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const result = await withAuthRetry((token) =>
      http.put('/workspace/me/keywords', parsed.data, token),
    );
    const keywords: BusinessKeyword[] = Array.isArray((result as { keywords?: BusinessKeyword[] }).keywords)
      ? ((result as { keywords: BusinessKeyword[] }).keywords)
      : [];
    return { success: true, keywords };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to replace keywords';
    return { success: false, error: message, keywords: [] as BusinessKeyword[] };
  }
}

/** deleteAllKeywords() — DELETE /workspace/me/keywords */
export async function deleteAllKeywords() {
  try {
    await withAuthRetry((token) => http.delete('/workspace/me/keywords', token));
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete all keywords';
    return { success: false, error: message };
  }
}

/** updateKeyword(id, data) — PATCH /workspace/me/keywords/{id} */
export async function updateKeyword(id: string, data: Partial<KeywordInput>) {
  const parsed = KeywordSchema.partial().safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  if (!id) return { success: false, error: 'Keyword id is required' };

  try {
    const result = await withAuthRetry((token) =>
      http.patch(`/workspace/me/keywords/${id}`, parsed.data, token),
    );

    const keyword =
      (result as { keyword?: BusinessKeyword }).keyword ??
      (result as { data?: BusinessKeyword }).data ??
      null;

    return { success: true, keyword };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update keyword';
    return { success: false, error: message, keyword: null as BusinessKeyword | null };
  }
}

/** deleteKeyword(id) — DELETE /workspace/me/keywords/{id} */
export async function deleteKeyword(id: string) {
  if (!id) return { success: false, error: 'Keyword id is required' };

  try {
    await withAuthRetry((token) => http.delete(`/workspace/me/keywords/${id}`, token));
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete keyword';
    return { success: false, error: message };
  }
}

/** getOnboardingStatus() — GET /workspace/me/onboarding-status */
export async function getOnboardingStatus() {
  try {
    const result = await withAuthRetry((token) =>
      http.get('/workspace/me/onboarding-status', token),
    );

    const onboardingStatus: OnboardingStatus =
      (result as { onboardingStatus?: OnboardingStatus }).onboardingStatus ??
      (result as OnboardingStatus);

    return { success: true, onboardingStatus };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch onboarding status';
    return { success: false, error: message, onboardingStatus: null as OnboardingStatus | null };
  }
}

/** completeOnboarding(data) — POST /workspace/me/complete-onboarding */
export async function completeOnboarding(data: CompleteOnboardingInput = { confirm: true }) {
  const parsed = CompleteOnboardingSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await withAuthRetry((token) =>
      http.post('/workspace/me/complete-onboarding', parsed.data, token),
    );
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to complete onboarding';
    return { success: false, error: message };
  }
}
