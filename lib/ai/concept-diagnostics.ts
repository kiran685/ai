import {
  DayAssessmentQuestion,
  DayResultQuestionReview,
  DayDiagnosticReport,
  TopicPerformance,
  ConceptPerformance,
  DiagnosisStatus,
  PracticeProgress,
} from "@/types";
import { generateOmniRouteJson } from "./omniroute";

interface DiagnoseInput {
  dayId: string;
  dayNumber: number;
  dayTopic: string;
  career: string;
  questions: DayAssessmentQuestion[];
  answers: Record<string, number>;
  practiceProgress?: PracticeProgress;
}

export function getDiagnosisStatus(percentage: number): DiagnosisStatus {
  if (percentage >= 80) return "STRONG";
  if (percentage >= 60) return "DEVELOPING";
  if (percentage >= 40) return "WEAK";
  return "CRITICAL";
}

export async function diagnoseAssessmentSubmission(
  input: DiagnoseInput
): Promise<{
  report: DayDiagnosticReport;
  review: DayResultQuestionReview[];
}> {
  const { dayId, dayNumber, dayTopic, career, questions, answers, practiceProgress } = input;

  let correctCount = 0;
  const totalQuestions = questions.length;

  const conceptAccumulator: Record<
    string,
    {
      concept: string;
      topic: string;
      skill: string;
      correct: number;
      total: number;
    }
  > = {};

  const topicAccumulator: Record<
    string,
    {
      topic: string;
      skill: string;
      correct: number;
      total: number;
    }
  > = {};

  const review: DayResultQuestionReview[] = questions.map((q, idx) => {
    const userAnswerIndex = typeof answers[q.id] === "number" ? answers[q.id] : -1;
    const isCorrect = userAnswerIndex === q.correctIndex;
    if (isCorrect) correctCount++;

    const skill = q.skill || dayTopic || "Core Engineering";
    const topic = q.topic || dayTopic || "Core Concepts";
    const concept = q.concept || q.topic || `Concept ${idx + 1}`;
    const difficulty = q.difficulty || "medium";

    // Track concept stats
    if (!conceptAccumulator[concept]) {
      conceptAccumulator[concept] = { concept, topic, skill, correct: 0, total: 0 };
    }
    conceptAccumulator[concept].total++;
    if (isCorrect) conceptAccumulator[concept].correct++;

    // Track topic stats
    if (!topicAccumulator[topic]) {
      topicAccumulator[topic] = { topic, skill, correct: 0, total: 0 };
    }
    topicAccumulator[topic].total++;
    if (isCorrect) topicAccumulator[topic].correct++;

    const correctOptionText = q.options[q.correctIndex] || "";
    const explanation =
      q.explanation ||
      `Option ${["A", "B", "C", "D"][q.correctIndex]} ("${correctOptionText}") is the correct solution adhering to architectural standards for ${concept}.`;

    return {
      id: q.id,
      question: q.question,
      codeSnippet: q.codeSnippet,
      language: q.language,
      options: q.options,
      userAnswerIndex,
      correctIndex: q.correctIndex,
      isCorrect,
      skill,
      topic,
      concept,
      difficulty,
      explanation,
      explanationBreakdown: q.explanationBreakdown,
    };
  });

  const overallScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = overallScore >= 70;

  // Process concept diagnosis
  const conceptDiagnosis: Record<string, ConceptPerformance> = {};
  const strongConcepts: string[] = [];
  const weakConcepts: string[] = [];
  const criticalConcepts: string[] = [];
  const whatWentWell: string[] = [];
  const needsAttention: string[] = [];

  for (const [conceptName, data] of Object.entries(conceptAccumulator)) {
    const score = Math.round((data.correct / data.total) * 100);
    const status = getDiagnosisStatus(score);
    conceptDiagnosis[conceptName] = {
      concept: conceptName,
      topic: data.topic,
      skill: data.skill,
      score,
      correct: data.correct,
      total: data.total,
      status,
    };

    if (status === "STRONG") {
      strongConcepts.push(conceptName);
      whatWentWell.push(`${conceptName} (${score}% correct: ${data.correct}/${data.total})`);
    } else if (status === "DEVELOPING") {
      needsAttention.push(`${conceptName} (${score}%: needs hands-on drills)`);
    } else if (status === "WEAK") {
      weakConcepts.push(conceptName);
      needsAttention.push(`${conceptName} (${score}%: requires focused revision)`);
    } else {
      criticalConcepts.push(conceptName);
      needsAttention.push(`${conceptName} (${score}%: critical conceptual gap)`);
    }
  }

  // Process topic performance
  const topicPerformance: Record<string, TopicPerformance> = {};
  for (const [topicName, tData] of Object.entries(topicAccumulator)) {
    const score = Math.round((tData.correct / tData.total) * 100);
    const status = getDiagnosisStatus(score);

    const relatedConcepts: Record<string, ConceptPerformance> = {};
    for (const [cName, cPerf] of Object.entries(conceptDiagnosis)) {
      if (cPerf.topic === topicName) {
        relatedConcepts[cName] = cPerf;
      }
    }

    topicPerformance[topicName] = {
      topic: topicName,
      skill: tData.skill,
      score,
      correct: tData.correct,
      total: tData.total,
      status,
      concepts: relatedConcepts,
    };
  }

  // Generate actionable AI Recommendation with robust deterministic fallback
  let aiRecommendation = "";
  const mostCritical = criticalConcepts[0] || weakConcepts[0];

  if (!passed && mostCritical) {
    aiRecommendation = `Your assessment revealed gaps in ${mostCritical}. Spend your next session working through targeted exercises in ${mostCritical} before advancing to subsequent modules.`;
  } else if (!passed) {
    aiRecommendation = `Score was ${overallScore}% (under the 70% threshold). Review core architectural principles and retry the assessment.`;
  } else if (weakConcepts.length > 0) {
    aiRecommendation = `Great work passing Day ${dayNumber}! Before moving to new architecture, review ${weakConcepts.join(", ")} to reinforce edge cases.`;
  } else {
    aiRecommendation = `Outstanding performance (${overallScore}%). You demonstrated strong production-level comprehension of ${dayTopic}. Proceed with confidence to the next mission!`;
  }

  // Optional AI enrichment via OmniRoute if available
  try {
    const prompt = `You are an AI Career OS Tutor evaluating a student's daily mission assessment for role '${career}'.
Day Topic: ${dayTopic}
Overall Score: ${overallScore}% (${passed ? "PASSED" : "FAILED"})
Strong Concepts: ${strongConcepts.join(", ") || "None"}
Weak Concepts: ${weakConcepts.join(", ") || "None"}
Critical Concepts: ${criticalConcepts.join(", ") || "None"}

Provide a concise, direct, 1-2 sentence recommendation for what the student should review or focus on next. Return JSON: {"recommendation": "string"}`;

    const aiRes = await generateOmniRouteJson<{ recommendation: string }>(
      prompt,
      { recommendation: aiRecommendation },
      { temperature: 0.2 }
    );
    if (aiRes?.recommendation) {
      aiRecommendation = aiRes.recommendation;
    }
  } catch (err) {
    // Keep deterministic recommendation
  }

  const report: DayDiagnosticReport = {
    dayId,
    dayNumber,
    overallScore,
    passed,
    topicPerformance,
    conceptDiagnosis,
    strongConcepts,
    weakConcepts,
    criticalConcepts,
    whatWentWell: whatWentWell.length > 0 ? whatWentWell : ["Completed full question assessment sequence"],
    needsAttention: needsAttention.length > 0 ? needsAttention : ["No critical concept weaknesses detected"],
    aiRecommendation,
    roadmapAdjusted: false, // will be evaluated by adaptive engine
    completedAt: new Date().toISOString(),
  };

  return { report, review };
}
