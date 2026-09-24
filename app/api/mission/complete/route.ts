import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateReadiness } from "@/lib/ai/readiness";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { dayNumber, weekNumber } = body;

    if (!dayNumber || !weekNumber) {
      return NextResponse.json({ error: "dayNumber and weekNumber are required." }, { status: 400 });
    }

    // Mark mission complete
    await prisma.dailyMission.updateMany({
      where: { userId, dayNumber, weekNumber },
      data: { completed: true, score: body.score || 0 },
    });

    // Update roadmap day result
    const roadmap = await prisma.roadmap.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    if (roadmap) {
      let dayResults: Record<string, any> = {};
      try { dayResults = roadmap.dayResults ? JSON.parse(roadmap.dayResults) : {}; } catch {}

      const key = `week-${weekNumber}_day${dayNumber}`;
      dayResults[key] = {
        dayId: key,
        dayNumber,
        score: body.score || 100,
        passed: (body.score || 100) >= 70,
        answers: body.answers || {},
        completedAt: new Date().toISOString(),
      };

      await prisma.roadmap.update({
        where: { id: roadmap.id },
        data: { dayResults: JSON.stringify(dayResults) },
      });
    }

    // Recalculate progress
    const allMissions = await prisma.dailyMission.findMany({
      where: { userId, completed: true },
    });

    const roadmapForProgress = await prisma.roadmap.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    let totalDays = 30;
    if (roadmapForProgress) {
      try {
        const weeks = JSON.parse(roadmapForProgress.weeksData || "[]");
        totalDays = weeks.reduce((acc: number, w: any) => acc + (w.totalDays || 5), 0);
      } catch {}
    }

    const completedDays = allMissions.length;

    const assessmentScores: Record<string, number> = {};
    const assessments = await prisma.assessment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    assessments.forEach((a) => {
      if (a.skillScores) {
        try {
          const scores = JSON.parse(a.skillScores) as Array<{ skill: string; score: number }>;
          scores.forEach((s) => { assessmentScores[s.skill] = s.score; });
        } catch {}
      }
    });

    const skillGaps = await prisma.skillGap.findMany({ where: { userId } });
    const gaps = skillGaps.map((g) => ({
      skill: "",
      currentLevel: "Beginner",
      targetLevel: "Proficient",
      priority: (g.severity?.toUpperCase() || "MEDIUM") as "HIGH" | "MEDIUM" | "LOW",
      reason: "",
    }));

    const readiness = calculateReadiness(gaps, completedDays, totalDays, assessmentScores);

    // Update progress in DB
    const existingProgress = await prisma.progress.findFirst({ where: { userId } });
    const progressData = {
      completedDays,
      totalDays,
      overallProgress: readiness.overallScore,
    };

    if (existingProgress) {
      await prisma.progress.update({ where: { id: existingProgress.id }, data: progressData });
    } else {
      await prisma.progress.create({ data: { userId, weekId: `current`, ...progressData } });
    }

    return NextResponse.json({ success: true, readiness, completedDays, totalDays });
  } catch (error) {
    console.error("Mission complete error:", error);
    return NextResponse.json({ error: "Failed to complete mission." }, { status: 500 });
  }
}
