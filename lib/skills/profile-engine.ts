import {
  StudentSkillProfile,
  StudentSkillItem,
  SkillGapItem,
  SkillStatus,
  ResumeSkillStatus,
  SkillMatch,
  QuizResult,
  PracticeProgress,
  DayDiagnosticReport,
} from "@/types";
import { getRoleRequirements } from "./target-roles";

interface ProfileEngineInput {
  targetRole: string;
  resumeText?: string;
  resumeSkills?: SkillMatch[];
  quizResult?: QuizResult | null;
  practiceProgress?: PracticeProgress;
  dayDiagnosticReports?: DayDiagnosticReport[];
}

/**
 * Extracts verifiable resume status and quote evidence without hallucination.
 */
export function extractResumeSkillEvidence(
  skill: string,
  resumeText: string = ""
): { status: ResumeSkillStatus; evidence: string } {
  if (!resumeText) {
    return { status: "MISSING", evidence: "No resume text provided." };
  }

  const lowerText = resumeText.toLowerCase();
  const lowerSkill = skill.toLowerCase();

  // Handle aliases
  const aliases: Record<string, string[]> = {
    dsa: ["dsa", "data structures", "algorithms", "leetcode", "competitive programming"],
    programming: ["programming", "python", "java", "c++", "javascript", "typescript", "golang"],
    oop: ["oop", "object-oriented", "object oriented", "design patterns", "inheritance", "polymorphism"],
    dbms: ["dbms", "database", "rdbms", "relational database", "acid"],
    sql: ["sql", "mysql", "postgresql", "postgres", "sqlite", "oracle sql"],
    "operating systems": ["operating systems", "os", "linux", "unix", "threads", "processes"],
    "computer networks": ["computer networks", "networking", "tcp/ip", "http", "https", "dns", "sockets"],
    "system design": ["system design", "distributed systems", "microservices", "caching", "scalability", "load balancing"],
    git: ["git", "github", "gitlab", "version control", "rebase"],
    testing: ["testing", "unit testing", "jest", "vitest", "pytest", "junit", "tdd", "e2e"],
  };

  const searchTerms = aliases[lowerSkill] || [lowerSkill];
  const matchedTerm = searchTerms.find((term) => lowerText.includes(term));

  if (!matchedTerm) {
    return { status: "MISSING", evidence: `Skill '${skill}' not found in resume.` };
  }

  // Find exact snippet around the matched term
  const matchIndex = lowerText.indexOf(matchedTerm);
  const contextStart = Math.max(0, matchIndex - 60);
  const contextEnd = Math.min(resumeText.length, matchIndex + matchedTerm.length + 80);
  const rawContext = resumeText.substring(contextStart, contextEnd).trim();

  // Check if it appears in projects/work experience with action verbs vs merely a keyword list
  const actionVerbRegex = /(built|developed|engineered|implemented|designed|created|optimized|deployed|architected|maintained|integrated)/i;
  const projectContextRegex = /(project|experience|intern|work|application|pipeline|system|service)/i;

  const linesWithTerm = resumeText.split("\n").filter((line) => line.toLowerCase().includes(matchedTerm));
  const fullLine = linesWithTerm[0]?.trim() || rawContext;

  const hasAction = actionVerbRegex.test(rawContext) || actionVerbRegex.test(fullLine);
  const hasProject = projectContextRegex.test(rawContext) || projectContextRegex.test(fullLine);

  if (hasAction || (hasProject && fullLine.length > 30)) {
    return {
      status: "DEMONSTRATED",
      evidence: fullLine.length > 120 ? `${fullLine.substring(0, 120)}...` : fullLine,
    };
  }

  return {
    status: "CLAIMED",
    evidence: `Mentioned in resume: "${fullLine.length > 100 ? fullLine.substring(0, 100) + '...' : fullLine}"`,
  };
}

/**
 * Builds the comprehensive Student Skill Profile and Skill Gap Matrix.
 * Synthesizes: Resume Evidence (DEMONSTRATED vs CLAIMED) + Assessment Performance (skill & topic breakdown) + Target Role Requirements.
 */
