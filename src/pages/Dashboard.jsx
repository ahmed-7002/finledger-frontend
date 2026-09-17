import React, { Suspense, lazy, useState } from "react";
import { useCustomers } from "../hooks/useCustomers.js";
import { useTenant, useSubscription } from "../hooks/useTenant.js";
import { CUSTOMER_LIMIT } from "../lib/plan.js";
import MetricsGrid from "../components/dashboard/MetricsGrid.jsx";
import RecentCustomersTable from "../components/dashboard/RecentCustomersTable.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";

// Modals are lazy-loaded - they're only needed on user interaction, so
// they shouldn't cost anything in the initial dashboard bundle.
const AddCustomerModal = lazy(() => import("../components/customers/AddCustomerModal.jsx"));
const BuyStorageModal = lazy(() => import("../components/common/BuyStorageModal.jsx"));

export default function Dashboard() {
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: tenant, isLoading: tenantLoading } = useTenant();
  const { hasActiveSubscription, isExpired, subscriptionPeriodEnd } = useSubscription();

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [paywallReason, setPaywallReason] = useState(null); // null | payload object from a 402/409 response

  const customerCount = customers?.length ?? 0;
  const limitReached = customerCount >= CUSTOMER_LIMIT;

  function handleAddCustomerClick() {
    if (!hasActiveSubscription) {
      setPaywallReason({ error: isExpired ? "subscription_expired" : "subscription_required" });
    } else if (limitReached) {
      setPaywallReason({ error: "customer_limit_reached", currentCount: customerCount });
    } else {
      setShowAddCustomer(true);
    }
  }

  if (customersLoading || tenantLoading) {
    return <LoadingSpinner label="Loading your dashboard..." />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="font-headline text-2xl font-semibold text-primary">
            {tenant?.shop_name || "Your Dashboard"}
          </h2>
          <p className="text-sm text-primary/60">Overview of your udhaar ledger</p>
        </div>
        <button
          onClick={handleAddCustomerClick}
          className="flex items-center gap-1.5 bg-primary text-on-primary text-sm font-medium px-4 py-2.5 rounded-xl shrink-0 active:scale-[0.97] transition"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          <span className="hidden sm:inline">Add New Customer</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      <MetricsGrid customers={customers} tenant={tenant} />

      <h3 className="font-headline text-lg font-semibold text-primary mb-3">Recent Customers</h3>
      <RecentCustomersTable customers={customers} tenant={tenant} />

      <Suspense fallback={null}>
        {showAddCustomer && (
          <AddCustomerModal
            tenant={tenant}
            onClose={() => setShowAddCustomer(false)}
            onSubscriptionRequired={(payload) => setPaywallReason(payload)}
          />
        )}
        {paywallReason && (
          <BuyStorageModal
            onClose={() => setPaywallReason(null)}
            isExpired={paywallReason.error === "subscription_expired"}
            isLimitReached={paywallReason.error === "customer_limit_reached"}
            subscriptionPeriodEnd={subscriptionPeriodEnd}
            currentCount={paywallReason.error === "customer_limit_reached" ? customerCount : null}
          />
        )}
      </Suspense>
    </div>
  );
}
