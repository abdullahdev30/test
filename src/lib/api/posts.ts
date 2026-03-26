'use server';

import { http, type HttpError } from '../http';
import { getValidToken } from './socialAuth';
import {
  CreatePostSchema,
  UpdatePostSchema,
  type CreatePostInput,
  type UpdatePostInput,
} from '../schemas';

export interface PostAsset {
  id?: string;
  assetType?: string;
  url?: string;
  previewUrl?: string;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AttachPostAssetsInput {
  assets: Array<{
    assetType: 'image' | 'video' | 'document';
    storageProvider?: string;
    sourceUrl: string;
    fileName?: string;
    mimeType?: string;
    previewUrl?: string;
    sortOrder?: number;
    metadata?: Record<string, unknown>;
  }>;
}

export interface UploadPostAssetInput {
  file: File;
  assetType?: 'image' | 'video' | 'document';
  sortOrder?: number;
  metadataJson?: string;
}

export interface SetPostTargetsInput {
  targets: Array<{
    provider: string;
    socialConnectionId?: string;
    providerTargetId?: string;
    providerTargetName?: string;
    scheduledFor?: string | null;
  }>;
}

export interface AutomationCreateAndQueueInput {
  title: string;
  captionText: string;
  publishMode: 'manual' | 'scheduled';
  sourceType?: string;
  sourceTimezone: string;
  scheduledFor?: string | null;
  approvalRequired?: boolean;
  metadata?: Record<string, unknown>;
  assets: AttachPostAssetsInput['assets'];
  targets: SetPostTargetsInput['targets'];
  autoQueue?: boolean;
}

export interface PostTarget {
  provider?: string;
  socialConnectionId?: string;
  providerTargetId?: string;
  providerTargetName?: string;
  scheduledFor?: string | null;
  [key: string]: unknown;
}

export interface PublishJob {
  id?: string;
  status?: string;
  runAfterUtc?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  error?: string | null;
  [key: string]: unknown;
}

export interface PostItem {
  id: string;
  workspaceId?: string;
  createdByUserId?: string;
  updatedByUserId?: string;
  approvedByUserId?: string;
  title?: string;
  captionText?: string;
  approvalStatus?: string;
  approvalRequired?: boolean;
  publishMode?: string;
  sourceType?: string;
  status?: string;
  scheduledFor?: string | null;
  approvedAt?: string | null;
  lastError?: string | null;
  sourceTimezone?: string;
  metadata?: Record<string, unknown>;
  assets?: PostAsset[];
  targets?: PostTarget[];
  publishJobs?: PublishJob[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function normalizePost(value: unknown): PostItem | null {
  const raw = toRecord(value);
  if (!raw) return null;

  const id = typeof raw.id === 'string' ? raw.id : '';
  if (!id) return null;

  return {
    ...raw,
    id,
    title: typeof raw.title === 'string' ? raw.title : '',
    captionText: typeof raw.captionText === 'string' ? raw.captionText : '',
    workspaceId: typeof raw.workspaceId === 'string' ? raw.workspaceId : undefined,
    createdByUserId: typeof raw.createdByUserId === 'string' ? raw.createdByUserId : undefined,
    updatedByUserId: typeof raw.updatedByUserId === 'string' ? raw.updatedByUserId : undefined,
    approvedByUserId: typeof raw.approvedByUserId === 'string' ? raw.approvedByUserId : undefined,
    approvalStatus: typeof raw.approvalStatus === 'string' ? raw.approvalStatus : undefined,
    approvalRequired: typeof raw.approvalRequired === 'boolean' ? raw.approvalRequired : undefined,
    publishMode: typeof raw.publishMode === 'string' ? raw.publishMode : undefined,
    sourceType: typeof raw.sourceType === 'string' ? raw.sourceType : undefined,
    status: typeof raw.status === 'string' ? raw.status : undefined,
    scheduledFor:
      typeof raw.scheduledFor === 'string'
        ? raw.scheduledFor
        : raw.scheduledFor === null
          ? null
          : undefined,
    approvedAt:
      typeof raw.approvedAt === 'string'
        ? raw.approvedAt
        : raw.approvedAt === null
          ? null
          : undefined,
    lastError:
      typeof raw.lastError === 'string'
        ? raw.lastError
        : raw.lastError === null
          ? null
          : undefined,
    sourceTimezone: typeof raw.sourceTimezone === 'string' ? raw.sourceTimezone : undefined,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
    assets: Array.isArray(raw.assets) ? raw.assets as PostAsset[] : undefined,
    targets: Array.isArray(raw.targets) ? raw.targets as PostTarget[] : undefined,
    publishJobs: Array.isArray(raw.publishJobs) ? raw.publishJobs as PublishJob[] : undefined,
  };
}

function extractPosts(payload: unknown): PostItem[] {
  if (Array.isArray(payload)) {
    return payload.map(normalizePost).filter((item): item is PostItem => item !== null);
  }

  const raw = toRecord(payload);
  if (!raw) return [];

  const candidates = [
    raw.posts,
    raw.data,
    raw.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.map(normalizePost).filter((item): item is PostItem => item !== null);
    }
  }

  const single = normalizePost(payload);
  return single ? [single] : [];
}

function extractPost(payload: unknown): PostItem | null {
  const raw = toRecord(payload);
  if (!raw) return normalizePost(payload);

  const candidate = normalizePost(raw.post ?? raw.data ?? payload);
  if (!candidate) return null;

  return {
    ...candidate,
    assets: Array.isArray(raw.assets) ? (raw.assets as PostAsset[]) : candidate.assets,
    targets: Array.isArray(raw.targets) ? (raw.targets as PostTarget[]) : candidate.targets,
    publishJobs: Array.isArray(raw.publishJobs) ? (raw.publishJobs as PublishJob[]) : candidate.publishJobs,
  };
}

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
      if (refreshed) return operation(refreshed);
    }
    throw err;
  }
}

