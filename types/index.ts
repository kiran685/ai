export interface SkillMatch {
  skill: string;
  found: boolean;
  confidence: "strong" | "weak" | "none";
  evidence: string;
}

export interface RoadmapStep {
  id: string;
  text: string;
  completed: boolean;
}

export interface RoadmapModule {
  id: string;
  title: string;
  description: string;
  estimatedWeeks: number;
  skills: string[];
  steps: RoadmapStep[];
}

export interface QuizQuestion {
  id: string;
  skill: string;
  topic?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  question: string;
  options: string[];
  correctIndex: number;
}

export interface TopicQuizScore {
  topic: string;
  score: number; // 0 - 100
  total: number;
  correct: number;
}

export interface SkillQuizScore {
  skill: string;
  score: number; // 0 - 100
  total?: number;
  correct?: number;
  confidence: "strong" | "weak" | "none";
  topics?: Record<string, TopicQuizScore>;
  strongTopics?: string[];
  weakTopics?: string[];
}

export interface QuizResult {
  skillScores: SkillQuizScore[];
  overallScore: number;
  totalQuestions: number;
  correctCount: number;
  answers: Record<string, number>;
  topicPerformance?: Record<string, Record<string, number>>; // skill -> topic -> score
}

export type SkillStatus = "STRONG" | "DEMONSTRATED" | "DEVELOPING" | "WEAK" | "MISSING" | "NOT_DEMONSTRATED";
export type ResumeSkillStatus = "DEMONSTRATED" | "CLAIMED" | "MISSING" | "UNKNOWN";

export interface StudentSkillItem {
  skill: string;
  score: number; // 0 - 100
  expectedScore: number;
  importance: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: SkillStatus;
  resumeStatus: ResumeSkillStatus;
  confidence: "strong" | "weak" | "none";
  evidence: string;
  strongTopics: string[];
  weakTopics: string[];
}

export interface SkillGapItem {
  skill: string;
  currentScore: number;
  requiredScore: number;
  gapScore: number;
  importance: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: SkillStatus;
  isPriority: boolean;
  reason: string;
}

export interface StudentSkillProfile {
  targetRole: string;
  overallReadiness: number;
  skills: StudentSkillItem[];
  strongSkills: StudentSkillItem[];
  developingSkills: StudentSkillItem[];
  weakSkills: StudentSkillItem[];
  missingSkills: StudentSkillItem[];
  priorityGaps: SkillGapItem[];
}

export interface TodayMissionItem {
  id: string;
  title: string;
  focusSkill: string;
  targetTopic: string;
  targetRole: string;
  reason: string;
  estimatedMinutes: number;
  learningMinutes: number;
  practiceProblems: number;
  assessmentQuestions: number;
  completed: boolean;
  score?: number;
  weekId?: string;
  dayNumber?: number;
}

export type SkillCategory =
  | "strong"         // Found (strong) + Score high: Strong — genuinely skilled
  | "overstated"     // Found (strong) + Score low: Overstated — mentioned but weak
  | "understated"    // Found (weak) + Score high: Understated — knows it but resume is weak
  | "needs_work"     // Found (weak) + Score low: Needs work — partial knowledge
  | "hidden_skill"   // Not found + Score high: Hidden skill — has it but didn't mention
  | "true_gap"       // Not found + Score low: True gap — needs to learn
  | "developing";    // Moderate score

export interface CombinedSkillEvaluation {
  skill: string;
  resumeConfidence: "strong" | "weak" | "none";
  quizConfidence: "strong" | "weak" | "none";
  quizScore?: number;
  category: SkillCategory;
  label: string;
  description: string;
}

// Week-level overview (returned by /api/roadmap/generate)
export interface WeekOverview {
  id: string;
  weekNumber: number;
  title: string;
  focusSkills: string[];
  description: string;
  totalDays: number;
}

export interface QuestionExplanationBreakdown {
  whyCorrect: string;
  whyIncorrect?: string[];
  keyPrinciple?: string;
}

export interface DayAssessmentQuestion {
  id: string;
  question: string;
  codeSnippet?: string;
  language?: string;
  codeLanguage?: string;
  options: string[];
  correctIndex: number;
  correctAnswer?: number;
  correctOption?: number;
  skill?: string;
  topic?: string;
  concept?: string;
  conceptTested?: string;
  hint?: string;
  difficulty?: "easy" | "medium" | "hard" | "EASY" | "MEDIUM" | "HARD";
  explanation?: string | QuestionExplanationBreakdown;
  explanationBreakdown?: QuestionExplanationBreakdown;
}

