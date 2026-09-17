import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useItems } from "../hooks/useItems.js";
import { useTenant, useSubscription } from "../hooks/useTenant.js";
import { useCreateSale } from "../hooks/useSales.js";
import { formatCurrency } from "../lib/currency.js";
import CartItemRow from "../components/sales/CartItemRow.jsx";
import CustomerPicker from "../components/sales/CustomerPicker.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";

const BuyStorageModal = lazy(() => import("../components/common/BuyStorageModal.jsx"));

export default function NewSale() {
  const { data: items, isLoading: itemsLoading } = useItems();
  const { data: tenant } = useTenant();
  const { hasActiveSubscription, isExpired, subscriptionPeriodEnd } = useSubscription();
  const createSale = useCreateSale();

  const [itemSearch, setItemSearch] = useState("");
  const [cart, setCart] = useState([]); // [{ key, itemId, name, unitPrice, quantity }]
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const [amountPaid, setAmountPaid] = useState("");
  const [amountPaidTouched, setAmountPaidTouched] = useState(false);
  const [customerSelection, setCustomerSelection] = useState({ customerId: null, newCustomer: null });
  const [error, setError] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const localeOpts = { currencyCode: tenant?.currency_code, countryCode: tenant?.country_code };

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart]
  );

  const numericAmountPaid = Number(amountPaid) || 0;
  const pending = Math.max(total - numericAmountPaid, 0);
  const fullyPaid = pending <= 0 && total > 0;

  // Keep "amount paid" following the running total (assume full payment by
  // default) until the owner manually edits it - then leave their number
  // alone even if the cart changes further.
  useEffect(() => {
    if (!amountPaidTouched) {
      setAmountPaid(total > 0 ? String(total) : "");
    }
  }, [total, amountPaidTouched]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (!itemSearch.trim()) return items;
    const q = itemSearch.trim().toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, itemSearch]);

  function addItemToCart(item) {
    setCart((prev) => {
      const existing = prev.find((l) => l.itemId === item.id);
      if (existing) {
        return prev.map((l) => (l.itemId === item.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        { key: crypto.randomUUID(), itemId: item.id, name: item.name, unitPrice: Number(item.price), quantity: 1 },
      ];
    });
  }

  function addCustomItem() {
    const price = Number(customPrice);
    if (!customName.trim()) {
      setError("Enter a name for the custom item");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid price");
      return;
    }
    setError(null);
    setCart((prev) => [
      ...prev,
      { key: crypto.randomUUID(), itemId: null, name: customName.trim(), unitPrice: price, quantity: 1 },
    ]);
    setCustomName("");
    setCustomPrice("");
    setShowCustomItemForm(false);
  }

  function updateQuantity(key, quantity) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((l) => l.key !== key));
      return;
    }
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, quantity } : l)));
  }

  function removeLine(key) {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }

  function resetForm() {
    setCart([]);
    setAmountPaid("");
    setAmountPaidTouched(false);
    setCustomerSelection({ customerId: null, newCustomer: null });
    setItemSearch("");
  }

  function handleCompleteSale() {
    setError(null);

    if (cart.length === 0) {
      setError("Add at least one item to the cart");
      return;
    }
    if (numericAmountPaid > total) {
      setError("Amount received can't be more than the total");
      return;
    }
    if (pending > 0 && !customerSelection.customerId && !customerSelection.newCustomer) {
      setError("Select or add a customer for the pending balance");
      return;
    }

    if (!hasActiveSubscription) {
      setShowPaywall(true);
      return;
    }

    const customerNameForToast = customerSelection.newCustomer?.name;

    createSale.mutate(
      {
        items: cart.map((l) => ({ itemId: l.itemId, name: l.name, unitPrice: l.unitPrice, quantity: l.quantity })),
        amountPaid: numericAmountPaid,
        customerId: customerSelection.customerId,
        newCustomer: customerSelection.newCustomer,
        customerNameForToast,
      },
      {
        onSuccess: resetForm,
        onError: (err) => {
          if (err.status === 402) {
            setShowPaywall(true);
          } else {
            setError(err.message || "Something went wrong recording the sale");
          }
        },
      }
    );
  }

  if (itemsLoading) return <LoadingSpinner label="Loading your items..." />;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-headline text-2xl font-semibold text-primary">New Sale</h2>
          <p className="text-sm text-primary/60">Ring up items, then record what was paid</p>
        </div>
        <Link to="/items" className="text-xs text-primary/60 underline underline-offset-2 shrink-0">
          Manage Items
        </Link>
      </div>

      {/* Item picker */}
      <div className="relative mb-3">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 text-lg">
          search
        </span>
        <input
          value={itemSearch}
          onChange={(e) => setItemSearch(e.target.value)}
          placeholder="Search your items"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary-fixed/50 bg-surface-container-lowest text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => addItemToCart(item)}
            className="flex items-center gap-1.5 border border-primary-fixed/50 rounded-xl px-3.5 py-2 text-sm text-primary bg-surface-container-lowest active:scale-[0.97] transition"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            {item.name} - {formatCurrency(item.price, localeOpts)}
          </button>
        ))}
        <button
          onClick={() => setShowCustomItemForm((v) => !v)}
          className="flex items-center gap-1.5 border border-dashed border-primary-fixed/60 rounded-xl px-3.5 py-2 text-sm text-primary/70"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Custom item
        </button>
      </div>

      {showCustomItemForm && (
        <div className="bg-surface-container-low rounded-xl p-3 mb-4 flex flex-col sm:flex-row gap-2">
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Item name"
            className="flex-1 border border-primary-fixed/50 rounded-lg px-3 py-2.5 text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
            placeholder="Price"
            inputMode="decimal"
            className="sm:w-28 border border-primary-fixed/50 rounded-lg px-3 py-2.5 text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={addCustomItem}
            className="bg-primary text-on-primary rounded-lg px-4 py-2.5 text-sm font-medium shrink-0"
          >
            Add
          </button>
        </div>
      )}

      {/* Cart */}
      {cart.length === 0 ? (
        <div className="bg-surface-container-lowest border border-primary-fixed/30 rounded-2xl p-8 text-center text-sm text-primary/60 mb-4">
          Your cart is empty - tap an item above to get started.
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {cart.map((line) => (
            <CartItemRow
              key={line.key}
              line={line}
              localeOpts={localeOpts}
              onQuantityChange={(q) => updateQuantity(line.key, q)}
              onRemove={() => removeLine(line.key)}
            />
          ))}
        </div>
      )}

      {/* Payment */}
      <div className="bg-surface-container-lowest border border-primary-fixed/30 rounded-2xl p-4 sm:p-5 mb-4">
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-primary/70">Total</span>
          <span className="font-headline text-lg font-semibold text-primary">
            {formatCurrency(total, localeOpts)}
          </span>
        </div>

        <label className="block text-xs font-medium text-primary/70 mb-1">Amount received</label>
        <input
          value={amountPaid}
          onChange={(e) => {
            setAmountPaidTouched(true);
            setAmountPaid(e.target.value);
          }}
          inputMode="decimal"
          className="w-full border border-primary-fixed/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="0.00"
        />

        <div className="flex items-center justify-between text-sm mt-3">
          <span className="text-primary/70">{fullyPaid ? "Fully paid" : "Balance owing"}</span>
          <span className={`font-semibold ${fullyPaid ? "text-primary" : "text-error"}`}>
            {formatCurrency(pending, localeOpts)}
          </span>
        </div>
      </div>

      {/* Customer - only asked for when something's owed */}
      {pending > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-primary/70 mb-2">Who's this balance for?</p>
          <CustomerPicker tenant={tenant} onChange={setCustomerSelection} />
        </div>
      )}

      {error && <p className="text-sm text-error mb-3">{error}</p>}

      <button
        onClick={handleCompleteSale}
        disabled={createSale.isPending}
        className="w-full bg-primary text-on-primary rounded-xl py-3.5 font-medium text-sm active:scale-[0.98] transition disabled:opacity-60"
      >
        {createSale.isPending ? "Recording sale..." : "Complete Sale"}
      </button>

      <Suspense fallback={null}>
        {showPaywall && (
          <BuyStorageModal
            onClose={() => setShowPaywall(false)}
            isExpired={isExpired}
            subscriptionPeriodEnd={subscriptionPeriodEnd}
          />
        )}
      </Suspense>
    </div>
  );
}
