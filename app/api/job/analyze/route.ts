import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeJobOpportunity, JobAnalysisInputSchema } from "@/lib/ai/job-analyzer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const rawBody = await req.json();

    // If resumeText is missing, check if user has a saved resume
    let resumeText = rawBody.resumeText || rawBody.text || "";
    if (!resumeText && userId) {
      const existingResume = await prisma.resume.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });
      if (existingResume?.content) {
        resumeText = existingResume.content;
      }
    }

    const payload = {
      companyName: rawBody.companyName,
      jobTitle: rawBody.jobTitle,
      jobDescription: rawBody.jobDescription,
      resumeText,
    };

    const parsed = JobAnalysisInputSchema.safeParse(payload);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const analysis = await analyzeJobOpportunity(parsed.data);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("POST /api/job/analyze error:", error);
    return NextResponse.json(
      { error: "Failed to analyze job opportunity" },
      { status: 500 }
    );
  }
}
