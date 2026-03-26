'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  approvePost,
  attachPostAssets,
  createAndQueueAutomationPost,
  createPost,
  listPendingApprovalPosts,
  listPosts,
  queuePostPublish,
  rejectPost,
  runDuePublishJobs,
  setPostTargets,
  updatePost,
  uploadPostAsset,
  type AutomationCreateAndQueueInput,
  type AttachPostAssetsInput,
  type PostAsset,
  type PostItem,
  type SetPostTargetsInput,
  type UploadPostAssetInput,
} from '@/lib/api/posts';
import type { CreatePostInput, UpdatePostInput } from '@/lib/schemas';

const POSTS_CACHE_KEY = 'social_ai_posts_cache_v1';

interface PostsCachePayload {
  version: 1;
  savedAt: string;
  posts: PostItem[];
}

function getSortTime(post: PostItem): number {
  const raw = post.updatedAt ?? post.createdAt;
  if (!raw) return 0;
  const ts = Date.parse(raw);
  return Number.isNaN(ts) ? 0 : ts;
}

function sortPosts(items: PostItem[]): PostItem[] {
  return [...items].sort((a, b) => getSortTime(b) - getSortTime(a));
}

function readPostsCache(): { found: boolean; posts: PostItem[]; savedAt: string | null } {
  if (typeof window === 'undefined') {
    return { found: false, posts: [], savedAt: null };
  }

  try {
    const raw = localStorage.getItem(POSTS_CACHE_KEY);
    if (!raw) return { found: false, posts: [], savedAt: null };

    const parsed = JSON.parse(raw) as PostsCachePayload;
    if (parsed.version !== 1 || !Array.isArray(parsed.posts)) {
      return { found: false, posts: [], savedAt: null };
    }

    const cleaned = parsed.posts.filter((post) => post && typeof post.id === 'string');
    return { found: true, posts: sortPosts(cleaned), savedAt: parsed.savedAt ?? null };
  } catch {
    return { found: false, posts: [], savedAt: null };
  }
}

function writePostsCache(posts: PostItem[]): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const savedAt = new Date().toISOString();
    const payload: PostsCachePayload = {
      version: 1,
      savedAt,
      posts,
    };
    localStorage.setItem(POSTS_CACHE_KEY, JSON.stringify(payload));
    return savedAt;
  } catch {
    return null;
  }
}

function mergeAsset(post: PostItem, asset: PostAsset | null): PostItem {
  if (!asset) return post;
  const existing = Array.isArray(post.assets) ? post.assets : [];
  return {
    ...post,
    assets: [...existing, asset],
    updatedAt: new Date().toISOString(),
  };
}

export interface UsePostsReturn {
  posts: PostItem[];
  pendingApprovalPosts: PostItem[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  cacheSavedAt: string | null;
  getPostByIdFromStore: (id: string) => PostItem | null;
  refreshFromApi: () => Promise<void>;
  refreshPendingApprovalFromApi: () => Promise<void>;
  createNewPost: (data: CreatePostInput) => Promise<{ success: boolean; error?: string; post?: PostItem | null }>;
  updateExistingPost: (id: string, data: UpdatePostInput) => Promise<{ success: boolean; error?: string; post?: PostItem | null }>;
  attachAssetsByUrl: (
    id: string,
    data: AttachPostAssetsInput,
  ) => Promise<{ success: boolean; error?: string; post?: PostItem | null; asset?: PostAsset | null }>;
  uploadAssetFile: (
    id: string,
    data: UploadPostAssetInput,
  ) => Promise<{ success: boolean; error?: string; post?: PostItem | null; asset?: PostAsset | null }>;
  setTargetsForPost: (
    id: string,
    data: SetPostTargetsInput,
  ) => Promise<{ success: boolean; error?: string; post?: PostItem | null }>;
  queuePublish: (id: string) => Promise<{ success: boolean; error?: string }>;
  runDueJobs: () => Promise<{ success: boolean; error?: string; data?: Record<string, unknown> | null }>;
  approveExistingPost: (id: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  rejectExistingPost: (id: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  createAutomationQueuedPost: (
    data: AutomationCreateAndQueueInput,
  ) => Promise<{ success: boolean; error?: string; post?: PostItem | null }>;
  clearError: () => void;
}

export function usePosts(): UsePostsReturn {
  const [cacheBootstrap] = useState(() => readPostsCache());
  const [posts, setPosts] = useState<PostItem[]>(cacheBootstrap.posts);
  const [pendingApprovalPosts, setPendingApprovalPosts] = useState<PostItem[]>([]);
  const [isLoading, setIsLoading] = useState(!cacheBootstrap.found);
  const [error, setError] = useState<string | null>(null);
  const [cacheSavedAt, setCacheSavedAt] = useState<string | null>(cacheBootstrap.savedAt);
  const [isMutating, startTransition] = useTransition();

  const persistPosts = useCallback((nextPosts: PostItem[]) => {
    const sorted = sortPosts(nextPosts);
    setPosts(sorted);
    const savedAt = writePostsCache(sorted);
    if (savedAt) setCacheSavedAt(savedAt);
  }, []);

  const refreshFromApi = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listPosts();
      if (!result.success) {
        setError(result.error ?? 'Failed to fetch posts');
        return;
      }
      persistPosts(result.posts);
    } finally {
      setIsLoading(false);
    }
  }, [persistPosts]);

