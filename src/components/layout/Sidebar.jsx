import React from "react";
import { NavLink } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "grid_view" },
  { to: "/transactions", label: "Transactions", icon: "receipt_long" },
  { to: "/new-sale", label: "New Sale", icon: "point_of_sale" },
  { to: "/sales", label: "Sales History", icon: "monitoring" },
];

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1 mt-6">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary-fixed text-primary"
                : "text-on-primary/85 hover:bg-primary-container/60"
            }`
          }
        >
          <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Sidebar({ drawerOpen, onClose }) {
  return (
    <>
      {/* Permanent desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-primary text-on-primary px-4 py-6 shrink-0">
        <div className="flex items-center gap-2 px-2">
          <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          <span className="font-headline text-lg font-semibold">FinLedger</span>
        </div>
        <NavItems />
        <div className="mt-auto flex items-center gap-2 px-2 pt-6 border-t border-on-primary/10">
          <UserButton afterSignOutUrl="/sign-in" />
          <span className="text-xs text-on-primary/70">Account</span>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-primary text-on-primary px-4 py-6 flex flex-col">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                <span className="font-headline text-lg font-semibold">FinLedger</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-full hover:bg-primary-container/60"
                aria-label="Close menu"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <NavItems onNavigate={onClose} />
            <div className="mt-auto flex items-center gap-2 px-2 pt-6 border-t border-on-primary/10">
              <UserButton afterSignOutUrl="/sign-in" />
              <span className="text-xs text-on-primary/70">Account</span>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
