"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  Upload,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";
import { CareerDiscoveryMatch, StructuredCareerProfile } from "@/types";
import { slugifyRole } from "@/lib/ai/career-fit";

function CareerFitContent() {
  const router = useRouter();

  const [hasExistingResume, setHasExistingResume] = useState(false);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [useExisting, setUseExisting] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [error, setError] = useState("");

  const [matches, setMatches] = useState<CareerDiscoveryMatch[] | null>(null);
  const [careerProfile, setCareerProfile] = useState<StructuredCareerProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  // Check if candidate already has an existing resume
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

  async function handleAnalyze() {
    if (!file && !useExisting) {
      setError("Please select your existing resume or upload a file.");
      return;
    }

    setLoading(true);
    setError("");
    setLoadingStage("Extracting verified resume evidence...");

    try {
      let resumeText = "";
      let fileName = "resume.pdf";

      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/resume/analyze", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Failed to extract resume text.");
        }
        resumeText = uploadData.text;
        fileName = file.name;
      } else {
        const profRes = await fetch("/api/profile");
        const profData = await profRes.json();
        if (!profRes.ok || !profData.analysis?.resumeText) {
          throw new Error("Could not find saved resume text. Please upload a new file.");
        }
        resumeText = profData.analysis.resumeText;
        fileName = profData.analysis.fileName || "existing-resume.pdf";
      }

      setLoadingStage("Evaluating profile alignment across tech specializations...");
      const fitRes = await fetch("/api/career/fit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: resumeText,
          fileName,
        }),
      });

      const fitData = await fitRes.json();
      if (!fitRes.ok) {
        throw new Error(fitData.error || "Role recommendation matching failed.");
      }

      setMatches(fitData.matches || []);
      setCareerProfile(fitData.profile || null);
      if (fitData.matches && fitData.matches.length > 0) {
        setSelectedRole(fitData.matches[0].roleName);
      }
    } catch (err) {
      console.error("Career fit error:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze career fit.");
    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  }

  function handleSelectRole(roleName: string) {
    const slug = slugifyRole(roleName);
    router.push(`/career-fit/${slug}`);
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-24 relative z-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-300 mb-3">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          Path B &middot; Role Discovery &amp; Fit Analysis
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Help me find the right role
        </h1>

        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
          Upload your resume and let the AI extract your factual capabilities, project evidence, and coursework to recommend your strongest industry tracks.
        </p>

        {/* IMPORTANT DISCLAIMER BANNER */}
        <div className="mt-5 p-4 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 backdrop-blur-md flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-white block mb-0.5">
              Transparent Alignment Metrics
            </span>
            These match percentages represent <strong className="text-cyan-300">current profile alignment based on available evidence</strong> in your resume. They are <strong className="text-white">NOT</strong> a hiring probability or guarantee of employment.
          </div>
        </div>
      </div>

      {/* STEP 1: Upload or Select Existing Resume (if no matches yet) */}
      {!matches && (
        <div className="space-y-6 max-w-3xl">
          {/* Saved Resume Option */}
          {hasExistingResume && (
            <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Use saved resume: {existingFileName || "resume.pdf"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Fast evaluation using your existing saved profile evidence.
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
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer ${
                  useExisting && !file
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]"
                }`}
              >
                Use Saved Resume
              </button>
            </div>
          )}

          {/* Upload New Box */}
          <label className="block cursor-pointer group">
            <div
              className={`rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
                file
                  ? "border-cyan-500/60 bg-cyan-500/5"
                  : useExisting
                  ? "border-white/[0.12] bg-white/[0.01] opacity-75 hover:opacity-100"
                  : "border-white/[0.16] bg-white/[0.02] hover:border-cyan-500/60 hover:bg-white/[0.04]"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                {file ? (
                  <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                ) : (
                  <Upload className="w-6 h-6 text-cyan-400" />
                )}
              </div>

              <h3 className="text-base font-semibold text-white">
                {file
                  ? file.name
                  : useExisting
                  ? "Or choose another resume file to upload"
                  : "Choose or drag your resume here"}
              </h3>

              <p className="text-xs text-slate-400 mt-2 font-mono">
                PDF or DOCX &middot; Max 5 MB &middot; Text parsed securely
              </p>

              <input
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) {
                    if (selected.size > 5 * 1024 * 1024) {
                      setError("File size must be under 5 MB.");
                      return;
                    }
                    setFile(selected);
                    setUseExisting(false);
                    setError("");
                  }
                }}
              />
            </div>
          </label>

          {error && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-4 pt-4">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading || (!file && !useExisting)}
              className="btn-gradient !py-3.5 !px-8 !text-sm flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{loadingStage || "Analyzing Capabilities..."}</span>
                </>
              ) : (
                <>
                  <span>Find My Best Roles</span>
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
        </div>
      )}

      {/* STEP 2: Recommended Roles Display */}
      {matches && (
        <div className="space-y-8 animate-fade-in">
          {/* Candidate Profile Summary */}
          {careerProfile && (
            <div className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Education Track</span>
                  <span className="font-semibold text-white">
                    {careerProfile.degree} &middot; {careerProfile.branch}
                  </span>
                </div>
                <div className="h-6 w-px bg-white/[0.08] hidden sm:block" />
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Detected Languages</span>
                  <span className="font-semibold text-cyan-300">
                    {careerProfile.programmingLanguages.slice(0, 4).join(", ") || "General Foundations"}
                  </span>
                </div>
                <div className="h-6 w-px bg-white/[0.08] hidden sm:block" />
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Demonstrated Skills</span>
                  <span className="font-semibold text-emerald-400">
                    {careerProfile.technicalSkills.filter((s) => s.status === "DEMONSTRATED").length} verified
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMatches(null)}
                className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Upload different resume</span>
              </button>
            </div>
          )}

          {/* Ranked Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {matches.map((role) => {
              const badgeColors = {
                STRONG_FIT: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
                PREPARE: "bg-amber-500/20 text-amber-300 border-amber-500/40",
                EXPLORE: "bg-purple-500/20 text-purple-300 border-purple-500/40",
              }[role.recommendation] || "bg-slate-500/20 text-slate-300 border-slate-500/40";

              return (
                <div
                  key={role.roleName}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6 flex flex-col justify-between hover:border-cyan-500/40 transition-all group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {role.roleName}
                      </h3>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${badgeColors}`}>
                        {role.recommendation.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Alignment Percentage */}
                    <div className="mb-4">
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-xs font-mono text-slate-400">Profile Alignment</span>
                        <span className="text-2xl font-extrabold font-mono bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                          {role.matchPercentage}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            role.matchPercentage >= 75
                              ? "bg-gradient-to-r from-emerald-500 to-cyan-400"
                              : role.matchPercentage >= 50
                              ? "bg-gradient-to-r from-cyan-500 to-indigo-400"
                              : "bg-gradient-to-r from-purple-500 to-amber-400"
                          }`}
                          style={{ width: `${role.matchPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Why it matches */}
                    <div className="space-y-1.5 mb-3.5">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Why this matches:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {role.whyItMatches.slice(0, 4).map((item, idx) => (
                          <span
                            key={`${item}-${idx}`}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          >
                            ✓ {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Skill Gaps */}
                    <div className="space-y-1.5 mb-5">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Key gaps to prepare:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {role.skillGaps.slice(0, 3).map((item, idx) => (
                          <span
                            key={`${item}-${idx}`}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          >
                            ⚠ {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-white/[0.06] flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectRole(role.roleName)}
                      className="w-full btn-gradient !py-2.5 !text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Deep Dive &amp; Build Plan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}

export default function CareerFitPage() {
  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 relative selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="bg-mesh-glow" />
      <div className="fixed inset-0 bg-grid-tech pointer-events-none opacity-40 z-0" />

      <Navbar />

      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto px-6 py-20 text-center font-mono text-xs text-slate-400">
            Loading career fit engine...
          </div>
        }
      >
        <CareerFitContent />
      </Suspense>
    </div>
  );
}