function toPostPathId(id: string): string {
  return encodeURIComponent(id.trim());
}

export async function listPosts() {
  try {
    const result = await withAuthRetry((token) => http.get('/posts', token));
    return { success: true, posts: extractPosts(result) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch posts';
    return { success: false, error: message, posts: [] as PostItem[] };
  }
}

export async function getPostById(id: string) {
  if (!id) return { success: false, error: 'Post id is required', post: null as PostItem | null };
  const postId = toPostPathId(id);

  try {
    const result = await withAuthRetry((token) => http.get(`/posts/${postId}`, token));
    return { success: true, post: extractPost(result) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch post';
    return { success: false, error: message, post: null as PostItem | null };
  }
}

export async function createPost(data: CreatePostInput) {
  const parsed = CreatePostSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message, post: null as PostItem | null };
  }

  try {
    const result = await withAuthRetry((token) => http.post('/posts', parsed.data, token));
    return { success: true, post: extractPost(result) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create post';
    return { success: false, error: message, post: null as PostItem | null };
  }
}

export async function updatePost(id: string, data: UpdatePostInput) {
  if (!id) return { success: false, error: 'Post id is required', post: null as PostItem | null };
  const postId = toPostPathId(id);

  const parsed = UpdatePostSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message, post: null as PostItem | null };
  }

  try {
    const result = await withAuthRetry((token) => http.patch(`/posts/${postId}`, parsed.data, token));
    return { success: true, post: extractPost(result) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update post';
    return { success: false, error: message, post: null as PostItem | null };
  }
}

function extractAsset(payload: unknown): PostAsset | null {
  const raw = toRecord(payload);
  if (!raw) return null;
  const asset = (raw.asset ?? raw.data ?? payload) as unknown;
  const parsed = toRecord(asset);
  return parsed ? (parsed as PostAsset) : null;
}

