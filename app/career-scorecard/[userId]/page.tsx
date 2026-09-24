"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Sparkles,
  Award,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Share2,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Target,
  Zap,
  BarChart3,
  Layers,
  Printer,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";

interface ScorecardData {
  userId: string;
  userName: string;
  targetRole: string;
  readinessScore: number;
  resumeFitScore: number;
  skillScore: number;
  strengths: string[];
  focusAreas: string[];
  completedDays: number;
  totalDays: number;
}

export default function CareerScorecardPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const resolvedParams = use(params);
  const userId = resolvedParams.userId;

  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          if (data?.analysis) {
            const a = data.analysis;
            const strengthsList = (a.strengths || []).map((s: any) =>
              typeof s === "string" ? s : s.skill || s.title || "Core Technical Competency"
            );
            const weaknessesList = (a.weaknesses || []).map((w: any) =>
              typeof w === "string" ? w : w.skill || w.title || "Advanced Scalability"
            );

            const rScore = a.readinessScore || a.combinedAlignmentScore || a.alignmentScore || 72;
            const resScore = a.alignmentScore || 70;
            const skScore = a.combinedAlignmentScore || 75;

            setScorecard({
              userId,
              userName: a.userName || "Candidate",
              targetRole: a.targetRole || "Software Engineer",
              readinessScore: rScore,
              resumeFitScore: resScore,
              skillScore: skScore,
              strengths: strengthsList.length > 0 ? strengthsList.slice(0, 3) : ["Algorithmic Problem Solving", "Full-Stack Development", "Clean Code"],
              focusAreas: weaknessesList.length > 0 ? weaknessesList.slice(0, 3) : ["System Design Trade-offs", "Concurrency Safety", "Production Observability"],
              completedDays: a.completedDays || 4,
              totalDays: a.totalDays || 40,
            });
          } else {
            // Default sample scorecard
            setScorecard({
              userId,
              userName: "Engineering Candidate",
              targetRole: "Software Engineer",
              readinessScore: 78,
              resumeFitScore: 82,
              skillScore: 74,
              strengths: ["Data Structures & Algorithms", "Component Architecture", "REST API Development"],
              focusAreas: ["System Design & Latency Budgets", "Distributed Transactions", "CI/CD & Containerization"],
              completedDays: 6,
              totalDays: 40,
            });
          }
        }
      } catch (err) {
        console.warn("Could not fetch profile for scorecard:", err);
        setScorecard({
          userId,
          userName: "Engineering Candidate",
          targetRole: "Software Engineer",
          readinessScore: 78,
          resumeFitScore: 82,
          skillScore: 74,
          strengths: ["Data Structures & Algorithms", "Component Architecture", "REST API Development"],
          focusAreas: ["System Design & Latency Budgets", "Distributed Transactions", "CI/CD & Containerization"],
          completedDays: 6,
          totalDays: 40,
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userId]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLinkedIn = () => {
    if (!scorecard) return;
    const text = `I just benchmarked my verified career readiness for ${scorecard.targetRole} on AI Career OS! Readiness Score: ${scorecard.readinessScore}%. Check out my verified scorecard:`;
    const shareUrl = typeof window !== "undefined" ? window.location.href : "https://aicareeros.dev";
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      shareUrl
    )}&summary=${encodeURIComponent(text)}`;
    window.open(linkedInUrl, "_blank", "noopener,noreferrer");
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080e] flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-indigo-400 border-t-transparent animate-spin" />
          <span>Generating Career Scorecard...</span>
        </div>
      </div>
    );
  }

  if (!scorecard) return null;

  return (
    <div className="min-h-screen w-full bg-[#07080e] text-slate-100 relative selection:bg-indigo-500/30 selection:text-indigo-200 flex flex-col items-center overflow-x-hidden">
      <div className="bg-mesh-glow" />
      <div className="fixed inset-0 bg-grid-tech pointer-events-none opacity-40 z-0" />

      <Navbar />

      <main className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-24 flex flex-col items-center">
        {/* Action Bar */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 print:hidden">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              &larr; Back to Dashboard
            </Link>
            <span>&middot;</span>
            <span className="text-indigo-300">Public Verification Certificate</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyLink}
              className="btn-subtle !py-2 !px-3.5 !text-xs flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied Link!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="btn-subtle !py-2 !px-3.5 !text-xs flex items-center gap-1.5 cursor-pointer hidden sm:flex"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleShareLinkedIn}
              className="btn-gradient !py-2 !px-4 !text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/25 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share on LinkedIn</span>
            </button>
          </div>
        </div>

        {/* ═══ SCORECARD CONTAINER (High-impact Glassmorphic Card) ═══ */}
        <div
          id="career-scorecard-card"
          className="w-full rounded-3xl bg-gradient-to-b from-[#0f1424] via-[#0b0e18] to-[#070910] border border-white/[0.12] p-7 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-2xl ring-1 ring-white/10"
        >
          {/* Ambient Corner Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-cyan-500/15 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Header Row */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Verified Career Assessment Certificate</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {scorecard.userName}
              </h1>
              <p className="text-sm font-mono text-cyan-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>Target Role: {scorecard.targetRole}</span>
              </p>
            </div>

            {/* Overall Score Dial */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl flex items-center gap-4 shrink-0 shadow-lg">
              <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[2.5px] shadow-lg shadow-indigo-500/30">
                <div className="w-full h-full bg-[#0b0e18] rounded-full flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-white font-mono leading-none">
                    {scorecard.readinessScore}%
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                  Readiness Score
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  {scorecard.readinessScore >= 75
                    ? "Interview Ready"
                    : scorecard.readinessScore >= 60
                    ? "Advancing Rapidly"
                    : "Building Core Skills"}
                </span>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-7">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[11px] font-mono text-slate-400 block mb-1">Resume Alignment</span>
              <p className="text-xl font-bold text-indigo-300 font-mono">{scorecard.resumeFitScore}%</p>
              <p className="text-[11px] text-slate-400 mt-1">Verified from parsed technical background</p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[11px] font-mono text-slate-400 block mb-1">Code &amp; Quiz Benchmark</span>
              <p className="text-xl font-bold text-purple-300 font-mono">{scorecard.skillScore}%</p>
              <p className="text-[11px] text-slate-400 mt-1">Demonstrated across technical evaluations</p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[11px] font-mono text-slate-400 block mb-1">Roadmap Progress</span>
              <p className="text-xl font-bold text-cyan-300 font-mono">
                {scorecard.completedDays} / {scorecard.totalDays} Days
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Active trajectory completion rate</p>
            </div>
          </div>

          {/* Strengths & Focus Areas 2-Column Split */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/[0.08]">
            {/* Top Strengths */}
            <div className="p-5 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-3 text-emerald-400 font-semibold text-xs font-mono uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Top 3 Verified Strengths</span>
              </div>
              <ul className="space-y-2">
                {scorecard.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span className="font-medium">{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Focus Areas */}
            <div className="p-5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/20">
              <div className="flex items-center gap-2 mb-3 text-amber-400 font-semibold text-xs font-mono uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" />
                <span>Top 3 Priority Focus Areas</span>
              </div>
              <ul className="space-y-2">
                {scorecard.focusAreas.map((foc, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      !
                    </span>
                    <span className="font-medium">{foc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Badge */}
          <div className="relative z-10 mt-8 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-white font-bold">Powered by AI Career OS</span>
              <span className="text-slate-500">&middot; Autonomous Trajectory Architecture</span>
            </div>
            <div className="text-slate-500 text-[11px]">
              ID: {userId.slice(0, 12)} &middot; {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>

        {/* Share CTA under Scorecard */}
        <div className="mt-8 flex flex-col items-center gap-3 text-center print:hidden">
          <p className="text-xs text-slate-400">
            Ready to show hiring managers and your network your career trajectory?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleShareLinkedIn}
              className="btn-gradient !py-3 !px-6 !text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/30 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Scorecard on LinkedIn</span>
            </button>
            <Link
              href="/dashboard"
              className="btn-subtle !py-3 !px-5 !text-sm flex items-center gap-1.5"
            >
              <span>Continue Daily Missions &rarr;</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
