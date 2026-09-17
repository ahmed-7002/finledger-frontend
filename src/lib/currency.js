// Minimal country -> currency map covering common markets. Extend as needed;
// falls back to USD if the tenant's country isn't listed.
const COUNTRY_CURRENCY_MAP = {
  PK: { currency: "PKR", locale: "en-PK" },
  IN: { currency: "INR", locale: "en-IN" },
  BD: { currency: "BDT", locale: "en-BD" },
  US: { currency: "USD", locale: "en-US" },
  GB: { currency: "GBP", locale: "en-GB" },
  AE: { currency: "AED", locale: "en-AE" },
  SA: { currency: "SAR", locale: "en-SA" },
  NG: { currency: "NGN", locale: "en-NG" },
  KE: { currency: "KES", locale: "en-KE" },
  EG: { currency: "EGP", locale: "en-EG" },
};

export function resolveLocaleForCountry(countryCode) {
  return COUNTRY_CURRENCY_MAP[countryCode?.toUpperCase()] || { currency: "USD", locale: "en-US" };
}

/**
 * formatCurrency
 * Dynamically formats an amount using the tenant's saved currency/locale
 * (from tenant_profiles.country_code / currency_code) so every metric card,
 * table cell, and WhatsApp message shows the shop owner's local currency.
 */
export function formatCurrency(amount, { currencyCode, countryCode } = {}) {
  const fallback = resolveLocaleForCountry(countryCode);
  const currency = currencyCode || fallback.currency;
  const locale = fallback.locale;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  } catch {
    return `${currency} ${Number(amount || 0).toLocaleString()}`;
  }
}
