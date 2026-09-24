import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DayPlanSchema, sanitizeDayPlanForClient } from "@/lib/validations/day-plan";
import { DayPlan, DayAssessmentQuestion, DayTopicItem, YouTubeResourceItem, QuestionExplanationBreakdown, PracticeProblem } from "@/types";
import { getRoleSpecificPracticeProblems, getRoleSpecificLearnLesson } from "@/lib/skills/role-problems";
import { getRoleSpecificDayTheory, getRoleSpecificQuestionPool } from "@/lib/skills/role-day-content";

export const runtime = "nodejs";

function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shuffleArray<T>(arr: T[], rand: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface RawQuestionTemplate {
  question: string;
  codeSnippet?: string;
  language?: string;
  correctOption: string;
  distractors: string[];
  whyCorrect: string;
  whyIncorrect: string[];
  keyPrinciple: string;
  skill?: string;
  topic?: string;
  concept?: string;
  difficulty?: "easy" | "medium" | "hard";
}

function generateDynamicQuestionPool(
  primarySkill: string,
  career: string,
  dayNumber: number,
  userId: string,
  attemptNumber: number
): DayAssessmentQuestion[] {
  const seedString = `${userId || "user"}_day${dayNumber}_attempt${attemptNumber}_${primarySkill}_${career}`;
  const seedNum = stringHash(seedString);
  const rand = seededRandom(seedNum);

  const templates: RawQuestionTemplate[] = [
    {
      question: `In modern ${primarySkill} architectures, what is the core rationale for decoupling state mutations from UI view rendering?`,
      codeSnippet: `const updateSession = (payload: { token: string }) => ({
  type: "SESSION_UPDATE",
  payload,
  timestamp: Date.now()
});`,
      language: "typescript",
      correctOption: "It enforces deterministic state transitions, prevents race conditions, and enables predictable component lifecycle rendering",
      distractors: ["It eliminates the necessity for HTTP network status codes", "It strictly guarantees that UI components render synchronously on the GPU", "It replaces server-side authentication tokens with local cookies"],
      whyCorrect: "Decoupling state mutation from presentation ensures state remains a single source of truth, enabling time-travel debugging, unit testability, and deterministic UI re-renders.",
      whyIncorrect: ["HTTP status codes remain essential for client-server protocol communication.", "DOM rendering happens via browser layout/composite engines on the main thread, not direct synchronous GPU execution.", "Authentication security requires strict cryptographic token lifecycle validation."],
      keyPrinciple: "Unidirectional data flow and pure state transitions guarantee maintainable, bug-free enterprise UI state.",
      skill: primarySkill,
      topic: "State Architecture",
      concept: "Decoupled State Mutation",
      difficulty: "medium",
    },
    {
      question: `Analyze the output of this ${primarySkill} memoization / mutation snippet:`,
      codeSnippet: `const registry = { activeCount: 0, items: [] as number[] };
function trackItem(id: number) {
  registry.activeCount++;
  registry.items.push(id);
  return registry.items.length === registry.activeCount;
}
console.log(trackItem(101) && trackItem(102));`,
      language: "typescript",
      correctOption: "true (Both executions match: items.length === activeCount evaluates true && true -> true)",
      distractors: ["false (registry is mutated in place causing length mismatch)", "TypeError: Cannot mutate constant object", "undefined"],
      whyCorrect: "Both activeCount and items.length increment by 1 on every invocation, so items.length === activeCount evaluates to true (1===1, then 2===2).",
      whyIncorrect: ["The count and array length increment in lockstep.", "'const' prevents reassignment, not internal property mutations.", "Functions with explicit boolean returns never return undefined."],
      keyPrinciple: "Understanding const vs object mutation is critical for state management.",
      skill: primarySkill,
      topic: "Memory & Mutation",
      concept: "Reference Mutation Mechanics",
      difficulty: "medium",
    },
    {
      question: `Why is Interface Segregation preferred over monolithic schemas in ${primarySkill} microservices?`,
      correctOption: "Clients should only depend on the minimum subset of methods they actually consume",
      distractors: ["It compresses all database schemas into a single flat JSON column", "It enables arbitrary global variable access across module boundaries", "It disables TypeScript compiler type validations at build time"],
      whyCorrect: "ISP prevents modules from carrying bloat or breaking when unrelated shared interface properties change.",
      whyIncorrect: ["ISP is a design abstraction, not database compression.", "Global variables violate encapsulation.", "ISP leverages TypeScript for stricter, not disabled, compile-time safety."],
      keyPrinciple: "Keep interfaces lean and specialized to preserve loose coupling.",
      skill: primarySkill,
      topic: "System Design & SOLID",
      concept: "Interface Segregation",
      difficulty: "hard",
    },
    {
      question: `Consider this async pipeline. What defect is present?`,
      codeSnippet: `async function fetchMetrics(metricIds: string[]) {
  const results: any[] = [];
  metricIds.forEach(async (id) => {
    const data = await fetch(\`/api/metrics/\${id}\`).then(r => r.json());
    results.push(data);
  });
  return results;
}`,
      language: "typescript",
      correctOption: "forEach does not await async callbacks, causing the function to return [] before any HTTP requests finish",
      distractors: ["The template literal syntax is malformed", "results cannot be declared with 'const' if items are pushed", "fetch cannot be called inside loops"],
      whyCorrect: "Array.prototype.forEach does not wait for async callback promises. Use Promise.all(metricIds.map(...)) instead.",
      whyIncorrect: ["Template literals are valid JavaScript.", "const allows array mutations like .push().", "fetch can be invoked inside loops with Promise.all."],
      keyPrinciple: "Never use async callbacks with forEach; always prefer Promise.all with map.",
      skill: primarySkill,
      topic: "Asynchronous Pipelines",
      concept: "Event Loop & Promise.all",
      difficulty: "medium",
    },
    {
      question: `How should memory cleanup be handled in ${primarySkill} for high-frequency telemetry streams?`,
      codeSnippet: `const controller = new AbortController();
const streamPromise = fetch("/api/telemetry/live", { signal: controller.signal });
function onUnmount() { controller.abort(); }`,
      language: "typescript",
      correctOption: "Use AbortController signals to cancel in-flight requests and detach subscriptions during teardown",
      distractors: ["Rely on garbage collection to terminate network sockets", "Force browser process restarts after every update", "Suppress all Promise rejections globally"],
      whyCorrect: "AbortController signals cleanly terminate ongoing network requests, freeing connection pools and avoiding memory leaks.",
      whyIncorrect: ["Garbage collectors cannot abort active network sockets.", "Restarting browser processes degrades UX.", "Swallowing errors hides critical bugs."],
      keyPrinciple: "Always pair long-lived async subscriptions with explicit cancellation and unmount cleanup.",
      skill: primarySkill,
      topic: "Resource Management",
      concept: "AbortController & Teardown",
      difficulty: "hard",
    },
    {
      question: `What is the output of this TypeScript discriminated union type-narrowing block?`,
      codeSnippet: `type ApiResponse =
  | { status: "success"; payload: { id: string; balance: number } }
  | { status: "error"; errorCode: number; message: string };

function parseBalance(res: ApiResponse): number {
  if (res.status === "success") { return res.payload.balance; }
  return -1;
}`,
      language: "typescript",
      correctOption: "TypeScript narrows the union to the success branch within the 'if', allowing type-safe access to res.payload.balance",
      distractors: ["Compiler error: Property 'payload' does not exist", "Runtime error: Cannot read property 'balance' of undefined", "Returns NaN due to type coercion"],
      whyCorrect: "The literal string tag 'status' acts as a discriminant. TypeScript eliminates the error variant when checking res.status === 'success'.",
      whyIncorrect: ["TypeScript's control flow analysis recognizes the discriminant.", "payload is guaranteed defined after validation.", "balance is numeric and preserves exact values."],
      keyPrinciple: "Discriminated unions provide zero-cost compile-time branch safety.",
      skill: primarySkill,
      topic: "Type Safety",
      concept: "Discriminated Union Narrowing",
      difficulty: "medium",
    },
    {
      question: `What is the time complexity of searching a balanced Binary Search Tree?`,
      correctOption: "Time: O(log N) average/worst case; Space: O(1) iterative or O(log N) recursive",
      distractors: ["Time: O(N^2); Space: O(N^2)", "Time: O(1) constant under all conditions", "Time: O(N!) factorial time"],
      whyCorrect: "In a balanced tree, each comparison eliminates half the remaining search space, resulting in O(log N) search time.",
      whyIncorrect: ["O(N^2) represents nested loops, not BST search.", "Only direct hash lookups achieve O(1).", "O(N!) is brute-force permutation."],
      keyPrinciple: "Balanced logarithmic structures form the foundation of high-performance indexing.",
      skill: "DSA",
      topic: "Trees & Binary Search",
      concept: "Binary Search Tree Complexity",
      difficulty: "easy",
    },
    {
      question: `What architectural principle is violated in this error-handling snippet?`,
      codeSnippet: `async function processPayment(orderId: string, amount: number) {
  try {
    await chargeGateway(orderId, amount);
  } catch (err) {
    console.log("Error occurred");
    return true; // Treat as processed
  }
}`,
      language: "typescript",
      correctOption: "Swallowing critical financial exceptions masks system failures and corrupts transaction state",
      distractors: ["Async functions cannot use try/catch", "chargeGateway must take amount as string", "console.log cannot be used in catch blocks"],
      whyCorrect: "Returning positive status on caught payment failure misleads users and downstream systems.",
      whyIncorrect: ["try/catch is the standard idiom for async promise handling.", "Currency amounts are numeric or integer cents.", "Logging utilities are valid inside catch blocks."],
      keyPrinciple: "Fail fast and explicitly propagate domain errors.",
      skill: primarySkill,
      topic: "Defensive Engineering",
      concept: "Exception Propagation",
      difficulty: "medium",
    },
    {
      question: `When optimizing bundle sizes in ${primarySkill} web apps, which technique yields highest impact?`,
      correctOption: "Dynamic code-splitting / lazy-loading via dynamic imports alongside tree-shaking",
      distractors: ["Inlining all static assets as Base64 in JavaScript bundle", "Bundling all libraries into one monolithic vendor chunk", "Disabling HTTP gzip/brotli compression"],
      whyCorrect: "Dynamic code-splitting breaks chunks by route/feature, ensuring users download minimal JavaScript for their viewport.",
      whyIncorrect: ["Base64 inlining increases size by ~33%.", "Monolithic chunks force downloading entire libraries.", "Disabling compression increases wire transfer by 70-80%."],
      keyPrinciple: "Ship only code needed for the initial viewport; defer non-critical modules.",
      skill: primarySkill,
      topic: "Performance Optimization",
      concept: "Code Splitting & Bundle Size",
      difficulty: "medium",
    },
    {
      question: `Consider this closure evaluation. What will be printed?`,
      codeSnippet: `const handlers: (() => number)[] = [];
for (var i = 0; i < 3; i++) {
  handlers.push(() => i);
}
console.log(handlers[0](), handlers[1](), handlers[2]());`,
      language: "typescript",
      correctOption: "3 3 3 (var is function-scoped, all closures reference same variable after loop terminates at 3)",
      distractors: ["0 1 2 (each handler captures its own iteration copy)", "undefined undefined undefined", "TypeError: handlers is not iterable"],
      whyCorrect: "Variables declared with 'var' lack block scoping. All closures capture the reference to the single shared variable.",
      whyIncorrect: ["To get 0 1 2, use 'let' instead of 'var'.", "i is assigned 0, 1, 2, 3, so never undefined.", "handlers is an array with valid indexed elements."],
      keyPrinciple: "Always use 'let' or 'const' for block-level lexical scoping.",
      skill: primarySkill,
      topic: "Closures & Scope",
      concept: "Block Scoping vs Hoisting",
      difficulty: "easy",
    },
  ];

  const shuffledTemplates = shuffleArray(templates, rand);
  const selectedTemplates = shuffledTemplates.slice(0, 10);

  return selectedTemplates.map((t, index) => {
    const rawOptions = [t.correctOption, ...t.distractors];
    const shuffledOptions = shuffleArray(rawOptions, rand);
    const correctIndex = shuffledOptions.indexOf(t.correctOption);

    const breakdown: QuestionExplanationBreakdown = {
      whyCorrect: t.whyCorrect,
      whyIncorrect: t.whyIncorrect,
      keyPrinciple: t.keyPrinciple,
    };

    return {
      id: `d${dayNumber}_u${stringHash(userId).toString(36)}_att${attemptNumber}_q${index + 1}`,
      question: t.question,
      codeSnippet: t.codeSnippet,
      language: t.language,
      options: shuffledOptions,
      correctIndex,
      skill: t.skill || primarySkill,
      topic: t.topic || `${primarySkill} Architecture`,
      concept: t.concept || `${primarySkill} Pattern ${index + 1}`,
      difficulty: t.difficulty || "medium",
      explanation: `Option ${["A", "B", "C", "D"][correctIndex]} is correct: ${t.whyCorrect} ${t.keyPrinciple}`,
      explanationBreakdown: breakdown,
    };
  });
}

function generateCuratedYouTubeLinks(primarySkill: string, topicTitle: string): YouTubeResourceItem[] {
  const teluguQuery = encodeURIComponent(`${primarySkill} tutorial in telugu full course`);
  const englishCourseQuery = encodeURIComponent(`${primarySkill} full course freecodecamp`);
  const englishInterviewQuery = encodeURIComponent(`${primarySkill} architecture interview deep dive`);

  return [
    {
      id: `yt-telugu-${stringHash(primarySkill + "telugu")}`,
      title: `${primarySkill} Complete Masterclass in Telugu (తెలుగు)`,
      channel: "Telugu Web Tech / Palle Tech / Vamsi Bhavani",
      description: `Detailed pinpoint explanation of ${primarySkill} in Telugu. Covers fundamentals, internal mechanics, syntax, and live coding walkthroughs.`,
      language: "Telugu",
      duration: "1h 45m",
      url: `https://www.youtube.com/results?search_query=${teluguQuery}`,
    },
    {
      id: `yt-en-course-${stringHash(primarySkill + "course")}`,
      title: `${primarySkill} Complete Developer Course - Zero to Production`,
      channel: "freeCodeCamp.org / Traversy Media",
      description: `Comprehensive English industry masterclass covering core theory, execution models, best practices, and hands-on exercises for ${primarySkill}.`,
      language: "English",
      duration: "3h 20m",
      url: `https://www.youtube.com/results?search_query=${englishCourseQuery}`,
    },
    {
      id: `yt-en-adv-${stringHash(primarySkill + "adv")}`,
      title: `${primarySkill} Senior Architecture & Interview Traps Deep Dive`,
      channel: "Web Dev Simplified / Fireship / NeetCode",
      description: `Under-the-hood engine breakdown, common junior anti-patterns, performance optimization, and senior engineering interview questions for ${primarySkill}.`,
      language: "English",
      duration: "45m",
      url: `https://www.youtube.com/results?search_query=${englishInterviewQuery}`,
    },
  ];
}

/**
 * Generates an exhaustive, high-depth, 100% confidence-building lesson plan
 * with 2 distinct topics, 4 detailed modules, rich code snippets, and 6 interview Q&As.
 */
function getExhaustiveFallbackDay(
  dayNumber: number,
  weekTitle: string,
  focusSkills: string[],
  career: string,
  attemptNumber: number = 1,
  userId: string = "default_user",
  performanceScore?: number
): DayPlan {
  // Derive the day's pinpoint skill strictly from focusSkills based on dayNumber
  const skillIndex = Math.max(0, Math.min(focusSkills.length - 1, (dayNumber - 1) % (focusSkills.length || 1)));
  const primarySkill = focusSkills[skillIndex] || focusSkills[0] || `${career} Fundamentals`;
  const questions = getRoleSpecificQuestionPool(career, primarySkill, dayNumber, userId, attemptNumber);

  const isHighPerformer = performanceScore !== undefined && performanceScore >= 80;
  const isStruggling = performanceScore !== undefined && performanceScore < 50;
  const depthLevel = isHighPerformer
    ? "Senior & Scaled Architecture"
    : isStruggling
    ? "Foundational & Step-by-Step Mechanics"
    : "Intermediate Production Mastery";

  const youtubeResources = generateCuratedYouTubeLinks(primarySkill, `Day ${dayNumber}: ${primarySkill}`);
  const theoryPackage = getRoleSpecificDayTheory(career, dayNumber, primarySkill);

  // 10-Point Pedagogical Structured Lesson tailored to role
  const learnLesson = getRoleSpecificLearnLesson(career, dayNumber, primarySkill);

  // Strictly 3 Practice Problems: 1 Easy, 1 Medium, 1 Hard
  const practiceProblems: PracticeProblem[] = getRoleSpecificPracticeProblems(career, dayNumber, primarySkill);

  return {
    id: `day-${dayNumber}`,
    dayNumber,
    topic: `Day ${dayNumber}: ${primarySkill} Core Architecture, Deep Mechanics & Production Hardening`,
    description: `Exhaustive masterclass on ${primarySkill} (${depthLevel}). Master internal runtime mechanics, clean architecture, concurrency safety, and senior interview questions for ${career}.`,
    skills: focusSkills.length > 0 ? focusSkills : [primarySkill, "Software Engineering"],
    learnLesson,
    practiceProblems,
    topics: [
      {
        id: `topic-${dayNumber}-1`,
        topicNumber: 1,
        title: theoryPackage.topic1Title,
        subtitle: theoryPackage.topic1Subtitle,
        overview: `Exhaustive deep dive into ${primarySkill} core architecture, internal engine execution, and deterministic contracts for ${career}.`,
        comprehensiveTheory: theoryPackage.topic1Theory,
        comparisonTable: theoryPackage.topic1Comparison,
        interviewQuestions: theoryPackage.interviewQuestionsTopic1,
        modules: theoryPackage.topic1Modules,
        assessment: questions.slice(0, Math.min(5, questions.length)),
      },
      {
        id: `topic-${dayNumber}-2`,
        topicNumber: 2,
        title: theoryPackage.topic2Title,
        subtitle: theoryPackage.topic2Subtitle,
        overview: `Advanced engineering strategies for eliminating memory leaks, handling high-frequency loads, and hardening production systems in ${career}.`,
        comprehensiveTheory: theoryPackage.topic2Theory,
        comparisonTable: theoryPackage.topic2Comparison,
        interviewQuestions: theoryPackage.interviewQuestionsTopic2,
        modules: theoryPackage.topic2Modules,
        assessment: questions.slice(Math.min(5, questions.length)),
      },
    ],
    youtubeResources,
    learningResources: [
      `Official ${primarySkill} Documentation & API Specification`,
      `GeeksforGeeks Enterprise ${primarySkill} Masterclass Guide`,
      "Production System Design, Concurrency & Performance Whitepapers",
    ],
    assessment: questions,
  };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const authUserId = session?.user?.id;

    const body = await request.json();
    const {
      dayId: inputDayId,
      weekTitle,
      focusSkills = [],
      dayNumber = 1,
      career,
      previousDayResult = null,
      attemptNumber = 1,
      userId = authUserId || "usr_default",
      seed = "",
    } = body;

    const effectiveUserId = authUserId || userId;

    if (!weekTitle || !career) {
      return NextResponse.json({ error: "Week title and career are required." }, { status: 400 });
    }

    // Determine canonical dayId: e.g. "week-1_day-1"
    const dayId = inputDayId || `week-1_day-${dayNumber}`;

    // 1. Check whether DayPlan is already cached in the user's Roadmap
    let userRoadmap = null;
    let daysData: Record<string, any> = {};

    if (effectiveUserId && effectiveUserId !== "usr_default") {
      userRoadmap = await prisma.roadmap.findFirst({
        where: { userId: effectiveUserId },
        orderBy: { updatedAt: "desc" },
      });

      if (userRoadmap?.daysData) {
        try {
          daysData = JSON.parse(userRoadmap.daysData);
          if (daysData[dayId]) {
            const cachedDayPlan = daysData[dayId];
            const cachedDesc = (cachedDayPlan.description || "") + (cachedDayPlan.topic || "");
            const isMatchingRole = !career || cachedDesc.toLowerCase().includes(career.toLowerCase());
            if (isMatchingRole) {
              return NextResponse.json({
                success: true,
                day: sanitizeDayPlanForClient(cachedDayPlan),
                source: "cache",
              });
            }
          }
        } catch (parseErr) {
          console.warn("Could not parse existing daysData JSON:", parseErr);
        }
      }
    }

    const previousScore = previousDayResult?.score !== undefined ? Number(previousDayResult.score) : undefined;

    let chosenDay: DayPlan | null = null;
    let source: "ai" | "fallback" = "fallback";

    // 2. Try AI generation via service layer with strict Zod validation
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const { generateDayPlan } = await import("@/lib/ai/day-plan");
        const aiDay = await generateDayPlan(dayNumber, weekTitle, focusSkills, career, attemptNumber, effectiveUserId, previousScore);

        if (aiDay) {
          // Validate using Zod schema
          const parseResult = DayPlanSchema.safeParse(aiDay);
          if (parseResult.success && aiDay.topics && aiDay.topics.length > 0) {
            let yt = aiDay.youtubeResources || [];
            if (yt.length === 0 || !yt.some((r) => r.language === "Telugu")) {
              yt = generateCuratedYouTubeLinks(focusSkills[0] || career, aiDay.topic);
            }
            aiDay.youtubeResources = yt;
            chosenDay = aiDay;
            source = "ai";
          } else {
            console.warn("AI day plan output failed Zod validation, falling back to deterministic day plan:", !parseResult.success ? parseResult.error.issues : null);
          }
        }
      } catch (aiError) {
        console.error("AI day generation failed, using exhaustive fallback:", aiError);
      }
    }

    // 3. Fall back to high depth, exhaustive deterministic fallback
    if (!chosenDay) {
      chosenDay = getExhaustiveFallbackDay(dayNumber, weekTitle, focusSkills, career, attemptNumber, effectiveUserId, previousScore);
      source = "fallback";
    }

    // 4. Ensure stable IDs on practice problems and assessment questions
    if (Array.isArray(chosenDay.practiceProblems)) {
      chosenDay.practiceProblems = chosenDay.practiceProblems.map((prob: any, pIdx: number) => ({
        ...prob,
        id: prob.id || `prob-day${dayNumber}-${pIdx + 1}`,
      }));
    }

    if (Array.isArray(chosenDay.assessment)) {
      chosenDay.assessment = chosenDay.assessment.map((q: any, qIdx: number) => {
        const cIdx = typeof q.correctIndex === "number" ? q.correctIndex : (typeof q.correctAnswer === "number" ? q.correctAnswer : 0);
        return {
          ...q,
          id: q.id || `q-day${dayNumber}-${qIdx + 1}`,
          correctIndex: cIdx,
          correctAnswer: cIdx,
          correctOption: cIdx,
        };
      });
    }

    // 5. Persist the authoritative DayPlan (containing answer key) into the database
    if (userRoadmap && effectiveUserId && effectiveUserId !== "usr_default") {
      daysData[dayId] = chosenDay;
      try {
        await prisma.roadmap.update({
          where: { id: userRoadmap.id },
          data: { daysData: JSON.stringify(daysData) },
        });
      } catch (saveErr) {
        console.warn("Failed to persist DayPlan to Roadmap.daysData:", saveErr);
      }
    }

    // 6. Return client-sanitized version (withholding answer keys before submission)
    return NextResponse.json({
      success: true,
      day: sanitizeDayPlanForClient(chosenDay),
      source,
    });
  } catch (error) {
    console.error("Day generation route error:", error);
    return NextResponse.json({ error: "Failed to generate day plan." }, { status: 500 });
  }
}
