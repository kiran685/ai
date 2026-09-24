"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ChevronLeft,
  Briefcase,
  Layers,
  BookOpen,
  ListTodo,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";
import { RoleFitDeepDive, SkillEvidenceClassification } from "@/types";
import { resolveRoleFromSlug } from "@/lib/ai/career-fit";

interface PageProps {
  params: Promise<{ role: string }>;
}

function RoleDeepDiveContent({ roleSlug }: { roleSlug: string }) {
  const router = useRouter();
  const targetRole = resolveRoleFromSlug(roleSlug);

  const [deepDive, setDeepDive] = useState<RoleFitDeepDive | null>(null);
  const [loading, setLoading] = useState(true);
  const [buildingPlan, setBuildingPlan] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRoleAnalysis() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/career/fit?role=${encodeURIComponent(roleSlug)}`);
        const data = await res.json();

        if (res.ok && data.deepDive) {
          setDeepDive(data.deepDive);
        } else {
          // Try POST with cached resume if GET failed
          const postRes = await fetch("/api/career/fit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: roleSlug }),
          });
          const postData = await postRes.json();
          if (postRes.ok && postData.deepDive) {
            setDeepDive(postData.deepDive);
          } else {
            throw new Error(postData.error || "Failed to load role deep dive analysis.");
          }
        }
      } catch (err) {
        console.error("Failed to load deep dive:", err);
        setError(err instanceof Error ? err.message : "Failed to load role analysis.");
      } finally {
        setLoading(false);
      }
    }

    loadRoleAnalysis();
  }, [roleSlug]);

  async function handleBuildCareerPlan() {
    setBuildingPlan(true);
    try {
      // 1. Fetch current profile
      const profRes = await fetch("/api/profile");
      const profData = await profRes.json();
      const resumeText = profData.analysis?.resumeText || "";

      // 2. Generate calibrated roadmap for this chosen role
      const roadmapRes = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: resumeText,
          career: targetRole,
          skills: deepDive?.strongMatches.map((s) => ({ skill: s.skill, found: true, confidence: "strong" })) || [],
        }),
      });

      let roadmapData = undefined;
      if (roadmapRes.ok) {
        const rJson = await roadmapRes.json();
        roadmapData = {
          weeks: rJson.weeks || [],
          daysData: {},
          dayResults: {},
        };
      }

      // 3. Persist profile with chosen target role & complete onboarding
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          alignmentScore: deepDive?.suitabilityScore || 75,
          roadmapData,
        }),
      });

      // Synchronize status
      await fetch("/api/profile/status").catch(() => {});

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Build Career Plan error:", err);
      router.push("/dashboard");
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-24 text-center font-mono text-xs text-slate-400">
        <Sparkles className="w-5 h-5 mx-auto mb-3 animate-pulse text-cyan-400" />
        <p>Synthesizing verified capability evidence for {targetRole}...</p>
      </div>
    );
  }

  if (error || !deepDive) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 max-w-md mx-auto text-rose-300 text-xs">
          <p className="font-semibold mb-2">Could not evaluate role deep dive</p>
          <p>{error || "No profile evidence found. Please ensure you have uploaded your resume."}</p>
          <button
            type="button"
            onClick={() => router.push("/career-fit")}
            className="mt-4 px-4 py-2 rounded-xl bg-white/[0.1] hover:bg-white/[0.15] text-white font-mono cursor-pointer"
          >
            &larr; Back to Career Fit
          </button>
        </div>
      </div>
    );
  }

  const score = deepDive.suitabilityScore;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-24 relative z-10">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push("/career-fit")}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white mb-6 cursor-pointer transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to role recommendations</span>
      </button>

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-300 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Path B &middot; Role Competency Audit
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {targetRole}
          </h1>

          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
            Detailed breakdown of your verified competencies, developing skills, and target curriculum gaps.
          </p>
        </div>

        {/* Big Score Card */}
        <div className="p-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/30 backdrop-blur-xl shrink-0 min-w-[200px] text-right">
          <span className="text-[11px] font-mono text-slate-400 block uppercase">
            Current Profile Alignment
          </span>
          <div className="flex items-baseline justify-end gap-1.5 mt-1">
            <span className="text-4xl font-extrabold font-mono bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              {score}%
            </span>
            <span className="text-xs text-slate-400 font-mono">evidence match</span>
          </div>
          <div className="mt-2 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-700"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Transparency Note */}
      <div className="mt-6 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center gap-3 text-xs text-slate-300">
        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          <strong>Evidence Disclaimer:</strong> This score represents current profile alignment based strictly on resume evidence, NOT probability of getting a job or hiring guarantee.
        </span>
      </div>

      {/* Why This Role Fits */}
      <section className="mt-8 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
        <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-cyan-300 mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-cyan-400" />
          Why this role fits your profile
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {deepDive.whyItFits.map((item, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-slate-200 flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Skills Matrix: Strong Matches, Developing, Missing/Not Demonstrated */}
      <div className="mt-8 space-y-6">
        {/* Strong Matches */}
        <section className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Strong Matches ({deepDive.strongMatches.length})
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20">
              DEMONSTRATED &middot; VERIFIED
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Competencies directly supported by projects, work history, or solid evidence in your resume.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deepDive.strongMatches.map((item) => (
              <div
                key={item.skill}
                className="p-3.5 rounded-xl bg-[#0c0f18] border border-emerald-500/30 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-emerald-300 font-mono">{item.skill}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                    {item.status}
                  </span>
                </div>
                {item.evidence && (
                  <p className="text-[11px] text-slate-400 italic">
                    Evidence: &ldquo;{item.evidence}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Developing Skills */}
        {deepDive.developingSkills.length > 0 && (
          <section className="p-6 rounded-2xl border border-amber-500/20 bg-amber-950/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Developing Skills ({deepDive.developingSkills.length})
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/20">
                DEVELOPING
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Mentioned in resume with introductory or limited project context. Needs structured code labs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {deepDive.developingSkills.map((item) => (
                <div
                  key={item.skill}
                  className="p-3.5 rounded-xl bg-[#0c0f18] border border-amber-500/30 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-amber-300 font-mono">{item.skill}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                      {item.status}
                    </span>
                  </div>
                  {item.evidence && (
                    <p className="text-[11px] text-slate-400 italic">
                      Evidence: &ldquo;{item.evidence}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Missing / Not Demonstrated Skills */}
        <section className="p-6 rounded-2xl border border-rose-500/20 bg-rose-950/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Missing / Not Demonstrated Skills ({deepDive.missingSkills.length})
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/20">
              ROADMAP PRIORITY
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Essential role expectations not evidenced in your resume. These will form the core focus of your learning roadmap.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deepDive.missingSkills.map((item) => (
              <div
                key={item.skill}
                className="p-3.5 rounded-xl bg-[#0c0f18] border border-rose-500/30 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-rose-300 font-mono">{item.skill}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold">
                    {item.status}
                  </span>
                </div>
                {item.reason && (
                  <p className="text-[11px] text-slate-400">
                    {item.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Biggest Gaps & Recommended Next Steps */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
          <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-amber-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Biggest gaps to target
          </h2>
          <ul className="space-y-2">
            {deepDive.biggestGaps.map((gap, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-center gap-2 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
          <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-cyan-300 mb-3 flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-cyan-400" />
            Recommended next steps
          </h2>
          <ul className="space-y-2">
            {deepDive.recommendedNextSteps.map((step, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Bottom CTA Bar */}
      <div className="mt-10 p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-950/80 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white">
            Ready to calibrate your career plan around {targetRole}?
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            We will generate your personalized week-by-week curriculum, daily code labs, and milestone assessments.
          </p>
        </div>

        <button
          type="button"
          onClick={handleBuildCareerPlan}
          disabled={buildingPlan}
          className="btn-gradient !py-3.5 !px-8 !text-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-indigo-500/20 disabled:opacity-50"
        >
          {buildingPlan ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Building Career Plan...</span>
            </>
          ) : (
            <>
              <span>Build My Career Plan</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </main>
  );
}

export default function RoleDeepDivePage({ params }: PageProps) {
  const unwrappedParams = use(params);

  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 relative selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="bg-mesh-glow" />
      <div className="fixed inset-0 bg-grid-tech pointer-events-none opacity-40 z-0" />

      <Navbar />

      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto px-6 py-20 text-center font-mono text-xs text-slate-400">
            Loading role deep dive...
          </div>
        }
      >
        <RoleDeepDiveContent roleSlug={unwrappedParams.role} />
      </Suspense>
    </div>
  );
}
