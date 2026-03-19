const BASE_URL = "http://135.181.242.234:7860";
export const http = {
  post: async <T>(endpoint: string, body: any): Promise<T> => {
    const fullUrl = `${BASE_URL}${endpoint}`;

    const res = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || "Backend Request Failed");
    }

    return res.json();
  },

  get: async <T>(endpoint: string, token?: string): Promise<T> => {
    const fullUrl = `${BASE_URL}${endpoint}`;
    
    const res = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
      },
    });

    if (!res.ok) throw new Error("Fetch failed");
    return res.json();
  }
};