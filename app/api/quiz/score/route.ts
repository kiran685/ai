import { NextResponse } from "next/server";
import { QuizQuestion, SkillQuizScore, QuizResult, TopicQuizScore } from "@/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { answers, questions, career } = body as {
      answers: Record<string, number>;
      questions: QuizQuestion[];
      career?: string;
    };

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

    // Track skill-level and topic-level stats
    const skillMap: Record<
      string,
      {
        total: number;
        correct: number;
        topics: Record<string, { total: number; correct: number }>;
      }
    > = {};

    questions.forEach((q) => {
      const skill = q.skill || "General";
      const topic = q.topic || "Core Concepts";

      if (!skillMap[skill]) {
        skillMap[skill] = { total: 0, correct: 0, topics: {} };
      }
      skillMap[skill].total += 1;

      if (!skillMap[skill].topics[topic]) {
        skillMap[skill].topics[topic] = { total: 0, correct: 0 };
      }
      skillMap[skill].topics[topic].total += 1;

      const userAnswer = answers[q.id];
      if (typeof userAnswer === "number" && userAnswer === q.correctIndex) {
        correctCount += 1;
        skillMap[skill].correct += 1;
        skillMap[skill].topics[topic].correct += 1;
      }
    });

    const topicPerformance: Record<string, Record<string, number>> = {};

    const skillScores: SkillQuizScore[] = Object.keys(skillMap).map((skill) => {
      const data = skillMap[skill];
      const score = Math.round((data.correct / data.total) * 100);

      let confidence: "strong" | "weak" | "none" = "none";
      if (score >= 75) {
        confidence = "strong";
      } else if (score >= 40) {
        confidence = "weak";
      } else {
        confidence = "none";
      }

      const strongTopics: string[] = [];
      const weakTopics: string[] = [];
      const topicsObj: Record<string, TopicQuizScore> = {};

      topicPerformance[skill] = {};

      Object.keys(data.topics).forEach((tName) => {
        const tData = data.topics[tName];
        const tScore = Math.round((tData.correct / tData.total) * 100);
        topicsObj[tName] = {
          topic: tName,
          score: tScore,
          total: tData.total,
          correct: tData.correct,
        };
        topicPerformance[skill][tName] = tScore;

        if (tScore >= 75) {
          strongTopics.push(tName);
        } else {
          weakTopics.push(tName);
        }
      });

      return {
        skill,
        score,
        total: data.total,
        correct: data.correct,
        confidence,
        topics: topicsObj,
        strongTopics,
        weakTopics,
      };
    });

    const overallScore = Math.round((correctCount / totalQuestions) * 100);

    const quizResult: QuizResult = {
      skillScores,
      overallScore,
      totalQuestions,
      correctCount,
      answers,
      topicPerformance,
    };

    return NextResponse.json({
      success: true,
      quizResult,
    });
  } catch (error) {
    console.error("Quiz score route error:", error);
    return NextResponse.json(
      { error: "Failed to calculate quiz score." },
      { status: 500 }
    );
  }
}
