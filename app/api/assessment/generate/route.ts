import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateMiniAssessment } from "@/lib/ai/mini-assessment";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { skill, targetRole, currentLevel } = body;

    if (!skill || !targetRole) {
      return NextResponse.json({ error: "skill and targetRole are required." }, { status: 400 });
    }

    const questions = await generateMiniAssessment({
      skillName: skill,
      targetRole,
      currentLevel: currentLevel || "Intermediate",
    });

    return NextResponse.json({ success: true, questions });
  } catch (error) {
    console.error("Assessment generate error:", error);
    return NextResponse.json({ error: "Failed to generate assessment." }, { status: 500 });
  }
}