  const refreshPendingApprovalFromApi = useCallback(async () => {
    setError(null);
    const result = await listPendingApprovalPosts();
    if (!result.success) {
      setError(result.error ?? 'Failed to fetch pending approval posts');
      return;
    }
    setPendingApprovalPosts(sortPosts(result.posts));
  }, []);

  useEffect(() => {
    if (cacheBootstrap.found) return;
    void refreshFromApi();
  }, [cacheBootstrap.found, refreshFromApi]);

  useEffect(() => {
    void refreshPendingApprovalFromApi();
  }, [refreshPendingApprovalFromApi]);

  const getPostByIdFromStore = useCallback(
    (id: string): PostItem | null => posts.find((post) => post.id === id) ?? null,
    [posts],
  );

  const upsertPost = useCallback(
    (updatedPost: PostItem) => {
      const exists = posts.some((post) => post.id === updatedPost.id);
      const next = exists
        ? posts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
        : [updatedPost, ...posts];
      persistPosts(next);
    },
    [persistPosts, posts],
  );

  const patchPostLocally = useCallback(
    (id: string, patch: Partial<PostItem>) => {
      const existing = posts.find((post) => post.id === id);
      if (!existing) return;
      upsertPost({
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      });
    },
    [posts, upsertPost],
  );

  const createNewPost = useCallback(
    async (
      data: CreatePostInput,
    ): Promise<{ success: boolean; error?: string; post?: PostItem | null }> =>
      new Promise((resolve) => {
        startTransition(async () => {
          const result = await createPost(data);
          if (!result.success) {
            setError(result.error ?? 'Failed to create post');
            resolve({ success: false, error: result.error });
            return;
          }

          if (result.post) upsertPost(result.post);
          resolve({ success: true, post: result.post ?? null });
        });
      }),
    [startTransition, upsertPost],
  );

  const updateExistingPost = useCallback(
    async (
      id: string,
      data: UpdatePostInput,
    ): Promise<{ success: boolean; error?: string; post?: PostItem | null }> =>
      new Promise((resolve) => {
        startTransition(async () => {
          const result = await updatePost(id, data);
          if (!result.success) {
            setError(result.error ?? 'Failed to update post');
            resolve({ success: false, error: result.error });
            return;
          }

          if (result.post) {
            upsertPost(result.post);
          } else {
            const existing = posts.find((post) => post.id === id) ?? null;
            if (existing) {
              upsertPost({
                ...existing,
                ...data,
                updatedAt: new Date().toISOString(),
              });
            }
          }

          resolve({ success: true, post: result.post ?? null });
        });
      }),
    [posts, startTransition, upsertPost],
  );

  const attachAssetsByUrl = useCallback(
    async (
      id: string,
      data: AttachPostAssetsInput,
    ): Promise<{ success: boolean; error?: string; post?: PostItem | null; asset?: PostAsset | null }> =>
      new Promise((resolve) => {
        startTransition(async () => {
          const result = await attachPostAssets(id, data);
          if (!result.success) {
            setError(result.error ?? 'Failed to attach assets');
            resolve({ success: false, error: result.error });
            return;
          }

          if (result.post) {
            upsertPost(result.post);
          } else {
            const existing = posts.find((post) => post.id === id) ?? null;
            if (existing) {
              upsertPost(mergeAsset(existing, result.asset ?? null));
            }
          }

          resolve({
            success: true,
            post: result.post ?? null,
            asset: result.asset ?? null,
          });
        });
      }),
    [posts, startTransition, upsertPost],
  );

  const uploadAssetFile = useCallback(
    async (
      id: string,
      data: UploadPostAssetInput,
    ): Promise<{ success: boolean; error?: string; post?: PostItem | null; asset?: PostAsset | null }> =>
      new Promise((resolve) => {
        startTransition(async () => {
          const result = await uploadPostAsset(id, data);
          if (!result.success) {
            setError(result.error ?? 'Failed to upload asset');
            resolve({ success: false, error: result.error });
            return;
          }

          if (result.post) {
            upsertPost(result.post);
          } else {
            const existing = posts.find((post) => post.id === id) ?? null;
            if (existing) {
              upsertPost(mergeAsset(existing, result.asset ?? null));
            }
          }

          resolve({
            success: true,
            post: result.post ?? null,
            asset: result.asset ?? null,
          });
        });
      }),
    [posts, startTransition, upsertPost],
  );

