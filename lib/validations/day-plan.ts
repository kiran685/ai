import { z } from "zod";

export const QuestionExplanationBreakdownSchema = z.object({
  whyCorrect: z.string().default("Standard production solution adhering to best practices."),
  whyIncorrect: z.array(z.string()).default([]),
  keyPrinciple: z.string().optional(),
}).passthrough();

export const DayAssessmentQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(10),
  options: z.array(z.string().min(1)).min(4),
  correctIndex: z.number().int().min(0).max(3),
  correctAnswer: z.number().int().min(0).max(3).optional(),
  correctOption: z.number().int().min(0).max(3).optional(),
  codeSnippet: z.string().optional(),
  language: z.string().optional(),
  codeLanguage: z.string().optional(),
  topic: z.string().optional(),
  concept: z.string().optional(),
  conceptTested: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard", "EASY", "MEDIUM", "HARD"]).optional(),
  explanation: z.union([z.string(), QuestionExplanationBreakdownSchema]).optional(),
  explanationBreakdown: QuestionExplanationBreakdownSchema.optional(),
  hint: z.string().optional(),
}).passthrough();

export const PracticeTestCaseSchema = z.object({
  id: z.string().optional(),
  input: z.string(),
  expectedOutput: z.string(),
  isHidden: z.boolean().default(false),
  explanation: z.string().optional(),
}).passthrough();

export const PracticeProblemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3),
  difficulty: z.enum(["Easy", "Medium", "Hard", "EASY", "MEDIUM", "HARD", "easy", "medium", "hard"]).default("Medium"),
  description: z.string().min(10),
  starterCode: z.string().optional(),
  starterCodes: z.record(z.string(), z.string()).optional(),
  testCases: z.array(PracticeTestCaseSchema).default([]),
  constraints: z.array(z.string()).default([]),
  expectedTimeComplexity: z.string().optional(),
  expectedSpaceComplexity: z.string().optional(),
  solutionHint: z.string().optional(),
  interviewRelevance: z.string().optional(),
}).passthrough();

export const DayModuleItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  overview: z.string().optional(),
  notes: z.array(z.string()).default([]),
  commands: z.array(z.string()).default([]),
  codeSnippet: z.object({
    language: z.string(),
    code: z.string(),
    explanation: z.string().optional(),
  }).optional(),
  keyTakeaways: z.array(z.string()).default([]),
}).passthrough();

export const DayTopicItemSchema = z.object({
  id: z.string(),
  topicNumber: z.number().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  overview: z.string().optional(),
  comprehensiveTheory: z.string().optional(),
  comparisonTable: z.object({
    headers: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }).optional(),
  interviewQuestions: z.array(z.object({
    question: z.string(),
    answer: z.string(),
    difficulty: z.string().optional(),
  })).default([]),
  modules: z.array(DayModuleItemSchema).default([]),
  assessment: z.array(DayAssessmentQuestionSchema).default([]),
}).passthrough();

export const DayPlanSchema = z.object({
  id: z.string().min(1),
  dayNumber: z.number().int().min(1),
  topic: z.string().min(3),
  description: z.string().default(""),
  skills: z.array(z.string()).min(1),
  topics: z.array(DayTopicItemSchema).min(1),
  practiceProblems: z.array(PracticeProblemSchema).default([]),
  assessment: z.array(DayAssessmentQuestionSchema).default([]),
  youtubeResources: z.array(z.any()).default([]),
  learningResources: z.array(z.string()).default([]),
}).passthrough();

export type ValidatedDayPlan = z.infer<typeof DayPlanSchema>;
export type ValidatedAssessmentQuestion = z.infer<typeof DayAssessmentQuestionSchema>;

export function sanitizeDayPlanForClient<T extends { assessment?: any[]; topics?: any[] }>(dayPlan: T): T {
  const clientCopy: T = JSON.parse(JSON.stringify(dayPlan));

  if (Array.isArray(clientCopy.assessment)) {
    clientCopy.assessment = clientCopy.assessment.map((q: any) => {
      const { correctAnswer, correctIndex, correctOption, explanation, explanationBreakdown, ...safeQ } = q;
      return safeQ;
    });
  }

  if (Array.isArray(clientCopy.topics)) {
    clientCopy.topics = clientCopy.topics.map((topic: any) => {
      if (Array.isArray(topic.assessment)) {
        topic.assessment = topic.assessment.map((q: any) => {
          const { correctAnswer, correctIndex, correctOption, explanation, explanationBreakdown, ...safeQ } = q;
          return safeQ;
        });
      }
      return topic;
    });
  }

  return clientCopy;
}
