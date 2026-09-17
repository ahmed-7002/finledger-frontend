import React, { Suspense, lazy, useState } from "react";
import { formatCurrency } from "../../lib/currency.js";
import { useCustomerTransactions, useDeleteCustomer } from "../../hooks/useCustomers.js";
import { useSubscription } from "../../hooks/useTenant.js";
import { useGenerateShareLink } from "../../hooks/useShareLink.js";
import { buildShareRecordLink } from "../../lib/whatsapp.js";
import TransactionModal from "./TransactionModal.jsx";
import EditCustomerModal from "./EditCustomerModal.jsx";

const BuyStorageModal = lazy(() => import("../common/BuyStorageModal.jsx"));

function buildWhatsAppLink(customer, tenant, localeOpts) {
  const pending = formatCurrency(customer.pending_amount, localeOpts);
  const message =
    `Dear ${customer.name}, your pending amount is ${pending}, clear it as soon as possible, ` +
    `you can also send it via digital bank and share with me the screenshot\n` +
    `My account number: (${tenant?.account_number || "-"})\n` +
    `Account holder name: (${tenant?.account_holder_name || "-"})\n` +
    `Bank name: (${tenant?.bank_name || "-"})`;

  const phoneDigits = (customer.phone || "").replace(/[^\d]/g, "");
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

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

export default function CustomerCard({ customer, tenant }) {
  const [expanded, setExpanded] = useState(false);
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [paywallReason, setPaywallReason] = useState(null); // null | payload from a 402 response
  const [shareError, setShareError] = useState(false);

  const { data: history } = useCustomerTransactions(expanded ? customer.id : null);
  const deleteCustomer = useDeleteCustomer();
  const { hasActiveSubscription, isExpired, subscriptionPeriodEnd } = useSubscription();
  const generateShareLink = useGenerateShareLink();

  const localeOpts = { currencyCode: tenant?.currency_code, countryCode: tenant?.country_code };
  const canDelete = Number(customer.pending_amount) === 0;

  // Recording a transaction (Add Amount / Deduct-Settle) is gated behind an
  // active subscription - same paywall as adding a new customer. Editing,
  // deleting, WhatsApp reminders, and sharing the record all stay open
  // regardless, so this check only wraps the "Record Transaction" trigger.
  function handleRecordTransactionClick() {
    if (hasActiveSubscription) {
      setShowTxnModal(true);
    } else {
      setPaywallReason({ error: isExpired ? "subscription_expired" : "subscription_required" });
    }
  }

  // Fetches (or creates, on first use) the customer's public share token,
  // then opens WhatsApp with a link to their read-only ledger page. Not
  // gated by subscription - sharing already-recorded data is read-only for
  // the customer and doesn't grow the owner's usage.
  function handleShareRecordClick() {
    setShareError(false);
    generateShareLink.mutate(customer.id, {
      onSuccess: ({ shareUrl }) => {
        const link = buildShareRecordLink(customer.phone, customer.name, shareUrl, tenant?.shop_name);
        window.open(link, "_blank", "noopener,noreferrer");
      },
      onError: () => setShareError(true),
    });
  }

  return (
    <div
      className={`bg-surface-container-lowest border border-primary-fixed/30 rounded-2xl overflow-hidden ${
        expanded ? "customer-card-expanded" : ""
      }`}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary truncate">{customer.name}</p>
          <p className="text-xs text-primary/50 truncate flex items-center gap-1">
            {customer.phone}
            {customer.phone_verified && (
              <span
                className="material-symbols-outlined text-[13px] text-primary shrink-0"
                title="Verified on WhatsApp"
              >
                verified
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-sm font-semibold text-primary">
              {formatCurrency(customer.pending_amount, localeOpts)}
            </p>
            <StatusBadge status={Number(customer.pending_amount) > 0 ? "pending" : "cleared"} />
          </div>
          <span className="material-symbols-outlined expand-icon text-primary/60">
            expand_more
          </span>
        </div>
      </button>

      <div className="customer-details">
        <div>
          <div className="px-4 sm:px-5 pb-5 border-t border-primary-fixed/20 pt-4">
            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <button
                onClick={handleRecordTransactionClick}
                className="flex items-center gap-1.5 bg-primary text-on-primary text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl active:scale-[0.97] transition"
              >
                <span className="material-symbols-outlined text-base">
                  {hasActiveSubscription ? "sync_alt" : "lock"}
                </span>
                Record Transaction
              </button>

              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1.5 border border-primary-fixed/60 text-primary text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                Edit Profile
              </button>

              {!customer.phone_verified && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-1.5 bg-error-container text-error text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl"
                  title="Opens Edit Profile, where you can verify this number on WhatsApp"
                >
                  <span className="material-symbols-outlined text-base">gpp_maybe</span>
                  Not Verified - Verify Now
                </button>
              )}

              <button
                onClick={handleShareRecordClick}
                disabled={generateShareLink.isPending}
                className="flex items-center gap-1.5 border border-primary-fixed/60 text-primary text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-base">
                  {generateShareLink.isPending ? "hourglass_top" : "ios_share"}
                </span>
                Share Record
              </button>

              <a
                href={buildWhatsAppLink(customer, tenant, localeOpts)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 border border-primary-fixed/60 text-primary text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl ml-auto"
              >
                <span className="material-symbols-outlined text-base">chat</span>
                WhatsApp
              </a>

              {canDelete && (
                <button
                  onClick={() => {
                    if (confirm(`Delete ${customer.name}? This can't be undone.`)) {
                      deleteCustomer.mutate(customer.id);
                    }
                  }}
                  disabled={deleteCustomer.isPending}
                  className="flex items-center gap-1.5 text-error text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">
                    {deleteCustomer.isPending ? "hourglass_top" : "delete"}
                  </span>
                  {deleteCustomer.isPending ? "Deleting..." : "Delete"}
                </button>
              )}
            </div>

            {shareError && (
              <p className="text-xs text-error mb-3">
                Couldn't create the share link - check your connection and try again.
              </p>
            )}

            {/* Transaction history */}
            <div className="border border-primary-fixed/20 rounded-xl overflow-hidden mt-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[420px]">
                  <thead>
                    <tr className="text-left text-xs text-primary/50 bg-surface-container-low">
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Reference</th>
                      <th className="px-3 py-2 font-medium">Amount</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(history || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-primary/40 text-xs">
                          No transactions yet
                        </td>
                      </tr>
                    )}
                    {(history || []).map((t) => (
                      <tr key={t.id} className="border-t border-primary-fixed/10">
                        <td className="px-3 py-2 text-primary/70">
                          {new Date(t.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 text-primary/70">{t.reference || "-"}</td>
                        <td className="px-3 py-2 text-primary font-medium">
                          {formatCurrency(t.amount, localeOpts)}
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge status={t.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showTxnModal && (
        <TransactionModal
          customer={customer}
          onClose={() => setShowTxnModal(false)}
          onSubscriptionRequired={(payload) => setPaywallReason(payload)}
        />
      )}
      {showEditModal && (
        <EditCustomerModal
          customer={customer}
          tenant={tenant}
          onClose={() => setShowEditModal(false)}
        />
      )}

      <Suspense fallback={null}>
        {paywallReason && (
          <BuyStorageModal
            onClose={() => setPaywallReason(null)}
            isExpired={paywallReason.error === "subscription_expired"}
            subscriptionPeriodEnd={subscriptionPeriodEnd}
          />
        )}
      </Suspense>
    </div>
  );
}
