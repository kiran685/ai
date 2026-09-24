import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRoleRequirement } from "@/lib/skills/role-requirements";
import { getRoleCategory } from "@/lib/skills/role-problems";

export const runtime = "nodejs";

interface SprintDayDefinition {
  dayNumber: number;
  sprintDay: number;
  title: string;
  focusSkill: string;
  durationMinutes: number;
  mcqCount: number;
  codingProblem: {
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    description: string;
  };
  behavioralQuestion: {
    question: string;
    starFrameworkTip: string;
    sampleAiAnswer: string;
  };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Load user's profile and skill gaps
    const [profile, skillGaps, userSkills] = await Promise.all([
      prisma.careerProfile.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.skillGap.findMany({
        where: { userId },
        include: { skill: true },
      }),
      prisma.userSkill.findMany({
        where: { userId },
        include: { skill: true },
      }),
    ]);

    const targetRole = profile?.targetRole || "Software Engineer";
    const roleReq = getRoleRequirement(targetRole);

    // Pull topics from user's priority gaps, supplemented with canonical required skills
    const gapNames = skillGaps.map((g) => g.skill.name);
    const requiredSkills = roleReq.requiredSkills || ["Problem Solving", "System Architecture"];
    const combinedTopics = Array.from(new Set([...gapNames, ...requiredSkills, ...roleReq.coreSkills]));

    const sprintFocus = [
      combinedTopics[0] || `${targetRole} Core`,
      combinedTopics[1] || `${targetRole} Implementation`,
      combinedTopics[2] || "Concurrency & Resilience",
      combinedTopics[3] || "System Design & Architecture",
      combinedTopics[4] || "Performance & Optimization",
      combinedTopics[5] || "End-to-End Live Coding",
      combinedTopics[6] || "Leadership & Culture Fit",
    ];

    const category = getRoleCategory(targetRole);

