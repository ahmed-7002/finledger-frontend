import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../lib/api.js";
import { enqueueMutation } from "../lib/offlineQueue.js";
import { useToast } from "../components/common/ToastProvider.jsx";

export function useSales() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["sales"],
    queryFn: () => apiFetch("/sales", { getToken }),
    enabled: isLoaded && isSignedIn,
    staleTime: 30 * 1000,
  });
}

export function useSaleItems(saleId) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["sales", saleId, "items"],
    queryFn: () => apiFetch(`/sales/${saleId}/items`, { getToken }),
    enabled: Boolean(saleId),
    staleTime: 5 * 60 * 1000, // a sale's line items never change once created
  });
}

/**
 * useCreateSale
 * ----------------------------------------------------------------------
 * The core checkout mutation. Gated behind an active subscription on the
 * backend (POST /api/sales) - the same boundary as recording a manual
 * transaction. A whole checkout (cart + payment + optionally a brand-new
 * customer) is ONE atomic API call, which is what makes it work cleanly
 * with the existing offline queue: there's nothing to split into multiple
 * queued steps, even when a new customer is being created inline.
 *
 * `customerNameForToast` is passed in purely for the confirmation message
 * - it's not sent to the server, just lets the toast say "added to Ahmed's
 * balance" instead of a generic message, without this hook needing to know
 * about currency formatting or reach into the customers cache itself.
 *
 * Optimistic updates are deliberately conservative here: the sales list
 * gets an optimistic entry, and an EXISTING customer's balance updates
 * optimistically (same math as useRecordTransaction). When a brand-new
 * customer is being created as part of the sale, we don't fabricate a fake
 * customer row in the cache - that risks UI glitches (e.g. an optimistic
 * customer card that can't actually be expanded yet) for a case that
 * resolves within a second or two anyway once the real response arrives.
 * ----------------------------------------------------------------------
 */
export function useCreateSale() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useToast();

  return useMutation({
    mutationFn: async ({ items, amountPaid, customerId, newCustomer, customerNameForToast }) => {
      const clientUuid = crypto.randomUUID();
      const body = { items, amountPaid, customerId: customerId ?? null, newCustomer: newCustomer ?? null, clientUuid };

      const totalAmount = items.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
      const amountPending = Math.max(totalAmount - amountPaid, 0);

      if (!navigator.onLine) {
        await enqueueMutation({ path: "/sales", method: "POST", body });
        return {
          _offline: true,
          amountPending,
          customerNameForToast,
        };
      }

      try {
        const result = await apiFetch("/sales", { method: "POST", body, getToken });
        return { ...result, customerNameForToast };
      } catch (err) {
        if (err.status === undefined) {
          await enqueueMutation({ path: "/sales", method: "POST", body });
          return { _offline: true, amountPending, customerNameForToast };
        }
        throw err;
      }
    },
    onMutate: async ({ items, amountPaid, customerId }) => {
      await queryClient.cancelQueries({ queryKey: ["customers"] });

      if (!customerId) return {};

      const previous = queryClient.getQueryData(["customers"]) || [];
      const totalAmount = items.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
      const amountPending = Math.max(totalAmount - amountPaid, 0);

      const updated = previous.map((c) =>
        c.id === customerId
          ? {
              ...c,
              pending_amount: Number(c.pending_amount) + amountPending,
              cleared_amount: Number(c.cleared_amount) + Math.min(amountPaid, totalAmount),
            }
          : c
      );
      queryClient.setQueryData(["customers"], updated);
      return { previous };
    },
    onSuccess: (data) => {
      if (data._offline) {
        addToast("Sale saved offline - will sync when you're back online", "info");
        return;
      }
      if (Number(data.sale.amount_pending) <= 0) {
        addToast("Sale recorded", "success");
      } else if (data.customerNameForToast) {
        addToast(`Sale recorded - added to ${data.customerNameForToast}'s balance`, "success");
      } else {
        addToast("Sale recorded - balance added", "success");
      }
    },
    onError: (err, vars, context) => {
      if (context?.previous) queryClient.setQueryData(["customers"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
