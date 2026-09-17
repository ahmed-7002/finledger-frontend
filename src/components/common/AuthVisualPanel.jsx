import React from "react";

export default function AuthVisualPanel() {
  return (
    <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-primary text-on-primary flex-col justify-between p-12 relative overflow-hidden">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-container/40" />
      <div className="absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-primary-fixed/10" />

      <div className="relative z-10 flex items-center gap-2">
        <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
        <span className="font-headline text-xl font-semibold">Khaatabook</span>
      </div>

      <div className="relative z-10 max-w-md">
        <h1 className="font-headline text-4xl font-semibold leading-tight mb-4">
          Your entire udhaar khaata, digitized.
        </h1>
        <p className="text-on-primary/80 text-base leading-relaxed">
          Track customer credit, record cash settlements, and send payment reminders
          on WhatsApp - all from your phone, even without internet.
        </p>
      </div>

      <p className="relative z-10 text-xs text-on-primary/60">
        Built for shop owners. Trusted by thousands.
      </p>
    </div>
  );
}
