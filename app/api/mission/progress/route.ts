import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { diagnoseAssessmentSubmission } from "@/lib/ai/concept-diagnostics";
import { adaptRoadmapOnPerformance } from "@/lib/skills/adaptive-engine";
import { buildStudentSkillProfile } from "@/lib/skills/profile-engine";
import { calculateTransparentReadiness, computeUserReadinessFromDatabase } from "@/lib/skills/readiness-engine";
import { determineNextBestMission } from "@/lib/skills/mission-engine";
import { recordSkillEvidence, ConceptEvaluation } from "@/lib/skills/scoring-service";
import { getRoleRequirement } from "@/lib/skills/role-requirements";
import { MASTERY_THRESHOLD } from "@/lib/skills/constants";
import { validateAssessmentQuestions } from "@/lib/skills/question-validator";
import { recordRawEvidence, getSkillExplanation } from "@/lib/skills/evidence-store";
import { DayAssessmentQuestion, RoadmapData, DayDiagnosticReport, PracticeProgress } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const dayId = searchParams.get("dayId");

    if (!dayId) {
      return NextResponse.json({ error: "dayId is required." }, { status: 400 });
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

    const currentDayData = dayResults[dayId] || null;

    return NextResponse.json({
      success: true,
      dayId,
      progress: {
        learningCompleted: Boolean(currentDayData?.learningCompleted),
        practiceCompleted: Boolean(currentDayData?.practiceCompleted),
        assessmentCompleted: Boolean(currentDayData?.assessmentCompleted),
        score: currentDayData?.score ?? null,
        passed: Boolean(currentDayData?.passed),
        weakAreas: currentDayData?.weakAreas || [],
        answers: currentDayData?.answers || {},
        completedAt: currentDayData?.completedAt || null,
        practiceProgress: currentDayData?.practiceProgress || null,
        diagnosticReport: currentDayData?.diagnosticReport || null,
        review: currentDayData?.review || null,
      },
    });
  } catch (error) {
    console.error("Error fetching mission progress:", error);
    return NextResponse.json({ error: "Failed to fetch mission progress." }, { status: 500 });
  }
}

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
      stage,
      score,
      weakAreas = [],
      answers = {},
      questions = [],
      dayTopic = "Core Architecture",
      career = "Software Engineer",
      practiceProgress,
    } = body;

    if (!dayId || !stage) {
      return NextResponse.json({ error: "dayId and stage are required." }, { status: 400 });
    }

    // Parse week and day number from dayId (e.g. "week-1_day-2" or "week-1_day2")
    const match = dayId.match(/week-(\d+)_day-?(\d+)/i);
    const weekNumber = match ? parseInt(match[1], 10) : 1;
    const dayNumber = match ? parseInt(match[2], 10) : 1;

    const [roadmap, profile, resume] = await Promise.all([
      prisma.roadmap.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.careerProfile.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.resume.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    // Cross-user access check: verify roadmap exists and belongs to authenticated user
    if (!roadmap || roadmap.userId !== userId) {
      return NextResponse.json({ error: "Roadmap not found or unauthorized." }, { status: 403 });
    }

    let dayResults: Record<string, any> = {};
    let parsedRoadmapData: RoadmapData = {
      weeks: [],
      daysData: {},
      dayResults: {},
    };

    try {
      parsedRoadmapData = {
        weeks: roadmap.weeksData ? JSON.parse(roadmap.weeksData) : [],
        daysData: roadmap.daysData ? JSON.parse(roadmap.daysData) : {},
        dayResults: roadmap.dayResults ? JSON.parse(roadmap.dayResults) : {},
      };
      dayResults = parsedRoadmapData.dayResults;
    } catch (err) {
      console.warn("Failed to parse existing roadmap data:", err);
    }

    const existingDay = dayResults[dayId] || {
      dayId,
      weekId: `week-${weekNumber}`,
      dayNumber,
      learningCompleted: false,
      practiceCompleted: false,
      assessmentCompleted: false,
      passed: false,
      score: null,
      weakAreas: [],
      answers: {},
      practiceProgress: practiceProgress || null,
    };

    let diagnosticReport: DayDiagnosticReport | null = null;
    let reviewList: any[] = [];
    let nextMissionSuggestion: any = null;
    let calculatedReadiness: any = null;
    let skillScoreProgress: any = null;

    if (stage === "LEARN") {
      existingDay.learningCompleted = true;
    } else if (stage === "PRACTICE") {
      // Practice completion gating: verify at least 1 practice problem solved
      const solvedCount = existingDay.practiceProgress?.solvedCount ?? practiceProgress?.solvedCount ?? 0;
      if (solvedCount < 1) {
        return NextResponse.json({
          error: "Practice requirement not met. At least one practice problem must be solved before completing practice.",
        }, { status: 400 });
      }
      existingDay.practiceCompleted = true;
      if (practiceProgress) {
        existingDay.practiceProgress = practiceProgress;
      }
    } else if (stage === "ASSESSMENT") {
      // Practice completion gating check: prevent skipping practice labs
      const solvedCount = existingDay.practiceProgress?.solvedCount ?? practiceProgress?.solvedCount ?? 0;
      if (!existingDay.practiceCompleted && solvedCount < 1) {
        return NextResponse.json({
          error: "Practice completion requirement not satisfied. Please solve practice problems before taking the assessment.",
        }, { status: 400 });
      }

      // 1. Retrieve authoritative server-stored DayPlan
      const dayPlanObj = parsedRoadmapData.daysData?.[dayId];
      if (!dayPlanObj) {
        return NextResponse.json({
          error: `DayPlan for ${dayId} is not initialized. Please load the mission day first.`,
        }, { status: 404 });
      }

      let assessmentQuestions: DayAssessmentQuestion[] = dayPlanObj.assessment || [];
      if (assessmentQuestions.length === 0 && Array.isArray(dayPlanObj.topics)) {
        for (const topic of dayPlanObj.topics) {
          if (Array.isArray(topic.assessment)) {
            assessmentQuestions = assessmentQuestions.concat(topic.assessment);
          }
        }
      }

      if (assessmentQuestions.length === 0) {
        return NextResponse.json({
          error: "No assessment questions found for this mission day.",
        }, { status: 400 });
      }

      // 2. Validate submitted question IDs and answer values against server-stored questions
      const submittedAnswers = (answers || {}) as Record<string, number>;
      const validQuestionIdMap = new Map<string, DayAssessmentQuestion>();
      for (const q of assessmentQuestions) {
        validQuestionIdMap.set(q.id, q);
      }

      for (const qId of Object.keys(submittedAnswers)) {
        if (!validQuestionIdMap.has(qId)) {
          return NextResponse.json({
            error: `Invalid question ID '${qId}' submitted. Question does not belong to this mission.`,
          }, { status: 400 });
        }
        const ansVal = submittedAnswers[qId];
        if (!Number.isInteger(ansVal) || ansVal < 0 || ansVal > 3) {
          return NextResponse.json({
            error: `Invalid answer index '${ansVal}' for question '${qId}'. Must be 0, 1, 2, or 3.`,
          }, { status: 400 });
        }
      }

      // 3. Authoritative server-side score calculation (NEVER trust client-sent score)
      let correctCount = 0;
      for (const q of assessmentQuestions) {
        const userAns = submittedAnswers[q.id];
        const expectedAns = typeof q.correctIndex === "number" ? q.correctIndex : (typeof q.correctAnswer === "number" ? q.correctAnswer : 0);
        if (userAns !== undefined && userAns === expectedAns) {
          correctCount++;
        }
      }

      const verifiedScore = Math.round((correctCount / assessmentQuestions.length) * 100);
      const verifiedPassed = verifiedScore >= 70;

      // Concept-level Diagnosis using server-side questions and answers
      const diagnosisResult = await diagnoseAssessmentSubmission({
        dayId,
        dayNumber,
        dayTopic: dayPlanObj.topic || dayTopic,
        career: profile?.targetRole || career,
        questions: assessmentQuestions,
        answers: submittedAnswers,
        practiceProgress: existingDay.practiceProgress || practiceProgress,
      });

      diagnosticReport = diagnosisResult.report;
      reviewList = diagnosisResult.review;

      const finalScore = diagnosticReport.overallScore;
      const passed = diagnosticReport.passed;

      existingDay.assessmentCompleted = true;
      existingDay.score = finalScore;
      existingDay.passed = passed;
      existingDay.weakAreas = diagnosticReport.weakConcepts.concat(diagnosticReport.criticalConcepts);
      existingDay.answers = answers;
      existingDay.completedAt = new Date().toISOString();
      existingDay.diagnosticReport = diagnosticReport;
      existingDay.review = reviewList;

      // 2. Adaptive Roadmap Engine Trigger
      const adaptiveResult = adaptRoadmapOnPerformance({
        roadmapData: parsedRoadmapData,
        dayId,
        dayNumber,
        weekNumber,
        diagnosticReport,
        targetRole: profile?.targetRole || career,
      });

      if (adaptiveResult.adapted) {
        parsedRoadmapData = adaptiveResult.updatedRoadmapData;
        diagnosticReport.roadmapAdjusted = true;
        diagnosticReport.adjustmentMessage = adaptiveResult.message;
        existingDay.diagnosticReport = diagnosticReport;
      }

      // 3. Update Student Skill Profile with live assessment evidence
      const studentProfile = buildStudentSkillProfile({
        targetRole: profile?.targetRole || career,
        resumeText: resume?.content || "",
        dayDiagnosticReports: [diagnosticReport],
        practiceProgress: existingDay.practiceProgress || practiceProgress,
      });

      // 4. Update empirical UserSkill records with evidence and concept evaluations
      const targetRoleTitle = profile?.targetRole || career;
      const roleReq = getRoleRequirement(targetRoleTitle);
      const currentWeek = parsedRoadmapData.weeks[weekNumber - 1];
      const skillsToUpdate = (currentWeek?.focusSkills && currentWeek.focusSkills.length > 0)
        ? currentWeek.focusSkills
        : [roleReq.requiredSkills[0] || "Programming"];

      // Capture previous score for primary skill before updating
      const primarySkillName = skillsToUpdate[0];
      const existingUserSkill = await prisma.userSkill.findFirst({
        where: {
          userId,
          skill: { name: primarySkillName },
        },
        include: { skill: true },
      });
      const previousSkillScore = existingUserSkill?.currentScore ?? null;

      // Calculate Idempotency key for Assessment submission
      const answersHash = Buffer.from(JSON.stringify(answers || {})).toString("base64").slice(0, 16);
      const pastAssessmentCount = await prisma.assessment.count({
        where: {
          userId,
          dayNumber,
          weekId: `week-${weekNumber}`,
        },
      });
      const attemptNumber = pastAssessmentCount + 1;
      const assessmentIdempotencyKey = `assessment:${userId}:${dayId}:att${attemptNumber}:${answersHash}`;

      // Record raw skill evidence with idempotency protection
      const rawEvidenceResult = await recordRawEvidence({
        userId,
        skillName: primarySkillName,
        evidenceType: "ASSESSMENT",
        score: finalScore,
        weight: 0.40,
        idempotencyKey: assessmentIdempotencyKey,
        metadata: {
          dayId,
          dayTopic,
          attemptNumber,
          passed,
          conceptsEvaluated: Object.keys(diagnosticReport.conceptDiagnosis || {}),
        },
      });

      const conceptEvals: ConceptEvaluation[] = Object.entries(diagnosticReport.conceptDiagnosis || {}).map(
        ([cId, perf]: [string, any]) => ({
          conceptId: cId,
          passed: perf.passed ?? (perf.score >= MASTERY_THRESHOLD),
          score: perf.score ?? (perf.passed ? 100 : 0),
        })
      );

      // Record concept-level raw evidence
      for (const ce of conceptEvals) {
        const conceptIdempKey = `concept:${userId}:${ce.conceptId}:${assessmentIdempotencyKey}`;
        await recordRawEvidence({
          userId,
          skillName: primarySkillName,
          conceptId: ce.conceptId,
          evidenceType: "CONCEPT_EVAL",
          score: ce.score,
          weight: 0.30,
          idempotencyKey: conceptIdempKey,
          metadata: { dayId, passed: ce.passed },
        });
      }

      const practiceVal = existingDay.practiceProgress?.practiceScore ?? (existingDay.practiceCompleted ? 85 : null);

      if (!rawEvidenceResult.isDuplicate) {
        for (const sk of skillsToUpdate) {
          try {
            await recordSkillEvidence(userId, sk, {
              practiceScore: practiceVal,
              assessmentScore: finalScore,
              missionCompletion: passed ? 100 : Math.round(finalScore * 0.7),
              concepts: conceptEvals,
            });
          } catch (e) {
            console.warn(`Failed to update UserSkill evidence for ${sk}:`, e);
          }
        }
      }

      // Query updated skill score to compute delta
      const updatedUserSkill = await prisma.userSkill.findFirst({
        where: {
          userId,
          skill: { name: primarySkillName },
        },
        include: { skill: true },
      });
      const currentSkillScore = updatedUserSkill?.currentScore ?? null;
      const scoreImprovement = (previousSkillScore !== null && currentSkillScore !== null)
        ? (currentSkillScore - previousSkillScore)
        : null;

      const scoreExplanation = await getSkillExplanation(userId, primarySkillName);

      skillScoreProgress = {
        skillName: primarySkillName,
        previousScore: previousSkillScore,
        currentScore: currentSkillScore,
        scoreImprovement,
        confidenceLevel: updatedUserSkill?.confidenceLevel ?? "LOW",
        isMastered: (currentSkillScore ?? 0) >= MASTERY_THRESHOLD,
        explanation: scoreExplanation,
        isDuplicate: rawEvidenceResult.isDuplicate,
      };

      // 5. Calculate transparent, empirical 3-Tier Readiness Scores from DB
      try {
        calculatedReadiness = await computeUserReadinessFromDatabase(userId, targetRoleTitle);
      } catch (e) {
        const allPastScores: number[] = Object.values(dayResults)
          .filter((d: any) => typeof d.score === "number")
          .map((d: any) => d.score);
        allPastScores.push(finalScore);
        const passedDaysCount = Object.values(dayResults).filter((d: any) => d.passed).length + (passed ? 1 : 0);

        calculatedReadiness = calculateTransparentReadiness({
          profile: studentProfile,
          assessmentScores: allPastScores,
          practiceProgress: existingDay.practiceProgress || practiceProgress,
          completedDaysCount: passedDaysCount,
          totalRoadmapDays: (parsedRoadmapData.weeks.length || 8) * 5,
        });
      }

      // 6. Determine Next Best Mission
      const passedDaysCount = Object.values(dayResults).filter((d: any) => d.passed).length + (passed ? 1 : 0);
      nextMissionSuggestion = determineNextBestMission({
        targetRole: targetRoleTitle,
        profile: studentProfile,
        latestDiagnostic: diagnosticReport,
        practiceProgress: existingDay.practiceProgress || practiceProgress,
        completedDaysCount: passedDaysCount,
        currentWeekNumber: weekNumber,
      });

      diagnosticReport.nextMission = nextMissionSuggestion;

      // 7. Persist to DB: CareerProfile
      if (profile) {
        await prisma.careerProfile.update({
          where: { id: profile.id },
          data: {
            alignmentScore: calculatedReadiness.careerReadiness,
            combinedAlignmentScore: calculatedReadiness.skillReadiness,
          },
        });
      }

      // Persist to DB: Assessment record
      await prisma.assessment.create({
        data: {
          userId,
          type: "DAY_ASSESSMENT",
          overallScore: finalScore,
          totalQuestions: assessmentQuestions.length,
          correctCount: Math.round((finalScore / 100) * assessmentQuestions.length),
          passed,
          dayNumber,
          weekId: `week-${weekNumber}`,
          answers: JSON.stringify(answers),
          skillScores: JSON.stringify(diagnosticReport.topicPerformance),
          review: JSON.stringify(reviewList),
        },
      });

      // Persist to DB: DailyMission record
      const existingMission = await prisma.dailyMission.findFirst({
        where: { userId, dayNumber, weekNumber },
      });

      const missionDetails = JSON.stringify({
        dayId,
        passed,
        score: finalScore,
        weakAreas: existingDay.weakAreas,
        diagnosticReport,
        nextMission: nextMissionSuggestion,
        readinessScores: calculatedReadiness,
      });

      if (existingMission) {
        await prisma.dailyMission.update({
          where: { id: existingMission.id },
          data: {
            completed: passed,
            score: finalScore,
            details: missionDetails,
          },
        });
      } else {
        await prisma.dailyMission.create({
          data: {
            userId,
            dayNumber,
            weekNumber,
            title: `Week ${weekNumber} Day ${dayNumber}: ${dayTopic}`,
            completed: passed,
            score: finalScore,
            details: missionDetails,
          },
        });
      }
    }

    dayResults[dayId] = existingDay;
    parsedRoadmapData.dayResults = dayResults;

    if (roadmap) {
      await prisma.roadmap.update({
        where: { id: roadmap.id },
        data: {
          weeksData: JSON.stringify(parsedRoadmapData.weeks),
          daysData: JSON.stringify(parsedRoadmapData.daysData),
          dayResults: JSON.stringify(dayResults),
        },
      });
    }

    // Update Progress model for dashboard / overall progress tracking
    try {
      const weeks = parsedRoadmapData.weeks || [];
      const totalDays = weeks.reduce((acc: number, w: any) => acc + (w.totalDays || (w.days ? w.days.length : 5)), 0) || 20;
      const completedDaysCount = Object.values(dayResults).filter(
        (d: any) => d && (d.assessmentCompleted || d.completed || d.status === "completed")
      ).length;
      const overallProgress = totalDays > 0 ? Math.min(100, Math.round((completedDaysCount / totalDays) * 100)) : 0;

      const existingProgress = await prisma.progress.findFirst({ where: { userId } });
      const progressData = {
        completedDays: completedDaysCount,
        totalDays,
        overallProgress,
      };

      if (existingProgress) {
        await prisma.progress.update({ where: { id: existingProgress.id }, data: progressData });
      } else {
        await prisma.progress.create({ data: { userId, weekId: `current`, ...progressData } });
      }
    } catch (progErr) {
      console.error("Non-fatal: failed to update Progress model in /api/mission/progress:", progErr);
    }

    return NextResponse.json({
      success: true,
      dayId,
      progress: existingDay,
      diagnosticReport,
      review: reviewList,
      nextMission: nextMissionSuggestion,
      readinessScores: calculatedReadiness,
      skillScoreProgress,
    });
  } catch (error) {
    console.error("Error saving mission progress:", error);
    return NextResponse.json({ error: "Failed to save mission progress." }, { status: 500 });
  }
}
