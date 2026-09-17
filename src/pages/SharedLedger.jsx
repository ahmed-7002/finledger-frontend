import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { publicApiFetch } from "../lib/publicApi.js";
import { formatCurrency } from "../lib/currency.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
        status === "cleared" ? "bg-primary-fixed text-primary" : "bg-error-container text-error"
      }`}
    >
      {status === "cleared" ? "Cleared" : "Pending"}
    </span>
  );
}

export default function SharedLedger() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    publicApiFetch(`/public/ledger/${token}`)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return <LoadingSpinner fullScreen label="Loading your record..." />;
  }

  if (error || !data) {
    const isRateLimited = error?.status === 429;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <span className="material-symbols-outlined text-4xl text-primary/40 mb-3">
            {isRateLimited ? "hourglass_top" : "link_off"}
          </span>
          <h1 className="font-headline text-lg font-semibold text-primary mb-1">
            {isRateLimited ? "Too many attempts" : "This link isn't valid"}
          </h1>
          <p className="text-sm text-primary/60">
            {isRateLimited
              ? "Please wait a few minutes and try opening the link again."
              : "It may have been removed by the shop owner. Ask them to resend it if you think this is a mistake."}
          </p>
        </div>
      </div>
    );
  }

  const localeOpts = { currencyCode: data.currencyCode, countryCode: data.countryCode };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-on-primary px-4 sm:px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          <div>
            <p className="font-headline text-lg font-semibold leading-tight">
              {data.shopName || "Your Shop"}
            </p>
            <p className="text-xs text-on-primary/70">Ledger for {data.customerName}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-6">
        {/* Balance summary */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-error-container rounded-2xl p-4 sm:p-5">
            <p className="text-xs text-error/80 mb-1">You owe</p>
            <p className="font-headline text-xl sm:text-2xl font-semibold text-error">
              {formatCurrency(data.pendingAmount, localeOpts)}
            </p>
          </div>
          <div className="bg-primary-fixed rounded-2xl p-4 sm:p-5">
            <p className="text-xs text-primary/70 mb-1">Already paid</p>
            <p className="font-headline text-xl sm:text-2xl font-semibold text-primary">
              {formatCurrency(data.clearedAmount, localeOpts)}
            </p>
          </div>
        </div>

        {/* Pay directly via bank details, mirroring the WhatsApp reminder message */}
        {Number(data.pendingAmount) > 0 && (data.bankName || data.accountNumber) && (
          <div className="bg-surface-container-lowest border border-primary-fixed/30 rounded-2xl p-4 sm:p-5 mb-6">
            <p className="text-xs font-medium text-primary/70 mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">account_balance</span>
              Pay directly via bank transfer
            </p>
            <p className="text-sm text-primary">{data.bankName || " - "}</p>
            <p className="text-sm text-primary font-medium">{data.accountNumber || " - "}</p>
          </div>
        )}

        {/* Transaction timeline */}
        <h2 className="font-headline text-base font-semibold text-primary mb-3">
          Transaction History
        </h2>

        {data.transactions.length === 0 ? (
          <div className="bg-surface-container-lowest border border-primary-fixed/30 rounded-2xl p-6 text-center text-sm text-primary/60">
            No transactions recorded yet.
          </div>
        ) : (
          <ol className="relative border-l border-primary-fixed/40 ml-2">
            {data.transactions.map((t, i) => (
              <li key={i} className="mb-5 ml-4">
                <span
                  className={`absolute -left-[7px] h-3 w-3 rounded-full ${
                    t.status === "cleared" ? "bg-primary" : "bg-error"
                  }`}
                />
                <div className="bg-surface-container-lowest border border-primary-fixed/30 rounded-xl p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs text-primary/50">
                      {new Date(t.date).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="text-sm text-primary mb-1">
                    {t.reference || (t.type === "add" ? "Credit given" : "Payment received")}
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      t.type === "add" ? "text-error" : "text-primary"
                    }`}
                  >
                    {t.type === "add" ? "+" : "-"} {formatCurrency(t.amount, localeOpts)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}

        <p className="text-center text-[11px] text-primary/40 mt-8 mb-4">
          This is a read-only record shared by {data.shopName || "your shop"}. If any of this
          looks wrong, contact them directly.
        </p>
      </main>
    </div>
  );
}
