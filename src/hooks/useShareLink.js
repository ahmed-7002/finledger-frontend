import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../lib/api.js";
import { useToast } from "../components/common/ToastProvider.jsx";

/**
 * useGenerateShareLink
 * ----------------------------------------------------------------------
 * Called by the shop owner (authenticated) when they tap "Share Record".
 * Idempotent on the backend - calling it again for a customer that
 * already has a token just returns the same link rather than rotating it.
 * Requires connectivity: unlike customer/transaction writes, this isn't
 * queued for offline replay, since the whole point is to open WhatsApp
 * with a working link immediately.
 *
 * The toast here matters more than it might look: opening WhatsApp is the
 * primary confirmation, but if the browser's popup blocker silently blocks
 * that new tab, the toast is the only signal the link was actually created
 * successfully.
 * ----------------------------------------------------------------------
 */
export function useGenerateShareLink() {
  const { getToken } = useAuth();
  const addToast = useToast();

  return useMutation({
    mutationFn: (customerId) =>
      apiFetch(`/customers/${customerId}/share-link`, { method: "POST", getToken }),
    onSuccess: () => {
      addToast("Share link ready", "success");
    },
  });
}
