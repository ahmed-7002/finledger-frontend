import React, { useState } from "react";
import { useSubscription } from "../../hooks/useTenant.js";

const REMINDER_WINDOW_DAYS = 5; // start nudging this many days before expiry

export default function RenewalReminderBanner({ onRenewClick }) {
  const [dismissed, setDismissed] = useState(false);
  const { hasActiveSubscription, subscriptionPeriodEnd } = useSubscription();

  if (!hasActiveSubscription || !subscriptionPeriodEnd || dismissed) return null;

  const msLeft = new Date(subscriptionPeriodEnd).getTime() - Date.now();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

  if (daysLeft > REMINDER_WINDOW_DAYS || daysLeft < 0) return null;

  return (
    <div className="bg-primary-fixed/60 text-primary text-sm px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="material-symbols-outlined text-base shrink-0">event_upcoming</span>
        <span className="truncate">
          {daysLeft <= 0
            ? "Your access ends today - renew to keep adding new customers."
            : daysLeft === 1
            ? "Your access ends tomorrow - renew to keep adding new customers."
            : `Your access ends in ${daysLeft} days - renew to keep adding new customers.`}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onRenewClick}
          className="text-xs font-semibold underline underline-offset-2"
        >
          Renew now
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-0.5 rounded-full hover:bg-primary/10"
          aria-label="Dismiss reminder"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </div>
  );
}
