const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

/** FastAPI returns 422 `detail` as an array of {loc, msg, type, ...}. Flatten
 * it into a human message like "effect_duration_hours: Input should be
 * less than or equal to 24". Plain string details pass through. */
function formatApiError(err: unknown): string {
  if (!err || typeof err !== "object") return "";
  const detail = (err as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const msg = (item as { msg?: string }).msg;
          const loc = (item as { loc?: unknown[] }).loc;
          const field = Array.isArray(loc)
            ? loc.filter((p) => p !== "body").join(".")
            : "";
          return field && msg ? `${field}: ${msg}` : msg || JSON.stringify(item);
        }
        return String(item);
      })
      .join("; ");
  }
  if (detail && typeof detail === "object") {
    const msg = (detail as { msg?: string }).msg;
    return msg || JSON.stringify(detail);
  }
  return "";
}

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
    throw new Error(formatApiError(error) || `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Same auth + error handling as apiFetch, but also exposes response
 * headers. Used by paginated list endpoints that surface X-Total-Count
 * so the client can render "Page N of M" controls.
 */
export async function apiFetchWithMeta<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T; total: number | null }> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("ds_token") : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (err) {
    console.error(`[apiFetchWithMeta] Network error on ${path}:`, err);
    throw new Error("Cannot connect to server. Is the backend running?");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(formatApiError(error) || `HTTP ${res.status}`);
  }

  const totalHeader = res.headers.get("X-Total-Count");
  const total = totalHeader ? parseInt(totalHeader, 10) : null;
  const data = (await res.json()) as T;
  return { data, total: Number.isFinite(total as number) ? total : null };
}
