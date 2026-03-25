'use server';

import { cookies } from 'next/headers';
import { http } from '../http';
import {
  CreateWorkspaceSchema,
  UpdateWorkspaceSchema,
  BusinessProfileSchema,
  type CreateWorkspaceInput,
  type UpdateWorkspaceInput,
  type BusinessProfileInput,
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
  [key: string]: unknown;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Read access token from httpOnly cookies — server-side only */
async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('access_token')?.value;
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
    const message = err instanceof Error ? err.message : 'Failed to update workspace';
    return { success: false, error: message, workspace: null };
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
    const message = err instanceof Error ? err.message : 'Failed to save business profile';
    return { success: false, error: message };
  }
}
