"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  AlertCircle,
  Sparkles,
  Compass,
  Target,
  Clock,
  Calendar,
  Layers,
  Code2,
  Award,
  Zap,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";
import { useOnboardingProgress, ONBOARDING_STEPS } from "@/hooks/useOnboardingProgress";
import { CareerDiscoveryMatch, StructuredCareerProfile, WeekOverview } from "@/types";

const SAMPLE_RESUME_TEXT = `
Rahul Sharma
B.Tech in Computer Science and Engineering, 2024
Skills: JavaScript, TypeScript, React, Next.js, Node.js, HTML5, CSS3, Tailwind CSS, PostgreSQL, Docker, Git
Projects:
- E-Commerce Web Platform: Built responsive full-stack platform with Next.js, Tailwind CSS, and Node.js.
  Integrated RESTful API endpoints for catalog search and PostgreSQL database models.
- Real-Time Chat Engine: Architected WebSocket server with Node.js and Redis pub/sub.
Internship:
- Software Engineer Intern at TechNova: Built frontend components in React and optimized Core Web Vitals.
`;

function OnboardingWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    currentStep,
    steps,
    draftData,
    isHydrated,
    isSaving,
    goToStep,
    completeOnboarding,
    setDraftData,
  } = useOnboardingProgress();

  // -------------------------------------------------------------
  // Step 1: Resume Upload State
  // -------------------------------------------------------------
  const [file, setFile] = useState<File | null>(null);
  const [resumeTextInput, setResumeTextInput] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");

  // -------------------------------------------------------------
  // Step 2: AI Analysis Simulation & Real Request State
  // -------------------------------------------------------------
  const [analysisPhase, setAnalysisPhase] = useState<number>(0);
  const analysisPhases = [
    "Extracting skills & technical competencies...",
    "Matching roles against canonical benchmarks...",
    "Calculating gaps: User capabilities vs target criteria...",
    "Calibrating personalized career roadmap...",
  ];

  // Prevent accidental tab closure mid-wizard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentStep > 1 && currentStep < 5) {
        e.preventDefault();
        e.returnValue = "You're only a couple minutes away from your tailored roadmap! Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [currentStep]);

  // -------------------------------------------------------------
  // Step 3 & 4: Selected Role State (Respect URL career parameter)
  // -------------------------------------------------------------
  const careerParam = searchParams.get("career") || searchParams.get("targetRole") || "";
  const initialRole = careerParam || draftData.targetRole || "Software Engineer";

  const [selectedRole, setSelectedRole] = useState<string>(initialRole);
  const [targetRoleConfirmed, setTargetRoleConfirmed] = useState<string>(initialRole);

  const [currentLevel, setCurrentLevel] = useState<string>(
    draftData.questionnaireAnswers?.currentLevel || "Intermediate Builder"
  );
  const [preferredLanguage, setPreferredLanguage] = useState<string>(
    draftData.questionnaireAnswers?.preferredLanguage || "JavaScript / TypeScript"
  );
  const [hoursPerDay, setHoursPerDay] = useState<string>(
    draftData.questionnaireAnswers?.hoursPerDay || "2-3 Hours/Day"
  );
  const [timelineWeeks, setTimelineWeeks] = useState<number>(
    draftData.questionnaireAnswers?.timelineWeeks || 8
  );
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState<boolean>(false);

  const [discoveryMatches, setDiscoveryMatches] = useState<CareerDiscoveryMatch[]>(
    draftData.discoveryMatches || []
  );
  const [isAnalysisComplete, setIsAnalysisComplete] = useState<boolean>(false);
  const [generatedWeeks, setGeneratedWeeks] = useState<WeekOverview[]>(
    draftData.roadmapWeeks || []
  );
  const [agentSummary, setAgentSummary] = useState<any>(
    draftData.agentSummary || null
  );

  // Existing resume from profile
  const [existingResumeInfo, setExistingResumeInfo] = useState<{
    hasResume: boolean;
    fileName: string | null;
    characters: number | null;
  } | null>(null);

  useEffect(() => {
    async function checkExisting() {
      try {
        const res = await fetch("/api/profile/status");
        if (res.ok) {
          const data = await res.json();
          if (data.hasResume) {
            setExistingResumeInfo({
              hasResume: true,
              fileName: data.resumeFileName,
              characters: data.resumeCharacters,
            });
          }
          if (!careerParam && data.targetRole) {
            setSelectedRole(data.targetRole);
            setTargetRoleConfirmed(data.targetRole);
          }
        }
      } catch (e) {
        console.warn("Could not check existing resume status:", e);
      }
    }
    checkExisting();
  }, [careerParam]);

  // Sync selectedRole if searchParams or draftData updates
  useEffect(() => {
    const roleFromUrl = searchParams.get("career") || searchParams.get("targetRole");
    if (roleFromUrl) {
      setSelectedRole(roleFromUrl);
      setTargetRoleConfirmed(roleFromUrl);
      setDraftData((prev) => {
        if (prev.targetRole === roleFromUrl) return prev;
        return { ...prev, targetRole: roleFromUrl };
      });
    } else if (draftData.targetRole && draftData.targetRole !== selectedRole) {
      setSelectedRole(draftData.targetRole);
      setTargetRoleConfirmed(draftData.targetRole);
    }
  }, [searchParams, draftData.targetRole, selectedRole, setDraftData]);

  async function handleUseExistingResume() {
    setIsUploading(true);
    setUploadError("");
    try {
      const profRes = await fetch("/api/profile");
      const profData = await profRes.json();
      if (profRes.ok && profData.analysis?.resumeText) {
        const text = profData.analysis.resumeText;
        const fileName = profData.analysis.fileName || existingResumeInfo?.fileName || "saved_resume.pdf";
        handleStartAnalysis(text, fileName);
      } else {
        setUploadError("Could not retrieve saved resume. Please upload a new file.");
        setIsUploading(false);
      }
    } catch (err) {
      setUploadError("Failed to load saved resume.");
      setIsUploading(false);
    }
  }

  // -------------------------------------------------------------
  // Action: Step 1 -> Analyze Resume (triggers Step 2)
  // -------------------------------------------------------------
  async function handleStartAnalysis(resumeTextOverride?: string, fileNameOverride?: string) {
    const textToUse = resumeTextOverride || resumeTextInput;
    if (!file && !textToUse.trim()) {
      setUploadError("Please select a resume file or use the sample resume.");
      return;
    }

    setUploadError("");
    setIsUploading(true);
    goToStep(2); // Move to animated analysis step

    // Cycle through visual phases
    const phaseInterval = setInterval(() => {
      setAnalysisPhase((prev) => (prev < 3 ? prev + 1 : prev));
    }, 700);

    try {
      let extracted = textToUse;
      let fName = fileNameOverride || file?.name || "resume.txt";
      let charCount = textToUse.length;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/resume/analyze", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Failed to process resume file");
        }
        extracted = uploadData.text;
        charCount = uploadData.characters;
        fName = file.name;
      }

      // Call Career Discovery Engine
      const discoveryRes = await fetch("/api/career/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: extracted,
          fileName: fName,
        }),
      });

      const discoveryData = await discoveryRes.json();
      if (!discoveryRes.ok) {
        throw new Error(discoveryData.error || "Discovery analysis failed");
      }

      const matches: CareerDiscoveryMatch[] = discoveryData.matches || [];
      
      // PRESERVE the user's calibrated role (e.g. Quantum Physics) instead of overwriting with default
      const userChosenRole = careerParam || targetRoleConfirmed || draftData.targetRole;
      const effectiveRole = userChosenRole && userChosenRole !== "Full Stack Developer"
        ? userChosenRole
        : (discoveryData.topRole || matches[0]?.roleName || "Software Engineer");

      // Inject the user's chosen role at the top of the matches if not already present
      const hasChosenInMatches = matches.some((m) => m.roleName.toLowerCase() === effectiveRole.toLowerCase());
      const finalMatches: CareerDiscoveryMatch[] = hasChosenInMatches
        ? matches
        : [
            {
              roleName: effectiveRole,
              matchPercentage: 92,
              recommendation: "STRONG_FIT",
              summary: `Custom curriculum calibrated directly for your chosen ${effectiveRole} pathway.`,
              whyItMatches: ["Target role explicitly designated", "Core competencies and skills analyzed"],
              strengths: ["Domain Commitment", "Fundamental Technical Aptitude"],
              skillGaps: ["Foundations & Core Principles", "Applied System Competencies", "Interview Benchmarks"],
            },
            ...matches,
          ];

      setSelectedRole(effectiveRole);
      setTargetRoleConfirmed(effectiveRole);
      setDiscoveryMatches(finalMatches);

      // Persist profile snapshot
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: extracted,
          fileName: fName,
          characters: charCount,
          careerProfile: discoveryData.careerProfile,
          discoveryMatches: finalMatches,
          targetRole: effectiveRole,
        }),
      }).catch((e) => console.warn("Profile sync error:", e));

      // Mark all phases complete and indicate readiness
      clearInterval(phaseInterval);
      setAnalysisPhase(4);
      setIsAnalysisComplete(true);

      // Give user time to see the verified checks before auto-advancing to Step 3
      await new Promise((r) => setTimeout(r, 1400));

      // Advance sequentially to Step 3
      goToStep(3, {
        resumeText: extracted,
        resumeFileName: fName,
        resumeCharacters: charCount,
        discoveryMatches: finalMatches,
        careerProfile: discoveryData.careerProfile,
        targetRole: effectiveRole,
      });
    } catch (err: any) {
      clearInterval(phaseInterval);
      setUploadError(err.message || "An error occurred during resume analysis.");
      goToStep(1); // Return to step 1 on failure
    } finally {
      setIsUploading(false);
    }
  }

  // Quick action: use sample resume
  function handleUseSampleResume() {
    setResumeTextInput(SAMPLE_RESUME_TEXT.trim());
    handleStartAnalysis(SAMPLE_RESUME_TEXT.trim(), "Sample_FullStack_Resume.txt");
  }

  // -------------------------------------------------------------
  // Action: Step 3 -> Confirm Role & Advance to Step 4
  // -------------------------------------------------------------
  function handleRoleSelected(role: string) {
    setSelectedRole(role);
    setTargetRoleConfirmed(role);
    goToStep(4, { targetRole: role });
  }

  // -------------------------------------------------------------
  // Action: Step 4 -> Generate Roadmap & Advance to Step 5
  // -------------------------------------------------------------
  async function handleGenerateRoadmap() {
    setIsGeneratingRoadmap(true);

    const answersPayload = {
      targetRole: targetRoleConfirmed,
      currentLevel,
      preferredLanguage,
      hoursPerDay,
      timelineWeeks,
    };

    try {
      const res = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          career: targetRoleConfirmed,
          answers: answersPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate customized roadmap");
      }

      // Update server profile with generated roadmap
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: targetRoleConfirmed,
          roadmapData: { weeks: data.weeks },
          agentPlanSummary: data.agentSummary,
          questionnaireAnswers: answersPayload,
        }),
      }).catch((e) => console.warn("Profile update error:", e));

      setGeneratedWeeks(data.weeks);
      setAgentSummary(data.agentSummary);

      goToStep(5, {
        targetRole: targetRoleConfirmed,
        questionnaireAnswers: answersPayload,
        roadmapWeeks: data.weeks,
        agentSummary: data.agentSummary,
      });
    } catch (err) {
      console.error("Roadmap generation error:", err);
      // Fallback: Proceed to step 5 with standard curriculum
      goToStep(5, {
        targetRole: targetRoleConfirmed,
        questionnaireAnswers: answersPayload,
      });
    } finally {
      setIsGeneratingRoadmap(false);
    }
  }

  // -------------------------------------------------------------
  // Action: Step 5 -> Commit and Start Learning
  // -------------------------------------------------------------
  async function handleFinishAndLaunch() {
    await completeOnboarding(targetRoleConfirmed, {
      completedAt: new Date().toISOString(),
      timelineWeeks,
    });
  }

  const matches: CareerDiscoveryMatch[] =
    discoveryMatches.length > 0 ? discoveryMatches : draftData.discoveryMatches || [];
  const weeks: WeekOverview[] =
    generatedWeeks.length > 0 ? generatedWeeks : draftData.roadmapWeeks || [];

  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 relative selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="bg-mesh-glow" />
      <div className="fixed inset-0 bg-grid-tech pointer-events-none opacity-40 z-0" />

      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-24 relative z-10">
        {/* ========================================================= */}
        {/* Step Indicator & Progress Header                           */}
        {/* ========================================================= */}
        <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {currentStep > 1 && currentStep !== 2 && (
                <button
                  onClick={() => goToStep(currentStep - 1)}
                  className="p-1.5 rounded-lg border border-white/[0.1] bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                  title="Previous Step"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-400">
                  Step {currentStep} of 5
                </span>
                <h2 className="text-sm sm:text-base font-bold text-white">
                  {steps[currentStep - 1]?.name}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-mono">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>You&apos;re {currentStep * 20}% done &ndash; ~{Math.max(1, 6 - currentStep)} min left</span>
              </div>
              {isSaving && (
                <span className="text-[11px] font-mono text-slate-500 animate-pulse hidden sm:inline">
                  Saving draft...
                </span>
              )}
              <span className="text-xs font-mono text-indigo-300 font-bold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                {currentStep * 20}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>

          {/* Mobile Progress Nudge */}
          <div className="sm:hidden flex items-center justify-between text-[11px] font-mono text-emerald-400 mt-2 px-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>~{Math.max(1, 6 - currentStep)} min left</span>
            </span>
            <span className="text-slate-400">Step {currentStep} of 5</span>
          </div>

          {/* Step Breadcrumbs */}
          <div className="hidden sm:grid grid-cols-5 gap-2 mt-3 text-center">
            {steps.map((s) => {
              const isCompleted = s.step < currentStep;
              const isCurrent = s.step === currentStep;
              return (
                <div
                  key={s.step}
                  className={`text-[11px] font-mono truncate transition-colors ${
                    isCurrent
                      ? "text-indigo-300 font-bold"
                      : isCompleted
                      ? "text-slate-400"
                      : "text-slate-600"
                  }`}
                >
                  {s.step}. {s.shortName}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* STEP 1: RESUME UPLOAD                                     */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <section className="animate-fade-in space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-mono text-indigo-300 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Resume-First Career Acceleration
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Upload your resume to discover your career readiness
              </h1>
              <p className="text-slate-400 text-sm sm:text-base mt-2">
                We extract your technical skills, benchmark your current competencies, and construct a personalized sprint roadmap.
              </p>
            </div>

            {targetRoleConfirmed && (
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-300">Target Role Calibrated:</span>
                  <span className="badge-tech badge-tech-indigo font-bold">{targetRoleConfirmed}</span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/target")}
                  className="text-xs font-mono text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                >
                  Change role
                </button>
              </div>
            )}

            {existingResumeInfo?.hasResume && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-white">
                      Saved resume found: <span className="font-mono text-emerald-300">{existingResumeInfo.fileName}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      You can use this existing profile resume immediately or upload a new file below.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUseExistingResume}
                  className="btn-gradient !py-2 !px-4 !text-xs whitespace-nowrap cursor-pointer"
                >
                  Use Existing Resume
                </button>
              </div>
            )}

            {uploadError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Drag & Drop File Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) setFile(dropped);
              }}
              className="rounded-2xl border-2 border-dashed border-white/[0.15] hover:border-indigo-500/50 bg-white/[0.01] hover:bg-white/[0.03] transition-all p-8 sm:p-12 text-center cursor-pointer relative group"
            >
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) setFile(selected);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />

              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform text-indigo-400">
                <Upload className="w-7 h-7" />
              </div>

              {file ? (
                <div>
                  <p className="text-sm font-semibold text-white flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {(file.size / 1024).toFixed(1)} KB • Ready for deep analysis
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-base font-semibold text-white">
                    Drag and drop your resume file here
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports PDF, DOCX, or TXT (Max 10MB)
                  </p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => handleStartAnalysis()}
                disabled={!file && !resumeTextInput.trim()}
                className="w-full sm:flex-1 btn-gradient !py-3 !text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Analyze Resume & Discover Roles</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleUseSampleResume}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-mono transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Use Sample Resume</span>
              </button>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* STEP 2: AI ANALYSIS LOADING STATE (AUTO-ADVANCES)          */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <section className="animate-fade-in py-12 text-center max-w-md mx-auto space-y-6">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
              <div className="w-24 h-24 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Auditing Your Engineering Profile
              </h2>
              <p className="text-xs font-mono text-slate-400 mt-2">
                Synthesizing semantic skill nodes with market benchmarks
              </p>
            </div>

            {/* Step-by-step progress checklist */}
            <div className="space-y-2 text-left rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              {analysisPhases.map((phase, idx) => {
                const isPast = idx < analysisPhase;
                const isCurrent = idx === analysisPhase;
                return (
                  <div key={phase} className="flex items-center gap-3 text-xs">
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 rounded-full border border-indigo-400 border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/[0.15] shrink-0" />
                    )}
                    <span
                      className={
                        isCurrent
                          ? "text-indigo-300 font-semibold"
                          : isPast
                          ? "text-slate-300"
                          : "text-slate-600"
                      }
                    >
                      {phase}
                    </span>
                  </div>
                );
              })}
            </div>

            {isAnalysisComplete && (
              <div className="pt-2 animate-fade-in space-y-3">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Analysis complete! Calibrated for {targetRoleConfirmed}.</span>
                </div>
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="btn-gradient w-full !py-3 !text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20"
                >
                  <span>Continue to Step 3: Discovery Fit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </section>
        )}

        {/* ========================================================= */}
        {/* STEP 3: CAREER DISCOVERY FIT MATRIX                       */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <section className="animate-fade-in space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-mono text-indigo-300 mb-3">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                Discovery Matrix
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Top Career Pathways For Your Profile
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Select your primary target role. We will calibrate your entire milestone curriculum to bridge its specific gaps.
              </p>
            </div>

            {/* Role Match Cards */}
            <div className="space-y-3">
              {matches.length > 0 ? (
                matches.map((match) => {
                  const isSelected = selectedRole === match.roleName;
                  return (
                    <div
                      key={match.roleName}
                      onClick={() => setSelectedRole(match.roleName)}
                      className={`rounded-2xl border p-5 transition-all cursor-pointer ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                          : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-white">{match.roleName}</h3>
                            <span
                              className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                                match.matchPercentage >= 75
                                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                  : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                              }`}
                            >
                              {match.recommendation}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{match.summary || "Recommended role for your skillset."}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-2xl font-black text-white">
                            {match.matchPercentage}%
                          </span>
                          <span className="block text-[10px] font-mono text-slate-500 uppercase">
                            Fit Score
                          </span>
                        </div>
                      </div>

                      {/* Why it matches & skill gaps */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/[0.06] text-xs">
                        <div>
                          <span className="font-semibold text-emerald-400 flex items-center gap-1 mb-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Strengths Found:
                          </span>
                          <p className="text-slate-300">
                            {match.whyItMatches?.slice(0, 2).join(" • ") || "Relevant foundational skills"}
                          </p>
                        </div>
                        <div>
                          <span className="font-semibold text-amber-400 flex items-center gap-1 mb-1">
                            <Target className="w-3.5 h-3.5" /> Key Focus Gaps:
                          </span>
                          <p className="text-slate-300">
                            {match.skillGaps?.slice(0, 3).join(", ") || "Advanced architectural patterns"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Fallback standard roles if no matches cached
                <div className="space-y-3">
                  {[
                    targetRoleConfirmed,
                    "Full Stack Developer",
                    "Frontend Engineer",
                    "Backend Engineer",
                    "AI / ML Engineer",
                  ]
                    .filter(Boolean)
                    .filter((val, i, arr) => arr.indexOf(val) === i)
                    .map((role) => (
                    <div
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`rounded-xl border p-4 cursor-pointer transition-all ${
                        selectedRole === role
                          ? "border-indigo-500 bg-indigo-500/10 text-white"
                          : "border-white/[0.08] bg-white/[0.02] text-slate-300"
                      }`}
                    >
                      <h4 className="font-bold">{role}</h4>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => handleRoleSelected(selectedRole)}
              className="w-full btn-gradient !py-3 !text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Confirm & Configure Roadmap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </section>
        )}

        {/* ========================================================= */}
        {/* STEP 4: ROADMAP QUESTIONS & PACING                         */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <section className="animate-fade-in space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-mono text-indigo-300 mb-3">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                Curriculum Calibration
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Tailor your learning pace for {targetRoleConfirmed}
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Tell us your schedule and preferences so daily coding missions fit your life.
              </p>
            </div>

            <div className="space-y-5">
              {/* Question: Current Level */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-indigo-300 mb-3">
                  1. What is your current overall background level?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "Beginner", label: "Beginner", desc: "Starting fresh / transitioning" },
                    { id: "Intermediate", label: "Intermediate Builder", desc: "Built projects, ready for interview polish" },
                    { id: "Advanced", label: "Advanced", desc: "Targeting staff/senior patterns" },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setCurrentLevel(lvl.label)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        currentLevel === lvl.label
                          ? "border-indigo-500 bg-indigo-500/15 text-white"
                          : "border-white/[0.08] bg-white/[0.01] text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className="block text-xs font-bold text-white">{lvl.label}</span>
                      <span className="text-[11px] text-slate-400">{lvl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question: Daily Study Time */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-indigo-300 mb-3">
                  2. How much time can you commit each day?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { val: "1-2 Hours/Day", label: "1 – 2 Hours / Day", sub: "Light balanced sprint" },
                    { val: "2-3 Hours/Day", label: "2 – 3 Hours / Day", sub: "Recommended standard pace" },
                    { val: "4+ Hours/Day", label: "4+ Hours / Day", sub: "Fast-track immersion" },
                  ].map((t) => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setHoursPerDay(t.val)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        hoursPerDay === t.val
                          ? "border-indigo-500 bg-indigo-500/15 text-white"
                          : "border-white/[0.08] bg-white/[0.01] text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className="block text-xs font-bold text-white">{t.label}</span>
                      <span className="text-[11px] text-slate-400">{t.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question: Preferred Programming Language */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-indigo-300 mb-3">
                  3. Preferred language for coding labs & assessments:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    "JavaScript / TypeScript",
                    "Python 3",
                    "Java",
                    "C++",
                  ].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setPreferredLanguage(lang)}
                      className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                        preferredLanguage === lang
                          ? "border-indigo-500 bg-indigo-500/15 text-white font-bold"
                          : "border-white/[0.08] bg-white/[0.01] text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-xs">{lang}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question: Target Timeline */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-indigo-300 mb-3">
                  4. Desired Roadmap Timeline:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { weeks: 4, label: "4 Weeks", sub: "Speed review sprint" },
                    { weeks: 8, label: "8 Weeks", sub: "Optimal mastery" },
                    { weeks: 12, label: "12 Weeks", sub: "Comprehensive deep-dive" },
                  ].map((w) => (
                    <button
                      key={w.weeks}
                      type="button"
                      onClick={() => setTimelineWeeks(w.weeks)}
                      className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                        timelineWeeks === w.weeks
                          ? "border-indigo-500 bg-indigo-500/15 text-white font-bold"
                          : "border-white/[0.08] bg-white/[0.01] text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-xs block font-bold">{w.label}</span>
                      <span className="text-[10px] text-slate-400">{w.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateRoadmap}
              disabled={isGeneratingRoadmap}
              className="w-full btn-gradient !py-3 !text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGeneratingRoadmap ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Synthesizing Tailored Blueprint...</span>
                </>
              ) : (
                <>
                  <span>Generate Personalized Roadmap</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </section>
        )}

        {/* ========================================================= */}
        {/* STEP 5: ROADMAP BLUEPRINT PREVIEW & START LEARNING        */}
        {/* ========================================================= */}
        {currentStep === 5 && (
          <section className="animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-mono text-emerald-300 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Blueprint Ready
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Your Career Acceleration Roadmap
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Calibrated for {targetRoleConfirmed} • {timelineWeeks} Weeks • {hoursPerDay}
                </p>
              </div>

              <button
                onClick={handleFinishAndLaunch}
                className="w-full sm:w-auto btn-gradient !py-3 !px-6 !text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                <span>Start Learning Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Strategic Advice Card */}
            {(agentSummary?.strategicAdvice || draftData.agentSummary?.strategicAdvice) && (
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 text-xs sm:text-sm text-indigo-200 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>{agentSummary?.strategicAdvice || draftData.agentSummary?.strategicAdvice}</p>
              </div>
            )}

            {/* Weeks Overview Cards */}
            <div className="space-y-3">
              {(weeks.length > 0 ? weeks : [
                {
                  id: "week-1",
                  weekNumber: 1,
                  title: "Week 1: Core Foundation & Systems Setup",
                  focusSkills: ["Architecture Basics", "Language Idioms"],
                  description: "Master foundational principles and establish your daily rhythm.",
                  totalDays: 5,
                },
                {
                  id: "week-2",
                  weekNumber: 2,
                  title: "Week 2: Component & Data Pipeline Mastery",
                  focusSkills: ["Data Flow", "Async Pipelines", "State"],
                  description: "Deep dive into real-world production engineering challenges.",
                  totalDays: 5,
                },
                {
                  id: "week-3",
                  weekNumber: 3,
                  title: "Week 3: Advanced Patterns & System Reliability",
                  focusSkills: ["System Design", "Scalability", "Testing"],
                  description: "Bridge interview-level system architecture expectations.",
                  totalDays: 5,
                },
              ]).map((w) => (
                <div
                  key={w.id || w.weekNumber}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        Week {w.weekNumber}:
                      </span>
                      <h4 className="text-sm font-bold text-white">{w.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{w.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {w.focusSkills?.map((skill: string) => (
                        <span
                          key={skill}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.06] shrink-0">
                    5 Daily Missions
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="pt-4 text-center">
              <button
                onClick={handleFinishAndLaunch}
                className="w-full sm:w-2/3 mx-auto btn-gradient !py-3.5 !text-base flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-indigo-500/25"
              >
                <span>Launch Your Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07080e] flex items-center justify-center text-slate-400 font-mono text-xs">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-2" />
        </div>
      }
    >
      <OnboardingWizardContent />
    </Suspense>
  );
}
