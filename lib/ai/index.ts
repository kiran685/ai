// AI Service Layer - Barrel Export
// All AI functions should be imported from this file

export { analyzeResume } from "./analyze-resume";
export { identifySkillGaps } from "./skill-gaps";
export { generateRoadmap } from "./roadmap";
export { generateDailyMission } from "./daily-mission";
export { generateMiniAssessment } from "./mini-assessment";
export { calculateReadiness } from "./readiness";
export { generateQuizQuestions } from "./quiz-generate";
export { generateDayPlan } from "./day-plan";

export type {
  ResumeAnalysisInput,
  ResumeAnalysisResult,
  SkillGapInput,
  SkillGap,
  SkillPriority,
  RoadmapInput,
  RoadmapDay,
  DailyMission,
  DailyMissionInput,
  DailyMissionSection,
  MiniAssessmentQuestion,
  MiniAssessmentInput,
  ReadinessScore,
  ReadinessSubScores,
} from "./types";
