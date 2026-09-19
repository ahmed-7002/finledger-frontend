import React, { Suspense, lazy, useMemo, useState } from "react";
import { useCustomers } from "../hooks/useCustomers.js";
import { useTenant, useSubscription } from "../hooks/useTenant.js";
import { CUSTOMER_LIMIT } from "../lib/plan.js";
import { matchesCustomerSearch } from "../lib/customerSearch.js";
import CustomerCard from "../components/customers/CustomerCard.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";

const AddCustomerModal = lazy(() => import("../components/customers/AddCustomerModal.jsx"));
const BuyStorageModal = lazy(() => import("../components/common/BuyStorageModal.jsx"));

export default function Transactions() {
  const { data: customers, isLoading } = useCustomers();
  const { data: tenant } = useTenant();
  const { hasActiveSubscription, isExpired, subscriptionPeriodEnd } = useSubscription();

  const [search, setSearch] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [paywallReason, setPaywallReason] = useState(null); // null | payload from a 402/409 response

  const customerCount = customers?.length ?? 0;
  const limitReached = customerCount >= CUSTOMER_LIMIT;

  const filtered = useMemo(() => {
    if (!customers) return [];
    if (!search.trim()) return customers;
    return customers.filter((c) => matchesCustomerSearch(c, search));
  }, [customers, search]);

  function handleAddCustomerClick() {
    if (!hasActiveSubscription) {
      setPaywallReason({ error: isExpired ? "subscription_expired" : "subscription_required" });
    } else if (limitReached) {
      setPaywallReason({ error: "customer_limit_reached", currentCount: customerCount });
    } else {
      setShowAddCustomer(true);
    }
  }

  if (isLoading) return <LoadingSpinner label="Loading transactions..." />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-headline text-2xl font-semibold text-primary">Transactions</h2>
          <p className="text-sm text-primary/60">Tap a customer to record or review activity</p>
        </div>
        <button
          onClick={handleAddCustomerClick}
          className="flex items-center justify-center gap-1.5 bg-primary text-on-primary text-sm font-medium px-4 py-2.5 rounded-xl shrink-0 active:scale-[0.97] transition"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          Add New Customer
        </button>
      </div>

      <div className="relative mb-5">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 text-lg">
          search
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary-fixed/50 bg-surface-container-lowest text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest border border-primary-fixed/30 rounded-2xl p-8 text-center text-sm text-primary/60">
          No customers found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} tenant={tenant} />
          ))}
        </div>
      )}

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