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

    const [user, resume, profile, activeOpp] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, onboardingCompleted: true },
      }),
      prisma.resume.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, fileName: true, characters: true, content: true },
      }),
      prisma.careerProfile.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { targetRole: true, alignmentScore: true },
      }),
      prisma.jobOpportunity.findFirst({
        where: { userId, isActive: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    // An existing user has completed onboarding if user.onboardingCompleted is true
    // OR if they already have a careerProfile with targetRole and a generated roadmap
    const hasCompletedOnboarding =
      Boolean(user?.onboardingCompleted) ||
      Boolean(profile?.targetRole && profile?.alignmentScore);

    // If DB flag hasn't been updated yet but profile exists, keep flag in sync
    if (hasCompletedOnboarding && user && !user.onboardingCompleted) {
      await prisma.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true },
      }).catch((e) => console.warn("Sync onboarding flag error:", e));
    }

    return NextResponse.json({
      success: true,
      onboardingCompleted: hasCompletedOnboarding,
      hasResume: Boolean(resume?.content && resume.content.length > 0),
      resumeFileName: resume?.fileName || null,
      resumeCharacters: resume?.characters || null,
      targetRole: profile?.targetRole || null,
      activeOpportunity: activeOpp
        ? {
            id: activeOpp.id,
            companyName: activeOpp.companyName,
            jobTitle: activeOpp.jobTitle,
            fitScore: activeOpp.fitScore,
            applicationRecommendation: activeOpp.applicationRecommendation,
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/profile/status error:", error);
    return NextResponse.json(
      { error: "Failed to query profile status" },
      { status: 500 }
    );
  }
}
