import React from "react";
import { SignIn } from "@clerk/clerk-react";
import AuthVisualPanel from "../components/common/AuthVisualPanel.jsx";

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Visual panel - hidden on mobile, shown from md breakpoint up */}
      <AuthVisualPanel />

      <div className="flex-1 flex items-center justify-center p-6">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          afterSignInUrl="/"
          appearance={{
            variables: {
              colorPrimary: "#004532",
              colorText: "#004532",
              fontFamily: "Inter, sans-serif",
            },
            elements: {
              card: "shadow-none border border-primary-fixed/40 rounded-2xl",
              headerTitle: "font-headline",
            },
          }}
        />
      </div>
    </div>
  );
}
