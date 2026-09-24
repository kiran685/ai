import {
  RoadmapData,
  DayDiagnosticReport,
  DayPlan,
  PracticeProblem,
  DayAssessmentQuestion,
} from "@/types";

interface AdaptiveInput {
  roadmapData: RoadmapData;
  dayId: string;
  dayNumber: number;
  weekNumber: number;
  diagnosticReport: DayDiagnosticReport;
  targetRole: string;
}

export interface AdaptiveResult {
  adapted: boolean;
  message: string;
  remediationDayNumber?: number;
  remediationTopic?: string;
  updatedRoadmapData: RoadmapData;
}

/**
 * Creates a focused remediation DayPlan to help the student eliminate critical concept gaps.
 */
function createRemediationDayPlan(
  dayNumber: number,
  concept: string,
  targetRole: string
): DayPlan {
  const practiceProblems: PracticeProblem[] = [
    {
      id: `rem-p1-${dayNumber}`,
      problemNumber: 1,
      title: `${concept}: Foundational Pattern Exercise`,
      description: `Write an efficient function demonstrating the core mechanics of ${concept}. Pay close attention to index bounds and boundary conditions.`,
      difficulty: "Easy",
      exampleInput: "[1, 2, 3, 4, 5]",
      expectedOutput: "Valid boundary slice",
      solutionHint: `Initialize your pointers or window states cleanly before looping.`,
      starterCode: `function solve(input) {\n  // Remediation: Implement clean ${concept} logic\n  return input;\n}`,
    },
    {
      id: `rem-p2-${dayNumber}`,
      problemNumber: 2,
      title: `${concept}: Handling Edge & Constraint Cases`,
      description: `Implement a defensive solution that verifies edge inputs (empty collections, duplicates, or negative bounds) using ${concept}.`,
      difficulty: "Medium",
      exampleInput: "[]",
      expectedOutput: "Handled gracefully",
      solutionHint: `Add explicit guard checks at the start of the function.`,
      starterCode: `function solve(input) {\n  if (!input || input.length === 0) return null;\n  // Edge-case handling\n  return true;\n}`,
    },
    {
      id: `rem-p3-${dayNumber}`,
      problemNumber: 3,
      title: `${concept}: Production Time-Complexity Optimization`,
      description: `Optimize this brute-force approach to run in O(N) linear time using ${concept}.`,
      difficulty: "Medium",
      exampleInput: "[4, 2, 1, 7, 8, 1, 2, 8, 1, 0]",
      expectedOutput: "Optimal linear output",
      solutionHint: `Maintain running variables rather than re-scanning previous elements.`,
      starterCode: `function solve(arr) {\n  let maxVal = 0;\n  // O(N) optimized implementation\n  return maxVal;\n}`,
    },
  ];

  const assessmentQuestions: DayAssessmentQuestion[] = [
    {
      id: `rem-q1-${dayNumber}`,
      question: `What is the primary architectural advantage of applying ${concept} over naive approaches?`,
      options: [
        `It reduces polynomial time complexity to linear or logarithmic time`,
        `It eliminates the need for compilation`,
        `It converts backend code to client-side GPU execution`,
        `It bypasses memory allocation completely`,
      ],
      correctIndex: 0,
      skill: concept,
      topic: `${concept} Remediation`,
      concept,
      difficulty: "easy",
      explanation: `${concept} is designed to eliminate redundant recalculation and lower overall computational complexity.`,
    },
    {
      id: `rem-q2-${dayNumber}`,
      question: `When implementing ${concept}, which failure mode is most commonly encountered in production?`,
      options: [
        `Off-by-one errors and unbounded boundary conditions`,
        `Network socket timeouts during array indexing`,
        `HTTP 500 status on purely algorithmic functions`,
        `Automatic garbage collector de-allocation of pointers`,
      ],
      correctIndex: 0,
      skill: concept,
      topic: `${concept} Remediation`,
      concept,
      difficulty: "medium",
      explanation: `Off-by-one errors and improper boundary handling are the leading causes of algorithmic defects in ${concept}.`,
    },
  ];

  return {
    id: `day-${dayNumber}`,
    dayNumber,
    topic: `Remediation & Practical Mastery: ${concept}`,
    description: `Targeted remediation session created dynamically based on your latest assessment to reinforce ${concept} and ensure complete conceptual confidence.`,
    skills: [concept, `${concept} Edge Cases`, "Algorithmic Efficiency"],
    practiceProblems,
    learningResources: [
      `Official Docs: ${concept} Best Practices`,
      `Interactive Visualizer: Step-by-Step ${concept}`,
    ],
    assessment: assessmentQuestions,
  };
}

/**
 * Analyzes assessment performance and adaptively recalibrates the roadmap if needed.
 */
export function adaptRoadmapOnPerformance(input: AdaptiveInput): AdaptiveResult {
  const { roadmapData, dayNumber, weekNumber, diagnosticReport, targetRole } = input;

  // Clone roadmapData to maintain immutability
  const updatedRoadmapData: RoadmapData = {
    weeks: [...(roadmapData.weeks || [])],
    daysData: { ...(roadmapData.daysData || {}) },
    dayResults: { ...(roadmapData.dayResults || {}) },
  };

  // Case 1: Student passed well (overall >= 75% and no critical gaps)
  if (diagnosticReport.passed && diagnosticReport.criticalConcepts.length === 0) {
    return {
      adapted: false,
      message: "Score meets performance threshold (≥ 70%). Standard roadmap progression continues.",
      updatedRoadmapData,
    };
  }

  // Case 2: Student had poor performance or critical concept gap (< 40%)
  const primaryWeakness =
    diagnosticReport.criticalConcepts[0] ||
    diagnosticReport.weakConcepts[0] ||
    diagnosticReport.needsAttention[0]?.split(" (")[0] ||
    "Core Algorithmic Foundations";

  const nextDayNumber = dayNumber + 1;
  const nextDayKey = `week-${weekNumber}_day-${nextDayNumber}`;

  // Check if next day was already completed; if so, do not overwrite completed history
  const nextDayResult = updatedRoadmapData.dayResults?.[nextDayKey];
  if (nextDayResult?.passed) {
    return {
      adapted: false,
      message: `Identified gap in ${primaryWeakness}, but subsequent day is already passed. Continuing current track.`,
      updatedRoadmapData,
    };
  }

  // Insert or adjust next day into a targeted remediation mission
  const remediationDayPlan = createRemediationDayPlan(nextDayNumber, primaryWeakness, targetRole);
  updatedRoadmapData.daysData[nextDayKey] = remediationDayPlan;

  const adaptationMessage = `Your roadmap was adjusted based on your assessment performance. Day ${nextDayNumber} has been updated to focus on Remediation & Deep Practice for ${primaryWeakness}.`;

  return {
    adapted: true,
    message: adaptationMessage,
    remediationDayNumber: nextDayNumber,
    remediationTopic: primaryWeakness,
    updatedRoadmapData,
  };
}
