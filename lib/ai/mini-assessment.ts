import { MiniAssessmentQuestion, MiniAssessmentInput } from "./types";
import { generateGeminiJson } from "./gemini";

function createFallbackMiniAssessment(
  input: MiniAssessmentInput
): MiniAssessmentQuestion[] {
  const skill = input.skillName;
  const role = input.targetRole;

  return [
    {
      questionText: `What is a fundamental concept in ${skill} that every ${role} should know?`,
      options: [
        "Core syntax and basic operations",
        "Advanced optimization techniques only",
        "Memorizing documentation verbatim",
        "Skipping basics to focus on tools",
      ],
      correctAnswer: 0,
      explanation: `Understanding core fundamentals of ${skill} is essential for any ${role}. This forms the foundation for advanced topics.`,
    },
    {
      questionText: `Which best practice is most important when working with ${skill} in a production environment?`,
      options: [
        "Writing clean, maintainable code with proper error handling",
        "Using the most complex approach possible",
        "Ignoring edge cases to ship faster",
        "Avoiding documentation entirely",
      ],
      correctAnswer: 0,
      explanation: `Clean code with proper error handling is a universal best practice for production-quality ${skill} implementations.`,
    },
    {
      questionText: `How should a ${role} approach debugging issues related to ${skill}?`,
      options: [
        "Systematically reproduce the issue, isolate the cause, and verify the fix",
        "Randomly change code until it works",
        "Ask someone else to fix it immediately",
        "Ignore the bug and hope it resolves itself",
      ],
      correctAnswer: 0,
      explanation: `Systematic debugging is the professional approach. Reproduce → Isolate → Fix → Verify.`,
    },
    {
      questionText: `When should a ${role} consider refactoring ${skill}-related code?`,
      options: [
        "When code becomes difficult to maintain, has duplicated logic, or doesn't follow current best practices",
        "Never, since working code should never be changed",
        "Only when the project is being shut down",
        "Every day regardless of the code state",
      ],
      correctAnswer: 0,
      explanation: `Refactoring should happen when code quality degrades. The goal is to improve readability and maintainability without changing behavior.`,
    },
    {
      questionText: `What is the most effective way to improve at ${skill} over time?`,
      options: [
        "Consistent practice, building projects, and learning from code reviews",
        "Only reading books without ever writing code",
        "Memorizing syntax without understanding concepts",
        "Avoiding challenging problems",
      ],
      correctAnswer: 0,
      explanation: `Active learning through practice, projects, and feedback is the most effective skill development approach.`,
    },
  ];
}

export async function generateMiniAssessment(
  input: MiniAssessmentInput
): Promise<MiniAssessmentQuestion[]> {
  const fallback = createFallbackMiniAssessment(input);

  const prompt = `
You are a technical assessment designer. Generate a 5-question multiple choice quiz.

CONTEXT:
- Skill: ${input.skillName}
- Target Role: ${input.targetRole}
- Current Level: ${input.currentLevel}

INSTRUCTIONS:
1. Generate exactly 5 questions.
2. Questions should test practical understanding, not just memorization.
3. Each question has exactly 4 options.
4. Exactly one option is correct (index 0-3).
5. Each question needs an explanation of the correct answer.
6. Difficulty should match the user's current level.
7. Mix conceptual and practical questions.

Return a JSON array matching this schema:
[
  {
    "questionText": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Why the correct answer is correct and why others are wrong"
  }
]
`;

  return generateGeminiJson<MiniAssessmentQuestion[]>(prompt, fallback, {
    temperature: 0.3,
  });
}
