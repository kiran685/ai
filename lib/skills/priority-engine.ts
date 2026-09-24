import { prisma } from "@/lib/prisma";
import { getRoleRequirement } from "@/lib/skills/role-requirements";
import { getSkillDefinition } from "@/lib/skills/skill-catalog";
import { MASTERY_THRESHOLD } from "@/lib/skills/constants";

export interface SkillPriorityGap {
  skillName: string;
  currentScore: number;
  targetScore: number;
  gap: number;
  weight: number;
  confidenceLevel: "LOW" | "MEDIUM" | "HIGH";
  priorityScore: number;
  criticalityMultiplier: number;
  momentumMultiplier?: number;
  momentumStatus?: "STAGNANT" | "IMPROVING" | "NEUTRAL";
  weakestConcepts: string[];
  recommendedAction: string;
  masteryStatus?: "CRITICAL_GAP" | "HIGH_PRIORITY" | "DEVELOPING" | "MASTERED";
}

export interface TodayMissionRecommendation {
  dayNumber: number;
  title: string;
  skillName: string;
  conceptFocus: string[];
  reason: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  isRemediation: boolean;
  targetMetric: string;
  missionType: "BASE_ROADMAP" | "ADAPTIVE_INTERVENTION";
  source: "ROADMAP" | "PERFORMANCE_DIAGNOSTIC";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  evidenceRef?: string;
  createdAt: string;
}

export interface HighestImpactAction {
  conceptName: string;
  skillName: string;
  currentScore: number;
  targetScore: number;
  gapPoints: number;
  confidenceLevel: "LOW" | "MEDIUM" | "HIGH";
  priorityLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  recommendedAction: string;
  isRemediation: boolean;
  dayNumber?: number;
  masteryStatus?: "CRITICAL_GAP" | "HIGH_PRIORITY" | "DEVELOPING" | "MASTERED";
  verifiedEvidenceCount?: number;
}

/**
 * Priority formula:
 * Priority = Skill Weight * Gap Size (Target - Current) * Concept Criticality * Confidence Factor
 */