export function buildStudentSkillProfile(input: ProfileEngineInput): StudentSkillProfile {
  const roleProfile = getRoleRequirements(input.targetRole);
  const resumeText = input.resumeText || "";
  const quizScores = input.quizResult?.skillScores || [];

  const studentSkills: StudentSkillItem[] = roleProfile.skills.map((req) => {
    // 1. Resume extraction
    const resumeInfo = extractResumeSkillEvidence(req.skill, resumeText);

    // 2. Assessment score lookup from onboarding quiz or daily diagnostic reports
    const quizMatch = quizScores.find(
      (qs) =>
        qs.skill.toLowerCase() === req.skill.toLowerCase() ||
        req.skill.toLowerCase().includes(qs.skill.toLowerCase()) ||
        qs.skill.toLowerCase().includes(req.skill.toLowerCase())
    );

    // Look up day diagnostic reports for this skill
    let diagScore: number | null = null;
    let diagWeakTopics: string[] = [];
    let diagStrongTopics: string[] = [];

    if (input.dayDiagnosticReports && input.dayDiagnosticReports.length > 0) {
      const relevantReports = input.dayDiagnosticReports.filter(
        (r) =>
          Object.values(r.topicPerformance).some(
            (tp) =>
              tp.skill.toLowerCase().includes(req.skill.toLowerCase()) ||
              req.skill.toLowerCase().includes(tp.skill.toLowerCase())
          ) ||
          Object.values(r.conceptDiagnosis).some((cp) =>
            cp.skill.toLowerCase().includes(req.skill.toLowerCase())
          )
      );

      if (relevantReports.length > 0) {
        const latest = relevantReports[relevantReports.length - 1];
        diagScore = latest.overallScore;
        diagWeakTopics = [...latest.weakConcepts, ...latest.criticalConcepts];
        diagStrongTopics = latest.strongConcepts;
      }
    }

    const empiricalScore = diagScore !== null ? diagScore : (quizMatch?.score ?? null);
    const hasEmpiricalScore = empiricalScore !== null;

    // Check practice lab evidence for this skill
    let practiceSolvedForSkill = 0;
    if (input.practiceProgress?.attempts) {
      practiceSolvedForSkill = Object.values(input.practiceProgress.attempts).filter(
        (a) => a.solved && (a.skill.toLowerCase().includes(req.skill.toLowerCase()) || req.skill.toLowerCase().includes(a.skill.toLowerCase()))
      ).length;
    }

    // 3. Score synthesis:
    // Empirical diagnostic assessment is high-signal proof of ability.
    // Practice labs add verified proof of hands-on application.
    // Resume evidence grants credibility only when corroborated.
    let finalScore = 0;
    let confidence: "strong" | "weak" | "none" = "none";

    if (hasEmpiricalScore && empiricalScore !== null) {
      if (resumeInfo.status === "DEMONSTRATED") {
        // High assessment + Demonstrated project = Peak confidence
        finalScore = Math.round(empiricalScore * 0.70 + 20 + Math.min(10, practiceSolvedForSkill * 3));
        confidence = empiricalScore >= 60 ? "strong" : "weak";
      } else if (resumeInfo.status === "CLAIMED") {
        finalScore = Math.round(empiricalScore * 0.80 + 10 + Math.min(10, practiceSolvedForSkill * 3));
        confidence = empiricalScore >= 70 ? "strong" : "weak";
      } else {
        // Demonstrated through test/practice without resume mention
        finalScore = Math.round(empiricalScore * 0.90 + Math.min(10, practiceSolvedForSkill * 3));
        confidence = empiricalScore >= 70 ? "strong" : "weak";
      }
    } else {
      // No assessment score available yet (preliminary resume baseline)
      if (resumeInfo.status === "DEMONSTRATED") {
        finalScore = 65 + Math.min(15, practiceSolvedForSkill * 5);
        confidence = practiceSolvedForSkill > 0 ? "strong" : "weak";
      } else if (resumeInfo.status === "CLAIMED") {
        finalScore = 45 + Math.min(15, practiceSolvedForSkill * 5);
        confidence = practiceSolvedForSkill > 0 ? "weak" : "none";
      } else {
        finalScore = 15 + Math.min(25, practiceSolvedForSkill * 5);
        confidence = practiceSolvedForSkill > 0 ? "weak" : "none";
      }
    }

    finalScore = Math.min(100, Math.max(0, finalScore));

    // 4. Status determination
    let status: SkillStatus = "NOT_DEMONSTRATED";
    if (finalScore >= req.expectedScore) {
      status = hasEmpiricalScore && resumeInfo.status === "DEMONSTRATED" ? "DEMONSTRATED" : "STRONG";
    } else if (finalScore >= req.expectedScore - 20) {
      status = "DEVELOPING";
    } else if (finalScore >= 35) {
      status = "WEAK";
    } else {
      status = resumeInfo.status === "MISSING" ? "MISSING" : "NOT_DEMONSTRATED";
    }

    // 5. Topics
    const strongTopics = Array.from(new Set([...(quizMatch?.strongTopics || []), ...diagStrongTopics]));
    const weakTopics = Array.from(new Set([
      ...(diagWeakTopics.length > 0 ? diagWeakTopics : (quizMatch?.weakTopics || [])),
      ...(status === "WEAK" || status === "MISSING" ? req.topics.slice(0, 3) : [])
    ]));

    return {
      skill: req.skill,
      score: finalScore,
      expectedScore: req.expectedScore,
      importance: req.importance,
      status,
      resumeStatus: resumeInfo.status,
      confidence,
      evidence: resumeInfo.evidence,
      strongTopics,
      weakTopics,
    };
  });

  // 6. Skill Gap Analysis
  const gaps: SkillGapItem[] = studentSkills.map((s) => {
    const gapScore = Math.max(0, s.expectedScore - s.score);

    // Priority formula:
    // Critical importance + large gap = High Priority
    // Low score on critical skill takes absolute precedence
    const isCritical = s.importance === "CRITICAL" && (s.status === "WEAK" || s.status === "MISSING" || s.score < s.expectedScore);
    const isHighImportance = s.importance === "HIGH" && (s.status === "WEAK" || s.status === "MISSING" || gapScore > 15);
    const isPriority = isCritical || isHighImportance;

    let reason = "";
    if (s.status === "STRONG") {
      reason = `Exceeds target benchmark (${s.score}% vs ${s.expectedScore}% required).`;
    } else if (s.importance === "CRITICAL") {
      reason = `Critical foundation for ${input.targetRole} (${s.score}% vs ${s.expectedScore}% required). Must be prioritized first.`;
    } else if (s.status === "MISSING") {
      reason = `No evidence found in resume or assessment. Essential requirement for ${input.targetRole}.`;
    } else {
      reason = `Currently at ${s.score}%. Needs improvement to reach expected ${s.expectedScore}%.`;
    }

    return {
      skill: s.skill,
      currentScore: s.score,
      requiredScore: s.expectedScore,
      gapScore,
      importance: s.importance,
      status: s.status,
      isPriority,
      reason,
    };
  });

  // Sort priority gaps: CRITICAL first, then by highest gapScore
  const importanceOrder: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const sortedPriorityGaps = gaps
    .filter((g) => g.isPriority)
    .sort((a, b) => {
      const impDiff = (importanceOrder[b.importance] || 0) - (importanceOrder[a.importance] || 0);
      if (impDiff !== 0) return impDiff;
      return b.gapScore - a.gapScore;
    });

  const strongSkills = studentSkills.filter((s) => s.status === "STRONG");
  const developingSkills = studentSkills.filter((s) => s.status === "DEVELOPING");
  const weakSkills = studentSkills.filter((s) => s.status === "WEAK");
  const missingSkills = studentSkills.filter((s) => s.status === "MISSING" || s.status === "NOT_DEMONSTRATED");

  const overallReadiness = Math.round(
    studentSkills.reduce((acc, s) => acc + s.score, 0) / studentSkills.length
  );

  return {
    targetRole: input.targetRole,
    overallReadiness,
    skills: studentSkills,
    strongSkills,
    developingSkills,
    weakSkills,
    missingSkills,
    priorityGaps: sortedPriorityGaps,
  };
}
