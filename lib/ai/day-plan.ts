import { generateGeminiJson } from "./gemini";
import { DayPlan } from "@/types";

export async function generateDayPlan(
  dayNumber: number,
  weekTitle: string,
  focusSkills: string[],
  career: string,
  attemptNumber: number,
  userId: string,
  performanceScore?: number
): Promise<DayPlan | null> {
  const primarySkill = focusSkills[0] || career;
  const depthLevel = performanceScore && performanceScore >= 80
    ? "Senior & Scaled Architecture (focus on distributed mechanics, performance optimization, concurrency, and architecture)"
    : performanceScore && performanceScore >= 55
    ? "Intermediate Production Mastery (focus on production workflows, error boundaries, clean code, and API contracts)"
    : "Foundational to Intermediate Mastery (focus on clear mental models, syntax mechanics, and step-by-step implementations)";

  const prompt = `
You are a Principal Engineer, Technical Author, and Elite Certification Director.
Create an EXHAUSTIVE, PINPOINT, 100% CONFIDENCE-BUILDING daily lesson plan and assessment for:

- Target Role: "${career}"
- Week Module: "${weekTitle}"
- Day: ${dayNumber}
- Primary Focus Skill: "${primarySkill}"
- All Focus Skills: ${focusSkills.join(", ")}
- Candidate ID: "${userId}"
- Attempt: #${attemptNumber}
- Depth Calibration: ${depthLevel}

CRITICAL REQUIREMENT - MAXIMUM DEPTH & 100% CONFIDENCE:
The user needs to feel 100% confident in this topic. Do NOT generate brief summaries or placeholder text.
Provide rich, comprehensive, GeeksforGeeks/Staff-Engineer-grade explanations that cover:
1. Core Mental Models & Under-The-Hood Mechanics (How the runtime/engine works internally).
2. Step-by-Step Architectural Foundations with annotated, production-grade code.
3. Critical Edge Cases, Race Conditions, Memory Leaks, and Common Pitfalls.
4. Real-world Enterprise Design Patterns and Scalability Trade-offs.

TOPICS STRUCTURE (Generate 2 distinct in-depth topics for this day):
- Topic 1: "${primarySkill} Architectural Foundations & Execution Engine Mechanics"
  - comprehensiveTheory: 4-5 extensive markdown sections detailing runtime lifecycle, memory flow, and execution rules.
  - comparisonTable: 4-5 detailed rows comparing Modern Production Standard vs Junior Anti-Pattern.
  - modules: 2 sub-modules (Setup/Mental Model + Annotated Code Implementation).
  - interviewQuestions: 3 pinpoint technical interview questions with deep, definitive answers.
- Topic 2: "${primarySkill} Production Patterns, Concurrency & Edge Case Resilience"
  - comprehensiveTheory: 4-5 extensive markdown sections covering subtle edge cases, performance profiling, and failure modes.
  - modules: 2 sub-modules (Advanced Implementation + Performance/Testing Hardening).
  - interviewQuestions: 3 pinpoint interview questions covering difficult edge cases and architectural trade-offs.

YOUTUBE RESOURCES (EXACTLY 3):
- Resource 1 MUST BE IN TELUGU (తెలుగు):
  {
    "id": "yt-telugu-1",
    "title": "${primarySkill} Complete Masterclass in Telugu (తెలుగు)",
    "channel": "Telugu Web Tech / Palle Technologies / Vamsi Bhavani",
    "description": "Pinpoint concept explanation in Telugu covering core mechanisms, syntax, and live coding.",
    "language": "Telugu",
    "url": "https://www.youtube.com/results?search_query=${encodeURIComponent(primarySkill + " tutorial in telugu full course")}"
  }
- Resource 2 MUST BE IN ENGLISH (Full Masterclass):
  {
    "id": "yt-english-1",
    "title": "${primarySkill} Full Course - Beginner to Advanced",
    "channel": "freeCodeCamp.org / Traversy Media",
    "description": "Exhaustive end-to-end masterclass covering core theory, mental model, and projects.",
    "language": "English",
    "url": "https://www.youtube.com/results?search_query=${encodeURIComponent(primarySkill + " full course freecodecamp")}"
  }
- Resource 3 MUST BE IN ENGLISH (Senior Architecture & Interview Traps):
  {
    "id": "yt-english-2",
    "title": "${primarySkill} Senior Architecture & Common Interview Pitfalls",
    "channel": "Web Dev Simplified / Fireship / NeetCode",
    "description": "Deep dive into under-the-hood engine mechanics and senior engineering interview questions.",
    "language": "English",
    "url": "https://www.youtube.com/results?search_query=${encodeURIComponent(primarySkill + " architecture interview deep dive")}"
  }

ASSESSMENT:
- 10 rigorous technical questions with 4-5 code snippets.
- Detailed explanationBreakdown for each question.

Return strictly JSON matching the DayPlan schema:
{
  "day": {
    "id": "day-${dayNumber}",
    "dayNumber": ${dayNumber},
    "topic": "Day ${dayNumber}: ${primarySkill} Core Architecture & Advanced Mechanics",
    "description": "Exhaustive masterclass on ${primarySkill}, exploring theoretical mechanics, production design patterns, and interview deep dives for ${career}.",
    "skills": ${JSON.stringify(focusSkills)},
    "topics": [
      {
        "id": "topic-${dayNumber}-1",
        "topicNumber": 1,
        "title": "${primarySkill} Architectural Foundations & Execution Engine Mechanics",
        "subtitle": "Theoretical mechanics, runtime lifecycle, and execution models",
        "overview": "Deep conceptual foundation of ${primarySkill}",
        "comprehensiveTheory": "Detailed Markdown content...",
        "comparisonTable": { "headers": ["Factor", "Modern Senior Standard", "Junior Anti-Pattern"], "rows": [["...", "...", "..."]] },
        "interviewQuestions": [{ "question": "Q?", "answer": "A", "difficulty": "Advanced" }],
        "modules": [
          {
            "id": "mod-${dayNumber}-1",
            "title": "Module 1: Mental Model & Architecture Setup",
            "overview": "Overview...",
            "notes": ["Note 1", "Note 2"],
            "commands": ["npm init -y"],
            "codeSnippet": { "language": "typescript", "code": "...", "explanation": "..." },
            "keyTakeaways": ["Takeaway 1"]
          },
          {
            "id": "mod-${dayNumber}-2",
            "title": "Module 2: Production Code Implementation",
            "overview": "Overview...",
            "notes": ["Note 1", "Note 2"],
            "commands": [],
            "codeSnippet": { "language": "typescript", "code": "...", "explanation": "..." },
            "keyTakeaways": ["Takeaway 1"]
          }
        ],
        "assessment": []
      },
      {
        "id": "topic-${dayNumber}-2",
        "topicNumber": 2,
        "title": "${primarySkill} Production Hardening, Concurrency & Edge Cases",
        "subtitle": "Defensive error boundaries, memory safety, and performance profiling",
        "overview": "Advanced edge cases and senior production hardening",
        "comprehensiveTheory": "Detailed Markdown content...",
        "comparisonTable": { "headers": ["Factor", "Senior Practice", "Common Trap"], "rows": [["...", "...", "..."]] },
        "interviewQuestions": [{ "question": "Q?", "answer": "A", "difficulty": "Advanced" }],
        "modules": [
          {
            "id": "mod-${dayNumber}-3",
            "title": "Module 3: Edge Cases, Concurrency & Memory Leaks",
            "overview": "Overview...",
            "notes": ["Note 1", "Note 2"],
            "commands": [],
            "codeSnippet": { "language": "typescript", "code": "...", "explanation": "..." },
            "keyTakeaways": ["Takeaway 1"]
          },
          {
            "id": "mod-${dayNumber}-4",
            "title": "Module 4: Performance Profiling & Production Hardening",
            "overview": "Overview...",
            "notes": ["Note 1", "Note 2"],
            "commands": [],
            "codeSnippet": { "language": "typescript", "code": "...", "explanation": "..." },
            "keyTakeaways": ["Takeaway 1"]
          }
        ],
        "assessment": []
      }
    ],
    "youtubeResources": [ ... ],
    "learningResources": ["Official ${primarySkill} Documentation", "GeeksforGeeks Enterprise Guide"],
    "assessment": []
  }
}
`;

  try {
    const result = await generateGeminiJson<{ day: DayPlan }>(
      prompt,
      undefined,
      { temperature: 0.2 }
    );
    return result?.day || null;
  } catch {
    return null;
  }
}
