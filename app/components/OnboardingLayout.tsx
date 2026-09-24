"use client";

import { ReactNode } from "react";
import Navbar from "./Navbar";

interface OnboardingLayoutProps {
  children: ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 relative overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="bg-mesh-glow" />
      <div className="fixed inset-0 bg-grid-tech pointer-events-none opacity-40 z-0" />

      <Navbar />

      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
}
