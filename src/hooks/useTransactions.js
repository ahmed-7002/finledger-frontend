import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../lib/api.js";
import { enqueueMutation } from "../lib/offlineQueue.js";
import { useToast } from "../components/common/ToastProvider.jsx";

export function useRecentTransactions() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["transactions", "recent"],
    queryFn: () => apiFetch("/transactions", { getToken }),
    enabled: isLoaded && isSignedIn,
    staleTime: 30 * 1000,
  });
}

/**
 * useRecordTransaction
 * ----------------------------------------------------------------------
 * Handles both "Add Amount" (new credit) and "Deduct Amount / Settle"
 * (cash payment, optionally with a receipt image). Applies an optimistic
 * balance update to the affected customer in the cached list so the
 * dashboard/card reflects the change instantly, then reconciles with the
 * server response (or replays from the offline queue once reconnected).
 * ----------------------------------------------------------------------
 */
export function useRecordTransaction() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useToast();

  return useMutation({
    mutationFn: async ({ customerId, type, amount, reference, receiptFile }) => {
      const clientUuid = crypto.randomUUID();

      if (receiptFile) {
        // Multipart path (receipt attached) - cannot be queued as plain
        // JSON, so we require connectivity for this variant.
        const form = new FormData();
        form.append("customerId", customerId);
        form.append("type", type);
        form.append("amount", amount);
        form.append("reference", reference || "");
        form.append("clientUuid", clientUuid);
        form.append("receipt", receiptFile);
        return apiFetch("/transactions", { method: "POST", body: form, isFormData: true, getToken });
      }

      const body = { customerId, type, amount, reference, clientUuid, paymentMethod: "cash" };

      if (!navigator.onLine) {
        await enqueueMutation({ path: "/transactions", method: "POST", body });
        return { transaction: { ...body, id: clientUuid, status: type === "add" ? "pending" : "cleared" }, _offline: true };
      }

      try {
        return await apiFetch("/transactions", { method: "POST", body, getToken });
      } catch (err) {
        if (err.status === undefined) {
          await enqueueMutation({ path: "/transactions", method: "POST", body });
          return { transaction: { ...body, id: clientUuid, status: type === "add" ? "pending" : "cleared" }, _offline: true };
        }
        throw err;
      }
    },
    onMutate: async ({ customerId, type, amount }) => {
      await queryClient.cancelQueries({ queryKey: ["customers"] });
      const previous = queryClient.getQueryData(["customers"]) || [];

      const updated = previous.map((c) => {
        if (c.id !== customerId) return c;
        const amt = Number(amount) || 0;
        return type === "add"
          ? { ...c, pending_amount: Number(c.pending_amount) + amt }
          : {
              ...c,
              pending_amount: Math.max(Number(c.pending_amount) - amt, 0),
              cleared_amount: Number(c.cleared_amount) + amt,
            };
      });

      queryClient.setQueryData(["customers"], updated);
      return { previous };
    },
    onSuccess: (data, vars) => {
      const label = vars.type === "add" ? "Amount added" : "Payment recorded";
      if (data._offline) {
        addToast(`${label} - saved offline, will sync when you're back online`, "info");
      } else {
        addToast(label, "success");
      }
    },
    onError: (err, vars, context) => {
      if (context?.previous) queryClient.setQueryData(["customers"], context.previous);
    },
    onSettled: (data, error, vars) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["transactions", vars.customerId] });
      queryClient.invalidateQueries({ queryKey: ["transactions", "recent"] });
    },
  });
}
