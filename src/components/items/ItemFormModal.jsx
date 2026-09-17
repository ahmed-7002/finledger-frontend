import React, { useState } from "react";
import { useAddItem, useUpdateItem } from "../../hooks/useItems.js";

export default function ItemFormModal({ item, onClose }) {
  const isEditing = Boolean(item);
  const [name, setName] = useState(item?.name || "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [error, setError] = useState(null);

  const addItem = useAddItem();
  const updateItem = useUpdateItem();
  const isPending = addItem.isPending || updateItem.isPending;

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const numericPrice = Number(price);

    if (!trimmedName) {
      setError("Item name is required");
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError("Enter a valid price (0 or more)");
      return;
    }

    if (isEditing) {
      updateItem.mutate(
        { id: item.id, name: trimmedName, price: numericPrice },
        { onSuccess: onClose }
      );
    } else {
      addItem.mutate({ name: trimmedName, price: numericPrice }, { onSuccess: onClose });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-surface-container-lowest w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-xl font-semibold text-primary">
            {isEditing ? "Edit Item" : "Add Item"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-container-low">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-primary/70 mb-1">Item name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-primary-fixed/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. Milk 1L"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-primary/70 mb-1">Price</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              className="w-full border border-primary-fixed/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="0.00"
            />
          </div>

          {error && <p className="text-xs text-error">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary text-on-primary rounded-xl py-3 font-medium text-sm active:scale-[0.98] transition disabled:opacity-60"
          >
            {isPending ? "Saving..." : isEditing ? "Save Changes" : "Add Item"}
          </button>
        </form>
      </div>
    </div>
  );
}
