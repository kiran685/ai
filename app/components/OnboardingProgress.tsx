"use client";

import { LucideIcon } from "lucide-react";

interface OnboardingProgressProps {
  step: number;
  totalSteps: number;
  label: string;
  icon: LucideIcon;
}

export default function OnboardingProgress({
  step,
  totalSteps,
  label,
  icon: Icon,
}: OnboardingProgressProps) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2.5">
        <span className="text-indigo-400 font-semibold flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </span>
        <span>Step {step} of {totalSteps}</span>
      </div>

      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <div
            key={idx}
            className={`h-1 flex-1 rounded-full transition-all ${
              idx < step
                ? "bg-gradient-to-r from-indigo-500 to-cyan-400"
                : idx === step - 1
                ? "bg-gradient-to-r from-indigo-500 to-cyan-400 animate-pulse"
                : "bg-white/[0.08]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
