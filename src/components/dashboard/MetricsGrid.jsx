import React from "react";
import { formatCurrency } from "../../lib/currency.js";

function MetricCard({ icon, label, value, tone }) {
  const toneClasses = {
    primary: "bg-primary text-on-primary",
    surface: "bg-surface-container-lowest text-primary border border-primary-fixed/40",
    accent: "bg-primary-fixed text-primary",
  }[tone];

  return (
    <div className={`rounded-2xl p-5 sm:p-6 flex flex-col gap-3 ${toneClasses}`}>
      <span className="material-symbols-outlined text-2xl opacity-80">{icon}</span>
      <div>
        <p className="text-sm opacity-75">{label}</p>
        <p className="font-headline text-2xl sm:text-3xl font-semibold mt-1">{value}</p>
      </div>
    </div>
  );
}

export default function MetricsGrid({ customers, tenant }) {
  const localeOpts = { currencyCode: tenant?.currency_code, countryCode: tenant?.country_code };

  const totals = (customers || []).reduce(
    (acc, c) => {
      acc.pending += Number(c.pending_amount) || 0;
      acc.cleared += Number(c.cleared_amount) || 0;
      return acc;
    },
    { pending: 0, cleared: 0 }
  );
  const totalBalance = totals.pending + totals.cleared;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <MetricCard
        icon="account_balance_wallet"
        label="Total Balance"
        value={formatCurrency(totalBalance, localeOpts)}
        tone="primary"
      />
      <MetricCard
        icon="hourglass_top"
        label="Pending Amount"
        value={formatCurrency(totals.pending, localeOpts)}
        tone="surface"
      />
      <MetricCard
        icon="task_alt"
        label="Cleared Amount"
        value={formatCurrency(totals.cleared, localeOpts)}
        tone="accent"
      />
    </div>
  );
}
