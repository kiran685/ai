"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Upload, ArrowRight, CheckCircle2, FileText, AlertCircle, Sparkles } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import OnboardingProgress from "@/app/components/OnboardingProgress";

function ResumeUploadContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const career = searchParams.get("career") || "";

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>("");
  const [error, setError] = useState("");
  const [extractedText, setExtractedText] = useState<string | null>(null);

  async function analyzeResume() {
    if (!file) return;

    setLoading(true);
    setError("");
    setExtractedText(null);
    setLoadingStage("Understanding your profile...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (career) {
        formData.append("career", career);
      }

      const response = await fetch("/api/resume/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process resume");
      }

      setExtractedText(data.text);

      if (career) {
        setLoadingStage("Analyzing your capabilities against " + career + "...");
        const analysisResponse = await fetch("/api/career/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: data.text,
            career,
          }),
        });

        const analysisData = await analysisResponse.json();

        if (!analysisResponse.ok) {
          throw new Error(analysisData.error || "Analysis failed");
        }

        const payload = {
          ...(analysisData.analysis || analysisData),
          fileName: file.name,
          characters: data.characters,
          resumeText: data.text,
          targetRole: career,
        };

        await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch((e) => console.warn("Cache profile error:", e));

        router.push(`/onboarding/roadmap-questions?career=${encodeURIComponent(career)}`);
      } else {
        setLoadingStage("Analyzing your capabilities...");
        await new Promise((r) => setTimeout(r, 600));

        setLoadingStage("Finding roles that match you...");
        const discoveryResponse = await fetch("/api/career/discovery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: data.text,
            fileName: file.name,
          }),
        });

        const discoveryData = await discoveryResponse.json();

        if (!discoveryResponse.ok) {
          throw new Error(discoveryData.error || "Career discovery matching failed");
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("career_discovery_data", JSON.stringify(discoveryData));
          localStorage.setItem("resume_extracted_text", data.text);
          localStorage.setItem("resume_file_name", file.name);
        }

        await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeText: data.text,
            fileName: file.name,
            characters: data.characters,
            careerProfile: discoveryData.careerProfile,
            discoveryMatches: discoveryData.matches,
          }),
        }).catch((e) => console.warn("Cache profile error:", e));

        router.push("/onboarding/discovery");
      }
    } catch (error) {
      console.error("RESUME FLOW ERROR:", error);
      setError(
        error instanceof Error ? error.message : "Something went wrong while analyzing your resume."
      );
    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-24">
      <OnboardingProgress
        step={2}
        totalSteps={4}
        label="Resume Tokenization"
        icon={FileText}
      />

      <section>
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[11px] font-mono text-indigo-300 mb-3">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          Step 2: Evidence Extraction
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          Upload your resume
        </h1>

        <p className="text-slate-400 text-sm sm:text-base mt-3 max-w-xl leading-relaxed">
          We&apos;ll parse your work experience, projects, languages, and tools to identify verified capabilities versus target requirements.
        </p>

        {career && (
          <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Target role calibration:
            </span>
            <span className="badge-tech badge-tech-indigo">
              {career}
            </span>
          </div>
        )}

        <label className="mt-6 block cursor-pointer group">
          <div className={`rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
            file
              ? "border-emerald-500/50 bg-emerald-500/5"
              : "border-white/[0.12] bg-white/[0.02] hover:border-indigo-500/50 hover:bg-white/[0.04]"
          }`}>
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              {file ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : (
                <Upload className="w-6 h-6 text-indigo-400" />
              )}
            </div>

            <h3 className="text-base font-semibold text-white">
              {file ? file.name : "Choose or drag your resume here"}
            </h3>

            <p className="text-xs text-slate-400 mt-2 font-mono">
              PDF or DOCX &middot; Max 5 MB &middot; Text parsed securely
            </p>

            <input
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) {
                  if (selected.size > 5 * 1024 * 1024) {
                    setError("Resume must be smaller than 5 MB.");
                    return;
                  }
                  setFile(selected);
                  setError("");
                }
              }}
            />
          </div>
        </label>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={analyzeResume}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-mono font-semibold border border-rose-500/40 cursor-pointer self-start sm:self-auto"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={analyzeResume}
            disabled={!file || loading}
            className="flex-1 btn-gradient !py-3.5 !text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed touch-target-min"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{loadingStage || "Analyzing Resume..."}</span>
              </>
            ) : (
              <>
                <span>{career ? "Analyze Resume & Proceed" : "Discover Matching Roles"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push("/onboarding")}
            className="sm:w-auto btn-subtle !py-3.5 !px-6 !text-sm flex items-center justify-center cursor-pointer touch-target-min text-slate-300 hover:text-white"
          >
            Back
          </button>
        </div>
      </section>
    </div>
  );
}

export default function LegacyResumeClient() {
  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 relative selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="bg-mesh-glow" />
      <div className="fixed inset-0 bg-grid-tech pointer-events-none opacity-40 z-0" />

      <Navbar />

      <Suspense fallback={
        <div className="max-w-4xl mx-auto px-6 py-20 text-center font-mono text-xs text-slate-400">
          Loading resume uploader...
        </div>
      }>
        <ResumeUploadContent />
      </Suspense>
    </div>
  );
}
