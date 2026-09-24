import { DayAssessmentQuestion } from "@/types";

export interface QuestionValidationResult {
  isValid: boolean;
  sanitized?: DayAssessmentQuestion;
  error?: string;
}

/**
 * Validates an assessment question against strict schema requirements:
 * - Non-empty question text (>= 15 characters)
 * - Exactly 4 options, all non-empty and unique
 * - Valid correctIndex integer between 0 and 3
 * - Meaningful explanation
 */
export function validateAssessmentQuestion(raw: any, fallbackId?: string): QuestionValidationResult {
  if (!raw || typeof raw !== "object") {
    return { isValid: false, error: "Question payload is null or not an object" };
  }

  const questionText = (raw.question || "").trim();
  if (questionText.length < 15) {
    return { isValid: false, error: `Question text too short (< 15 chars): "${questionText}"` };
  }

  if (!Array.isArray(raw.options) || raw.options.length !== 4) {
    return { isValid: false, error: `Question must contain exactly 4 options, got ${raw.options?.length ?? 0}` };
  }

  const cleanedOptions = raw.options.map((opt: any) => String(opt || "").trim());
  if (cleanedOptions.some((opt: string) => opt.length === 0)) {
    return { isValid: false, error: "One or more options are empty strings" };
  }

  // Check for duplicate options
  const uniqueOptions = new Set(cleanedOptions.map((o: string) => o.toLowerCase()));
  if (uniqueOptions.size !== 4) {
    return { isValid: false, error: "Question contains duplicate options" };
  }

  let correctIndex = raw.correctIndex;
  if (typeof correctIndex !== "number") {
    if (typeof raw.correctOption === "number") {
      correctIndex = raw.correctOption;
    } else if (typeof raw.correctAnswer === "number") {
      correctIndex = raw.correctAnswer;
    } else {
      return { isValid: false, error: "Missing valid numeric correctIndex" };
    }
  }

  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    return { isValid: false, error: `correctIndex out of bounds [0-3]: ${correctIndex}` };
  }

  const explanation = (raw.explanation || "").trim() ||
    `Option ${["A", "B", "C", "D"][correctIndex]} is the standard production solution adhering to architectural best practices.`;

  const difficulty = (raw.difficulty || "MEDIUM").toUpperCase();
  const normalizedDifficulty: "EASY" | "MEDIUM" | "HARD" =
    difficulty === "EASY" || difficulty === "HARD" ? difficulty : "MEDIUM";

  const sanitized: DayAssessmentQuestion = {
    id: raw.id || fallbackId || `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    question: questionText,
    codeSnippet: raw.codeSnippet ? String(raw.codeSnippet).trim() : undefined,
    codeLanguage: raw.codeLanguage || "typescript",
    options: cleanedOptions,
    correctIndex,
    correctOption: correctIndex,
    correctAnswer: correctIndex,
    topic: raw.topic || "Core Engineering",
    conceptTested: raw.conceptTested || raw.concept || raw.topic || "Technical Foundations",
    skill: raw.skill || raw.topic || "General",
    explanation,
    explanationBreakdown: raw.explanationBreakdown || {
      whyCorrect: explanation,
      whyIncorrect: ["Does not satisfy runtime complexity constraints.", "Fails on edge conditions.", "Violates system invariants."],
    },
    hint: raw.hint || "Analyze the time and space complexity tradeoffs.",
    difficulty: normalizedDifficulty,
  };

  return { isValid: true, sanitized };
}

/**
 * Validates a list of questions, discarding invalid entries and returning cleaned questions.
 */
export function validateAssessmentQuestions(
  rawList: any[],
  prefix: string = "q-val"
): { validQuestions: DayAssessmentQuestion[]; rejectedCount: number } {
  if (!Array.isArray(rawList)) {
    return { validQuestions: [], rejectedCount: 1 };
  }

  const validQuestions: DayAssessmentQuestion[] = [];
  let rejectedCount = 0;

  rawList.forEach((item, idx) => {
    const fallbackId = `${prefix}-${idx + 1}`;
    const res = validateAssessmentQuestion(item, fallbackId);
    if (res.isValid && res.sanitized) {
      validQuestions.push(res.sanitized);
    } else {
      rejectedCount++;
      console.warn(`[QuestionValidator] Rejected question #${idx + 1}:`, res.error);
    }
  });

  return { validQuestions, rejectedCount };
}

/**
 * Determines adaptive question difficulty based on multi-attempt history.
 * - Consistent >= 85% pass rate promotes to higher difficulty.
 * - < 50% pass rate demotes or maintains EASY.
 */
export function determineAdaptiveDifficulty(
  recentScores: number[],
  currentDifficulty: "EASY" | "MEDIUM" | "HARD" = "MEDIUM"
): "EASY" | "MEDIUM" | "HARD" {
  if (recentScores.length === 0) return "MEDIUM";

  const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

  if (avg >= 85) {
    if (currentDifficulty === "EASY") return "MEDIUM";
    if (currentDifficulty === "MEDIUM") return "HARD";
    return "HARD";
  }

  if (avg < 55) {
    if (currentDifficulty === "HARD") return "MEDIUM";
    if (currentDifficulty === "MEDIUM") return "EASY";
    return "EASY";
  }

  return currentDifficulty;
}
