import React, { Suspense, lazy, useState } from "react";
import { formatCurrency } from "../../lib/currency.js";
import { buildPaymentReviewLink } from "../../lib/whatsapp.js";
import {
  usePaymentSubmissions,
  useApproveSubmission,
  useRejectSubmission,
} from "../../hooks/usePaymentSubmissions.js";
import LoadingSpinner from "./LoadingSpinner.jsx";

const BuyStorageModal = lazy(() => import("./BuyStorageModal.jsx"));

function StatusPill({ status }) {
  const styles = {
    pending: "bg-error-container text-error",
    approved: "bg-primary-fixed text-primary",
    rejected: "bg-surface-container-low text-primary/60",
  };
  const labels = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function submissionShareUrl(submission) {
  return `${window.location.origin}/share/${submission.share_token}`;
}

function SubmissionCard({ submission, localeOpts, onSubscriptionRequired }) {
  const [expanded, setExpanded] = useState(false);
  const [amount, setAmount] = useState(String(submission.claimed_amount));
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [error, setError] = useState(null);
  const [justReviewed, setJustReviewed] = useState(null); // { outcome, amount, rejectionReason } | null

  const approveSubmission = useApproveSubmission();
  const rejectSubmission = useRejectSubmission();

  const isPending = submission.status === "pending";
  const displayAmount = submission.approved_amount ?? submission.claimed_amount;

  function handleApprove() {
    setError(null);
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Enter a valid amount greater than zero");
      return;
    }

    approveSubmission.mutate(
      { id: submission.id, amount: numericAmount },
      {
        onSuccess: () => {
          setJustReviewed({ outcome: "approved", amount: formatCurrency(numericAmount, localeOpts) });
        },
        onError: (err) => {
          if (err.status === 402) {
            onSubscriptionRequired();
          } else {
            setError(err.message || "Something went wrong");
          }
        },
      }
    );
  }

  function handleReject() {
    setError(null);
    rejectSubmission.mutate(
      { id: submission.id, reason: rejectReason.trim() || undefined },
      {
        onSuccess: () => {
          setJustReviewed({ outcome: "rejected", rejectionReason: rejectReason.trim() || null });
        },
        onError: (err) => setError(err.message || "Something went wrong"),
      }
    );
  }

  const outcome = justReviewed?.outcome || (submission.status !== "pending" ? submission.status : null);
  const notifyDetails = justReviewed
    ? justReviewed
    : {
        amount: formatCurrency(displayAmount, localeOpts),
        rejectionReason: submission.rejection_reason,
      };

  return (
    <div className="bg-surface-container-lowest border border-primary-fixed/30 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div className="min-w-0 flex items-center gap-3">
          <img
            src={submission.receipt_url}
            alt="Receipt thumbnail"
            className="h-10 w-10 rounded-lg object-cover border border-primary-fixed/30 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary truncate">{submission.customer_name}</p>
            <p className="text-xs text-primary/50">
              {formatCurrency(submission.claimed_amount, localeOpts)} claimed
            </p>
          </div>
        </div>
        <StatusPill status={submission.status} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-primary-fixed/20 pt-3 space-y-3">
          <a href={submission.receipt_url} target="_blank" rel="noopener noreferrer">
            <img
              src={submission.receipt_url}
              alt="Receipt"
              className="w-full max-h-64 object-contain rounded-xl border border-primary-fixed/30"
            />
          </a>

          {isPending && !justReviewed && (
            <>
              {!showRejectForm ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-primary/70 mb-1">
                      Amount to record (edit if it doesn't match the receipt)
                    </label>
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      inputMode="decimal"
                      className="w-full border border-primary-fixed/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  {error && <p className="text-xs text-error">{error}</p>}

                  <div className="flex gap-2">
                    <button
                      onClick={handleApprove}
                      disabled={approveSubmission.isPending}
                      className="flex-1 bg-primary text-on-primary rounded-xl py-2.5 text-sm font-medium disabled:opacity-60"
                    >
                      {approveSubmission.isPending ? "Approving..." : "Approve"}
                    </button>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      className="flex-1 border border-error/50 text-error rounded-xl py-2.5 text-sm font-medium"
                    >
                      Reject
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-primary/70 mb-1">
                      Reason (optional)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={2}
                      className="w-full border border-primary-fixed/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="e.g. Receipt image is unclear"
                    />
                  </div>

                  {error && <p className="text-xs text-error">{error}</p>}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRejectForm(false)}
                      className="flex-1 border border-primary-fixed/50 text-primary rounded-xl py-2.5 text-sm font-medium"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={rejectSubmission.isPending}
                      className="flex-1 bg-error text-on-primary rounded-xl py-2.5 text-sm font-medium disabled:opacity-60"
                    >
                      {rejectSubmission.isPending ? "Rejecting..." : "Confirm Reject"}
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {outcome && (
            <div className="bg-surface-container-low rounded-xl p-3">
              <p className="text-sm text-primary mb-2">
                {outcome === "approved"
                  ? `Approved for ${notifyDetails.amount}.`
                  : notifyDetails.rejectionReason
                  ? `Rejected: ${notifyDetails.rejectionReason}`
                  : "Rejected."}
              </p>

              <a
                href={buildPaymentReviewLink(submission.customer_phone, submission.customer_name, outcome, {
                  amount: notifyDetails.amount,
                  rejectionReason: notifyDetails.rejectionReason,
                  shareUrl: submissionShareUrl(submission),
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 border border-primary-fixed/60 text-primary text-sm font-medium px-4 py-2.5 rounded-xl"
              >
                <span className="material-symbols-outlined text-base">chat</span>
                Notify Customer on WhatsApp
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NotificationsModal({ tenant, onClose }) {
  const { data: submissions, isLoading } = usePaymentSubmissions();
  const [showPaywall, setShowPaywall] = useState(false);

  const localeOpts = { currencyCode: tenant?.currency_code, countryCode: tenant?.country_code };

  const pending = (submissions || []).filter((s) => s.status === "pending");
  const history = (submissions || []).filter((s) => s.status !== "pending");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-background w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-xl font-semibold text-primary">Notifications</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-container-low">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Loading..." />
        ) : (
          <>
            {pending.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-primary/60 uppercase tracking-wide mb-2">
                  Pending Review ({pending.length})
                </h3>
                <div className="space-y-2">
                  {pending.map((s) => (
                    <SubmissionCard
                      key={s.id}
                      submission={s}
                      localeOpts={localeOpts}
                      onSubscriptionRequired={() => setShowPaywall(true)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold text-primary/60 uppercase tracking-wide mb-2">
                Recent History
              </h3>
              {history.length === 0 && pending.length === 0 ? (
                <div className="bg-surface-container-lowest border border-primary-fixed/30 rounded-2xl p-8 text-center text-sm text-primary/60">
                  No payment submissions yet.
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-primary/40">Nothing reviewed yet.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((s) => (
                    <SubmissionCard
                      key={s.id}
                      submission={s}
                      localeOpts={localeOpts}
                      onSubscriptionRequired={() => setShowPaywall(true)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Suspense fallback={null}>
        {showPaywall && <BuyStorageModal onClose={() => setShowPaywall(false)} />}
      </Suspense>
    </div>
  );
}