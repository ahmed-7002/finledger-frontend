import React, { useMemo, useState } from "react";
import { useCustomers } from "../../hooks/useCustomers.js";
import { validateName, validatePhone } from "../../lib/validation.js";

/**
 * CustomerPicker
 * ----------------------------------------------------------------------
 * Shown only when a sale isn't fully paid - searches the owner's own
 * customer list by name or phone (reusing the same search-by-name-or-phone
 * pattern already used on the Transactions page, since that's how an owner
 * actually identifies someone: by face and name, not a phone number they
 * have memorized), with a fallback to create a brand-new customer inline
 * if nothing matches.
 *
 * Reports back to the parent via onChange({ customerId, newCustomer }) - 
 * exactly one of those two is ever set, matching what the backend expects.
 * ----------------------------------------------------------------------
 */
export default function CustomerPicker({ tenant, onChange }) {
  const { data: customers } = useCustomers();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null); // existing customer object
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [errors, setErrors] = useState({});

  const countryCode = tenant?.country_code;

  const results = useMemo(() => {
    if (!search.trim() || selected) return [];
    const q = search.trim().toLowerCase();
    return (customers || [])
      .filter((c) => c.name.toLowerCase().includes(q) || (c.phone || "").includes(q))
      .slice(0, 6);
  }, [customers, search, selected]);

  function selectCustomer(customer) {
    setSelected(customer);
    setSearch(customer.name);
    setCreatingNew(false);
    onChange({ customerId: customer.id, newCustomer: null });
  }

  function clearSelection() {
    setSelected(null);
    setSearch("");
    setCreatingNew(false);
    setNewName("");
    setNewPhone("");
    onChange({ customerId: null, newCustomer: null });
  }

  function startCreatingNew() {
    setCreatingNew(true);
    setNewName(search); // carry over whatever they were searching for
    onChange({ customerId: null, newCustomer: null });
  }

  function handleNewCustomerFieldChange(field, value) {
    if (field === "name") setNewName(value);
    if (field === "phone") setNewPhone(value);

    const name = field === "name" ? value : newName;
    const phone = field === "phone" ? value : newPhone;

    const nameError = validateName(name);
    const { e164, error: phoneError } = validatePhone(phone, countryCode);
    setErrors({ name: nameError, phone: phoneError });

    if (!nameError && !phoneError) {
      onChange({ customerId: null, newCustomer: { name: name.trim(), phone: e164 } });
    } else {
      onChange({ customerId: null, newCustomer: null });
    }
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 bg-surface-container-low rounded-xl px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary truncate">{selected.name}</p>
          <p className="text-xs text-primary/60 truncate">{selected.phone}</p>
        </div>
        <button
          onClick={clearSelection}
          className="text-xs text-primary/60 underline underline-offset-2 shrink-0"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
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

      {search.trim() && !creatingNew && (
        <div className="mt-2 border border-primary-fixed/30 rounded-xl overflow-hidden">
          {results.length > 0 ? (
            results.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCustomer(c)}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-surface-container-low border-b border-primary-fixed/10 last:border-0"
              >
                <span className="text-sm text-primary truncate">{c.name}</span>
                <span className="text-xs text-primary/50 shrink-0">{c.phone}</span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-primary/60">No customer found.</div>
          )}
          <button
            onClick={startCreatingNew}
            className="w-full flex items-center gap-1.5 px-4 py-2.5 text-left text-sm font-medium text-primary bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            Create new customer{search.trim() ? ` "${search.trim()}"` : ""}
          </button>
        </div>
      )}

      {creatingNew && (
        <div className="mt-3 bg-surface-container-low rounded-xl p-3 space-y-2.5">
          <input
            value={newName}
            onChange={(e) => handleNewCustomerFieldChange("name", e.target.value)}
            placeholder="Customer name"
            className="w-full border border-primary-fixed/50 rounded-lg px-3 py-2.5 text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.name && <p className="text-xs text-error">{errors.name}</p>}
          <input
            value={newPhone}
            onChange={(e) => handleNewCustomerFieldChange("phone", e.target.value)}
            placeholder="Phone number, e.g. +923001234567"
            inputMode="tel"
            className="w-full border border-primary-fixed/50 rounded-lg px-3 py-2.5 text-sm bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors.phone && <p className="text-xs text-error">{errors.phone}</p>}
          <button
            onClick={() => {
              setCreatingNew(false);
              setSearch("");
            }}
            className="text-xs text-primary/60 underline underline-offset-2"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
