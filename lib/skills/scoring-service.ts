import { prisma } from "@/lib/prisma";
import { getRoleRequirement } from "@/lib/skills/role-requirements";
import { getSkillDefinition } from "@/lib/skills/skill-catalog";
import { MASTERY_THRESHOLD } from "@/lib/skills/constants";

export interface SkillEvidenceInput {
  resumeEvidence?: number | null;
  practiceScore?: number | null;
  assessmentScore?: number | null;
  missionCompletion?: number | null;
  projectEvidence?: number | null;
}

export interface SkillScoreResult {
  currentScore: number;
  confidenceLevel: "LOW" | "MEDIUM" | "HIGH";
  weightsUsed: Record<string, number>;
  breakdown: {
    resume: number | null;
    practice: number | null;
    assessment: number | null;
    mission: number | null;
    project: number | null;
  };
}

export interface ConceptEvaluation {
  conceptId: string;
  passed: boolean;
  score: number; // 0-100
  correct?: number;
  total?: number;
}

/**
 * Standard baseline weights for evidence sources
 */
const BASE_WEIGHTS = {
  resume: 0.10,      // 10%
  practice: 0.25,    // 25%
  assessment: 0.40,  // 40%
  mission: 0.15,     // 15%
  project: 0.10,     // 10%
};

/**
 * Calculates current skill score with evidence-based normalization.
 * Clamps result between 0 and 100.
 * Derives confidence level (LOW, MEDIUM, HIGH) based on breadth of empirical evidence.
 */
export function calculateSkillScore(evidence: SkillEvidenceInput): SkillScoreResult {
  const values: Record<string, number | null> = {
    resume: evidence.resumeEvidence ?? null,
    practice: evidence.practiceScore ?? null,
    assessment: evidence.assessmentScore ?? null,
    mission: evidence.missionCompletion ?? null,
    project: evidence.projectEvidence ?? null,
  };

  // Find sources that have valid numeric evidence
  const activeSources: { key: keyof typeof BASE_WEIGHTS; weight: number; score: number }[] = [];
  for (const [key, baseWeight] of Object.entries(BASE_WEIGHTS) as [keyof typeof BASE_WEIGHTS, number][]) {
    const val = values[key];
    if (typeof val === "number" && !isNaN(val)) {
      activeSources.push({
        key,
        weight: baseWeight,
        score: Math.min(100, Math.max(0, val)),
      });
    }
  }

  // If no evidence is present at all, return default 0 and LOW confidence
  if (activeSources.length === 0) {
    return {
      currentScore: 0,
      confidenceLevel: "LOW",
      weightsUsed: {},
      breakdown: {
        resume: null,
        practice: null,
        assessment: null,
        mission: null,
        project: null,
      },
    };
  }

  // Normalize weights across active sources so they sum to 1.0
  const totalActiveWeight = activeSources.reduce((acc, s) => acc + s.weight, 0);
  const weightsUsed: Record<string, number> = {};
  let weightedScore = 0;

  for (const s of activeSources) {
    const normalizedWeight = s.weight / totalActiveWeight;
    weightsUsed[s.key] = Math.round(normalizedWeight * 100) / 100;
    weightedScore += s.score * normalizedWeight;
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(weightedScore)));

  // Derive confidence:
  // HIGH: at least 3 active sources OR (assessment score present AND practice score present)
  // MEDIUM: at least 2 active sources
  // LOW: 1 source (e.g. only resume)
  let confidenceLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  const hasAssessment = typeof values.assessment === "number";
  const hasPractice = typeof values.practice === "number";

  if (activeSources.length >= 3 || (hasAssessment && hasPractice)) {
    confidenceLevel = "HIGH";
  } else if (activeSources.length >= 2 || hasAssessment) {
    confidenceLevel = "MEDIUM";
  } else {
    confidenceLevel = "LOW";
  }

  return {
    currentScore: finalScore,
    confidenceLevel,
    weightsUsed,
    breakdown: {
      resume: values.resume,
      practice: values.practice,
      assessment: values.assessment,
      mission: values.mission,
      project: values.project,
    },
  };
}

/**
 * Upserts a UserSkill record and updates its score based on fresh evidence.
 */