    // Build 7-day sprint plan
    const sprintDays: SprintDayDefinition[] = [
      {
        dayNumber: 101,
        sprintDay: 1,
        title: `Day 1: ${sprintFocus[0]} Core Diagnostics & Rapid Coding`,
        focusSkill: sprintFocus[0],
        durationMinutes: 60,
        mcqCount: 5,
        codingProblem: {
          title: `${sprintFocus[0]} Boundary & Validation Handler`,
          difficulty: "Easy",
          description: `Implement a defensive input sanitization and verification handler for ${sprintFocus[0]} enforcing strict type boundaries and error handling.`,
        },
        behavioralQuestion: {
          question: "Tell me about a complex technical challenge you faced and how you overcame it.",
          starFrameworkTip: "Use Situation (the context), Task (your goal), Action (the specific code/architecture you built), Result (measurable metric outcome).",
          sampleAiAnswer: `In my last project, our API latency spiked past 800ms due to unindexed database queries. As lead engineer, I profiled the query execution plan using EXPLAIN ANALYZE, identified missing composite indexes on tenant_id and created_at, and restructured the ORM query into batch CTEs. This reduced p95 query latency by 72% and eliminated timeouts during traffic spikes.`,
        },
      },
      {
        dayNumber: 102,
        sprintDay: 2,
        title: `Day 2: ${sprintFocus[1]} Applied Implementation & Data Flow`,
        focusSkill: sprintFocus[1],
        durationMinutes: 60,
        mcqCount: 5,
        codingProblem: {
          title: `Optimized ${sprintFocus[1]} Processing Pipeline`,
          difficulty: "Medium",
          description: `Construct an efficient processing pipeline for ${sprintFocus[1]} that maintains O(N) linear time complexity and minimizes memory allocations.`,
        },
        behavioralQuestion: {
          question: "Describe a time you had a technical disagreement with a teammate. How did you resolve it?",
          starFrameworkTip: "Focus on objective data, benchmarking prototypes, collaborative compromise, and team alignment.",
          sampleAiAnswer: `When deciding between GraphQL and REST for our microservice communication, a teammate favored GraphQL for client flexibility while I was concerned with caching complexity. Instead of debating, we built synthetic load-testing prototypes with k6. We proved that for our write-heavy internal pipeline, REST with Redis caching provided 3x lower latency. We documented the findings together and aligned on REST for that service while utilizing GraphQL for the public mobile BFF.`,
        },
      },
      {
        dayNumber: 103,
        sprintDay: 3,
        title: `Day 3: ${sprintFocus[2]} Concurrency, Race Hazards & Async Safety`,
        focusSkill: sprintFocus[2],
        durationMinutes: 60,
        mcqCount: 5,
        codingProblem: {
          title: `Resilient Concurrency Limiter & Mutex Pool`,
          difficulty: "Medium",
          description: `Write a concurrency pool that limits simultaneous async executions to K concurrent workers while queueing excess tasks safely without starvation.`,
        },
        behavioralQuestion: {
          question: "Tell me about a production incident you investigated. What was your triage process?",
          starFrameworkTip: "Highlight calm methodical debugging, metric correlation, root-cause identification, hotfix deployment, and post-mortem prevention.",
          sampleAiAnswer: `During a flash sale, our payment gateway began failing with connection pool exhaustion. I immediately enabled regional rate limiting to stem cascading failures, inspected server metrics, and discovered unclosed database connections in an async catch block. I pushed an emergency hotfix wrapping the connection in a try/finally block, restoring service in 8 minutes, and later automated integration tests to prevent connection leaks.`,
        },
      },
      {
        dayNumber: 104,
        sprintDay: 4,
        title: `Day 4: System Design & Enterprise Architecture for ${targetRole}`,
        focusSkill: sprintFocus[3],
        durationMinutes: 60,
        mcqCount: 5,
        codingProblem: {
          title: `High-Throughput LRU In-Memory Cache with TTL`,
          difficulty: "Hard",
          description: `Design and implement an in-memory Least Recently Used (LRU) Cache supporting get(key) and put(key, value, ttl) operations in O(1) constant time.`,
        },
        behavioralQuestion: {
          question: "How do you prioritize technical debt against delivering urgent business product features?",
          starFrameworkTip: "Explain how technical debt impacts developer velocity, system reliability, and customer trust. Propose iterative remediation.",
          sampleAiAnswer: `I categorize technical debt into critical risks (security, data integrity), velocity blockers (brittle tests, long build times), and cosmetic debt. I advocate for allocating 15-20% of every sprint to high-leverage refactoring, demonstrating to product managers that debt remediation directly prevents outages and increases shipping velocity over the subsequent quarters.`,
        },
      },
      {
        dayNumber: 105,
        sprintDay: 5,
        title: `Day 5: Performance Profiling, Memory Safety & Optimization`,
        focusSkill: sprintFocus[4],
        durationMinutes: 60,
        mcqCount: 5,
        codingProblem: {
          title: `Streaming Chunk Aggregator with Memory Bounds`,
          difficulty: "Medium",
          description: `Process an unbounded stream of payload events and compute rolling statistical aggregates without retaining all raw items in memory.`,
        },
        behavioralQuestion: {
          question: "Give an example of when you had to learn an unfamiliar technology or framework rapidly under deadline.",
          starFrameworkTip: "Demonstrate high learning agility, isolating first principles, building minimal test sandboxes, and delivering on schedule.",
          sampleAiAnswer: `Our team needed to migrate our build infrastructure to Kubernetes within three weeks to support a new client contract. Having only basic Docker experience, I completed intensive hands-on cluster labs over a weekend, built a local Kind testbed, and authored our deployment Helm charts. We completed the migration 4 days ahead of schedule with zero downtime.`,
        },
      },
      {
        dayNumber: 106,
        sprintDay: 6,
        title: `Day 6: Live Technical Screen Simulation for ${targetRole}`,
        focusSkill: sprintFocus[5],
        durationMinutes: 60,
        mcqCount: 5,
        codingProblem: {
          title: `Enterprise ${targetRole} End-to-End Coding Challenge`,
          difficulty: "Hard",
          description: `Deliver a complete modular solution handling data validation, algorithmic transformation, and defensive edge case recovery.`,
        },
        behavioralQuestion: {
          question: "Why are you interested in this specific role and what sets you apart from other candidates?",
          starFrameworkTip: "Express authentic passion for the technical challenges of the domain, proven track record of shipping production code, and commitment to engineering excellence.",
          sampleAiAnswer: `I am passionate about ${targetRole} because I love engineering scalable, resilient systems that handle real user impact. What sets me apart is my disciplined engineering approach: I don't just write code that passes happy paths, I design defensively for concurrency, edge cases, observability, and long-term maintainability.`,
        },
      },
      {
        dayNumber: 107,
        sprintDay: 7,
        title: `Day 7: Final Executive Defense & Behavioral Capstone`,
        focusSkill: sprintFocus[6],
        durationMinutes: 60,
        mcqCount: 5,
        codingProblem: {
          title: `Production Code Review & Bug Refactoring`,
          difficulty: "Medium",
          description: `Identify 3 critical vulnerabilities (concurrency race, memory leak, and SQL/XSS injection) in a realistic code snippet and provide the hardened rewrite.`,
        },
        behavioralQuestion: {
          question: "Do you have any questions for the engineering leadership team?",
          starFrameworkTip: "Ask insightful questions about engineering culture, deployment autonomy, architectural challenges, and mentorship.",
          sampleAiAnswer: `1. What is the engineering team's approach to observability and learning from production post-mortems? 2. What is the biggest architectural bottleneck the team is currently solving as you scale this year? 3. How does the organization support continuous learning and technical leadership growth?`,
        },
      },
    ];

    // Persist sprint daily missions to database so they appear in dashboard & mission flows
    for (const sDay of sprintDays) {
      const existing = await prisma.dailyMission.findFirst({
        where: { userId, dayNumber: sDay.dayNumber },
      });

      const missionPayload = {
        userId,
        dayNumber: sDay.dayNumber,
        weekNumber: 99, // Sprint week
        title: sDay.title,
        description: `7-Day Interview Sprint (Day ${sDay.sprintDay}): 1 hour daily sprint mixing ${sDay.mcqCount} role-specific MCQs, 1 coding problem, and 1 behavioral question with sample AI answer.`,
        details: JSON.stringify({
          isInterviewSprint: true,
          sprintDay: sDay.sprintDay,
          focusSkill: sDay.focusSkill,
          durationMinutes: sDay.durationMinutes,
          codingProblem: sDay.codingProblem,
          behavioralQuestion: sDay.behavioralQuestion,
        }),
      };

      if (existing) {
        await prisma.dailyMission.update({
          where: { id: existing.id },
          data: {
            title: missionPayload.title,
            description: missionPayload.description,
            details: missionPayload.details,
          },
        });
      } else {
        await prisma.dailyMission.create({
          data: missionPayload,
        });
      }
    }

    return NextResponse.json({
      success: true,
      targetRole,
      sprintDays,
      message: "7-Day Interview Sprint successfully initialized!",
    });
  } catch (error: any) {
    console.error("Failed to enable interview mode:", error);
    return NextResponse.json(
      { error: "Failed to enable interview mode", details: error.message },
      { status: 500 }
    );
  }
}
