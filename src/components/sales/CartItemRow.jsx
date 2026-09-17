import React from "react";
import { formatCurrency } from "../../lib/currency.js";

export default function CartItemRow({ line, localeOpts, onQuantityChange, onRemove }) {
  const lineTotal = line.unitPrice * line.quantity;

  return (
    <div className="flex items-center justify-between gap-3 bg-surface-container-lowest border border-primary-fixed/30 rounded-xl px-3.5 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-primary truncate">{line.name}</p>
        <p className="text-xs text-primary/50">
          {formatCurrency(line.unitPrice, localeOpts)} each
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onQuantityChange(Math.max(line.quantity - 1, 0))}
          className="h-7 w-7 flex items-center justify-center rounded-full border border-primary-fixed/50 text-primary"
          aria-label="Decrease quantity"
        >
          <span className="material-symbols-outlined text-[16px]">remove</span>
        </button>
        <span className="w-6 text-center text-sm font-medium text-primary">{line.quantity}</span>
        <button
          onClick={() => onQuantityChange(line.quantity + 1)}
          className="h-7 w-7 flex items-center justify-center rounded-full border border-primary-fixed/50 text-primary"
          aria-label="Increase quantity"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
        </button>
      </div>

      <div className="text-right shrink-0 w-20">
        <p className="text-sm font-semibold text-primary">{formatCurrency(lineTotal, localeOpts)}</p>
      </div>

      <button
        onClick={onRemove}
        className="p-1 text-error/70 shrink-0"
        aria-label={`Remove ${line.name}`}
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}