export async function recordSkillEvidence(
  userId: string,
  skillName: string,
  evidenceDelta: Partial<SkillEvidenceInput> & {
    concepts?: ConceptEvaluation[];
  }
) {
  // 1. Ensure Skill exists in catalog / DB
  let skill = await prisma.skill.findUnique({
    where: { name: skillName },
  });

  const catalogDef = getSkillDefinition(skillName);

  if (!skill) {
    skill = await prisma.skill.create({
      data: {
        name: skillName,
        category: catalogDef?.category || "Technical",
        difficulty: catalogDef?.difficulty || "INTERMEDIATE",
        prerequisites: JSON.stringify(catalogDef?.prerequisites || []),
        concepts: JSON.stringify(catalogDef?.concepts || []),
      },
    });
  }

  // 2. Fetch existing UserSkill
  const existingUserSkill = await prisma.userSkill.findUnique({
    where: {
      userId_skillId: {
        userId,
        skillId: skill.id,
      },
    },
  });

  // Merge evidence
  const mergedEvidence: SkillEvidenceInput = {
    resumeEvidence: evidenceDelta.resumeEvidence !== undefined ? evidenceDelta.resumeEvidence : existingUserSkill?.resumeEvidence ?? null,
    practiceScore: evidenceDelta.practiceScore !== undefined ? evidenceDelta.practiceScore : existingUserSkill?.practiceScore ?? null,
    assessmentScore: evidenceDelta.assessmentScore !== undefined ? evidenceDelta.assessmentScore : existingUserSkill?.assessmentScore ?? null,
    missionCompletion: evidenceDelta.missionCompletion !== undefined ? evidenceDelta.missionCompletion : existingUserSkill?.missionCompletion ?? null,
    projectEvidence: evidenceDelta.projectEvidence !== undefined ? evidenceDelta.projectEvidence : existingUserSkill?.projectEvidence ?? null,
  };

  const calculated = calculateSkillScore(mergedEvidence);

  // Merge concept scores
  let conceptScoresMap: Record<string, { score: number; attempts: number; lastTested: string; correct?: number; total?: number }> = {};
  if (existingUserSkill?.conceptScores) {
    try {
      conceptScoresMap = JSON.parse(existingUserSkill.conceptScores);
    } catch {
      conceptScoresMap = {};
    }
  }

  if (evidenceDelta.concepts && evidenceDelta.concepts.length > 0) {
    for (const c of evidenceDelta.concepts) {
      const prev = conceptScoresMap[c.conceptId] || { score: 0, attempts: 0, lastTested: "", correct: 0, total: 0 };
      const newAttempts = prev.attempts + 1;
      // Exponential moving average for concept retention
      const updatedScore = prev.attempts === 0 ? c.score : Math.round(prev.score * 0.4 + c.score * 0.6);
      conceptScoresMap[c.conceptId] = {
        score: updatedScore,
        attempts: newAttempts,
        lastTested: new Date().toISOString(),
        correct: (prev.correct || 0) + (c.correct || (c.passed ? 1 : 0)),
        total: (prev.total || 0) + (c.total || 1),
      };
    }
  }

  // Upsert in database
  return await prisma.userSkill.upsert({
    where: {
      userId_skillId: {
        userId,
        skillId: skill.id,
      },
    },
    update: {
      resumeEvidence: mergedEvidence.resumeEvidence,
      practiceScore: mergedEvidence.practiceScore,
      assessmentScore: mergedEvidence.assessmentScore,
      missionCompletion: mergedEvidence.missionCompletion,
      projectEvidence: mergedEvidence.projectEvidence,
      currentScore: calculated.currentScore,
      confidenceLevel: calculated.confidenceLevel,
      conceptScores: JSON.stringify(conceptScoresMap),
    },
    create: {
      userId,
      skillId: skill.id,
      confidence: calculated.confidenceLevel.toLowerCase(),
      resumeEvidence: mergedEvidence.resumeEvidence,
      practiceScore: mergedEvidence.practiceScore,
      assessmentScore: mergedEvidence.assessmentScore,
      missionCompletion: mergedEvidence.missionCompletion,
      projectEvidence: mergedEvidence.projectEvidence,
      currentScore: calculated.currentScore,
      confidenceLevel: calculated.confidenceLevel,
      conceptScores: JSON.stringify(conceptScoresMap),
    },
  });
}

/**
 * Computes all skills for a user against the target role requirement.
 * Returns skill breakdown, gap size, target score, and weights.
 */
export async function getUserSkillsForRole(userId: string, roleName: string) {
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

  const resultSkills = roleReq.requiredSkills.map((reqSkill) => {
    const matched = skillMap.get(reqSkill.toLowerCase());
    const currentScore = matched?.currentScore ?? 0;
    const weight = roleReq.skillWeights?.[reqSkill] ?? Math.round(100 / roleReq.requiredSkills.length);
    const gap = Math.max(0, targetScore - currentScore);

    let parsedConcepts: Record<string, { score: number; attempts: number }> = {};
    if (matched?.conceptScores) {
      try {
        parsedConcepts = JSON.parse(matched.conceptScores);
      } catch {
        parsedConcepts = {};
      }
    }

    return {
      skillId: matched?.skillId || reqSkill,
      skillName: reqSkill,
      currentScore,
      targetScore,
      gap,
      weight,
      confidenceLevel: (matched?.confidenceLevel as "LOW" | "MEDIUM" | "HIGH") || "LOW",
      evidence: {
        resume: matched?.resumeEvidence ?? null,
        practice: matched?.practiceScore ?? null,
        assessment: matched?.assessmentScore ?? null,
        mission: matched?.missionCompletion ?? null,
        project: matched?.projectEvidence ?? null,
      },
      concepts: parsedConcepts,
    };
  });

  return {
    roleName: roleReq.roleName,
    minExpectedScore: targetScore,
    skills: resultSkills,
  };
}
