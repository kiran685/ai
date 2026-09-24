"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Compass,
  Calendar,
  Clock,
  Target,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Award,
  BookOpen,
  Code2,
  BrainCircuit,
  Zap,
} from "lucide-react";
import { CareerAnalysis, WeekOverview } from "@/types";
import Navbar from "@/app/components/Navbar";
import OnboardingProgress from "@/app/components/OnboardingProgress";
import { isFeatureEnabled } from "@/lib/featureFlags";

function RoadmapPreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const careerParam = searchParams.get("career") || "";

  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({ "week-1": true, "week-2": true });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.analysis) {
            setAnalysis(data.analysis as CareerAnalysis);
          } else {
            router.push("/onboarding");
          }
        } else {
          router.push("/onboarding");
        }
      } catch (err) {
        console.error("Failed to load profile for roadmap preview:", err);
        router.push("/onboarding");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-24 text-center">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-sm font-mono text-slate-400">Loading personalized roadmap blueprint...</p>
      </div>
    );
  }

  if (!analysis) return null;

  const targetRole = careerParam || analysis.targetRole || "Software Engineer";
  const weeks: WeekOverview[] = analysis.roadmapData?.weeks || [];
  const agentSummary = analysis.agentPlanSummary;
  const answers = analysis.questionnaireAnswers;

  const toggleWeek = (id: string) => {
    setExpandedWeeks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLaunchDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-24 relative z-10 space-y-8">
      <OnboardingProgress
        step={3}
        totalSteps={3}
        label="Personalized Roadmap Blueprint"
        icon={Compass}
      />

      {/* Hero Header Banner */}
      <section className="rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-950/60 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-xs font-mono font-bold text-indigo-300 uppercase">
              ✨ Blueprint Generated
            </span>
            <span className="badge-tech badge-tech-indigo">
              {targetRole}
            </span>
            {answers?.preferredLanguage && (
              <span className="badge-tech badge-tech-cyan">
                Language: {answers.preferredLanguage}
              </span>
            )}
            {answers?.targetCompanyType && (
              <span className="badge-tech badge-tech-emerald">
                Focus: {answers.targetCompanyType}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            {agentSummary?.strategyTitle || `Your Personalized ${weeks.length}-Week ${targetRole} Roadmap`}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            {agentSummary?.strategicAdvice ||
              `Calibrated from your resume evidence, target role expectations, and questionnaire responses. Built with daily Learn → Practice (3 LeetCode-style problems) → Assessment sequences.`}
          </p>

          {/* Key Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Duration</span>
              <span className="text-base font-bold font-mono text-white">
                {weeks.length} Weeks ({weeks.length * 5} Missions)
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Weekly Pace</span>
              <span className="text-base font-bold font-mono text-cyan-400">
                {answers?.weeklyCommitment || "15–20 hrs/week"}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Language Track</span>
              <span className="text-base font-bold font-mono text-purple-400">
                {answers?.preferredLanguage || "Java / Python"}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Learning Style</span>
              <span className="text-base font-bold font-mono text-emerald-400 truncate block">
                {answers?.learningStyle || "Project-First"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Strategic Milestones */}
      {agentSummary?.milestones && agentSummary.milestones.length > 0 && (
        <section className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Strategic Career Milestones
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {agentSummary.milestones.map((m, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300">
                    Week {m.week}
                  </span>
                  <p className="text-xs font-bold text-white truncate">{m.title}</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                  {m.goal}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Week-by-Week Curriculum Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Week-by-Week Curriculum Preview</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Each week contains 5 daily missions. Review theory, solve 3 interview coding labs, and complete DRM checkpoints.
            </p>
          </div>
          <button
            onClick={handleLaunchDashboard}
            className="btn-gradient !py-2.5 !px-5 !text-xs hidden sm:flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/20"
          >
            <span>Launch Career OS & Enter Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3.5">
          {weeks.map((week, wIdx) => {
            const isExpanded = expandedWeeks[week.id] ?? (wIdx === 0);
            return (
              <div
                key={week.id}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden transition-all shadow-md"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleWeek(week.id)}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Week {week.weekNumber}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {week.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {week.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-block">
                      5 Daily Missions
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Daily Breakdown */}
                {isExpanded && (
                  <div className="border-t border-white/[0.06] p-4 sm:p-5 bg-white/[0.01] space-y-3">
                    {week.focusSkills && week.focusSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-white/[0.06]">
                        <span className="text-[10px] font-mono uppercase text-slate-400">Core Focus:</span>
                        {week.focusSkills.map((sk) => (
                          <span
                            key={sk}
                            className="text-[10px] font-medium bg-white/[0.04] border border-white/[0.08] text-slate-300 px-2.5 py-0.5 rounded-full"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                      {[1, 2, 3, 4, 5].map((dayNum) => (
                        <div
                          key={dayNum}
                          className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-indigo-400">
                              Day {dayNum}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">
                              {dayNum === 5 ? "Checkpoint" : "Mission"}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-white line-clamp-1">
                            {dayNum === 5
                              ? "Weekly Assessment & DRM"
                              : `${week.focusSkills?.[dayNum - 1] || `Core Module ${dayNum}`}`}
                          </p>
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono pt-1">
                            <span>Learn</span>
                            <span>&bull;</span>
                            <span>3 Labs</span>
                            <span>&bull;</span>
                            <span>Test</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Floating Action Bar */}
      <section className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white">Ready to start your first daily mission?</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Day 1 is unlocked and ready for you on your adaptive dashboard.
          </p>
        </div>
        <button
          onClick={handleLaunchDashboard}
          className="btn-gradient !py-3.5 !px-7 !text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 cursor-pointer w-full sm:w-auto"
        >
          <span>Launch Career OS & Enter Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </main>
  );
}

export default function RoadmapPreviewPage() {
  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 relative selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="bg-mesh-glow" />
      <div className="fixed inset-0 bg-grid-tech pointer-events-none opacity-40 z-0" />

      <Navbar />

      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto px-6 py-20 text-center font-mono text-xs text-slate-400">
            Loading roadmap preview...
          </div>
        }
      >
        <RoadmapPreviewContent />
      </Suspense>
    </div>
  );
}
