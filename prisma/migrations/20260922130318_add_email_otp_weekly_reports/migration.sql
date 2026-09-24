-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "password" TEXT,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 1,
    "onboardingData" TEXT,
    "weeklyReportEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastWeeklyReportSent" DATETIME
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CareerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "alignmentScore" INTEGER,
    "combinedAlignmentScore" INTEGER,
    "summary" TEXT,
    "strengths" TEXT,
    "weaknesses" TEXT,
    "questionnaireAnswers" TEXT,
    "agentPlanSummary" TEXT,
    "readinessDetails" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CareerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "characters" INTEGER,
    "content" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResumeAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT,
    "targetRole" TEXT NOT NULL,
    "alignmentScore" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "strengths" TEXT NOT NULL,
    "weaknesses" TEXT NOT NULL,
    "rawAnalysis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResumeAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResumeAnalysis_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "difficulty" TEXT DEFAULT 'Intermediate',
    "prerequisites" TEXT,
    "concepts" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "found" BOOLEAN NOT NULL DEFAULT false,
    "evidence" TEXT,
    "category" TEXT,
    "quizConfidence" TEXT,
    "quizScore" INTEGER,
    "resumeEvidence" INTEGER DEFAULT 0,
    "practiceScore" INTEGER DEFAULT 0,
    "assessmentScore" INTEGER DEFAULT 0,
    "missionCompletion" INTEGER DEFAULT 0,
    "projectEvidence" INTEGER DEFAULT 0,
    "currentScore" INTEGER DEFAULT 0,
    "confidenceLevel" TEXT DEFAULT 'LOW',
    "conceptScores" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkillEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "conceptId" TEXT,
    "evidenceType" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "weight" REAL NOT NULL DEFAULT 1.0,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SkillEvidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "dayNumber" INTEGER,
    "weekId" TEXT,
    "topicId" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "answers" TEXT NOT NULL,
    "skillScores" TEXT,
    "review" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Assessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkillGap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "severity" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SkillGap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SkillGap_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Roadmap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "strategyTitle" TEXT,
    "timelineWeeks" INTEGER NOT NULL DEFAULT 8,
    "weeklyHours" INTEGER NOT NULL DEFAULT 18,
    "pace" TEXT,
    "strategicAdvice" TEXT,
    "weeksData" TEXT NOT NULL,
    "daysData" TEXT,
    "dayResults" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Roadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoadmapItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roadmapId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "dayNumber" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RoadmapItem_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyMission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyMission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "completedDays" INTEGER NOT NULL DEFAULT 0,
    "totalDays" INTEGER NOT NULL DEFAULT 5,
    "overallProgress" REAL NOT NULL DEFAULT 0.0,
    "history" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rating" INTEGER,
    "content" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobOpportunity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "fitScore" INTEGER NOT NULL,
    "matchedSkills" TEXT NOT NULL,
    "developingSkills" TEXT,
    "missingSkills" TEXT NOT NULL,
    "criticalGaps" TEXT NOT NULL,
    "resumeAlignment" TEXT,
    "applicationRecommendation" TEXT,
    "recommendations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobOpportunity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CareerFitResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "recommendedRoles" TEXT NOT NULL,
    "selectedRole" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CareerFitResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "sessionId" TEXT NOT NULL,
    "anonymousId" TEXT,
    "userId" TEXT,
    "onboardingVariant" TEXT NOT NULL,
    "step" INTEGER,
    "stepName" TEXT,
    "durationMs" INTEGER,
    "selectedRole" TEXT,
    "errorCode" TEXT,
    "route" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailOtp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserSkill_userId_skillId_key" ON "UserSkill"("userId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillEvidence_idempotencyKey_key" ON "SkillEvidence"("idempotencyKey");

-- CreateIndex
CREATE INDEX "SkillEvidence_userId_skillName_idx" ON "SkillEvidence"("userId", "skillName");

-- CreateIndex
CREATE INDEX "SkillEvidence_userId_evidenceType_idx" ON "SkillEvidence"("userId", "evidenceType");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsEvent_eventId_key" ON "AnalyticsEvent"("eventId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventName_occurredAt_idx" ON "AnalyticsEvent"("eventName", "occurredAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_occurredAt_idx" ON "AnalyticsEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_onboardingVariant_eventName_idx" ON "AnalyticsEvent"("onboardingVariant", "eventName");

-- CreateIndex
CREATE INDEX "EmailOtp_userId_idx" ON "EmailOtp"("userId");

-- CreateIndex
CREATE INDEX "EmailOtp_email_createdAt_idx" ON "EmailOtp"("email", "createdAt");
