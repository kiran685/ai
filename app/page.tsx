"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  FileText,
  Target,
  Rocket,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Play,
  Award,
  Check,
  Sparkles,
  Compass,
  RefreshCw,
  Layers,
} from "lucide-react";
import { useEffect } from "react";
import Navbar from "@/app/components/Navbar";

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [activeTab, setActiveTab] = useState<"skills" | "roadmap">("skills");
  const [profileData, setProfileData] = useState<{
    targetRole?: string;
    hasRoadmap: boolean;
    weeksCount: number;
    loaded: boolean;
  }>({ hasRoadmap: false, weeksCount: 8, loaded: false });

  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/profile")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.analysis) {
            const hasRoadmap = Boolean(
              data.analysis.roadmapData?.weeks && data.analysis.roadmapData.weeks.length > 0
            );
            setProfileData({
              targetRole: data.analysis.targetRole,
              hasRoadmap,
              weeksCount: data.analysis.roadmapData?.weeks?.length || 8,
              loaded: true,
            });
          } else {
            setProfileData({ hasRoadmap: false, weeksCount: 8, loaded: true });
          }
        })
        .catch(() => setProfileData({ hasRoadmap: false, weeksCount: 8, loaded: true }));
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen w-full bg-[#07080e] text-slate-100 relative selection:bg-indigo-500/30 selection:text-indigo-200 flex flex-col items-center overflow-x-hidden">
      {/* Dynamic Background Mesh Gradients */}
      <div className="bg-mesh-glow" />
      <div className="fixed inset-0 bg-grid-tech pointer-events-none opacity-40 z-0" />

      {/* Shared Navbar */}
      <Navbar />

      <main className="relative z-10 w-full flex flex-col items-center">
        {/* ═══ HERO SECTION ═══ */}
        <section className="w-full pt-12 pb-8 md:pt-20 md:pb-12 px-4 sm:px-6 max-w-7xl mx-auto text-center flex flex-col items-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md mb-6 animate-fade-in shadow-lg shadow-indigo-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-medium text-indigo-300">
              {isAuthenticated && profileData.hasRoadmap
                ? `Active Track · ${profileData.targetRole || "Software Engineer"}`
                : "AI Career OS 2.0 · Autonomous Career Architecture"}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.12] max-w-4xl mx-auto text-balance">
            Stop guessing your career. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
              Engineer your trajectory with precision.
            </span>
          </h1>

          {/* Description */}
          <p className="mt-5 text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed text-pretty">
            {isAuthenticated && profileData.hasRoadmap
              ? `You have an active ${profileData.weeksCount}-week roadmap for ${profileData.targetRole || "your target role"}. Resume your daily missions or recalibrate your specialization below.`
              : "Upload your resume, audit verified capabilities against real-world job architectures, and conquer a calibrated, day-by-day roadmap with GeeksforGeeks masterclasses."}
          </p>

          {/* ═══ 3 PATHWAYS OR CONTINUATION CONTROLS ═══ */}
          {isAuthenticated && profileData.hasRoadmap ? (
            /* Existing User with Active Roadmap */
            <div className="mt-8 flex flex-col items-center gap-4 w-full max-w-xl">
              <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/60 border border-indigo-500/30 backdrop-blur-xl shadow-xl shadow-indigo-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 block">
                    Active Roadmap Ready
                  </span>
                  <p className="text-base font-bold text-white">
                    {profileData.targetRole || "Software Engineer"}
                  </p>
                </div>
                <Link
                  href="/dashboard"
                  className="btn-gradient !py-3 !px-6 !text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/30 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <span>Continue your roadmap</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                <Link
                  href="/target"
                  className="btn-subtle !py-2.5 !px-4 !text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Change target role</span>
                </Link>
                <Link
                  href="/onboarding?step=1&reset=true"
                  className="btn-subtle !py-2.5 !px-4 !text-xs flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Start new roadmap</span>
                </Link>
              </div>
            </div>
          ) : (
            /* New Users or Users without Active Roadmap: Display 3 Clear Paths */
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-4xl text-left">
              {/* Path 1: Start From Scratch */}
              <Link
                href="/onboarding?step=1&reset=true"
                className="group p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-indigo-500/40 backdrop-blur-xl transition-all shadow-lg hover:shadow-indigo-500/10 flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                    Path 1 &middot; Recommended
                  </span>
                  <h3 className="text-sm font-bold text-white mb-1.5">
                    Start from Scratch
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Full AI wizard: upload your resume, audit verified skill gaps, and generate your 8-week plan.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center text-xs font-semibold text-indigo-300 group-hover:text-indigo-200">
                  <span>Start onboarding</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Path 2: Continue Roadmap */}
              <Link
                href="/dashboard"
                className="group p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-purple-500/40 backdrop-blur-xl transition-all shadow-lg hover:shadow-purple-500/10 flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-105 transition-transform">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 block mb-1">
                    Path 2 &middot; Existing Plan
                  </span>
                  <h3 className="text-sm font-bold text-white mb-1.5">
                    Continue Roadmap
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Access your personalized dashboard, view today&apos;s mission, or complete pending assessments.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center text-xs font-semibold text-purple-300 group-hover:text-purple-200">
                  <span>Go to dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Path 3: Change Target Role */}
              <Link
                href="/target"
                className="group p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-cyan-500/40 backdrop-blur-xl transition-all shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
                    <Target className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                    Path 3 &middot; Role Switching
                  </span>
                  <h3 className="text-sm font-bold text-white mb-1.5">
                    Change Target Role
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Pick a new specialization (Frontend, DevOps, AI/ML, etc.) to recalibrate role benchmarks.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center text-xs font-semibold text-cyan-300 group-hover:text-cyan-200">
                  <span>Select role track</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          )}

          {/* Quick Metrics Guarantee Pill */}
          <div className="mt-8 mb-6 sm:mb-8 inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 px-5 py-2.5 rounded-full border border-white/[0.08] bg-white/[0.02] backdrop-blur-md text-xs font-mono text-slate-300 shadow-sm">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>14+ Engineering Tracks</span>
            </div>
            <span className="text-white/20 hidden sm:inline">&bull;</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Targeted Skill Gap Engine</span>
            </div>
            <span className="text-white/20 hidden sm:inline">&bull;</span>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Adaptive Daily Missions</span>
            </div>
          </div>
        </section>

        {/* ═══ DASHBOARD PREVIEW / COCKPIT SHOWCASE ═══ */}
        <section id="features-cockpit" className="w-full pt-2 pb-16 md:pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
          {/* Ambient Background Glow */}
          <div className="relative">
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/15 to-cyan-500/15 blur-[100px] rounded-full pointer-events-none" />

            {/* Central Cockpit Window Frame */}
            <div className="relative bg-gradient-to-b from-[#111524] to-[#0a0d16] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5">
              {/* Window Controls & Navigation Header */}
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block shrink-0" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block shrink-0" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block shrink-0" />
                  <span className="text-xs font-mono text-slate-400 ml-2 truncate">
                    ai-career-os --target &quot;AI / ML Systems Architect&quot;
                  </span>
                </div>

                {/* Tab Controls */}
                <div className="flex items-center gap-1 bg-[#060810] p-1 rounded-xl border border-white/[0.08] shrink-0 overflow-x-auto no-scrollbar max-w-full">
                  {(["skills", "roadmap"] as const).map((tab) => {
                    const label =
                      tab === "skills"
                        ? "Skill Matrix"
                        : "Adaptive Roadmap";
                    const isTabActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`text-xs font-medium px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                          isTabActive
                            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 font-semibold"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Tab Pane Content */}
              <div className="p-5 sm:p-7 md:p-8 min-h-[360px]">
                {/* 1. SKILL MATRIX TAB */}
                {activeTab === "skills" && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
                      <div className="min-w-0">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                          Validated Candidate Evaluation
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold text-white mt-1 truncate">
                          AI &amp; Machine Learning Engineer Track
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Resume analysis cross-referenced with proctored technical diagnostic.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 px-4 py-2.5 rounded-xl shrink-0 self-start sm:self-auto">
                        <div>
                          <div className="text-[10px] font-mono text-emerald-300">Verified Fit Score</div>
                          <div className="text-2xl font-extrabold text-emerald-400">86%</div>
                        </div>
                        <Award className="w-6 h-6 text-emerald-400" />
                      </div>
                    </div>

                    {/* Skill Cards Grid - RESPONSIVE WITHOUT CLIPPING */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-4.5 rounded-xl bg-[#141a29]/70 border border-emerald-500/25 flex flex-col justify-between min-w-0 hover:border-emerald-500/40 transition-colors">
                        <div>
                          <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold">
                            <span>VERIFIED STRONG</span>
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <div className="font-semibold text-white mt-2 text-sm">Python, NumPy &amp; PyTorch</div>
                          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                            Demonstrated across 5 repo architectures. Scored 100% on tensor execution mechanics.
                          </p>
                        </div>
                      </div>

                      <div className="p-4.5 rounded-xl bg-[#141a29]/70 border border-purple-500/25 flex flex-col justify-between min-w-0 hover:border-purple-500/40 transition-colors">
                        <div>
                          <div className="flex items-center justify-between text-xs font-mono text-purple-400 font-semibold">
                            <span>HIGH POTENTIAL</span>
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <div className="font-semibold text-white mt-2 text-sm">Transformers &amp; Attention</div>
                          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                            Solid architectural intuition. Ready for LoRA/PEFT fine-tuning optimization.
                          </p>
                        </div>
                      </div>

                      <div className="p-4.5 rounded-xl bg-[#141a29]/70 border border-amber-500/25 flex flex-col justify-between min-w-0 hover:border-amber-500/40 transition-colors">
                        <div>
                          <div className="flex items-center justify-between text-xs font-mono text-amber-400 font-semibold">
                            <span>TRUE GAP (PRIORITY)</span>
                            <Target className="w-3.5 h-3.5" />
                          </div>
                          <div className="font-semibold text-white mt-2 text-sm">MLOps, Docker &amp; Serving</div>
                          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                            Not detected in production artifacts. Primary target for Week 1 &amp; 2 curriculum.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. ADAPTIVE ROADMAP TAB */}
                {activeTab === "roadmap" && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                          Week 1 of 8 &middot; Fast-Track Sprint
                        </span>
                        <h3 className="text-lg font-bold text-white mt-0.5">
                          High-Throughput Model Serving &amp; Asynchronous Pipelines
                        </h3>
                      </div>
                      <span className="badge-tech badge-tech-indigo self-start sm:self-auto">
                        18 hrs/week &middot; 5 Days
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                            ✓
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">
                              Containerizing PyTorch Inference with Multi-Stage Docker
                            </div>
                            <div className="text-xs text-emerald-300">
                              Passed &middot; Score: 100% &middot; Notes &amp; Tutorials Completed
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 font-semibold shrink-0">PASSED</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-indigo-500/15 border border-indigo-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                            2
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">
                              FastAPI Streaming Endpoints with Dynamic Batch Queueing
                            </div>
                            <div className="text-xs text-indigo-300">
                              Today&apos;s Mission &middot; 10-Question DRM Checkpoint
                            </div>
                          </div>
                        </div>
                        <button className="btn-gradient !py-1.5 !px-3 !text-xs flex items-center gap-1.5 shrink-0">
                          <Play className="w-3 h-3" />
                          <span>Start Day</span>
                        </button>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] opacity-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                            3
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-300">
                              MLflow Model Registry &amp; Continuous Performance Tracking
                            </div>
                            <div className="text-xs text-slate-500">
                              Locks until Day 2 score &ge; 70% threshold is verified
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-slate-500 shrink-0">LOCKED</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 4-STAGE ARCHITECTURAL PIPELINE ═══ */}
        <section id="how-it-works" className="w-full py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/[0.06]">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
              System Blueprint
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-2">
              The 4-Stage Precision Pipeline
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-3">
              From unparsed resume to certified technical milestone execution without ambiguity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                title: "Deep Token Parsing",
                desc: "Extracts verified skills, projects, and architecture footprints from your PDF or DOCX file.",
                icon: FileText,
                gradient: "from-indigo-500 to-blue-600",
              },
              {
                step: "02",
                title: "Competency Audit",
                desc: "Extracts verified project footprints, technical stacks, and practical engineering depth directly from your artifacts.",
                icon: Sparkles,
                gradient: "from-purple-500 to-indigo-600",
              },
              {
                step: "03",
                title: "True Gap Matrix",
                desc: "Isolates genuine strengths from overstated keywords to compute a reliable validated fit.",
                icon: Target,
                gradient: "from-cyan-500 to-teal-600",
              },
              {
                step: "04",
                title: "Daily Atomic Missions",
                desc: "Generates week-by-week checkpoints, GFG study notes, and bilingual video tutorials.",
                icon: Rocket,
                gradient: "from-emerald-500 to-cyan-600",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="h-full flex flex-col justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-indigo-500/40 hover:bg-white/[0.04] transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-indigo-400 transition-colors">
                      STAGE {item.step}
                    </span>
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.gradient} p-[1px]`}>
                      <div className="w-full h-full bg-[#0e1220] rounded-[11px] flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ ROLE TRACKS ═══ */}
        <section id="tracks" className="w-full py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/[0.06]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                Multi-Domain Capability
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-2">
                Engineered for Every High-Impact Track
              </h2>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              Whether accelerating into AI engineering or pivoting to systems architecture, the OS tailors every milestone dynamically.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Software Engineer", tags: "DSA &middot; System Design &middot; Testing" },
              { title: "AI / ML Engineer", tags: "PyTorch &middot; LoRA &middot; Transformers &middot; MLOps" },
              { title: "Full Stack Engineer", tags: "Next.js &middot; TypeScript &middot; PostgreSQL" },
              { title: "Cloud & DevOps", tags: "Kubernetes &middot; Docker &middot; Terraform" },
              { title: "Data Scientist", tags: "Statistical Modeling &middot; Pandas &middot; ML" },
              { title: "Cybersecurity", tags: "Network Defense &middot; Pen Testing &middot; Auth" },
              { title: "Mobile Engineer", tags: "React Native &middot; Flutter &middot; iOS Swift" },
              { title: "Custom Targeted Role", tags: "Dynamic AI Calibration for any niche" },
            ].map((track, i) => (
              <div
                key={i}
                className="h-full flex flex-col justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all"
              >
                <div>
                  <div className="text-[11px] font-mono text-indigo-400 mb-2 font-semibold">TRACK 0{i + 1}</div>
                  <h4 className="text-base font-bold text-white mb-2">{track.title}</h4>
                </div>
                <div
                  className="text-xs text-slate-400 mt-2 pt-2 border-t border-white/[0.04]"
                  dangerouslySetInnerHTML={{ __html: track.tags }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ═══ COMPARISON ═══ */}
        <section id="comparison" className="w-full py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/[0.06]">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold">
              The Real Difference
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-2">
              Why It Outperforms Generic Courses
            </h2>
          </div>

          <div className="rounded-2xl border border-white/[0.1] bg-white/[0.02] overflow-hidden shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 p-4 bg-white/[0.04] border-b border-white/[0.08] text-xs font-mono uppercase text-slate-400 gap-2">
              <div className="font-semibold text-slate-400">Traditional Bootcamps &amp; Tutorials</div>
              <div className="text-indigo-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                AI Career OS
              </div>
            </div>

            {[
              [
                "Generic 80-hour video playlists you abandon after week 1.",
                "Atomic daily modules with 10-question checkpoints calibrated to your exact schedule.",
              ],
              [
                "Keyword stuffing on resume without verified proof.",
                "Targeted skill gap verification isolating true strengths from keyword fluff.",
              ],
              [
                "Scattered bookmarks and disjointed tabs.",
                "Integrated progress tracking, GFG-grade masterclass notes, and bilingual video links.",
              ],
              [
                "Skipping prerequisites without true understanding.",
                "70% passing threshold gates ensure solid mastery before moving forward.",
              ],
            ].map(([bad, good], idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-2 p-5 border-b border-white/[0.06] last:border-b-0 gap-3 items-center"
              >
                <div className="text-xs sm:text-sm text-slate-400 flex items-start gap-2">
                  <span className="md:hidden text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400 shrink-0">Legacy</span>
                  <span>{bad}</span>
                </div>
                <div className="text-xs sm:text-sm text-white font-medium flex items-start gap-2.5">
                  <span className="md:hidden text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 shrink-0">AI OS</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{good}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ FINAL CTA BANNER ═══ */}
        <section className="w-full py-20 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-[#0c0f1d] border border-indigo-500/30 text-center relative overflow-hidden shadow-2xl shadow-indigo-500/10">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 blur-[90px] rounded-full pointer-events-none" />
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-2xl mx-auto relative z-10">
              Ready to engineer your verified roadmap?
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto relative z-10">
              Take 2 minutes to upload your resume and complete your assessment.
            </p>
            <div className="mt-8 flex justify-center relative z-10">
              <Link
                href={isAuthenticated ? "/dashboard" : "/signup"}
                className="btn-gradient !py-3.5 !px-8 !text-base flex items-center gap-2"
              >
                <span>{isAuthenticated ? "Go to Dashboard" : "Start Free Assessment"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="mt-6 text-xs font-mono text-slate-400 relative z-10">
              No credit card required &middot; Secure database persistence &middot; NextAuth protected
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.08] py-8 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>All Systems Operational &middot; AI Career OS v2.0</span>
        </div>
        <div>
          &copy; 2026 AI Career OS &middot; Built for Software, AI &amp; Data Builders
        </div>
      </footer>
    </div>
  );
}