export async function calculatePriorityGaps(
  userId: string,
  roleName: string
): Promise<SkillPriorityGap[]> {
  const roleReq = getRoleRequirement(roleName);
  const targetScore = roleReq.minExpectedScore || MASTERY_THRESHOLD;

  const userSkills = await prisma.userSkill.findMany({
    where: { userId },
    include: { skill: true },
  });

  const skillMap = new Map<string, typeof userSkills[0]>();
  for (const us of userSkills) {
    skillMap.set(us.skill.name.toLowerCase(), us);
  }

  const gaps: SkillPriorityGap[] = [];

  for (const skillName of roleReq.requiredSkills) {
    const userSkill = skillMap.get(skillName.toLowerCase());
    const currentScore = userSkill?.currentScore ?? 0;
    const gap = Math.max(0, targetScore - currentScore);
    const weight = roleReq.skillWeights?.[skillName] ?? Math.round(100 / roleReq.requiredSkills.length);
    const confidence = (userSkill?.confidenceLevel as "LOW" | "MEDIUM" | "HIGH") || "LOW";

    // Uncertainty/Confidence factor: Low confidence skills need more evidence/attention
    const confidenceMultiplier = confidence === "LOW" ? 1.35 : confidence === "MEDIUM" ? 1.15 : 1.0;

    // Check concept scores
    const skillCatalog = getSkillDefinition(skillName);
    let conceptScores: Record<string, { score: number; attempts: number }> = {};
    if (userSkill?.conceptScores) {
      try {
        conceptScores = JSON.parse(userSkill.conceptScores);
      } catch {
        conceptScores = {};
      }
    }

    // Find weak concepts (< MASTERY_THRESHOLD score or tested and failed)
    const weakestConcepts: string[] = [];
    let criticalityMultiplier = 1.0;

    if (skillCatalog?.concepts) {
      for (const concept of skillCatalog.concepts) {
        const perf = conceptScores[concept.id];
        if (perf && perf.score < MASTERY_THRESHOLD) {
          weakestConcepts.push(concept.name);
          if (concept.criticality >= 4) {
            criticalityMultiplier = Math.max(criticalityMultiplier, 1.4);
          } else {
            criticalityMultiplier = Math.max(criticalityMultiplier, 1.2);
          }
        } else if (!perf && gap > 15) {
          // Untested concept in a high-gap skill
          weakestConcepts.push(concept.name);
        }
      }
    }

    // Anti-oscillation & Mastery check:
    // If concept score >= MASTERY_THRESHOLD, mark it MASTERED and do not flag as weak
    const isSkillMastered = currentScore >= targetScore && (confidence === "HIGH" || confidence === "MEDIUM");
    const masteryStatus: "CRITICAL_GAP" | "HIGH_PRIORITY" | "DEVELOPING" | "MASTERED" =
      isSkillMastered
        ? "MASTERED"
        : gap >= 35
        ? "CRITICAL_GAP"
        : gap >= 20
        ? "HIGH_PRIORITY"
        : "DEVELOPING";

    // Momentum factor: check if student is actively improving vs stagnant
    let momentumMultiplier = 1.0;
    let momentumStatus: "STAGNANT" | "IMPROVING" | "NEUTRAL" = "NEUTRAL";
    const totalAttempts = Object.values(conceptScores).reduce((acc, c) => acc + (c.attempts || 0), 0);

    if (totalAttempts >= 2 && currentScore < MASTERY_THRESHOLD) {
      momentumMultiplier = 1.25; // Persistent deficit needing urgent attention
      momentumStatus = "STAGNANT";
    } else if (currentScore >= 60 && gap > 0) {
      momentumMultiplier = 0.85; // Actively improving, closing gap steadily
      momentumStatus = "IMPROVING";
    }

    // If gap is 0 or mastered, baseline priority is low
    const rawPriority = isSkillMastered
      ? 5.0
      : weight * (gap + 5) * criticalityMultiplier * confidenceMultiplier * momentumMultiplier;
    const priorityScore = Math.round(rawPriority * 10) / 10;

    let recommendedAction = "Maintain mastery through periodic mock practice.";
    if (isSkillMastered) {
      recommendedAction = `Verified mastery in ${skillName} (≥ ${targetScore}%). Maintain readiness through applied problem-solving.`;
    } else if (gap >= 25) {
      recommendedAction = `Review ${weakestConcepts.slice(0, 2).join(" & ") || skillName} → solve targeted problems → pass assessment.`;
    } else if (gap > 10) {
      recommendedAction = `Targeted assessment to close the ${gap} point gap in ${skillName}.`;
    } else if (confidence === "LOW") {
      recommendedAction = `Complete practical assessment to verify claimed proficiency in ${skillName}.`;
    }

    gaps.push({
      skillName,
      currentScore,
      targetScore,
      gap,
      weight,
      confidenceLevel: confidence,
      priorityScore,
      criticalityMultiplier,
      momentumMultiplier,
      momentumStatus,
      weakestConcepts: weakestConcepts.slice(0, 3),
      recommendedAction,
      masteryStatus,
    });
  }

  // Sort by priorityScore descending; require meaningful delta (>= 3) to prevent flip-flopping
  return gaps.sort((a, b) => {
    const diff = b.priorityScore - a.priorityScore;
    if (Math.abs(diff) < 2.5) {
      // Tie-breaker: larger gap wins to stabilize ordering
      return b.gap - a.gap;
    }
    return diff;
  });
}

/**
 * Dynamically identifies the primary focus for Today's Mission.
 * Adapts to recent failed assessments (< MASTERY_THRESHOLD) for remediation, or highest-priority gap.
 */
