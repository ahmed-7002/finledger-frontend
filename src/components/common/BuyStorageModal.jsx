import React from "react";
import { CUSTOMER_LIMIT, BILLING_PERIOD_DAYS } from "../../lib/plan.js";

export default function BuyStorageModal({
  onClose,
  isExpired = false,
  isLimitReached = false,
  subscriptionPeriodEnd = null,
  currentCount = null,
}) {
  const icon = isLimitReached ? "warning" : isExpired ? "hourglass_disabled" : "lock";

  const heading = isLimitReached
    ? `You've reached your ${CUSTOMER_LIMIT.toLocaleString()}-customer limit`
    : isExpired
    ? "Your subscription has expired"
    : "Upgrade to add customers";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-surface-container-lowest w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-6 text-center">
        <span className="material-symbols-outlined text-4xl text-primary mb-3">{icon}</span>
        <h2 className="font-headline text-xl font-semibold text-primary mb-2">{heading}</h2>

        {/* The concrete, headline benefit - a real number, not "more storage" */}
        <div className="bg-primary-fixed/50 border border-primary-fixed rounded-xl px-4 py-3 mb-4">
          <p className="font-headline text-2xl font-semibold text-primary">
            {CUSTOMER_LIMIT.toLocaleString()} customers
          </p>
          <p className="text-xs text-primary/70 mt-0.5">
            Track credit, payments, and reminders for up to{" "}
            {CUSTOMER_LIMIT.toLocaleString()} customers on your ledger.
          </p>
        </div>

        {currentCount !== null && (
          <div className="mb-4 text-left">
            <div className="flex items-center justify-between text-xs text-primary/60 mb-1">
              <span>
                {currentCount.toLocaleString()} of {CUSTOMER_LIMIT.toLocaleString()} used
              </span>
              <span>{Math.min(100, Math.round((currentCount / CUSTOMER_LIMIT) * 100))}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface-container-low overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min(100, (currentCount / CUSTOMER_LIMIT) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <p className="text-sm text-primary/70 mb-1">
          {isLimitReached
            ? "Upgrade your plan to raise your customer limit and keep adding new udhaar accounts."
            : isExpired
            ? "Renew your plan to keep adding customers and recording transactions."
            : "You're on the free plan, which lets you view your dashboard and transaction history. Buy storage to add customers and record transactions."}
        </p>

        {(isExpired || isLimitReached) && (
          <p className="text-xs text-primary/50 mb-3">
            Nothing has been deleted - all your existing customers and transaction history are
            still here and fully visible.
            {isExpired && subscriptionPeriodEnd
              ? ` Your access lapsed on ${new Date(subscriptionPeriodEnd).toLocaleDateString()}.`
              : ""}
          </p>
        )}

        {/* One-time payment framing - sets expectations up front so there
            are no surprises about auto-billing. */}
        <div className="bg-surface-container-low rounded-xl px-4 py-3 mb-3 text-left">
          <p className="text-xs text-primary/70 flex items-start gap-1.5">
            <span className="material-symbols-outlined text-[15px] mt-0.5 shrink-0">
              event_repeat
            </span>
            <span>
              This is a one-time payment that unlocks {BILLING_PERIOD_DAYS} days of access - 
              it does <span className="font-medium">not</span> auto-renew or auto-charge you.
              We'll remind you to pay again when it's about to run out.
            </span>
          </p>
        </div>

        {/* Trust / security reassurance */}
        <p className="text-[11px] text-primary/50 flex items-center justify-center gap-1 mb-5">
          <span className="material-symbols-outlined text-[14px]">verified_user</span>
          Your card details are not saved anywhere with us - your banking details are safe.
        </p>

        <a
          href="/billing"
          className="block w-full bg-primary text-on-primary rounded-xl py-3 font-medium text-sm mb-2 active:scale-[0.98] transition"
        >
          {isExpired ? "Renew Subscription" : isLimitReached ? "Upgrade Plan" : "Buy Storage"}
        </a>
        <button onClick={onClose} className="w-full text-primary/70 text-sm py-2">
          Maybe later
        </button>
      </div>
    </div>
  );
}
