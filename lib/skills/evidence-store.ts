import { prisma } from "@/lib/prisma";
import { MASTERY_THRESHOLD } from "@/lib/skills/constants";

export type EvidenceType = "RESUME" | "PRACTICE" | "ASSESSMENT" | "MISSION" | "PROJECT" | "CONCEPT_EVAL";

export interface SkillEvidenceInput {
  userId: string;
  idempotencyKey: string;
  skillName: string;
  conceptId?: string | null;
  evidenceType: EvidenceType;
  score: number; // 0 - 100
  weight?: number;
  metadata?: Record<string, any> | null;
}

export interface SkillEvidenceRecord {
  id: string;
  userId: string;
  idempotencyKey: string;
  skillName: string;
  conceptId?: string | null;
  evidenceType: EvidenceType;
  score: number;
  weight: number;
  metadata?: string | null;
  createdAt: Date;
}

export interface SkillScoreExplanation {
  skillName: string;
  currentScore: number;
  targetScore: number;
  gapPoints: number;
  confidenceLevel: "LOW" | "MEDIUM" | "HIGH";
  confidenceReason: string;
  evidenceBreakdown: {
    resume: { score: number | null; weightPct: number; contribution: number; status: string };
    practice: { score: number | null; weightPct: number; contribution: number; solvedCount: number };
    assessment: { score: number | null; weightPct: number; contribution: number; attemptCount: number };
    mission: { score: number | null; weightPct: number; contribution: number };
    project: { score: number | null; weightPct: number; contribution: number };
  };
  trend: number[];
  trendDirection: "IMPROVING" | "STABLE" | "DECLINING" | "INSUFFICIENT_HISTORY";
  mainGap: string;
  mainReason: string;
  recommendedAction: string;
  masteryStatus: "CRITICAL_GAP" | "HIGH_PRIORITY" | "DEVELOPING" | "MASTERED";
  verifiedCounts: {
    assessments: number;
    practiceProblems: number;
  };
}

export type ScoreExplanation = SkillScoreExplanation;

/**
 * Standard baseline weights for evidence sources
 */
export const EVIDENCE_BASE_WEIGHTS: Record<EvidenceType, number> = {
  RESUME: 0.10,     // 10%
  PRACTICE: 0.25,   // 25%
  ASSESSMENT: 0.40, // 40%
  MISSION: 0.15,    // 15%
  PROJECT: 0.10,    // 10%
  CONCEPT_EVAL: 0.30, // 30%
};

/**
 * Calculates time-decay recency multiplier (0.75 - 1.0)
 * - Within 7 days: 1.0 (full weight)
 * - 7 to 30 days: linear decay to 0.85
 * - Beyond 30 days: 0.75 floor (retains historical foundation)
 */
export function calculateRecencyMultiplier(createdAt: Date, now: Date = new Date()): number {
  const ageMs = Math.max(0, now.getTime() - createdAt.getTime());
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays <= 7) return 1.0;
  if (ageDays <= 30) {
    const fraction = (ageDays - 7) / 23;
    return 1.0 - fraction * 0.15; // 1.0 down to 0.85
  }
  return 0.75;
}

/**
 * Records an immutable evidence event with strict idempotency protection.
 * If the idempotencyKey exists, returns existing evidence without duplicate scoring.
 */
export async function recordRawEvidence(
  input: SkillEvidenceInput
): Promise<{ isDuplicate: boolean; evidence: SkillEvidenceRecord }> {
  const db = (prisma as any).skillEvidence;

  try {
    const existing = await db.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });

    if (existing) {
      return { isDuplicate: true, evidence: existing };
    }

    const created = await db.create({
      data: {
        userId: input.userId,
        idempotencyKey: input.idempotencyKey,
        skillName: input.skillName,
        conceptId: input.conceptId || null,
        evidenceType: input.evidenceType,
        score: Math.max(0, Math.min(100, input.score)),
        weight: input.weight ?? EVIDENCE_BASE_WEIGHTS[input.evidenceType] ?? 1.0,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });

    return { isDuplicate: false, evidence: created };
  } catch (error: any) {
    // If a race condition triggers unique constraint violation, fetch the existing record
    if (error?.code === "P2002" || String(error).includes("Unique constraint")) {
      const existing = await db.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) {
        return { isDuplicate: true, evidence: existing };
      }
    }
    throw error;
  }
}

