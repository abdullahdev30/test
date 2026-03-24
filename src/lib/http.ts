const BASE_URL = 'http://135.181.242.234:7860';

export const http = {
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Vital for HttpOnly Cookies
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Passes the backend error message (e.g., "Invalid Password") to the UI
      throw new Error(data.message || 'API Error');
    }

    return data;
  },

  get: (url: string) => http.request(url, { method: 'GET' }),
  post: (url: string, body: any) => http.request(url, { method: 'POST', body: JSON.stringify(body) }),
};