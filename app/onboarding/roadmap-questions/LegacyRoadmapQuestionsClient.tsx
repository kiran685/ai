"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Target,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BrainCircuit,
  Compass,
  Layers,
  Award,
  Zap,
} from "lucide-react";
import {
  CareerAnalysis,
  RoadmapQuestionItem,
  RoadmapQuestionnaireData,
  RoadmapData,
} from "@/types";
import Navbar from "@/app/components/Navbar";
import OnboardingProgress from "@/app/components/OnboardingProgress";
import { isFeatureEnabled } from "@/lib/featureFlags";

const ROADMAP_QUESTIONS: RoadmapQuestionItem[] = [
  {
    id: "targetRole",
    number: 1,
    title: "Confirm your target engineering role",
    description: "The AI agent aligns your foundational roadmap, practice labs, and assessment expectations with this role.",
    options: [
      { id: "swe", label: "Software Engineer", subLabel: "Full spectrum software engineering, DSA, OOP, and system design", value: "Software Engineer" },
      { id: "fullstack", label: "Full Stack Developer", subLabel: "Modern web applications, APIs, React, Node.js, and databases", value: "Full Stack Developer" },
      { id: "frontend", label: "Frontend Engineer", subLabel: "Modern React, Next.js, UI component architecture, and performance", value: "Frontend Engineer" },
      { id: "backend", label: "Backend Engineer", subLabel: "Distributed APIs, microservices, databases, caching, and scalability", value: "Backend Engineer" },
      { id: "aiml", label: "AI / ML Engineer", subLabel: "Python, deep learning, PyTorch, LLMs, RAG, and model serving", value: "AI / ML Engineer" },
      { id: "cloud", label: "Cloud / DevOps Engineer", subLabel: "Docker, Kubernetes, CI/CD pipelines, AWS, and infrastructure as code", value: "Cloud / DevOps Engineer" },
      { id: "data", label: "Data Scientist", subLabel: "Data engineering, statistics, predictive modeling, and SQL", value: "Data Scientist" },
    ],
  },
  {
    id: "currentLevel",
    number: 2,
    title: "What is your current overall preparation level?",
    description: "Helps the agent determine whether to reinforce core basics or advance directly to complex engineering.",
    options: [
      { id: "beginner", label: "Beginner / Starting Fresh", subLabel: "Starting from scratch or transitioning from an unrelated background", value: "Beginner / Starting Fresh" },
      { id: "foundation", label: "Basic Concepts Understood", subLabel: "Familiar with syntax and core concepts, but need structured practice", value: "Basic Concepts Understood" },
      { id: "intermediate", label: "Intermediate Builder", subLabel: "Have built small applications, ready for system architecture and coding rounds", value: "Intermediate Builder" },
      { id: "advanced", label: "Advanced / Interview Focused", subLabel: "Solid practical background, aiming for senior patterns & interview mastery", value: "Advanced / Interview Focused" },
    ],
  },
  {
    id: "currentLanguage",
    number: 3,
    title: "Which primary programming language do you currently use?",
    description: "Your baseline programming syntax background.",
    options: [
      { id: "java", label: "Java", subLabel: "Object-oriented programming, standard corporate & college stack", value: "Java" },
      { id: "python", label: "Python 3", subLabel: "Concise syntax, versatile for scripting, AI/ML, and rapid problem solving", value: "Python 3" },
      { id: "cpp", label: "C++", subLabel: "Strong memory control, competitive programming, and STL mastery", value: "C++" },
      { id: "javascript", label: "JavaScript / TypeScript", subLabel: "Full-stack web development, asynchronous execution, and modern tooling", value: "JavaScript / TypeScript" },
    ],
  },
  {
    id: "preferredLanguage",
    number: 4,
    title: "Which programming language do you want your DSA & interview roadmap in?",
    description: "Daily coding labs, starter code, and code compiler evaluations will be tailored to this language.",
    options: [
      { id: "java", label: "Java", subLabel: "Gold standard for enterprise interviews, strong OOP, and collection frameworks", value: "Java" },
      { id: "python", label: "Python 3", subLabel: "Fastest problem-solving iteration, clean syntax, and interview friendly", value: "Python 3" },
      { id: "cpp", label: "C++", subLabel: "Preferred for algorithmic speed, standard template library (STL), and CP rounds", value: "C++" },
      { id: "javascript", label: "JavaScript / TypeScript", subLabel: "Ideal for full-stack and frontend interview rounds", value: "JavaScript / TypeScript" },
    ],
  },
  {
    id: "hoursPerDay",
    number: 5,
    title: "How many hours can you dedicate per day?",
    description: "We calibrate daily missions so you achieve steady progress without burnout.",
    options: [
      { id: "1_2_hours", label: "1 – 2 Hours / Day", subLabel: "Light pace, ideal alongside a busy job or college schedule", value: "1-2 Hours/Day" },
      { id: "2_3_hours", label: "2 – 3 Hours / Day", subLabel: "Recommended standard pace for balanced coding and retention", value: "2-3 Hours/Day" },
      { id: "4_5_hours", label: "4 – 5 Hours / Day", subLabel: "Intensive dedicated part-time or active placement pivot", value: "4-5 Hours/Day" },
      { id: "6_plus_hours", label: "6+ Hours / Day", subLabel: "Full-time immersive study sprint for maximum speed", value: "6+ Hours/Day" },
    ],
  },
  {
    id: "daysPerWeek",
    number: 6,
    title: "How many days per week are you available to study?",
    description: "Determines how weekly curriculum milestones are distributed.",
    options: [
      { id: "5_days", label: "5 Days / Week (Mon – Fri)", subLabel: "Weekday focus sprints with weekends reserved for rest or project catch-up", value: "5 Days / Week" },
      { id: "6_days", label: "6 Days / Week", subLabel: "Steady continuous momentum with one dedicated recovery day", value: "6 Days / Week" },
      { id: "7_days", label: "7 Days / Week (Daily Habit)", subLabel: "Daily consistent habit streak for compound long-term learning", value: "7 Days / Week" },
    ],
  },
  {
    id: "targetTimeframe",
    number: 7,
    title: "What is your target placement / job readiness timeline?",
    description: "Your roadmap's total duration and week-by-week pacing will be calibrated to this timeline.",
    options: [
      { id: "4_weeks", label: "4 Weeks — Intensive 1-Month Boot Camp", subLabel: "Rapid acceleration for urgent job search or immediate upskilling", value: "4 Weeks (Intensive)", weeks: 4 },
      { id: "8_weeks", label: "8 Weeks — Fast-Track 2-Month Sprint", subLabel: "Balanced, focused roadmap for swift career transition", value: "8 Weeks (Fast-Track)", weeks: 8 },
      { id: "12_weeks", label: "12 Weeks — Standard 3-Month Comprehensive Plan", subLabel: "Recommended standard pace for deep mastery and portfolio completion", value: "12 Weeks (Standard)", weeks: 12 },
      { id: "24_weeks", label: "24 Weeks — Deep 6-Month Mastery", subLabel: "Thorough, self-paced curriculum covering advanced specialization", value: "24 Weeks (Deep Mastery)", weeks: 24 },
    ],
  },
  {
    id: "dsaConfidence",
    number: 8,
    title: "What is your current confidence in Data Structures & Algorithms (DSA)?",
    description: "Determines where coding lab problems begin in your daily missions.",
    options: [
      { id: "none", label: "Zero / Haven't Started Yet", subLabel: "Need step-by-step guidance on loops, arrays, and basic problem solving", value: "Zero / Beginner" },
      { id: "basic", label: "Basic (Familiar with Arrays & Strings)", subLabel: "Can write simple loops and conditionals, but struggle with complexity & patterns", value: "Basic (Arrays & Strings)" },
      { id: "medium", label: "Intermediate (HashMaps, Two Pointers, Stacks)", subLabel: "Can solve LeetCode easy problems and some medium problems", value: "Intermediate (Medium Problems)" },
      { id: "strong", label: "Advanced (Trees, Graphs, Recursion, DP)", subLabel: "Comfortable with complex trees, graph traversals, and dynamic programming", value: "Advanced (Trees, Graphs & DP)" },
    ],
  },
  {
    id: "devConfidence",
    number: 9,
    title: "What is your current practical development confidence?",
    description: "Helps calibrate practical project complexity and system design modules.",
    options: [
      { id: "beginner", label: "Beginner (Tutorial Phase)", subLabel: "Have only followed guided tutorial walkthroughs or clone apps", value: "Beginner (Tutorial Phase)" },
      { id: "intermediate", label: "Intermediate (Built Standalone Apps)", subLabel: "Can build functional CRUD apps, connect databases, and write APIs", value: "Intermediate (Built Apps & APIs)" },
      { id: "advanced", label: "Advanced (Production & Architecture)", subLabel: "Have deployed live apps, written tests, and designed scalable systems", value: "Advanced (Production & System Design)" },
    ],
  },
  {
    id: "interviewPrepLevel",
    number: 10,
    title: "What is your current technical interview preparation status?",
    description: "Determines the intensity of mock interview questions and DRM defense checkpoints.",
    options: [
      { id: "not_started", label: "Not Started Yet", subLabel: "Focusing first on building genuine coding skills and fundamentals", value: "Not Started Yet" },
      { id: "early_practice", label: "Early Practice", subLabel: "Solving occasional practice problems, need structured direction", value: "Early Practice" },
      { id: "actively_prepping", label: "Actively Prepping", subLabel: "Preparing for upcoming placement drives or technical screening rounds", value: "Actively Prepping" },
      { id: "ready_now", label: "Interview Ready", subLabel: "Aiming for final polish, edge cases, and high-pressure performance", value: "Interview Ready" },
    ],
  },
  {
    id: "learningStyle",
    number: 11,
    title: "How do you learn and retain technical concepts most effectively?",
    description: "We tailor lesson descriptions and daily mission formats to your style.",
    options: [
      { id: "project_based", label: "Project-First & Hands-on Building", subLabel: "Learn by building real apps, debugging issues, and applying concepts directly", value: "Project-First Building" },
      { id: "guided_tutorials", label: "Guided Step-by-Step Walkthroughs", subLabel: "Follow structured examples, guided labs, and progressive exercises", value: "Guided Step-by-Step" },
      { id: "deep_docs", label: "Deep Technical Docs & Architecture Reading", subLabel: "Understand internal mechanisms, specifications, and design patterns", value: "Deep Conceptual Documentation" },
      { id: "quiz_challenge", label: "Challenge & Assessment Driven", subLabel: "Rapid feedback loops through questions, diagnostic drills, and code quizzes", value: "Challenge & Assessment Driven" },
    ],
  },
  {
    id: "targetCompanyType",
    number: 12,
    title: "What type of companies are you primarily targeting?",
    description: "Calibrates whether your roadmap emphasizes heavy algorithmic puzzles or full-stack shipping speed.",
    options: [
      { id: "product", label: "Tier-1 Product Companies & MAANG", subLabel: "Rigorous focus on advanced DSA, time/space complexity, and scalable system design", value: "Product Companies & MAANG" },
      { id: "startup", label: "High-Growth Tech Startups", subLabel: "Fast practical development, end-to-end full-stack shipping, and pragmatic problem solving", value: "High-Growth Startups" },
      { id: "service", label: "IT Services & Consulting (TCS, Infosys, Wipro, Accenture)", subLabel: "Core technical aptitude, standard DSA, OOPs, DBMS, and behavioral clarity", value: "IT Services & Consulting" },
      { id: "any", label: "Open to Any Quality Engineering Opportunity", subLabel: "Comprehensive all-round preparation for all technical screening rounds", value: "Open to Any Opportunity" },
    ],
  },
  {
    id: "mainPriority",
    number: 13,
    title: "What is your #1 preparation priority?",
    description: "Steers which modules receive the deepest focus in your daily missions.",
    options: [
      { id: "coding_rounds", label: "Cracking Coding Rounds & Algorithmic Problem Solving", subLabel: "Mastering LeetCode patterns, arrays, hashing, two pointers, and trees", value: "Cracking Coding Rounds & DSA" },
      { id: "portfolio_projects", label: "Building Production-Grade Showcase Projects", subLabel: "Creating impressive GitHub repositories that catch the eyes of recruiters", value: "Building Production Projects" },
      { id: "system_design", label: "System Design, Scalability & Architecture", subLabel: "Distributed systems, caching, database indexing, and backend design", value: "System Design & Architecture" },
      { id: "all_round", label: "Comprehensive 360° Placement Readiness", subLabel: "Balanced mastery across coding, core CS, projects, and interview communication", value: "Comprehensive Placement Readiness" },
    ],
  },
  {
    id: "biggestDifficulty",
    number: 14,
    title: "What is currently your biggest hurdle or difficulty?",
    description: "The AI agent will insert targeted counter-strategies, hints, and explanations for this.",
    options: [
      { id: "patterns", label: "Recognizing DSA Problem-Solving Patterns", subLabel: "Knowing which data structure or algorithm to apply when seeing a new problem", value: "Recognizing Problem Patterns" },
      { id: "consistency", label: "Staying Consistent & Managing Study Time", subLabel: "Struggling to maintain daily momentum without structured accountability", value: "Consistency & Time Management" },
      { id: "debugging", label: "Debugging Complex Logic & Implementation Gaps", subLabel: "Getting stuck on edge cases, off-by-one errors, or runtime bugs", value: "Debugging Complex Logic" },
      { id: "direction", label: "Lacking Clear Step-by-Step Direction", subLabel: "Overwhelmed by random videos and tutorials without a cohesive roadmap", value: "Lacking Clear Direction" },
    ],
  },
];

