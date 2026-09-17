import React, { useState } from "react";
import { useRecordTransaction } from "../../hooks/useTransactions.js";

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export default function TransactionModal({ customer, onClose, onSubscriptionRequired }) {
  const [mode, setMode] = useState(null); // null -> choice screen, "add" | "deduct"
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [error, setError] = useState(null);

  const recordTransaction = useRecordTransaction();

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Enter a valid amount greater than zero");
      return;
    }

    recordTransaction.mutate(
      { customerId: customer.id, type: mode, amount: numericAmount, reference, receiptFile },
      {
        onSuccess: onClose,
        onError: (err) => {
          // Subscription lapsed server-side after this modal was already
          // opened client-side (stale cache) - bounce to the paywall
          // instead of showing a raw network error.
          if (err.status === 402 && onSubscriptionRequired) {
            onSubscriptionRequired(err.payload);
            onClose();
            return;
          }
          setError(err.message || "Something went wrong");
        },
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-surface-container-lowest w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-xl font-semibold text-primary">
            {mode ? (mode === "add" ? "Add Amount" : "Deduct / Settle") : "Record Transaction"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-container-low">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {!mode && (
          <div className="space-y-3">
            <p className="text-sm text-primary/60 mb-2">
              What would you like to record for <span className="font-medium">{customer.name}</span>?
            </p>
            <button
              onClick={() => setMode("add")}
              className="w-full flex items-center gap-3 border border-primary-fixed/50 rounded-xl px-4 py-4 text-left hover:bg-surface-container-low transition"
            >
              <span className="material-symbols-outlined text-primary">add_circle</span>
              <div>
                <p className="text-sm font-semibold text-primary">Add Amount</p>
                <p className="text-xs text-primary/60">New credit given to this customer</p>
              </div>
            </button>
            <button
              onClick={() => setMode("deduct")}
              className="w-full flex items-center gap-3 border border-primary-fixed/50 rounded-xl px-4 py-4 text-left hover:bg-surface-container-low transition"
            >
              <span className="material-symbols-outlined text-primary">remove_circle</span>
              <div>
                <p className="text-sm font-semibold text-primary">Deduct Amount / Settle</p>
                <p className="text-xs text-primary/60">Record a cash payment received</p>
              </div>
            </button>
          </div>
        )}

        {mode && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-primary/70 mb-1">Amount</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="w-full border border-primary-fixed/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="0.00"
              />
            </div>

            {mode === "deduct" && (
              <div className="bg-surface-container-low rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-primary/70">
                <span className="material-symbols-outlined text-lg">payments</span>
                Cash Payment only
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-primary/70 mb-1">
                Reference / note (optional)
              </label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full border border-primary-fixed/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="e.g. Weekly groceries"
              />
            </div>

            {mode === "deduct" && (
              <div>
                <label className="block text-xs font-medium text-primary/70 mb-1">
                  Attach receipt (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-primary/70 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary-fixed file:text-primary file:text-xs file:font-medium"
                />
                {!CLOUDINARY_CLOUD_NAME && (
                  <p className="text-[11px] text-primary/40 mt-1">
                    Receipt is uploaded to Cloudinary via the backend upload endpoint.
                  </p>
                )}
              </div>
            )}

            {error && <p className="text-xs text-error">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode(null)}
                className="flex-1 border border-primary-fixed/50 text-primary rounded-xl py-3 text-sm font-medium"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={recordTransaction.isPending}
                className="flex-1 bg-primary text-on-primary rounded-xl py-3 text-sm font-medium disabled:opacity-60"
              >
                {recordTransaction.isPending ? "Saving..." : "Confirm"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
