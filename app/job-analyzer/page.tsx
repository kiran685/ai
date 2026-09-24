"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  FileText,
  Upload,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Layers,
  Award,
  RefreshCw,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";
import { JobAnalysisResult } from "@/types";

function JobAnalyzerContent() {
  const router = useRouter();

  // Inputs
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Resume selection
  const [hasExistingResume, setHasExistingResume] = useState(false);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [useExisting, setUseExisting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // States
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingStage, setAnalyzingStage] = useState("");
  const [preparingPlan, setPreparingPlan] = useState(false);
  const [error, setError] = useState("");

  // Result state
  const [analysisResult, setAnalysisResult] = useState<JobAnalysisResult | null>(null);

  // Load existing status
  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch("/api/profile/status");
        if (res.ok) {
          const data = await res.json();
          if (data.hasResume) {
            setHasExistingResume(true);
            setExistingFileName(data.resumeFileName);
            setUseExisting(true);
          }
        }
      } catch (e) {
        console.warn("Status fetch error:", e);
      }
    }
    loadStatus();
  }, []);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) {
      setError("Please enter the company name.");
      return;
    }
    if (!jobTitle.trim()) {
      setError("Please enter the job title.");
      return;
    }
    if (jobDescription.trim().length < 20) {
      setError("Please paste the job description (at least a few sentences).");
      return;
    }
    if (!file && !useExisting) {
      setError("Please choose your saved resume or upload a resume file.");
      return;
    }

    setAnalyzing(true);
    setError("");
    setAnalyzingStage("Extracting resume evidence...");

    try {
      let resumeText = "";

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("career", jobTitle);

        const uploadRes = await fetch("/api/resume/analyze", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Failed to extract text from uploaded resume.");
        }
        resumeText = uploadData.text;
      }

      setAnalyzingStage(`Evaluating profile vs ${companyName} (${jobTitle}) requirements...`);
      const analyzeRes = await fetch("/api/job/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          jobTitle: jobTitle.trim(),
          jobDescription: jobDescription.trim(),
          resumeText,
        }),
      });

      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) {
        throw new Error(analyzeData.error || "Job opportunity analysis failed.");
      }

      setAnalysisResult(analyzeData.analysis);
    } catch (err) {
      console.error("Job analysis error:", err);
      setError(err instanceof Error ? err.message : "Opportunity analysis failed.");
    } finally {
      setAnalyzing(false);
      setAnalyzingStage("");
    }
  }

  async function handlePrepareOpportunity() {
    if (!analysisResult) return;
    setPreparingPlan(true);
    try {
      const res = await fetch("/api/job/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...analysisResult,
          jobDescription,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to prepare plan.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Prepare opportunity error:", err);
      router.push("/dashboard");
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-24 relative z-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-xs font-mono text-purple-300 mb-3">
          <Briefcase className="w-3.5 h-3.5 text-purple-400" />
          Path C &middot; Job Opportunity Analyzer
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Analyze a specific job
        </h1>

        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
          Evaluate how your profile compares against a specific job posting. Get a clear fit breakdown, critical gaps, resume alignment suggestions, and create an opportunity preparation plan.
        </p>

        {/* Clear Disclaimer */}
        <div className="mt-5 p-4 rounded-2xl border border-purple-500/20 bg-purple-950/20 backdrop-blur-md flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-white block mb-0.5">
              Transparent Alignment Metrics
            </span>
            The score represents <strong className="text-purple-300">profile vs job description alignment only</strong>. It does <strong className="text-white">NOT</strong> claim or calculate a probability of being hired.
          </div>
        </div>
      </div>

      {/* FORM INPUT STATE (shown when no result yet) */}
      {!analysisResult ? (
        <form onSubmit={handleAnalyze} className="space-y-6 max-w-3xl">
          {/* Company & Role Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="company-input"
                className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-2"
              >
                Company Name
              </label>
              <div className="relative">
                <input
                  id="company-input"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Amazon, Google, Stripe, Meta"
                  className="w-full rounded-xl border border-white/[0.12] bg-[#0c0f18] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="title-input"
                className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-2"
              >
                Job Title
              </label>
              <input
                id="title-input"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Software Development Engineer, Backend Dev"
                className="w-full rounded-xl border border-white/[0.12] bg-[#0c0f18] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Job Description Textarea */}
          <div>
            <label
              htmlFor="jd-input"
              className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-2"
            >
              Paste Job Description (Full text or requirements)
            </label>
            <textarea
              id="jd-input"
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here, including responsibilities, requirements, preferred qualifications, tech stack..."
              className="w-full rounded-2xl border border-white/[0.12] bg-[#0c0f18] p-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors font-mono leading-relaxed"
              required
            />
          </div>

          {/* Resume Source Selector */}
          <div className="space-y-4 pt-2">
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
              Resume to compare
            </label>

            {/* Saved Resume Option */}
            {hasExistingResume && (
              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-white">
                      Use saved resume: {existingFileName || "resume.pdf"}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Fast analysis using your currently saved profile resume.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUseExisting(true);
                    setFile(null);
                    setError("");
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors ${
                    useExisting && !file
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                      : "bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]"
                  }`}
                >
                  Use Saved Resume
                </button>
              </div>
            )}

            {/* Upload File */}
            <label className="block cursor-pointer group">
              <div
                className={`rounded-2xl border-2 border-dashed p-7 text-center transition-all ${
                  file
                    ? "border-purple-500/60 bg-purple-500/5"
                    : useExisting
                    ? "border-white/[0.12] bg-white/[0.01] opacity-75 hover:opacity-100"
                    : "border-white/[0.16] bg-white/[0.02] hover:border-purple-500/60 hover:bg-white/[0.04]"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  {file ? (
                    <CheckCircle2 className="w-5 h-5 text-purple-400" />
                  ) : (
                    <Upload className="w-5 h-5 text-purple-400" />
                  )}
                </div>
                <h3 className="text-sm font-semibold text-white">
                  {file
                    ? file.name
                    : useExisting
                    ? "Or choose another resume file to upload"
                    : "Upload resume (PDF or DOCX)"}
                </h3>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const sel = e.target.files?.[0];
                    if (sel) {
                      if (sel.size > 5 * 1024 * 1024) {
                        setError("Resume must be smaller than 5 MB.");
                        return;
                      }
                      setFile(sel);
                      setUseExisting(false);
                      setError("");
                    }
                  }}
                />
              </div>
            </label>
          </div>

          {error && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-4 pt-4 border-t border-white/[0.08]">
            <button
              type="submit"
              disabled={analyzing}
              className="btn-gradient !py-3.5 !px-8 !text-sm flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
            >
              {analyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{analyzingStage || "Analyzing Opportunity..."}</span>
                </>
              ) : (
                <>
                  <span>Analyze Opportunity</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push("/get-started")}
              className="text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
              &larr; Back to Entry Options
            </button>
          </div>
        </form>
      ) : (
        /* ANALYSIS RESULTS VIEW */
        <div className="space-y-8 animate-fade-in">
          {/* Top Result Header Card */}
          <section className="p-6 md:p-8 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-950/80 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-[11px] font-mono text-purple-300 mb-2">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                {analysisResult.companyName} &middot; {analysisResult.jobTitle}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Opportunity Fit Analysis
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
                {analysisResult.applicationRecommendation}
              </p>
            </div>

            {/* Score Pill */}
            <div className="p-5 rounded-2xl border border-purple-500/40 bg-purple-950/40 shrink-0 min-w-[200px] text-right">
              <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">
                Current Alignment
              </span>
              <div className="flex items-baseline justify-end gap-1.5 mt-1">
                <span className="text-5xl font-extrabold font-mono bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                  {analysisResult.fitScore}%
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-1">
                Profile vs JD Match
              </p>
            </div>
          </section>

          {/* Detailed Skill Breakdown: Strong, Developing, Missing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Strong Matches */}
            <section className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold font-mono text-emerald-300 uppercase">
                      Strong Matches
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {analysisResult.strongMatches.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {analysisResult.strongMatches.map((s) => (
                    <div
                      key={s.skill}
                      className="p-2.5 rounded-xl bg-[#0c0f18] border border-emerald-500/30 text-xs"
                    >
                      <span className="font-bold text-emerald-300 font-mono block">✓ {s.skill}</span>
                      {s.evidence && (
                        <span className="text-[10px] text-slate-400 block mt-0.5 line-clamp-2">
                          {s.evidence}
                        </span>
                      )}
                    </div>
                  ))}
                  {analysisResult.strongMatches.length === 0 && (
                    <p className="text-xs text-slate-400">No strong direct matches found.</p>
                  )}
                </div>
              </div>
            </section>

            {/* Developing */}
            <section className="p-5 rounded-2xl border border-amber-500/20 bg-amber-950/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold font-mono text-amber-300 uppercase">
                      Developing
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">
                    {analysisResult.developing.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {analysisResult.developing.map((s) => (
                    <div
                      key={s.skill}
                      className="p-2.5 rounded-xl bg-[#0c0f18] border border-amber-500/30 text-xs"
                    >
                      <span className="font-bold text-amber-300 font-mono block">⚠ {s.skill}</span>
                      {s.evidence && (
                        <span className="text-[10px] text-slate-400 block mt-0.5 line-clamp-2">
                          {s.evidence}
                        </span>
                      )}
                    </div>
                  ))}
                  {analysisResult.developing.length === 0 && (
                    <p className="text-xs text-slate-400">No developing skills noted.</p>
                  )}
                </div>
              </div>
            </section>

            {/* Missing / Not Demonstrated */}
            <section className="p-5 rounded-2xl border border-rose-500/20 bg-rose-950/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <h3 className="text-xs font-bold font-mono text-rose-300 uppercase">
                      Missing / Not Demonstrated
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-rose-400 font-bold">
                    {analysisResult.missingOrNotDemonstrated.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {analysisResult.missingOrNotDemonstrated.map((s) => (
                    <div
                      key={s.skill}
                      className="p-2.5 rounded-xl bg-[#0c0f18] border border-rose-500/30 text-xs"
                    >
                      <span className="font-bold text-rose-300 font-mono block">✗ {s.skill}</span>
                      {s.reason && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {s.reason}
                        </span>
                      )}
                    </div>
                  ))}
                  {analysisResult.missingOrNotDemonstrated.length === 0 && (
                    <p className="text-xs text-slate-400">All key JD competencies evidenced.</p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Critical Gaps & Resume Alignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Critical Gaps */}
            <section className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-amber-300 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Critical Gaps for this Opportunity
              </h3>
              <ul className="space-y-2.5">
                {analysisResult.criticalGaps.map((gap, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Resume Alignment Suggestions */}
            <section className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-purple-300 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Resume Alignment Recommendations
              </h3>
              <ul className="space-y-2.5">
                {analysisResult.resumeAlignment.map((suggestion, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* DIFFERENTIATION: Connect to Career OS Plan */}
          <section className="p-7 rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-950/90 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Connect to AI Career OS Engine
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Prepare for this opportunity: {analysisResult.companyName} — {analysisResult.jobTitle}
              </h3>
              <p className="text-xs text-slate-400 max-w-xl">
                We will store this target opportunity, align your weekly roadmap around these critical gaps, and adapt your score as you complete practice assessments.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handlePrepareOpportunity}
                disabled={preparingPlan}
                className="btn-gradient !py-3.5 !px-8 !text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {preparingPlan ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Constructing Plan...</span>
                  </>
                ) : (
                  <>
                    <span>Create Preparation Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setAnalysisResult(null)}
                className="btn-subtle !py-3.5 !px-5 !text-xs font-mono cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Analyze another job</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default function JobAnalyzerPage() {
  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 relative selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="bg-mesh-glow" />
      <div className="fixed inset-0 bg-grid-tech pointer-events-none opacity-40 z-0" />

      <Navbar />

      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto px-6 py-20 text-center font-mono text-xs text-slate-400">
            Loading job analyzer...
          </div>
        }
      >
        <JobAnalyzerContent />
      </Suspense>
    </div>
  );
}
