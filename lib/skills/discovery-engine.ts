import { StructuredCareerProfile, CareerDiscoveryMatch, RoleRequirement } from "@/types";
import { ROLE_REQUIREMENTS } from "./role-requirements";

/**
 * Transparent Scoring & Role Matching Engine.
 *
 * The match percentage means "Profile alignment with this role", NOT "Probability of hiring".
 *
 * Scoring model components:
 * 1. Required Core Skill Coverage (50% weight)
 * 2. Preferred/Secondary Skill Coverage (25% weight)
 * 3. Evidence Strength & Project Demonstrations (15% weight)
 * 4. Experience & Domain Relevance (10% weight)
 *
 * Output normalized from 0 to 100.
 */
export function matchProfileToRoles(
  profile: StructuredCareerProfile,
  resumeText: string = ""
): CareerDiscoveryMatch[] {
  const lowerResume = resumeText.toLowerCase();
  const allDetectedSkills = new Set(
    profile.technicalSkills.map((s) => s.skill.toLowerCase())
  );

  const matches: CareerDiscoveryMatch[] = Object.values(ROLE_REQUIREMENTS).map((req) => {
    // 1. Core Skill Coverage
    const matchedCore: string[] = [];
    const missingCore: string[] = [];

    req.coreSkills.forEach((skill) => {
      const sLower = skill.toLowerCase();
      const isPresent =
        allDetectedSkills.has(sLower) ||
        lowerResume.includes(sLower) ||
        checkSkillAliases(sLower, lowerResume);

      if (isPresent) {
        matchedCore.push(skill);
      } else {
        missingCore.push(skill);
      }
    });

    const coreCoverageRatio = req.coreSkills.length > 0 ? matchedCore.length / req.coreSkills.length : 0;
    const coreScore = coreCoverageRatio * 50;

    // 2. Preferred / Secondary Skill Coverage
    const matchedPreferred: string[] = [];
    const missingPreferred: string[] = [];

    req.preferredSkills.forEach((skill) => {
      const sLower = skill.toLowerCase();
      const isPresent =
        allDetectedSkills.has(sLower) ||
        lowerResume.includes(sLower) ||
        checkSkillAliases(sLower, lowerResume);

      if (isPresent) {
        matchedPreferred.push(skill);
      } else {
        missingPreferred.push(skill);
      }
    });

    const preferredCoverageRatio = req.preferredSkills.length > 0 ? matchedPreferred.length / req.preferredSkills.length : 0;
    const preferredScore = preferredCoverageRatio * 25;

    // 3. Evidence Strength
    let evidenceScore = 0;
    const demonstratedCount = profile.technicalSkills.filter(
      (s) => s.status === "DEMONSTRATED"
    ).length;
    if (demonstratedCount >= 4) evidenceScore += 10;
    else if (demonstratedCount >= 2) evidenceScore += 6;
    else if (demonstratedCount >= 1) evidenceScore += 3;

    if (profile.projects.length >= 2) evidenceScore += 5;
    else if (profile.projects.length >= 1) evidenceScore += 3;

    // 4. Experience Relevance
    let experienceScore = 0;
    if (profile.experience.length > 0 || profile.internships.length > 0) {
      experienceScore = 10;
    } else if (profile.projects.length >= 3) {
      experienceScore = 6;
    } else {
      experienceScore = 3;
    }

    // Total raw alignment score (0 - 100)
    let totalScore = Math.round(coreScore + preferredScore + evidenceScore + experienceScore);
    totalScore = Math.min(96, Math.max(18, totalScore));

    // Recommendation logic
    let recommendation: "STRONG_FIT" | "PREPARE" | "EXPLORE" = "PREPARE";
    if (totalScore >= 72) {
      recommendation = "STRONG_FIT";
    } else if (totalScore >= 45) {
      recommendation = "PREPARE";
    } else {
      recommendation = "EXPLORE";
    }

    // Construct Strengths & Why it Matches
    const strengths = matchedCore.slice(0, 4);
    const whyItMatches = [
      ...matchedCore.slice(0, 4),
      ...matchedPreferred.slice(0, 2),
    ];

    // Identify critical gaps
    const skillGaps = [
      ...missingCore.slice(0, 3),
      ...missingPreferred.slice(0, 2),
    ];

    let summary = "";
    if (recommendation === "STRONG_FIT") {
      summary = `High baseline competency. You have demonstrated ${matchedCore.length} of ${req.coreSkills.length} core foundational pillars.`;
    } else if (recommendation === "PREPARE") {
      summary = `Viable trajectory. Target your primary gaps in ${skillGaps.slice(0, 2).join(" & ")} to attain production readiness.`;
    } else {
      summary = `Emerging alignment. Requires foundational study across core curriculum pillars before targeting this specialization.`;
    }

    return {
      roleName: req.roleName,
      matchPercentage: totalScore,
      whyItMatches: whyItMatches.length > 0 ? whyItMatches : ["General engineering aptitude"],
      strengths: strengths.length > 0 ? strengths : ["Undergraduate foundational coursework"],
      skillGaps: skillGaps.length > 0 ? skillGaps : ["Specialized system architecture"],
      recommendation,
      summary,
    };
  });

  // Sort ranked roles by highest match percentage first
  return matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
}

/**
 * Skill alias mapper for robust zero-failure resume phrase detection
 */
function checkSkillAliases(skill: string, text: string): boolean {
  const aliases: Record<string, string[]> = {
    dsa: ["data structures", "algorithms", "leetcode", "problem solving"],
    programming: ["python", "java", "c++", "javascript", "typescript", "golang"],
    oop: ["object-oriented", "object oriented", "design patterns", "inheritance"],
    dbms: ["database", "rdbms", "relational database", "acid", "mysql", "postgres"],
    sql: ["mysql", "postgresql", "postgres", "sqlite", "oracle"],
    "operating systems": ["linux", "unix", "threads", "processes"],
    "computer networks": ["networking", "tcp/ip", "http", "https", "dns", "rest api"],
    "system design": ["distributed systems", "microservices", "caching", "scalability"],
    "rest apis": ["rest api", "restful", "fastapi", "express", "endpoints"],
    "backend framework": ["fastapi", "django", "express", "spring boot", "nestjs"],
    testing: ["unit testing", "jest", "pytest", "junit", "tdd", "e2e"],
    cloud: ["aws", "gcp", "azure", "docker", "cloud computing"],
  };

  const list = aliases[skill] || [];
  return list.some((term) => text.includes(term));
}