export interface DayModuleCodeSnippet {
  title?: string;
  language: string;
  code: string;
  explanation?: string;
}

export interface DaySubModuleItem {
  id: string;
  title: string;
  overview: string;
  detailedTheory?: string;
  notes?: string[];
  commands?: string[];
  codeSnippet?: DayModuleCodeSnippet;
  keyTakeaways?: string[];
}

export interface ComparisonTable {
  headers: string[];
  rows: string[][];
}

export interface InterviewQuestionItem {
  question: string;
  answer: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
}

export interface DayTopicItem {
  id: string; // e.g. "topic-1", "topic-2"
  topicNumber: number; // 1, 2
  title: string;
  subtitle?: string;
  overview: string;
  comprehensiveTheory: string; // Exhaustive GeeksforGeeks-grade theoretical deep dive
  modules: DaySubModuleItem[]; // Sub-topics inside this topic
  comparisonTable?: ComparisonTable;
  interviewQuestions?: InterviewQuestionItem[];
  assessment: DayAssessmentQuestion[]; // Topic-level assessment
}

// Alias for backwards compatibility if needed
export type DayModuleItem = DayTopicItem;

export interface YouTubeResourceItem {
  id: string;
  title: string;
  url: string;
  channel?: string;
  description?: string;
  language?: "English" | "Telugu";
  duration?: string;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  explanation?: string;
}

export interface PracticeProblem {
  id: string;
  problemNumber: number;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  exampleInput?: string;
  expectedOutput?: string;
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints?: string[];
  expectedTimeComplexity?: string;
  expectedSpaceComplexity?: string;
  interviewRelevance?: string;
  solutionHint?: string;
  starterCode?: string;
  starterCodes?: Record<string, string>;
  testCases?: TestCase[];
}

