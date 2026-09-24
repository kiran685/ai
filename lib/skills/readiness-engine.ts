import { StudentSkillProfile, PracticeProgress, ReadinessScores } from "@/types";
import { prisma } from "@/lib/prisma";
import { getRoleRequirement } from "@/lib/skills/role-requirements";
import { getUserSkillsForRole } from "@/lib/skills/scoring-service";

interface ReadinessCalculationInput {
  profile?: StudentSkillProfile | null;
  assessmentScores?: number[];
  practiceProgress?: PracticeProgress;
  completedDaysCount?: number;
  totalRoadmapDays?: number;
  resumeFitOverride?: number;
}

/**
 * Deterministic calculation of Resume Fit, Skill Readiness, and Career Readiness.
 * Transparent, explainable, and never presented as a guaranteed hiring probability.
 */
export function calculateTransparentReadiness(input: ReadinessCalculationInput): ReadinessScores {
  const {
    profile,
    assessmentScores = [],
    practiceProgress,
    completedDaysCount = 0,
    totalRoadmapDays = 20,
    resumeFitOverride,
  } = input;

  // 1. Resume Fit (0 - 100): static compatibility baseline
  let resumeFit = resumeFitOverride ?? 60;
  if (profile && profile.skills && profile.skills.length > 0) {
    let resumeEvidencePoints = 0;
    profile.skills.forEach((skill) => {
      if (skill.resumeStatus === "DEMONSTRATED") {
        resumeEvidencePoints += skill.importance === "CRITICAL" ? 1.2 : 1.0;
      } else if (skill.resumeStatus === "CLAIMED") {
        resumeEvidencePoints += skill.importance === "CRITICAL" ? 0.6 : 0.5;
      }
    });

    const maxPossiblePoints =
      profile.skills.reduce((acc, s) => acc + (s.importance === "CRITICAL" ? 1.2 : 1.0), 0) || 1;
    const rawResumeFit = Math.round((resumeEvidencePoints / maxPossiblePoints) * 100);
    resumeFit = Math.max(15, Math.min(95, rawResumeFit));
  }

  // 2. Skill Readiness (0 - 100): empirical demonstration from assessments & practice
  const hasEmpiricalEvidence = assessmentScores.length > 0 || Boolean(practiceProgress && practiceProgress.solvedCount > 0);
  let avgAssessment = 0;
  if (assessmentScores.length > 0) {
    const sum = assessmentScores.reduce((a, b) => a + b, 0);
    avgAssessment = Math.round(sum / assessmentScores.length);
  }

  let practiceBonus = 0;
  if (practiceProgress && practiceProgress.totalProblems > 0) {
    const ratio = practiceProgress.solvedCount / practiceProgress.totalProblems;
    practiceBonus = Math.round(ratio * 20);
  }

  const rawSkillReadiness = Math.round(avgAssessment * 0.8 + practiceBonus);
  const skillReadiness = hasEmpiricalEvidence ? Math.max(0, Math.min(98, rawSkillReadiness)) : 0;

  // 3. Project & Interview Readiness
  const projectReadiness = completedDaysCount > 0 ? Math.min(100, Math.max(15, Math.round((completedDaysCount / Math.max(1, totalRoadmapDays)) * 80 + 15))) : 0;
  const interviewReadiness = avgAssessment > 0 ? Math.min(100, Math.max(10, Math.round(avgAssessment * 0.9))) : 0;

  // 4. Career Readiness (0 - 100): composite index
  // - 40% Verified Skills
  // - 20% Resume Baseline
  // - 20% Practice & Problem Solving
  // - 20% Mission & Roadmap Consistency
  const completionRatio = totalRoadmapDays > 0 ? Math.min(1, completedDaysCount / totalRoadmapDays) : 0;
  const consistencyScore = Math.round(completionRatio * 100);
  const practiceScore = practiceProgress?.practiceScore ?? (completionRatio > 0 ? 50 : 0);

  const careerReadiness = hasEmpiricalEvidence
    ? Math.round(
        skillReadiness * 0.40 +
        resumeFit * 0.20 +
        practiceScore * 0.20 +
        consistencyScore * 0.20
      )
    : Math.round(resumeFit * 0.35);

  return {
    resumeFit: Math.max(0, Math.min(96, resumeFit)),
    skillReadiness,
    careerReadiness: Math.max(0, Math.min(96, careerReadiness)),
    confidence: hasEmpiricalEvidence ? (assessmentScores.length >= 3 ? "HIGH" : "MEDIUM") : "LOW",
    projectReadiness,
    interviewReadiness,
    explanations: {
      resumeFitReason: `Evaluates your parsed resume evidence (${resumeFit}%) against role baseline requirements.`,
      skillReadinessReason: `Empirical score (${skillReadiness}%) computed from actual test submissions and practice exercises.`,
      careerReadinessReason: `Composite readiness (${careerReadiness}%) combining verified skills (40%), resume baseline (20%), practice labs (20%), and consistency (20%).`,
      topStrengths: ["Foundational syntax & logic", "Active learning progression"],
      topBlockers: ["Needs more high-difficulty assessment completions"],
    },
  };
}

