import { DailyMission, DailyMissionInput } from "./types";
import { generateGeminiJson } from "./gemini";

function createFallbackDailyMission(input: DailyMissionInput): DailyMission {
  const day = input.roadmapDay;
  const totalMinutes = day.estimatedTime || 90;

  const learnMinutes = Math.round(totalMinutes * 0.35);
  const practiceMinutes = Math.round(totalMinutes * 0.5);
  const assessmentMinutes = Math.round(totalMinutes * 0.15);

  return {
    dayNumber: day.dayNumber,
    title: day.goal,
    learn: {
      topic: day.skillFocus,
      task: `Study core concepts of ${day.skillFocus}`,
      description: `Read through learning materials on ${day.skillFocus}. Focus on understanding the fundamentals, common patterns, and practical applications. Take notes on key concepts.`,
      durationMinutes: learnMinutes,
      resources: [
        `Official documentation for ${day.skillFocus}`,
        "Conceptual tutorials and guides",
        "Example code walkthroughs",
      ],
      keyConcepts: [
        `Core principles of ${day.skillFocus}`,
        "Common patterns and anti-patterns",
        "Best practices in production",
      ],
      instructions: [
        `Read the introduction and core concepts section`,
        "Study at least 2 code examples",
        "Write down 3 key takeaways",
        "Note any questions for the practice phase",
      ],
    },
    practice: {
      topic: day.skillFocus,
      task: `Hands-on practice with ${day.skillFocus}`,
      description: `Apply what you learned through practical exercises. Build small snippets, solve problems, and experiment with the concepts.`,
      durationMinutes: practiceMinutes,
      resources: [
        "Practice exercises",
        "Coding challenges",
        "Project starter templates",
      ],
      instructions: [
        `Complete 3-5 practice exercises on ${day.skillFocus}`,
        "Build a small code snippet demonstrating the concept",
        "Test your code and verify the output",
        "Review any errors and understand why they occurred",
      ],
    },
    assessment: {
      topic: day.skillFocus,
      task: `Self-assessment on ${day.skillFocus}`,
      description: `Test your understanding with a short assessment. This helps reinforce learning and identify any remaining gaps.`,
      durationMinutes: assessmentMinutes,
      instructions: [
        "Answer 5 questions about today's topic",
        "Review explanations for any incorrect answers",
        "Reflect on areas that need more practice",
      ],
    },
    totalDurationMinutes: totalMinutes,
  };
}

export async function generateDailyMission(
  input: DailyMissionInput
): Promise<DailyMission> {
  const fallback = createFallbackDailyMission(input);

  const prompt = `
You are an expert learning experience designer. Create today's focused learning mission for a student.

CONTEXT:
- Today's Goal: ${input.roadmapDay.goal}
- Skill Focus: ${input.roadmapDay.skillFocus}
- Tasks Planned: ${input.roadmapDay.tasks.join("; ")}
- Completion Criteria: ${input.roadmapDay.completionCriteria}
- Estimated Time: ${input.roadmapDay.estimatedTime} minutes total
- Days Completed So Far: ${input.completedDaysCount}
- Weak Areas to Reinforce: ${
    input.weakAreas.length > 0 ? input.weakAreas.join(", ") : "None identified"
  }

INSTRUCTIONS:
1. Create a structured daily mission with 3 sections: LEARN, PRACTICE, ASSESSMENT.
2. LEARN: Theory/concept study. Include topic, task description, duration, resources, key concepts, and step-by-step instructions.
3. PRACTICE: Hands-on exercises. Include task description, duration, and instructions.
4. ASSESSMENT: Self-check quiz. Include duration and instructions.
5. Time allocation: ~35% learn, ~50% practice, ~15% assessment.
6. Total time must be approximately ${input.roadmapDay.estimatedTime} minutes.

Return JSON matching this schema:
{
  "dayNumber": ${input.roadmapDay.dayNumber},
  "title": "Compelling title for today's mission",
  "learn": {
    "topic": "Primary topic to learn",
    "task": "What to study",
    "description": "Detailed description of what to learn",
    "durationMinutes": number,
    "resources": ["resource1", "resource2"],
    "keyConcepts": ["concept1", "concept2"],
    "instructions": ["step1", "step2", "step3"]
  },
  "practice": {
    "topic": "Same topic",
    "task": "What to practice",
    "description": "Detailed description of practice activities",
    "durationMinutes": number,
    "resources": ["resource1"],
    "instructions": ["step1", "step2"]
  },
  "assessment": {
    "topic": "Same topic",
    "task": "Self-assessment",
    "description": "Short assessment to verify understanding",
    "durationMinutes": number,
    "instructions": ["step1", "step2"]
  },
  "totalDurationMinutes": ${input.roadmapDay.estimatedTime}
}
`;

  return generateGeminiJson<DailyMission>(prompt, fallback, {
    temperature: 0.3,
  });
}
