import React, { useState } from "react";
import { validateName, validatePhone, validateNationalId } from "../../lib/validation.js";
import { buildVerificationLink } from "../../lib/whatsapp.js";
import { useAddCustomer } from "../../hooks/useCustomers.js";

export default function AddCustomerModal({ tenant, onClose, onSubscriptionRequired }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifyLinkOpened, setVerifyLinkOpened] = useState(false);
  const [errors, setErrors] = useState({});

  const addCustomer = useAddCustomer();
  const countryCode = tenant?.country_code;

  const phoneCheck = validatePhone(phone, countryCode);
  const phoneLooksValid = phone.trim().length > 0 && !phoneCheck.error;

  function handlePhoneChange(value) {
    setPhone(value);
    // Any edit to the number invalidates a prior verification - it would
    // otherwise be easy to verify one number, then quietly change it.
    setPhoneVerified(false);
    setVerifyLinkOpened(false);
  }

  function handleVerifyClick() {
    if (!phoneLooksValid) return;
    window.open(buildVerificationLink(phoneCheck.e164, tenant?.shop_name), "_blank", "noopener,noreferrer");
    setVerifyLinkOpened(true);
  }

  function handleSubmit(e) {
    e.preventDefault();

    const nameError = validateName(name);
    const { e164, error: phoneError } = validatePhone(phone, countryCode);
    const idError = validateNationalId(nationalId, countryCode);

    const nextErrors = { name: nameError, phone: phoneError, nationalId: idError };
    setErrors(nextErrors);
    if (nameError || phoneError || idError) return;

    addCustomer.mutate(
      { name: name.trim(), phone: e164, nationalId: nationalId || null, phoneVerified },
      {
        onSuccess: onClose,
        onError: (err) => {
          if (err.status === 402 && onSubscriptionRequired) {
            onSubscriptionRequired(err.payload);
            onClose();
          }
        },
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-surface-container-lowest w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-xl font-semibold text-primary">Add New Customer</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-container-low">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-primary/70 mb-1">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-primary-fixed/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. Ahmed Raza"
            />
            {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-primary/70 mb-1">Phone number</label>
            <input
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="w-full border border-primary-fixed/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. +923001234567"
              inputMode="tel"
            />
            {errors.phone && <p className="text-xs text-error mt-1">{errors.phone}</p>}

            {/* Free WhatsApp click-to-chat verification - no OTP API, no cost.
                See lib/whatsapp.js for how this works. */}
            <div className="mt-2 bg-surface-container-low rounded-xl px-3 py-2.5">
              <button
                type="button"
                onClick={handleVerifyClick}
                disabled={!phoneLooksValid}
                className="flex items-center gap-1.5 text-xs font-medium text-primary disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-base">chat</span>
                Verify on WhatsApp
              </button>
              <p className="text-[11px] text-primary/50 mt-1">
                Opens WhatsApp on the customer's phone with a confirmation message. If they
                send it, you'll see the reply in your own WhatsApp - from that exact number.
              </p>

              {verifyLinkOpened && (
                <label className="flex items-start gap-2 mt-2.5 text-xs text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={phoneVerified}
                    onChange={(e) => setPhoneVerified(e.target.checked)}
                    className="mt-0.5"
                  />
                  Customer replied on WhatsApp confirming this number
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-primary/70 mb-1">
              National ID {countryCode === "PK" ? "(CNIC)" : ""}
            </label>
            <input
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              className="w-full border border-primary-fixed/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder={countryCode === "PK" ? "XXXXX-XXXXXXX-X" : "Optional"}
            />
            {errors.nationalId && <p className="text-xs text-error mt-1">{errors.nationalId}</p>}
          </div>

          <button
            type="submit"
            disabled={addCustomer.isPending}
            className="w-full bg-primary text-on-primary rounded-xl py-3 font-medium text-sm active:scale-[0.98] transition disabled:opacity-60"
          >
            {addCustomer.isPending ? "Saving..." : "Add Customer"}
          </button>
          <p className="text-[11px] text-primary/40 text-center">
            Verification is optional - you can add the customer without it.
          </p>
        </form>
      </div>
    </div>
  );
}
