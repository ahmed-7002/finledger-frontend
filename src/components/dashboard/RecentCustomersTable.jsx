import React from "react";
import { formatCurrency } from "../../lib/currency.js";

function StatusPill({ pendingAmount }) {
  const isPending = Number(pendingAmount) > 0;
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
        isPending ? "bg-error-container text-error" : "bg-primary-fixed text-primary"
      }`}
    >
      {isPending ? "Pending" : "Cleared"}
    </span>
  );
}

export default function RecentCustomersTable({ customers, tenant }) {
  const localeOpts = { currencyCode: tenant?.currency_code, countryCode: tenant?.country_code };
  const recent = (customers || []).slice(0, 8);

  if (recent.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-primary-fixed/30 rounded-2xl p-8 text-center text-sm text-primary/60">
        No customers yet. Add your first customer to start tracking udhaar.
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest border border-primary-fixed/30 rounded-2xl overflow-hidden">
      {/* Desktop table */}
      <table className="w-full hidden sm:table">
        <thead>
          <tr className="text-left text-xs text-primary/60 border-b border-primary-fixed/30">
            <th className="px-5 py-3 font-medium">Customer</th>
            <th className="px-5 py-3 font-medium">Last Updated</th>
            <th className="px-5 py-3 font-medium">Amount</th>
            <th className="px-5 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((c) => (
            <tr key={c.id} className="border-b border-primary-fixed/10 last:border-0">
              <td className="px-5 py-3 text-sm font-medium text-primary">{c.name}</td>
              <td className="px-5 py-3 text-sm text-primary/60">
                {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : " - "}
              </td>
              <td className="px-5 py-3 text-sm text-primary">
                {formatCurrency(c.pending_amount || c.cleared_amount, localeOpts)}
              </td>
              <td className="px-5 py-3">
                <StatusPill pendingAmount={c.pending_amount} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile stacked cards - zero horizontal scroll */}
      <div className="sm:hidden divide-y divide-primary-fixed/10">
        {recent.map((c) => (
          <div key={c.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary truncate">{c.name}</p>
              <p className="text-xs text-primary/50">
                {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : " - "}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-primary">
                {formatCurrency(c.pending_amount || c.cleared_amount, localeOpts)}
              </p>
              <StatusPill pendingAmount={c.pending_amount} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