  const setTargetsForPost = useCallback(
    async (
      id: string,
      data: SetPostTargetsInput,
    ): Promise<{ success: boolean; error?: string; post?: PostItem | null }> =>
      new Promise((resolve) => {
        startTransition(async () => {
          const result = await setPostTargets(id, data);
          if (!result.success) {
            setError(result.error ?? 'Failed to set targets');
            resolve({ success: false, error: result.error });
            return;
          }

          if (result.post) {
            upsertPost(result.post);
          } else {
            patchPostLocally(id, { targets: data.targets });
          }

          resolve({ success: true, post: result.post ?? null });
        });
      }),
    [patchPostLocally, startTransition, upsertPost],
  );

  const queuePublish = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> =>
      new Promise((resolve) => {
        startTransition(async () => {
          const result = await queuePostPublish(id);
          if (!result.success) {
            setError(result.error ?? 'Failed to queue publish');
            resolve({ success: false, error: result.error });
            return;
          }

          patchPostLocally(id, { status: 'queued' });
          resolve({ success: true });
        });
      }),
    [patchPostLocally, startTransition],
  );

  const runDueJobs = useCallback(
    async (): Promise<{ success: boolean; error?: string; data?: Record<string, unknown> | null }> =>
      new Promise((resolve) => {
        startTransition(async () => {
          const result = await runDuePublishJobs();
          if (!result.success) {
            setError(result.error ?? 'Failed to run due jobs');
            resolve({ success: false, error: result.error });
            return;
          }

          resolve({ success: true, data: result.data ?? null });
        });
      }),
    [startTransition],
  );

  const approveExistingPost = useCallback(
    async (id: string, reason = 'Approved by user'): Promise<{ success: boolean; error?: string }> =>
      new Promise((resolve) => {
        startTransition(async () => {
          const result = await approvePost(id, reason);
          if (!result.success) {
            setError(result.error ?? 'Failed to approve post');
            resolve({ success: false, error: result.error });
            return;
          }

          patchPostLocally(id, { status: 'approved' });
          setPendingApprovalPosts((prev) => prev.filter((post) => post.id !== id));
          resolve({ success: true });
        });
      }),
    [patchPostLocally, startTransition],
  );

  const rejectExistingPost = useCallback(
    async (id: string, reason: string): Promise<{ success: boolean; error?: string }> =>
      new Promise((resolve) => {
        startTransition(async () => {
          const result = await rejectPost(id, reason);
          if (!result.success) {
            setError(result.error ?? 'Failed to reject post');
            resolve({ success: false, error: result.error });
            return;
          }

          patchPostLocally(id, { status: 'rejected' });
          setPendingApprovalPosts((prev) => prev.filter((post) => post.id !== id));
          resolve({ success: true });
        });
      }),
    [patchPostLocally, startTransition],
  );

  const createAutomationQueuedPost = useCallback(
    async (
      data: AutomationCreateAndQueueInput,
    ): Promise<{ success: boolean; error?: string; post?: PostItem | null }> =>
      new Promise((resolve) => {
        startTransition(async () => {
          const result = await createAndQueueAutomationPost(data);
          if (!result.success) {
            setError(result.error ?? 'Failed to create automation queued post');
            resolve({ success: false, error: result.error });
            return;
          }

          if (result.post) upsertPost(result.post);
          resolve({ success: true, post: result.post ?? null });
        });
      }),
    [startTransition, upsertPost],
  );

  const clearError = useCallback(() => setError(null), []);

  return useMemo(
    () => ({
      posts,
      pendingApprovalPosts,
      isLoading,
      isMutating,
      error,
      cacheSavedAt,
      getPostByIdFromStore,
      refreshFromApi,
      refreshPendingApprovalFromApi,
      createNewPost,
      updateExistingPost,
      attachAssetsByUrl,
      uploadAssetFile,
      setTargetsForPost,
      queuePublish,
      runDueJobs,
      approveExistingPost,
      rejectExistingPost,
      createAutomationQueuedPost,
      clearError,
    }),
    [
      posts,
      pendingApprovalPosts,
      isLoading,
      isMutating,
      error,
      cacheSavedAt,
      getPostByIdFromStore,
      refreshFromApi,
      refreshPendingApprovalFromApi,
      createNewPost,
      updateExistingPost,
      attachAssetsByUrl,
      uploadAssetFile,
      setTargetsForPost,
      queuePublish,
      runDueJobs,
      approveExistingPost,
      rejectExistingPost,
      createAutomationQueuedPost,
      clearError,
    ],
  );
}
