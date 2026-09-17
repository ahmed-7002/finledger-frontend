import { isValidPhoneNumber, parsePhoneNumberFromString } from "libphonenumber-js";

export function validateName(name) {
  if (!name || name.trim().length < 2) return "Name must be at least 2 characters";
  if (!/^[a-zA-Z\s.'-]+$/.test(name.trim())) return "Name may only contain letters and spaces";
  return null;
}

/**
 * validatePhone
 * Uses libphonenumber-js against the tenant's saved country_code so a
 * Pakistani shop owner gets validated against PK number formats, etc.
 * Returns the normalized E.164 string on success (used for WhatsApp links
 * and storage) or null with an error message on failure.
 */
export function validatePhone(rawPhone, countryCode) {
  if (!rawPhone) return { error: "Phone number is required" };

  const valid = isValidPhoneNumber(rawPhone, countryCode || undefined);
  if (!valid) return { error: `Enter a valid phone number${countryCode ? ` for ${countryCode}` : ""}` };

  const parsed = parsePhoneNumberFromString(rawPhone, countryCode || undefined);
  return { e164: parsed.number, error: null };
}

// Locale-specific National ID patterns. Add more countries as the tenant
// base grows - each entry is a regex + human-readable format hint.
const NATIONAL_ID_PATTERNS = {
  PK: { pattern: /^\d{5}-\d{7}-\d{1}$/, hint: "Format: XXXXX-XXXXXXX-X (CNIC)" },
  IN: { pattern: /^\d{4}\s?\d{4}\s?\d{4}$/, hint: "Format: 12-digit Aadhaar" },
  US: { pattern: /^\d{3}-\d{2}-\d{4}$/, hint: "Format: XXX-XX-XXXX (SSN)" },
  BD: { pattern: /^\d{10}(\d{3})?$/, hint: "10 or 13-digit National ID" },
};

export function validateNationalId(value, countryCode) {
  if (!value) return null; // optional field
  const rule = NATIONAL_ID_PATTERNS[countryCode?.toUpperCase()];
  if (!rule) {
    // Generic global fallback: alphanumeric, 4-20 chars.
    return /^[A-Za-z0-9-]{4,20}$/.test(value)
      ? null
      : "Enter a valid national ID (4-20 alphanumeric characters)";
  }
  return rule.pattern.test(value) ? null : `Invalid national ID. ${rule.hint}`;
}
