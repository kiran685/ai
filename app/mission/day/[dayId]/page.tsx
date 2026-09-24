"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Code2,
  BrainCircuit,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Languages,
  CheckCheck,
  Terminal,
  AlertTriangle,
  TrendingUp,
  Zap,
  Target,
  HelpCircle,
  Lightbulb,
  Clock,
  Cpu,
} from "lucide-react";
import {
  DayPlan,
  PracticeProblem,
  DayAssessmentQuestion,
  MissionStageProgress,
  WeekOverview,
  DayDiagnosticReport,
  NextMissionSuggestion,
  ReadinessScores,
  PracticeProgress,
  CodeExecutionResult,
  StructuredLearnLesson,
} from "@/types";

function YouTubeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

interface LanguageOption {
  id: string;
  name: string;
  compiler: string;
  extension: string;
  filePrefix: string;
  getStarterCode: (title: string, defaultStarter?: string) => string;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    id: "javascript",
    name: "JavaScript",
    compiler: "Node.js v20.10.0",
    extension: "js",
    filePrefix: "solution",
    getStarterCode: (title, defaultStarter) =>
      defaultStarter || `/**\n * Problem: ${title}\n * @param {any} input\n * @return {any}\n */\nfunction solve(input) {\n  // Write your solution here\n  \n}\n`,
  },
  {
    id: "python3",
    name: "Python 3",
    compiler: "Python v3.11.6",
    extension: "py",
    filePrefix: "solution",
    getStarterCode: (title) =>
      `# Problem: ${title}\ndef solve(input_data):\n    # Write your solution here\n    pass\n`,
  },
  {
    id: "typescript",
    name: "TypeScript",
    compiler: "TypeScript 5.3.3",
    extension: "ts",
    filePrefix: "solution",
    getStarterCode: (title) =>
      `// Problem: ${title}\nfunction solve(input: any): any {\n  // Write your solution here\n  return null;\n}\n`,
  },
  {
    id: "java",
    name: "Java",
    compiler: "OpenJDK 21",
    extension: "java",
    filePrefix: "Solution",
    getStarterCode: (title) =>
      `// Problem: ${title}\nclass Solution {\n    public Object solve(Object input) {\n        // Write your solution here\n        return null;\n    }\n}\n`,
  },
  {
    id: "cpp",
    name: "C++",
    compiler: "GCC 13.2 (C++20)",
    extension: "cpp",
    filePrefix: "solution",
    getStarterCode: (title) =>
      `// Problem: ${title}\n#include <iostream>\n#include <vector>\n#include <string>\n\nclass Solution {\npublic:\n    auto solve(auto input) {\n        // Write your solution here\n        \n    }\n};\n`,
  },
];

type MissionStage = "LEARN" | "PRACTICE" | "ASSESSMENT" | "RESULT";

