import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CareerAnalysis, SkillMatch, CombinedSkillEvaluation, RoadmapData, TodayMissionItem } from "@/types";
import { computeUserReadinessFromDatabase } from "@/lib/skills/readiness-engine";
import { getAdaptiveTodayMission } from "@/lib/skills/priority-engine";
import { getRoleRequirement } from "@/lib/skills/role-requirements";
import { calculateSkillScore } from "@/lib/skills/scoring-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user profile data
    const [profile, resume, userSkills, roadmap, quizAssessment] =
      await Promise.all([
        prisma.careerProfile.findFirst({
          where: { userId },
          orderBy: { updatedAt: "desc" },
        }),
        prisma.resume.findFirst({
          where: { userId },
          orderBy: { updatedAt: "desc" },
        }),
        prisma.userSkill.findMany({
          where: { userId },
          include: { skill: true },
        }),
        prisma.roadmap.findFirst({
          where: { userId },
          orderBy: { updatedAt: "desc" },
        }),
        prisma.assessment.findFirst({
          where: { userId, type: "ONBOARDING_QUIZ" },
          orderBy: { createdAt: "desc" },
        }),
      ]);

    if (!profile && !resume) {
      return NextResponse.json({
        success: true,
        analysis: null,
      });
    }

    const skills: SkillMatch[] = userSkills.map((us) => ({
      skill: us.skill.name,
      found: us.found,
      confidence: (us.confidence as "strong" | "weak" | "none") || "none",
      evidence: us.evidence || "",
    }));

    const combinedSkills: CombinedSkillEvaluation[] = userSkills
      .filter((us) => us.category)
      .map((us) => ({
        skill: us.skill.name,
        resumeConfidence:
          (us.confidence as "strong" | "weak" | "none") || "none",
        quizConfidence:
          (us.quizConfidence as "strong" | "weak" | "none") || "none",
        quizScore: us.quizScore ?? undefined,
        category: us.category as any,
        label: us.category?.replace(/_/g, " ").toUpperCase() || "",
        description: "",
      }));

    let parsedRoadmapData: RoadmapData | undefined = undefined;
    if (roadmap?.weeksData) {
      try {
        parsedRoadmapData = {
          weeks: JSON.parse(roadmap.weeksData || "[]"),
          daysData: roadmap.daysData ? JSON.parse(roadmap.daysData) : {},
          dayResults: roadmap.dayResults ? JSON.parse(roadmap.dayResults) : {},
        };
      } catch (err) {
        console.error("Failed to parse roadmapData from db:", err);
      }
    }

    // Synthesize student skill profile and today's mission using the profile engine
    const { buildStudentSkillProfile } = await import("@/lib/skills/profile-engine");
    const { generateTodaysMission } = await import("@/lib/skills/mission-engine");

    const quizScores = quizAssessment?.skillScores
      ? JSON.parse(quizAssessment.skillScores)
      : [];

    const quizResultObj = quizAssessment
      ? {
          overallScore: quizAssessment.overallScore,
          totalQuestions: quizAssessment.totalQuestions,
          correctCount: quizAssessment.correctCount,
          answers: quizAssessment.answers
            ? JSON.parse(quizAssessment.answers)
            : {},
          skillScores: quizScores,
        }
      : undefined;

    const targetRole = profile?.targetRole || "Software Engineer";
    const studentSkillProfile = buildStudentSkillProfile({
      targetRole,
      resumeText: resume?.content || "",
      quizResult: quizResultObj,
    });

    // Check if user already has an active daily mission in DB or generate one
    const dbMission = await prisma.dailyMission.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    let todayMission: TodayMissionItem | null = generateTodaysMission({
      profile: studentSkillProfile,
      targetRole,
      weeks: parsedRoadmapData?.weeks || [],
    });

    if (dbMission && dbMission.details) {
      try {
        const parsed = JSON.parse(dbMission.details) as TodayMissionItem;
        parsed.completed = dbMission.completed;
        parsed.score = dbMission.score ?? undefined;
        todayMission = parsed;
      } catch (e) {
        console.warn("Could not parse saved mission details:", e);
      }
    }

    // Compute empirical readiness and adaptive mission from database
    let readinessScores: any = {
      resumeFit: profile?.alignmentScore || 65,
      skillReadiness: profile?.combinedAlignmentScore || 40,
      careerReadiness: Math.round(((profile?.alignmentScore || 65) * 0.35) + ((profile?.combinedAlignmentScore || 40) * 0.65)),
      explanations: undefined,
    };

    try {
      readinessScores = await computeUserReadinessFromDatabase(userId, targetRole);
    } catch (err) {
      console.warn("Could not compute empirical readiness from DB:", err);
    }

    try {
      const completedDaysCount = parsedRoadmapData?.dayResults
        ? Object.values(parsedRoadmapData.dayResults).filter((r: any) => r.passed).length
        : 0;
      const adaptiveMissionRec = await getAdaptiveTodayMission(userId, targetRole, completedDaysCount);
      if (todayMission) {
        todayMission.title = adaptiveMissionRec.title;
        todayMission.focusSkill = adaptiveMissionRec.skillName;
        todayMission.reason = adaptiveMissionRec.reason;
      }
    } catch (err) {
      console.warn("Could not compute adaptive today mission:", err);
    }

    const analysis: CareerAnalysis = {
      targetRole,
      skills,
      strengths: profile?.strengths ? JSON.parse(profile.strengths) : [],
      weaknesses: profile?.weaknesses ? JSON.parse(profile.weaknesses) : [],
      alignmentScore: readinessScores.resumeFit,
      combinedAlignmentScore: readinessScores.careerReadiness,
      resumeFitScore: readinessScores.resumeFit,
      skillReadinessScore: readinessScores.skillReadiness,
      careerReadinessScore: readinessScores.careerReadiness,
      summary: profile?.summary || "",
      fileName: resume?.fileName,
      characters: resume?.characters ?? undefined,
      resumeText: resume?.content ?? undefined,
      combinedSkills: combinedSkills.length > 0 ? combinedSkills : undefined,
      quizResult: quizResultObj,
      studentSkillProfile,
      todayMission,
      questionnaireAnswers: profile?.questionnaireAnswers
        ? JSON.parse(profile.questionnaireAnswers)
        : undefined,
      agentPlanSummary: profile?.agentPlanSummary
        ? JSON.parse(profile.agentPlanSummary)
        : undefined,
      roadmap: [],
      roadmapData: parsedRoadmapData,
    };

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve profile" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const data: Partial<CareerAnalysis> = body.analysis || body;

    // 1. Upsert Resume
    if (data.resumeText || data.fileName) {
      const existingResume = await prisma.resume.findFirst({
        where: { userId },
      });

      if (existingResume) {
        await prisma.resume.update({
          where: { id: existingResume.id },
          data: {
            fileName: data.fileName || existingResume.fileName,
            characters: data.characters ?? existingResume.characters,
            content: data.resumeText || existingResume.content,
          },
        });
      } else {
        await prisma.resume.create({
          data: {
            userId,
            fileName: data.fileName || "resume.pdf",
            characters: data.characters ?? 0,
            content: data.resumeText || "",
          },
        });
      }
    }

    // 2. Upsert CareerProfile
    const existingProfile = await prisma.careerProfile.findFirst({
      where: { userId },
    });

    const profileData = {
      targetRole: data.targetRole || existingProfile?.targetRole || "Software Engineer",
      alignmentScore: data.alignmentScore !== undefined ? data.alignmentScore : existingProfile?.alignmentScore,
      combinedAlignmentScore: data.combinedAlignmentScore !== undefined ? data.combinedAlignmentScore : existingProfile?.combinedAlignmentScore,
      summary: data.summary !== undefined ? data.summary : existingProfile?.summary,
      strengths: data.strengths ? JSON.stringify(data.strengths) : existingProfile?.strengths,
      weaknesses: data.weaknesses ? JSON.stringify(data.weaknesses) : existingProfile?.weaknesses,
      questionnaireAnswers: data.questionnaireAnswers ? JSON.stringify(data.questionnaireAnswers) : existingProfile?.questionnaireAnswers,
      agentPlanSummary: data.agentPlanSummary ? JSON.stringify(data.agentPlanSummary) : existingProfile?.agentPlanSummary,
    };

    if (existingProfile) {
      await prisma.careerProfile.update({
        where: { id: existingProfile.id },
        data: profileData,
      });
    } else {
      await prisma.careerProfile.create({
        data: {
          userId,
          ...profileData,
        },
      });
    }

    // 3. Upsert Skills & UserSkills
    if (data.skills && Array.isArray(data.skills)) {
      for (const item of data.skills) {
        if (!item.skill) continue;

        const skillRecord = await prisma.skill.upsert({
          where: { name: item.skill },
          update: {},
          create: {
            name: item.skill,
          },
        });

        const combinedMatch = (data.combinedSkills || []).find(
          (cs) => cs.skill.toLowerCase() === item.skill.toLowerCase()
        );

        const resumeScoreVal = item.confidence === "strong" ? 85 : item.confidence === "weak" ? 55 : 20;
        const computedScore = calculateSkillScore({ resumeEvidence: resumeScoreVal });

        await prisma.userSkill.upsert({
          where: {
            userId_skillId: {
              userId,
              skillId: skillRecord.id,
            },
          },
          update: {
            confidence: item.confidence || "none",
            found: item.found ?? false,
            evidence: item.evidence || "",
            category: combinedMatch?.category || undefined,
            quizConfidence: combinedMatch?.quizConfidence || undefined,
            quizScore: combinedMatch?.quizScore ?? undefined,
            resumeEvidence: resumeScoreVal,
            currentScore: computedScore.currentScore,
            confidenceLevel: computedScore.confidenceLevel,
          },
          create: {
            userId,
            skillId: skillRecord.id,
            confidence: item.confidence || "none",
            found: item.found ?? false,
            evidence: item.evidence || "",
            category: combinedMatch?.category || undefined,
            quizConfidence: combinedMatch?.quizConfidence || undefined,
            quizScore: combinedMatch?.quizScore ?? undefined,
            resumeEvidence: resumeScoreVal,
            currentScore: computedScore.currentScore,
            confidenceLevel: computedScore.confidenceLevel,
          },
        });
      }
    }

    // 4. Upsert Roadmap
    if (data.roadmapData) {
      const existingRoadmap = await prisma.roadmap.findFirst({
        where: { userId },
      });

      const weeksDataStr = JSON.stringify(data.roadmapData.weeks || []);
      const daysDataStr = JSON.stringify(data.roadmapData.daysData || {});
      const dayResultsStr = JSON.stringify(data.roadmapData.dayResults || {});

      if (existingRoadmap) {
        await prisma.roadmap.update({
          where: { id: existingRoadmap.id },
          data: {
            targetRole: data.targetRole || existingRoadmap.targetRole,
            weeksData: weeksDataStr,
            daysData: daysDataStr,
            dayResults: dayResultsStr,
            strategyTitle: data.agentPlanSummary?.strategyTitle || existingRoadmap.strategyTitle,
            timelineWeeks: data.agentPlanSummary?.timelineWeeks || existingRoadmap.timelineWeeks,
            weeklyHours: data.agentPlanSummary?.weeklyHours || existingRoadmap.weeklyHours,
            pace: data.agentPlanSummary?.pace || existingRoadmap.pace,
            strategicAdvice: data.agentPlanSummary?.strategicAdvice || existingRoadmap.strategicAdvice,
          },
        });
      } else {
        await prisma.roadmap.create({
          data: {
            userId,
            targetRole: data.targetRole || "Software Engineer",
            weeksData: weeksDataStr,
            daysData: daysDataStr,
            dayResults: dayResultsStr,
            strategyTitle: data.agentPlanSummary?.strategyTitle,
            timelineWeeks: data.agentPlanSummary?.timelineWeeks || 8,
            weeklyHours: data.agentPlanSummary?.weeklyHours || 18,
            pace: data.agentPlanSummary?.pace,
            strategicAdvice: data.agentPlanSummary?.strategicAdvice,
          },
        });
      }
    }

    // 5. Create / Update Assessment
    if (data.quizResult) {
      const existingQuiz = await prisma.assessment.findFirst({
        where: { userId, type: "ONBOARDING_QUIZ" },
      });

      const assessmentData = {
        userId,
        type: "ONBOARDING_QUIZ",
        overallScore: data.quizResult.overallScore,
        totalQuestions: data.quizResult.totalQuestions,
        correctCount: data.quizResult.correctCount,
        passed: data.quizResult.overallScore >= 70,
        answers: JSON.stringify(data.quizResult.answers || {}),
        skillScores: JSON.stringify(data.quizResult.skillScores || []),
      };

      if (existingQuiz) {
        await prisma.assessment.update({
          where: { id: existingQuiz.id },
          data: assessmentData,
        });
      } else {
        await prisma.assessment.create({
          data: assessmentData,
        });
      }
    }

    // 6. Mark onboarding completed for the user
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });

    return NextResponse.json({
      success: true,
      message: "Profile and roadmap successfully persisted to database",
    });
  } catch (error) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json(
      { error: "Failed to persist profile to database" },
      { status: 500 }
    );
  }
}
