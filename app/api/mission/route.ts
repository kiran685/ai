import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTodaysMission } from "@/lib/skills/mission-engine";
import { buildStudentSkillProfile } from "@/lib/skills/profile-engine";
import { TodayMissionItem, QuizResult, RoadmapData } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Check if an active DailyMission is already saved in the DB
    const savedMission = await prisma.dailyMission.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    if (savedMission && savedMission.details) {
      try {
        const parsed = JSON.parse(savedMission.details) as TodayMissionItem;
        parsed.completed = savedMission.completed;
        parsed.score = savedMission.score ?? undefined;
        return NextResponse.json({ success: true, mission: parsed });
      } catch (e) {
        console.warn("Could not parse saved mission details:", e);
      }
    }

    // 2. Otherwise, construct it dynamically from the student's profile
    const [profile, resume, quizAssessment, roadmap] = await Promise.all([
      prisma.careerProfile.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } }),
      prisma.resume.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } }),
      prisma.assessment.findFirst({ where: { userId, type: "ONBOARDING_QUIZ" }, orderBy: { createdAt: "desc" } }),
      prisma.roadmap.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    ]);

    const targetRole = profile?.targetRole || "Software Engineer";
    const resumeText = resume?.content || "";
    let quizResult: QuizResult | null = null;

    if (quizAssessment && quizAssessment.skillScores) {
      try {
        quizResult = {
          overallScore: quizAssessment.overallScore,
          totalQuestions: quizAssessment.totalQuestions,
          correctCount: quizAssessment.correctCount,
          answers: JSON.parse(quizAssessment.answers || "{}"),
          skillScores: JSON.parse(quizAssessment.skillScores || "[]"),
        };
      } catch (err) {
        console.warn("Failed to parse assessment for mission generation:", err);
      }
    }

    const studentProfile = buildStudentSkillProfile({
      targetRole,
      resumeText,
      quizResult,
    });

    let weeksData = [];
    if (roadmap?.weeksData) {
      try {
        weeksData = JSON.parse(roadmap.weeksData);
      } catch (e) {
        // ignore
      }
    }

    const mission = generateTodaysMission({
      profile: studentProfile,
      targetRole,
      weeks: weeksData,
    });

    // Save to DailyMission in DB
    await prisma.dailyMission.create({
      data: {
        userId,
        dayNumber: mission.dayNumber || 1,
        weekNumber: 1,
        title: mission.title,
        description: mission.reason,
        completed: mission.completed,
        details: JSON.stringify(mission),
      },
    });

    return NextResponse.json({ success: true, mission });
  } catch (error) {
    console.error("GET /api/mission error:", error);
    return NextResponse.json({ error: "Failed to fetch Today's Mission" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { missionId, completed, score } = body;

    const mission = await prisma.dailyMission.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    if (mission) {
      await prisma.dailyMission.update({
        where: { id: mission.id },
        data: {
          completed: completed !== undefined ? completed : true,
          score: score !== undefined ? score : mission.score,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/mission error:", error);
    return NextResponse.json({ error: "Failed to update mission" }, { status: 500 });
  }
}
