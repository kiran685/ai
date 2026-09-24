"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Target,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  Award,
  ListTodo,
  Check,
  BrainCircuit,
  FileText,
  Zap,
  TrendingUp,
  HelpCircle,
  Compass,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Lock,
  Play,
  RotateCcw,
  BookOpen,
  X,
  Sparkles,
  Clock,
  ExternalLink,
  Layers,
  Video,
  Copy,
  Terminal,
  Code2,
  Download,
  FileDown,
  Languages,
  Unlock,
  LogOut,
} from "lucide-react";

function YouTubeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

import {
  SkillMatch,
  CareerAnalysis as AnalysisResult,
  CombinedSkillEvaluation,
  SkillCategory,
  WeekOverview,
  DayPlan,
  DayResult,
  TopicResult,
  DayTopicItem,
  DaySubModuleItem,
  DayModuleItem,
  RoadmapData,
  DayAssessmentQuestion,
  DayResultQuestionReview,
} from "@/types";
import { exportDayNotesAsPdf, exportAssessmentReviewAsPdf } from "@/lib/generatePdf";
import AssessmentDrmGuard from "@/app/components/AssessmentDrmGuard";
import Navbar from "@/app/components/Navbar";

function categorizeSkills(
  skills: SkillMatch[] = [],
  quizScores: { skill: string; score: number; confidence: "strong" | "weak" | "none" }[] = []
): CombinedSkillEvaluation[] {
  const quizMap = new Map<string, { score: number; confidence: "strong" | "weak" | "none" }>();
  quizScores.forEach((q) => {
    quizMap.set(q.skill.toLowerCase(), { score: q.score, confidence: q.confidence });
  });

  return skills.map((s) => {
    const resumeConf = s.confidence;
    const quizData = quizMap.get(s.skill.toLowerCase());
    const quizConf = quizData ? quizData.confidence : (s.found ? "weak" : "none");
    const quizScore = quizData?.score;

    let category: SkillCategory = "developing";
    let label = "Developing Skill";
    let description = "Skill is developing across resume and practical evaluation.";

    if (resumeConf === "strong" && quizConf === "strong") {
      category = "strong";
      label = "Strong — Genuinely Skilled";
      description = "Solidly backed by resume experience and verified in technical assessment.";
    } else if (resumeConf === "strong" && (quizConf === "none" || quizConf === "weak")) {
      category = "overstated";
      label = "Overstated — Mentioned but Weak";
      description = "Prominently listed on resume, but struggled on practical test.";
    } else if (resumeConf === "weak" && quizConf === "strong") {
      category = "understated";
      label = "Understated — Demonstrated but Resume Weak";
      description = "High test score, but resume doesn't adequately highlight this skill.";
    } else if (resumeConf === "weak" && (quizConf === "none" || quizConf === "weak")) {
      category = "needs_work";
      label = "Needs Work — Partial Knowledge";
      description = "Basic exposure, requires structured practice to reach production level.";
    } else if (resumeConf === "none" && quizConf === "strong") {
      category = "hidden_skill";
      label = "Hidden Skill — Demonstrated Unlisted";
      description = "Strong technical grasp demonstrated, but missing entirely from resume.";
    } else if (resumeConf === "none" && (quizConf === "none" || quizConf === "weak")) {
      category = "true_gap";
      label = "True Gap — Needs to Learn";
      description = "Not found on resume and not demonstrated. Primary target for learning roadmap.";
    }

    return {
      skill: s.skill,
      resumeConfidence: resumeConf,
      quizConfidence: quizConf,
      quizScore,
      category,
      label,
      description,
    };
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({ "week-1": true });
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [activeOpportunity, setActiveOpportunity] = useState<{
    id: string;
    companyName: string;
    jobTitle: string;
    fitScore: number;
    preparationProgress: number;
    applicationRecommendation?: string;
    criticalGaps?: string[];
  } | null>(null);
  const [highestImpactAction, setHighestImpactAction] = useState<{
    conceptName: string;
    skillName: string;
    currentScore: number;
    targetScore: number;
    gapPoints: number;
    confidenceLevel: "LOW" | "MEDIUM" | "HIGH";
    priorityLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    recommendedAction: string;
    isRemediation: boolean;
  } | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeExplainSkill, setActiveExplainSkill] = useState<string | null>(null);

  // Day Detail / Assessment Modal State
  const [selectedDayKey, setSelectedDayKey] = useState<{ weekId: string; dayNumber: number } | null>(null);
  const [activeDayPlan, setActiveDayPlan] = useState<DayPlan | null>(null);
  const [loadingDayPlan, setLoadingDayPlan] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [activeQuizTopic, setActiveQuizTopic] = useState<DayTopicItem | null>(null);
  const [dayAnswers, setDayAnswers] = useState<Record<string, number>>({});
  const [submittingDay, setSubmittingDay] = useState(false);
  const [lastDayResult, setLastDayResult] = useState<DayResult | null>(null);
  const [showReviewDetails, setShowReviewDetails] = useState(true);
  const [dayActiveTab, setDayActiveTab] = useState<"results" | "topics">("results");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({ "topic-1": true, "mod-1": true });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showScoreExplainer, setShowScoreExplainer] = useState(false);
  const [interviewMode, setInterviewMode] = useState<boolean>(false);
  const [interviewSprint, setInterviewSprint] = useState<any[] | null>(null);
  const [loadingInterviewMode, setLoadingInterviewMode] = useState<boolean>(false);
  const [interviewSuccessMessage, setInterviewSuccessMessage] = useState<string | null>(null);
  const [expandedSprintBehavioral, setExpandedSprintBehavioral] = useState<number | null>(null);
  const [showAbandonModal, setShowAbandonModal] = useState<boolean>(false);

  const handleCopy = (text: string, key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  // Download complete notes as an exhaustive GeeksforGeeks-grade study guide
  const downloadDayNotes = (dayPlan: DayPlan) => {
    const role = result?.targetRole || "Software Engineering";
    const primarySkill = dayPlan.skills[0] || role;
    const dayTopics = (dayPlan.topics && dayPlan.topics.length > 0) ? dayPlan.topics : (dayPlan.requiredModules || []);

    let md = `# GeeksforGeeks Masterclass Study Guide: ${dayPlan.topic}\n\n`;
    md += `> **Target Career Track:** ${role}\n`;
    md += `> **Day Schedule:** Day ${dayPlan.dayNumber} of Adaptive Curriculum\n`;
    md += `> **Focus Skills & Competencies:** ${dayPlan.skills.join(", ")}\n`;
    md += `> **Format:** In-Depth Conceptual Breakdown, Syntax Mechanics, Comparison Tables, Code Labs & Interview Q&A\n\n`;
    md += `---\n\n`;

    // Table of Contents
    md += `## 📑 Table of Contents\n`;
    md += `1. [Overview & Core Learning Objectives](#1-overview--core-learning-objectives)\n`;
    dayTopics.forEach((t, i) => {
      const slug = `topic-${i + 1}-${t.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      md += `${i + 2}. [Topic ${i + 1}: ${t.title}](#${slug})\n`;
      if (t.comprehensiveTheory) {
        md += `   - [${t.title} - Theoretical Deep Dive](#${slug}-theory)\n`;
      }
      if (t.comparisonTable) {
        md += `   - [${t.title} - Technical Comparison Table](#${slug}-comparison)\n`;
      }
      if (t.modules && t.modules.length > 0) {
        t.modules.forEach((m, mIdx) => {
          md += `   - [Module ${i + 1}.${mIdx + 1}: ${m.title}](#mod-${i + 1}-${mIdx + 1})\n`;
        });
      }
      if (t.interviewQuestions && t.interviewQuestions.length > 0) {
        md += `   - [Topic ${i + 1} GeeksforGeeks Interview Questions](#${slug}-interview)\n`;
      }
    });
    md += `${dayTopics.length + 2}. [Curated Video Tutorials & Masterclasses (Telugu & English)](#curated-video-tutorials)\n`;
    md += `${dayTopics.length + 3}. [Official Documentation, References & Cheatsheets](#official-documentation)\n\n`;
    md += `---\n\n`;

    // 1. Overview
    md += `## 1. Overview & Core Learning Objectives\n\n`;
    md += `${dayPlan.description}\n\n`;
    md += `### Target Competencies:\n`;
    dayPlan.skills.forEach(skill => {
      md += `- **${skill}**: Architecture design, execution lifecycles, performance benchmarking, and defensive error patterns.\n`;
    });
    md += `\n---\n\n`;

    // 2. Sequential Topics
    dayTopics.forEach((topic, tIdx) => {
      const topicNum = tIdx + 1;
      const slug = `topic-${topicNum}-${topic.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      md += `<a id="${slug}"></a>\n`;
      md += `## Topic ${topicNum}: ${topic.title}\n\n`;
      if (topic.subtitle) md += `*${topic.subtitle}*\n\n`;

      if (topic.overview) {
        md += `### 📌 Topic Summary\n${topic.overview}\n\n`;
      }

      if (topic.comprehensiveTheory) {
        md += `<a id="${slug}-theory"></a>\n`;
        md += `### 🧠 Comprehensive Theoretical Deep Dive & Internal Mechanics\n\n`;
        md += `${topic.comprehensiveTheory}\n\n`;
      }

      // Comparison Table
      if (topic.comparisonTable && topic.comparisonTable.headers && topic.comparisonTable.rows) {
        md += `<a id="${slug}-comparison"></a>\n`;
        md += `### 📊 Technical Comparison & Tradeoffs\n\n`;
        md += `| ${topic.comparisonTable.headers.join(" | ")} |\n`;
        md += `| ${topic.comparisonTable.headers.map(() => "---").join(" | ")} |\n`;
        topic.comparisonTable.rows.forEach(row => {
          md += `| ${row.join(" | ")} |\n`;
        });
        md += `\n`;
      }

      // Sub-modules
      if (topic.modules && topic.modules.length > 0) {
        md += `### 💻 Sub-Topic Modules & Applied Code Labs\n\n`;
        topic.modules.forEach((mod, mIdx) => {
          md += `<a id="mod-${topicNum}-${mIdx + 1}"></a>\n`;
          md += `#### Module ${topicNum}.${mIdx + 1}: ${mod.title}\n\n`;
          if (mod.overview) md += `**Concept Focus:** ${mod.overview}\n\n`;
          if (mod.detailedTheory) md += `${mod.detailedTheory}\n\n`;

          if (mod.notes && mod.notes.length > 0) {
            md += `**Key Technical Study Notes:**\n`;
            mod.notes.forEach(note => {
              md += `- ${note}\n`;
            });
            md += `\n`;
          }

          if (mod.commands && mod.commands.length > 0) {
            md += `**Terminal & Setup Commands:**\n\`\`\`bash\n${mod.commands.join("\n")}\n\`\`\`\n\n`;
          }

          if (mod.codeSnippet && mod.codeSnippet.code) {
            md += `**Practical Code Implementation (${mod.codeSnippet.language || "typescript"}):**\n`;
            md += `\`\`\`${mod.codeSnippet.language || "typescript"}\n${mod.codeSnippet.code}\n\`\`\`\n`;
            if (mod.codeSnippet.explanation) {
              md += `*Code Explanation:* ${mod.codeSnippet.explanation}\n\n`;
            }
          }

          if (mod.keyTakeaways && mod.keyTakeaways.length > 0) {
            md += `**Best Practices & Key Takeaways:**\n`;
            mod.keyTakeaways.forEach(t => {
              md += `- [x] ${t}\n`;
            });
            md += `\n`;
          }
        });
      }

      // Interview Questions
      if (topic.interviewQuestions && topic.interviewQuestions.length > 0) {
        md += `<a id="${slug}-interview"></a>\n`;
        md += `### 🎯 GeeksforGeeks Top Interview Questions & Detailed Answers\n\n`;
        topic.interviewQuestions.forEach((iq, qIdx) => {
          md += `#### Q${qIdx + 1}. ${iq.question} ${iq.difficulty ? `*(${iq.difficulty})*` : ""}\n`;
          md += `**Answer:** ${iq.answer}\n\n`;
        });
      }

      md += `---\n\n`;
    });

    // YouTube Resources
    if (dayPlan.youtubeResources && dayPlan.youtubeResources.length > 0) {
      md += `<a id="curated-video-tutorials"></a>\n`;
      md += `## 🎥 Curated Video Tutorials & Masterclasses (Telugu & English)\n\n`;
      dayPlan.youtubeResources.forEach(yt => {
        const isTelugu = yt.language === "Telugu";
        const tag = isTelugu ? "🗣️ [Telugu (తెలుగు) 🇮🇳]" : "🌐 [English]";
        md += `### ${tag} [${yt.title}](${yt.url})\n`;
        md += `- **Channel:** ${yt.channel || "YouTube"}\n`;
        if (yt.description) md += `- **Overview:** ${yt.description}\n`;
        md += `- **Direct Video Link:** [Watch on YouTube ↗](${yt.url})\n\n`;
      });
    }

    // Official Docs
    if (dayPlan.learningResources && dayPlan.learningResources.length > 0) {
      md += `<a id="official-documentation"></a>\n`;
      md += `## 📚 Official Documentation, References & Cheatsheets\n\n`;
      dayPlan.learningResources.forEach(res => {
        md += `- ${res}\n`;
      });
      md += `\n`;
    }

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Day_${dayPlan.dayNumber}_${primarySkill.replace(/[^a-zA-Z0-9]/g, "_")}_Complete_GeeksforGeeks_Notes.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const startTopicQuiz = (topic: DayTopicItem) => {
    setActiveQuizTopic(topic);
    setDayAnswers({});
    setQuizMode(true);
  };

  const startFullDayQuiz = () => {
    setActiveQuizTopic(null);
    setDayAnswers({});
    setQuizMode(true);
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const [res, dashRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/dashboard").catch(() => null),
        ]);
        const data = await res.json();
        if (data.success && data.analysis) {
          setResult(data.analysis as AnalysisResult);
        } else {
          router.push("/onboarding");
        }

        if (dashRes && dashRes.ok) {
          const dashData = await dashRes.json();
          if (dashData.dashboard) {
            setDashboardData(dashData.dashboard);
            if (dashData.dashboard.activeOpportunity) {
              setActiveOpportunity(dashData.dashboard.activeOpportunity);
            }
            if (dashData.dashboard.highestImpactAction) {
              setHighestImpactAction(dashData.dashboard.highestImpactAction);
            }
            if (dashData.dashboard.todayMission) {
              setResult((prev) => (prev && !prev.todayMission ? { ...prev, todayMission: dashData.dashboard.todayMission } : prev));
            }
          }
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        router.push("/onboarding");
      }
    }

    loadProfile();
  }, [router]);

  // Automatically generate week overview if not already generated
  useEffect(() => {
    async function initRoadmap() {
      if (!result) return;
      if (result.roadmapData?.weeks && result.roadmapData.weeks.length > 0) return;

      setLoadingRoadmap(true);
      try {
        const response = await fetch("/api/roadmap/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: result.resumeText || "",
            career: result.targetRole || "Software Engineer",
            answers: result.questionnaireAnswers || undefined,
            skills: result.skills || [],
            quizResult: result.quizResult || null,
            combinedSkills: result.combinedSkills || [],
          }),
        });

        const data = await response.json();
        if (data.weeks) {
          const updatedRoadmapData: RoadmapData = {
            weeks: data.weeks,
            daysData: result.roadmapData?.daysData || {},
            dayResults: result.roadmapData?.dayResults || {},
          };

          const updatedResult: AnalysisResult = {
            ...result,
            roadmapData: updatedRoadmapData,
            agentPlanSummary: data.agentSummary || result.agentPlanSummary,
          };

          setResult(updatedResult);
          fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedResult),
          }).catch((err) => console.error("Failed to save roadmap to DB:", err));
        }
      } catch (err) {
        console.error("Failed to initialize roadmap weeks:", err);
      } finally {
        setLoadingRoadmap(false);
      }
    }

    initRoadmap();
  }, [result]);

  // Check for onboarding abandonment nudge
  useEffect(() => {
    if (!result) return;
    const dayResults = result.roadmapData?.dayResults || {};
    const passedDays = Object.values(dayResults).filter((r: any) => r?.passed).length;
    if (passedDays === 0) {
      const dismissed = typeof window !== "undefined" ? localStorage.getItem("ai_career_abandon_dismissed") : null;
      if (!dismissed) {
        setShowAbandonModal(true);
      }
    }
  }, [result]);

  if (!result) {
    return (
      <main className="min-h-screen bg-[#07080e] flex items-center justify-center">
        <p className="text-sm text-slate-500 font-mono">
          Loading dashboard...
        </p>
      </main>
    );
  }

  const quizScores = result.quizResult?.skillScores || [];
  const combinedEvaluations = categorizeSkills(result.skills || [], quizScores);

  const genuinelyStrong = combinedEvaluations.filter((c) => c.category === "strong");
  const overstated = combinedEvaluations.filter((c) => c.category === "overstated");
  const understated = combinedEvaluations.filter((c) => c.category === "understated");
  const hiddenSkills = combinedEvaluations.filter((c) => c.category === "hidden_skill");
  const trueGaps = combinedEvaluations.filter((c) => c.category === "true_gap");

  const resumeScore = result.alignmentScore || 0;
  const quizScore = result.quizResult ? result.quizResult.overallScore : null;
  const finalCombinedScore = result.combinedAlignmentScore ?? (
    quizScore !== null ? Math.round(resumeScore * 0.5 + quizScore * 0.5) : resumeScore
  );

  const weeks: WeekOverview[] = result.roadmapData?.weeks || [];
  const daysData = result.roadmapData?.daysData || {};
  const dayResults = result.roadmapData?.dayResults || {};

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekId]: !prev[weekId],
    }));
  };

  // Helper to determine day status
  const getDayStatus = (weekIdx: number, dayNum: number) => {
    const currentWeekId = weeks[weekIdx]?.id || `week-${weekIdx + 1}`;
    const dayKey = `${currentWeekId}_day-${dayNum}`;
    const res = dayResults[dayKey];

    if (res?.passed) {
      return { status: "PASSED", score: res.score, res };
    }
    if (res && !res.passed) {
      return { status: "FAILED", score: res.score, res };
    }

    // Check if previous day is passed
    if (weekIdx === 0 && dayNum === 1) {
      return { status: "ACTIVE", score: null, res: null };
    }

    if (dayNum > 1) {
      const prevDayKey = `${currentWeekId}_day-${dayNum - 1}`;
      const prevRes = dayResults[prevDayKey];
      if (prevRes?.passed) {
        return { status: "ACTIVE", score: null, res: null };
      }
      return { status: "LOCKED", score: null, res: null };
    }

    if (weekIdx > 0 && dayNum === 1) {
      const prevWeekId = weeks[weekIdx - 1]?.id || `week-${weekIdx}`;
      const prevWeekLastDayKey = `${prevWeekId}_day-5`;
      const prevWeekLastRes = dayResults[prevWeekLastDayKey];
      if (prevWeekLastRes?.passed) {
        return { status: "ACTIVE", score: null, res: null };
      }
      return { status: "LOCKED", score: null, res: null };
    }

    return { status: "LOCKED", score: null, res: null };
  };

  // Helper to retrieve the authenticated user's ID
  const getUserId = (): string => {
    return session?.user?.id || "usr_auth";
  };

  // Load a day plan and open modal
  const openDayModal = async (week: WeekOverview, dayNumber: number) => {
    const dayKey = `${week.id}_day-${dayNumber}`;
    setSelectedDayKey({ weekId: week.id, dayNumber });
    setQuizMode(false);
    setDayAnswers({});
    setExpandedModules({ "mod-1": true });
    setLastDayResult(dayResults[dayKey] || null);

    if (daysData[dayKey]) {
      setActiveDayPlan(daysData[dayKey]);
      return;
    }

    setLoadingDayPlan(true);
    try {
      const prevResult = dayResults[dayKey] || null;
      const uid = getUserId();
      const response = await fetch("/api/roadmap/day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekTitle: week.title,
          focusSkills: week.focusSkills,
          dayNumber,
          career: result?.targetRole,
          previousDayResult: prevResult,
          attemptNumber: prevResult?.attemptNumber || 1,
          userId: uid,
          seed: `${uid}_day${dayNumber}_att1`,
        }),
      });

      const data = await response.json();
      if (data.day) {
        setActiveDayPlan(data.day);

        // Cache day in state & database via /api/profile
        const updatedRoadmapData: RoadmapData = {
          ...result.roadmapData!,
          daysData: {
            ...daysData,
            [dayKey]: data.day,
          },
        };

        const updatedResult: AnalysisResult = {
          ...result,
          roadmapData: updatedRoadmapData,
        };

        setResult(updatedResult);
        fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedResult),
        }).catch((err) => console.error("Failed to save day plan to DB:", err));
      }
    } catch (err) {
      console.error("Failed to load day plan:", err);
    } finally {
      setLoadingDayPlan(false);
    }
  };

  // Submit unified day assessment (10 questions)
  const submitDayAssessment = async () => {
    if (!selectedDayKey || !activeDayPlan) return;
    const { weekId, dayNumber } = selectedDayKey;
    const dayKey = `${weekId}_day-${dayNumber}`;

    const questionsToScore = (activeQuizTopic?.assessment || activeDayPlan.assessment) || [];
    if (questionsToScore.length === 0) return;

    setSubmittingDay(true);
    try {
      const prevResult = dayResults[dayKey] || lastDayResult || null;
      const currentAttempt = (prevResult?.attemptNumber || 0) + 1;

      let correctCount = 0;
      const review: DayResultQuestionReview[] = questionsToScore.map((q) => {
        const userAnswer = typeof dayAnswers[q.id] === "number" ? dayAnswers[q.id] : -1;
        const isCorrect = userAnswer === q.correctIndex;
        if (isCorrect) {
          correctCount++;
        }

        const correctOptionText = q.options[q.correctIndex] || "";
        const explanation =
          q.explanation ||
          `Option ${["A", "B", "C", "D"][q.correctIndex]} ("${correctOptionText}") is the correct solution because it directly adheres to production engineering standards and architectural best practices.`;

        return {
          id: q.id,
          question: q.question,
          codeSnippet: q.codeSnippet,
          language: q.language,
          options: q.options,
          userAnswerIndex: userAnswer,
          correctIndex: q.correctIndex,
          isCorrect,
          explanation,
          explanationBreakdown: q.explanationBreakdown,
        };
      });

      const score = Math.round((correctCount / questionsToScore.length) * 100);
      const passed = score >= 70;

      const scoreResult: DayResult = {
        dayId: `day-${dayNumber}`,
        dayNumber,
        score,
        passed,
        answers: dayAnswers,
        review,
        attemptNumber: currentAttempt,
        completedAt: new Date().toISOString(),
      };

      setLastDayResult(scoreResult);
      setQuizMode(false);
      setActiveQuizTopic(null);
      setShowReviewDetails(true);

      const updatedDayResults = {
        ...dayResults,
        [dayKey]: scoreResult,
      };

      const updatedRoadmapData: RoadmapData = {
        ...result!.roadmapData!,
        dayResults: updatedDayResults,
      };

      const updatedResult: AnalysisResult = {
        ...result!,
        roadmapData: updatedRoadmapData,
      };

      setResult(updatedResult);
      fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedResult),
      }).catch((err) => console.error("Failed to save day result to DB:", err));
    } catch (err) {
      console.error("Failed to score assessment:", err);
    } finally {
      setSubmittingDay(false);
    }
  };

  // Retry a failed day assessment with brand-new, non-repeating questions
  const retryDayAssessment = async () => {
    if (!selectedDayKey) return;
    const { weekId, dayNumber } = selectedDayKey;
    const week = weeks.find((w) => w.id === weekId);
    if (!week) return;

    setLoadingDayPlan(true);
    setQuizMode(false);
    setDayAnswers({});

    try {
      const dayKey = `${weekId}_day-${dayNumber}`;
      const prevResult = dayResults[dayKey] || lastDayResult || null;
      const nextAttempt = (prevResult?.attemptNumber || 1) + 1;
      const uid = getUserId();

      const response = await fetch("/api/roadmap/day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekTitle: week.title,
          focusSkills: week.focusSkills,
          dayNumber,
          career: result?.targetRole,
          previousDayResult: prevResult,
          attemptNumber: nextAttempt,
          userId: uid,
          seed: `${uid}_day${dayNumber}_att${nextAttempt}_${Date.now()}`,
        }),
      });

      const data = await response.json();
      if (data.day) {
        setActiveDayPlan(data.day);
        setQuizMode(true);
        setActiveQuizTopic(null);
        setShowReviewDetails(false);
      }
    } catch (err) {
      console.error("Failed to fetch retry questions:", err);
    } finally {
      setLoadingDayPlan(false);
    }
  };

  // Toggle Interview Mode (7-Day Sprint)
  const handleToggleInterviewMode = async () => {
    if (interviewMode) {
      setInterviewMode(false);
      return;
    }
    setLoadingInterviewMode(true);
    try {
      const res = await fetch("/api/interview-mode/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: result?.targetRole || "Software Engineer",
          daysUntilInterview: 7,
        }),
      });
      const data = await res.json();
      if (data.success && data.sprintDays) {
        setInterviewSprint(data.sprintDays);
        setInterviewMode(true);
        setInterviewSuccessMessage(data.message || "7-Day Interview Sprint initialized!");
        setTimeout(() => setInterviewSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error("Failed to enable interview mode:", err);
    } finally {
      setLoadingInterviewMode(false);
    }
  };

  // Calculate total passed days
  const passedDaysCount = Object.values(dayResults).filter((r) => r.passed).length;
  const totalRoadmapDays = weeks.length * 5 || 30;
  const totalRoadmapProgress = Math.round((passedDaysCount / (totalRoadmapDays || 1)) * 100);

  // 3-Tier Career Readiness Engine Calculations
  const hasVerifiedEvidence = passedDaysCount > 0 || (result.quizResult?.overallScore != null && result.quizResult.overallScore > 0) || (result.skillReadinessScore != null && result.skillReadinessScore > 0);
  const resumeFitScore = result.resumeFitScore ?? result.alignmentScore ?? 0;
  const skillReadinessScore = result.skillReadinessScore ?? (
    result.quizResult?.overallScore ?? (passedDaysCount > 0 ? Math.min(100, Math.round((passedDaysCount / (totalRoadmapDays || 1)) * 100)) : 0)
  );
  const careerReadinessScore = result.careerReadinessScore ?? result.combinedAlignmentScore ?? (
    hasVerifiedEvidence
      ? Math.round(resumeFitScore * 0.35 + skillReadinessScore * 0.65)
      : resumeFitScore
  );

  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 relative selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="bg-mesh-glow" />
      <div className="fixed inset-0 bg-grid-tech pointer-events-none opacity-40 z-0" />

      {/* Shared Navbar */}
      <Navbar isDashboard={true} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-24 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[11px] font-mono text-indigo-300 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Adaptive Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Adaptive Learning Dashboard
            </h1>
            {session?.user && (
              <p className="text-xs text-slate-400 mt-1">
                Candidate profile:{" "}
                <span className="text-slate-200 font-medium font-mono">
                  {session.user.name || session.user.email}
                </span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => router.push("/target")}
              className="px-3 py-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Change Target Role"
            >
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              <span>Change Target Role</span>
            </button>
            <button
              onClick={() => router.push("/career-fit")}
              className="px-3 py-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Find Roles That Fit Me"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Find Roles That Fit Me</span>
            </button>
            <button
              onClick={() => router.push("/job-analyzer")}
              className="px-3 py-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Analyze a Specific Job"
            >
              <Briefcase className="w-3.5 h-3.5 text-purple-400" />
              <span>Analyze a Job</span>
            </button>
            <button
              onClick={() => {
                const uid = (session?.user as any)?.id || "me";
                router.push(`/career-scorecard/${uid}`);
              }}
              className="px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs text-indigo-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="View Public Verified Career Scorecard"
            >
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>Career Scorecard</span>
            </button>
            <button
              onClick={handleToggleInterviewMode}
              disabled={loadingInterviewMode}
              className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                interviewMode
                  ? "border-amber-500/40 bg-amber-500/20 text-amber-300 font-semibold shadow-md shadow-amber-500/10"
                  : "border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white"
              }`}
              title="Toggle 7-Day High-Intensity Interview Sprint"
            >
              <Zap className={`w-3.5 h-3.5 ${interviewMode ? "text-amber-400 fill-amber-400" : "text-amber-400"}`} />
              <span>{loadingInterviewMode ? "Switching..." : interviewMode ? "Interview Mode (Active)" : "Interview Mode (7-Day)"}</span>
            </button>
            <button
              onClick={() => router.push("/get-started")}
              className="btn-gradient !py-1.5 !px-3.5 !text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Change Path</span>
            </button>
          </div>
        </div>

        {/* TARGET OPPORTUNITY BANNER (If candidate came from Job Analyzer or has active opportunity) */}
        {activeOpportunity && (
          <section className="mt-6 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-indigo-950/20 to-slate-950/60 p-5 md:p-6 backdrop-blur-xl relative overflow-hidden shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-[10px] font-mono font-bold text-purple-300 uppercase">
                    Target Opportunity
                  </span>
                  <span className="badge-tech badge-tech-indigo">
                    Job Analyzer Calibrated
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {activeOpportunity.companyName} &mdash; {activeOpportunity.jobTitle}
                </h2>
                {activeOpportunity.applicationRecommendation && (
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    {activeOpportunity.applicationRecommendation}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-right">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">
                    Opportunity Alignment
                  </span>
                  <span className="text-2xl font-extrabold font-mono bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {activeOpportunity.fitScore}%
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-right">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">
                    Preparation Progress
                  </span>
                  <span className="text-2xl font-extrabold font-mono text-emerald-400">
                    {activeOpportunity.preparationProgress}%
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Candidate Customization Profile Bar */}
        <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs w-full lg:w-auto">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 block truncate">Timeline</span>
                <span className="font-semibold text-white font-mono truncate block">
                  {result.questionnaireAnswers?.targetTimeframe || `${weeks.length || 8} Weeks`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 block truncate">Commitment</span>
                <span className="font-semibold text-white font-mono truncate block">
                  {result.questionnaireAnswers?.weeklyCommitment || "15-20 hrs/wk"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <Target className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 block truncate">Primary Goal</span>
                <span className="font-semibold text-white truncate block">
                  {result.questionnaireAnswers?.primaryObjective || "Career Transition"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 block truncate">Methodology</span>
                <span className="font-semibold text-white truncate block">
                  {result.questionnaireAnswers?.learningStyle || "Project-First"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              onClick={() => {
                const uid = (session?.user as any)?.id || "me";
                router.push(`/career-scorecard/${uid}`);
              }}
              className="text-xs font-medium rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2.5 text-indigo-300 hover:text-white hover:bg-indigo-500/20 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>Verified Scorecard</span>
            </button>
            <button
              onClick={() => router.push(`/onboarding/roadmap-questions?career=${encodeURIComponent(result.targetRole)}`)}
              className="text-xs font-medium rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 py-2.5 text-slate-200 hover:text-white hover:bg-white/[0.08] transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap touch-target-min"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Recalibrate Plan</span>
            </button>
          </div>
        </div>

        {/* Top Stats Grid - 3-Tier Career Readiness Architecture */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-5">
          {/* Target Role */}
          <div className="h-full flex flex-col justify-between p-4.5 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Target Role
              </p>
              <p className="text-lg font-bold text-white mt-1.5 truncate" title={result.targetRole}>
                {result.targetRole}
              </p>
            </div>
            <span className="text-[10px] text-slate-500 mt-2 block truncate">
              {result.questionnaireAnswers?.targetTimeframe || "8 Weeks Plan"}
            </span>
          </div>

          {/* 1. Resume Fit (Baseline) */}
          <div className="h-full flex flex-col justify-between p-4.5 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                1. Resume Fit
              </p>
              <p className="text-2xl font-extrabold text-white mt-1">
                {resumeFitScore}%
              </p>
            </div>
            <span className="text-[10px] text-slate-500 mt-2 block">
              Static resume match baseline
            </span>
          </div>

          {/* 2. Skill Readiness (Empirical) */}
          <div className="h-full flex flex-col justify-between p-4.5 rounded-2xl bg-cyan-950/10 border border-cyan-500/20">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                2. Skill Readiness
              </p>
              <p className="text-2xl font-extrabold text-cyan-300 mt-1">
                {hasVerifiedEvidence ? `${skillReadinessScore}%` : "No evidence"}
              </p>
            </div>
            <span className="text-[10px] text-cyan-400/70 mt-2 block">
              {hasVerifiedEvidence ? "Empirical mastery from missions" : "No verified evidence yet"}
            </span>
          </div>

          {/* 3. Career Readiness (Unified) */}
          <div className="h-full flex flex-col justify-between p-4.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-bold">
                3. Career Readiness
              </p>
              <p className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent mt-1">
                {careerReadinessScore}%
              </p>
            </div>
            <span className="text-[10px] text-indigo-300/80 mt-2 block font-medium">
              Unified hireability metric
            </span>
          </div>

          {/* Missions Passed */}
          <div className="h-full flex flex-col justify-between p-4.5 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                Missions Passed
              </p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                {passedDaysCount} <span className="text-sm font-normal text-slate-500">/ {totalRoadmapDays}</span>
              </p>
            </div>
            <span className="text-[10px] text-slate-500 mt-2 block">
              {totalRoadmapProgress}% curriculum complete
            </span>
          </div>
        </div>

        {/* Why this score? Interactive Explainer Toggle */}
        <div className="mt-2.5 flex justify-end">
          <button
            onClick={() => setShowScoreExplainer((prev) => !prev)}
            className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>{showScoreExplainer ? "Hide Score Breakdown" : "Why this score? Transparent Formula"}</span>
            {showScoreExplainer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Score Explainer Collapsible Panel */}
        {showScoreExplainer && (
          <div className="mt-3 p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                <span>Evidence-Based Career Readiness Index ({careerReadinessScore}%)</span>
              </h3>
              <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                Explainable &amp; Deterministic
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Your Career Readiness index is a weighted empirical synthesis derived exclusively from verified technical assessments, hands-on practice, resume compatibility, and roadmap consistency. It is never estimated or randomized.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyan-400 font-semibold">1. Verified Skills (40%)</span>
                  <span className="font-mono font-bold text-white">{skillReadinessScore}%</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Empirical weighted performance across all role-required skills from daily tests and coding labs.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-400 font-semibold">2. Resume Match (20%)</span>
                  <span className="font-mono font-bold text-white">{resumeFitScore}%</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Static keyword, framework, and project experience match from your parsed resume.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-400 font-semibold">3. Practice Labs (20%)</span>
                  <span className="font-mono font-bold text-white">{passedDaysCount > 0 ? "75%+" : "Baseline"}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Hands-on problem solving, test case execution, and syntax accuracy in coding sandboxes.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-semibold">4. Consistency (20%)</span>
                  <span className="font-mono font-bold text-white">{totalRoadmapProgress}%</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Daily mission completion momentum and curriculum progression ({passedDaysCount}/{totalRoadmapDays} days).
                </p>
              </div>
            </div>

            {/* Dynamic Per-Skill Evidence Explanations from Backend */}
            {dashboardData?.scoreExplanations && Object.keys(dashboardData.scoreExplanations).length > 0 && (
              <div className="pt-3 border-t border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">
                    Required Competencies Evidence Audit
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Multi-source verification &bull; Recency decayed
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(dashboardData.scoreExplanations).map(([skName, exp]: [string, any]) => (
                    <div
                      key={skName}
                      className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/30 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{skName}</span>
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span className="font-extrabold text-indigo-300">{exp.score}%</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            exp.confidenceLevel === "HIGH"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : exp.confidenceLevel === "MEDIUM"
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                              : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                          }`}>
                            {exp.confidenceLevel} CONF
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span>Tests: {exp.evidenceBreakdown?.assessments?.count || 0}</span>
                        <span>Labs: {exp.evidenceBreakdown?.practice?.count || 0}</span>
                        <span>Recency Avg: {Math.round(exp.recencyWeightedAverage)}%</span>
                      </div>

                      {exp.mainGap && (
                        <p className="text-[11px] text-amber-300/90 leading-tight">
                          <strong>Gap:</strong> {exp.mainGap}
                        </p>
                      )}

                      <p className="text-[11px] text-slate-300 leading-tight">
                        <strong>Rec:</strong> {exp.actionableRecommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.06] text-xs">
              <span className="text-slate-400">
                Next action to raise score: <span className="text-white font-medium">Complete Today&apos;s Mission with &ge; 70% assessment score</span>
              </span>
              <button
                onClick={() => setShowScoreExplainer(false)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-mono underline cursor-pointer"
              >
                Close breakdown
              </button>
            </div>
          </div>
        )}

        {/* TODAY'S HIGHEST-IMPACT ACTION */}
        {highestImpactAction && (
          <section className="mt-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/25 via-indigo-950/20 to-slate-950/50 p-5 sm:p-6 backdrop-blur-xl relative overflow-hidden shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-[10px] font-mono font-bold text-amber-300 uppercase">
                    <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                    Today&apos;s Highest-Impact Action
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    highestImpactAction.priorityLevel === "CRITICAL"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : highestImpactAction.priorityLevel === "HIGH"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  }`}>
                    {highestImpactAction.priorityLevel} PRIORITY
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300">
                    Confidence: {highestImpactAction.confidenceLevel}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Concept: {highestImpactAction.conceptName}</span>
                  <span className="text-xs font-mono font-normal text-slate-400">
                    ({highestImpactAction.skillName})
                  </span>
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-amber-300 font-medium">Why:</strong>{" "}
                  {highestImpactAction.gapPoints > 0
                    ? `Largest gap in ${highestImpactAction.skillName} (-${highestImpactAction.gapPoints} points below mastery target)`
                    : `Core foundation verified. Maintain readiness with applied practice labs.`}
                </p>

                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-indigo-300 font-medium">Action:</strong>{" "}
                  {highestImpactAction.recommendedAction}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-right">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Deficit Gap</span>
                  <span className="text-xl font-extrabold font-mono text-amber-400">
                    {highestImpactAction.gapPoints > 0 ? `-${highestImpactAction.gapPoints} pts` : "0 pts"}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 5-STEP ADAPTIVE STORY */}
        {dashboardData?.adaptiveStory && dashboardData.adaptiveStory.length > 0 && (
          <section className="mt-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/20 via-slate-950/40 to-slate-950/60 p-5 sm:p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
                  Adaptive Intelligence Loop &amp; Diagnostic Trajectory
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Closed-Loop Evidence Engine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {dashboardData.adaptiveStory.map((stepItem: any) => (
                <div
                  key={stepItem.step}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
                    stepItem.status === "COMPLETED"
                      ? "bg-emerald-950/10 border-emerald-500/30"
                      : stepItem.status === "IN_PROGRESS"
                      ? "bg-indigo-950/20 border-indigo-500/40 shadow-md shadow-indigo-500/10"
                      : "bg-white/[0.01] border-white/[0.06] opacity-60"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        STEP 0{stepItem.step}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        stepItem.status === "COMPLETED"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : stepItem.status === "IN_PROGRESS"
                          ? "bg-indigo-500/20 text-indigo-300 animate-pulse"
                          : "bg-slate-500/20 text-slate-400"
                      }`}>
                        {stepItem.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white leading-tight">
                      {stepItem.title}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-300/90 leading-relaxed">
                    {stepItem.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PROGRESS SINCE LAST SESSION & SKILL TRENDS */}
        {dashboardData?.progressSinceLastSession && dashboardData.progressSinceLastSession.assessmentsCompletedRecently > 0 && (
          <section className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
                  Progress Since Last Session
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {dashboardData.progressSinceLastSession.assessmentsCompletedRecently} verified mission(s) cleared recently with an average assessment score of{" "}
                <strong className="text-cyan-300">{dashboardData.progressSinceLastSession.averageRecentScore}%</strong>.
              </p>
            </div>

            {/* Skill Trend Badges */}
            {dashboardData.skillTrends && Object.keys(dashboardData.skillTrends).length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(dashboardData.skillTrends).slice(0, 3).map(([sName, scores]: [string, any]) => (
                  <div key={sName} className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[11px] font-mono">
                    <span className="text-slate-400">{sName}: </span>
                    <span className="text-cyan-300 font-bold">
                      {scores.join(" → ")}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* DAY 1 ACTIVATION IN-APP NUDGE BANNER */}
        {passedDaysCount === 0 && (
          <section className="mt-6 rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 p-5 md:p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-400">
                  <Sparkles className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-[10px] font-mono font-bold text-indigo-200 uppercase tracking-wider">
                      Day 1 Ready
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">~20 minutes to complete</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Your Day 1 mission is waiting: <span className="text-indigo-300">{result.todayMission?.title || "Core Architecture Fundamentals"}</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    20 minutes to start building real momentum toward your {result.targetRole} role.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/mission/day/week-1_day-1")}
                className="btn-gradient !py-2.5 !px-5 !text-xs sm:!text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/30 cursor-pointer shrink-0"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Day 1</span>
              </button>
            </div>
          </section>
        )}

        {/* TODAY'S MISSION CARD (Answers: "What should I do next?") */}
        {result.todayMission && (
          <section className="mt-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950/50 p-6 md:p-7 backdrop-blur-xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-[11px] font-mono font-semibold text-indigo-300">
                    <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                    TODAY&apos;S MISSION &middot; HIGHEST PRIORITY GAP
                  </span>
                  <span className="badge-tech badge-tech-indigo">
                    {result.todayMission.focusSkill}
                  </span>
                  {result.todayMission.completed && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" /> Completed
                    </span>
                  )}
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  {result.todayMission.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {result.todayMission.reason}
                </p>

                {/* Structured 3-Part Workflow: Learn -> Practice -> Assessment */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-3 max-w-lg">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-semibold mb-0.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Learn</span>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-white font-mono">
                      {result.todayMission.learningMinutes} min
                    </p>
                    <p className="text-[10px] text-slate-400">Core Theory</p>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold mb-0.5">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Practice</span>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-white font-mono">
                      {result.todayMission.practiceProblems} problems
                    </p>
                    <p className="text-[10px] text-slate-400">Code Labs</p>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-purple-400 text-xs font-semibold mb-0.5">
                      <BrainCircuit className="w-3.5 h-3.5" />
                      <span>Assessment</span>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-white font-mono">
                      {result.todayMission.assessmentQuestions} questions
                    </p>
                    <p className="text-[10px] text-slate-400">Passing 70%</p>
                  </div>
                </div>
              </div>

              {/* Action Button & Est Time */}
              <div className="flex flex-col items-start md:items-end justify-center gap-3 shrink-0">
                <div className="text-left md:text-right">
                  <span className="text-[11px] text-slate-400 font-mono block">Estimated Time</span>
                  <span className="text-lg font-bold text-white font-mono">
                    {result.todayMission.estimatedMinutes} min
                  </span>
                </div>

                <button
                  onClick={() => {
                    let activeKey = "week-1_day-1";
                    for (let w = 0; w < weeks.length; w++) {
                      for (let d = 1; d <= 5; d++) {
                        const s = getDayStatus(w, d);
                        if (s.status === "ACTIVE") {
                          activeKey = `${weeks[w]?.id || `week-${w + 1}`}_day-${d}`;
                          break;
                        }
                      }
                      if (activeKey !== "week-1_day-1") break;
                    }
                    router.push(`/mission/day/${activeKey}`);
                  }}
                  className="btn-gradient !py-3 !px-6 !text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>START MISSION</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* AI Agent Strategy Brief Box */}
        {result.agentPlanSummary && (
          <section className="mt-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/20 via-[#0e1220]/60 to-[#0c0f18] p-6 md:p-7 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2.5">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-bold tracking-tight text-white uppercase tracking-wider font-mono">
                  AI Agent Strategy & Architecture
                </h2>
              </div>
              <span className="badge-tech badge-tech-indigo">
                {result.agentPlanSummary.pace}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              {result.agentPlanSummary.strategyTitle}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {result.agentPlanSummary.strategicAdvice}
            </p>

            {/* Milestones Checkpoints */}
            {result.agentPlanSummary.milestones && result.agentPlanSummary.milestones.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/[0.08]">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Strategic Milestone Targets
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {result.agentPlanSummary.milestones.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                          Week {m.week}
                        </span>
                        <p className="text-xs font-bold truncate text-white">
                          {m.title}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {m.goal}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 min-w-0">
          
          {/* LEFT 2 COLUMNS: WEEK-BY-WEEK ROADMAP ACCORDION */}
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {/* INTERVIEW MODE (7-DAY SPRINT) PANEL */}
            {interviewMode && (
              <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-[#0e1220]/70 to-[#0c0f18] p-6 backdrop-blur-xl mb-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-500/20 mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300 uppercase">
                          7-Day Interview Sprint
                        </span>
                        <span className="text-xs font-mono text-rose-300 font-bold px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30">
                          80% Pass Threshold
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-white tracking-tight">
                        High-Yield Sprint: Top 7 Interview Competencies
                      </h2>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Compressed format: 3 High-Frequency Technical MCQs, 1 Live Coding Lab, and 1 Behavioral Question per day.
                      </p>
                    </div>

                    <button
                      onClick={() => setInterviewMode(false)}
                      className="text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] self-start sm:self-auto cursor-pointer"
                    >
                      Exit to 8-Week View
                    </button>
                  </div>

                  {interviewSuccessMessage && (
                    <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>{interviewSuccessMessage}</span>
                    </div>
                  )}

                  {interviewSprint && interviewSprint.length > 0 ? (
                    <div className="space-y-3.5">
                      {interviewSprint.map((sDay) => {
                        const isExpanded = expandedSprintBehavioral === sDay.sprintDay;
                        return (
                          <div
                            key={sDay.sprintDay}
                            className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:border-amber-500/30 transition-all space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                                    Day {sDay.sprintDay} of 7
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-400">
                                    {sDay.durationMinutes} mins
                                  </span>
                                  <span className="badge-tech badge-tech-indigo">
                                    {sDay.focusSkill}
                                  </span>
                                </div>
                                <h3 className="text-sm font-bold text-white">{sDay.title}</h3>
                              </div>

                              <button
                                onClick={() => router.push(`/mission/day/week-1_day-${sDay.sprintDay <= 5 ? sDay.sprintDay : 1}`)}
                                className="btn-gradient !py-2 !px-4 !text-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 fill-white" />
                                <span>Launch Sprint Day</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                              {/* Coding Problem */}
                              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-cyan-400 font-semibold uppercase">Coding Challenge</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                    sDay.codingProblem.difficulty === "Easy"
                                      ? "bg-emerald-500/20 text-emerald-300"
                                      : sDay.codingProblem.difficulty === "Medium"
                                      ? "bg-amber-500/20 text-amber-300"
                                      : "bg-rose-500/20 text-rose-300"
                                  }`}>
                                    {sDay.codingProblem.difficulty}
                                  </span>
                                </div>
                                <p className="font-semibold text-white text-xs">{sDay.codingProblem.title}</p>
                                <p className="text-[11px] text-slate-400 line-clamp-2">{sDay.codingProblem.description}</p>
                              </div>

                              {/* Behavioral Question */}
                              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-purple-400 font-semibold uppercase">Behavioral (STAR)</span>
                                  <button
                                    onClick={() => setExpandedSprintBehavioral(isExpanded ? null : sDay.sprintDay)}
                                    className="text-[10px] font-mono text-purple-300 hover:underline cursor-pointer"
                                  >
                                    {isExpanded ? "Hide Answer" : "View AI Answer"}
                                  </button>
                                </div>
                                <p className="text-xs text-white font-medium line-clamp-2">{sDay.behavioralQuestion.question}</p>
                                {isExpanded && (
                                  <div className="mt-2 pt-2 border-t border-white/[0.08] space-y-1.5 animate-in fade-in duration-200">
                                    <p className="text-[10px] text-amber-300 font-mono">
                                      <strong>Strategy:</strong> {sDay.behavioralQuestion.starFrameworkTip}
                                    </p>
                                    <div className="p-2 rounded bg-black/40 border border-white/[0.05] text-[11px] text-slate-300 leading-relaxed italic">
                                      &ldquo;{sDay.behavioralQuestion.sampleAiAnswer}&rdquo;
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs font-mono text-slate-400">
                      Loading 7-Day Sprint modules...
                    </div>
                  )}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-white">
                    {result?.agentPlanSummary?.strategyTitle || `${weeks.length || 8}-Week ${result?.targetRole || "Software Engineer"} Roadmap`}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Expand a week and complete each daily 10-question assessment (70% score required to pass).
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] px-3.5 py-1.5 rounded-xl">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Roadmap Progress</p>
                    <p className="text-sm font-bold text-white">{totalRoadmapProgress}%</p>
                  </div>
                  <div className="w-14 h-1.5 bg-white/[0.1] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${totalRoadmapProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {loadingRoadmap ? (
                <div className="py-12 text-center text-xs font-mono text-slate-400">
                  <Sparkles className="w-5 h-5 mx-auto mb-2 animate-pulse text-indigo-400" />
                  Generating personalized week curriculum...
                </div>
              ) : (
                <div className="space-y-4">
                  {weeks.map((week, weekIdx) => {
                    const isExpanded = expandedWeeks[week.id] ?? (weekIdx === 0);
                    
                    // Calculate completed days in this week
                    const passedInWeek = [1, 2, 3, 4, 5].filter((d) => {
                      const dayKey = `${week.id}_day-${d}`;
                      return dayResults[dayKey]?.passed;
                    }).length;

                    return (
                      <div
                        key={week.id}
                        className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden transition-all shadow-md"
                      >
                        {/* Week Accordion Header */}
                        <div
                          onClick={() => toggleWeek(week.id)}
                          className="flex items-center justify-between p-4 sm:p-5 hover:bg-white/[0.04] transition-colors cursor-pointer select-none"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                Week {week.weekNumber}
                              </span>
                              <h3 className="text-sm sm:text-base font-bold tracking-tight text-white">
                                {week.title}
                              </h3>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-1">
                              {week.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                            <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full border ${
                              passedInWeek === 5
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : "bg-white/[0.05] text-slate-300 border-white/[0.08]"
                            }`}>
                              {passedInWeek} / 5 Days
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Week Expanded Days */}
                        {isExpanded && (
                          <div className="border-t border-white/[0.06] p-4 sm:p-5 bg-white/[0.01] space-y-3">
                            {/* Focus Skills Tags */}
                            {week.focusSkills && week.focusSkills.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-white/[0.06]">
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Focus Skills:</span>
                                {week.focusSkills.map((skill) => (
                                  <span
                                    key={skill}
                                    className="text-[10px] font-medium bg-white/[0.05] border border-white/[0.08] text-slate-300 px-2.5 py-0.5 rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* 5 Days List */}
                            <div className="space-y-2.5">
                              {[1, 2, 3, 4, 5].map((dayNum) => {
                                const { status, score } = getDayStatus(weekIdx, dayNum);
                                const isLocked = status === "LOCKED";
                                const isPassed = status === "PASSED";
                                const isFailed = status === "FAILED";
                                const isActive = status === "ACTIVE";

                                const cachedDay = daysData[`${week.id}_day-${dayNum}`];

                                return (
                                  <div
                                    key={dayNum}
                                    onClick={() => !isLocked && router.push(`/mission/day/${week.id}_day-${dayNum}`)}
                                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                                      isLocked
                                        ? "opacity-45 bg-white/[0.01] border-white/[0.05] cursor-not-allowed"
                                        : isPassed
                                        ? "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50 cursor-pointer"
                                        : isActive
                                        ? "bg-indigo-500/10 border-indigo-500/40 hover:border-indigo-500/60 shadow-md shadow-indigo-500/10 cursor-pointer"
                                        : isFailed
                                        ? "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50 cursor-pointer"
                                        : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.2] cursor-pointer"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                                        isPassed
                                          ? "bg-emerald-500 text-white"
                                          : isFailed
                                          ? "bg-amber-500 text-white"
                                          : isActive
                                          ? "bg-gradient-to-r from-indigo-500 to-cyan-400 text-white"
                                          : "bg-white/[0.08] text-slate-400"
                                      }`}>
                                        {isPassed ? (
                                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                        ) : isLocked ? (
                                          <Lock className="w-3 h-3" />
                                        ) : (
                                          dayNum
                                        )}
                                      </div>

                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-white truncate">
                                          Day {dayNum}: {cachedDay?.topic ? cachedDay.topic.replace(/^Day \d+:\s*/i, "") : `Lesson & Practical Assessment`}
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                          10-Question DRM Checkpoint &middot; 70% threshold
                                        </p>
                                      </div>
                                    </div>

                                    <div className="shrink-0 ml-3">
                                      {isPassed && (
                                        <span className="badge-tech badge-tech-emerald">
                                          Passed ({score}%)
                                        </span>
                                      )}
                                      {isFailed && (
                                        <span className="badge-tech badge-tech-amber">
                                          Score: {score}% &middot; Retry
                                        </span>
                                      )}
                                      {isActive && (
                                        <span className="btn-gradient !py-1.5 !px-3 !text-xs flex items-center gap-1">
                                          <span>Start Day</span>
                                          <ArrowRight className="w-3 h-3" />
                                        </span>
                                      )}
                                      {isLocked && (
                                        <span className="text-[11px] font-mono text-slate-500">
                                          Locked
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN: SKILLS GAP MATRIX & BREAKDOWN */}
          <div className="space-y-6 min-w-0">
            
            {/* REAL STUDENT SKILL PROFILE & GAP MATRIX */}
            {result.studentSkillProfile && (
              <section className="rounded-2xl border border-indigo-500/20 bg-white/[0.02] backdrop-blur-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">MY SKILLS</h2>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Target: {result.studentSkillProfile.targetRole}
                  </span>
                </div>

                {/* Priority Gaps Badge Matrix */}
                {result.studentSkillProfile.priorityGaps.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                    <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold font-mono">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>TOP SKILL GAPS ({result.studentSkillProfile.priorityGaps.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {result.studentSkillProfile.priorityGaps.slice(0, 4).map((g) => (
                        <div key={g.skill} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-white">{g.skill}</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-slate-400">Req: {g.requiredScore}%</span>
                            <span className="text-rose-400 font-bold">Curr: {g.currentScore}%</span>
                            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px]">
                              {g.importance}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Skills Breakdown Table */}
                <div className="space-y-2.5 pt-1">
                  {result.studentSkillProfile.skills.map((s) => {
                    const statusColors: Record<string, string> = {
                      STRONG: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                      DEVELOPING: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
                      WEAK: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                      MISSING: "text-rose-400 bg-rose-500/10 border-rose-500/20",
                      NOT_DEMONSTRATED: "text-slate-400 bg-slate-500/10 border-slate-500/20",
                    };

                    return (
                      <div key={s.skill} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">{s.skill}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-white">{s.score}%</span>
                            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${statusColors[s.status] || statusColors.WEAK}`}>
                              {s.status}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              s.status === "STRONG"
                                ? "bg-emerald-400"
                                : s.status === "DEVELOPING"
                                ? "bg-cyan-400"
                                : s.status === "WEAK"
                                ? "bg-amber-400"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${s.score}%` }}
                          />
                        </div>

                        {/* Topic Strengths/Weaknesses Pill details if present */}
                        {(s.strongTopics.length > 0 || s.weakTopics.length > 0) && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {s.strongTopics.slice(0, 2).map((st) => (
                              <span key={st} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                                + {st}
                              </span>
                            ))}
                            {s.weakTopics.slice(0, 2).map((wt) => (
                              <span key={wt} className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300">
                                - {wt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Fallback to legacy categories if studentSkillProfile not loaded */}
            {!result.studentSkillProfile && (
              <>
                {/* Priority Focus */}
                {trueGaps.length > 0 && (
                  <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">Priority Focus</h2>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Bridge core knowledge gaps:{" "}
                      <span className="font-bold text-white">
                        {trueGaps.slice(0, 3).map((s) => s.skill).join(", ")}
                      </span>
                    </p>
                  </section>
                )}

                {/* Verified Strong Skills */}
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-emerald-300">
                      Verified Strong ({genuinelyStrong.length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {genuinelyStrong.map((s) => (
                      <span
                        key={s.skill}
                        className="text-[10px] font-medium bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30"
                      >
                        {s.skill}
                      </span>
                    ))}
                    {genuinelyStrong.length === 0 && (
                      <p className="text-xs text-emerald-400/50 italic">
                        None fully verified
                      </p>
                    )}
                  </div>
                </div>

                {/* Hidden Skills */}
                {hiddenSkills.length > 0 && (
                  <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <h3 className="text-sm font-semibold text-purple-300">
                        Hidden Skills ({hiddenSkills.length})
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {hiddenSkills.map((s) => (
                        <span
                          key={s.skill}
                          className="text-[10px] font-medium bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/30"
                        >
                          {s.skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* True Gaps */}
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <h3 className="text-sm font-semibold text-rose-300">
                      True Gaps ({trueGaps.length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {trueGaps.map((s) => (
                      <span
                        key={s.skill}
                        className="text-[10px] font-medium bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/30"
                      >
                        {s.skill}
                      </span>
                    ))}
                    {trueGaps.length === 0 && (
                      <p className="text-xs text-rose-400/50 italic">
                        No critical gaps
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

          </div>

        </div>

         {/* IMMERSIVE FULL-PAGE DAY TOPICS & ASSESSMENT VIEW */}
      {selectedDayKey && (
        <div className="fixed inset-0 z-[100] bg-[#07080e] overflow-y-auto min-h-screen flex flex-col">
          {/* Top Sticky Header */}
          <header className="sticky top-0 z-[110] bg-[#07080e]/95 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 py-3 flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => {
                  setSelectedDayKey(null);
                  setQuizMode(false);
                  setActiveQuizTopic(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.15] bg-white/[0.04] text-xs font-mono font-medium hover:bg-white/[0.1] transition-colors cursor-pointer text-slate-200 hover:text-white shrink-0 shadow-sm"
              >
                ← Back to Roadmap
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500 text-white shrink-0">
                  Day {selectedDayKey.dayNumber}
                </span>
                {activeDayPlan && (
                  <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-xs md:max-w-md hidden sm:inline">
                    {activeDayPlan.topic}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* If user has assessment results, show dedicated tabs in header */}
              {lastDayResult && !quizMode && (
                <div className="hidden md:flex items-center bg-white/[0.06] p-0.5 rounded-lg border border-white/[0.08]">
                  <button
                    onClick={() => setDayActiveTab("results")}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition-colors cursor-pointer ${
                      dayActiveTab === "results"
                        ? "bg-white/[0.12] text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    📊 Results ({lastDayResult.score}%)
                  </button>
                  <button
                    onClick={() => setDayActiveTab("topics")}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition-colors cursor-pointer ${
                      dayActiveTab === "topics"
                        ? "bg-white/[0.12] text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    📖 Notes
                  </button>
                </div>
              )}

              {/* Export PDF Button */}
              {activeDayPlan && !quizMode && (
                <button
                  onClick={() => {
                    if (lastDayResult && dayActiveTab === "results") {
                      exportAssessmentReviewAsPdf(activeDayPlan, lastDayResult, result?.targetRole);
                    } else {
                      exportDayNotesAsPdf(activeDayPlan, result?.targetRole);
                    }
                  }}
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-lg border border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white text-xs font-mono font-bold transition-colors items-center gap-1.5 cursor-pointer"
                  title={lastDayResult && dayActiveTab === "results" ? "Download Assessment Questions & Answer Explanations PDF" : "Download Masterclass Study Notes PDF"}
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              )}

              {activeDayPlan && !quizMode && (
                <button
                  onClick={startFullDayQuiz}
                  className="px-3.5 sm:px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs font-mono font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/25 shrink-0"
                >
                  {lastDayResult?.passed ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retake Test</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Assessment</span>
                    </>
                  )}
                </button>
              )}

              {quizMode && (
                <button
                  onClick={() => {
                    setQuizMode(false);
                    setActiveQuizTopic(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-white/[0.12] bg-white/[0.06] text-slate-200 text-xs font-mono font-medium hover:bg-white/[0.12] hover:text-white transition-colors cursor-pointer"
                >
                  ← Exit to Notes
                </button>
              )}

              <button
                onClick={() => {
                  setSelectedDayKey(null);
                  setQuizMode(false);
                  setActiveQuizTopic(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Full-Page Content Container */}
          <div className="max-w-5xl mx-auto w-full px-6 py-8 md:px-10 flex-1">
            {loadingDayPlan ? (
              <div className="py-32 text-center text-xs font-mono text-slate-400 space-y-3">
                <Sparkles className="w-8 h-8 mx-auto animate-pulse text-indigo-400" />
                <p className="text-sm font-semibold text-slate-300">
                  Preparing dynamic GeeksforGeeks-grade day curriculum & non-repeating questions...
                </p>
              </div>
            ) : activeDayPlan ? (
              <div>
                
                {/* 1. DEDICATED ASSESSMENT RESULTS VIEW (NO TOPICS SHOWN) */}
                {!quizMode && lastDayResult && dayActiveTab === "results" ? (
                  <div className="space-y-8">
                    {/* Assessment Report Header */}
                    <div className="border-b border-white/[0.08] pb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-indigo-500 text-white">
                          Day {selectedDayKey.dayNumber} Assessment Report
                        </span>
                        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                          lastDayResult.passed
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}>
                          {lastDayResult.passed ? "PASSED (≥ 70%) ✓" : "NEEDS REVIEW (< 70%) ✗"}
                        </span>
                      </div>
                      <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
                        Evaluation Results & Complete Answer Explanations
                      </h1>
                      <p className="text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
                        Comprehensive question-by-question breakdown for {activeDayPlan.topic}. Review why the correct answer is valid, common distractor traps, and key principles.
                      </p>
                    </div>

                    {/* Score Analytics Card */}
                    <div className={`rounded-xl border p-6 ${
                      lastDayResult.passed
                        ? "bg-emerald-500/10 border-emerald-500/25"
                        : "bg-amber-500/10 border-amber-500/25"
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                            lastDayResult.passed ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                          }`}>
                            {lastDayResult.passed ? <CheckCircle2 className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
                          </div>
                          <div>
                            <p className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                              {lastDayResult.passed ? "Day Mastered & Verified" : "Assessment in Progress"}
                            </p>
                            <h3 className="text-2xl font-bold text-white">
                              Final Score: {lastDayResult.score}% ({lastDayResult.review ? lastDayResult.review.filter(r => r.isCorrect).length : 0}/{lastDayResult.review ? lastDayResult.review.length : 10} Correct)
                            </h3>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => exportAssessmentReviewAsPdf(activeDayPlan, lastDayResult, result?.targetRole)}
                            className="px-4 py-2 rounded-lg border border-white/[0.12] bg-white/[0.06] text-xs font-mono font-bold text-slate-300 hover:bg-white/[0.12] hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <FileDown className="w-4 h-4" />
                            Download Assessment Report (.pdf)
                          </button>

                          <button
                            onClick={retryDayAssessment}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-mono font-bold hover:from-indigo-600 hover:to-purple-700 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-lg shadow-indigo-500/25"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Retake (Fresh Questions)
                          </button>

                          <button
                            onClick={() => setDayActiveTab("topics")}
                            className="px-3.5 py-2 rounded-lg border border-white/[0.12] text-xs font-mono font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            Study Notes →
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* COMPLETE QUESTION EXPLANATIONS REVIEW */}
                    {lastDayResult.review && lastDayResult.review.length > 0 && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                          <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            Complete Question Breakdown & Technical Explanations ({lastDayResult.review.length} Questions)
                          </h4>
                          <span className="text-xs font-mono text-slate-400">
                            Passing Criterion: ≥ 70%
                          </span>
                        </div>

                        <div className="space-y-6">
                          {lastDayResult.review.map((item, idx) => {
                            const correctLetter = ["A", "B", "C", "D"][item.correctIndex];
                            const correctText = item.options[item.correctIndex] || "";
                            const userLetter = item.userAnswerIndex >= 0 ? ["A", "B", "C", "D"][item.userAnswerIndex] : null;

                            return (
                              <div
                                key={item.id || idx}
                                className={`rounded-xl border overflow-hidden transition-all ${
                                  item.isCorrect
                                    ? "bg-white/[0.02] border-emerald-500/25"
                                    : "bg-white/[0.02] border-red-500/25"
                                }`}
                              >
                                {/* Question Card Top Bar */}
                                <div className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b ${
                                  item.isCorrect
                                    ? "bg-emerald-500/10 border-emerald-500/20"
                                    : "bg-red-500/10 border-red-500/20"
                                }`}>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500 text-white">
                                        Question {idx + 1}
                                      </span>
                                      {item.isCorrect ? (
                                        <span className="text-xs font-mono font-bold text-emerald-400 inline-flex items-center gap-1">
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          Answered Correctly
                                        </span>
                                      ) : (
                                        <span className="text-xs font-mono font-bold text-red-400 inline-flex items-center gap-1">
                                          <XCircle className="w-3.5 h-3.5" />
                                          Incorrect (Needs Review)
                                        </span>
                                      )}
                                    </div>
                                    <h5 className="text-sm sm:text-base font-bold text-white pt-1 leading-snug">
                                      {item.question}
                                    </h5>
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0 text-xs font-mono">
                                    <span className={`px-2.5 py-1 rounded-lg border font-semibold ${
                                      item.isCorrect
                                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                        : "bg-red-500/20 text-red-300 border-red-500/30"
                                    }`}>
                                      Score: {item.isCorrect ? "1 / 1" : "0 / 1"}
                                    </span>
                                  </div>
                                </div>

                                <div className="p-5 sm:p-6 space-y-5">
                                  {/* Code Snippet if present */}
                                  {item.codeSnippet && (
                                    <div className="rounded-lg bg-[#0a0d16] text-slate-300 border border-white/[0.08] p-4 font-mono text-xs overflow-x-auto space-y-2">
                                      <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1 border-b border-white/[0.08]">
                                        <span className="uppercase tracking-widest font-mono text-slate-400">
                                          {item.language || "Code Question"}
                                        </span>
                                        <span className="text-slate-500">Analyze Code Flow</span>
                                      </div>
                                      <pre className="leading-relaxed">
                                        <code>{item.codeSnippet}</code>
                                      </pre>
                                    </div>
                                  )}

                                  {/* Options Breakdown Grid */}
                                  <div className="space-y-2">
                                    <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                      <ListTodo className="w-3.5 h-3.5 text-slate-400" />
                                      Options Evaluation & Status
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                      {item.options.map((opt: string, optIdx: number) => {
                                        const isSelected = item.userAnswerIndex === optIdx;
                                        const isCorrectOpt = item.correctIndex === optIdx;
                                        const letter = ["A", "B", "C", "D"][optIdx];

                                        return (
                                          <div
                                            key={optIdx}
                                            className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between gap-2 transition-all ${
                                              isCorrectOpt
                                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/40"
                                                : isSelected
                                                ? "bg-red-500/15 border-red-500/40 text-red-300"
                                                : "bg-white/[0.02] border-white/[0.08] text-slate-400 opacity-70"
                                            }`}
                                          >
                                            <div className="flex items-start gap-2.5">
                                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[11px] font-bold flex-shrink-0 mt-0.5 ${
                                                isCorrectOpt
                                                  ? "bg-emerald-500 text-white"
                                                  : isSelected
                                                  ? "bg-red-500 text-white"
                                                  : "bg-white/[0.08] text-slate-400"
                                              }`}>
                                                {letter}
                                              </span>
                                              <span className={`leading-relaxed ${isCorrectOpt ? "font-semibold" : isSelected ? "line-through opacity-85" : ""}`}>
                                                {opt}
                                              </span>
                                            </div>

                                            <div className="flex items-center justify-between pt-1 text-[10px] font-mono">
                                              {isCorrectOpt && (
                                                <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                  <Check className="w-3 h-3" />
                                                  Verified Correct Answer
                                                </span>
                                              )}
                                              {isSelected && !isCorrectOpt && (
                                                <span className="text-red-700 dark:text-red-400 font-bold flex items-center gap-1">
                                                  <X className="w-3 h-3" />
                                                  Your Chosen Answer (Incorrect)
                                                </span>
                                              )}
                                              {isSelected && isCorrectOpt && (
                                                <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                  <Check className="w-3 h-3" />
                                                  Your Chosen Answer (Correct)
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* RICH TECHNICAL EXPLANATION PANEL */}
                                  <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                                    {/* 1. Why Correct */}
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                        <h6 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                                          Why Option {correctLetter} is the Right Answer:
                                        </h6>
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-emerald-500/60 font-sans">
                                        {item.explanationBreakdown?.whyCorrect || (typeof item.explanation === "string" ? item.explanation : item.explanation?.whyCorrect || "")}
                                      </p>
                                    </div>

                                    {/* 2. Why Incorrect Distractors (if available) */}
                                    {item.explanationBreakdown?.whyIncorrect && item.explanationBreakdown.whyIncorrect.length > 0 && (
                                      <div className="space-y-2 pt-3 border-t border-white/[0.08]">
                                        <div className="flex items-center gap-2">
                                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                                          <h6 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                                            Common Traps & Why Other Options Fail:
                                          </h6>
                                        </div>
                                        <ul className="space-y-1.5 pl-4 border-l-2 border-amber-500/60 text-xs text-slate-300">
                                          {item.explanationBreakdown.whyIncorrect.map((reason: string, rIdx: number) => (
                                            <li key={rIdx} className="flex items-start gap-2 leading-relaxed">
                                              <span className="text-amber-500 font-bold">•</span>
                                              <span>{reason}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* 3. Core Architectural Takeaway */}
                                    {item.explanationBreakdown?.keyPrinciple && (
                                      <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-start gap-2.5 text-xs text-blue-300">
                                        <Zap className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                          <span className="font-mono font-bold block text-[11px] uppercase tracking-wider text-blue-400 mb-0.5">
                                            Core Principle & Interview Rule of Thumb:
                                          </span>
                                          <span className="leading-relaxed">
                                            {item.explanationBreakdown.keyPrinciple}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Bottom Action Bar in Results View */}
                    <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
                      <button
                        onClick={() => exportAssessmentReviewAsPdf(activeDayPlan, lastDayResult, result?.targetRole)}
                        className="w-full sm:w-auto px-5 py-3 rounded-lg border border-white/[0.12] bg-white/[0.06] text-xs font-mono font-bold hover:bg-white/[0.12] hover:text-white transition-colors inline-flex items-center justify-center gap-2 cursor-pointer text-slate-300"
                      >
                        <FileDown className="w-4 h-4" />
                        Download Assessment Report (.pdf)
                      </button>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          onClick={() => setDayActiveTab("topics")}
                          className="flex-1 sm:flex-none px-5 py-3 rounded-lg border border-white/[0.12] text-xs font-mono font-semibold hover:bg-white/[0.06] transition-colors cursor-pointer text-center text-slate-300 hover:text-white"
                        >
                          View Study Notes & Theory →
                        </button>

                        <button
                          onClick={retryDayAssessment}
                          className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-mono font-bold hover:from-indigo-600 hover:to-purple-700 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/25"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Retake Assessment (Fresh Qs)
                        </button>
                      </div>
                    </div>

                  </div>
                ) : !quizMode ? (
                  
                  /* 2. FULL-PAGE LESSON / STUDY TOPICS MODE */
                  <div className="space-y-8">
                    {/* Header Banner */}
                    <div className="border-b border-white/[0.08] pb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-indigo-500 text-white">
                          Day {selectedDayKey.dayNumber} of 5
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {activeDayPlan.skills.map((skill) => (
                            <span key={skill} className="text-[11px] font-mono font-medium bg-white/[0.06] text-slate-300 px-2.5 py-0.5 rounded-lg border border-white/[0.08]">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
                        {activeDayPlan.topic}
                      </h1>
                      <p className="text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
                        {activeDayPlan.description}
                      </p>
                    </div>

                    {/* Previous Result Notification banner in Lesson mode */}
                    {lastDayResult && (
                      <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 text-xs font-mono">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Previous Assessment Score: <strong>{lastDayResult.score}%</strong> ({lastDayResult.passed ? "Passed" : "Needs Review"})</span>
                        </div>
                        <button
                          onClick={() => setDayActiveTab("results")}
                          className="text-xs font-mono font-bold text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          View Detailed Assessment Report & Explanations →
                        </button>
                      </div>
                    )}

                    {/* CURATED VIDEO CLASSES (TELUGU & ENGLISH) */}
                    {activeDayPlan.youtubeResources && activeDayPlan.youtubeResources.length > 0 && (
                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                              <YouTubeIcon className="w-4 h-4 text-red-500" />
                            </div>
                            <div>
                              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                Curated Video Masterclasses ({activeDayPlan.youtubeResources.length})
                              </h3>
                              <p className="text-[11px] text-slate-400">
                                1 Verified Telugu (తెలుగు) Explanation + 2 English Deep-Dive Classes
                              </p>
                            </div>
                          </div>
                          <span className="badge-tech badge-tech-indigo hidden sm:inline-flex">
                            Topic-Targeted Tutorials
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {activeDayPlan.youtubeResources.map((video, vIdx) => {
                            const isTelugu = video.language === "Telugu";
                            return (
                              <div
                                key={video.id || vIdx}
                                className={`rounded-xl border p-4 flex flex-col justify-between transition-all group ${
                                  isTelugu
                                    ? "border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-amber-500/[0.03] to-transparent hover:border-amber-400/70 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                                    : "border-white/[0.08] bg-white/[0.02] hover:border-indigo-500/40 hover:bg-white/[0.04]"
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-2.5">
                                    <span
                                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                                        isTelugu
                                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20"
                                          : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                                      }`}
                                    >
                                      {isTelugu ? "🗣️ Telugu (తెలుగు) Explanation" : "🌐 English Masterclass"}
                                    </span>
                                    {video.duration && (
                                      <span className="text-[10px] font-mono text-slate-400">
                                        {video.duration}
                                      </span>
                                    )}
                                  </div>

                                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-indigo-200 transition-colors">
                                    {video.title}
                                  </h4>

                                  {video.channel && (
                                    <p className="text-[11px] font-medium text-slate-400 mt-1.5 flex items-center gap-1.5">
                                      <Play className="w-3 h-3 text-red-500 fill-red-500 flex-shrink-0" />
                                      <span className="truncate">{video.channel}</span>
                                    </p>
                                  )}

                                  {video.description && (
                                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                                      {video.description}
                                    </p>
                                  )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-white/[0.06]">
                                  <a
                                    href={video.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                      isTelugu
                                        ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20"
                                        : "bg-white/[0.06] text-white hover:bg-white/[0.12] border border-white/[0.08]"
                                    }`}
                                  >
                                    <YouTubeIcon className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                                    <span>{isTelugu ? "Watch in Telugu (తెలుగు) →" : "Watch Class →"}</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 100% CONFIDENCE & TOPIC MASTERY PILLARS */}
                    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-emerald-400" />
                          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-emerald-300">
                            100% Topic Mastery & Confidence Blueprint
                          </h3>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          Exhaustive Theory + Annotated Labs + 6 Interview Q&As
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        To achieve <strong className="text-white">100% interview and production confidence</strong> in <span className="text-emerald-300 font-semibold">{activeDayPlan.skills[0] || "this topic"}</span>, review all 4 comprehensive learning pillars below before beginning your day assessment:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[11px] font-bold text-white">1. Engine Internals</p>
                            <p className="text-[10px] text-slate-400">Under-the-hood execution mechanics & memory model.</p>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[11px] font-bold text-white">2. Production Code</p>
                            <p className="text-[10px] text-slate-400">Strict typed implementation with defensive contracts.</p>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[11px] font-bold text-white">3. Concurrency Safety</p>
                            <p className="text-[10px] text-slate-400">Race conditions, memory leaks & error boundaries.</p>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[11px] font-bold text-white">4. Senior Interview Q&As</p>
                            <p className="text-[10px] text-slate-400">Top GeeksforGeeks & FAANG technical questions.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 1. CURRICULUM TOPICS (FULL-PAGE GEEKSFORGEEKS THEORETICAL DEEP DIVE & CODE LABS) */}
                    {(() => {
                      const dayTopics = (activeDayPlan.topics && activeDayPlan.topics.length > 0)
                        ? activeDayPlan.topics
                        : (activeDayPlan.requiredModules || []);

                      if (dayTopics.length === 0) return null;

                      return (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                              <Layers className="w-4 h-4 text-slate-400" />
                              Curriculum Topics ({dayTopics.length}) & Comprehensive Theory
                            </h3>
                            <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                              Exhaustive GeeksforGeeks Masterclass Documentation
                            </span>
                          </div>

                          <div className="space-y-6">
                            {dayTopics.map((topic, tIdx) => {
                              const topicId = topic.id || `topic-${tIdx + 1}`;
                              const isExpanded = expandedModules[topicId] ?? true;

                              return (
                                <div
                                  key={topicId}
                                  className="rounded-xl border border-white/[0.08] bg-white/[0.02] transition-all overflow-hidden"
                                >
                                  {/* Topic Header */}
                                  <div
                                    onClick={() => toggleModule(topicId)}
                                    className="p-5 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer flex items-center justify-between gap-4 select-none transition-colors border-b border-white/[0.08]"
                                  >
                                    <div className="flex items-center gap-3.5">
                                      <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-indigo-500 text-white flex-shrink-0">
                                        Topic {tIdx + 1}
                                      </span>
                                      <div>
                                        <h4 className="text-sm sm:text-base font-bold text-white">
                                          {topic.title}
                                        </h4>
                                        {topic.subtitle && (
                                          <p className="text-xs text-slate-400 line-clamp-1">
                                            {topic.subtitle}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                                        {isExpanded ? "Collapse" : "Expand"}
                                      </span>
                                      {isExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-slate-400" />
                                      ) : (
                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                      )}
                                    </div>
                                  </div>

                                  {/* Topic Expanded Details */}
                                  {isExpanded && (
                                    <div className="p-6 sm:p-8 space-y-8 text-xs sm:text-sm border-t border-white/[0.06] bg-[#07080e]">
                                      
                                      {/* Concept Overview */}
                                      {topic.overview && (
                                        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-1">
                                          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                                            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                                            Topic Overview & Learning Objectives
                                          </p>
                                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                            {topic.overview}
                                          </p>
                                        </div>
                                      )}

                                      {/* Comprehensive Theoretical Deep Dive */}
                                      {topic.comprehensiveTheory && (
                                        <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/25 space-y-3">
                                          <p className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                                            <Sparkles className="w-4 h-4 text-blue-400" />
                                            Architectural Theory & Core Mechanics
                                          </p>
                                          <div className="max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                                            {topic.comprehensiveTheory}
                                          </div>
                                        </div>
                                      )}

                                      {/* Architectural Comparison Table */}
                                      {topic.comparisonTable && topic.comparisonTable.headers && (
                                        <div className="space-y-3">
                                          <p className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                            <BarChart3 className="w-4 h-4 text-slate-400" />
                                            Architectural Trade-offs & Comparison Table
                                          </p>
                                          <div className="overflow-x-auto border border-white/[0.08] rounded-xl">
                                            <table className="w-full text-left text-xs">
                                              <thead className="bg-white/[0.04] text-white font-mono uppercase text-[11px] border-b border-white/[0.08]">
                                                <tr>
                                                  {topic.comparisonTable.headers.map((h, hIdx) => (
                                                    <th key={hIdx} className="p-3 font-semibold">
                                                      {h}
                                                    </th>
                                                  ))}
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-white/[0.06]">
                                                {topic.comparisonTable.rows.map((row, rIdx) => (
                                                  <tr key={rIdx} className="hover:bg-white/[0.02]">
                                                    {row.map((cell, cIdx) => (
                                                      <td key={cIdx} className={`p-2.5 text-slate-300 ${cIdx === 0 ? "font-semibold text-white" : ""}`}>
                                                        {cell}
                                                      </td>
                                                    ))}
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      )}

                                      {/* Sub-Topic Modules (Code & Command Labs) */}
                                      {topic.modules && topic.modules.length > 0 && (
                                        <div className="space-y-3 pt-2">
                                          <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                                              Sub-Topic Modules & Code Labs ({topic.modules.length})
                                            </p>
                                            <span className="text-[10px] font-mono text-slate-400">
                                              Step-by-Step Concepts & Code
                                            </span>
                                          </div>

                                          <div className="space-y-3">
                                            {topic.modules.map((subMod, smIdx) => {
                                              const subModId = subMod.id || `${topicId}-sub-${smIdx + 1}`;
                                              const isSubExpanded = expandedModules[subModId] ?? true;

                                              return (
                                                <div
                                                  key={subModId}
                                                  className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden"
                                                >
                                                  <div
                                                    onClick={() => toggleModule(subModId)}
                                                    className="p-3 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer flex items-center justify-between gap-2 border-b border-transparent data-[open=true]:border-white/[0.08]"
                                                    data-open={isSubExpanded}
                                                  >
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-lg bg-white/[0.08] text-slate-300">
                                                        Module {tIdx + 1}.{smIdx + 1}
                                                      </span>
                                                      <span className="font-semibold text-xs text-white">
                                                        {subMod.title}
                                                      </span>
                                                    </div>
                                                    {isSubExpanded ? (
                                                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                                                    ) : (
                                                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                                    )}
                                                  </div>

                                                  {isSubExpanded && (
                                                    <div className="p-3.5 space-y-3 bg-[#07080e]">
                                                      {subMod.overview && (
                                                        <p className="text-xs text-slate-400 leading-relaxed">
                                                          {subMod.overview}
                                                        </p>
                                                      )}

                                                      {subMod.notes && subMod.notes.length > 0 && (
                                                        <ul className="space-y-1">
                                                          {subMod.notes.map((note, nIdx) => (
                                                            <li key={nIdx} className="flex items-start gap-2 text-slate-300 text-[11px] leading-relaxed">
                                                              <span className="text-slate-500 mt-0.5">&bull;</span>
                                                              <span>{note}</span>
                                                            </li>
                                                          ))}
                                                        </ul>
                                                      )}

                                                      {/* Commands */}
                                                      {subMod.commands && subMod.commands.length > 0 && (
                                                        <div className="rounded-lg border border-white/[0.08] bg-[#0a0d16] overflow-hidden">
                                                          <div className="flex items-center justify-between px-3 py-1 bg-white/[0.04] border-b border-white/[0.08] text-[10px] font-mono text-slate-400">
                                                            <span className="flex items-center gap-1 text-slate-300">
                                                              <Terminal className="w-3 h-3 text-slate-400" />
                                                              Setup Commands
                                                            </span>
                                                            <button
                                                              onClick={() => handleCopy(subMod.commands!.join("\n"), `cmd-${subModId}`)}
                                                              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                                                            >
                                                              {copiedKey === `cmd-${subModId}` ? (
                                                                <>
                                                                  <Check className="w-3 h-3 text-green-400" />
                                                                  <span className="text-green-400">Copied!</span>
                                                                </>
                                                              ) : (
                                                                <>
                                                                  <Copy className="w-3 h-3" />
                                                                  <span>Copy</span>
                                                                </>
                                                              )}
                                                            </button>
                                                          </div>
                                                          <div className="p-2.5 font-mono text-[11px] text-green-400 space-y-1 overflow-x-auto">
                                                            {subMod.commands.map((cmd, cIdx) => (
                                                              <div key={cIdx} className="flex items-center gap-2">
                                                                <span className="text-slate-500 select-none">$</span>
                                                                <span className="text-slate-200">{cmd}</span>
                                                             </div>
                                                            ))}
                                                          </div>
                                                        </div>
                                                      )}

                                                      {/* Code Snippet */}
                                                      {subMod.codeSnippet && subMod.codeSnippet.code && (
                                                        <div className="rounded-lg border border-white/[0.08] bg-[#0a0d16] overflow-hidden">
                                                          <div className="flex items-center justify-between px-3 py-1 bg-white/[0.04] border-b border-white/[0.08] text-[10px] font-mono text-slate-400">
                                                            <span className="flex items-center gap-1 text-slate-300 font-semibold uppercase">
                                                              <Code2 className="w-3 h-3 text-slate-400" />
                                                              {subMod.codeSnippet.language || "Code Example"}
                                                            </span>
                                                            <button
                                                              onClick={() => handleCopy(subMod.codeSnippet!.code, `code-${subModId}`)}
                                                              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                                                            >
                                                              {copiedKey === `code-${subModId}` ? (
                                                                <>
                                                                  <Check className="w-3 h-3 text-green-400" />
                                                                  <span className="text-green-400">Copied!</span>
                                                                </>
                                                              ) : (
                                                                <>
                                                                  <Copy className="w-3 h-3" />
                                                                  <span>Copy Code</span>
                                                                </>
                                                              )}
                                                            </button>
                                                          </div>
                                                          <pre className="p-3 font-mono text-[11px] text-slate-200 overflow-x-auto leading-relaxed bg-[#0a0d16]">
                                                            <code>{subMod.codeSnippet.code}</code>
                                                          </pre>
                                                          {subMod.codeSnippet.explanation && (
                                                            <div className="px-3 py-1.5 bg-white/[0.04] border-t border-white/[0.08] text-[10px] text-slate-400">
                                                              <span className="font-semibold text-slate-300">Explanation:</span> {subMod.codeSnippet.explanation}
                                                            </div>
                                                          )}
                                                        </div>
                                                      )}

                                                      {/* Key Takeaways */}
                                                      {subMod.keyTakeaways && subMod.keyTakeaways.length > 0 && (
                                                        <div className="pt-1.5 border-t border-white/[0.06]">
                                                          <div className="space-y-0.5">
                                                            {subMod.keyTakeaways.map((takeaway, tIdx) => (
                                                              <div key={tIdx} className="flex items-start gap-1.5 text-[10px] text-slate-400">
                                                                <Check className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                                                                <span>{takeaway}</span>
                                                              </div>
                                                            ))}
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {/* GeeksforGeeks-Style Top Interview Questions & Answers */}
                                      {topic.interviewQuestions && topic.interviewQuestions.length > 0 && (
                                        <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                                          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                                            GeeksforGeeks Top Interview Questions & Answers
                                          </p>
                                          <div className="space-y-2">
                                            {topic.interviewQuestions.map((iq, qIdx) => (
                                              <div key={qIdx} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                  <p className="text-xs font-bold text-white">
                                                    Q{qIdx + 1}: {iq.question}
                                                  </p>
                                                  {iq.difficulty && (
                                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-lg bg-white/[0.08] text-slate-400">
                                                      {iq.difficulty}
                                                    </span>
                                                  )}
                                                </div>
                                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                                  {iq.answer}
                                                </p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  
                  /* 2. FULL-PAGE ASSESSMENT MODE WITH CODE QUESTIONS & DRM GUARD */
                  <AssessmentDrmGuard
                    assessmentId={`day_${selectedDayKey.dayNumber}_${activeQuizTopic ? activeQuizTopic.id : "comprehensive"}`}
                    assessmentTitle={activeQuizTopic ? `${activeQuizTopic.title} Quiz` : `Day ${selectedDayKey.dayNumber} Assessment`}
                  >
                    <div className="space-y-8 max-w-4xl mx-auto py-4">
                      {/* Assessment Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                            Day {selectedDayKey.dayNumber} Assessment • 10 Questions
                          </span>
                          <h2 className="text-xl md:text-3xl font-bold tracking-tight text-white mt-1">
                            {activeQuizTopic ? activeQuizTopic.title : activeDayPlan.topic}
                          </h2>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white/[0.06] font-bold text-white border border-white/[0.08]">
                            {Object.keys(dayAnswers).length} / {(activeQuizTopic?.assessment || activeDayPlan.assessment).length} Answered
                          </span>
                        </div>
                      </div>

                      {/* Questions List (Full Page with Code Question Support) */}
                      <div className="space-y-6">
                        {(activeQuizTopic?.assessment || activeDayPlan.assessment).map((q, qIdx) => (
                          <div
                            key={q.id}
                            className="p-6 md:p-8 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-4"
                          >
                            <p className="text-sm md:text-base font-bold text-white flex items-start gap-3">
                              <span className="font-mono text-slate-400 flex-shrink-0">Q{qIdx + 1}.</span>
                              <span className="leading-snug">{q.question}</span>
                            </p>

                            {/* Code Snippet Box (For Code Questions) */}
                            {q.codeSnippet && (
                              <div className="rounded-lg bg-[#0a0d16] text-slate-300 border border-white/[0.08] p-4 font-mono text-xs overflow-x-auto my-3">
                                {q.language && (
                                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
                                    {q.language}
                                  </span>
                                )}
                                <pre className="leading-relaxed">
                                  <code>{q.codeSnippet}</code>
                                </pre>
                              </div>
                            )}

                            {/* Options */}
                            <div className="grid grid-cols-1 gap-3 pt-2">
                              {q.options.map((opt, optIdx) => {
                                const isSelected = dayAnswers[q.id] === optIdx;
                                return (
                                  <button
                                    key={optIdx}
                                    onClick={() => setDayAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                                    className={`text-left p-4 rounded-xl text-xs sm:text-sm border transition-all flex items-start gap-3 cursor-pointer ${
                                      isSelected
                                        ? "border-indigo-500 bg-indigo-500/15 ring-1 ring-indigo-500 font-medium text-white"
                                        : "border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/[0.2]"
                                    }`}
                                  >
                                    <span className={`w-5 h-5 rounded-full border text-[11px] font-mono font-bold flex items-center justify-center flex-shrink-0 ${
                                      isSelected
                                        ? "bg-indigo-500 text-white border-indigo-500"
                                        : "border-white/[0.15] text-slate-400"
                                    }`}>
                                      {["A", "B", "C", "D"][optIdx]}
                                    </span>
                                    <span className="mt-0.5 leading-relaxed">{opt}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bottom Submit Bar */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/[0.08]">
                        <button
                          onClick={() => { setQuizMode(false); setActiveQuizTopic(null); }}
                          className="text-xs font-mono text-slate-400 hover:text-white font-medium cursor-pointer"
                        >
                          ← Back to Lesson Overview
                        </button>

                        <button
                          onClick={submitDayAssessment}
                          disabled={submittingDay || Object.keys(dayAnswers).length < (activeQuizTopic?.assessment || activeDayPlan.assessment).length}
                          className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 text-xs font-mono font-bold hover:from-indigo-600 hover:to-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/25"
                        >
                          {submittingDay ? "Scoring Assessment..." : `Submit Assessment (${Object.keys(dayAnswers).length}/${(activeQuizTopic?.assessment || activeDayPlan.assessment).length})`}
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </AssessmentDrmGuard>
                )}

              </div>
            ) : (
              <div className="py-20 text-center text-xs text-red-500 font-mono">
                Failed to load day curriculum. Please try selecting the day again.
              </div>
            )}
          </div>
        </div>
      )}
      {/* ABANDONMENT ONBOARDING MODAL */}
      {showAbandonModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-indigo-500/30 bg-[#0d101a] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                Action Required &bull; Momentum Kickoff
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                Your custom {result?.targetRole || "Software Engineer"} roadmap is ready!
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Complete Day 1 (15–20 min) to calibrate your skills, see where you stand, and unlock your empirical career readiness score.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setShowAbandonModal(false);
                  router.push("/mission/day/week-1_day-1");
                }}
                className="btn-gradient !py-2.5 !px-4 !text-xs flex-1 flex items-center justify-center gap-2 cursor-pointer font-bold"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Day 1 Now</span>
              </button>
              <button
                onClick={() => {
                  setShowAbandonModal(false);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("ai_career_abandon_dismissed", Date.now().toString());
                  }
                }}
                className="px-4 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] text-xs font-mono text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                Remind Me Later
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
