import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MiniAssessmentQuestion } from "@/lib/ai/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { skill, answers, questions } = body as {
      skill: string;
      answers: Record<string, number>;
      questions: MiniAssessmentQuestion[];
    };

    if (!skill || !answers || !questions) {
      return NextResponse.json({ error: "skill, answers, and questions are required." }, { status: 400 });
    }

    let correctCount = 0;
    const totalQuestions = questions.length;
    const review = questions.map((q, idx) => {
      const userAnswer = answers[`q${idx}`] ?? -1;
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        question: q.questionText,
        options: q.options,
        userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 70;

    // Store assessment
    await prisma.assessment.create({
      data: {
        userId,
        type: "TOPIC_ASSESSMENT",
        overallScore: score,
        totalQuestions,
        correctCount,
        passed,
        answers: JSON.stringify(answers),
        skillScores: JSON.stringify([{ skill, score, confidence: score >= 70 ? "strong" : score >= 40 ? "weak" : "none" }]),
        review: JSON.stringify(review),
      },
    });

    // Update UserSkill
    const skillRecord = await prisma.skill.findFirst({ where: { name: skill } });
    if (skillRecord) {
      const existing = await prisma.userSkill.findFirst({
        where: { userId, skillId: skillRecord.id },
      });

      if (existing) {
        await prisma.userSkill.update({
          where: { id: existing.id },
          data: {
            quizScore: score,
            quizConfidence: score >= 70 ? "strong" : score >= 40 ? "weak" : "none",
          },
        });
      } else {
        await prisma.userSkill.create({
          data: {
            userId,
            skillId: skillRecord.id,
            confidence: "none",
            found: false,
            quizScore: score,
            quizConfidence: score >= 70 ? "strong" : score >= 40 ? "weak" : "none",
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      score,
      passed,
      correctCount,
      totalQuestions,
      review,
    });
  } catch (error) {
    console.error("Assessment evaluate error:", error);
    return NextResponse.json({ error: "Failed to evaluate assessment." }, { status: 500 });
  }
}