export async function getAdaptiveTodayMission(
  userId: string,
  roleName: string,
  completedDays: number = 0
): Promise<TodayMissionRecommendation> {
  const priorityGaps = await calculatePriorityGaps(userId, roleName);
  const topGap = priorityGaps[0] || {
    skillName: "Core Problem Solving",
    gap: 20,
    weakestConcepts: ["Algorithmic Complexity"],
    confidenceLevel: "LOW" as const,
  };

  // Check if there's any recent failed assessment (< MASTERY_THRESHOLD) in UserSkill
  const userSkills = await prisma.userSkill.findMany({
    where: { userId },
    include: { skill: true },
  });

  let remediationSkill: string | null = null;
  let remediationConcepts: string[] = [];

  for (const us of userSkills) {
    if (us.assessmentScore !== null && us.assessmentScore < MASTERY_THRESHOLD) {
      remediationSkill = us.skill.name;
      if (us.conceptScores) {
        try {
          const parsed = JSON.parse(us.conceptScores);
          remediationConcepts = Object.keys(parsed).filter((k) => parsed[k].score < MASTERY_THRESHOLD);
        } catch {
          // ignore
        }
      }
      break;
    }
  }

  const dayNumber = Math.max(1, completedDays + 1);

  if (remediationSkill) {
    return {
      dayNumber,
      title: `Day ${dayNumber}: Targeted Remediation — ${remediationSkill}`,
      skillName: remediationSkill,
      conceptFocus: remediationConcepts.length > 0 ? remediationConcepts : [remediationSkill],
      reason: `Your previous assessment in ${remediationSkill} was below the ${MASTERY_THRESHOLD}% mastery threshold. Reinforcing core foundations will unlock subsequent modules.`,
      difficulty: "INTERMEDIATE",
      isRemediation: true,
      targetMetric: `Achieve ≥ ${MASTERY_THRESHOLD}% on Remediation Re-test`,
      missionType: "ADAPTIVE_INTERVENTION",
      source: "PERFORMANCE_DIAGNOSTIC",
      priority: "CRITICAL",
      createdAt: new Date().toISOString(),
    };
  }

  const priorityLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" =
    topGap.gap >= 35 ? "CRITICAL" : topGap.gap >= 20 ? "HIGH" : topGap.gap > 0 ? "MEDIUM" : "LOW";

  return {
    dayNumber,
    title: `Day ${dayNumber}: Core Mastery — ${topGap.skillName}`,
    skillName: topGap.skillName,
    conceptFocus: topGap.weakestConcepts.length > 0 ? topGap.weakestConcepts : [topGap.skillName],
    reason: `Highest priority role gap for ${roleName}. Closing this ${topGap.gap} point gap provides the greatest increase to your Career Readiness score.`,
    difficulty: topGap.gap > 30 ? "BEGINNER" : topGap.gap > 15 ? "INTERMEDIATE" : "ADVANCED",
    isRemediation: false,
    targetMetric: `Elevate ${topGap.skillName} score from ${topGap.currentScore}% to ${topGap.targetScore}%`,
    missionType: "BASE_ROADMAP",
    source: "ROADMAP",
    priority: priorityLevel,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Computes structured details for the "TODAY'S HIGHEST-IMPACT ACTION" dashboard section.
 * Directly links the priority engine to user actions.
 */
export async function getHighestImpactAction(
  userId: string,
  roleName: string
): Promise<HighestImpactAction> {
  const roleReq = getRoleRequirement(roleName);
  const targetScore = roleReq.minExpectedScore || MASTERY_THRESHOLD;

  // Check for active failed assessment / remediation
  const userSkills = await prisma.userSkill.findMany({
    where: { userId },
    include: { skill: true },
  });

  for (const us of userSkills) {
    if (us.assessmentScore !== null && us.assessmentScore < MASTERY_THRESHOLD) {
      let weakConceptName = us.skill.name;
      if (us.conceptScores) {
        try {
          const parsed = JSON.parse(us.conceptScores);
          const weakKey = Object.keys(parsed).find((k) => parsed[k].score < MASTERY_THRESHOLD);
          if (weakKey) {
            // Find concept display name in catalog
            const catalog = getSkillDefinition(us.skill.name);
            const found = catalog?.concepts.find((c) => c.id === weakKey);
            weakConceptName = found?.name || weakKey.replace(/_/g, " ");
          }
        } catch {}
      }

      const current = us.currentScore ?? 0;
      const gap = Math.max(0, targetScore - current);

      return {
        conceptName: weakConceptName,
        skillName: us.skill.name,
        currentScore: current,
        targetScore,
        gapPoints: gap,
        confidenceLevel: (us.confidenceLevel as "LOW" | "MEDIUM" | "HIGH") || "MEDIUM",
        priorityLevel: "CRITICAL",
        recommendedAction: `Review ${weakConceptName} → solve targeted practice problems → retry assessment to hit ≥ ${MASTERY_THRESHOLD}%`,
        isRemediation: true,
        masteryStatus: "CRITICAL_GAP",
      };
    }
  }

  // Otherwise, use top priority gap
  const priorityGaps = await calculatePriorityGaps(userId, roleName);
  const topGap = priorityGaps[0];

  if (!topGap || topGap.gap === 0) {
    return {
      conceptName: "All Core Foundations Verified",
      skillName: roleReq.requiredSkills[0] || "Software Engineering",
      currentScore: targetScore,
      targetScore,
      gapPoints: 0,
      confidenceLevel: "HIGH",
      priorityLevel: "LOW",
      recommendedAction: "Maintain mastery through periodic mock interviews and timed code labs.",
      isRemediation: false,
      masteryStatus: "MASTERED",
    };
  }

  const primaryConcept = topGap.weakestConcepts[0] || topGap.skillName;
  const priorityLevel: "CRITICAL" | "HIGH" | "MEDIUM" =
    topGap.gap >= 35 ? "CRITICAL" : topGap.gap >= 20 ? "HIGH" : "MEDIUM";

  return {
    conceptName: primaryConcept,
    skillName: topGap.skillName,
    currentScore: topGap.currentScore,
    targetScore: topGap.targetScore,
    gapPoints: topGap.gap,
    confidenceLevel: topGap.confidenceLevel,
    priorityLevel,
    recommendedAction: topGap.recommendedAction,
    isRemediation: false,
    masteryStatus: topGap.masteryStatus || (topGap.gap >= 35 ? "CRITICAL_GAP" : topGap.gap >= 20 ? "HIGH_PRIORITY" : "DEVELOPING"),
  };
}
