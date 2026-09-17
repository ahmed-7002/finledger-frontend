import React, { Suspense, lazy, useState } from "react";
import { Link } from "react-router-dom";
import { useItems, useArchiveItem } from "../hooks/useItems.js";
import { useTenant } from "../hooks/useTenant.js";
import { formatCurrency } from "../lib/currency.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";

const ItemFormModal = lazy(() => import("../components/items/ItemFormModal.jsx"));

export default function Items() {
  const { data: items, isLoading } = useItems();
  const { data: tenant } = useTenant();
  const archiveItem = useArchiveItem();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const localeOpts = { currencyCode: tenant?.currency_code, countryCode: tenant?.country_code };

  if (isLoading) return <LoadingSpinner label="Loading your items..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-3">
        <div>
          <h2 className="font-headline text-2xl font-semibold text-primary">Items</h2>
          <p className="text-sm text-primary/60">
            Your saved price list - pick from these during a sale, or add one-off items on the spot.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="flex items-center gap-1.5 bg-primary text-on-primary text-sm font-medium px-4 py-2.5 rounded-xl shrink-0 active:scale-[0.97] transition"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Add Item
        </button>
      </div>

      <Link to="/new-sale" className="text-xs text-primary/60 underline underline-offset-2">
        Go to New Sale ->
      </Link>

      <div className="mt-4 space-y-2">
        {(items || []).length === 0 && (
          <div className="bg-surface-container-lowest border border-primary-fixed/30 rounded-2xl p-8 text-center text-sm text-primary/60">
            No saved items yet. Add your first one, or just type items on the spot during a sale.
          </div>
        )}

        {(items || []).map((item) => (
          <div
            key={item.id}
            className="bg-surface-container-lowest border border-primary-fixed/30 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary truncate">{item.name}</p>
              <p className="text-xs text-primary/60">{formatCurrency(item.price, localeOpts)}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  setEditingItem(item);
                  setShowForm(true);
                }}
                className="p-2 rounded-full hover:bg-surface-container-low text-primary/70"
                aria-label={`Edit ${item.name}`}
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
              <button
                onClick={() => archiveItem.mutate(item.id)}
                disabled={archiveItem.isPending}
                className="p-2 rounded-full hover:bg-surface-container-low text-error disabled:opacity-50"
                aria-label={`Remove ${item.name}`}
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <Suspense fallback={null}>
        {showForm && (
          <ItemFormModal
            item={editingItem}
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
