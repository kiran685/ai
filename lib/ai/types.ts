// ============================================================================
// AI Service Layer Type Definitions
// ============================================================================

// --- 1. Resume Analysis ---
export interface ResumeEducationItem {
  degree: string;
  institution: string;
  year?: string;
}

export interface ResumeExperienceItem {
  title: string;
  company: string;
  duration?: string;
  description?: string;
}

export interface ResumeProjectItem {
  name: string;
  description: string;
  technologies?: string[];
}

export interface ResumeAnalysisInput {
  resumeText: string;
  targetRole: string;
}

export interface ResumeAnalysisResult {
  targetRole: string;
  summary: string;
  skills: string[];
  technicalSkills: string[];
  softSkills: string[];
  education: ResumeEducationItem[];
  experience: ResumeExperienceItem[];
  projects: ResumeProjectItem[];
  certifications: string[];
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  roleAlignment: number; // 0 - 100
}

// --- 2. Skill Gap Analysis ---
export type SkillPriority = "HIGH" | "MEDIUM" | "LOW";

export interface SkillGap {
  skill: string;
  currentLevel: string; // e.g. "None" | "Beginner" | "Intermediate"
  targetLevel: string;  // e.g. "Proficient" | "Advanced"
  priority: SkillPriority;
  reason: string;
}

export interface SkillGapInput {
  targetRole: string;
  resumeAnalysis: Partial<ResumeAnalysisResult>;
  assessmentScores?: Record<string, number> | Array<{ skill: string; score: number }>;
}

// --- 3. Roadmap & Learning Plans ---
export interface RoadmapDay {
  dayNumber: number;
  goal: string;
  tasks: string[];
  skillFocus: string;
  estimatedTime: number; // in minutes
  completionCriteria: string;
}

export interface RoadmapInput {
  skillGaps: SkillGap[];
  targetRole: string;
  timeline: string | number; // e.g. "8 weeks" or 8
  hoursPerWeek: number;
  currentLevel: string; // e.g. "Intermediate"
}

// --- 4. Daily Mission ---
export interface DailyMissionSection {
  topic?: string;
  task?: string;
  description?: string;
  durationMinutes: number;
  resources?: string[];
  keyConcepts?: string[];
  instructions?: string[];
  starterCode?: string;
  checkpointQuestions?: string[];
}

export interface DailyMission {
  dayNumber: number;
  title: string;
  learn: DailyMissionSection;
  practice: DailyMissionSection;
  assessment: DailyMissionSection;
  totalDurationMinutes: number;
}

export interface DailyMissionInput {
  roadmapDay: RoadmapDay;
  completedDaysCount: number;
  weakAreas: string[];
}

// --- 5. Mini Assessment ---
export interface MiniAssessmentQuestion {
  questionText: string;
  options: string[]; // 4 options
  correctAnswer: number; // 0 - 3 index
  explanation: string;
}

export interface MiniAssessmentInput {
  skillName: string;
  targetRole: string;
  currentLevel: string;
}

// --- 6. Career Readiness Score ---
export interface ReadinessSubScores {
  skills: number;    // 0 - 100 (35% weight)
  resume: number;    // 0 - 100 (25% weight)
  projects: number;  // 0 - 100 (25% weight)
  interview: number; // 0 - 100 (15% weight)
}

export interface ReadinessScore {
  overallScore: number; // 0 - 100 composite
  subScores: ReadinessSubScores;
  weights: {
    skills: number;
    resume: number;
    projects: number;
    interview: number;
  };
  readinessTier: "READY" | "NEAR_READY" | "DEVELOPING" | "NEEDS_FOUNDATION";
  recommendations: string[];
}
