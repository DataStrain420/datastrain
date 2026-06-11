const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

/**
 * Fetch wrapper for admin API calls.
 * Uses Firebase ID token (or dev-admin token in dev mode).
 */
export async function adminFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let token = "dev-admin"; // default for local dev

  // In production, get Firebase ID token
  if (typeof window !== "undefined") {
    const { getAuth } = await import("firebase/auth");
    const auth = getAuth();
    if (auth.currentUser) {
      token = (await auth.currentUser.getIdToken()) || "dev-admin";
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}
