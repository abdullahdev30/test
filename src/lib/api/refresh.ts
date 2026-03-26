interface RefreshSuccess {
  accessToken: string;
  refreshToken?: string;
}

const REFRESH_ENDPOINTS = ['/auth/refresh', '/auth/refresh-token'];

function getApiBaseUrl(): string {
  return (process.env.API_URL || '').replace(/\/+$/, '');
}

/**
 * Tries backend refresh endpoints in order and returns fresh tokens on success.
 * Supports both `/auth/refresh` and `/auth/refresh-token` to handle backend variants.
 */
export async function refreshWithBackend(refreshToken: string): Promise<RefreshSuccess | null> {
  if (!refreshToken) return null;

  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return null;

  for (const endpoint of REFRESH_ENDPOINTS) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      });

      if (!response.ok) {
        // Try next endpoint if this path does not exist in the backend.
        if (response.status === 404 || response.status === 405) {
          continue;
        }
        // For auth/network errors on a valid endpoint, stop and return null.
        return null;
      }

      const data = await response.json().catch(() => ({} as Record<string, unknown>));
      const accessToken = (data.accessToken ?? data.access_token) as string | undefined;
      const nextRefreshToken = (data.refreshToken ?? data.refresh_token) as string | undefined;

      if (!accessToken) return null;
      return { accessToken, refreshToken: nextRefreshToken };
    } catch {
      // Try the next endpoint candidate.
    }
  }

  return null;
}