export async function attachPostAssets(id: string, data: AttachPostAssetsInput) {
  if (!id) return { success: false, error: 'Post id is required', post: null as PostItem | null };
  const postId = toPostPathId(id);
  if (!Array.isArray(data.assets) || data.assets.length === 0) {
    return { success: false, error: 'At least one asset is required', post: null as PostItem | null };
  }

  try {
    const result = await withAuthRetry((token) => http.post(`/posts/${postId}/assets`, data, token));
    return {
      success: true,
      post: extractPost(result),
      asset: extractAsset(result),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to attach assets';
    return { success: false, error: message, post: null as PostItem | null, asset: null as PostAsset | null };
  }
}

export async function uploadPostAsset(id: string, input: UploadPostAssetInput) {
  if (!id) return { success: false, error: 'Post id is required', post: null as PostItem | null };
  const postId = toPostPathId(id);
  if (!input.file) {
    return { success: false, error: 'Asset file is required', post: null as PostItem | null };
  }

  const formData = new FormData();
  formData.append('file', input.file);
  formData.append('assetType', input.assetType ?? 'image');
  if (typeof input.sortOrder === 'number') {
    formData.append('sortOrder', String(input.sortOrder));
  }
  if (input.metadataJson) {
    formData.append('metadataJson', input.metadataJson);
  }

  try {
    const result = await withAuthRetry((token) =>
      http.postForm(`/posts/${postId}/assets/upload`, formData, token),
    );
    return {
      success: true,
      post: extractPost(result),
      asset: extractAsset(result),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to upload asset';
    return { success: false, error: message, post: null as PostItem | null, asset: null as PostAsset | null };
  }
}

export async function listPendingApprovalPosts() {
  try {
    const result = await withAuthRetry((token) => http.get('/posts/pending-approval', token));
    return { success: true, posts: extractPosts(result) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch pending approval posts';
    return { success: false, error: message, posts: [] as PostItem[] };
  }
}

export async function approvePost(id: string, reason = 'Approved by user') {
  if (!id) return { success: false, error: 'Post id is required' };
  const postId = toPostPathId(id);

  try {
    await withAuthRetry((token) => http.post(`/posts/${postId}/approve`, { reason }, token));
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to approve post';
    return { success: false, error: message };
  }
}

export async function rejectPost(id: string, reason: string) {
  if (!id) return { success: false, error: 'Post id is required' };
  if (!reason.trim()) return { success: false, error: 'Reject reason is required' };
  const postId = toPostPathId(id);

  try {
    await withAuthRetry((token) => http.post(`/posts/${postId}/reject`, { reason }, token));
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reject post';
    return { success: false, error: message };
  }
}

export async function setPostTargets(id: string, data: SetPostTargetsInput) {
  if (!id) return { success: false, error: 'Post id is required', post: null as PostItem | null };
  const postId = toPostPathId(id);
  if (!Array.isArray(data.targets) || data.targets.length === 0) {
    return { success: false, error: 'At least one target is required', post: null as PostItem | null };
  }

  try {
    const result = await withAuthRetry((token) => http.put(`/posts/${postId}/targets`, data, token));
    return { success: true, post: extractPost(result), data: result as Record<string, unknown> };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to set post targets';
    return { success: false, error: message, post: null as PostItem | null, data: null as Record<string, unknown> | null };
  }
}

export async function queuePostPublish(id: string) {
  if (!id) return { success: false, error: 'Post id is required', data: null as Record<string, unknown> | null };
  const postId = toPostPathId(id);

  try {
    const result = await withAuthRetry((token) => http.post(`/posts/${postId}/queue-publish`, {}, token));
    return { success: true, data: result as Record<string, unknown> };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to queue post for publishing';
    return { success: false, error: message, data: null as Record<string, unknown> | null };
  }
}

export async function runDuePublishJobs() {
  try {
    const result = await withAuthRetry((token) => http.post('/posts/publish-jobs/run-due', {}, token));
    return { success: true, data: result as Record<string, unknown> };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to run due publish jobs';
    return { success: false, error: message, data: null as Record<string, unknown> | null };
  }
}

export async function createAndQueueAutomationPost(data: AutomationCreateAndQueueInput) {
  if (!data.title?.trim()) {
    return { success: false, error: 'Title is required', post: null as PostItem | null };
  }
  if (!Array.isArray(data.targets) || data.targets.length === 0) {
    return { success: false, error: 'At least one target is required', post: null as PostItem | null };
  }
  if (!Array.isArray(data.assets)) {
    return { success: false, error: 'Assets must be an array', post: null as PostItem | null };
  }

  try {
    const result = await withAuthRetry((token) =>
      http.post('/posts/automation/create-and-queue', data, token),
    );
    return { success: true, post: extractPost(result), data: result as Record<string, unknown> };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create automation queued post';
    return { success: false, error: message, post: null as PostItem | null, data: null as Record<string, unknown> | null };
  }
}
