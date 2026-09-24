import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const progress = await prisma.progress.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    const missions = await prisma.dailyMission.findMany({
      where: { userId, completed: true },
      orderBy: { createdAt: "desc" },
    });

    const assessments = await prisma.assessment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      progress: progress || { completedDays: 0, totalDays: 30, overallProgress: 0 },
      completedMissions: missions.length,
      totalAssessments: assessments.length,
    });
  } catch (error) {
    console.error("Progress GET error:", error);
    return NextResponse.json({ error: "Failed to fetch progress." }, { status: 500 });
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
    const { completedDays, totalDays, overallProgress } = body;

    const existing = await prisma.progress.findFirst({ where: { userId } });

    if (existing) {
      await prisma.progress.update({
        where: { id: existing.id },
        data: {
          ...(completedDays != null && { completedDays }),
          ...(totalDays != null && { totalDays }),
          ...(overallProgress != null && { overallProgress }),
        },
      });
    } else {
      await prisma.progress.create({
        data: {
          userId,
          weekId: "current",
          completedDays: completedDays || 0,
          totalDays: totalDays || 30,
          overallProgress: overallProgress || 0,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Progress POST error:", error);
    return NextResponse.json({ error: "Failed to update progress." }, { status: 500 });
  }
}
