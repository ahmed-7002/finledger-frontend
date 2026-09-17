import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../lib/api.js";
import { useToast } from "../components/common/ToastProvider.jsx";

export function useTenant() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["tenant"],
    queryFn: () => apiFetch("/tenant/me", { getToken }),
    enabled: isLoaded && isSignedIn,
    staleTime: 5 * 60 * 1000, // profile/locale rarely changes; cache for 5 minutes
  });
}

export function useOnboardTenant() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useToast();

  return useMutation({
    mutationFn: (data) => apiFetch("/tenant/onboarding", { method: "POST", body: data, getToken }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["tenant"], updated);
      addToast("Setup complete - your shop is ready to go", "success");
    },
  });
}

/**
 * useUpdateTenantSettings
 * ----------------------------------------------------------------------
 * Lets the owner edit shop name / bank name / account holder name /
 * account number at any time from the new Settings screen (not just once
 * during onboarding). These are exactly the fields that get auto-filled
 * into the WhatsApp payment reminder message built in CustomerCard.jsx, so
 * saving here changes what future reminders say immediately. Not queued
 * offline: this is a low-frequency settings change, not something that
 * needs to work mid-checkout while offline the way customer/transaction
 * writes do.
 * ----------------------------------------------------------------------
 */
export function useUpdateTenantSettings() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useToast();

  return useMutation({
    mutationFn: (data) => apiFetch("/tenant/settings", { method: "PATCH", body: data, getToken }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["tenant"], updated);
      addToast("Settings updated", "success");
    },
  });
}

/**
 * useSubscription
 * ----------------------------------------------------------------------
 * Convenience derived hook used to gate the paywall in the UI. Mirrors the
 * backend's requireSubscription logic: a subscription is only "active" if
 * has_active_subscription is TRUE *and* subscription_period_end is either
 * absent (no expiry) or still in the future. This is recomputed on every
 * render, so a lapsed monthly plan is reflected the moment tenant data
 * refetches - no separate "expired" flag needs to be pushed from the
 * backend.
 *
 * This never affects `customers` / `transactions` query data - lapsing
 * only flips this derived boolean, which the "Add New Customer" button
 * checks. Everything the shop owner already recorded stays fully visible.
 * ----------------------------------------------------------------------
 */
export function useSubscription() {
  const { data: tenant, isLoading } = useTenant();

  const periodEnd = tenant?.subscription_period_end;
  const notExpired = !periodEnd || new Date(periodEnd) > new Date();
  const hasActiveSubscription = Boolean(tenant?.has_active_subscription) && notExpired;
  const isExpired = Boolean(tenant?.has_active_subscription) && !notExpired;

  return {
    isLoading,
    hasActiveSubscription,
    isExpired,
    subscriptionPeriodEnd: periodEnd ?? null,
  };
}
