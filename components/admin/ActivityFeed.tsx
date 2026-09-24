"use client";

import React, { useState, useEffect } from "react";
import { Activity, RefreshCw, Clock, ArrowRight, UserCheck, Play, CheckCircle2 } from "lucide-react";

export interface RecentEvent {
  eventId: string;
  eventName: string;
  variant: "v2" | "control";
  step?: number | null;
  stepName?: string | null;
  occurredAt: string;
  userId?: string | null;
  anonymousId?: string | null;
}

export interface ActivityFeedProps {
  events: RecentEvent[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  events,
  onRefresh,
  isRefreshing = false,
}) => {
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Auto-refresh timer (30 seconds)
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;

    const interval = setInterval(() => {
      onRefresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  // Relative time helper
  const getRelativeTime = (isoString: string): string => {
    try {
      const now = Date.now();
      const past = new Date(isoString).getTime();
      const diffSec = Math.floor((now - past) / 1000);

      if (diffSec < 10) return "Just now";
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}h ago`;
      const diffDays = Math.floor(diffHour / 24);
      return `${diffDays}d ago`;
    } catch {
      return "Recently";
    }
  };

  // Format event name for display
  const formatEventBadge = (name: string) => {
    switch (name) {
      case "onboarding_started":
        return {
          label: "Started Onboarding",
          color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          icon: Play,
        };
      case "onboarding_step_completed":
        return {
          label: "Step Completed",
          color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
          icon: ArrowRight,
        };
      case "onboarding_completed":
        return {
          label: "Roadmap Launched",
          color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          icon: CheckCircle2,
        };
      case "onboarding_abandoned":
        return {
          label: "Session Abandoned",
          color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          icon: Clock,
        };
      case "email_link_clicked":
        return {
          label: "Email Link Clicked",
          color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          icon: UserCheck,
        };
      default:
        return {
          label: name.replace(/_/g, " "),
          color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
          icon: Activity,
        };
    }
  };

  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-white">Live Telemetry Activity</h3>
          <span className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/5 rounded">
            Last 50
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
              autoRefresh
                ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                : "bg-white/5 text-slate-400 border-white/10"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                autoRefresh ? "bg-emerald-400 animate-ping" : "bg-slate-500"
              }`}
            />
            <span>Auto (30s)</span>
          </button>

          {/* Manual Refresh */}
          {onRefresh && (
            <button
              type="button"
              onClick={() => onRefresh()}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Activity"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
        {events.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">
            No telemetry events recorded in the selected window.
          </div>
        ) : (
          events.map((evt) => {
            const badge = formatEventBadge(evt.eventName);
            const Icon = badge.icon;

            return (
              <div
                key={evt.eventId}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition-all text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${badge.color}`}
                  >
                    <Icon className="w-3 h-3 flex-shrink-0" />
                    <span>{badge.label}</span>
                  </div>

                  {evt.step !== null && evt.step !== undefined && (
                    <span className="text-slate-400 font-mono text-[11px]">
                      Step {evt.step}
                      {evt.stepName ? `: ${evt.stepName}` : ""}
                    </span>
                  )}

                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold uppercase ${
                      evt.variant === "v2"
                        ? "bg-indigo-500/20 text-indigo-300"
                        : "bg-slate-700/50 text-slate-300"
                    }`}
                  >
                    {evt.variant}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-slate-400 text-[11px] flex-shrink-0">
                  <span>{evt.userId || evt.anonymousId || "anon"}</span>
                  <span className="text-slate-500">
                    {getRelativeTime(evt.occurredAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
