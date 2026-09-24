import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { extractStructuredCareerProfile } from "@/lib/skills/profile-extractor";
import { matchProfileToRoles } from "@/lib/skills/discovery-engine";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const body = await req.json();
    const resumeText: string = body.text || body.resumeText || "";
    const fileName: string = body.fileName || "resume.pdf";

    if (!resumeText || resumeText.trim().length === 0) {
      return NextResponse.json(
        { error: "Resume text content is required for career discovery." },
        { status: 400 }
      );
    }

    // 1. Extract zero-hallucination Career Profile
    const careerProfile = extractStructuredCareerProfile(resumeText);

    // 2. Rank roles against the 9 role requirement models
    const discoveryMatches = matchProfileToRoles(careerProfile, resumeText);

    // 3. Persist resume text and initial profile if authenticated
    if (userId) {
      try {
        const existingResume = await prisma.resume.findFirst({ where: { userId } });
        if (existingResume) {
          await prisma.resume.update({
            where: { id: existingResume.id },
            data: { content: resumeText, fileName },
          });
        } else {
          await prisma.resume.create({
            data: { userId, fileName, content: resumeText, characters: resumeText.length },
          });
        }
      } catch (dbErr) {
        console.warn("[Career Discovery API] Non-critical db error caching resume:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      careerProfile,
      matches: discoveryMatches,
      topRole: discoveryMatches[0]?.roleName || "Software Engineer",
    });
  } catch (error) {
    console.error("[Career Discovery API] Error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate career discovery matches." },
      { status: 500 }
    );
  }
}
