const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

/**
 * publicApiFetch
 * ----------------------------------------------------------------------
 * Used only by the public Share Record page (src/pages/SharedLedger.jsx).
 * Deliberately does NOT attach a Clerk Authorization header - the person
 * viewing this page is a customer with no Clerk account at all, not a
 * signed-in shop owner. Keep this separate from lib/api.js's apiFetch so
 * there's no chance of accidentally requiring auth here, or of leaking an
 * owner's session token into a link that gets forwarded around on WhatsApp.
 * ----------------------------------------------------------------------
 */
export async function publicApiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`);
  return handlePublicResponse(res);
}

/**
 * publicApiFetchForm
 * Same no-auth guarantee as publicApiFetch, but for multipart form
 * submissions - specifically the "I've paid, here's my receipt" upload on
 * the Share Record page. Takes a FormData object directly; never sets a
 * Content-Type header manually, since the browser needs to set its own
 * multipart boundary string automatically.
 */
export async function publicApiFetchForm(path, formData) {
  const res = await fetch(`${API_BASE}${path}`, { method: "POST", body: formData });
  return handlePublicResponse(res);
}

async function handlePublicResponse(res) {
  if (!res.ok) {
    let payload = {};
    try {
      payload = await res.json();
    } catch {
      // non-JSON error body, ignore
    }

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