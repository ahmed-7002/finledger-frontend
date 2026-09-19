import React, { Suspense, lazy, useState } from "react";
import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";
import LoadingSpinner from "../common/LoadingSpinner.jsx";
import RenewalReminderBanner from "../common/RenewalReminderBanner.jsx";
import { useOnlineStatus } from "../../hooks/useOnlineStatus.js";
import { useTenant } from "../../hooks/useTenant.js";

// Heavy, rarely-shown components - lazy loaded so they never cost anything
// on the fast path.
const LocationOnboardingModal = lazy(() =>
  import("../onboarding/LocationOnboardingModal.jsx")
);
const BuyStorageModal = lazy(() => import("../common/BuyStorageModal.jsx"));
const SettingsModal = lazy(() => import("../common/SettingsModal.jsx"));
const NotificationsModal = lazy(() => import("../common/NotificationsModal.jsx"));

export default function DashboardLayout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const isOnline = useOnlineStatus();
  const { data: tenant, isLoading } = useTenant();

  const needsOnboarding = !isLoading && tenant && !tenant.location_captured_at;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar drawerOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onMenuClick={() => setDrawerOpen(true)}
          onSettingsClick={() => setShowSettingsModal(true)}
          onNotificationsClick={() => setShowNotificationsModal(true)}
          isOnline={isOnline}
        />

        {!isOnline && (
          <div className="bg-error-container text-error text-sm text-center py-1.5 px-4">
            You're offline. Changes will sync automatically once you're back online.
          </div>
        )}

        {/* Proactive "renew before it lapses" nudge - separate from the
            reactive paywall shown once access has actually run out. */}
        <RenewalReminderBanner onRenewClick={() => setShowRenewModal(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      <Suspense fallback={null}>
        {needsOnboarding && <LocationOnboardingModal />}
        {showRenewModal && (
          <BuyStorageModal
            onClose={() => setShowRenewModal(false)}
            isExpired={false}
            subscriptionPeriodEnd={tenant?.subscription_period_end}
          />
        )}
        {showSettingsModal && (
          <SettingsModal tenant={tenant} onClose={() => setShowSettingsModal(false)} />
        )}
        {showNotificationsModal && (
          <NotificationsModal tenant={tenant} onClose={() => setShowNotificationsModal(false)} />
        )}
      </Suspense>
    </div>
  );
}