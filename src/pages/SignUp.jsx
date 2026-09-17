import React from "react";
import { SignUp } from "@clerk/clerk-react";
import AuthVisualPanel from "../components/common/AuthVisualPanel.jsx";

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full flex bg-background">
      <AuthVisualPanel />

      <div className="flex-1 flex items-center justify-center p-6">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          afterSignUpUrl="/"
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
