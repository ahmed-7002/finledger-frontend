const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

/**
 * apiFetch
 * ----------------------------------------------------------------------
 * Thin fetch wrapper used by every hook. `getToken` is Clerk's
 * `useAuth().getToken` - we pass it in per-call rather than importing a
 * global so this file stays framework-decoupled and testable.
 * ----------------------------------------------------------------------
 */
export async function apiFetch(path, { method = "GET", body, getToken, isFormData = false } = {}) {
  const token = getToken ? await getToken() : null;

  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let payload = {};
    try {
      payload = await res.json();
    } catch {
      // non-JSON error body, ignore
    }

    // Rate-limited (express-rate-limit on the backend). Surface a clear,
    // friendly message rather than a generic "Request failed (429)" - 
    // this is the one error class a normal user might actually hit during
    // legitimate fast use (e.g. recording several transactions quickly),
    // not just an attacker being blocked.
    const message =
      res.status === 429
        ? payload.message || "Too many requests. Please wait a moment and try again."
        : payload.message || payload.error || `Request failed (${res.status})`;

    const err = new Error(message);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}
