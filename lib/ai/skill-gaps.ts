import { SkillGap, SkillGapInput, SkillPriority } from "./types";
import { generateGeminiJson } from "./gemini";

/**
 * Creates fallback skill gaps based on input data and target role.
 */
function createFallbackSkillGaps(input: SkillGapInput): SkillGap[] {
  const missing = input.resumeAnalysis.missingSkills || [];
  const weaknesses = input.resumeAnalysis.weaknesses || [];

  const defaultSkillsByRole: Record<string, Array<{ skill: string; reason: string }>> = {
    "Software Engineer": [
      { skill: "Data Structures & Algorithms", reason: "Fundamental for technical problem-solving and coding interviews." },
      { skill: "System Design & Architecture", reason: "Crucial for building scalable, high-availability services." },
      { skill: "CI/CD & Automated Testing", reason: "Mandatory for modern production software deployments." },
    ],
    "AI / ML Engineer": [
      { skill: "MLOps & Model Registry", reason: "Essential for packaging and monitoring models in production." },
      { skill: "PyTorch Deep Learning Foundations", reason: "Core framework for neural network and transformer architectures." },
      { skill: "Distributed Training & GPUs", reason: "Required for scaling large model training runs." },
    ],
  };

  const pool = defaultSkillsByRole[input.targetRole] || [
    { skill: "Core Architectural Patterns", reason: `Key requirement for senior level ${input.targetRole} roles.` },
    { skill: "Production Deployment & Observability", reason: "Vital for end-to-end operational responsibility." },
    { skill: "Automated Testing & Reliability", reason: "Ensures production code correctness and team velocity." },
  ];

  const gaps: SkillGap[] = [];

  // Add missing skills from resume
  missing.slice(0, 3).forEach((skill, idx) => {
    gaps.push({
      skill,
      currentLevel: "None",
      targetLevel: "Proficient",
      priority: idx === 0 ? "HIGH" : "MEDIUM",
      reason: `Identified as a critical missing skill for ${input.targetRole}.`,
    });
  });

  // Add from weakness items or default pool
  pool.forEach((item, idx) => {
    if (!gaps.some((g) => g.skill.toLowerCase() === item.skill.toLowerCase())) {
      gaps.push({
        skill: item.skill,
        currentLevel: "Beginner",
        targetLevel: "Advanced",
        priority: idx === 0 ? "HIGH" : idx === 1 ? "MEDIUM" : "LOW",
        reason: item.reason,
      });
    }
  });

  return sortSkillGaps(gaps);
}

/**
 * Ensures skill gaps are strictly sorted: HIGH > MEDIUM > LOW.
 */
function sortSkillGaps(gaps: SkillGap[]): SkillGap[] {
  const priorityOrder: Record<SkillPriority, number> = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2,
  };

  return [...gaps].sort((a, b) => {
    const pA = priorityOrder[a.priority] ?? 1;
    const pB = priorityOrder[b.priority] ?? 1;
    return pA - pB;
  });
}

/**
 * Identifies and prioritizes technical skill gaps for a candidate.
 *
 * @param input Target role, resume analysis, and any quiz assessment scores.
 * @returns Sorted array of SkillGap objects.
 */
export async function identifySkillGaps(
  input: SkillGapInput
): Promise<SkillGap[]> {
  const fallback = createFallbackSkillGaps(input);

  const prompt = `
You are a principal technical interviewer and engineering lead. Analyze the candidate's verified skills, missing skills, and assessment scores against expectations for the target role: "${input.targetRole}".

Target Role: ${input.targetRole}
Existing Skills: ${JSON.stringify(input.resumeAnalysis.technicalSkills || input.resumeAnalysis.skills || [])}
Identified Missing Skills: ${JSON.stringify(input.resumeAnalysis.missingSkills || [])}
Identified Weaknesses: ${JSON.stringify(input.resumeAnalysis.weaknesses || [])}
Assessment Scores: ${JSON.stringify(input.assessmentScores || {})}

Identify the most critical skill gaps the candidate must close to qualify for "${input.targetRole}".
Rank them in descending order of priority: HIGH first, then MEDIUM, then LOW.

Return your analysis strictly in JSON format as an array of objects matching this schema:
[
  {
    "skill": "Name of the skill or technology (e.g. Distributed Caching, PyTorch, Docker)",
    "currentLevel": "None" | "Beginner" | "Intermediate",
    "targetLevel": "Proficient" | "Advanced" | "Expert",
    "priority": "HIGH" | "MEDIUM" | "LOW",
    "reason": "Specific technical justification explaining why this gap blocks them from succeeding as a ${input.targetRole}"
  }
]
`;

  const results = await generateGeminiJson<SkillGap[]>(prompt, fallback, {
    temperature: 0.2,
  });

  return sortSkillGaps(results);
}
