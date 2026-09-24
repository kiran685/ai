import { z } from "zod";
import { generateGeminiJson } from "@/lib/ai/gemini";
import { JobAnalysisResult, SkillEvidenceClassification } from "@/types";
import { extractStructuredCareerProfile } from "@/lib/skills/profile-extractor";

export const JobAnalysisInputSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  jobDescription: z.string().min(20, "Job description must be at least 20 characters"),
  resumeText: z.string().min(20, "Resume text must be at least 20 characters"),
});

export type JobAnalysisInput = z.infer<typeof JobAnalysisInputSchema>;

const JobAnalysisResultSchema = z.object({
  fitScore: z.number().min(10).max(98),
  strongMatches: z.array(
    z.object({
      skill: z.string(),
      status: z.enum(["STRONG", "DEMONSTRATED", "DEVELOPING", "WEAK", "MISSING", "NOT_DEMONSTRATED"]),
      evidence: z.string().optional(),
    })
  ),
  developing: z.array(
    z.object({
      skill: z.string(),
      status: z.enum(["STRONG", "DEMONSTRATED", "DEVELOPING", "WEAK", "MISSING", "NOT_DEMONSTRATED"]),
      evidence: z.string().optional(),
    })
  ),
  missingOrNotDemonstrated: z.array(
    z.object({
      skill: z.string(),
      status: z.enum(["STRONG", "DEMONSTRATED", "DEVELOPING", "WEAK", "MISSING", "NOT_DEMONSTRATED"]),
      reason: z.string().optional(),
    })
  ),
  criticalGaps: z.array(z.string()),
  resumeAlignment: z.array(z.string()),
  applicationRecommendation: z.string(),
  recommendations: z.array(z.string()),
});

/**
 * Deterministic local opportunity analysis fallback when AI is unavailable or fails.
 */
function evaluateDeterministicJobMatch(input: JobAnalysisInput): JobAnalysisResult {
  const profile = extractStructuredCareerProfile(input.resumeText);
  const jdLower = input.jobDescription.toLowerCase();
  const resumeLower = input.resumeText.toLowerCase();

  const standardTechs = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "SQL",
    "React", "Node.js", "Next.js", "Express", "FastAPI", "Django", "Spring Boot",
    "PostgreSQL", "MongoDB", "MySQL", "Redis", "Docker", "Kubernetes", "AWS",
    "GCP", "Azure", "Linux", "Git", "REST API", "GraphQL", "CI/CD", "Testing",
    "DSA", "Algorithms", "System Design", "Microservices", "Data Structures",
    "OOP", "Object-Oriented Programming"
  ];

  // Find technologies mentioned in JD
  const jdKeywords = standardTechs.filter((tech) => {
    const tLower = tech.toLowerCase();
    return jdLower.includes(tLower);
  });

  const jdTargetSkills = jdKeywords.length > 0 ? jdKeywords : ["Programming", "Problem Solving", "Databases", "APIs", "Git"];

  const strongMatches: SkillEvidenceClassification[] = [];
  const developing: SkillEvidenceClassification[] = [];
  const missingOrNotDemonstrated: SkillEvidenceClassification[] = [];

  let matchedScore = 0;

  jdTargetSkills.forEach((skill) => {
    const sLower = skill.toLowerCase();
    const foundInProfile = profile.technicalSkills.find((t) => t.skill.toLowerCase() === sLower);
    const mentionsInResume = resumeLower.includes(sLower);

    if (foundInProfile && foundInProfile.status === "DEMONSTRATED") {
      strongMatches.push({
        skill,
        status: "DEMONSTRATED",
        evidence: foundInProfile.evidence || "Applied in projects and work experience",
      });
      matchedScore += 3;
    } else if (foundInProfile && foundInProfile.status === "DEVELOPING") {
      developing.push({
        skill,
        status: "DEVELOPING",
        evidence: foundInProfile.evidence || "Mentioned with basic context",
      });
      matchedScore += 1.5;
    } else if (mentionsInResume) {
      developing.push({
        skill,
        status: "DEVELOPING",
        evidence: "Mentioned in resume without substantial project evidence",
      });
      matchedScore += 1.5;
    } else {
      missingOrNotDemonstrated.push({
        skill,
        status: "NOT_DEMONSTRATED",
        reason: `Explicitly required in ${input.companyName}'s job description`,
      });
    }
  });

  const maxScore = jdTargetSkills.length * 3;
  let fitScore = maxScore > 0 ? Math.round((matchedScore / maxScore) * 100) : 65;
  fitScore = Math.min(94, Math.max(25, fitScore));

  const criticalGaps = missingOrNotDemonstrated.map((s) => s.skill).slice(0, 4);
  if (criticalGaps.length === 0 && developing.length > 0) {
    criticalGaps.push(...developing.map((s) => `${s.skill} (practical depth)`).slice(0, 3));
  }

  const resumeAlignment = [
    `Highlight your experience with ${strongMatches.map((s) => s.skill).slice(0, 2).join(" and ") || "core languages"} at the top of your experience bullets.`,
    `Emphasize project implementation details matching ${input.companyName}'s requirements.`,
    `Include measurable performance metrics (e.g. latency, scale, or accuracy) in your project descriptions.`,
  ];

  let applicationRecommendation = `Moderate fit (${fitScore}%) — apply, but prioritize ${criticalGaps[0] || "core interview competencies"} preparation before technical rounds.`;
  if (fitScore >= 75) {
    applicationRecommendation = `Strong alignment (${fitScore}%) — profile demonstrates core requirements for ${input.companyName}. Proceed with application and review system design.`;
  } else if (fitScore < 50) {
    applicationRecommendation = `Emerging fit (${fitScore}%) — consider bridging critical gaps in ${criticalGaps.slice(0, 2).join(" & ")} before applying.`;
  }

  const recommendations = [
    `Prepare a targeted project showcasing ${criticalGaps.slice(0, 2).join(" & ")}`,
    `Review typical technical interview questions for ${input.jobTitle} at ${input.companyName}`,
    `Execute adaptive daily missions in AI Career OS to close identified priority gaps`,
  ];

  return {
    companyName: input.companyName,
    jobTitle: input.jobTitle,
    fitScore,
    strongMatches,
    developing,
    missingOrNotDemonstrated,
    criticalGaps,
    resumeAlignment,
    applicationRecommendation,
    recommendations,
  };
}

