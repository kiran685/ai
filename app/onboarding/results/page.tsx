"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Trophy,
  Target,
  Sparkles,
  HelpCircle,
  Award,
} from "lucide-react";

import { SkillMatch, CareerAnalysis as AnalysisResult, CombinedSkillEvaluation, SkillCategory } from "@/types";
import Navbar from "@/app/components/Navbar";
import OnboardingProgress from "@/app/components/OnboardingProgress";
import { isFeatureEnabled } from "@/lib/featureFlags";

function categorizeSkills(skills: SkillMatch[] = []): CombinedSkillEvaluation[] {
  return skills.map((s) => {
    const resumeConf = s.confidence;

    let category: SkillCategory = "developing";
    let label = "Developing Skill";
    let description = "Basic exposure found, requires practice.";

    if (resumeConf === "strong") {
      category = "strong";
      label = "Strong — Backed by Resume Experience";
      description = "Demonstrated with substantial work experience, projects, or clear evidence in your resume.";
    } else if (resumeConf === "weak") {
      category = "needs_work";
      label = "Needs Work — Mentioned with Minimal Context";
      description = "Listed in skills or brief mention without deep context. Needs hands-on projects.";
    } else {
      category = "true_gap";
      label = "True Gap — Not Found in Resume";
      description = "Essential skill not found in your resume. High priority target for your learning roadmap.";
    }

    return {
      skill: s.skill,
      resumeConfidence: resumeConf,
      quizConfidence: "none",
      category,
      label,
      description,
    };
  });
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const career = searchParams.get("career") || "";

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFeatureEnabled("NEW_ONBOARDING_FLOW", { searchParams })) {
      const careerQuery = career ? `&career=${encodeURIComponent(career)}` : "";
      router.replace(`/onboarding?step=3${careerQuery}`);
      return;
    }

    async function loadAnalysis() {
      try {
        const response = await fetch("/api/profile");
        const data = await response.json();
        if (data.success && data.analysis) {
          setResult(data.analysis as AnalysisResult);
        } else {
          router.push("/onboarding");
        }
      } catch (err) {
        console.error("Failed to load profile analysis:", err);
        router.push("/onboarding");
      } finally {
        setLoading(false);
      }
    }

    loadAnalysis();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <div className="text-center py-20">
          <Sparkles className="w-5 h-5 mx-auto mb-3 animate-pulse text-indigo-400" />
          <p className="font-mono text-xs text-slate-400">
            Synthesizing skill alignment report...
          </p>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const score = result.alignmentScore || 0;
  const studentProfile = result.studentSkillProfile;
  const combinedEvaluations = categorizeSkills(result.skills);
  const strongSkills = studentProfile
    ? studentProfile.strongSkills.map((s) => ({ skill: s.skill, category: "strong" as const }))
    : combinedEvaluations.filter((c) => c.category === "strong");
  const needsWork = studentProfile
    ? studentProfile.developingSkills.map((s) => ({ skill: s.skill, category: "needs_work" as const }))
    : combinedEvaluations.filter((c) => c.category === "needs_work");
  const trueGaps = studentProfile
    ? [...studentProfile.weakSkills, ...studentProfile.missingSkills].map((s) => ({ skill: s.skill, category: "true_gap" as const }))
    : combinedEvaluations.filter((c) => c.category === "true_gap");

  const foundSkillsCount = studentProfile 
    ? studentProfile.skills.filter((s) => s.status === "STRONG" || s.status === "DEVELOPING").length 
    : (result.skills || []).filter((s) => s.found).length;
  const totalSkillsCount = studentProfile ? studentProfile.skills.length : (result.skills || []).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-24">
      <OnboardingProgress
        step={2}
        totalSteps={3}
        label="Resume Score & Skill Gap Analysis"
        icon={Trophy}
      />

      <section>
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[11px] font-mono text-indigo-300 mb-3">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          Step 2: Resume Audit &amp; Skill Gaps
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          Resume Skill Fit Report
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
          We analyzed your resume against the industry requirements for{" "}
          <span className="font-semibold text-white">
            {career || result.targetRole}
          </span>{" "}
          to map your verified strengths and targeted gaps.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Resume Alignment Score</h2>
          </div>
          <span className="badge-tech badge-tech-indigo">
            {career || result.targetRole}
          </span>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
            {score}%
          </span>
          <span className="text-xs sm:text-sm text-slate-400 font-medium">
            career alignment ({foundSkillsCount}/{totalSkillsCount} core skills detected)
          </span>
        </div>

        <div className="mt-5 h-2 bg-white/[0.08] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full transition-all duration-700"
            style={{ width: `${score}%` }}
          />
        </div>
      </section>

      {/* Breakdown grids */}
      <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Strong Skills */}
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-white">
                Verified Strengths ({strongSkills.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">Backed by Evidence</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Demonstrated with substantial work experience, projects, or clear evidence in your resume.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {strongSkills.map((s) => (
              <span
                key={s.skill}
                className="px-2.5 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30"
              >
                {s.skill}
              </span>
            ))}
            {strongSkills.length === 0 && (
              <span className="text-xs text-slate-500 italic">None detected</span>
            )}
          </div>
        </div>

        {/* Needs Work / Developing */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold text-white">
                Developing Skills ({needsWork.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-amber-400">Needs Hands-On Practice</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Basic exposure found. Requires structured coding practice to reach production level.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {needsWork.map((s) => (
              <span
                key={s.skill}
                className="px-2.5 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30"
              >
                {s.skill}
              </span>
            ))}
            {needsWork.length === 0 && (
              <span className="text-xs text-slate-500 italic">None detected</span>
            )}
          </div>
        </div>

        {/* True Gaps */}
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-semibold text-white">
                True Skill Gaps ({trueGaps.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-rose-400">Roadmap Priority</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Essential skills not found on your resume. High priority target for your adaptive learning roadmap.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {trueGaps.map((s) => (
              <span
                key={s.skill}
                className="px-2.5 py-0.5 text-xs font-medium bg-rose-500/20 text-rose-300 rounded-full border border-rose-500/30"
              >
                {s.skill}
              </span>
            ))}
            {trueGaps.length === 0 && (
              <span className="text-xs text-slate-500 italic">None detected</span>
            )}
          </div>
        </div>
      </section>

      {/* Summary */}
      {result.summary && (
        <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Strategic Fit Summary</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {result.summary}
          </p>
        </section>
      )}

      <div className="mt-8 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-white">
              Personalize your adaptive learning roadmap
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Set your target timeframe, weekly study hours, and domain focus. Daily missions will adjust based on your continuous practice and assessment results.
            </p>
          </div>
        </div>
      </div>

      <section className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => router.push(`/onboarding/roadmap-questions?career=${encodeURIComponent(career || result.targetRole)}`)}
          className="flex-1 btn-gradient !py-3 !text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Next: Personalize Your Learning Roadmap</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => router.push("/onboarding")}
          className="sm:w-auto btn-subtle !py-3 !px-6 !text-sm flex items-center justify-center cursor-pointer"
        >
          Start Over
        </button>
      </section>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 relative selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="bg-mesh-glow" />
      <div className="fixed inset-0 bg-grid-tech pointer-events-none opacity-40 z-0" />

      <Navbar />

      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto px-6 py-20 text-center font-mono text-xs text-slate-400">
            Loading analysis results...
          </div>
        }
      >
        <ResultsContent />
      </Suspense>
    </div>
  );
}
