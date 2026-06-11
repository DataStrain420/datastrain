const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("ds_token") : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    // Network error — backend is probably not running
    console.error(`[apiFetch] Network error on ${path}:`, err);
    throw new Error("Cannot connect to server. Is the backend running?");
  }

  if (res.status === 401) {
    const error = await res.json().catch(() => ({ detail: "Unauthorized" }));
    // Only clear auth + redirect for non-login pages
    // This handles genuinely expired/invalid tokens
    if (typeof window !== "undefined") {
      const isAuthPage =
        window.location.pathname === "/login" ||
        window.location.pathname === "/register";
      if (!isAuthPage) {
        // Log the 401 for debugging, but DON'T auto-redirect
        console.warn(`[apiFetch] 401 on ${path}:`, error.detail);
      }
    }
    throw new Error(error.detail || "Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}