function getDynamicRecommendation(
  questionId: string,
  selectedAnswers: Record<string, { value: string; weeks?: number; hours?: number }>,
  cachedAnalysis: CareerAnalysis | null,
  career: string
): { recommendedOptionId: string; reason: string; badge: string } | null {
  if (questionId === "targetRole") {
    const role = career || cachedAnalysis?.targetRole || "Software Engineer";
    const opt = ROADMAP_QUESTIONS[0].options.find(o => o.value.toLowerCase().includes(role.toLowerCase())) || ROADMAP_QUESTIONS[0].options[0];
    return {
      recommendedOptionId: opt.id,
      badge: "🎯 Selected Role",
      reason: `Calibrating full curriculum for ${role}.`,
    };
  }

  if (questionId === "targetTimeframe") {
    return {
      recommendedOptionId: "8_weeks",
      badge: "⚡ Recommended Pacing",
      reason: "8 Weeks provides the ideal fast-track velocity to eliminate skill gaps without burnout.",
    };
  }

  if (questionId === "hoursPerDay") {
    return {
      recommendedOptionId: "2_3_hours",
      badge: "⚡ Recommended Habit",
      reason: "2–3 hours per day enables 1 hour of theory, 3 coding labs, and 1 quick assessment without fatigue.",
    };
  }

  if (questionId === "daysPerWeek") {
    return {
      recommendedOptionId: "6_days",
      badge: "📅 Recommended Cadence",
      reason: "6 study days per week with 1 rest day maximizes retention and compound weekly gains.",
    };
  }

  if (questionId === "preferredLanguage") {
    return {
      recommendedOptionId: "java",
      badge: "💡 Recommended for Placement",
      reason: "Java provides strong object-oriented principles, robust standard libraries, and is widely preferred in campus & corporate technical rounds.",
    };
  }

  if (questionId === "currentLevel") {
    const matchScore = cachedAnalysis?.combinedAlignmentScore ?? cachedAnalysis?.alignmentScore ?? 50;
    if (matchScore >= 75) {
      return {
        recommendedOptionId: "advanced",
        badge: "✨ Based on Resume Analysis",
        reason: `Strong resume fit (${matchScore}%) detected. 'Advanced' will focus on system design and interview coding.`,
      };
    } else if (matchScore >= 45) {
      return {
        recommendedOptionId: "intermediate",
        badge: "✨ Based on Resume Analysis",
        reason: `Your resume shows core exposure (${matchScore}% match). 'Intermediate Builder' will reinforce key gaps with practical labs.`,
      };
    } else {
      return {
        recommendedOptionId: "foundation",
        badge: "✨ Based on Resume Analysis",
        reason: `Starting with core concepts to build a bulletproof problem-solving foundation.`,
      };
    }
  }

  if (questionId === "targetCompanyType") {
    return {
      recommendedOptionId: "product",
      badge: "🚀 High-Value Target",
      reason: "Targeting product companies develops top-tier DSA problem-solving and clean code discipline that qualifies you for all company categories.",
    };
  }

  if (questionId === "learningStyle") {
    return {
      recommendedOptionId: "project_based",
      badge: "🛠️ Proven Learning Style",
      reason: "Project-first building and interactive coding labs deliver 3x higher retention than passive video watching.",
    };
  }

  return null;
}



function RoadmapQuestionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const career = searchParams.get("career") || "";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, { value: string; weeks?: number; hours?: number }>>({
    targetTimeframe: { value: "8 Weeks (Fast-Track)", weeks: 8 },
    weeklyCommitment: { value: "15-20 hrs/week", hours: 18 },
    currentKnowledge: { value: "Intermediate Builder" },
    primaryObjective: { value: "Landing First Job" },
    learningStyle: { value: "Project-First Building" },
    studySchedule: { value: "Consistent Daily Habit" },
    focusSpecialization: { value: "Applied Frameworks & Full-Stack" },
    projectExperience: { value: "Built Independent Applications" },
    biggestHurdle: { value: "Staying Consistent & Accountable" },
    targetDeliverable: { value: "Production Portfolio Repos" },
  });

  const [cachedAnalysis, setCachedAnalysis] = useState<CareerAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalysis() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (data.success && data.analysis) {
          setCachedAnalysis(data.analysis as CareerAnalysis);
        } else {
          router.push("/onboarding");
        }
      } catch {
        router.push("/onboarding");
      }
    }

    loadAnalysis();
  }, [router]);

  const currentQuestion = ROADMAP_QUESTIONS[currentIndex];
  const totalQuestions = ROADMAP_QUESTIONS.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  const currentRecommendation = currentQuestion
    ? getDynamicRecommendation(currentQuestion.id, selectedAnswers, cachedAnalysis, career)
    : null;

  const handleSelectOption = (questionId: string, optionValue: string, weeks?: number, hours?: number) => {
    setSelectedAnswers((prev) => {
      const updated = {
        ...prev,
        [questionId]: { value: optionValue, weeks, hours },
      };

      // If user changed targetTimeframe on Question 1, dynamically auto-align Question 2 recommendation if default
      if (questionId === "targetTimeframe" && typeof weeks === "number") {
        if (weeks <= 4) {
          updated.weeklyCommitment = { value: "25-35 hrs/week", hours: 30 };
        } else if (weeks === 8) {
          updated.weeklyCommitment = { value: "15-20 hrs/week", hours: 18 };
        } else if (weeks >= 24) {
          updated.weeklyCommitment = { value: "5-10 hrs/week", hours: 8 };
        }
      }

      return updated;
    });
  };

  async function generatePersonalizedRoadmap() {
    if (!cachedAnalysis) return;

    setLoading(true);
    setError("");

    try {
      const targetWeeks = selectedAnswers.targetTimeframe?.weeks || 8;
      const weeklyHours = selectedAnswers.weeklyCommitment?.hours || 18;

      const questionnaireData: RoadmapQuestionnaireData = {
        targetRole: selectedAnswers.targetRole?.value || career || cachedAnalysis.targetRole || "Software Engineer",
        currentLevel: selectedAnswers.currentLevel?.value || "Intermediate Builder",
        currentLanguage: selectedAnswers.currentLanguage?.value || "JavaScript / TypeScript",
        preferredLanguage: selectedAnswers.preferredLanguage?.value || "Python",
        hoursPerDay: selectedAnswers.hoursPerDay?.value || "2-3 hours / day",
        daysPerWeek: selectedAnswers.daysPerWeek?.value || "5 days / week",
        targetTimeframe: selectedAnswers.targetTimeframe?.value || "8 Weeks (Fast-Track)",
        targetWeeks,
        weeklyCommitment: selectedAnswers.weeklyCommitment?.value || "15-20 hrs/week",
        weeklyHours,
        dsaConfidence: selectedAnswers.dsaConfidence?.value || "Moderate (Arrays, HashMaps, Two Pointers)",
        devConfidence: selectedAnswers.devConfidence?.value || "Hands-on (Built 2-3 full apps or APIs)",
        interviewPrepLevel: selectedAnswers.interviewPrepLevel?.value || "Some Practice (Solved 20-50 questions)",
        learningStyle: selectedAnswers.learningStyle?.value || "Project-First Building",
        targetCompanyType: selectedAnswers.targetCompanyType?.value || "Product Companies (Tier 1/2 tech, SaaS)",
        mainPriority: selectedAnswers.mainPriority?.value || "Crack Technical Coding & System Interviews",
        currentKnowledge: selectedAnswers.currentKnowledge?.value || selectedAnswers.currentLevel?.value || "Intermediate Builder",
        primaryObjective: selectedAnswers.primaryObjective?.value || selectedAnswers.mainPriority?.value || "Landing First Job",
        studySchedule: selectedAnswers.studySchedule?.value || `${selectedAnswers.daysPerWeek?.value || "5 days/week"}, ${selectedAnswers.hoursPerDay?.value || "2-3 hrs/day"}`,
        focusSpecialization: selectedAnswers.focusSpecialization?.value || "Applied Frameworks & Full-Stack",
        projectExperience: selectedAnswers.projectExperience?.value || selectedAnswers.devConfidence?.value || "Built Independent Applications",
        biggestHurdle: selectedAnswers.biggestHurdle?.value || selectedAnswers.biggestDifficulty?.value || "Staying Consistent & Accountable",
        targetDeliverable: selectedAnswers.targetDeliverable?.value || "Production Portfolio Repos",
      };

      const targetRoleTitle = questionnaireData.targetRole || career || cachedAnalysis.targetRole || "Software Engineer";

      const response = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cachedAnalysis.resumeText || "",
          career: targetRoleTitle,
          answers: questionnaireData,
          skills: cachedAnalysis.skills || [],
          quizResult: cachedAnalysis.quizResult || null,
          combinedSkills: cachedAnalysis.combinedSkills || [],
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.weeks) {
        throw new Error(data.error || "Failed to generate customized roadmap.");
      }

      const updatedRoadmapData: RoadmapData = {
        weeks: data.weeks,
        daysData: cachedAnalysis.roadmapData?.daysData || {},
        dayResults: cachedAnalysis.roadmapData?.dayResults || {},
      };

      const updatedAnalysis: CareerAnalysis = {
        ...cachedAnalysis,
        targetRole: targetRoleTitle,
        roadmapData: updatedRoadmapData,
        questionnaireAnswers: questionnaireData,
        agentPlanSummary: data.agentSummary,
      };

      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedAnalysis),
      });

      // Save locally to session for instantaneous availability
      if (typeof window !== "undefined") {
        sessionStorage.setItem("ai_career_analysis", JSON.stringify(updatedAnalysis));
      }

      // Navigate to Roadmap Preview screen
      router.push(`/onboarding/roadmap-preview?career=${encodeURIComponent(targetRoleTitle)}`);
    } catch (err) {
      console.error("Personalized roadmap error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate roadmap. Please try again."
      );
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080e] text-slate-100 relative selection:bg-indigo-500/30 selection:text-indigo-200">
        <div className="bg-mesh-glow" />
        <div className="fixed inset-0 bg-grid-tech pointer-events-none opacity-40 z-0" />

        <Navbar />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-24 relative z-10">
          <OnboardingProgress
            step={3}
            totalSteps={3}
            label="Roadmap Strategy & Timeline Calibration"
            icon={Compass}
          />

          <div className="mt-16 text-center py-16 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 animate-pulse mb-4">
              <Sparkles className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white">
              AI Agent is Crafting Your Roadmap...
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed max-w-md mx-auto">
              Synthesizing your readiness answers with verified skill gaps for{" "}
              <span className="font-semibold text-white">
                {career || cachedAnalysis?.targetRole || "your role"}
              </span>
              . Building week-by-week progressive curriculum...
            </p>

            <div className="flex items-center justify-center gap-2 pt-6">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 relative selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="bg-mesh-glow" />
      <div className="fixed inset-0 bg-grid-tech pointer-events-none opacity-40 z-0" />

      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-24 relative z-10">
        <OnboardingProgress
          step={3}
          totalSteps={3}
          label="Roadmap Strategy & Timeline Calibration"
          icon={Compass}
        />

        {/* Heading */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[11px] font-mono text-indigo-300 mb-3">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Step 3: Dynamic Customization
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Roadmap Planning Questionnaire
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Customize your roadmap duration, weekly hours, domain depth, and strategic goals.
              </p>
            </div>
            {career && (
              <span className="badge-tech badge-tech-indigo self-start sm:self-auto">
                {career}
              </span>
            )}
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Stepper Header */}
          <div className="mt-8 flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-mono font-medium text-slate-300">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              <span className="font-semibold text-white">
                {answeredCount}
              </span>
              /{totalQuestions} answered
            </div>
          </div>

          {/* Stepper Dots Bar */}
          <div className="grid grid-cols-10 gap-1.5 mt-3">
            {ROADMAP_QUESTIONS.map((q, idx) => {
              const isAnswered = Boolean(selectedAnswers[q.id]);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-gradient-to-r from-indigo-500 to-cyan-400 ring-2 ring-indigo-500/50"
                      : isAnswered
                      ? "bg-indigo-500/60"
                      : "bg-white/[0.1] hover:bg-white/[0.2]"
                  }`}
                  title={`Question ${idx + 1}: ${q.title} (${isAnswered ? "Answered" : "Unanswered"})`}
                />
              );
            })}
          </div>

          {/* Active Question Card */}
          {currentQuestion && (
            <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6 md:p-8 transition-all">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-white flex items-center justify-center text-xs font-bold font-mono">
                  {currentIndex + 1}
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white leading-snug">
                    {currentQuestion.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {currentQuestion.description}
                  </p>
                </div>
              </div>

              {/* Dynamic AI Recommendation Callout Banner */}
              {currentRecommendation && (
                <div className="mt-4 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      {currentRecommendation.badge}
                    </p>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      {currentRecommendation.reason}
                    </p>
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="mt-6 space-y-2.5">
                {currentQuestion.options.map((opt) => {
                  const currentAnswer = selectedAnswers[currentQuestion.id];
                  const isSelected = currentAnswer?.value === opt.value;
                  const isRecommended = currentRecommendation?.recommendedOptionId === opt.id;

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQuestion.id, opt.value, opt.weeks, opt.hours)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer relative ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500/15 shadow-md shadow-indigo-500/10 text-white"
                          : isRecommended
                          ? "border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/50"
                          : "border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/[0.2] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-gradient-to-r from-indigo-500 to-cyan-400 border-indigo-500 text-white"
                          : isRecommended
                          ? "border-indigo-400 text-indigo-400"
                          : "border-white/[0.15]"
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className={`text-xs sm:text-sm font-semibold ${isSelected ? "text-white" : isRecommended ? "text-indigo-200" : "text-slate-200"}`}>
                            {opt.label}
                          </p>

                          {isRecommended && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              Recommended
                            </span>
                          )}
                        </div>

                        {opt.subLabel && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {opt.subLabel}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Card Footer Navigation */}
              <div className="mt-8 flex items-center justify-between border-t border-white/[0.08] pt-5">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>

                {currentIndex < totalQuestions - 1 ? (
                  <button
                    onClick={() => {
                      const nextIdx = Math.min(totalQuestions - 1, currentIndex + 1);
                      setCurrentIndex(nextIdx);
                      const nextQ = ROADMAP_QUESTIONS[nextIdx];
                      if (nextQ) {
                        const nextRec = getDynamicRecommendation(nextQ.id, selectedAnswers, cachedAnalysis, career);
                        if (nextRec) {
                          const matchingOpt = nextQ.options.find(o => o.id === nextRec.recommendedOptionId);
                          if (matchingOpt && !selectedAnswers[nextQ.id]) {
                            handleSelectOption(nextQ.id, matchingOpt.value, matchingOpt.weeks, matchingOpt.hours);
                          }
                        }
                      }
                    }}
                    className="btn-subtle !py-2 !px-4 !text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={generatePersonalizedRoadmap}
                    disabled={loading}
                    className="btn-gradient !py-2 !px-4 !text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>Generate AI Roadmap</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick Submit Bar */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-400">
                You can review or modify any answers before generating your roadmap.
              </p>
            </div>

            <button
              onClick={generatePersonalizedRoadmap}
              disabled={loading}
              className="w-full sm:w-auto btn-gradient !py-2 !px-4 !text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate My Custom Roadmap ({answeredCount}/{totalQuestions})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function RoadmapQuestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07080e] flex items-center justify-center font-mono text-xs text-slate-400">
          Loading questionnaire...
        </div>
      }
    >
      <RoadmapQuestionsContent />
    </Suspense>
  );
}
