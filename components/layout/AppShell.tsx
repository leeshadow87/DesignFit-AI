"use client";

import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--df-bg)] text-[var(--df-ink)] lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <Sidebar />
      <main className="min-w-0">{children}</main>
    </div>
  );
}