/**
 * Computes deep, empirical readiness directly from database records for a specific user.
 */
export async function computeUserReadinessFromDatabase(
  userId: string,
  roleName: string
): Promise<ReadinessScores> {
  const roleReq = getRoleRequirement(roleName);
  const userSkillsData = await getUserSkillsForRole(userId, roleName);

  // 1. Calculate empirical skill readiness using weighted average across role required skills
  let totalWeightedScore = 0;
  let totalWeight = 0;
  const strengths: string[] = [];
  const blockers: string[] = [];

  for (const s of userSkillsData.skills) {
    totalWeightedScore += s.currentScore * s.weight;
    totalWeight += s.weight;

    if (s.currentScore >= 70 && (s.confidenceLevel === "HIGH" || s.confidenceLevel === "MEDIUM")) {
      strengths.push(`${s.skillName} (${s.currentScore}%)`);
    } else if (s.gap >= 20 || s.confidenceLevel === "LOW") {
      blockers.push(`${s.skillName} (Gap: ${s.gap}%, ${s.confidenceLevel} confidence)`);
    }
  }

  // 2. Fetch Assessments from DB
  const assessments = await prisma.assessment.findMany({
    where: { userId },
  });

  const hasEmpiricalEvidence = userSkillsData.skills.some((s) => s.currentScore > 0) || assessments.length > 0;
  const rawSkillReadiness = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
  const skillReadiness = hasEmpiricalEvidence ? Math.max(0, Math.min(98, rawSkillReadiness)) : 0;

  const passedDays = assessments.filter((a) => a.passed).length;
  const totalAttempted = assessments.length;
  const avgDayScore =
    totalAttempted > 0
      ? Math.round(assessments.reduce((acc: number, a) => acc + a.overallScore, 0) / totalAttempted)
      : 0;

  // 3. Fetch CareerProfile for static resume baseline
  const careerProfile = await prisma.careerProfile.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  let resumeFit = careerProfile?.alignmentScore ?? 0;

  // 4. Project and Interview readiness
  const projectReadiness = passedDays > 0 ? Math.min(100, Math.max(10, Math.round(passedDays * 12 + 10))) : 0;
  const interviewReadiness = avgDayScore > 0 ? Math.round(avgDayScore * 0.85 + (passedDays > 0 ? 10 : 0)) : 0;

  // 5. Composite Career Readiness
  // Consistency: out of an assumed 20-day sprint or 100%
  const consistencyScore = Math.min(100, Math.round((passedDays / 15) * 100));
  const practiceScore = avgDayScore > 0 ? avgDayScore : 0;

  const careerReadiness = hasEmpiricalEvidence
    ? Math.min(
        96,
        Math.max(
          10,
          Math.round(
            skillReadiness * 0.40 +
            resumeFit * 0.20 +
            practiceScore * 0.20 +
            consistencyScore * 0.20
          )
        )
      )
    : Math.round(resumeFit * 0.35);

  const scores: ReadinessScores = {
    resumeFit: Math.max(0, Math.min(95, resumeFit)),
    skillReadiness,
    careerReadiness,
    confidence: hasEmpiricalEvidence ? (assessments.length >= 3 ? "HIGH" : "MEDIUM") : "LOW",
    projectReadiness,
    interviewReadiness,
    explanations: {
      resumeFitReason: `Static compatibility score (${resumeFit}%) based on keywords, projects, and skills identified in your uploaded resume for ${roleName}.`,
      skillReadinessReason: `Empirically verified score (${skillReadiness}%) calculated across ${userSkillsData.skills.length} required competencies from your daily practice and test evaluations.`,
      careerReadinessReason: `Composite readiness index (${careerReadiness}%) synthesizing verified technical skills (40%), resume credentials (20%), practice consistency (20%), and mission completion (20%).`,
      topStrengths: strengths.length > 0 ? strengths.slice(0, 3) : ["Consistent study habit"],
      topBlockers: blockers.length > 0 ? blockers.slice(0, 3) : ["Complete upcoming diagnostic missions to verify skills"],
    },
  };

  // Persist updated readiness details in careerProfile if it exists
  if (careerProfile) {
    try {
      await prisma.careerProfile.update({
        where: { id: careerProfile.id },
        data: {
          alignmentScore: resumeFit,
          combinedAlignmentScore: careerReadiness,
          readinessDetails: JSON.stringify(scores),
        },
      });
    } catch (e) {
      console.warn("Failed to persist readiness details:", e);
    }
  }

  return scores;
}
