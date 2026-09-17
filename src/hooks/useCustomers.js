import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../lib/api.js";
import { enqueueMutation } from "../lib/offlineQueue.js";
import { useToast } from "../components/common/ToastProvider.jsx";

export function useCustomers() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["customers"],
    queryFn: () => apiFetch("/customers", { getToken }),
    enabled: isLoaded && isSignedIn,
    staleTime: 30 * 1000,
  });
}

export function useCustomerTransactions(customerId) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["transactions", customerId],
    queryFn: () => apiFetch(`/customers/${customerId}/transactions`, { getToken }),
    enabled: Boolean(customerId),
    staleTime: 15 * 1000,
  });
}

/**
 * useAddCustomer
 * ----------------------------------------------------------------------
 * Optimistically inserts the new customer into the cached list immediately
 * (so the UI feels instant even on a flaky connection). If the device is
 * offline, the write is persisted to the IndexedDB sync queue instead of
 * being attempted over the network, and gets replayed automatically once
 * connectivity returns (see lib/offlineQueue.js).
 *
 * Shows a confirmation toast on success - worded differently for an
 * offline-queued save ("will sync") vs. a real server confirmation, since
 * those are genuinely different guarantees and the person deserves to know
 * which one they got.
 * ----------------------------------------------------------------------
 */
export function useAddCustomer() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useToast();

  return useMutation({
    mutationFn: async (payload) => {
      const clientUuid = crypto.randomUUID();
      const body = { ...payload, clientUuid };

      if (!navigator.onLine) {
        await enqueueMutation({ path: "/customers", method: "POST", body });
        return { ...body, id: clientUuid, pending_amount: 0, cleared_amount: 0, _offline: true };
      }

      try {
        return await apiFetch("/customers", { method: "POST", body, getToken });
      } catch (err) {
        // Network-level failure even though navigator.onLine said we were
        // online (flaky connection) - fall back to the offline queue too.
        if (err.status === undefined) {
          await enqueueMutation({ path: "/customers", method: "POST", body });
          return { ...body, id: clientUuid, pending_amount: 0, cleared_amount: 0, _offline: true };
        }
        throw err;
      }
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["customers"] });
      const previous = queryClient.getQueryData(["customers"]) || [];

      const optimisticCustomer = {
        id: `optimistic-${Date.now()}`,
        name: payload.name,
        phone: payload.phone,
        phone_verified: Boolean(payload.phoneVerified),
        national_id: payload.nationalId,
        pending_amount: 0,
        cleared_amount: 0,
        updated_at: new Date().toISOString(),
        _optimistic: true,
      };

      queryClient.setQueryData(["customers"], [optimisticCustomer, ...previous]);
      return { previous };
    },
    onSuccess: (data) => {
      if (data._offline) {
        addToast(`${data.name} saved offline - will sync when you're back online`, "info");
      } else {
        addToast(`${data.name} added to your ledger`, "success");
      }
    },
    onError: (err, payload, context) => {
      if (context?.previous) queryClient.setQueryData(["customers"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useToast();

  return useMutation({
    mutationFn: ({ id, ...payload }) => {
      if (!navigator.onLine) {
        return enqueueMutation({ path: `/customers/${id}`, method: "PATCH", body: payload });
      }
      return apiFetch(`/customers/${id}`, { method: "PATCH", body: payload, getToken });
    },
    onSuccess: (data) => {
      if (!navigator.onLine) {
        addToast("Changes saved offline - will sync when you're back online", "info");
      } else {
        addToast("Profile updated", "success");
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteCustomer() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useToast();

  return useMutation({
    mutationFn: (id) => {
      if (!navigator.onLine) {
        return enqueueMutation({ path: `/customers/${id}`, method: "DELETE" });
      }
      return apiFetch(`/customers/${id}`, { method: "DELETE", getToken });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["customers"] });
      const previous = queryClient.getQueryData(["customers"]) || [];
      const deletedCustomer = previous.find((c) => c.id === id);
      queryClient.setQueryData(
        ["customers"],
        previous.filter((c) => c.id !== id)
      );
      return { previous, customerName: deletedCustomer?.name };
    },
    onSuccess: (data, id, context) => {
      const label = context?.customerName ? `${context.customerName} deleted` : "Customer deleted";
      addToast(label, "success");
    },
    onError: (err, id, context) => {
      if (context?.previous) queryClient.setQueryData(["customers"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
}