/**
 * Analyzes a candidate's resume against a specific target Job Description.
 */
export async function analyzeJobOpportunity(input: JobAnalysisInput): Promise<JobAnalysisResult> {
  const fallback = evaluateDeterministicJobMatch(input);

  const prompt = `
You are an expert technical recruiter and senior engineering manager analyzing a candidate's resume against a specific job posting.

IMPORTANT REQUIREMENTS:
1. NEVER hallucinate or invent skills, degrees, or experience for the candidate.
2. The fitScore represents PROFILE VS JOB DESCRIPTION ALIGNMENT ONLY (0 to 100). It is NOT a hiring probability.
3. Every skill must be classified as one of:
   - "STRONG" or "DEMONSTRATED": solidly backed by projects, work history, or solid evidence in the resume.
   - "DEVELOPING": mentioned in resume but limited depth/practice evidence.
   - "MISSING" or "NOT_DEMONSTRATED": required/preferred by JD but not found in candidate's resume.
4. Identify 2-4 critical gaps required for this role.
5. Provide actionable resume alignment suggestions (how to present existing experience better for this role).
6. Provide an honest application recommendation (e.g. "Reasonable fit — apply, but prioritize DSA preparation").

TARGET COMPANY: ${input.companyName}
TARGET JOB TITLE: ${input.jobTitle}

JOB DESCRIPTION:
"""
${input.jobDescription.slice(0, 4000)}
"""

CANDIDATE RESUME TEXT:
"""
${input.resumeText.slice(0, 4000)}
"""

Return JSON conforming strictly to this format:
{
  "fitScore": number (20-95),
  "strongMatches": [{"skill": string, "status": "DEMONSTRATED", "evidence": string}],
  "developing": [{"skill": string, "status": "DEVELOPING", "evidence": string}],
  "missingOrNotDemonstrated": [{"skill": string, "status": "NOT_DEMONSTRATED", "reason": string}],
  "criticalGaps": [string],
  "resumeAlignment": [string],
  "applicationRecommendation": string,
  "recommendations": [string]
}
`;

  try {
    const aiOutput = await generateGeminiJson<unknown>(prompt, fallback, {
      temperature: 0.2,
    });

    const parsed = JobAnalysisResultSchema.safeParse(aiOutput);
    if (parsed.success) {
      return {
        companyName: input.companyName,
        jobTitle: input.jobTitle,
        fitScore: parsed.data.fitScore,
        strongMatches: parsed.data.strongMatches as SkillEvidenceClassification[],
        developing: parsed.data.developing as SkillEvidenceClassification[],
        missingOrNotDemonstrated: parsed.data.missingOrNotDemonstrated as SkillEvidenceClassification[],
        criticalGaps: parsed.data.criticalGaps,
        resumeAlignment: parsed.data.resumeAlignment,
        applicationRecommendation: parsed.data.applicationRecommendation,
        recommendations: parsed.data.recommendations,
      };
    }
  } catch (error) {
    console.warn("AI Job Opportunity Analysis failed, using fallback:", error);
  }

  return fallback;
}
