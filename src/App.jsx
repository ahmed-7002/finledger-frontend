import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

import LoadingSpinner from "./components/common/LoadingSpinner.jsx";
import DashboardLayout from "./components/layout/DashboardLayout.jsx";

// Route-based code splitting - each page ships as its own chunk so the
// initial bundle stays small and the app opens instantly.
const SignInPage = lazy(() => import("./pages/SignIn.jsx"));
const SignUpPage = lazy(() => import("./pages/SignUp.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Transactions = lazy(() => import("./pages/Transactions.jsx"));
const NewSale = lazy(() => import("./pages/NewSale.jsx"));
const SalesHistory = lazy(() => import("./pages/SalesHistory.jsx"));
const Items = lazy(() => import("./pages/Items.jsx"));
// Public, unauthenticated page - a customer with no Clerk account opens
// this from a WhatsApp link. Must stay OUTSIDE ProtectedLayout/SignedIn.
const SharedLedger = lazy(() => import("./pages/SharedLedger.jsx"));

function ProtectedLayout({ children }) {
  return (
    <>
      <SignedIn>
        <DashboardLayout>{children}</DashboardLayout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        {/* Public route - no auth check at all, reachable by anyone with
            the link. See backend/src/routes/public.js for what data it
            can actually return (scoped to one customer via share_token). */}
        <Route path="/share/:token" element={<SharedLedger />} />
        <Route
          path="/"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedLayout>
              <Transactions />
            </ProtectedLayout>
          }
        />
        <Route
          path="/new-sale"
          element={
            <ProtectedLayout>
              <NewSale />
            </ProtectedLayout>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedLayout>
              <SalesHistory />
            </ProtectedLayout>
          }
        />
        <Route
          path="/items"
          element={
            <ProtectedLayout>
              <Items />
            </ProtectedLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
