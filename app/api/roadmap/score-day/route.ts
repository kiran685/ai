import { NextResponse } from "next/server";
import { DayAssessmentQuestion, DayResult } from "@/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dayId, dayNumber = 1, answers, questions } = body as {
      dayId: string;
      dayNumber?: number;
      answers: Record<string, number>;
      questions: DayAssessmentQuestion[];
    };

    if (!dayId) {
      return NextResponse.json(
        { error: "dayId is required." },
        { status: 400 }
      );
    }

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Answers object is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Questions array is required." },
        { status: 400 }
      );
    }

    const totalQuestions = questions.length;
    let correctCount = 0;

    const review = questions.map((q) => {
      const userAnswer = typeof answers[q.id] === "number" ? answers[q.id] : -1;
      const isCorrect = userAnswer === q.correctIndex;
      if (isCorrect) {
        correctCount += 1;
      }

      const correctOptionText = q.options[q.correctIndex] || "";
      const explanation =
        q.explanation ||
        `Option ${["A", "B", "C", "D"][q.correctIndex]} ("${correctOptionText}") is correct because it directly adheres to industry best practices and core architectural requirements.`;

      return {
        id: q.id,
        question: q.question,
        codeSnippet: q.codeSnippet,
        language: q.language,
        options: q.options,
        userAnswerIndex: userAnswer,
        correctIndex: q.correctIndex,
        isCorrect,
        explanation,
        explanationBreakdown: q.explanationBreakdown,
      };
    });

    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 70;

    const result: DayResult = {
      dayId,
      dayNumber,
      score,
      passed,
      answers,
      review,
      completedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      result,
      correctCount,
      totalQuestions,
    });
  } catch (error) {
    console.error("Day score route error:", error);
    return NextResponse.json(
      { error: "Failed to calculate day score." },
      { status: 500 }
    );
  }
}