export default function DailyMissionPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const dayId = (params?.dayId as string) || "week-1_day-1";

  // Parse week number and day number from dayId
  const match = dayId.match(/week-(\d+)_day-?(\d+)/i);
  const weekNumber = match ? parseInt(match[1], 10) : 1;
  const dayNumber = match ? parseInt(match[2], 10) : 1;

  const [stage, setStage] = useState<MissionStage>("LEARN");
  const [loading, setLoading] = useState<boolean>(true);
  const [savingStage, setSavingStage] = useState<boolean>(false);
  const [dayPlan, setDayPlan] = useState<DayPlan | null>(null);
  const [targetRole, setTargetRole] = useState<string>("Software Engineer");
  const [weekTitle, setWeekTitle] = useState<string>("Foundations");
  const [focusSkills, setFocusSkills] = useState<string[]>([]);

  // Diagnostic and Adaptive Engine state
  const [diagnosticReport, setDiagnosticReport] = useState<DayDiagnosticReport | null>(null);
  const [nextMission, setNextMission] = useState<NextMissionSuggestion | null>(null);
  const [readinessScores, setReadinessScores] = useState<ReadinessScores | null>(null);
  const [practiceProgress, setPracticeProgress] = useState<PracticeProgress | null>(null);

  // Progress state
  const [progress, setProgress] = useState<MissionStageProgress>({
    dayId,
    weekId: `week-${weekNumber}`,
    dayNumber,
    learningCompleted: false,
    practiceCompleted: false,
    assessmentCompleted: false,
    score: undefined,
    passed: false,
    weakAreas: [],
  });

  // Practice state
  const [activeProblemIdx, setActiveProblemIdx] = useState<number>(0);
  const [selectedLanguages, setSelectedLanguages] = useState<Record<number, string>>({});
  const [userCode, setUserCode] = useState<Record<string, string>>({});
  const [solvedProblems, setSolvedProblems] = useState<Record<string | number, boolean>>({});
  const [testOutput, setTestOutput] = useState<{ [key: number]: string }>({});
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // LeetCode runner & test case state
  const [runningCode, setRunningCode] = useState<Record<number, boolean>>({});
  const [executionResults, setExecutionResults] = useState<Record<number, CodeExecutionResult | null>>({});
  const [activeTestTab, setActiveTestTab] = useState<Record<number, number>>({});
  const [activeResultTab, setActiveResultTab] = useState<Record<number, "testcase" | "result">>({});
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});

  // Quick check interactive state in Learn
  const [quickCheckSelected, setQuickCheckSelected] = useState<number | null>(null);
  const [quickCheckSubmitted, setQuickCheckSubmitted] = useState<boolean>(false);

  // Assessment state
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submittedAssessment, setSubmittedAssessment] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [weakAreas, setWeakAreas] = useState<string[]>([]);
  const [skillScoreProgress, setSkillScoreProgress] = useState<{
    skillName: string;
    previousScore: number | null;
    currentScore: number | null;
    scoreImprovement: number | null;
    confidenceLevel: string;
    isMastered: boolean;
    explanation?: any;
    isDuplicate?: boolean;
  } | null>(null);

  // Copy code helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // Load Day Plan & Progress
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. Fetch Profile & Roadmap overview
        const profRes = await fetch("/api/profile");
        let profileRole = "Software Engineer";
        let currWeekTitle = `Week ${weekNumber} Foundations`;
        let skillsForWeek: string[] = ["Problem Solving", "Core Foundations"];

        if (profRes.ok) {
          const profData = await profRes.json();
          if (profData?.profile?.targetRole) {
            profileRole = profData.profile.targetRole;
            setTargetRole(profileRole);
          }
          const weeks: WeekOverview[] = profData?.profile?.roadmapData?.weeks || [];
          const matchedWeek = weeks.find((w) => w.weekNumber === weekNumber || w.id === `week-${weekNumber}`);
          if (matchedWeek) {
            currWeekTitle = matchedWeek.title;
            skillsForWeek = matchedWeek.focusSkills || [];
            setWeekTitle(currWeekTitle);
            setFocusSkills(skillsForWeek);
          }
        }

        // 2. Fetch or initialize progress
        const progRes = await fetch(`/api/mission/progress?dayId=${dayId}`);
        let initProg: MissionStageProgress | null = null;
        if (progRes.ok) {
          const pData = await progRes.json();
          if (pData?.progress) {
            initProg = pData.progress;
            setProgress(pData.progress);
            if (pData.progress.answers) {
              setAnswers(pData.progress.answers);
            }
            if (pData.progress.score !== null && pData.progress.score !== undefined) {
              setFinalScore(pData.progress.score);
            }
            if (pData.progress.weakAreas) {
              setWeakAreas(pData.progress.weakAreas);
            }
            if (pData.diagnosticReport) {
              setDiagnosticReport(pData.diagnosticReport);
            } else if (pData.progress.diagnosticReport) {
              setDiagnosticReport(pData.progress.diagnosticReport);
            }
            if (pData.nextMission) {
              setNextMission(pData.nextMission);
            }
            if (pData.readinessScores) {
              setReadinessScores(pData.readinessScores);
            }
            if (pData.progress.practiceProgress) {
              setPracticeProgress(pData.progress.practiceProgress);
              if (pData.progress.practiceProgress.attempts) {
                const solvedMap: Record<string | number, boolean> = {};
                Object.entries(pData.progress.practiceProgress.attempts).forEach(([key, att]: [string, any], aIdx: number) => {
                  if (att.solved) {
                    solvedMap[key] = true;
                    solvedMap[aIdx] = true;
                  }
                });
                setSolvedProblems((prev) => ({ ...prev, ...solvedMap }));
              }
            }

            // Set initial stage based on saved progress
            if (pData.progress.assessmentCompleted) {
              setStage("RESULT");
              setSubmittedAssessment(true);
            } else if (pData.progress.practiceCompleted) {
              setStage("ASSESSMENT");
            } else if (pData.progress.learningCompleted) {
              setStage("PRACTICE");
            } else {
              setStage("LEARN");
            }
          }
        }

        // 3. Fetch Day Plan Content from API (cached by dayId in roadmap)
        const dayRes = await fetch("/api/roadmap/day", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dayId,
            weekTitle: currWeekTitle,
            focusSkills: skillsForWeek,
            dayNumber,
            career: profileRole,
            attemptNumber: 1,
            userId: session?.user?.id || "user",
          }),
        });

        if (dayRes.ok) {
          const dData = await dayRes.json();
          if (dData?.day) {
            setDayPlan(dData.day);
            // Pre-seed starter code or restore from localStorage for practice problems across all supported languages
            if (dData.day.practiceProblems) {
              const codeMap: Record<string, string> = {};
              const currentUserId = session?.user?.id || "user";
              dData.day.practiceProblems.forEach((p: PracticeProblem, i: number) => {
                const pId = p.id || `prob_${i + 1}`;
                const storageKey = `mission-code:${currentUserId}:${dayId}:${pId}`;
                const savedCode = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;

                SUPPORTED_LANGUAGES.forEach((l) => {
                  const key = `${i}_${l.id}`;
                  const langLookup = l.id === "python3" ? "python" : l.id;
                  const defaultStarter = p.starterCodes?.[langLookup] || l.getStarterCode(p.title, p.starterCode);
                  codeMap[key] = (l.id === "javascript" && savedCode) ? savedCode : defaultStarter;
                });
              });
              setUserCode(codeMap);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load mission data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [dayId, weekNumber, dayNumber, session?.user?.id]);

  // Stage 1: Complete Learning
  const handleCompleteLearning = async () => {
    setSavingStage(true);
    try {
      await fetch("/api/mission/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId,
          stage: "LEARN",
        }),
      });

      setProgress((prev) => ({ ...prev, learningCompleted: true }));
      setStage("PRACTICE");
    } catch (err) {
      console.error("Error saving learn progress:", err);
    } finally {
      setSavingStage(false);
    }
  };

  // Stage 2: Run Practice Code or Submit Solution
  const handleRunCode = async (idx: number, isSubmit: boolean = false) => {
    const prob = practiceProblems[idx];
    if (!prob) return;
    const langId = selectedLanguages[idx] || "javascript";
    const currentLang = SUPPORTED_LANGUAGES.find((l) => l.id === langId) || SUPPORTED_LANGUAGES[0];
    const codeKey = `${idx}_${langId}`;
    const codeText = userCode[codeKey] || currentLang.getStarterCode(prob.title, prob.starterCode);

    setRunningCode((prev) => ({ ...prev, [idx]: true }));
    setActiveResultTab((prev) => ({ ...prev, [idx]: "result" }));

    // Prepare test cases
    let testCases = prob.testCases || [];
    if (testCases.length === 0 && prob.exampleInput && prob.expectedOutput) {
      testCases = [
        {
          id: `tc-${idx}-1`,
          input: prob.exampleInput,
          expectedOutput: prob.expectedOutput,
          isHidden: false,
          explanation: "Primary sample assertion",
        },
      ];
    }

    try {
      const res = await fetch("/api/mission/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId,
          problemId: prob.id || `prob_${idx + 1}`,
          skill: focusSkills[0] || dayPlan?.skills?.[0] || targetRole,
          topic: dayPlan?.topic || "Engineering Practice",
          difficulty: prob.difficulty || "Medium",
          language: langId === "python3" ? "python" : langId,
          code: codeText,
          testCases,
          isSubmit,
          problemTitle: prob.title,
          expectedComplexity: prob.expectedTimeComplexity,
          totalProblems: practiceProblems.length || 3,
        }),
      });

      const data = await res.json();
      if (res.ok && data.execution) {
        setExecutionResults((prev) => ({ ...prev, [idx]: data.execution }));
        if (data.practiceProgress) {
          setPracticeProgress(data.practiceProgress);
        }
        if (isSubmit && data.solved) {
          const probKey = prob.id || `prob_${idx + 1}`;
          setSolvedProblems((prev) => {
            const updated = { ...prev, [probKey]: true, [idx]: true };
            const totalSolved = (practiceProblems.length > 0)
              ? practiceProblems.filter((p, i) => updated[p.id] || updated[i]).length
              : Object.values(updated).filter(Boolean).length;
            if (totalSolved >= (practiceProblems.length || 3)) {
              setProgress((p) => ({ ...p, practiceCompleted: true }));
            }
            return updated;
          });
        }
      }
    } catch (e) {
      console.error("Error executing practice code:", e);
    } finally {
      setRunningCode((prev) => ({ ...prev, [idx]: false }));
    }
  };

  const handleLanguageChange = (probIdx: number, langId: string) => {
    setSelectedLanguages((prev) => ({ ...prev, [probIdx]: langId }));
    const key = `${probIdx}_${langId}`;
    if (!userCode[key]) {
      const prob = practiceProblems[probIdx];
      const lang = SUPPORTED_LANGUAGES.find((l) => l.id === langId) || SUPPORTED_LANGUAGES[0];
      const langLookup = langId === "python3" ? "python" : langId;
      const starter =
        prob?.starterCodes?.[langLookup] ||
        lang.getStarterCode(prob?.title || `Lab ${probIdx + 1}`, prob?.starterCode);
      setUserCode((prev) => ({ ...prev, [key]: starter }));
    }
  };

  const handleCodeChange = (probIdx: number, langId: string, value: string) => {
    setUserCode((prev) => ({
      ...prev,
      [`${probIdx}_${langId}`]: value,
    }));
    const prob = practiceProblems[probIdx];
    const pId = prob?.id || `prob_${probIdx + 1}`;
    const uId = session?.user?.id || "user";
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`mission-code:${uId}:${dayId}:${pId}`, value);
      } catch (e) {
        // storage quota exceeded or private browsing
      }
    }
  };

  const handleResetCode = () => {
    if (!activeProblem) return;
    const langId = selectedLanguages[activeProblemIdx] || "javascript";
    const lang = SUPPORTED_LANGUAGES.find((l) => l.id === langId) || SUPPORTED_LANGUAGES[0];
    const langLookup = langId === "python3" ? "python" : langId;
    const starter =
      activeProblem.starterCodes?.[langLookup] ||
      lang.getStarterCode(activeProblem.title, activeProblem.starterCode);
    setUserCode((prev) => ({
      ...prev,
      [`${activeProblemIdx}_${langId}`]: starter,
    }));
    const pId = activeProblem.id || `prob_${activeProblemIdx + 1}`;
    const uId = session?.user?.id || "user";
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(`mission-code:${uId}:${dayId}:${pId}`);
      } catch (e) {}
    }
  };

  // Stage 2: Complete Practice (Gated: requires at least 1 solved problem)
  const handleCompletePractice = async () => {
    const solvedCount = practiceProblems.filter((p, i) => solvedProblems[p.id] || solvedProblems[i]).length;
    if (solvedCount < 1) {
      setErrorMessage("Please solve at least 1 practice problem before unlocking the assessment.");
      return;
    }
    setSavingStage(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/mission/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId,
          stage: "PRACTICE",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(errData.error || "Failed to complete practice stage.");
        return;
      }

      setProgress((prev) => ({ ...prev, practiceCompleted: true }));
      setStage("ASSESSMENT");
    } catch (err) {
      console.error("Error saving practice progress:", err);
      setErrorMessage("Network error saving practice progress.");
    } finally {
      setSavingStage(false);
    }
  };

  // Stage 3: Submit Assessment (Authoritative server-side verification)
  const handleSubmitAssessment = async () => {
    if (!dayPlan || !dayPlan.assessment || dayPlan.assessment.length === 0) return;

    setSavingStage(true);
    setErrorMessage(null);
    try {
      // Send ONLY { dayId, stage: "ASSESSMENT", answers }.
      // Server retrieves stored DayPlan, validates question IDs and choices, and computes verifiedScore.
      const res = await fetch("/api/mission/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId,
          stage: "ASSESSMENT",
          answers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to submit assessment.");
        return;
      }

      const serverScore = data.progress?.score ?? 0;
      const serverPassed = data.progress?.passed ?? false;
      const serverWeakAreas = data.progress?.weakAreas ?? [];

      setFinalScore(serverScore);
      setWeakAreas(serverWeakAreas);
      setSubmittedAssessment(true);

      if (data.diagnosticReport) {
        setDiagnosticReport(data.diagnosticReport);
      }
      if (data.nextMission) {
        setNextMission(data.nextMission);
      }
      if (data.readinessScores) {
        setReadinessScores(data.readinessScores);
      }
      if (data.skillScoreProgress) {
        setSkillScoreProgress(data.skillScoreProgress);
      }

      setProgress((prev) => ({
        ...prev,
        assessmentCompleted: true,
        score: serverScore,
        passed: serverPassed,
        weakAreas: serverWeakAreas,
        diagnosticReport: data.diagnosticReport,
      }));

      // If server returned review revealing answer keys & explanations, update dayPlan
      if (data.review && Array.isArray(data.review) && dayPlan) {
        const updatedAssessment = dayPlan.assessment.map((q) => {
          const rev = data.review.find((r: any) => r.id === q.id);
          if (rev) {
            return {
              ...q,
              correctAnswer: rev.correctAnswer,
              explanation: rev.explanation,
            };
          }
          return q;
        });
        setDayPlan({
          ...dayPlan,
          assessment: updatedAssessment,
        });
      }

      setStage("RESULT");
    } catch (err) {
      console.error("Error evaluating assessment:", err);
      setErrorMessage("Network error submitting assessment. Please try again.");
    } finally {
      setSavingStage(false);
    }
  };

  // Retry Assessment with dynamic remediation questions on weak concepts
  const handleRetryAssessment = async () => {
    setSavingStage(true);
    setErrorMessage(null);
    try {
      const detectedWeakAreas = progress.diagnosticReport?.weakConcepts || progress.weakAreas || [];
      const res = await fetch("/api/mission/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId,
          weakAreas: detectedWeakAreas,
          dayTopic: dayPlan?.topic || "Core Architecture",
          career: targetRole,
          previousScore: finalScore || 0,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(errData.error || "Failed to generate targeted retry assessment. Please try again.");
        return; // Retains current state & score on failure!
      }

      const data = await res.json();
      if (data.questions && data.questions.length > 0 && dayPlan) {
        setDayPlan({
          ...dayPlan,
          assessment: data.questions,
        });
      }

      // ONLY reset answers and stage when retry generation succeeds!
      setAnswers({});
      setSubmittedAssessment(false);
      setFinalScore(null);
      setStage("ASSESSMENT");
    } catch (e) {
      console.warn("Could not fetch targeted retry questions:", e);
      setErrorMessage("Network error initiating retry assessment. Please try again.");
    } finally {
      setSavingStage(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07080e] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-sm font-mono text-slate-400">Loading Daily Mission Sequence...</p>
        </div>
      </main>
    );
  }

  const questions = dayPlan?.assessment || [];
  const practiceProblems = (dayPlan?.practiceProblems || []).slice(0, 3);
  const solvedCount = practiceProblems.filter((p, i) => solvedProblems[p.id] || solvedProblems[i]).length;
  const activeProblem = practiceProblems[activeProblemIdx] || practiceProblems[0];
  const activeLangId = selectedLanguages[activeProblemIdx] || "javascript";
  const activeLang = SUPPORTED_LANGUAGES.find((l) => l.id === activeLangId) || SUPPORTED_LANGUAGES[0];
  const activeCodeKey = `${activeProblemIdx}_${activeLangId}`;
  const currentCode =
    userCode[activeCodeKey] ??
    activeLang.getStarterCode(
      activeProblem?.title || `Lab ${activeProblemIdx + 1}`,
      activeProblem?.starterCode
    );
  const allQuestionsAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined);

  return (
    <main className="min-h-screen bg-[#07080e] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-white pb-24">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#07080e]/90 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-xs font-mono font-semibold text-indigo-400">
            Week {weekNumber} &middot; Day {dayNumber}
          </span>
          <span className="badge-tech badge-tech-indigo hidden sm:inline-flex text-[11px]">
            {targetRole}
          </span>
        </div>

        {/* 4-Stage Stepper */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Stage 1: LEARN */}
          <button
            onClick={() => setStage("LEARN")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
              stage === "LEARN"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                : progress.learningCompleted
                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>1. Learn</span>
            {progress.learningCompleted && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
          </button>

          <ChevronRight className="w-3 h-3 text-slate-600" />

          {/* Stage 2: PRACTICE */}
          <button
            onClick={() => {
              if (progress.learningCompleted) setStage("PRACTICE");
            }}
            disabled={!progress.learningCompleted}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
              stage === "PRACTICE"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : progress.practiceCompleted
                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                : !progress.learningCompleted
                ? "opacity-40 text-slate-500 cursor-not-allowed"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {!progress.learningCompleted ? <Lock className="w-3 h-3" /> : <Code2 className="w-3.5 h-3.5" />}
            <span>2. Practice</span>
            {progress.practiceCompleted && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
          </button>

          <ChevronRight className="w-3 h-3 text-slate-600" />

          {/* Stage 3: ASSESSMENT (Gated: requires practice completed or >= 1 solved) */}
          <button
            onClick={() => {
              if (progress.practiceCompleted || solvedCount >= 1) setStage("ASSESSMENT");
            }}
            disabled={!progress.practiceCompleted && solvedCount < 1}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
              stage === "ASSESSMENT"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : progress.assessmentCompleted
                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                : (!progress.practiceCompleted && solvedCount < 1)
                ? "opacity-40 text-slate-500 cursor-not-allowed"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {(!progress.practiceCompleted && solvedCount < 1) ? <Lock className="w-3 h-3" /> : <BrainCircuit className="w-3.5 h-3.5" />}
            <span>3. Assessment</span>
            {progress.assessmentCompleted && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
          </button>

          <ChevronRight className="w-3 h-3 text-slate-600" />

          {/* Stage 4: RESULT */}
          <button
            onClick={() => {
              if (progress.assessmentCompleted) setStage("RESULT");
            }}
            disabled={!progress.assessmentCompleted}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
              stage === "RESULT"
                ? progress.passed
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : !progress.assessmentCompleted
                ? "opacity-40 text-slate-500 cursor-not-allowed"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>4. Result</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-6">
        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300 text-xs font-mono">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-slate-400 hover:text-white px-2 py-1 text-sm font-bold"
            >
              &times;
            </button>
          </div>
        )}
        {/* Day Mission Title Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/40 border border-indigo-500/20 shadow-xl mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="badge-tech badge-tech-indigo text-xs">
              {weekTitle}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Day {dayNumber} of 5
            </span>
            {progress.passed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> PASSED &middot; NEXT DAY UNLOCKED
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {dayPlan?.topic || `Day ${dayNumber}: Foundations & Architecture`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
            {dayPlan?.description}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* STAGE 1: LEARN (Theory & Core Architecture) */}
        {/* ========================================================================= */}
        {stage === "LEARN" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Stage 1: Core Theory & Deep Architecture</h2>
                  <p className="text-xs text-slate-400 font-mono">Estimated 20 mins &middot; GeeksforGeeks Grade Depth</p>
                </div>
              </div>
              {progress.learningCompleted && (
                <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Stage Completed
                </span>
              )}
            </div>

            {/* 10-Point Pedagogical Structured Lesson */}
            {dayPlan?.learnLesson && (
              <section className="space-y-6">
                {/* 1. Concept Card & 2. Why We Need It */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-slate-900/60 to-purple-950/20 border border-indigo-500/25 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider">
                      Pedagogical Blueprint &middot; Step 1 & 2
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                      {dayPlan.learnLesson.concept}
                    </h3>
                    <div className="mt-3 p-4 rounded-xl bg-black/40 border border-white/[0.06] text-xs sm:text-sm text-slate-300 leading-relaxed">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 mb-1.5 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" /> Why We Need This Concept
                      </h4>
                      <p>{dayPlan.learnLesson.whyItMatters}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Syntax & 4. Working Code Example */}
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                      Step 3 & 4: Syntax Specification & Working Example
                    </span>
                    <button
                      onClick={() => handleCopy(dayPlan.learnLesson?.exampleCode || "", "lesson-code")}
                      className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white px-2.5 py-1 rounded-lg border border-white/[0.08] bg-white/[0.02] cursor-pointer"
                    >
                      {copiedSnippet === "lesson-code" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Syntax signature */}
                  <div className="p-3.5 rounded-xl bg-[#0a0d16] border border-cyan-500/20 font-mono text-xs text-cyan-300 whitespace-pre-wrap">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">Formal Syntax Grammar:</span>
                    <code>{dayPlan.learnLesson.syntax}</code>
                  </div>

                  {/* Full Code Snippet */}
                  <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#070a13]">
                    <div className="px-4 py-2 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Production Implementation</span>
                      <span className="text-indigo-400">{dayPlan.learnLesson.language || "TypeScript"}</span>
                    </div>
                    <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                      <code>{dayPlan.learnLesson.exampleCode}</code>
                    </pre>
                  </div>
                </div>

                {/* 5. Line-by-Line Code Breakdown & 6. Why This Syntax */}
                {dayPlan.learnLesson.lineByLineExplanation && dayPlan.learnLesson.lineByLineExplanation.length > 0 && (
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 block">
                      Step 5: Line-by-Line Pedagogical Breakdown
                    </span>
                    <div className="space-y-3">
                      {dayPlan.learnLesson.lineByLineExplanation.map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5">
                          <code className="text-xs font-mono text-cyan-300 font-semibold block">
                            {item.line}
                          </code>
                          <p className="text-xs text-slate-300">
                            {item.explanation}
                          </p>
                          {item.whyWrittenThisWay && (
                            <p className="text-[11px] text-indigo-300/80 font-mono">
                              ↳ <span className="font-semibold text-indigo-300">Why written this way:</span> {item.whyWrittenThisWay}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* 6. Why this syntax design */}
                    {dayPlan.learnLesson.whyThisSyntax && (
                      <div className="mt-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-300 leading-relaxed">
                        <span className="font-bold text-indigo-300 font-mono block mb-1">
                          Step 6: Language Design Rationale:
                        </span>
                        {dayPlan.learnLesson.whyThisSyntax}
                      </div>
                    )}
                  </div>
                )}

                {/* 7. Common Pitfalls & Anti-Patterns */}
                {dayPlan.learnLesson.commonMistakes && dayPlan.learnLesson.commonMistakes.length > 0 && (
                  <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-rose-400">
                      <AlertTriangle className="w-4 h-4" />
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider">
                        Step 7: Common Pitfalls &amp; Junior Traps
                      </h4>
                    </div>
                    <ul className="space-y-2">
                      {dayPlan.learnLesson.commonMistakes.map((mistake, idx) => (
                        <li key={idx} className="text-xs text-rose-200/90 flex items-start gap-2 leading-relaxed">
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>{mistake}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 8. Time & Space Complexity */}
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 block">
                    Step 8: Algorithmic Complexity Profile
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center gap-3">
                      <Clock className="w-5 h-5 text-cyan-400 shrink-0" />
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">Time Complexity</span>
                        <p className="text-xs font-mono font-bold text-white">{dayPlan.learnLesson.timeComplexity || "O(1) to O(N)"}</p>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center gap-3">
                      <Cpu className="w-5 h-5 text-purple-400 shrink-0" />
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">Space Complexity</span>
                        <p className="text-xs font-mono font-bold text-white">{dayPlan.learnLesson.spaceComplexity || "O(1) to O(N)"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 9. Real Interview Connection */}
                {dayPlan.learnLesson.interviewConnection && (
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/30 to-indigo-950/20 border border-purple-500/30 space-y-3">
                    <div className="flex items-center gap-2 text-purple-300">
                      <BrainCircuit className="w-4 h-4" />
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider">
                        Step 9: Real Technical Interview Question
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-white">
                        &ldquo;{dayPlan.learnLesson.interviewConnection.question}&rdquo;
                      </p>
                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-xs text-slate-300 leading-relaxed">
                        <span className="text-[11px] font-mono text-emerald-400 block font-semibold mb-1">
                          Staff Engineer Benchmark Answer:
                        </span>
                        {dayPlan.learnLesson.interviewConnection.answer}
                      </div>
                      {dayPlan.learnLesson.interviewConnection.whyAsked && (
                        <p className="text-[11px] font-mono text-slate-400">
                          🎯 <span className="font-semibold text-slate-300">Why interviewers ask this:</span> {dayPlan.learnLesson.interviewConnection.whyAsked}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 10. Quick Check Self-Assessment */}
                {dayPlan.learnLesson.quickCheck && (
                  <div className="p-6 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-cyan-300">
                        <HelpCircle className="w-4 h-4" />
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider">
                          Step 10: Quick Comprehension Check
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Self-Evaluation
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-white">
                      {dayPlan.learnLesson.quickCheck.question}
                    </p>

                    <div className="space-y-2">
                      {dayPlan.learnLesson.quickCheck.options.map((opt, oIdx) => {
                        const isSelected = quickCheckSelected === oIdx;
                        const isCorrect = oIdx === dayPlan.learnLesson?.quickCheck.correctIndex;
                        return (
                          <button
                            key={oIdx}
                            onClick={() => {
                              setQuickCheckSelected(oIdx);
                              setQuickCheckSubmitted(true);
                            }}
                            className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center gap-3 cursor-pointer ${
                              quickCheckSubmitted
                                ? isCorrect
                                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-semibold"
                                  : isSelected
                                  ? "bg-rose-500/20 border-rose-500/50 text-rose-200"
                                  : "bg-white/[0.02] border-white/[0.06] text-slate-400"
                                : isSelected
                                ? "bg-cyan-500/20 border-cyan-500 text-white"
                                : "bg-white/[0.02] border-white/[0.08] text-slate-300 hover:border-white/[0.2]"
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span>{opt}</span>
                            {quickCheckSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                          </button>
                        );
                      })}
                    </div>

                    {quickCheckSubmitted && (
                      <div className="p-3.5 rounded-xl bg-black/60 border border-white/[0.06] text-xs text-slate-300 space-y-1">
                        <span className="text-[11px] font-mono font-bold text-cyan-400 block">
                          Explanation:
                        </span>
                        <p>{dayPlan.learnLesson.quickCheck.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Video Resources (Telugu & English) */}
            {dayPlan?.youtubeResources && dayPlan.youtubeResources.length > 0 && (
              <section className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-2">
                  <YouTubeIcon className="w-4 h-4 text-rose-500 fill-rose-500" />
                  Curated Video Masterclasses (Telugu & English Included)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {dayPlan.youtubeResources.map((res, i) => (
                    <a
                      key={res.id || i}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/40 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                              res.language === "Telugu"
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/30 font-semibold"
                                : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30 font-semibold"
                            }`}
                          >
                            {res.language === "Telugu" ? "🇮🇳 Telugu Explanation" : "🌐 English Deep Dive"}
                          </span>
                          <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-300 transition-colors" />
                        </div>
                        <p className="text-xs font-semibold text-slate-200 line-clamp-2">
                          {res.title}
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-2 block font-mono">
                        Channel: {res.channel || "Official Spec"}
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Theory Modules Breakdown */}
            {dayPlan?.topics?.map((topic, tIdx) => (
              <div key={topic.id || tIdx} className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase">
                      Module {tIdx + 1}
                    </span>
                    <span className="text-slate-600">&middot;</span>
                    <span className="text-xs text-slate-400">{topic.subtitle || "Deep Mechanical Dive"}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {topic.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                    {topic.overview}
                  </p>
                </div>

                {/* In-depth theoretical text */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.05] text-xs sm:text-sm text-slate-300 space-y-3 font-sans leading-relaxed whitespace-pre-line">
                  {topic.comprehensiveTheory}
                </div>

                {/* Submodule Breakdown */}
                {topic.modules?.map((sub, sIdx) => (
                  <div key={sub.id || sIdx} className="pl-4 border-l-2 border-indigo-500/30 space-y-3">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-200">
                      {sub.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {sub.overview}
                    </p>

                    {/* Detailed Theory if present */}
                    {sub.detailedTheory && (
                      <p className="text-xs text-slate-300 bg-white/[0.02] p-3 rounded-lg border border-white/[0.04] leading-relaxed">
                        {sub.detailedTheory}
                      </p>
                    )}

                    {/* Code Snippet */}
                    {sub.codeSnippet && (
                      <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#0c0f18]">
                        <div className="flex items-center justify-between px-3.5 py-2 bg-white/[0.04] border-b border-white/[0.06]">
                          <span className="text-[11px] font-mono text-indigo-300">
                            {sub.codeSnippet.title || "Implementation Example"}
                          </span>
                          <button
                            onClick={() => handleCopy(sub.codeSnippet?.code || "", `${tIdx}-${sIdx}`)}
                            className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-white px-2 py-0.5 rounded border border-white/[0.08]"
                          >
                            {copiedSnippet === `${tIdx}-${sIdx}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                          <code>{sub.codeSnippet.code}</code>
                        </pre>
                        {sub.codeSnippet.explanation && (
                          <div className="px-4 py-2 bg-white/[0.02] border-t border-white/[0.05] text-[11px] text-slate-400">
                            💡 <span className="font-semibold text-slate-300">Mechanics:</span> {sub.codeSnippet.explanation}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Key Takeaways */}
                    {sub.keyTakeaways && sub.keyTakeaways.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Key Architectural Takeaways:</span>
                        <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                          {sub.keyTakeaways.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}

                {/* Comparison Table */}
                {topic.comparisonTable && (
                  <div className="mt-4 overflow-x-auto rounded-xl border border-white/[0.08]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-white/[0.04] text-slate-300 font-mono text-[11px]">
                        <tr>
                          {topic.comparisonTable.headers.map((h, i) => (
                            <th key={i} className="p-3 border-b border-white/[0.08]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {topic.comparisonTable.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-white/[0.02]">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-3 text-slate-300">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Interview Questions */}
                {topic.interviewQuestions && topic.interviewQuestions.length > 0 && (
                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-3">
                    <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Senior Interview Defense Questions
                    </p>
                    {topic.interviewQuestions.map((iq, i) => (
                      <div key={i} className="space-y-1 text-xs">
                        <p className="font-semibold text-white">Q{i + 1}: {iq.question}</p>
                        <p className="text-slate-300 pl-3 border-l border-purple-500/40">{iq.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Bottom Action: Complete Learning */}
            <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Finished absorbing the theory?</h4>
                <p className="text-xs text-slate-400">
                  Mark this stage as complete to unlock the 5 hands-on Practice Labs.
                </p>
              </div>
              <button
                onClick={handleCompleteLearning}
                disabled={savingStage}
                className="btn-gradient !py-3 !px-6 !text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer w-full sm:w-auto justify-center"
              >
                <span>{progress.learningCompleted ? "Proceed to Practice Labs" : "Complete Learning"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 2: PRACTICE (LeetCode-Style Hands-On Practice Labs) */}
        {/* ========================================================================= */}
        {stage === "PRACTICE" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Stage 2: Practice Labs</h2>
                  <p className="text-xs text-slate-400 font-mono">
                    3 Rigorous Coding Challenges &middot; 1 Easy &middot; 1 Medium &middot; 1 Hard
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
                  Solved: {Object.values(solvedProblems).filter(Boolean).length} / {practiceProblems.length}
                </span>
                {progress.practiceCompleted && (
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All Solved
                  </span>
                )}
              </div>
            </div>

            {/* 3-Problem Tab Switcher (1 Easy, 1 Medium, 1 Hard) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {practiceProblems.map((prob, idx) => {
                const isSolved = solvedProblems[idx];
                const isActive = activeProblemIdx === idx;
                return (
                  <button
                    key={prob.id || idx}
                    onClick={() => setActiveProblemIdx(idx)}
                    className={`flex flex-col sm:flex-row items-center justify-between gap-1.5 p-3 rounded-xl text-xs font-mono font-semibold transition-all border cursor-pointer ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30"
                        : isSolved
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : "bg-white/[0.02] text-slate-400 border-white/[0.08] hover:text-slate-200 hover:border-white/[0.2]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>Lab {idx + 1}</span>
                      {isSolved && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        prob.difficulty === "Easy"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : prob.difficulty === "Medium"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {prob.difficulty}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Problem Split Workspace (LeetCode Style) */}
            {activeProblem && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Split: Problem Details & Constraints */}
                <div className="lg:col-span-5 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4 max-h-[750px] overflow-y-auto">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                        Problem {activeProblemIdx + 1} of {practiceProblems.length}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                          activeProblem.difficulty === "Easy"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : activeProblem.difficulty === "Medium"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        }`}
                      >
                        {activeProblem.difficulty}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {activeProblem.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {activeProblem.description}
                  </p>

                  {/* Examples */}
                  {activeProblem.examples && activeProblem.examples.length > 0 ? (
                    <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                      <span className="text-[11px] font-mono uppercase font-bold text-indigo-400 block">
                        Examples:
                      </span>
                      {activeProblem.examples.map((ex, exIdx) => (
                        <div key={exIdx} className="p-3 rounded-xl bg-black/40 border border-white/[0.06] font-mono text-xs space-y-1">
                          <p className="text-slate-400">
                            <span className="text-slate-500 font-bold">Input:</span>{" "}
                            <span className="text-slate-200">{ex.input}</span>
                          </p>
                          <p className="text-slate-400">
                            <span className="text-emerald-400 font-bold">Output:</span>{" "}
                            <span className="text-emerald-300">{ex.output}</span>
                          </p>
                          {ex.explanation && (
                            <p className="text-[11px] text-slate-400 pt-1 font-sans border-t border-white/[0.04]">
                              <span className="font-semibold text-slate-300">Explanation:</span> {ex.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : activeProblem.exampleInput ? (
                    <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                      <span className="text-[11px] font-mono uppercase font-bold text-indigo-400 block">
                        Example:
                      </span>
                      <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] font-mono text-xs space-y-1">
                        <p className="text-slate-400">
                          Input: <span className="text-slate-200">{activeProblem.exampleInput}</span>
                        </p>
                        <p className="text-slate-400">
                          Expected: <span className="text-emerald-300">{activeProblem.expectedOutput}</span>
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {/* Constraints */}
                  {activeProblem.constraints && activeProblem.constraints.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                      <span className="text-[11px] font-mono uppercase font-bold text-amber-400 block">
                        Constraints:
                      </span>
                      <ul className="space-y-1">
                        {activeProblem.constraints.map((c, cIdx) => (
                          <li key={cIdx} className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                            <span className="text-amber-400">&bull;</span>
                            <code>{c}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Complexity Targets */}
                  <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-[9px] font-mono uppercase text-slate-500 block">Target Time</span>
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {activeProblem.expectedTimeComplexity || "O(N)"}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-[9px] font-mono uppercase text-slate-500 block">Target Space</span>
                      <span className="text-xs font-mono font-bold text-purple-300">
                        {activeProblem.expectedSpaceComplexity || "O(1)"}
                      </span>
                    </div>
                  </div>

                  {/* Interview Relevance */}
                  {activeProblem.interviewRelevance && (
                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-200 space-y-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        Interview Relevance
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {activeProblem.interviewRelevance}
                      </p>
                    </div>
                  )}

                  {/* Solution Hint Accordion */}
                  {activeProblem.solutionHint && (
                    <div className="pt-2">
                      <button
                        onClick={() =>
                          setShowHint((prev) => ({
                            ...prev,
                            [activeProblemIdx]: !prev[activeProblemIdx],
                          }))
                        }
                        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/25 text-xs text-cyan-300 hover:bg-cyan-950/40 cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                          {showHint[activeProblemIdx] ? "Hide Solution Hint" : "Reveal Solution Hint"}
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            showHint[activeProblemIdx] ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {showHint[activeProblemIdx] && (
                        <div className="mt-2 p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-100 leading-relaxed">
                          {activeProblem.solutionHint}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Split: Interactive IDE & Test Runner */}
                <div className="lg:col-span-7 flex flex-col rounded-2xl border border-white/[0.08] bg-[#090c15] overflow-hidden shadow-2xl">
                  {/* Top Bar: Language Selector & File Indicators */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <select
                          value={activeLangId}
                          onChange={(e) => handleLanguageChange(activeProblemIdx, e.target.value)}
                          className="bg-black/60 hover:bg-black/80 text-xs font-mono text-cyan-300 font-semibold pl-2.5 pr-7 py-1.5 rounded-lg border border-cyan-500/30 focus:outline-none focus:border-cyan-400 cursor-pointer appearance-none shadow-sm"
                        >
                          {SUPPORTED_LANGUAGES.map((lang) => (
                            <option key={lang.id} value={lang.id} className="bg-[#0b0e17] text-slate-200">
                              {lang.name} ({lang.compiler})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-slate-500" />
                        {activeLang.filePrefix}_{activeProblemIdx + 1}.{activeLang.extension}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden md:inline-flex text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                        {activeLang.compiler}
                      </span>
                      <button
                        onClick={handleResetCode}
                        className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded hover:bg-white/[0.04]"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    </div>
                  </div>

                  {/* Code Editor */}
                  <div className="relative flex-1 min-h-[280px]">
                    <textarea
                      value={currentCode}
                      onChange={(e) => handleCodeChange(activeProblemIdx, activeLangId, e.target.value)}
                      className="w-full h-72 p-4 font-mono text-xs bg-black/60 text-emerald-300 focus:outline-none resize-none leading-relaxed selection:bg-cyan-500/30 selection:text-white"
                      placeholder={`// Implement your ${activeLang.name} solution here...`}
                      spellCheck={false}
                    />
                  </div>

                  {/* Bottom Runner & Test Case Panel */}
                  <div className="border-t border-white/[0.08] bg-[#070910]">
                    {/* Tab Navigation: Test Cases vs Output Console */}
                    <div className="flex items-center justify-between px-4 pt-2.5 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setActiveResultTab((prev) => ({
                              ...prev,
                              [activeProblemIdx]: "testcase",
                            }))
                          }
                          className={`text-xs font-mono font-semibold px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer ${
                            (activeResultTab[activeProblemIdx] || "testcase") === "testcase"
                              ? "bg-white/[0.06] text-white border-b-2 border-cyan-400"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Test Cases
                        </button>
                        <button
                          onClick={() =>
                            setActiveResultTab((prev) => ({
                              ...prev,
                              [activeProblemIdx]: "result",
                            }))
                          }
                          className={`text-xs font-mono font-semibold px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                            activeResultTab[activeProblemIdx] === "result"
                              ? "bg-white/[0.06] text-white border-b-2 border-cyan-400"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <span>Verdict &amp; Console</span>
                          {executionResults[activeProblemIdx] && (
                            <span
                              className={`w-2 h-2 rounded-full ${
                                executionResults[activeProblemIdx]?.status === "ACCEPTED"
                                  ? "bg-emerald-400"
                                  : "bg-rose-400"
                              }`}
                            />
                          )}
                        </button>
                      </div>

                      {runningCode[activeProblemIdx] && (
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-300">
                          <div className="w-3 h-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                          <span>Executing sandbox...</span>
                        </div>
                      )}
                    </div>

                    {/* Tab Content 1: Test Cases */}
                    {(activeResultTab[activeProblemIdx] || "testcase") === "testcase" && (
                      <div className="p-4 space-y-3">
                        {/* Test Case Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {(activeProblem.testCases || [
                            {
                              id: "tc-default",
                              input: activeProblem.exampleInput || "0",
                              expectedOutput: activeProblem.expectedOutput || "0",
                              isHidden: false,
                            },
                          ])
                            .filter((tc) => !tc.isHidden)
                            .map((tc, tcIdx) => {
                              const activeCase = activeTestTab[activeProblemIdx] || 0;
                              return (
                                <button
                                  key={tc.id || tcIdx}
                                  onClick={() =>
                                    setActiveTestTab((prev) => ({
                                      ...prev,
                                      [activeProblemIdx]: tcIdx,
                                    }))
                                  }
                                  className={`px-3 py-1 rounded-lg text-xs font-mono cursor-pointer transition-colors ${
                                    activeCase === tcIdx
                                      ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30"
                                      : "bg-white/[0.02] text-slate-400 hover:text-white"
                                  }`}
                                >
                                  Case {tcIdx + 1}
                                </button>
                              );
                            })}
                        </div>

                        {/* Active Test Case Detail */}
                        {(() => {
                          const visibleCases = (activeProblem.testCases || [
                            {
                              id: "tc-default",
                              input: activeProblem.exampleInput || "0",
                              expectedOutput: activeProblem.expectedOutput || "0",
                              isHidden: false,
                            },
                          ]).filter((tc) => !tc.isHidden);
                          const tcIdx = activeTestTab[activeProblemIdx] || 0;
                          const currentTc = visibleCases[tcIdx] || visibleCases[0];

                          return (
                            <div className="space-y-2 font-mono text-xs">
                              <div>
                                <span className="text-[10px] uppercase text-slate-500 font-semibold block mb-1">
                                  Input:
                                </span>
                                <div className="p-2.5 rounded-lg bg-black/60 border border-white/[0.05] text-slate-200">
                                  {currentTc.input}
                                </div>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase text-slate-500 font-semibold block mb-1">
                                  Expected Output:
                                </span>
                                <div className="p-2.5 rounded-lg bg-black/60 border border-white/[0.05] text-emerald-400 font-semibold">
                                  {currentTc.expectedOutput}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Tab Content 2: Execution Result & Console */}
                    {activeResultTab[activeProblemIdx] === "result" && (
                      <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
                        {executionResults[activeProblemIdx] ? (
                          <div className="space-y-3 font-mono text-xs">
                            {/* Verdict Header */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                                    executionResults[activeProblemIdx]?.status === "ACCEPTED" ||
                                    executionResults[activeProblemIdx]?.status === "TESTS_PASSED"
                                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                      : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                  }`}
                                >
                                  {executionResults[activeProblemIdx]?.status === "ACCEPTED" ||
                                  executionResults[activeProblemIdx]?.status === "TESTS_PASSED" ? (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5" />
                                  )}
                                  {executionResults[activeProblemIdx]?.status === "TESTS_PASSED"
                                    ? "SAMPLE TESTS PASSED"
                                    : executionResults[activeProblemIdx]?.status}
                                </span>
                                <span className="text-slate-400">
                                  Passed: {executionResults[activeProblemIdx]?.passedTests} /{" "}
                                  {executionResults[activeProblemIdx]?.totalTests} Tests
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                <span>Runtime: {executionResults[activeProblemIdx]?.runtimeMs} ms</span>
                                <span>Memory: {executionResults[activeProblemIdx]?.memoryMb} MB</span>
                              </div>
                            </div>

                            {/* AI Explanation & Feedback */}
                            {executionResults[activeProblemIdx]?.aiExplanation && (
                              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 space-y-1.5 font-sans">
                                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-indigo-400" />
                                  AI Sandbox Feedback
                                </span>
                                {executionResults[activeProblemIdx]?.aiExplanation?.whyItWorks && (
                                  <p className="text-xs text-slate-200">
                                    {executionResults[activeProblemIdx]?.aiExplanation?.whyItWorks}
                                  </p>
                                )}
                                {executionResults[activeProblemIdx]?.aiExplanation?.failureReason && (
                                  <p className="text-xs text-rose-300 font-semibold">
                                    {executionResults[activeProblemIdx]?.aiExplanation?.failureReason}
                                  </p>
                                )}
                                {executionResults[activeProblemIdx]?.aiExplanation?.interviewFollowUp && (
                                  <p className="text-[11px] text-indigo-300/90 font-mono pt-1 border-t border-indigo-500/20">
                                    💬 <span className="font-semibold">Interview Follow-Up:</span>{" "}
                                    {executionResults[activeProblemIdx]?.aiExplanation?.interviewFollowUp}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Test Results Breakdown */}
                            {executionResults[activeProblemIdx]?.testResults && (
                              <div className="space-y-1.5 pt-2">
                                <span className="text-[10px] uppercase text-slate-500 font-bold block">
                                  Test Case Diff Inspection:
                                </span>
                                {executionResults[activeProblemIdx]?.testResults.map((tr, trIdx) => (
                                  <div
                                    key={tr.id || trIdx}
                                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                                      tr.passed
                                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                                        : "bg-rose-500/5 border-rose-500/20 text-rose-300"
                                    }`}
                                  >
                                    <span>
                                      Test {trIdx + 1}: {tr.passed ? "✔ Passed" : "✖ Output Mismatch"}
                                    </span>
                                    <div className="text-[11px] text-slate-400 space-x-2">
                                      <span>Exp: {tr.expectedOutput}</span>
                                      {tr.actualOutput && <span>Got: {tr.actualOutput}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-xs text-slate-500 font-mono">
                            Click &ldquo;Run Code&rdquo; to test visible assertions, or &ldquo;Submit&rdquo; to evaluate all hidden test cases.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Bar Footer */}
                    <div className="p-3.5 bg-white/[0.02] border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">
                          {solvedProblems[activeProblemIdx] ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Lab {activeProblemIdx + 1} Verified
                            </span>
                          ) : (
                            <span>Lab {activeProblemIdx + 1} of 3</span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Run Code (Visible Tests Only) */}
                        <button
                          onClick={() => handleRunCode(activeProblemIdx, false)}
                          disabled={runningCode[activeProblemIdx]}
                          className="px-4 py-2 rounded-xl text-xs font-mono font-semibold text-slate-200 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                          <span>Run Code</span>
                        </button>

                        {/* Submit Solution (All Visible + Hidden Tests) */}
                        <button
                          onClick={() => handleRunCode(activeProblemIdx, true)}
                          disabled={runningCode[activeProblemIdx]}
                          className="btn-gradient !py-2 !px-5 !text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20 disabled:opacity-50"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Submit Solution</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Action: Complete Practice */}
            <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Finished the Practice Labs?</h4>
                <p className="text-xs text-slate-400">
                  {solvedCount < 1
                    ? "Solve at least 1 problem to unlock the checkpoint assessment."
                    : "Mark this stage as complete to unlock the 10-question checkpoint assessment."}
                </p>
              </div>
              <button
                onClick={handleCompletePractice}
                disabled={savingStage || solvedCount < 1}
                className="btn-gradient !py-3 !px-6 !text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer w-full sm:w-auto justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{progress.practiceCompleted ? "Proceed to Assessment" : "Complete Practice Labs"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 3: ASSESSMENT (10 Topic-Specific Questions, 70% Threshold) */}
        {/* ========================================================================= */}
        {stage === "ASSESSMENT" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Stage 3: Day Assessment Checkpoint</h2>
                  <p className="text-xs text-slate-400 font-mono">
                    10 Specific Questions &middot; Passing Threshold: 70%
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
                {Object.keys(answers).length} / {questions.length} Answered
              </span>
            </div>

            {/* Empty Questions State with Fallback Recovery */}
            {questions.length === 0 && (
              <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-center space-y-4">
                <BrainCircuit className="w-10 h-10 text-purple-400 mx-auto opacity-70" />
                <h3 className="text-base font-bold text-white">Assessment Questions Loading or Unavailable</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  No checkpoint questions were found for this day plan. Click below to generate questions.
                </p>
                <button
                  onClick={async () => {
                    setLoading(true);
                    setErrorMessage(null);
                    try {
                      const dayRes = await fetch("/api/roadmap/day", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          dayId,
                          weekTitle,
                          focusSkills,
                          dayNumber,
                          career: targetRole,
                          attemptNumber: 1,
                          regenerate: true,
                          userId: session?.user?.id || "user",
                        }),
                      });
                      if (dayRes.ok) {
                        const dData = await dayRes.json();
                        if (dData?.day) setDayPlan(dData.day);
                      }
                    } catch (e) {
                      setErrorMessage("Failed to regenerate questions.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="btn-gradient !py-2.5 !px-5 !text-xs font-mono cursor-pointer"
                >
                  Regenerate Assessment Questions
                </button>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((q, qIdx) => {
                const selected = answers[q.id];
                return (
                  <div
                    key={q.id || qIdx}
                    className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4 hover:border-purple-500/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center text-xs font-mono font-bold">
                          {qIdx + 1}
                        </span>
                        <h3 className="text-sm font-bold text-white">
                          {q.question}
                        </h3>
                      </div>
                      {q.skill && (
                        <span className="badge-tech badge-tech-purple text-[10px] shrink-0">
                          {q.skill}
                        </span>
                      )}
                    </div>

                    {/* Code Snippet if applicable */}
                    {q.codeSnippet && (
                      <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#0c0f18] p-3 font-mono text-xs text-cyan-300">
                        <code>{q.codeSnippet}</code>
                      </div>
                    )}

                    {/* Options (A, B, C, D) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selected === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                              isSelected
                                ? "bg-purple-500/20 border-purple-500 text-white shadow-md shadow-purple-500/10"
                                : "bg-white/[0.02] border-white/[0.08] text-slate-300 hover:border-white/[0.2]"
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                                isSelected
                                  ? "bg-purple-500 text-white"
                                  : "bg-white/[0.08] text-slate-400"
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="text-xs leading-snug">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit Bar */}
            <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Ready to submit your assessment?</h4>
                <p className="text-xs text-slate-400">
                  Requires 70% (7/10) to pass and unlock Day {dayNumber + 1}.
                </p>
              </div>
              <button
                onClick={handleSubmitAssessment}
                disabled={savingStage || !allQuestionsAnswered}
                className={`btn-gradient !py-3 !px-6 !text-sm flex items-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer w-full sm:w-auto justify-center ${
                  !allQuestionsAnswered ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <span>
                  {allQuestionsAnswered
                    ? "Submit Assessment (10/10 Answered)"
                    : `Answer All Questions (${Object.keys(answers).length}/10)`}
                </span>
                <CheckCheck className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 4: RESULT (Pass / Fail State, Weak Areas, Review & Unlocking) */}
        {/* ========================================================================= */}
        {stage === "RESULT" && (
          <div className="space-y-6">
            {/* 1. Main Status Banner */}
            {finalScore !== null && finalScore >= 70 ? (
              // ================= PASSED STATE =================
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/40 shadow-2xl space-y-5 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="badge-tech badge-tech-emerald text-xs uppercase tracking-wider font-bold">
                        Mission Passed &middot; Day {dayNumber} Complete
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                        Score: {finalScore}% &middot; PASSED ✓
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href="/dashboard"
                      className="px-5 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] text-xs font-mono font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                      Return to Dashboard
                    </Link>
                    {nextMission ? (
                      <Link
                        href={nextMission.dayId ? `/mission/day/${nextMission.dayId}` : `/mission/day/week-${weekNumber}_day-${dayNumber + 1}`}
                        className="btn-gradient !py-2.5 !px-5 !text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                      >
                        <span>{nextMission.isRemediation ? "Start Remediation" : `Next: ${nextMission.topic || `Day ${dayNumber + 1}`}`}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : dayNumber < 5 ? (
                      <Link
                        href={`/mission/day/week-${weekNumber}_day-${dayNumber + 1}`}
                        className="btn-gradient !py-2.5 !px-5 !text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                      >
                        <span>Start Day {dayNumber + 1}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                  Outstanding work! You demonstrated solid concept mastery in {dayPlan?.topic}. Your empirical skill profile and career readiness score have been updated in your profile.
                </p>
              </div>
            ) : (
              // ================= FAILED / REMEDIATION STATE (< 70%) =================
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-950/40 via-rose-950/20 to-slate-900 border border-amber-500/40 shadow-2xl space-y-5 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/20">
                      <AlertCircle className="w-9 h-9 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="badge-tech badge-tech-amber text-xs uppercase tracking-wider font-bold">
                        Score Threshold Not Met &middot; Minimum 70% Required
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                        Score: {finalScore ?? 0}% &middot; NEEDS REMEDIATION
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setStage("LEARN")}
                      className="px-4 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] text-xs font-mono font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Review Theory</span>
                    </button>
                    <button
                      onClick={handleRetryAssessment}
                      className="btn-gradient !py-2.5 !px-5 !text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry Assessment</span>
                    </button>
                    <Link
                      href="/dashboard"
                      className="px-4 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] text-xs font-mono font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                      Dashboard
                    </Link>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                  To ensure genuine production readiness, advancing requires 70% or higher. Your diagnostic engine has analyzed each sub-concept below to target where you need to focus.
                </p>
              </div>
            )}

            {/* SKILL SCORE PROGRESS CARD */}
            {skillScoreProgress && (
              <div className="p-5 sm:p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 via-slate-900/40 to-slate-950/60 backdrop-blur-xl shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Skill Score Progress &middot; {skillScoreProgress.skillName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {skillScoreProgress.isDuplicate && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/40">
                        Idempotent Record
                      </span>
                    )}
                    <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
                      skillScoreProgress.confidenceLevel === "HIGH"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : skillScoreProgress.confidenceLevel === "MEDIUM"
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    }`}>
                      Confidence: {skillScoreProgress.confidenceLevel}
                    </span>
                    {skillScoreProgress.isMastered ? (
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                        Mastery Verified (&ge; 80%)
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Progressing Toward Mastery (80%)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Previous Score</span>
                    <p className="text-xl font-extrabold font-mono text-slate-300">
                      {skillScoreProgress.previousScore !== null ? `${skillScoreProgress.previousScore}%` : "No prior record"}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] font-mono uppercase text-cyan-400 block">Current Score</span>
                    <p className="text-xl font-extrabold font-mono text-cyan-300">
                      {skillScoreProgress.currentScore !== null ? `${skillScoreProgress.currentScore}%` : "--"}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] font-mono uppercase text-indigo-300 block">Progress Delta</span>
                    <p className={`text-xl font-extrabold font-mono ${
                      (skillScoreProgress.scoreImprovement ?? 0) > 0
                        ? "text-emerald-400"
                        : (skillScoreProgress.scoreImprovement ?? 0) < 0
                        ? "text-amber-400"
                        : "text-slate-300"
                    }`}>
                      {skillScoreProgress.scoreImprovement !== null
                        ? `${skillScoreProgress.scoreImprovement >= 0 ? "+" : ""}${skillScoreProgress.scoreImprovement} points`
                        : "Baseline established"}
                    </p>
                  </div>
                </div>

                {/* Score Explanation Deep Dive if available */}
                {skillScoreProgress.explanation && (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Recency-Weighted Score: <strong className="text-indigo-300">{Math.round(skillScoreProgress.explanation.recencyWeightedAverage)}%</strong></span>
                      <span>Verified Sources: <strong className="text-slate-200">{skillScoreProgress.explanation.evidenceSources?.length || 0}</strong></span>
                    </div>
                    {skillScoreProgress.explanation.mainGap && (
                      <p className="text-[11px] text-amber-300">
                        <strong>Identified Gap:</strong> {skillScoreProgress.explanation.mainGap}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-300">
                      <strong>Next Step:</strong> {skillScoreProgress.explanation.actionableRecommendation}
                    </p>
                  </div>
                )}

                {/* Distinction: Mission Completion != Mastery */}
                {progress.passed && !skillScoreProgress.isMastered && (
                  <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-200 flex items-center justify-between">
                    <span>
                      <strong>Mission Passed:</strong> You completed the required modules. Continuing practice labs and remediation retries will lift verified skill score to the 80% mastery threshold.
                    </span>
                  </div>
                )}

                <div className="pt-2 text-xs text-slate-300 flex items-center justify-between">
                  <span>
                    <strong className="text-slate-200">Next Action:</strong>{" "}
                    {progress.passed
                      ? "Advance to the next mission module or continue practice labs."
                      : "Target diagnosed concept weaknesses and retry the assessment."}
                  </span>
                </div>
              </div>
            )}

            {/* 2. ADAPTIVE ROADMAP TRIGGER BANNER (Explainable Adaptation Notice) */}
            {(diagnosticReport?.roadmapAdjusted || (finalScore !== null && finalScore < 70)) && (
              <div className="p-5 sm:p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-xl relative overflow-hidden space-y-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-amber-200">
                        ⚡ Adaptive Roadmap Engine Activated
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                        CURRICULUM ADJUSTED
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {diagnosticReport?.adjustmentMessage ||
                        `Based on your assessment performance, the Career OS has adapted your curriculum by scheduling a targeted remediation session for ${
                          diagnosticReport?.criticalConcepts?.[0] || diagnosticReport?.weakConcepts?.[0] || weakAreas[0] || dayPlan?.topic || "the flagged concepts"
                        } before introducing subsequent advanced topics.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. 3-TIER CAREER READINESS IMPACT METERS */}
            <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    Live Readiness Impact
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Target: {targetRole}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Resume Fit */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    1. Resume Fit (Baseline)
                  </span>
                  <p className="text-2xl font-extrabold font-mono text-white">
                    {readinessScores?.resumeFit ?? 75}%
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Static match against target role profile
                  </p>
                </div>

                {/* Skill Readiness */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-cyan-400 block">
                    2. Skill Readiness (Empirical)
                  </span>
                  <p className="text-2xl font-extrabold font-mono text-cyan-300">
                    {readinessScores?.skillReadiness ?? (finalScore ?? 0)}%
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Verified through labs &amp; assessment questions
                  </p>
                </div>

                {/* Career Readiness */}
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-indigo-300 block font-semibold">
                    3. Career Readiness (Unified)
                  </span>
                  <p className="text-2xl font-extrabold font-mono bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">
                    {readinessScores?.careerReadiness ??
                      Math.round(((readinessScores?.resumeFit ?? 75) * 0.35) + ((readinessScores?.skillReadiness ?? (finalScore ?? 0)) * 0.65))}%
                  </p>
                  <p className="text-[10px] text-indigo-300/80">
                    Composite interview-ready hireability score
                  </p>
                </div>
              </div>
            </div>

            {/* 4. CONCEPT-LEVEL DIAGNOSTIC BREAKDOWN */}
            {(() => {
              const conceptsList = diagnosticReport?.conceptDiagnosis
                ? Object.values(diagnosticReport.conceptDiagnosis)
                : [];
              return (
                <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-purple-400" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                        Concept-Level Diagnostics
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {conceptsList.length} Evaluated Concepts
                    </span>
                  </div>

                  {conceptsList.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {conceptsList.map((cp, idx) => {
                        const statusConfig = {
                          STRONG: {
                            badge: "badge-tech-emerald",
                            label: "STRONG",
                            border: "border-emerald-500/30",
                            text: "text-emerald-400",
                          },
                          DEVELOPING: {
                            badge: "badge-tech-cyan",
                            label: "DEVELOPING",
                            border: "border-cyan-500/30",
                            text: "text-cyan-400",
                          },
                          WEAK: {
                            badge: "badge-tech-amber",
                            label: "WEAK",
                            border: "border-amber-500/30",
                            text: "text-amber-400",
                          },
                          CRITICAL: {
                            badge: "badge-tech-rose",
                            label: "CRITICAL GAP",
                            border: "border-rose-500/30",
                            text: "text-rose-400",
                          },
                        }[cp.status] || {
                          badge: "badge-tech-amber",
                          label: cp.status,
                          border: "border-white/10",
                          text: "text-slate-300",
                        };

                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-xl border bg-white/[0.02] flex items-center justify-between gap-3 ${statusConfig.border}`}
                          >
                            <div className="min-w-0 space-y-0.5">
                              <p className="text-xs font-bold text-white truncate">
                                {cp.concept}
                              </p>
                              <p className="text-[10px] font-mono text-slate-400 truncate">
                                {cp.topic} &middot; {cp.correct}/{cp.total} correct
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className={`badge-tech ${statusConfig.badge} text-[10px]`}>
                                {statusConfig.label} ({cp.score}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white/[0.02] text-xs font-mono text-slate-400">
                      Concept scores synthesized: {weakAreas.length === 0 ? "All verified proficient" : `Attention needed on: ${weakAreas.join(", ")}`}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 5. QUALITATIVE INSIGHTS (What You Did Well & Needs Attention) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* What You Did Well */}
              <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>What You Did Well</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {diagnosticReport?.whatWentWell && diagnosticReport.whatWentWell.length > 0 ? (
                    diagnosticReport.whatWentWell.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 shrink-0 mt-0.5 font-bold">✓</span>
                        <span>{point}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400">
                      Demonstrated foundational understanding of practical concepts.
                    </li>
                  )}
                </ul>
              </div>

              {/* Needs Attention */}
              <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase">
                  <AlertCircle className="w-4 h-4" />
                  <span>Needs Attention</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {diagnosticReport?.needsAttention && diagnosticReport.needsAttention.length > 0 ? (
                    diagnosticReport.needsAttention.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 shrink-0 mt-0.5 font-bold">!</span>
                        <span>{point}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400">
                      No critical weaknesses identified for this mission sequence.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* 6. AI COACH RECOMMENDATION */}
            {diagnosticReport?.aiRecommendation && (
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-slate-900 border border-purple-500/30 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 text-xs font-mono font-bold uppercase">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>AI Learning Coach Recommendation</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {diagnosticReport.aiRecommendation}
                </p>
              </div>
            )}

            {/* Question by Question Review */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400">
                Detailed Assessment Breakdown & Explanations:
              </h3>
              {questions.map((q, qIdx) => {
                const userAns = answers[q.id];
                const isCorrect = userAns === q.correctAnswer;
                return (
                  <div
                    key={q.id || qIdx}
                    className={`p-5 rounded-2xl border space-y-3 ${
                      isCorrect
                        ? "bg-emerald-500/[0.03] border-emerald-500/20"
                        : "bg-rose-500/[0.03] border-rose-500/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          Question {qIdx + 1}: {q.question}
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {isCorrect ? "Correct (+10%)" : "Incorrect (0%)"}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 font-sans pl-7">
                      <p className="text-slate-300">
                        <span className="text-slate-500">Your Answer:</span>{" "}
                        <span className={isCorrect ? "text-emerald-300 font-semibold" : "text-rose-300 font-semibold"}>
                          {userAns !== undefined ? q.options[userAns] : "Not answered"}
                        </span>
                      </p>
                      {!isCorrect && (
                        <p className="text-slate-300">
                          <span className="text-slate-500">Correct Answer:</span>{" "}
                          <span className="text-emerald-300 font-semibold">
                            {q.options[(q.correctAnswer ?? q.correctIndex) ?? 0]}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Explanations */}
                    {q.explanation && (
                      <div className="pl-7 pt-2 border-t border-white/[0.04] text-xs text-slate-400 space-y-1">
                        {typeof q.explanation === "object" ? (
                          <>
                            <p className="text-emerald-400">
                              ✔ <span className="font-semibold">Why Correct:</span> {q.explanation.whyCorrect}
                            </p>
                            {q.explanation.keyPrinciple && (
                              <p className="text-slate-300">
                                💡 <span className="font-semibold">Core Principle:</span> {q.explanation.keyPrinciple}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-slate-300">
                            💡 <span className="font-semibold">Explanation:</span> {q.explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
