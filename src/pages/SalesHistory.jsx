import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSales, useSaleItems } from "../hooks/useSales.js";
import { useTenant } from "../hooks/useTenant.js";
import { formatCurrency } from "../lib/currency.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";

function SaleRow({ sale, localeOpts }) {
  const [expanded, setExpanded] = useState(false);
  const { data: lineItems } = useSaleItems(expanded ? sale.id : null);

  const fullyPaid = Number(sale.amount_pending) <= 0;

  return (
    <div className="bg-surface-container-lowest border border-primary-fixed/30 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 text-left"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary truncate">
            {sale.customer_name || "Walk-in customer"}
          </p>
          <p className="text-xs text-primary/50">
            {new Date(sale.created_at).toLocaleString(undefined, {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-sm font-semibold text-primary">
              {formatCurrency(sale.total_amount, localeOpts)}
            </p>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                fullyPaid ? "bg-primary-fixed text-primary" : "bg-error-container text-error"
              }`}
            >
              {fullyPaid ? "Paid" : `${formatCurrency(sale.amount_pending, localeOpts)} owing`}
            </span>
          </div>
          <span className="material-symbols-outlined text-primary/50 text-[20px]">
            {expanded ? "expand_less" : "expand_more"}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 sm:px-5 pb-4 border-t border-primary-fixed/20 pt-3">
          {!lineItems ? (
            <p className="text-xs text-primary/50">Loading items...</p>
          ) : lineItems.length === 0 ? (
            <p className="text-xs text-primary/50">No line items recorded.</p>
          ) : (
            <div className="space-y-1.5">
              {lineItems.map((li) => (
                <div key={li.id} className="flex items-center justify-between text-sm">
                  <span className="text-primary/80">
                    {li.item_name} x {Number(li.quantity)}
                  </span>
                  <span className="text-primary font-medium">
                    {formatCurrency(li.line_total, localeOpts)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SalesHistory() {
  const { data: sales, isLoading } = useSales();
  const { data: tenant } = useTenant();
  const localeOpts = { currencyCode: tenant?.currency_code, countryCode: tenant?.country_code };

  const summary = useMemo(() => {
    const list = sales || [];
    const collected = list.reduce((sum, s) => sum + Number(s.amount_paid), 0);
    const pending = list.reduce((sum, s) => sum + Number(s.amount_pending), 0);
    return { count: list.length, collected, pending };
  }, [sales]);

  if (isLoading) return <LoadingSpinner label="Loading sales history..." />;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="font-headline text-2xl font-semibold text-primary">Sales History</h2>
          <p className="text-sm text-primary/60">Every sale you've rung up, walk-in or not</p>
        </div>
        <Link
          to="/new-sale"
          className="flex items-center gap-1.5 bg-primary text-on-primary text-sm font-medium px-4 py-2.5 rounded-xl shrink-0"
        >
          <span className="material-symbols-outlined text-base">point_of_sale</span>
          New Sale
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-primary-fixed rounded-2xl p-4">
          <p className="text-xs text-primary/70 mb-1">Collected</p>
          <p className="font-headline text-lg font-semibold text-primary">
            {formatCurrency(summary.collected, localeOpts)}
          </p>
        </div>
        <div className="bg-surface-container-lowest border border-primary-fixed/30 rounded-2xl p-4">
          <p className="text-xs text-primary/60 mb-1">{summary.count} sales total</p>
          <p className="font-headline text-lg font-semibold text-primary">
            {formatCurrency(summary.pending, localeOpts)} owing
          </p>
        </div>
      </div>

      {(sales || []).length === 0 ? (
        <div className="bg-surface-container-lowest border border-primary-fixed/30 rounded-2xl p-8 text-center text-sm text-primary/60">
          No sales recorded yet.
        </div>
      ) : (
        <div className="space-y-2">
          {sales.map((sale) => (
            <SaleRow key={sale.id} sale={sale} localeOpts={localeOpts} />
          ))}
        </div>
      )}
    </div>
  );
}
