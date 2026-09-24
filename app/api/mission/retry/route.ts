import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DayAssessmentQuestion } from "@/types";
import { generateGeminiJson } from "@/lib/ai/gemini";
import { getSkillDefinition } from "@/lib/skills/skill-catalog";
import { MASTERY_THRESHOLD } from "@/lib/skills/constants";
import { validateAssessmentQuestions, determineAdaptiveDifficulty } from "@/lib/skills/question-validator";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const {
      dayId,
      weakAreas = [],
      dayTopic = "Technical Mastery",
      career = "Software Engineer",
      previousScore = 50,
    } = body;

    if (!dayId) {
      return NextResponse.json({ error: "dayId is required." }, { status: 400 });
    }

    // Parse week and day
    const match = dayId.match(/week-(\d+)_day-?(\d+)/i);
    const weekNumber = match ? parseInt(match[1], 10) : 1;
    const dayNumber = match ? parseInt(match[2], 10) : 1;

    // Fetch previous assessments for this day to know attempt number and seen questions
    const pastAssessments = await prisma.assessment.findMany({
      where: {
        userId,
        dayNumber,
        weekId: `week-${weekNumber}`,
      },
      orderBy: { attemptNumber: "desc" },
    });

    const attemptNumber = (pastAssessments[0]?.attemptNumber || 1) + 1;
    const seenQuestionTexts = new Set<string>();

    pastAssessments.forEach((pa) => {
      if (pa.review) {
        try {
          const rev = JSON.parse(pa.review);
          if (Array.isArray(rev)) {
            rev.forEach((r: any) => {
              if (r.question) seenQuestionTexts.add(r.question.trim().toLowerCase());
            });
          }
        } catch {}
      }
      if (pa.answers) {
        try {
          const ans = JSON.parse(pa.answers);
          Object.keys(ans).forEach((k) => seenQuestionTexts.add(k.trim().toLowerCase()));
        } catch {}
      }
    });

    const pastScores = pastAssessments.map((pa) => pa.overallScore || 0);
    const targetDifficulty = determineAdaptiveDifficulty(pastScores);

    // Create targeted prompt focusing exclusively on the weak concepts
    const conceptsToDrill = weakAreas.length > 0 ? weakAreas.join(", ") : dayTopic;
    const previouslySeenList = Array.from(seenQuestionTexts).slice(0, 8);
    const exclusionClause = previouslySeenList.length > 0
      ? `\nCRITICAL DEDUPLICATION: DO NOT repeat any of these previously asked questions:\n${previouslySeenList.map((q) => `- "${q}"`).join("\n")}\n`
      : "";

    const prompt = `
You are a Principal Engineering Mentor conducting a Targeted Remediation Re-test.
The candidate scored ${previousScore}% (< ${MASTERY_THRESHOLD}% threshold) on Day ${dayNumber} (${dayTopic}).
They struggled with these specific diagnosed weak concepts:
${conceptsToDrill}

Target Engineering Role: ${career}
Attempt Number: #${attemptNumber}
Target Difficulty Level: ${targetDifficulty}
${exclusionClause}
GENERATE EXACTLY 5 BRAND NEW, NON-REPEATING, TARGETED REMEDIATION ASSESSMENT QUESTIONS AT ${targetDifficulty} DIFFICULTY.
CRITICAL RULES:
1. Every question must directly test one of the candidate's diagnosed weak concepts: ${conceptsToDrill}.
2. Every question MUST be completely novel and structurally different from any previously seen questions.
3. Provide high-quality code snippets where appropriate.
4. Make the question test conceptual clarity, edge cases, and root understanding appropriate for ${targetDifficulty} difficulty.
5. Include a detailed explanationBreakdown explaining WHY the correct answer is correct and WHY each wrong option fails.
6. Provide a helpful hint to reinforce the mental model.

Return STRICT JSON matching:
{
  "questions": [
    {
      "id": "q-rem-${dayNumber}-${attemptNumber}-1",
      "question": "Question text...",
      "codeSnippet": "optional code snippet",
      "codeLanguage": "typescript",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "topic": "${conceptsToDrill}",
      "conceptTested": "Specific concept name",
      "explanation": "Clear explanation of the correct answer.",
      "explanationBreakdown": {
        "whyCorrect": "Direct explanation of why option 0 is correct...",
        "whyAIsWrong": "...",
        "whyBIsWrong": "...",
        "whyCIsWrong": "...",
        "whyDIsWrong": "..."
      },
      "hint": "Mental model hint to guide candidate"
    }
  ]
}
`;

    const aiResponse = await generateGeminiJson<{ questions: DayAssessmentQuestion[] }>(prompt);
    let questions: DayAssessmentQuestion[] | null = aiResponse?.questions || null;

    // Validate questions through strict question quality validator
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const validation = validateAssessmentQuestions(questions);
      if (validation.validQuestions.length >= 3) {
        questions = validation.validQuestions;
      } else {
        questions = null; // trigger robust fallback below
      }
    }

    // Fallback if AI generation encounters rate limits or formatting issues
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      questions = [
        {
          id: `q-rem-${dayNumber}-${attemptNumber}-1`,
          question: `Regarding ${conceptsToDrill}: Which of the following statements accurately characterizes best-practice implementation and trade-offs?`,
          options: [
            "Optimizing for average-case complexity while maintaining defensive error handling",
            "Eliminating all algorithmic complexity overhead without bounds",
            "Ignoring space complexity in favor of unverified recursion",
            "Assuming execution environments will never throw exceptions",
          ],
          correctIndex: 0,
          topic: dayTopic,
          explanation: `In production software engineering for ${career}, optimal solutions balance computational complexity with defensive robustness.`,
          explanationBreakdown: {
            whyCorrect: "Balances runtime performance and production safety.",
            whyIncorrect: [
              "Cannot eliminate complexity without mathematical bounds.",
              "Unbounded recursion leads to stack overflow exceptions.",
              "Exceptions must always be handled gracefully.",
            ],
          },
        },
        {
          id: `q-rem-${dayNumber}-${attemptNumber}-2`,
          question: `In an enterprise system designed for ${career}, what is the primary consequence of unhandled concurrency or state leakage?`,
          options: [
            "Deterministic race conditions and subtle data corruption under load",
            "Immediate compiler-level warning during continuous integration",
            "Automatic memory defragmentation by the operating system kernel",
            "Zero impact on system responsiveness or database consistency",
          ],
          correctIndex: 0,
          topic: dayTopic,
          explanation: "Concurrency bugs typically manifest only under production load as silent data inconsistencies or deadlock states.",
          explanationBreakdown: {
            whyCorrect: "Concurrency bugs manifest under load as silent race conditions.",
            whyIncorrect: [
              "Compilers cannot catch all runtime thread races.",
              "Kernel does not fix application-level state leakage.",
              "Causes critical downtime or data corruption.",
            ],
          },
        },
        {
          id: `q-rem-${dayNumber}-${attemptNumber}-3`,
          question: `When diagnosing performance bottlenecks in ${dayTopic}, what is the first diagnostic step before refactoring?`,
          options: [
            "Empirical profiling and measuring memory/CPU allocation metrics",
            "Immediately rewriting all components in a low-level language",
            "Disabling all database indexes to reduce write amplification",
            "Increasing thread pool sizes without examining bottleneck causes",
          ],
          correctIndex: 0,
          topic: dayTopic,
          explanation: "Never optimize blindly: profiling reveals whether the constraint is I/O-bound, memory-bound, or compute-bound.",
          explanationBreakdown: {
            whyCorrect: "Profiling isolates exact computational bottlenecks.",
            whyIncorrect: [
              "Rewriting without profiling introduces more bugs.",
              "Disabling indexes destroys query performance.",
              "Increasing thread pool can cause CPU thrashing.",
            ],
          },
        },
      ];
    }

    // Normalize and ensure unique deterministic IDs and clean fields
    const normalizedQuestions = (questions || []).map((q: any, idx: number) => {
      const cIdx = typeof q.correctIndex === "number" ? q.correctIndex : (typeof q.correctOption === "number" ? q.correctOption : 0);
      return {
        ...q,
        id: `q-rem-${dayNumber}-${attemptNumber}-${idx + 1}`,
        correctIndex: cIdx,
        correctAnswer: cIdx,
        difficulty: targetDifficulty,
      };
    });

    return NextResponse.json({
      success: true,
      dayId,
      attemptNumber,
      difficulty: targetDifficulty,
      remediationFocus: weakAreas,
      questions: normalizedQuestions,
    });
  } catch (error) {
    console.error("Error generating retry assessment:", error);
    return NextResponse.json({ error: "Failed to generate retry assessment." }, { status: 500 });
  }
}
