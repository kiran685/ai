"use client";

import React, { useState } from "react";
import { Calendar, RefreshCw, AlertCircle } from "lucide-react";

export interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  isLoading?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  isLoading = false,
}) => {
  const [customStart, setCustomStart] = useState<string>(startDate);
  const [customEnd, setCustomEnd] = useState<string>(endDate);
  const [error, setError] = useState<string | null>(null);

  // Helper to format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const handlePreset = (days: number) => {
    setError(null);
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    const startStr = formatDate(start);
    const endStr = formatDate(end);
    setCustomStart(startStr);
    setCustomEnd(endStr);
    onChange(startStr, endStr);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const start = new Date(customStart);
    const end = new Date(customEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError("Please select valid dates");
      return;
    }

    if (end < start) {
      setError("End date must be greater than or equal to start date");
      return;
    }

    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 90) {
      setError("Date range cannot exceed 90 days");
      return;
    }

    onChange(customStart, customEnd);
  };

  // Determine active preset
  const isPresetActive = (days: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    return customStart === formatDate(start) && customEnd === formatDate(end);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl">
        {/* Preset Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {[
            { label: "Last 7 days", days: 7 },
            { label: "Last 14 days", days: 14 },
            { label: "Last 30 days", days: 30 },
          ].map((preset) => {
            const active = isPresetActive(preset.days);
            return (
              <button
                key={preset.days}
                type="button"
                onClick={() => handlePreset(preset.days)}
                disabled={isLoading}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  active
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom Date Form */}
        <form
          onSubmit={handleApplyCustom}
          className="flex flex-wrap items-center gap-2 text-xs"
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-300 focus-within:border-indigo-500/50">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-transparent text-slate-200 font-mono text-xs focus:outline-none cursor-pointer"
              aria-label="Start Date"
            />
            <span className="text-slate-500 font-mono">→</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-transparent text-slate-200 font-mono text-xs focus:outline-none cursor-pointer"
              aria-label="End Date"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-xs rounded-xl transition-all duration-200 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Apply</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
