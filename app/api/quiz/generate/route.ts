import { NextResponse } from "next/server";
import { generateQuizQuestions } from "@/lib/ai/quiz-generate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, career } = body;

    if (!career || typeof career !== "string") {
      return NextResponse.json({ error: "Target career is required." }, { status: 400 });
    }

    const questions = await generateQuizQuestions(career, text);

    return NextResponse.json({
      success: true,
      questions,
      source: "ai",
    });
  } catch (error) {
    console.error("Quiz generate route error:", error);
    return NextResponse.json({ error: "Failed to generate quiz." }, { status: 500 });
  }
}
