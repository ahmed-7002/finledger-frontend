import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClientProvider } from "@tanstack/react-query";

import App from "./App.jsx";
import { queryClient } from "./lib/queryClient.js";
import { initOfflineSync } from "./lib/offlineQueue.js";
import { ToastProvider } from "./components/common/ToastProvider.jsx";
import "./index.css";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn(
    "[main] VITE_CLERK_PUBLISHABLE_KEY is missing - copy frontend/.env.example to .env and add your Clerk key."
  );
}

// Wires up the window 'online' listener that flushes any queued offline
// mutations sequentially against the backend once connectivity returns.
initOfflineSync(queryClient);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </ClerkProvider>
  </React.StrictMode>
);
