import React from "react";

export default function LoadingSpinner({ fullScreen = false, label = "Loading..." }) {
  return (
    <div
      className={
        fullScreen
          ? "min-h-screen w-full flex flex-col items-center justify-center gap-3 bg-background"
          : "flex flex-col items-center justify-center gap-3 py-10"
      }
    >
      <div className="h-9 w-9 rounded-full border-4 border-primary-fixed border-t-primary animate-spin" />
      <p className="text-sm text-primary/70">{label}</p>
    </div>
  );
}
