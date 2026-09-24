import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateReadiness } from "@/lib/ai/readiness";
import { classifySkills, getSkillsByLevel } from "@/lib/skills/classify";
import { computeUserReadinessFromDatabase } from "@/lib/skills/readiness-engine";
import { calculatePriorityGaps, getAdaptiveTodayMission, getHighestImpactAction } from "@/lib/skills/priority-engine";
import { getRoleRequirement } from "@/lib/skills/role-requirements";
import { getSkillExplanation, ScoreExplanation } from "@/lib/skills/evidence-store";
import { MASTERY_THRESHOLD } from "@/lib/skills/constants";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const [profile, roadmap, userSkills, assessments, missions, progress, activeOpportunity] = await Promise.all([
      prisma.careerProfile.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } }),
      prisma.roadmap.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } }),
      prisma.userSkill.findMany({ where: { userId }, include: { skill: true } }),
      prisma.assessment.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.dailyMission.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.progress.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } }),
      prisma.jobOpportunity.findFirst({ where: { userId, isActive: true }, orderBy: { updatedAt: "desc" } }),
    ]);

    // Parse roadmap data
    let weeks: any[] = [];
    let daysData: Record<string, any> = {};
    let dayResults: Record<string, any> = {};
    if (roadmap) {
      try { weeks = JSON.parse(roadmap.weeksData || "[]"); } catch {}
      try { daysData = roadmap.daysData ? JSON.parse(roadmap.daysData) : {}; } catch {}
      try { dayResults = roadmap.dayResults ? JSON.parse(roadmap.dayResults) : {}; } catch {}
    }

    // Skill gaps
    const skillGaps = await prisma.skillGap.findMany({ where: { userId }, include: { skill: true } });

    // Assessment scores
    const assessmentScores: Record<string, number> = {};
    assessments.forEach((a) => {
      if (a.skillScores) {
        try {
          const scores = JSON.parse(a.skillScores) as Array<{ skill: string; score: number }>;
          scores.forEach((s) => { assessmentScores[s.skill] = s.score; });
        } catch {}
      }
    });

    // Calculate readiness
    const completedDays = missions.filter((m) => m.completed).length;
    let totalDays = 30;
    if (weeks.length > 0) {
      totalDays = weeks.reduce((acc: number, w: any) => acc + (w.totalDays || 5), 0);
    }

    const gaps = skillGaps.map((g) => ({
      skill: g.skill.name,
      currentLevel: "Beginner",
      targetLevel: "Proficient",
      priority: (g.severity?.toUpperCase() || "MEDIUM") as "HIGH" | "MEDIUM" | "LOW",
      reason: `Gap for ${profile?.targetRole || "target role"}`,
    }));

    const readiness = calculateReadiness(gaps, completedDays, totalDays, assessmentScores);

    // Compute empirical readiness and priority gaps
    const targetRole = profile?.targetRole || "Software Engineer";
    let dbReadinessScores = null;
    let priorityGaps: any[] = [];
    let adaptiveMission = null;
    let highestImpactAction = null;

    try {
      dbReadinessScores = await computeUserReadinessFromDatabase(userId, targetRole);
      priorityGaps = await calculatePriorityGaps(userId, targetRole);
      adaptiveMission = await getAdaptiveTodayMission(userId, targetRole, completedDays);
      highestImpactAction = await getHighestImpactAction(userId, targetRole);
    } catch (e) {
      console.warn("Could not compute empirical dashboard metrics:", e);
    }

    // Skill classification
    const resumeSkillNames = userSkills.filter((us) => us.found).map((us) => us.skill.name);
    const classified = classifySkills(resumeSkillNames, assessmentScores);
    const skillsByLevel = getSkillsByLevel(classified);

    // Find today's mission
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMission = await prisma.dailyMission.findFirst({
      where: { userId, createdAt: { gte: today } },
      orderBy: { createdAt: "desc" },
    });

    // Find next day
    let nextDay = null;
    for (const week of weeks) {
      for (let d = 1; d <= (week.totalDays || 5); d++) {
        const key = `${week.id}_day${d}`;
        if (!dayResults[key]) {
          nextDay = { weekId: week.id, dayNumber: d, weekTitle: week.title, focusSkills: week.focusSkills };
          break;
        }
      }
      if (nextDay) break;
    }

    const isFirstTimeUser = completedDays === 0 && assessments.length === 0;

    // Build score explanations and historical trends for role skills
    const roleReq = getRoleRequirement(targetRole);
    const scoreExplanations: Record<string, ScoreExplanation> = {};
    for (const skillName of roleReq.requiredSkills) {
      scoreExplanations[skillName] = await getSkillExplanation(userId, skillName);
    }

    // Historical trends from raw evidence
    let rawEvidences: any[] = [];
    try {
      rawEvidences = await (prisma as any).skillEvidence.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
    } catch {}

    const skillTrends: Record<string, number[]> = {};
    for (const ev of rawEvidences) {
      if (!skillTrends[ev.skillName]) {
        skillTrends[ev.skillName] = [];
      }
      skillTrends[ev.skillName].push(Math.round(ev.score));
    }

    // Generate 5-step Adaptive Story
    const primaryGap = priorityGaps[0];
    const topAction = highestImpactAction;
    const adaptiveStory = [
      {
        step: 1,
        title: "Weakness Diagnosed",
        description: primaryGap
          ? `Concept gap identified in "${primaryGap.skillName}" (${Math.round(primaryGap.score)}% current score vs 80% benchmark).`
          : "System initial baseline established from role requirements.",
        status: "COMPLETED",
      },
      {
        step: 2,
        title: "Adaptive Mission Generated",
        description: adaptiveMission
          ? `High-yield mission dispatched: "${adaptiveMission.title}" targeting ${adaptiveMission.skillName}.`
          : "Roadmap personalized to eliminate critical skill gaps.",
        status: completedDays > 0 ? "COMPLETED" : "IN_PROGRESS",
      },
      {
        step: 3,
        title: "Targeted Remediation Completed",
        description: topAction?.isRemediation
          ? `Interactive practice challenges and code sandbox completed for weak concepts.`
          : `Targeted sandbox and practice active for ${targetRole}.`,
        status: completedDays > 0 ? "COMPLETED" : "UPCOMING",
      },
      {
        step: 4,
        title: "Evidence Validated",
        description: assessments.length > 0
          ? `Evidence verified across ${assessments.length} assessment submissions with recency weighting.`
          : "Awaiting primary assessment submission to verify mastery.",
        status: assessments.length > 0 ? "COMPLETED" : "UPCOMING",
      },
      {
        step: 5,
        title: "System Re-Prioritized",
        description: primaryGap?.momentum === "IMPROVING"
          ? `Skill momentum accelerating (${primaryGap.skillName}). Re-prioritizing remaining target competencies.`
          : "Priority queue dynamically reorders based on verified learning speed and gap severity.",
        status: completedDays >= 2 ? "COMPLETED" : "UPCOMING",
      },
    ];

    // Progress since last session (last 48 hours or latest assessment)
    const recentAssessments = assessments.filter(
      (a) => new Date().getTime() - new Date(a.createdAt).getTime() <= 48 * 60 * 60 * 1000
    );
    const progressSinceLastSession = {
      assessmentsCompletedRecently: recentAssessments.length,
      averageRecentScore: recentAssessments.length > 0
        ? Math.round(recentAssessments.reduce((sum, a) => sum + a.overallScore, 0) / recentAssessments.length)
        : null,
      skillsEvaluated: Array.from(new Set(rawEvidences.map((e: any) => e.skillName))),
      lastActiveAt: assessments[0]?.createdAt || missions[0]?.createdAt || null,
    };

    const prepProgress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    return NextResponse.json({
      success: true,
      dashboard: {
        targetRole,
        isFirstTimeUser,
        readiness,
        readinessScores: dbReadinessScores,
        skillGaps: gaps,
        priorityGaps,
        highestImpactAction,
        adaptiveMission,
        scoreExplanations,
        skillTrends,
        adaptiveStory,
        progressSinceLastSession,
        todayMission: todayMission?.details ? JSON.parse(todayMission.details) : (adaptiveMission ? {
          title: adaptiveMission.title,
          focusSkill: adaptiveMission.skillName,
          reason: adaptiveMission.reason,
          estimatedMinutes: 45,
          learningMinutes: 15,
          practiceProblems: 3,
          assessmentQuestions: 5,
          completed: false,
        } : null),
        nextDay,
        activeOpportunity: activeOpportunity
          ? {
              id: activeOpportunity.id,
              companyName: activeOpportunity.companyName,
              jobTitle: activeOpportunity.jobTitle,
              fitScore: activeOpportunity.fitScore,
              preparationProgress: prepProgress,
              applicationRecommendation: activeOpportunity.applicationRecommendation,
              criticalGaps: activeOpportunity.criticalGaps ? JSON.parse(activeOpportunity.criticalGaps) : [],
            }
          : null,
        roadmap: {
          weeks,
          completedDays,
          totalDays,
          strategyTitle: roadmap?.strategyTitle,
          strategicAdvice: roadmap?.strategicAdvice,
        },
        skills: userSkills.map((us) => ({
          name: us.skill.name,
          confidence: us.confidence,
          found: us.found,
          category: us.category,
          quizScore: us.quizScore,
          currentScore: us.currentScore,
          confidenceLevel: us.confidenceLevel,
          masteryStatus: (us.currentScore ?? 0) >= MASTERY_THRESHOLD ? "MASTERED" : (us.currentScore ?? 0) > 0 ? "IN_PROGRESS" : "NO_EVIDENCE",
        })),
        classifiedSkills: classified,
        skillsByLevel,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to load dashboard." }, { status: 500 });
  }
}
