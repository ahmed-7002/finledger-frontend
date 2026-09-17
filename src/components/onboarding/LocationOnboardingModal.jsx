import React, { useState } from "react";
import { useOnboardTenant } from "../../hooks/useTenant.js";
import { resolveLocaleForCountry } from "../../lib/currency.js";

// Very small reverse-geocoding-free approach: we ask the browser for
// coordinates, then use the Intl API's timezone-to-country heuristic as a
// zero-dependency fallback, while letting the user confirm/correct the
// country manually. In production, swap this for a real reverse-geocoding
// API call using the captured lat/lng.
function guessCountryFromTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz?.includes("Karachi")) return "PK";
    if (tz?.includes("Kolkata") || tz?.includes("Calcutta")) return "IN";
    if (tz?.includes("Dhaka")) return "BD";
    if (tz?.includes("London")) return "GB";
    if (tz?.includes("Dubai")) return "AE";
    if (tz?.includes("Riyadh")) return "SA";
    if (tz?.includes("Lagos")) return "NG";
    if (tz?.includes("Nairobi")) return "KE";
    if (tz?.includes("Cairo")) return "EG";
  } catch {
    // ignore
  }
  return "US";
}

export default function LocationOnboardingModal() {
  const [step, setStep] = useState("prompt"); // prompt -> details
  const [coords, setCoords] = useState(null);
  const [countryCode, setCountryCode] = useState(guessCountryFromTimezone());
  const [shopName, setShopName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [geoError, setGeoError] = useState(null);
  const [requestingLocation, setRequestingLocation] = useState(false);

  const onboard = useOnboardTenant();

  function requestLocation() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation isn't supported on this device - continuing without it.");
      setStep("details");
      return;
    }
    setRequestingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setRequestingLocation(false);
        setStep("details");
      },
      (err) => {
        setGeoError("Location permission denied - you can still continue and set your country manually.");
        setRequestingLocation(false);
        setStep("details");
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    const { currency } = resolveLocaleForCountry(countryCode);
    onboard.mutate({
      countryCode,
      currencyCode: currency,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      bankName,
      accountNumber,
      shopName,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-surface-container-lowest w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        {step === "prompt" && (
          <div className="text-center py-4">
            <span className="material-symbols-outlined text-4xl text-primary mb-3">
              location_on
            </span>
            <h2 className="font-headline text-xl font-semibold text-primary mb-2">
              Let's set up your shop
            </h2>
            <p className="text-sm text-primary/70 mb-6">
              We'll use your location just once to set the right currency and ID format for
              your customers. You won't be asked again.
            </p>
            <button
              onClick={requestLocation}
              disabled={requestingLocation}
              className="w-full bg-primary text-on-primary rounded-xl py-3 font-medium text-sm active:scale-[0.98] transition disabled:opacity-60"
            >
              {requestingLocation ? "Getting your location..." : "Allow location access"}
            </button>
            <button
              onClick={() => setStep("details")}
              disabled={requestingLocation}
              className="w-full mt-2 text-primary/70 text-sm py-2 disabled:opacity-40"
            >
              Skip and set country manually
            </button>
          </div>
        )}

        {step === "details" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="font-headline text-xl font-semibold text-primary">
              A few last details
            </h2>
            {geoError && <p className="text-xs text-error">{geoError}</p>}

            <div>
              <label className="block text-xs font-medium text-primary/70 mb-1">Shop name</label>
              <input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full border border-primary-fixed/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="e.g. Al-Karam General Store"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-primary/70 mb-1">Country</label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full border border-primary-fixed/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="PK">Pakistan (PKR)</option>
                <option value="IN">India (INR)</option>
                <option value="BD">Bangladesh (BDT)</option>
                <option value="US">United States (USD)</option>
                <option value="GB">United Kingdom (GBP)</option>
                <option value="AE">UAE (AED)</option>
                <option value="SA">Saudi Arabia (SAR)</option>
                <option value="NG">Nigeria (NGN)</option>
                <option value="KE">Kenya (KES)</option>
                <option value="EG">Egypt (EGP)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-primary/70 mb-1">Bank name</label>
              <input
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full border border-primary-fixed/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="e.g. HBL Bank"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-primary/70 mb-1">
                Account number
              </label>
              <input
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full border border-primary-fixed/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="e.g. 01234567890123"
              />
              <p className="text-[11px] text-primary/50 mt-1">
                Used only in WhatsApp payment reminders sent to your customers.
              </p>
            </div>

            <button
              type="submit"
              disabled={onboard.isPending}
              className="w-full bg-primary text-on-primary rounded-xl py-3 font-medium text-sm active:scale-[0.98] transition disabled:opacity-60"
            >
              {onboard.isPending ? "Saving..." : "Finish setup"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
