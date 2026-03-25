/**
 * Server-only HTTP client.
 * This file is used exclusively in server actions (lib/auth.ts, lib/user.ts).
 * The API_URL env var has no NEXT_PUBLIC_ prefix — it is NEVER sent to the browser.
 */

const BASE_URL = process.env.API_URL || '';

if (!BASE_URL && typeof window === 'undefined') {
  console.warn('[http.ts] API_URL env var is not set. Requests will fail.');
}

interface RequestOptions extends RequestInit {
  token?: string;
}

export interface HttpError extends Error {
  status?: number;
  data?: unknown;
}

export const http = {
  async request(endpoint: string, options: RequestOptions = {}) {
    const { token, ...fetchOptions } = options;
    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(fetchOptions.body && !(fetchOptions.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(options.headers as Record<string, string>),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle non-JSON responses gracefully
    const contentType = response.headers.get('content-type');
    const data = contentType?.includes('application/json')
      ? await response.json().catch(() => ({}))
      : {};

    if (!response.ok) {
      const error = new Error(
        (data as { message?: string })?.message || `Request failed with status ${response.status}`,
      ) as HttpError;
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  },

  get: (url: string, token?: string) =>
    http.request(url, { method: 'GET', token }),

  post: (url: string, body: unknown, token?: string) =>
    http.request(url, {
      method: 'POST',
      body: JSON.stringify(body),
      token,
    }),

  postForm: (url: string, formData: FormData, token?: string) =>
    http.request(url, { method: 'POST', body: formData, token }),

  patch: (url: string, body: unknown, token?: string) =>
    http.request(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      token,
    }),

  put: (url: string, body: unknown, token?: string) =>
    http.request(url, {
      method: 'PUT',
      body: JSON.stringify(body),
      token,
    }),

  delete: (url: string, token?: string) =>
    http.request(url, { method: 'DELETE', token }),
};