export interface StructuredLearnLesson {
  concept: string;
  whyItMatters: string;
  syntax: string;
  exampleCode: string;
  language?: string;
  lineByLineExplanation: Array<{
    line: string;
    explanation: string;
    whyWrittenThisWay?: string;
  }>;
  whyThisSyntax: string;
  commonMistakes: string[];
  timeComplexity?: string;
  spaceComplexity?: string;
  interviewConnection: {
    question: string;
    answer: string;
    whyAsked?: string;
  };
  quickCheck: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface CodeExecutionResult {
  status: "ACCEPTED" | "TESTS_PASSED" | "WRONG_ANSWER" | "COMPILATION_ERROR" | "RUNTIME_ERROR" | "TIME_LIMIT_EXCEEDED";
  passedTests: number;
  totalTests: number;
  testResults: Array<{
    id: string;
    passed: boolean;
    actualOutput?: string;
    expectedOutput: string;
    input: string;
    isHidden?: boolean;
    error?: string;
  }>;
  runtimeMs: number;
  memoryMb: number;
  stdout: string;
  aiExplanation?: {
    whyItWorks?: string;
    whatYouDidWell?: string;
    possibleImprovement?: string;
    interviewFollowUp?: string;
    failureReason?: string;
    hint?: string;
  };
}

export interface DayPlan {
  id: string;
  dayNumber: number;
  topic: string;
  description: string;
  skills: string[];
  topics?: DayTopicItem[];
  requiredModules?: DayTopicItem[]; // Alias for compatibility
  learnLesson?: StructuredLearnLesson;
  practiceProblems?: PracticeProblem[];
  youtubeResources?: YouTubeResourceItem[];
  learningResources: string[];
  assessment: DayAssessmentQuestion[];
}

export type DiagnosisStatus = "STRONG" | "DEVELOPING" | "WEAK" | "CRITICAL";

export interface ConceptPerformance {
  concept: string;
  topic: string;
  skill: string;
  score: number; // 0 - 100
  correct: number;
  total: number;
  status: DiagnosisStatus;
}

export interface TopicPerformance {
  topic: string;
  skill: string;
  score: number; // 0 - 100
  correct: number;
  total: number;
  status: DiagnosisStatus;
  concepts: Record<string, ConceptPerformance>;
}

export interface PracticeAttempt {
  problemId: string;
  dayId: string;
  skill: string;
  topic: string;
  difficulty: string;
  language: string;
  solved: boolean;
  attempts: number;
  timestamp?: string;
}

export interface PracticeProgress {
  totalProblems: number;
  solvedCount: number;
  practiceScore: number; // 0 - 100
  attempts: Record<string, PracticeAttempt>;
}

export interface NextMissionSuggestion {
  dayId: string;
  skill: string;
  topic: string;
  concept?: string;
  reason: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  estimatedMinutes: number;
  activities: string[];
  isRemediation: boolean;
}

export interface ReadinessScores {
  resumeFit: number;       // Resume vs Role match percentage (static baseline)
  skillReadiness: number;  // Empirical test + practice lab performance
  careerReadiness: number; // Combined weighted readiness
  confidence?: "LOW" | "MEDIUM" | "HIGH";
  projectReadiness?: number;
  interviewReadiness?: number;
  explanations?: {
    resumeFitReason: string;
    skillReadinessReason: string;
    careerReadinessReason: string;
    topStrengths: string[];
    topBlockers: string[];
  };
}

export interface DayDiagnosticReport {
  dayId: string;
  dayNumber: number;
  overallScore: number;
  passed: boolean;
  topicPerformance: Record<string, TopicPerformance>;
  conceptDiagnosis: Record<string, ConceptPerformance>;
  strongConcepts: string[];
  weakConcepts: string[];
  criticalConcepts: string[];
  whatWentWell: string[];
  needsAttention: string[];
  aiRecommendation: string;
  roadmapAdjusted: boolean;
  adjustmentMessage?: string;
  nextMission?: NextMissionSuggestion;
  completedAt: string;
}

export interface MissionStageProgress {
  dayId: string;
  weekId: string;
  dayNumber: number;
  learningCompleted: boolean;
  practiceCompleted: boolean;
  assessmentCompleted: boolean;
  score?: number;
  passed: boolean;
  weakAreas: string[];
  completedAt?: string;
  practiceProgress?: PracticeProgress;
  diagnosticReport?: DayDiagnosticReport;
}

export interface TopicResult {
  topicId: string;
  topicTitle: string;
  score: number;
  passed: boolean;
}

export interface DayResultQuestionReview {
  id: string;
  question: string;
  codeSnippet?: string;
  language?: string;
  options: string[];
  userAnswerIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  skill?: string;
  topic?: string;
  concept?: string;
  difficulty?: string;
  explanation?: string | QuestionExplanationBreakdown;
  explanationBreakdown?: QuestionExplanationBreakdown;
}

// Day result (stored after scoring)
export interface DayResult {
  dayId: string;
  dayNumber: number;
  score: number;
  passed: boolean; // score >= 70
  answers: Record<string, number>;
  topicResults?: Record<string, TopicResult>;
  completedAt: string;
  review?: DayResultQuestionReview[];
  attemptNumber?: number;
  weakAreas?: string[];
  diagnosticReport?: DayDiagnosticReport;
  practiceProgress?: PracticeProgress;
}

// Week with day results
export interface WeekProgress {
  weekId: string;
  dayResults: DayResult[];
  completedDays: number;
  totalDays: number;
}

export interface RoadmapData {
  weeks: WeekOverview[];
  daysData: Record<string, DayPlan>; // keyed by `${weekId}_${dayId}`
  dayResults: Record<string, DayResult>; // keyed by `${weekId}_${dayId}`
}

export interface RoadmapQuestionOption {
  id: string;
  label: string;
  subLabel?: string;
  value: string;
  weeks?: number;
  hours?: number;
}

export interface RoadmapQuestionItem {
  id: string;
  number: number;
  title: string;
  description: string;
  options: RoadmapQuestionOption[];
}

export interface RoadmapQuestionnaireData {
  targetRole?: string;
  currentLevel?: string;
  currentLanguage?: string;
  preferredLanguage?: string;
  hoursPerDay?: string | number;
  daysPerWeek?: string | number;
  targetTimeframe: string; // e.g. "8 Weeks (Fast-Track)"
  targetWeeks: number; // e.g. 8
  weeklyCommitment: string; // e.g. "15-20 hrs/week"
  weeklyHours: number; // e.g. 18
  dsaConfidence?: string;
  devConfidence?: string;
  interviewPrepLevel?: string;
  learningStyle: string;
  targetCompanyType?: "Product" | "Service" | "Startup" | "Any" | string;
  mainPriority?: string;
  currentKnowledge?: string;
  primaryObjective?: string;
  studySchedule?: string;
  focusSpecialization?: string;
  projectExperience?: string;
  biggestDifficulty?: string;
  biggestHurdle?: string;
  targetDeliverable?: string;
}

export interface AgentMilestone {
  week: number;
  title: string;
  goal: string;
}

export interface AgentRoadmapSummary {
  strategyTitle: string;
  timelineWeeks: number;
  weeklyHours: number;
  pace: string;
  keyFocusAreas: string[];
  strategicAdvice: string;
  milestones: AgentMilestone[];
}

export interface SkillEvidenceItem {
  skill: string;
  status: SkillStatus;
  confidence: number; // 0.0 to 1.0
  evidence: string;
}

export interface StructuredCareerProfile {
  education: string[];
  degree: string;
  branch: string;
  graduationYear?: string;
  experience: string[];
  internships: string[];
  projects: string[];
  programmingLanguages: string[];
  frameworks: string[];
  databases: string[];
  tools: string[];
  certifications: string[];
  achievements: string[];
  technicalSkills: SkillEvidenceItem[];
  rawTextSnippet?: string;
}

export interface RoleRequirement {
  roleName: string;
  coreSkills: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  projectExpectations: string[];
  interviewTopics: string[];
  minExpectedScore: number;
  skillWeights?: Record<string, number>;
}

export interface CareerDiscoveryMatch {
  roleName: string;
  matchPercentage: number; // 0 - 100
  whyItMatches: string[];
  strengths: string[];
  skillGaps: string[];
  recommendation: "STRONG_FIT" | "PREPARE" | "EXPLORE";
  summary: string;
}

export interface CareerAnalysis {
  targetRole: string;
  skills: SkillMatch[];
  strengths: string[];
  weaknesses: string[];
  alignmentScore: number;
  summary: string;
  roadmap: RoadmapModule[];
  roadmapData?: RoadmapData;
  fileName?: string;
  characters?: number;
  resumeText?: string;
  quizResult?: QuizResult;
  combinedAlignmentScore?: number;
  combinedSkills?: CombinedSkillEvaluation[];
  questionnaireAnswers?: RoadmapQuestionnaireData;
  agentPlanSummary?: AgentRoadmapSummary;
  studentSkillProfile?: StudentSkillProfile;
  todayMission?: TodayMissionItem;
  careerProfile?: StructuredCareerProfile;
  discoveryMatches?: CareerDiscoveryMatch[];
  resumeFitScore?: number;
  skillReadinessScore?: number;
  careerReadinessScore?: number;
  lastDiagnosticReport?: DayDiagnosticReport;
}

export interface JobOpportunityData {
  id: string;
  userId: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  fitScore: number;
  matchedSkills: string[];
  developingSkills: string[];
  missingSkills: string[];
  criticalGaps: string[];
  resumeAlignment?: string;
  applicationRecommendation?: string;
  recommendations: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SkillEvidenceClassification {
  skill: string;
  status: SkillStatus; // "STRONG" | "DEMONSTRATED" | "DEVELOPING" | "WEAK" | "MISSING" | "NOT_DEMONSTRATED"
  evidence?: string;
  reason?: string;
}

export interface JobAnalysisResult {
  companyName: string;
  jobTitle: string;
  fitScore: number; // 0-100 (Profile / JD alignment only, NOT hiring probability)
  strongMatches: SkillEvidenceClassification[];
  developing: SkillEvidenceClassification[];
  missingOrNotDemonstrated: SkillEvidenceClassification[];
  criticalGaps: string[];
  resumeAlignment: string[];
  applicationRecommendation: string;
  recommendations: string[];
}

export interface RoleFitDeepDive {
  roleName: string;
  suitabilityScore: number;
  whyItFits: string[];
  strongMatches: SkillEvidenceClassification[];
  developingSkills: SkillEvidenceClassification[];
  missingSkills: SkillEvidenceClassification[];
  biggestGaps: string[];
  recommendedNextSteps: string[];
}


