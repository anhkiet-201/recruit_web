const isServer = typeof window === "undefined";

// Internal URL for Server-Side Rendering (SSR) in Docker network
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || "http://backend:4000";
// Public URL for Client-Side (Browser)
const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_ENDPOINT || "https://vieclamhr.com/api";

// ✅ Use internal URL for SSR, public URL for client
const API_URL = isServer ? INTERNAL_API_URL : PUBLIC_API_URL;

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
  timeout?: number; // ✅ Add timeout option
}

// Helper to get or create a persistent guestId
function getGuestId() {
  if (typeof window === "undefined") return null;
  let gid = localStorage.getItem("guestId");
  if (!gid) {
    gid = crypto.randomUUID();
    localStorage.setItem("guestId", gid);
  }
  return gid;
}

async function fetchClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const { timeout = 10000, ...fetchOptions } = options; // ✅ Default 10s timeout

  const headers: Record<string, string> = {
    ...fetchOptions.headers,
  };

  // Add Guest ID to every request
  const gid = getGuestId();
  if (gid) {
    headers["X-Guest-Id"] = gid;
  }

  const isFormData =
    typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;

  if (!headers["Content-Type"] && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // ✅ Add timeout wrapper
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "API request failed");
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json();
    } else {
      return response.text() as T;
    }
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    console.error("Fetch error:", error);
    throw error;
  }
}

type ApiBody = Record<string, unknown> | FormData;

export const api = {
  get: <T>(endpoint: string) => fetchClient<T>(endpoint, { method: "GET" }),
  post: <T>(endpoint: string, body: ApiBody) => {
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;
    return fetchClient<T>(endpoint, {
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
    });
  },
  put: <T>(endpoint: string, body: ApiBody) => {
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;
    return fetchClient<T>(endpoint, {
      method: "PUT",
      body: isFormData ? body : JSON.stringify(body),
    });
  },
  patch: <T>(endpoint: string, body: ApiBody) => {
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;
    return fetchClient<T>(endpoint, {
      method: "PATCH",
      body: isFormData ? body : JSON.stringify(body),
    });
  },
  delete: <T>(endpoint: string) =>
    fetchClient<T>(endpoint, { method: "DELETE" }),
};
