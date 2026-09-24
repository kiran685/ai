import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PracticeAttempt, PracticeProgress } from "@/types";
import { executeCode } from "@/lib/code-execution/service";
import { recordSkillEvidence } from "@/lib/skills/scoring-service";
import { recordRawEvidence } from "@/lib/skills/evidence-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const {
      dayId,
      problemId,
      skill = "General",
      topic = "Core",
      difficulty = "Medium",
      language = "javascript",
      code,
      testCases = [],
      isSubmit = false,
      problemTitle,
      expectedComplexity,
      totalProblems = 3,
    } = body;

    if (!dayId || problemId === undefined) {
      return NextResponse.json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "dayId and problemId are required." },
      }, { status: 400 });
    }

    // Idempotency check for code submission
    const codeHash = Buffer.from(code || "").toString("base64").substring(0, 24);
    const idempotencyKey = `practice:${userId}:${dayId}:${problemId}:${codeHash}`;

    // If code and testCases are provided, run sandboxed execution
    let executionResult = null;
    if (code && Array.isArray(testCases) && testCases.length > 0) {
      executionResult = await executeCode({
        language,
        code,
        testCases,
        isSubmit,
        problemTitle,
        expectedComplexity,
      });
    }

    // If this is only a "Run Code" request (not a submission), return execution results without recording submission state
    if (!isSubmit) {
      const roadmap = await prisma.roadmap.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });

      let dayResults: Record<string, any> = {};
      if (roadmap?.dayResults) {
        try {
          dayResults = JSON.parse(roadmap.dayResults);
        } catch {}
      }

      const currentDay = dayResults[dayId];
      const existingPractice = currentDay?.practiceProgress;

      return NextResponse.json({
        success: true,
        data: {
          execution: executionResult,
          practiceProgress: existingPractice,
          solved: false,
        },
        execution: executionResult,
        practiceProgress: existingPractice,
        solved: false,
      });
    }

    const isSolved = executionResult?.status === "ACCEPTED";

    // Idempotency: Record raw evidence event. If already recorded with same key, avoid double-incrementing attempts
    let isDuplicateSubmission = false;
    try {
      const rawRes = await recordRawEvidence({
        userId,
        idempotencyKey,
        skillName: skill,
        evidenceType: "PRACTICE",
        score: isSolved ? 100 : 0,
        metadata: {
          dayId,
          problemId,
          isSolved,
          language,
        },
      });
      isDuplicateSubmission = rawRes.isDuplicate;
    } catch (e) {
      console.warn("Raw evidence recording notice:", e);
    }

    const roadmap = await prisma.roadmap.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    let dayResults: Record<string, any> = {};
    if (roadmap?.dayResults) {
      try {
        dayResults = JSON.parse(roadmap.dayResults);
      } catch {}
    }

    const currentDay = dayResults[dayId] || {
      dayId,
      learningCompleted: false,
      practiceCompleted: false,
      assessmentCompleted: false,
      passed: false,
      score: null,
      weakAreas: [],
      answers: {},
    };

    // Load or initialize practiceProgress on day
    const existingPractice: PracticeProgress = currentDay.practiceProgress || {
      totalProblems,
      solvedCount: 0,
      practiceScore: 0,
      attempts: {},
    };

    const problemKey = String(problemId);
    const prevAttempt = existingPractice.attempts[problemKey];
    // Only increment attempt count if this is not a duplicate submission
    const newAttemptCount = (prevAttempt?.attempts || 0) + (isDuplicateSubmission ? 0 : 1);

    // Only update attempt state if submission was accepted or previously solved
    const newlySolved = isSolved || Boolean(prevAttempt?.solved);

    existingPractice.attempts[problemKey] = {
      problemId: problemKey,
      dayId,
      skill,
      topic,
      difficulty,
      language,
      solved: newlySolved,
      attempts: newAttemptCount,
      timestamp: new Date().toISOString(),
    };

    // Recalculate solved count and practice score (target = 3 problems)
    const solvedCount = Object.values(existingPractice.attempts).filter((a) => a.solved).length;
    const total = existingPractice.totalProblems || totalProblems || 3;
    const practiceScore = Math.round((solvedCount / total) * 100);

    existingPractice.solvedCount = solvedCount;
    existingPractice.practiceScore = practiceScore;
    currentDay.practiceProgress = existingPractice;

    // Auto-mark practiceCompleted if all 3 problems solved
    if (solvedCount >= total) {
      currentDay.practiceCompleted = true;
    }

    dayResults[dayId] = currentDay;

    if (roadmap) {
      await prisma.roadmap.update({
        where: { id: roadmap.id },
        data: { dayResults: JSON.stringify(dayResults) },
      });
    }

    // Record verified practice evidence in UserSkill (only when not duplicate or newly solved)
    let updatedSkillScore = null;
    if (skill && skill !== "General" && !isDuplicateSubmission) {
      try {
        const userSkill = await recordSkillEvidence(userId, skill, {
          practiceScore,
          missionCompletion: currentDay.practiceCompleted ? 100 : Math.round((solvedCount / total) * 100),
        });
        updatedSkillScore = userSkill.currentScore;
      } catch (skillErr) {
        console.warn("Failed to record skill evidence for practice:", skillErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        execution: executionResult,
        practiceProgress: existingPractice,
        solved: newlySolved,
        skillScore: updatedSkillScore,
        isDuplicate: isDuplicateSubmission,
      },
      execution: executionResult,
      practiceProgress: existingPractice,
      solved: newlySolved,
      skillScore: updatedSkillScore,
    });
  } catch (error) {
    console.error("Error logging practice attempt:", error);
    return NextResponse.json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to record practice attempt." },
    }, { status: 500 });
  }
}

