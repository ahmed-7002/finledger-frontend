import React from "react";

export default function TopBar({ onMenuClick, onSettingsClick, isOnline }) {
  return (
    <header className="sticky top-0 z-30 bg-surface-container-lowest border-b border-primary-fixed/30 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-full hover:bg-surface-container-low"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="font-headline text-lg sm:text-xl font-semibold text-primary">FinLedger</h1>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            isOnline ? "bg-primary-fixed text-primary" : "bg-error-container text-error"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-primary" : "bg-error"}`}
          />
          {isOnline ? "Online" : "Offline"}
        </span>

        <button
          onClick={onSettingsClick}
          className="p-2 rounded-full hover:bg-surface-container-low text-primary/70"
          aria-label="Settings"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>
      </div>
    </header>
  );
}
