/**
 * buildVerificationLink
 * ----------------------------------------------------------------------
 * Free, no-API phone verification trick: opens WhatsApp on the CUSTOMER's
 * own device (via the wa.me deep link) with a pre-filled confirmation
 * message. If they tap Send, the message physically arrives at the shop
 * owner's own WhatsApp FROM that exact phone number - proving the number
 * is real and reachable, at zero cost, with no WhatsApp Business API, no
 * OTP service, and no business verification required.
 *
 * This is NOT the same as a blocking, automated OTP flow: there's no
 * webhook telling the app the reply arrived, so the owner has to actually
 * see the reply land in their own WhatsApp and then tick the "Customer
 * replied" checkbox themselves. See README -> "WhatsApp phone verification"
 * for the full trade-off explanation.
 * ----------------------------------------------------------------------
 */
export function buildVerificationLink(e164Phone, shopName) {
  const shop = shopName?.trim() || "my shop";
  const message = `Reply YES to confirm this is your WhatsApp number for ${shop}.`;
  const phoneDigits = (e164Phone || "").replace(/[^\d]/g, "");
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

/**
 * buildShareRecordLink
 * ----------------------------------------------------------------------
 * Builds the wa.me link the owner uses to send a customer their public,
 * read-only ledger page (see backend routes/public.js and
 * frontend/src/pages/SharedLedger.jsx). `shareUrl` is the full public URL
 * returned by POST /api/customers/:id/share-link - this function only
 * builds the WhatsApp message wrapping it, it doesn't generate the link
 * itself.
 * ----------------------------------------------------------------------
 */
export function buildShareRecordLink(customerPhone, customerName, shareUrl, shopName) {
  const shop = shopName?.trim() || "us";
  const message =
    `Hi ${customerName}, here is your transaction record with ${shop} - ` +
    `dates, amounts, and your current balance:\n${shareUrl}`;

  const phoneDigits = (customerPhone || "").replace(/[^\d]/g, "");
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

/**
 * buildPaymentReviewLink
 * ----------------------------------------------------------------------
 * One-tap "Notify Customer" message after the owner approves or rejects a
 * submitted payment receipt (see components/notifications/NotificationsModal.jsx).
 * This is deliberately NOT automatic - there's no paid WhatsApp Business
 * API wired in here, so nothing sends until the owner taps Send themselves,
 * same trade-off as every other WhatsApp feature in this app (see README).
 *
 * Includes the customer's own Share Record link either way (approved or
 * rejected) so they can tap straight through to see their updated balance,
 * or - if rejected - get right back to the same page to resubmit, without
 * having to dig through old chat history for the link.
 * ----------------------------------------------------------------------
 */
export function buildPaymentReviewLink(customerPhone, customerName, outcome, details) {
  const { amount, shareUrl, rejectionReason } = details;

  const message =
    outcome === "approved"
      ? `Hi ${customerName}, your payment of ${amount} has been approved. ` +
        `See your updated balance here: ${shareUrl}`
      : `Hi ${customerName}, your submitted receipt could not be verified.` +
        (rejectionReason ? ` Reason: ${rejectionReason}.` : "") +
        ` Please resubmit here: ${shareUrl}`;

  const phoneDigits = (customerPhone || "").replace(/[^\d]/g, "");
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}