import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../lib/api.js";
import { useToast } from "../components/common/ToastProvider.jsx";

/**
 * usePaymentSubmissions
 * Powers both the notification bell's badge count (filter to "pending"
 * client-side) and the full Notifications panel list. Not offline-queued -
 * reviewing a submission requires seeing the actual receipt image, which
 * only makes sense while online anyway.
 */
export function usePaymentSubmissions() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["payment-submissions"],
    queryFn: () => apiFetch("/payment-submissions", { getToken }),
    enabled: isLoaded && isSignedIn,
    staleTime: 30 * 1000,
  });
}

/**
 * useApproveSubmission
 * Gated behind an active subscription on the backend (same rule as
 * recording any other transaction) - a 402 here should be caught by the
 * caller and redirected to the paywall, same pattern as everywhere else.
 */
export function useApproveSubmission() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useToast();

  return useMutation({
    mutationFn: ({ id, amount, reference }) =>
      apiFetch(`/payment-submissions/${id}/approve`, {
        method: "POST",
        body: { amount, reference },
        getToken,
      }),
    onSuccess: () => {
      addToast("Payment approved", "success");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["payment-submissions"] }),
  });
}

/**
 * useRejectSubmission
 * Never touches the ledger, so this is NOT gated by subscription - matches
 * the same "housekeeping stays free" rule as Edit/Delete elsewhere.
 */
export function useRejectSubmission() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useToast();

  return useMutation({
    mutationFn: ({ id, reason }) =>
      apiFetch(`/payment-submissions/${id}/reject`, {
        method: "POST",
        body: { reason },
        getToken,
      }),
    onSuccess: () => addToast("Payment rejected", "success"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["payment-submissions"] }),
  });
}