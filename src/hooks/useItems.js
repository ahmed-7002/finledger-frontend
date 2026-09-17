import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../lib/api.js";
import { enqueueMutation } from "../lib/offlineQueue.js";
import { useToast } from "../components/common/ToastProvider.jsx";

export function useItems() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["items"],
    queryFn: () => apiFetch("/items", { getToken }),
    enabled: isLoaded && isSignedIn,
    staleTime: 60 * 1000, // catalog changes rarely - cache a bit longer than customers
  });
}

/**
 * useAddItem
 * Same optimistic + offline-queue pattern as useAddCustomer - items are NOT
 * gated by subscription (see backend routes/items.js), so this works the
 * same regardless of plan status.
 */
export function useAddItem() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useToast();

  return useMutation({
    mutationFn: async (payload) => {
      const clientUuid = crypto.randomUUID();
      const body = { ...payload, clientUuid };

      if (!navigator.onLine) {
        await enqueueMutation({ path: "/items", method: "POST", body });
        return { ...body, id: clientUuid, is_active: true, _offline: true };
      }

      try {
        return await apiFetch("/items", { method: "POST", body, getToken });
      } catch (err) {
        if (err.status === undefined) {
          await enqueueMutation({ path: "/items", method: "POST", body });
          return { ...body, id: clientUuid, is_active: true, _offline: true };
        }
        throw err;
      }
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["items"] });
      const previous = queryClient.getQueryData(["items"]) || [];

      const optimisticItem = {
        id: `optimistic-${Date.now()}`,
        name: payload.name,
        price: payload.price,
        is_active: true,
        _optimistic: true,
      };

      queryClient.setQueryData(["items"], [...previous, optimisticItem]);
      return { previous };
    },
    onSuccess: (data) => {
      if (data._offline) {
        addToast(`${data.name} saved offline - will sync when you're back online`, "info");
      } else {
        addToast(`${data.name} added to your items`, "success");
      }
    },
    onError: (err, payload, context) => {
      if (context?.previous) queryClient.setQueryData(["items"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  });
}

export function useUpdateItem() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useToast();

  return useMutation({
    mutationFn: ({ id, ...payload }) => {
      if (!navigator.onLine) {
        return enqueueMutation({ path: `/items/${id}`, method: "PATCH", body: payload });
      }
      return apiFetch(`/items/${id}`, { method: "PATCH", body: payload, getToken });
    },
    onSuccess: () => {
      addToast(navigator.onLine ? "Item updated" : "Changes saved offline - will sync when you're back online", navigator.onLine ? "success" : "info");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  });
}

/**
 * useArchiveItem
 * "Delete" in the UI, but the backend soft-deletes (is_active = FALSE) so
 * past sale_items keep a valid item_id - see routes/items.js.
 */
export function useArchiveItem() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useToast();

  return useMutation({
    mutationFn: (id) => {
      if (!navigator.onLine) {
        return enqueueMutation({ path: `/items/${id}`, method: "DELETE" });
      }
      return apiFetch(`/items/${id}`, { method: "DELETE", getToken });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["items"] });
      const previous = queryClient.getQueryData(["items"]) || [];
      queryClient.setQueryData(
        ["items"],
        previous.filter((i) => i.id !== id)
      );
      return { previous };
    },
    onSuccess: () => addToast("Item removed", "success"),
    onError: (err, id, context) => {
      if (context?.previous) queryClient.setQueryData(["items"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  });
}
