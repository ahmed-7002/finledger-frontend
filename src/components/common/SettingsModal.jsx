import React, { useState } from "react";
import { useUpdateTenantSettings } from "../../hooks/useTenant.js";

/**
 * SettingsModal
 * ----------------------------------------------------------------------
 * Lets the owner edit the shop details that were originally only set once
 * during onboarding: shop name, bank name, account holder name, and
 * account number. These four fields are exactly what gets auto-filled
 * into the WhatsApp payment reminder message (see buildWhatsAppLink in
 * CustomerCard.jsx) - editing them here changes what every future
 * reminder says. Not gated by subscription: editing your own settings is
 * housekeeping, same category as Edit Profile on a customer.
 * ----------------------------------------------------------------------
 */
export default function SettingsModal({ tenant, onClose }) {
  const [shopName, setShopName] = useState(tenant?.shop_name || "");
  const [bankName, setBankName] = useState(tenant?.bank_name || "");
  const [accountHolderName, setAccountHolderName] = useState(tenant?.account_holder_name || "");
  const [accountNumber, setAccountNumber] = useState(tenant?.account_number || "");
  const [errors, setErrors] = useState({});

  const updateSettings = useUpdateTenantSettings();

  function validate() {
    const nextErrors = {};
    if (!shopName.trim()) nextErrors.shopName = "Shop name is required";
    if (!bankName.trim() || bankName.trim().length < 2) {
      nextErrors.bankName = "Enter a valid bank name";
    }
    if (!accountHolderName.trim() || accountHolderName.trim().length < 2) {
      nextErrors.accountHolderName = "Enter the name on the bank account";
    }
    if (!/^[A-Za-z0-9\-\s]{4,34}$/.test(accountNumber.trim())) {
      nextErrors.accountNumber = "Enter a valid account number (letters, numbers, dashes only)";
    }
    return nextErrors;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    updateSettings.mutate(
      {
        shopName: shopName.trim(),
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
      },
      { onSuccess: onClose }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-surface-container-lowest w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-xl font-semibold text-primary">Settings</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-container-low">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <p className="text-xs text-primary/50 mb-4">
          These details are used to auto-fill your WhatsApp payment reminders, so customers know
          who they're paying and where to send it.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-primary/70 mb-1">Shop name</label>
            <input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full border border-primary-fixed/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. Al-Karam General Store"
            />
            {errors.shopName && <p className="text-xs text-error mt-1">{errors.shopName}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-primary/70 mb-1">Bank name</label>
            <input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full border border-primary-fixed/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. HBL Bank"
            />
            {errors.bankName && <p className="text-xs text-error mt-1">{errors.bankName}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-primary/70 mb-1">
              Account holder name
            </label>
            <input
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              className="w-full border border-primary-fixed/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Name on the bank account"
            />
            {errors.accountHolderName && (
              <p className="text-xs text-error mt-1">{errors.accountHolderName}</p>
            )}
            <p className="text-[11px] text-primary/40 mt-1">
              Shown to customers so they can confirm the account before transferring.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-primary/70 mb-1">
              Account number
            </label>
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full border border-primary-fixed/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. 01234567890123"
            />
            {errors.accountNumber && (
              <p className="text-xs text-error mt-1">{errors.accountNumber}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={updateSettings.isPending}
            className="w-full bg-primary text-on-primary rounded-xl py-3 font-medium text-sm active:scale-[0.98] transition disabled:opacity-60"
          >
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
