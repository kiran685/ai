import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDailyMission } from "@/lib/ai/daily-mission";
import { RoadmapDay } from "@/lib/ai/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const roadmap = await prisma.roadmap.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    if (!roadmap) {
      return NextResponse.json({ error: "No roadmap found. Complete onboarding first." }, { status: 404 });
    }

    let weeks: Array<{ id: string; weekNumber: number; title: string; focusSkills: string[]; totalDays: number }> = [];
    try {
      weeks = JSON.parse(roadmap.weeksData || "[]");
    } catch { return NextResponse.json({ error: "Invalid roadmap data." }, { status: 500 }); }

    let daysData: Record<string, any> = {};
    try { daysData = roadmap.daysData ? JSON.parse(roadmap.daysData) : {}; } catch {}

    let dayResults: Record<string, any> = {};
    try { dayResults = roadmap.dayResults ? JSON.parse(roadmap.dayResults) : {}; } catch {}

    // Find the next incomplete day
    let nextDay: { weekId: string; dayNumber: number; weekTitle: string; focusSkills: string[] } | null = null;
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

    if (!nextDay) {
      return NextResponse.json({ message: "Congratulations! All days completed!", completed: true });
    }

    // Check for existing mission today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingMission = await prisma.dailyMission.findFirst({
      where: {
        userId,
        dayNumber: nextDay.dayNumber,
        weekNumber: parseInt(nextDay.weekId.replace("week-", "")),
        createdAt: { gte: today },
      },
    });

    if (existingMission && existingMission.completed) {
      return NextResponse.json({
        mission: existingMission.details ? JSON.parse(existingMission.details) : null,
        roadmapDay: nextDay,
        completed: true,
      });
    }

    // Get weak areas from recent assessments
    const recentAssessments = await prisma.assessment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    const weakAreas: string[] = [];
    recentAssessments.forEach((a) => {
      if (a.skillScores) {
        try {
          const scores = JSON.parse(a.skillScores) as Array<{ skill: string; score: number }>;
          scores.filter((s) => s.score < 50).forEach((s) => weakAreas.push(s.skill));
        } catch {}
      }
    });

    // Generate daily mission via AI service
    const roadmapDay: RoadmapDay = {
      dayNumber: nextDay.dayNumber,
      goal: nextDay.focusSkills[0] || "Continue learning",
      tasks: [`Study ${nextDay.focusSkills.join(", ")}`, "Complete exercises", "Take assessment"],
      skillFocus: nextDay.focusSkills[0] || "General",
      estimatedTime: 90,
      completionCriteria: "Complete all tasks and pass assessment",
    };

    const mission = await generateDailyMission({
      roadmapDay,
      completedDaysCount: Object.keys(dayResults).length,
      weakAreas: [...new Set(weakAreas)],
    });

    // Store mission
    await prisma.dailyMission.upsert({
      where: {
        id: existingMission?.id || "nonexistent",
      },
      update: { details: JSON.stringify(mission) },
      create: {
        userId,
        dayNumber: nextDay.dayNumber,
        weekNumber: parseInt(nextDay.weekId.replace("week-", "")),
        title: mission.title,
        description: `Day ${mission.dayNumber}: ${mission.title}`,
        details: JSON.stringify(mission),
      },
    });

    return NextResponse.json({ mission, roadmapDay: nextDay });
  } catch (error) {
    console.error("Mission today error:", error);
    return NextResponse.json({ error: "Failed to load today's mission." }, { status: 500 });
  }
}
