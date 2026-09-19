/**
 * normalizePhoneDigits
 * ----------------------------------------------------------------------
 * Strips a phone number down to its "core" national digits, so a search
 * matches regardless of whether the number is typed with a country code
 * (+92315...) or in the local style starting with 0 (0315...) - both are
 * really the same number, just written differently.
 *
 * Examples:
 *   "+923001234567" -> "3001234567"
 *   "03001234567"    -> "3001234567"
 *   "3001234567"     -> "3001234567"
 * ----------------------------------------------------------------------
 */
export function normalizePhoneDigits(value) {
  const digits = (value || "").replace(/[^\d]/g, "");
  if (digits.startsWith("92")) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

/**
 * matchesCustomerSearch
 * Used by both the Transactions page search and the New Sale customer
 * picker, so "search by name or phone" behaves identically everywhere in
 * the app. Matches on name (case-insensitive substring) OR phone (digits
 * only, normalized so "0315..." and "+92315..." are treated as the same
 * search).
 */
export function matchesCustomerSearch(customer, query) {
  const q = (query || "").trim();
  if (!q) return true;

  const nameMatch = (customer.name || "").toLowerCase().includes(q.toLowerCase());

  const qDigits = normalizePhoneDigits(q);
  const phoneMatch = qDigits.length > 0 && normalizePhoneDigits(customer.phone).includes(qDigits);

  return nameMatch || phoneMatch;
}