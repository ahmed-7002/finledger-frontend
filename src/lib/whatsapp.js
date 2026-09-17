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
