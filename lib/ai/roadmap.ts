import { SkillGap, RoadmapInput, RoadmapDay } from "./types";
import { generateGeminiJson } from "./gemini";

import { getRoleRequirement } from "@/lib/skills/role-requirements";
import { resolveRoleCurriculum } from "@/app/api/roadmap/generate/route";

function createFallbackRoadmap(input: RoadmapInput): RoadmapDay[] {
  const totalWeeks =
    typeof input.timeline === "number"
      ? input.timeline
      : parseInt(input.timeline) || 8;

  const totalDays = totalWeeks * 5;
  const dailyMinutes = Math.round((input.hoursPerWeek * 60) / 5);

  const targetRole = input.targetRole || "Software Engineer";
  const roleReq = getRoleRequirement(targetRole);
  const curricula = resolveRoleCurriculum(targetRole);

  // Derive prioritized skills: user skill gaps first, then role canonical core/required skills
  const gapSkillNames = (input.skillGaps || []).map((g) => g.skill);
  const roleCoreSkills = roleReq.coreSkills || [];
  const roleRequiredSkills = roleReq.requiredSkills || [];

  const combinedSkillPool = Array.from(
    new Set([...gapSkillNames, ...roleCoreSkills, ...roleRequiredSkills])
  );

  const days: RoadmapDay[] = [];

  for (let w = 0; w < totalWeeks; w++) {
    const weekTemplate = curricula[w % curricula.length];
    const weekSkills = weekTemplate?.skills && weekTemplate.skills.length > 0
      ? weekTemplate.skills
      : combinedSkillPool.slice(w * 2, w * 2 + 4);

    for (let d = 1; d <= 5; d++) {
      const dayIndex = w * 5 + d;
      const skillIndex = (d - 1) % (weekSkills.length || 1);
      const focusSkill = weekSkills[skillIndex] || weekSkills[0] || `${targetRole} Core`;

      const dayGoals: Record<number, { title: string; prefix: string; taskType: string }> = {
        1: { title: "Foundations & Runtime Internals", prefix: "Deconstruct and master", taskType: "Study core internal mechanics and architecture of" },
        2: { title: "Applied Patterns & Implementation", prefix: "Implement and practice", taskType: "Build practical, production-ready code examples for" },
        3: { title: "Edge Cases & Defensive Engineering", prefix: "Harden and debug", taskType: "Solve complex edge cases, concurrency hazards, and bugs in" },
        4: { title: "Performance & Scalability", prefix: "Benchmark and optimize", taskType: "Optimize latency, throughput, and memory utilization for" },
        5: { title: "Interview Mastery & Capstone Synthesis", prefix: "Defend and demonstrate mastery of", taskType: "Answer senior technical interview questions and synthesize learnings for" },
      };

      const dayConfig = dayGoals[d] || dayGoals[1];

      days.push({
        dayNumber: dayIndex,
        goal: `${dayConfig.prefix} ${focusSkill} for ${targetRole}`,
        tasks: [
          `${dayConfig.taskType} ${focusSkill}`,
          `Complete hands-on sandbox coding challenge for ${focusSkill}`,
          `Review industry comparison tradeoffs and best practices for ${focusSkill}`,
          `Complete technical diagnostic assessment with ≥ 70% passing threshold`,
        ],
        skillFocus: focusSkill,
        estimatedTime: dailyMinutes,
        completionCriteria: `Demonstrate mastery of ${focusSkill} through hands-on code execution and passing score on daily technical assessment.`,
      });
    }
  }

  return days;
}

export async function generateRoadmap(
  input: RoadmapInput
): Promise<RoadmapDay[]> {
  const fallback = createFallbackRoadmap(input);

  const prompt = `
You are an elite AI Career Strategy Coach and Technical Curriculum Director.
Design a personalized daily learning roadmap for a candidate targeting: "${input.targetRole}".

CANDIDATE CONTEXT:
- Target Role: ${input.targetRole}
- Timeline: ${input.timeline} weeks
- Hours per week: ${input.hoursPerWeek}
- Current Level: ${input.currentLevel}
- Skill Gaps: ${JSON.stringify(
    input.skillGaps.map((g) => ({
      skill: g.skill,
      current: g.currentLevel,
      target: g.targetLevel,
      priority: g.priority,
    }))
  )}

INSTRUCTIONS:
1. Generate EXACTLY one entry per day for the entire timeline.
2. Front-load HIGH priority skill gaps in early days.
3. Each day should have a clear goal, 3-5 tasks, and a completion criteria.
4. Estimated time per day should be approximately ${Math.round(
    (input.hoursPerWeek * 60) / 5
  )} minutes.
5. Vary the activities: learning, practice, building, reviewing.

Return a JSON array matching this schema:
[
  {
    "dayNumber": 1,
    "goal": "What the user will achieve today",
    "tasks": ["Task 1", "Task 2", "Task 3"],
    "skillFocus": "Primary skill for today",
    "estimatedTime": ${Math.round((input.hoursPerWeek * 60) / 5)},
    "completionCriteria": "How to know this day is complete"
  }
]
`;

  return generateGeminiJson<RoadmapDay[]>(prompt, fallback, {
    temperature: 0.3,
  });
}
