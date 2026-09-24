import {
  TodayMissionItem,
  StudentSkillProfile,
  WeekOverview,
  DayPlan,
  DayDiagnosticReport,
  PracticeProgress,
  NextMissionSuggestion,
} from "@/types";

interface MissionEngineInput {
  profile: StudentSkillProfile;
  targetRole: string;
  weeks?: WeekOverview[];
  daysData?: Record<string, DayPlan>;
  latestDiagnostic?: DayDiagnosticReport;
  practiceProgress?: PracticeProgress;
  completedDaysCount?: number;
}

/**
 * Derives Today's Mission directly from the student's highest priority gap
 * or latest diagnostic assessment weakness.
 */
export function generateTodaysMission(input: MissionEngineInput): TodayMissionItem {
  const { profile, targetRole, weeks = [], latestDiagnostic, completedDaysCount = 0 } = input;

  // 1. Check if latest assessment identified a critical concept gap
  if (latestDiagnostic && (!latestDiagnostic.passed || latestDiagnostic.criticalConcepts.length > 0)) {
    const criticalConcept =
      latestDiagnostic.criticalConcepts[0] ||
      latestDiagnostic.weakConcepts[0] ||
      latestDiagnostic.needsAttention[0]?.split(" (")[0] ||
      "Core Architecture";

    return {
      id: `mission_remediation_${criticalConcept.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      title: `${criticalConcept} Fundamentals & Remediation`,
      focusSkill: latestDiagnostic.topicPerformance[criticalConcept]?.skill || "Core Engineering",
      targetTopic: criticalConcept,
      targetRole,
      reason: `Your latest assessment identified ${criticalConcept} as an area needing reinforcement.`,
      estimatedMinutes: 45,
      learningMinutes: 15,
      practiceProblems: 3,
      assessmentQuestions: 5,
      completed: false,
      weekId: `week-${Math.max(1, Math.ceil((completedDaysCount + 1) / 5))}`,
      dayNumber: completedDaysCount + 1,
    };
  }

  // 2. Otherwise identify top priority skill gap from profile
  const topGap = profile.priorityGaps[0] || (profile.weakSkills[0] ? {
    skill: profile.weakSkills[0].skill,
    importance: profile.weakSkills[0].importance,
    currentScore: profile.weakSkills[0].score,
    requiredScore: profile.weakSkills[0].expectedScore,
    gapScore: profile.weakSkills[0].expectedScore - profile.weakSkills[0].score,
    status: profile.weakSkills[0].status,
    isPriority: true,
    reason: `Targeting identified gap in ${profile.weakSkills[0].skill}`,
  } : null);

  const focusSkill = topGap?.skill || "Programming";
  const weakTopic = profile.skills.find((s) => s.skill.toLowerCase() === focusSkill.toLowerCase())?.weakTopics?.[0];

  const topicTitles: Record<string, string> = {
    DSA: weakTopic ? `DSA — ${weakTopic}` : "DSA — Arrays & Two-Pointer Technique",
    Programming: weakTopic ? `Programming — ${weakTopic}` : "Programming — Scope, Closures & Execution Models",
    OOP: weakTopic ? `OOP — ${weakTopic}` : "OOP — SOLID Principles & Component Modularity",
    DBMS: weakTopic ? `DBMS — ${weakTopic}` : "DBMS — ACID Transactions & Indexing Mechanics",
    SQL: weakTopic ? `SQL — ${weakTopic}` : "SQL — Complex Joins & Aggregation Queries",
    "Operating Systems": weakTopic ? `OS — ${weakTopic}` : "Operating Systems — Process Concurrency & Thread Synchronization",
    "Computer Networks": weakTopic ? `Networks — ${weakTopic}` : "Computer Networks — HTTP/2, WebSockets & Socket Lifecycles",
    "System Design": weakTopic ? `System Design — ${weakTopic}` : "System Design — Scalability, Redis Caching & Rate Limiting",
    Git: weakTopic ? `Git — ${weakTopic}` : "Git — Branching, Merging & Merge Conflict Resolution",
    Testing: weakTopic ? `Testing — ${weakTopic}` : "Testing — Unit Test Isolation & Mocking Strategies",
  };

  const targetTopic = topicTitles[focusSkill] || `${focusSkill} Core Architecture`;
  const currentDayNum = completedDaysCount + 1;
  const currentWeekNum = Math.max(1, Math.ceil(currentDayNum / 5));
  const weekId = weeks[currentWeekNum - 1]?.id || `week-${currentWeekNum}`;

  return {
    id: `mission_${focusSkill.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_day${currentDayNum}`,
    title: targetTopic,
    focusSkill,
    targetTopic,
    targetRole,
    reason: topGap?.reason || `Core competency requirement for ${targetRole}`,
    estimatedMinutes: 60,
    learningMinutes: 20,
    practiceProblems: 5,
    assessmentQuestions: 5,
    completed: false,
    weekId,
    dayNumber: currentDayNum,
  };
}

/**
 * Determines the next best mission after an assessment has been submitted.
 */
export function determineNextBestMission(input: {
  targetRole: string;
  profile: StudentSkillProfile;
  latestDiagnostic: DayDiagnosticReport;
  practiceProgress?: PracticeProgress;
  completedDaysCount: number;
  currentWeekNumber: number;
}): NextMissionSuggestion {
  const { targetRole, profile, latestDiagnostic, completedDaysCount, currentWeekNumber } = input;

  const isRemediation = !latestDiagnostic.passed || latestDiagnostic.criticalConcepts.length > 0;
  const targetConcept =
    latestDiagnostic.criticalConcepts[0] ||
    latestDiagnostic.weakConcepts[0] ||
    "Advanced Architecture";

  const nextDay = completedDaysCount + 1;

  if (isRemediation) {
    return {
      dayId: `week-${currentWeekNumber}_day-${nextDay}`,
      skill: latestDiagnostic.topicPerformance[targetConcept]?.skill || "Core Engineering",
      topic: targetConcept,
      concept: targetConcept,
      reason: `Assessment showed significant weakness in ${targetConcept}`,
      priority: "HIGH",
      estimatedMinutes: 45,
      activities: [
        `Review ${targetConcept} fundamentals and edge cases`,
        `Solve 3 guided hands-on practice problems`,
        `Complete 5-question checkpoint assessment`,
      ],
      isRemediation: true,
    };
  }

  // Smooth standard next mission
  const nextSkill = profile.priorityGaps[0]?.skill || "Production Architecture";
  return {
    dayId: `week-${currentWeekNumber}_day-${nextDay}`,
    skill: nextSkill,
    topic: `Day ${nextDay} Progression: ${nextSkill}`,
    reason: `Passed previous day assessment with ${latestDiagnostic.overallScore}%. Advancing to next curriculum milestone.`,
    priority: "MEDIUM",
    estimatedMinutes: 60,
    activities: [
      `Absorb Day ${nextDay} theory and internal mechanics`,
      `Implement 5 coding practice lab challenges`,
      `Pass 10-question technical checkpoint`,
    ],
    isRemediation: false,
  };
}
