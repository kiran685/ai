import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    const {
      companyName,
      jobTitle,
      jobDescription,
      fitScore,
      strongMatches,
      developing,
      missingOrNotDemonstrated,
      criticalGaps,
      resumeAlignment,
      applicationRecommendation,
      recommendations,
    } = body;

    if (!companyName || !jobTitle) {
      return NextResponse.json(
        { error: "Company name and job title are required" },
        { status: 400 }
      );
    }

    // 1. Deactivate existing active opportunities for user
    await prisma.jobOpportunity.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // 2. Create new active JobOpportunity
    const opportunity = await prisma.jobOpportunity.create({
      data: {
        userId,
        companyName,
        jobTitle,
        jobDescription: jobDescription || "",
        fitScore: Number(fitScore) || 70,
        matchedSkills: JSON.stringify(strongMatches || []),
        developingSkills: JSON.stringify(developing || []),
        missingSkills: JSON.stringify(missingOrNotDemonstrated || []),
        criticalGaps: JSON.stringify(criticalGaps || []),
        resumeAlignment: Array.isArray(resumeAlignment) ? resumeAlignment.join("\n") : (resumeAlignment || ""),
        applicationRecommendation: applicationRecommendation || "",
        recommendations: JSON.stringify(recommendations || []),
        isActive: true,
      },
    });

    // 3. Calibrate user's CareerProfile to this opportunity
    const existingProfile = await prisma.careerProfile.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    const targetRoleName = jobTitle;

    // 4. Generate calibrated roadmap for this target opportunity
    const resume = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    let roadmapData = undefined;
    try {
      const roadmapRes = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/roadmap/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: resume?.content || "",
          career: targetRoleName,
          skills: (strongMatches || []).map((s: any) => ({ skill: s.skill, found: true, confidence: "strong" })),
        }),
      });

      if (roadmapRes.ok) {
        const rJson = await roadmapRes.json();
        roadmapData = {
          weeks: rJson.weeks || [],
          daysData: {},
          dayResults: {},
        };
      }
    } catch (rErr) {
      console.warn("Prepare opportunity roadmap generation warning:", rErr);
    }

    const profilePayload = {
      targetRole: targetRoleName,
      alignmentScore: Number(fitScore) || 70,
      summary: `Target Opportunity: ${companyName} (${jobTitle}). Initial alignment: ${fitScore}%. Application guidance: ${applicationRecommendation || "Prepare core requirements"}`,
      strengths: JSON.stringify((strongMatches || []).map((s: any) => s.skill)),
      weaknesses: JSON.stringify(criticalGaps || []),
    };

    if (existingProfile) {
      await prisma.careerProfile.update({
        where: { id: existingProfile.id },
        data: profilePayload,
      });
    } else {
      await prisma.careerProfile.create({
        data: {
          userId,
          ...profilePayload,
        },
      });
    }

    // 5. Update roadmap record in DB if generated
    if (roadmapData) {
      const existingRoadmap = await prisma.roadmap.findFirst({ where: { userId } });
      const weeksDataStr = JSON.stringify(roadmapData.weeks);
      if (existingRoadmap) {
        await prisma.roadmap.update({
          where: { id: existingRoadmap.id },
          data: {
            targetRole: targetRoleName,
            weeksData: weeksDataStr,
            strategyTitle: `${companyName} ${jobTitle} Opportunity Preparation`,
            strategicAdvice: `Calibrated specifically to close ${criticalGaps?.join(", ") || "priority gaps"} for ${companyName}.`,
          },
        });
      } else {
        await prisma.roadmap.create({
          data: {
            userId,
            targetRole: targetRoleName,
            weeksData: weeksDataStr,
            strategyTitle: `${companyName} ${jobTitle} Opportunity Preparation`,
            strategicAdvice: `Calibrated specifically to close ${criticalGaps?.join(", ") || "priority gaps"} for ${companyName}.`,
          },
        });
      }
    }

    // 6. Set user onboardingCompleted: true
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });

    return NextResponse.json({
      success: true,
      opportunityId: opportunity.id,
      targetRole: targetRoleName,
      companyName,
    });
  } catch (error) {
    console.error("POST /api/job/prepare error:", error);
    return NextResponse.json(
      { error: "Failed to create preparation plan for this opportunity" },
      { status: 500 }
    );
  }
}
