import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { identifySkillGaps } from "@/lib/ai/skill-gaps";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { targetRole } = body;

    // Fetch user's resume analysis and quiz results from DB
    const [resumeAnalysis, assessment, userSkills] = await Promise.all([
      prisma.resumeAnalysis.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.assessment.findFirst({
        where: { userId, type: "ONBOARDING_QUIZ" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.userSkill.findMany({
        where: { userId },
        include: { skill: true },
      }),
    ]);

    const role = targetRole || resumeAnalysis?.targetRole || "Software Engineer";

    const assessmentScores: Record<string, number> = {};
    if (assessment?.skillScores) {
      try {
        const scores = JSON.parse(assessment.skillScores) as Array<{ skill: string; score: number }>;
        scores.forEach((s) => { assessmentScores[s.skill] = s.score; });
      } catch {}
    }

    userSkills.forEach((us) => {
      if (us.quizScore != null && us.skill.name) {
        assessmentScores[us.skill.name] = us.quizScore;
      }
    });

    const resumeData = resumeAnalysis
      ? {
          technicalSkills: resumeAnalysis.rawAnalysis
            ? (() => { try { return JSON.parse(resumeAnalysis.rawAnalysis).technicalSkills || []; } catch { return []; } })()
            : [],
          strengths: resumeAnalysis.strengths ? JSON.parse(resumeAnalysis.strengths) : [],
          weaknesses: resumeAnalysis.weaknesses ? JSON.parse(resumeAnalysis.weaknesses) : [],
          missingSkills: [],
        }
      : { technicalSkills: [], strengths: [], weaknesses: [], missingSkills: [] };

    const gaps = await identifySkillGaps({
      targetRole: role,
      resumeAnalysis: resumeData,
      assessmentScores,
    });

    // Store gaps in DB
    for (const gap of gaps) {
      const skillRecord = await prisma.skill.upsert({
        where: { name: gap.skill },
        update: {},
        create: { name: gap.skill },
      });

      const existingGap = await prisma.skillGap.findFirst({
        where: { userId, skillId: skillRecord.id },
      });

      if (existingGap) {
        await prisma.skillGap.update({
          where: { id: existingGap.id },
          data: {
            category: gap.priority === "HIGH" ? "true_gap" : "needs_work",
            targetRole: role,
            severity: gap.priority.toLowerCase(),
          },
        });
      } else {
        await prisma.skillGap.create({
          data: {
            userId,
            skillId: skillRecord.id,
            category: gap.priority === "HIGH" ? "true_gap" : "needs_work",
            targetRole: role,
            severity: gap.priority.toLowerCase(),
          },
        });
      }
    }

    return NextResponse.json({ success: true, gaps });
  } catch (error) {
    console.error("Skill gap analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze skill gaps." }, { status: 500 });
  }
}
