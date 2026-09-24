import { ReadinessScore, SkillGap } from "./types";

export function calculateReadiness(
  skillGaps: SkillGap[],
  completedDays: number,
  totalDays: number,
  assessmentScores: Record<string, number> = {}
): ReadinessScore {
  // --- Skills Score (35% weight) ---
  // Based on how many HIGH priority gaps are still open
  const highGaps = skillGaps.filter((g) => g.priority === "HIGH").length;
  const mediumGaps = skillGaps.filter((g) => g.priority === "MEDIUM").length;
  const totalGaps = skillGaps.length;

  const avgAssessmentScore =
    Object.values(assessmentScores).length > 0
      ? Object.values(assessmentScores).reduce((a, b) => a + b, 0) /
        Object.values(assessmentScores).length
      : 50; // default if no assessments taken yet

  let skillsScore: number;
  if (totalGaps === 0) {
    skillsScore = 85; // No known gaps
  } else {
    const gapPenalty = (highGaps * 15 + mediumGaps * 8) / totalGaps;
    skillsScore = Math.max(10, Math.min(95, avgAssessmentScore - gapPenalty));
  }

  // --- Resume Score (25% weight) ---
  // Placeholder: assume resume exists and was analyzed
  const resumeScore = 70; // Will be updated when resume analysis is stored

  // --- Projects Score (25% weight) ---
  // Based on days completed as a proxy for project progress
  const daysRatio = totalDays > 0 ? completedDays / totalDays : 0;
  const projectsScore = Math.min(95, Math.round(10 + daysRatio * 85));

  // --- Interview Score (15% weight) ---
  // Based on assessment performance as a proxy
  const interviewScore = Math.min(
    95,
    Math.max(20, Math.round(avgAssessmentScore * 0.8 + 15))
  );

  // --- Overall Score ---
  const overallScore = Math.round(
    skillsScore * 0.35 +
      resumeScore * 0.25 +
      projectsScore * 0.25 +
      interviewScore * 0.15
  );

  // --- Readiness Tier ---
  let readinessTier: ReadinessScore["readinessTier"];
  if (overallScore >= 80) readinessTier = "READY";
  else if (overallScore >= 60) readinessTier = "NEAR_READY";
  else if (overallScore >= 35) readinessTier = "DEVELOPING";
  else readinessTier = "NEEDS_FOUNDATION";

  // --- Recommendations ---
  const recommendations: string[] = [];

  if (skillsScore < 50) {
    recommendations.push(
      "Focus on closing your top skill gaps before moving to advanced topics."
    );
  }
  if (highGaps > 2) {
    recommendations.push(
      `You have ${highGaps} high-priority skill gaps. Prioritize these for maximum impact.`
    );
  }
  if (projectsScore < 40) {
    recommendations.push(
      "Complete more daily missions to build hands-on project experience."
    );
  }
  if (interviewScore < 50) {
    recommendations.push(
      "Practice more assessments to build confidence for technical interviews."
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Great progress! Consider tackling advanced topics or building a capstone project."
    );
  }

  return {
    overallScore,
    subScores: {
      skills: Math.round(skillsScore),
      resume: Math.round(resumeScore),
      projects: Math.round(projectsScore),
      interview: Math.round(interviewScore),
    },
    weights: {
      skills: 0.35,
      resume: 0.25,
      projects: 0.25,
      interview: 0.15,
    },
    readinessTier,
    recommendations,
  };
}
