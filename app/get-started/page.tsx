"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Target,
  Compass,
  Briefcase,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText,
  ChevronRight,
  Zap,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";

export default function GetStartedPage() {
  const router = useRouter();
  const [profileStatus, setProfileStatus] = useState<{
    onboardingCompleted: boolean;
    hasResume: boolean;
    resumeFileName: string | null;
    targetRole: string | null;
  } | null>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/profile/status");
        if (res.ok) {
          const data = await res.json();
          setProfileStatus(data);
        }
      } catch (err) {
        console.warn("Could not retrieve profile status:", err);
      }
    }
    checkStatus();
  }, []);

  const cards = [
    {
      id: "target",
      emoji: "🎯",
      icon: Target,
      tag: "PATH A",
      tagColor: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
      title: "I know my target role",
      description: "I already know what role I want. Build my career plan around it.",
      buttonText: "Choose my role",
      route: "/target",
      highlights: ["Pick from 12+ tech tracks", "Upload resume to calibrate", "Instant gap analysis"],
      gradient: "from-indigo-600/20 via-purple-600/10 to-transparent",
      accentBorder: "group-hover:border-indigo-500/60",
      accentGlow: "group-hover:shadow-indigo-500/10",
      btnClass: "btn-gradient",
    },
    {
      id: "career-fit",
      emoji: "🧭",
      icon: Compass,
      tag: "PATH B",
      tagColor: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
      title: "Help me find the right role",
      description: "I’m not sure which role fits my current skills and profile.",
      buttonText: "Find my best roles",
      route: "/career-fit",
      highlights: ["AI capability discovery", "Ranked role recommendations", "Evidence-based match %"],
      gradient: "from-cyan-600/20 via-teal-600/10 to-transparent",
      accentBorder: "group-hover:border-cyan-500/60",
      accentGlow: "group-hover:shadow-cyan-500/10",
      btnClass: "bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:from-cyan-400 hover:to-teal-400 shadow-md shadow-cyan-500/20",
    },
    {
      id: "job-analyzer",
      emoji: "💼",
      icon: Briefcase,
      tag: "PATH C",
      tagColor: "border-purple-500/30 bg-purple-500/10 text-purple-300",
      title: "Analyze a specific job",
      description: "I found a job and want to know how well my profile matches it.",
      buttonText: "Analyze a job",
      route: "/job-analyzer",
      highlights: ["Paste company & JD", "Profile vs JD alignment %", "Actionable preparation roadmap"],
      gradient: "from-purple-600/20 via-pink-600/10 to-transparent",
      accentBorder: "group-hover:border-purple-500/60",
      accentGlow: "group-hover:shadow-purple-500/10",
      btnClass: "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400 shadow-md shadow-purple-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 relative selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="bg-mesh-glow" />
      <div className="fixed inset-0 bg-grid-tech pointer-events-none opacity-40 z-0" />

      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-24 relative z-10">
        {/* Header Badge */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-mono text-indigo-300 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            AI Career OS &middot; Personalized Entry
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            How do you want to start?
          </h1>

          <p className="text-slate-400 text-sm sm:text-base mt-4 max-w-xl mx-auto leading-relaxed">
            Choose how you&apos;d like to begin. Whether you have a specific target role, want AI to assess your best-fit directions, or want to evaluate a real job posting.
          </p>

          {/* Existing Profile notification if present */}
          {profileStatus?.hasResume && (
            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-300">
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resume on file: {profileStatus.resumeFileName || "Saved Resume"}
              </span>
              {profileStatus.targetRole && (
                <>
                  <span className="text-slate-600">&bull;</span>
                  <span className="text-slate-400 font-mono">
                    Current track: <span className="text-white font-semibold">{profileStatus.targetRole}</span>
                  </span>
                </>
              )}
              {profileStatus.onboardingCompleted && (
                <Link
                  href="/dashboard"
                  className="ml-2 text-indigo-400 hover:text-indigo-300 font-mono font-medium underline underline-offset-4 flex items-center gap-1"
                >
                  Go to Dashboard <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* 3 Entry Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => router.push(card.route)}
                className={`group rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${card.accentBorder} ${card.accentGlow} cursor-pointer relative overflow-hidden`}
              >
                {/* Background Glow */}
                <div
                  className={`absolute top-0 inset-x-0 h-36 bg-gradient-to-b ${card.gradient} opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none`}
                />

                <div className="relative z-10">
                  {/* Top bar: Tag & Emoji */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-3xl select-none" role="img" aria-label={card.title}>
                      {card.emoji}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full border ${card.tagColor}`}
                    >
                      {card.tag}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h2 className="text-xl font-bold text-white tracking-tight group-hover:text-white transition-colors">
                    {card.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-400 mt-2.5 leading-relaxed min-h-[48px]">
                    {card.description}
                  </p>

                  {/* Feature Highlights */}
                  <ul className="mt-6 pt-5 border-t border-white/[0.06] space-y-2">
                    {card.highlights.map((h, i) => (
                      <li
                        key={i}
                        className="text-xs text-slate-300 flex items-center gap-2 font-mono"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/80 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom CTA Button */}
                <div className="relative z-10 pt-7">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(card.route);
                    }}
                    className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${card.btnClass}`}
                  >
                    <span>{card.buttonText}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Guarantee Note */}
        <div className="mt-14 max-w-2xl mx-auto text-center p-4 rounded-xl border border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              All three entry paths converge into your personal verified roadmap, daily missions, and skill audits.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
