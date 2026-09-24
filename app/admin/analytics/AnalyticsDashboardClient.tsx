"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  TrendingUp,
  Percent,
  CalendarCheck,
  Mail,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { DateRangePicker } from "@/components/admin/DateRangePicker";
import { FunnelChart, FunnelData } from "@/components/admin/FunnelChart";
import { DropOffTable, DropOffByStep } from "@/components/admin/DropOffTable";
import { ActivityFeed, RecentEvent } from "@/components/admin/ActivityFeed";

export interface AnalyticsResponse {
  startDate: string;
  endDate: string;
  totalUsers: number;
  v2Users: number;
  controlUsers: number;
  funnel: {
    v2: FunnelData;
    control: FunnelData;
  };
  dropOffByStep: {
    v2: DropOffByStep;
    control: DropOffByStep;
  };
  medianTimeToComplete: {
    v2: number;
    control: number;
  };
  day7Retention: {
    v2: number;
    control: number;
  };
  emailMetrics: {
    sent: number;
    clicks: number;
    clickThroughRate: number;
  };
  recentEvents: RecentEvent[];
}

export function AnalyticsDashboardClient({ userEmail }: { userEmail: string }) {
  // Default range: last 14 days
  const getInitialDates = () => {
    const end = new Date();
    const start = new Date(end.getTime() - 14 * 24 * 60 * 60 * 1000);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };

  const initial = getInitialDates();
  const [startDate, setStartDate] = useState<string>(initial.start);
  const [endDate, setEndDate] = useState<string>(initial.end);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(
    async (sDate = startDate, eDate = endDate) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/analytics/onboarding?startDate=${encodeURIComponent(
            sDate
          )}&endDate=${encodeURIComponent(eDate)}`
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP Error ${res.status}`);
        }

        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Failed to load onboarding analytics telemetry.");
      } finally {
        setIsLoading(false);
      }
    },
    [startDate, endDate]
  );

  useEffect(() => {
    fetchAnalytics(startDate, endDate);
  }, [fetchAnalytics, startDate, endDate]);

  const handleDateChange = (newStart: string, newEnd: string) => {
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  // Metric comparisons
  const v2Completion = data?.funnel.v2.completionRate || 0;
  const controlCompletion = data?.funnel.control.completionRate || 0;
  const completionDelta = Number((v2Completion - controlCompletion).toFixed(1));

  const v2Retention = data?.day7Retention.v2 || 0;
  const controlRetention = data?.day7Retention.control || 0;
  const retentionDelta = Number((v2Retention - controlRetention).toFixed(1));

  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Telemetry
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Admin: <span className="font-mono text-slate-300">{userEmail}</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Onboarding Funnel & Retention
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Evaluating A/B experiment conversion, step drop-offs, and Day-7 retention for Week 6 MVP launch
            </p>
          </div>

          {/* Date Picker Controls */}
          <div className="w-full md:w-auto">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: High-Level Metric Cards (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Users */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">
                Total Evaluated Users
              </span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-black font-mono text-white">
              {data ? data.totalUsers.toLocaleString() : "..."}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-400 border-t border-white/5 pt-2">
              <span>
                v2: <strong className="text-indigo-400">{data?.v2Users || 0}</strong>
              </span>
              <span>
                Control: <strong className="text-slate-300">{data?.controlUsers || 0}</strong>
              </span>
            </div>
          </div>

          {/* Card 2: v2 Completion Rate */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-indigo-500/20 backdrop-blur-xl shadow-[0_0_20px_rgba(99,102,241,0.1)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-indigo-300">
                v2 Completion Rate
              </span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-white">
                {data ? `${v2Completion}%` : "..."}
              </span>
              {data && (
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                    completionDelta >= 0
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {completionDelta >= 0 ? `+${completionDelta}%` : `${completionDelta}%`}{" "}
                  vs Control
                </span>
              )}
            </div>
            <div className="mt-3 text-xs text-slate-400 border-t border-white/5 pt-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>
                {completionDelta > 0
                  ? "v2 significantly outperforms control"
                  : "Needs UX optimization"}
              </span>
            </div>
          </div>

          {/* Card 3: Control Completion Rate */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">
                Control Completion
              </span>
              <Percent className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-black font-mono text-slate-300">
              {data ? `${controlCompletion}%` : "..."}
            </div>
            <div className="mt-3 text-xs font-mono text-slate-400 border-t border-white/5 pt-2">
              Baseline funnel conversion
            </div>
          </div>

          {/* Card 4: Day-7 Retention */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">
                Day-7 Retention
              </span>
              <CalendarCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-white">
                {data ? `${v2Retention}%` : "..."}
              </span>
              {data && (
                <span className="text-xs font-mono text-slate-400">
                  (Control: {controlRetention}%)
                </span>
              )}
            </div>
            <div className="mt-3 text-xs text-slate-400 border-t border-white/5 pt-2 flex items-center justify-between font-mono">
              <span>Cohort return rate</span>
              <span
                className={`font-semibold ${
                  retentionDelta >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {retentionDelta >= 0 ? `+${retentionDelta}%` : `${retentionDelta}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Funnel Comparison (Side-by-Side) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              Funnel Breakdown: v2 vs. Control
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Hover step bars for detailed drop-off statistics
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data ? (
              <>
                <FunnelChart data={data.funnel.v2} variant="v2" />
                <FunnelChart data={data.funnel.control} variant="control" />
              </>
            ) : (
              <div className="col-span-2 p-12 text-center text-slate-500 font-mono text-xs rounded-2xl bg-white/[0.02] border border-white/5">
                Loading funnel metrics...
              </div>
            )}
          </div>
        </div>

        {/* Section 3 & 4: Drop-Off Analysis Table & Email/Time Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Drop-Off Table (2 columns on desktop) */}
          <div className="lg:col-span-2">
            {data ? (
              <DropOffTable
                dropOffData={data.dropOffByStep}
                funnelData={data.funnel}
              />
            ) : (
              <div className="p-8 text-center text-slate-500 font-mono text-xs rounded-2xl bg-white/[0.02]">
                Loading drop-off breakdown...
              </div>
            )}
          </div>

          {/* Time & Email Metrics Card (1 column on desktop) */}
          <div className="flex flex-col gap-4">
            {/* Median Time to Complete */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col gap-3">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">
                  Median Completion Time
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-[11px] text-slate-400 uppercase font-mono">
                    v2 Experience
                  </div>
                  <div className="text-xl font-bold font-mono text-indigo-400 mt-1">
                    {data ? `${data.medianTimeToComplete.v2}s` : "..."}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {data
                      ? `${(data.medianTimeToComplete.v2 / 60).toFixed(1)} mins`
                      : ""}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-[11px] text-slate-400 uppercase font-mono">
                    Control
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-300 mt-1">
                    {data ? `${data.medianTimeToComplete.control}s` : "..."}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {data
                      ? `${(data.medianTimeToComplete.control / 60).toFixed(1)} mins`
                      : ""}
                  </div>
                </div>
              </div>
            </div>

            {/* Email Engagement */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col gap-3">
              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Email Digest Engagement
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Weekly Reports
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-1 font-mono">
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                  <div className="text-[10px] text-slate-400">Sent</div>
                  <div className="text-lg font-bold text-slate-200 mt-1">
                    {data?.emailMetrics.sent || 0}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                  <div className="text-[10px] text-slate-400">Clicks</div>
                  <div className="text-lg font-bold text-purple-400 mt-1">
                    {data?.emailMetrics.clicks || 0}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                  <div className="text-[10px] text-slate-400">CTR</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">
                    {data ? `${data.emailMetrics.clickThroughRate}%` : "0%"}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mt-1">
                Monitors candidate re-engagement from weekly roadmap progress summary emails.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Activity Feed */}
        <div className="mt-2">
          {data ? (
            <ActivityFeed
              events={data.recentEvents}
              onRefresh={() => fetchAnalytics(startDate, endDate)}
              isRefreshing={isLoading}
            />
          ) : (
            <div className="p-8 text-center text-slate-500 font-mono text-xs rounded-2xl bg-white/[0.02]">
              Loading activity feed...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