/**
 * Fetches all raw evidence events for a user and skill, ordered chronologically.
 */
export async function getSkillEvidences(
  userId: string,
  skillName: string
): Promise<SkillEvidenceRecord[]> {
  const db = (prisma as any).skillEvidence;
  return await db.findMany({
    where: {
      userId,
      skillName,
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Aggregates raw evidence for a skill applying recency weighting and normalization.
 */
export function aggregateEvidence(
  evidences: SkillEvidenceRecord[],
  now: Date = new Date()
) {
  if (evidences.length === 0) {
    return {
      currentScore: 0,
      confidenceLevel: "LOW" as const,
      confidenceReason: "No verified evidence recorded yet.",
      weightsUsed: {},
      breakdown: {
        resume: null,
        practice: null,
        assessment: null,
        mission: null,
        project: null,
      },
      trend: [],
      trendDirection: "INSUFFICIENT_HISTORY" as const,
      verifiedCounts: { assessments: 0, practiceProblems: 0 },
    };
  }

  // Group latest/weighted scores by evidenceType
  const typeGroups: Record<EvidenceType, { totalWeightedScore: number; totalWeight: number; count: number; latestScore: number }> = {
    RESUME: { totalWeightedScore: 0, totalWeight: 0, count: 0, latestScore: 0 },
    PRACTICE: { totalWeightedScore: 0, totalWeight: 0, count: 0, latestScore: 0 },
    ASSESSMENT: { totalWeightedScore: 0, totalWeight: 0, count: 0, latestScore: 0 },
    MISSION: { totalWeightedScore: 0, totalWeight: 0, count: 0, latestScore: 0 },
    PROJECT: { totalWeightedScore: 0, totalWeight: 0, count: 0, latestScore: 0 },
    CONCEPT_EVAL: { totalWeightedScore: 0, totalWeight: 0, count: 0, latestScore: 0 },
  };

  let totalPracticeProblems = 0;
  let totalAssessments = 0;

  for (const ev of evidences) {
    const recency = calculateRecencyMultiplier(ev.createdAt, now);
    const effectiveWeight = ev.weight * recency;
    const group = typeGroups[ev.evidenceType];
    group.totalWeightedScore += ev.score * effectiveWeight;
    group.totalWeight += effectiveWeight;
    group.count++;
    group.latestScore = ev.score;

    if (ev.evidenceType === "PRACTICE") {
      let solved = 1;
      if (ev.metadata) {
        try {
          const parsed = JSON.parse(ev.metadata);
          if (parsed.solvedCount) solved = parsed.solvedCount;
        } catch {}
      }
      totalPracticeProblems += solved;
    }
    if (ev.evidenceType === "ASSESSMENT") {
      totalAssessments++;
    }
  }

  // Compute composite score using active sources
  let compositeNumerator = 0;
  let compositeDenominator = 0;
  const weightsUsed: Record<string, number> = {};
  const breakdown: Record<string, number | null> = {
    resume: null,
    practice: null,
    assessment: null,
    mission: null,
    project: null,
  };

  for (const [type, group] of Object.entries(typeGroups) as [EvidenceType, typeof typeGroups[EvidenceType]][]) {
    const key = type.toLowerCase();
    if (group.count > 0 && group.totalWeight > 0) {
      const typeAvg = group.totalWeightedScore / group.totalWeight;
      const baseWeight = EVIDENCE_BASE_WEIGHTS[type];
      compositeNumerator += typeAvg * baseWeight;
      compositeDenominator += baseWeight;
      breakdown[key] = Math.round(typeAvg);
    }
  }

  const currentScore = compositeDenominator > 0
    ? Math.min(100, Math.max(0, Math.round(compositeNumerator / compositeDenominator)))
    : 0;

  // Build historical trend from chronological sequence
  const trend: number[] = [];
  let runningScore = 0;
  let runningWeight = 0;
  for (const ev of evidences) {
    runningScore += ev.score;
    runningWeight += 1;
    trend.push(Math.round(runningScore / runningWeight));
  }

  let trendDirection: "IMPROVING" | "STABLE" | "DECLINING" | "INSUFFICIENT_HISTORY" = "INSUFFICIENT_HISTORY";
  if (trend.length >= 2) {
    const delta = trend[trend.length - 1] - trend[0];
    if (delta >= 3) trendDirection = "IMPROVING";
    else if (delta <= -3) trendDirection = "DECLINING";
    else trendDirection = "STABLE";
  }

  // Rigorous Confidence Model
  const activeSourcesCount = Object.values(typeGroups).filter((g) => g.count > 0).length;
  const hasAssessment = typeGroups.ASSESSMENT.count > 0;
  const hasPractice = typeGroups.PRACTICE.count > 0;

  let confidenceLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  let confidenceReason = "Low confidence: requires more practical and assessment evaluations.";

  if (
    (activeSourcesCount >= 3 && totalAssessments >= 2 && totalPracticeProblems >= 3) ||
    (totalAssessments >= 3 && totalPracticeProblems >= 3)
  ) {
    confidenceLevel = "HIGH";
    confidenceReason = `High confidence verified through ${totalAssessments} assessments and ${totalPracticeProblems} practice labs across multiple sessions.`;
  } else if (activeSourcesCount >= 2 || (hasAssessment && totalPracticeProblems >= 1)) {
    confidenceLevel = "MEDIUM";
    confidenceReason = `Medium confidence: verified through ${totalAssessments} assessment(s) and ${totalPracticeProblems} practice lab(s). Complete more tests to reach high confidence.`;
  } else {
    confidenceLevel = "LOW";
    confidenceReason = "Low confidence: based on limited evidence. Complete your daily code lab and assessment.";
  }

  return {
    currentScore,
    confidenceLevel,
    confidenceReason,
    weightsUsed,
    breakdown,
    trend,
    trendDirection,
    verifiedCounts: {
      assessments: totalAssessments,
      practiceProblems: totalPracticeProblems,
    },
  };
}

/**
 * Fully reconstructs and updates a UserSkill record from raw evidence logs.
 */
export async function rebuildUserSkillFromEvidence(
  userId: string,
  skillName: string
) {
  let skill = await prisma.skill.findUnique({ where: { name: skillName } });
  if (!skill) {
    skill = await prisma.skill.create({
      data: { name: skillName },
    });
  }

  const rawEvidences = await getSkillEvidences(userId, skillName);
  const aggregated = aggregateEvidence(rawEvidences);

  // Concept scores map
  const existingUserSkill = await prisma.userSkill.findUnique({
    where: { userId_skillId: { userId, skillId: skill.id } },
  });

  return await prisma.userSkill.upsert({
    where: { userId_skillId: { userId, skillId: skill.id } },
    update: {
      currentScore: aggregated.currentScore,
      confidenceLevel: aggregated.confidenceLevel,
      confidence: aggregated.confidenceLevel.toLowerCase(),
      resumeEvidence: aggregated.breakdown.resume,
      practiceScore: aggregated.breakdown.practice,
      assessmentScore: aggregated.breakdown.assessment,
      missionCompletion: aggregated.breakdown.mission,
      projectEvidence: aggregated.breakdown.project,
    },
    create: {
      userId,
      skillId: skill.id,
      currentScore: aggregated.currentScore,
      confidenceLevel: aggregated.confidenceLevel,
      confidence: aggregated.confidenceLevel.toLowerCase(),
      resumeEvidence: aggregated.breakdown.resume,
      practiceScore: aggregated.breakdown.practice,
      assessmentScore: aggregated.breakdown.assessment,
      missionCompletion: aggregated.breakdown.mission,
      projectEvidence: aggregated.breakdown.project,
      conceptScores: existingUserSkill?.conceptScores || "{}",
    },
  });
}

/**
 * Returns a structured, deterministic explanation for any skill score.
 */
export async function getSkillExplanation(
  userId: string,
  skillName: string,
  targetScore: number = MASTERY_THRESHOLD
): Promise<SkillScoreExplanation> {
  const rawEvidences = await getSkillEvidences(userId, skillName);
  const aggregated = aggregateEvidence(rawEvidences);

  const gapPoints = Math.max(0, targetScore - aggregated.currentScore);
  const isMastered = aggregated.currentScore >= targetScore && (aggregated.confidenceLevel === "HIGH" || aggregated.confidenceLevel === "MEDIUM");

  let masteryStatus: "CRITICAL_GAP" | "HIGH_PRIORITY" | "DEVELOPING" | "MASTERED" = "DEVELOPING";
  if (isMastered) {
    masteryStatus = "MASTERED";
  } else if (gapPoints >= 35) {
    masteryStatus = "CRITICAL_GAP";
  } else if (gapPoints >= 20) {
    masteryStatus = "HIGH_PRIORITY";
  } else {
    masteryStatus = "DEVELOPING";
  }

  let mainGap = "All core foundations verified to target.";
  let mainReason = "Empirical evidence across labs and assessments satisfies the mastery threshold.";
  let recommendedAction = "Maintain mastery through periodic mock practice and timed challenges.";

  if (gapPoints > 0) {
    if (aggregated.breakdown.assessment === null || aggregated.breakdown.assessment === 0) {
      mainGap = `Untested in technical assessment (-${gapPoints} points below target).`;
      mainReason = "No verified assessment evidence recorded yet.";
      recommendedAction = `Take the Day assessment to measure your baseline in ${skillName}.`;
    } else if (aggregated.breakdown.assessment < targetScore) {
      mainGap = `Assessment score (${aggregated.breakdown.assessment}%) is below the ${targetScore}% mastery threshold.`;
      mainReason = "Recent test evaluations show conceptual gaps under interview conditions.";
      recommendedAction = `Review diagnosed weak concepts and complete targeted practice in ${skillName}.`;
    } else if (aggregated.breakdown.practice !== null && aggregated.breakdown.practice < targetScore) {
      mainGap = `Practice lab completion (${aggregated.breakdown.practice}%) requires more problem-solving reps.`;
      mainReason = "More hands-on code implementations needed to solidify muscle memory.";
      recommendedAction = `Solve the remaining 3 practice problems for ${skillName} in the IDE sandbox.`;
    }
  }

  // Calculate contribution points per source
  const totalDenom = Object.entries(aggregated.breakdown).reduce((acc, [k, v]) => {
    return v !== null ? acc + EVIDENCE_BASE_WEIGHTS[k.toUpperCase() as EvidenceType] : acc;
  }, 0) || 1;

  const getSourceContrib = (type: EvidenceType, score: number | null) => {
    if (score === null) return { score: null, weightPct: 0, contribution: 0 };
    const normWeight = EVIDENCE_BASE_WEIGHTS[type] / totalDenom;
    return {
      score,
      weightPct: Math.round(normWeight * 100),
      contribution: Math.round(score * normWeight),
    };
  };

  const resumeInfo = getSourceContrib("RESUME", aggregated.breakdown.resume);
  const practiceInfo = getSourceContrib("PRACTICE", aggregated.breakdown.practice);
  const assessmentInfo = getSourceContrib("ASSESSMENT", aggregated.breakdown.assessment);
  const missionInfo = getSourceContrib("MISSION", aggregated.breakdown.mission);
  const projectInfo = getSourceContrib("PROJECT", aggregated.breakdown.project);

  return {
    skillName,
    currentScore: aggregated.currentScore,
    targetScore,
    gapPoints,
    confidenceLevel: aggregated.confidenceLevel,
    confidenceReason: aggregated.confidenceReason,
    evidenceBreakdown: {
      resume: { ...resumeInfo, status: resumeInfo.score ? "VERIFIED_ON_RESUME" : "NOT_SPECIFIED" },
      practice: { ...practiceInfo, solvedCount: aggregated.verifiedCounts.practiceProblems },
      assessment: { ...assessmentInfo, attemptCount: aggregated.verifiedCounts.assessments },
      mission: missionInfo,
      project: projectInfo,
    },
    trend: aggregated.trend,
    trendDirection: aggregated.trendDirection,
    mainGap,
    mainReason,
    recommendedAction,
    masteryStatus,
    verifiedCounts: aggregated.verifiedCounts,
  };
}
