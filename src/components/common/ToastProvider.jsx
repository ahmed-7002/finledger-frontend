import React, { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

/**
 * ToastProvider
 * ----------------------------------------------------------------------
 * Wraps the whole app once (see main.jsx). Renders a fixed, bottom-center
 * stack of auto-dismissing confirmation toasts - "Customer added",
 * "Transaction recorded", "Saved offline", etc. - triggered from the data
 * hooks (useCustomers.js, useTransactions.js, ...) via useToast() below,
 * so every mutation gets a consistent confirmation regardless of which
 * component happens to call it.
 *
 * Each toast fades and slides in on mount, holds for `duration`, then
 * fades out before being removed from the DOM - no animation library
 * needed, just a `visible` flag toggled across two setTimeouts.
 * ----------------------------------------------------------------------
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 3000) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type, visible: false }]);

    // Trigger the enter transition on the next frame, after the toast has
    // actually mounted at opacity-0 - flipping the class in the same tick
    // it's added wouldn't animate.
    requestAnimationFrame(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: true } : t)));
    });

    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: false } : t)));
    }, duration - 300);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <ToastStack toasts={toasts} />
    </ToastContext.Provider>
  );
}

/**
 * useToast
 * Returns a function: addToast(message, type?, duration?). `type` is
 * "success" (default), "info" (used for offline-queued confirmations), or
 * "error". Call it from anywhere inside <ToastProvider> - including from
 * within other hooks, since hooks can call hooks.
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider>");
  }
  return ctx;
}

const TOAST_STYLES = {
  success: { bg: "bg-primary-fixed", text: "text-primary", icon: "check_circle" },
  info: { bg: "bg-primary", text: "text-on-primary", icon: "cloud_off" },
  error: { bg: "bg-error", text: "text-on-primary", icon: "error" },
};

function ToastStack({ toasts }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-stretch w-[calc(100%-2rem)] max-w-sm px-0 pointer-events-none">
      {toasts.map((t) => {
        const style = TOAST_STYLES[t.type] || TOAST_STYLES.success;
        return (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 ${
              style.bg
            } ${style.text} ${
              t.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <span className="material-symbols-outlined text-base shrink-0">{style.icon}</span>
            <span className="truncate">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
