import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  evaluateCandidateCareerFit,
  generateRoleDeepDive,
  resolveRoleFromSlug,
} from "@/lib/ai/career-fit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(req.url);
    const roleSlug = url.searchParams.get("role");

    // Fetch user's saved resume
    const resume = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    if (!resume || !resume.content) {
      return NextResponse.json({
        success: false,
        error: "No resume found. Please upload a resume first.",
      }, { status: 404 });
    }

    if (roleSlug) {
      const targetRole = resolveRoleFromSlug(roleSlug);
      const deepDive = await generateRoleDeepDive(resume.content, targetRole);
      return NextResponse.json({
        success: true,
        deepDive,
        hasResume: true,
        fileName: resume.fileName,
      });
    }

    // Default: evaluate all roles
    const fitData = evaluateCandidateCareerFit(resume.content);

    return NextResponse.json({
      success: true,
      profile: fitData.profile,
      matches: fitData.recommendations,
      hasResume: true,
      fileName: resume.fileName,
    });
  } catch (error) {
    console.error("GET /api/career/fit error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate career fit" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const body = await req.json();
    let resumeText: string = body.text || body.resumeText || "";
    const fileName: string = body.fileName || "resume.pdf";
    const roleSlug: string | undefined = body.role;

    // If resumeText wasn't passed, try to fetch from user's profile
    if (!resumeText && userId) {
      const existingResume = await prisma.resume.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });
      if (existingResume?.content) {
        resumeText = existingResume.content;
      }
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return NextResponse.json(
        { error: "Resume text is required to evaluate career fit." },
        { status: 400 }
      );
    }

    // If specific role requested, generate deep dive
    if (roleSlug) {
      const targetRole = resolveRoleFromSlug(roleSlug);
      const deepDive = await generateRoleDeepDive(resumeText, targetRole);

      return NextResponse.json({
        success: true,
        deepDive,
      });
    }

    // Otherwise evaluate all candidate tracks
    const fitData = evaluateCandidateCareerFit(resumeText);

    // Persist to CareerFitResult and cache resume in DB if authenticated
    if (userId) {
      try {
        await prisma.careerFitResult.create({
          data: {
            userId,
            recommendedRoles: JSON.stringify(fitData.recommendations),
            selectedRole: fitData.recommendations[0]?.roleName || null,
          },
        });

        // Update resume record if provided
        const existing = await prisma.resume.findFirst({ where: { userId } });
        if (existing) {
          await prisma.resume.update({
            where: { id: existing.id },
            data: { content: resumeText, fileName, characters: resumeText.length },
          });
        } else {
          await prisma.resume.create({
            data: { userId, fileName, content: resumeText, characters: resumeText.length },
          });
        }
      } catch (dbErr) {
        console.warn("Non-critical DB save error in career fit:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      profile: fitData.profile,
      matches: fitData.recommendations,
      topRole: fitData.recommendations[0]?.roleName || "Software Engineer",
    });
  } catch (error) {
    console.error("POST /api/career/fit error:", error);
    return NextResponse.json(
      { error: "Failed to process career fit evaluation" },
      { status: 500 }
    );
  }
}
