import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isInternalAdminUser } from "@/lib/featureFlags";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory sliding window rate limiter
// 100 requests per minute per IP
interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { timestamps: [] };

  // Remove timestamps outside the sliding window
  const validTimestamps = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW);

  if (validTimestamps.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(ip, { timestamps: validTimestamps });
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, { timestamps: validTimestamps });
  return true;
}

// Clean up stale rate limit entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
      const valid = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW);
      if (valid.length === 0) {
        rateLimitMap.delete(ip);
      } else {
        rateLimitMap.set(ip, { timestamps: valid });
      }
    }
  }, 300000);
}

// Mask sensitive identifiers for privacy
function maskIdentifier(id?: string | null): string {
  if (!id) return "anonymous";
  if (id.length <= 8) return id.substring(0, 3) + "***";
  return id.substring(0, 4) + "***" + id.substring(id.length - 4);
}

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate Admin User
    const session = await getServerSession(authOptions);
    if (!session?.user || !isInternalAdminUser(session.user)) {
      return NextResponse.json(
        { error: "Unauthorized: Admin privileges required." },
        { status: 403 }
      );
    }

    // 2. Enforce Rate Limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "127.0.0.1";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 100 requests per minute." },
        { status: 429 }
      );
    }

    // 3. Parse & Validate Date Range (default: last 14 days)
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (startDateParam) {
      startDate = new Date(startDateParam);
      if (isNaN(startDate.getTime())) {
        startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      }
    } else {
      startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    }

    if (endDateParam) {
      endDate = new Date(endDateParam);
      if (isNaN(endDate.getTime())) {
        endDate = new Date();
      }
    } else {
      endDate = new Date();
    }

    // Normalize start to beginning of day, end to end of day if ISO date string (YYYY-MM-DD)
    if (startDateParam && startDateParam.length === 10) {
      startDate.setHours(0, 0, 0, 0);
    }
    if (endDateParam && endDateParam.length === 10) {
      endDate.setHours(23, 59, 59, 999);
    }

    // Validate range ordering
    if (endDate < startDate) {
      return NextResponse.json(
        { error: "Invalid date range: endDate must be greater than or equal to startDate." },
        { status: 400 }
      );
    }

    // Limit max window to 90 days
    const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 90) {
      return NextResponse.json(
        { error: "Date range exceeds maximum limit of 90 days." },
        { status: 400 }
      );
    }

    // 4. Query Analytics Events in Range
    const events = await prisma.analyticsEvent.findMany({
      where: {
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        eventId: true,
        eventName: true,
        onboardingVariant: true,
        step: true,
        stepName: true,
        durationMs: true,
        occurredAt: true,
        userId: true,
        anonymousId: true,
      },
      orderBy: {
        occurredAt: "desc",
      },
    });

    // 5. Overall User & Variant Breakdown
    const v2UserSet = new Set<string>();
    const controlUserSet = new Set<string>();

    for (const evt of events) {
      const idKey = evt.userId || evt.anonymousId || evt.eventId;
      const variant = evt.onboardingVariant === "v2" ? "v2" : "control";
      if (variant === "v2") {
        v2UserSet.add(idKey);
      } else {
        controlUserSet.add(idKey);
      }
    }

    const v2Users = v2UserSet.size;
    const controlUsers = controlUserSet.size;
    const totalUsers = v2Users + controlUsers;

    // 6. Funnel Computation
    // Count distinct candidate journeys through each milestone
    const funnel = {
      v2: {
        started: 0,
        step1Completed: 0,
        step2Completed: 0,
        step3Completed: 0,
        step4Completed: 0,
        step5Completed: 0,
        completed: 0,
        completionRate: 0,
      },
      control: {
        started: 0,
        step1Completed: 0,
        step2Completed: 0,
        step3Completed: 0,
        step4Completed: 0,
        step5Completed: 0,
        completed: 0,
        completionRate: 0,
      },
    };

    // Tracking distinct user progress per step
    const funnelSets = {
      v2: {
        started: new Set<string>(),
        step1: new Set<string>(),
        step2: new Set<string>(),
        step3: new Set<string>(),
        step4: new Set<string>(),
        step5: new Set<string>(),
        completed: new Set<string>(),
      },
      control: {
        started: new Set<string>(),
        step1: new Set<string>(),
        step2: new Set<string>(),
        step3: new Set<string>(),
        step4: new Set<string>(),
        step5: new Set<string>(),
        completed: new Set<string>(),
      },
    };

    for (const evt of events) {
      const v = evt.onboardingVariant === "v2" ? "v2" : "control";
      const u = evt.userId || evt.anonymousId || evt.eventId;
      const sets = funnelSets[v];

      if (evt.eventName === "onboarding_started") {
        sets.started.add(u);
      } else if (evt.eventName === "onboarding_step_completed") {
        if (evt.step === 1) sets.step1.add(u);
        else if (evt.step === 2) sets.step2.add(u);
        else if (evt.step === 3) sets.step3.add(u);
        else if (evt.step === 4) sets.step4.add(u);
        else if (evt.step === 5) sets.step5.add(u);
      } else if (evt.eventName === "onboarding_completed") {
        sets.completed.add(u);
      }
    }

    // Populate counts
    for (const v of ["v2", "control"] as const) {
      const s = funnelSets[v];
      const startedCount = s.started.size;
      const completedCount = s.completed.size;

      funnel[v] = {
        started: startedCount,
        step1Completed: s.step1.size,
        step2Completed: s.step2.size,
        step3Completed: s.step3.size,
        step4Completed: s.step4.size,
        step5Completed: s.step5.size,
        completed: completedCount,
        completionRate: startedCount > 0 ? Number(((completedCount / startedCount) * 100).toFixed(1)) : 0,
      };
    }

    // 7. Drop-Off Analysis
    // Calculates user drop-off between milestones
    const dropOffByStep = {
      v2: {
        step1: Math.max(0, funnel.v2.started - funnel.v2.step1Completed),
        step2: Math.max(0, funnel.v2.step1Completed - funnel.v2.step2Completed),
        step3: Math.max(0, funnel.v2.step2Completed - funnel.v2.step3Completed),
        step4: Math.max(0, funnel.v2.step3Completed - funnel.v2.step4Completed),
        step5: Math.max(0, funnel.v2.step4Completed - funnel.v2.step5Completed),
      },
      control: {
        step1: Math.max(0, funnel.control.started - funnel.control.step1Completed),
        step2: Math.max(0, funnel.control.step1Completed - funnel.control.step2Completed),
        step3: Math.max(0, funnel.control.step2Completed - funnel.control.step3Completed),
        step4: Math.max(0, funnel.control.step3Completed - funnel.control.step4Completed),
        step5: Math.max(0, funnel.control.step4Completed - funnel.control.step5Completed),
      },
    };

    // 8. Median Time to Complete (50th percentile in seconds)
    const completionDurations = {
      v2: [] as number[],
      control: [] as number[],
    };

    for (const evt of events) {
      if (evt.eventName === "onboarding_completed" && typeof evt.durationMs === "number" && evt.durationMs > 0) {
        const v = evt.onboardingVariant === "v2" ? "v2" : "control";
        completionDurations[v].push(evt.durationMs);
      }
    }

    function calculateMedianSeconds(durations: number[]): number {
      if (durations.length === 0) return 0;
      durations.sort((a, b) => a - b);
      const mid = Math.floor(durations.length / 2);
      const medianMs =
        durations.length % 2 !== 0
          ? durations[mid]
          : (durations[mid - 1] + durations[mid]) / 2;
      return Math.round(medianMs / 1000);
    }

    const medianTimeToComplete = {
      v2: calculateMedianSeconds(completionDurations.v2),
      control: calculateMedianSeconds(completionDurations.control),
    };

    // 9. Day-7 Retention (CRITICAL SPECIFICATION):
    // For each candidate who completed onboarding within range:
    // Window = [completionDate + 7 days, completionDate + 8 days]
    // Check if the user had ANY activity in that 24h window
    const completedUsers: Array<{ id: string; variant: "v2" | "control"; completedAt: Date }> = [];
    const seenCompleted = new Set<string>();

    for (const evt of events) {
      if (evt.eventName === "onboarding_completed") {
        const uid = evt.userId || evt.anonymousId;
        if (uid && !seenCompleted.has(uid)) {
          seenCompleted.add(uid);
          completedUsers.push({
            id: uid,
            variant: evt.onboardingVariant === "v2" ? "v2" : "control",
            completedAt: evt.occurredAt,
          });
        }
      }
    }

    // Check retention events for completed users
    let v2Retained = 0;
    let controlRetained = 0;
    let v2CompletedTotal = 0;
    let controlCompletedTotal = 0;

    for (const user of completedUsers) {
      if (user.variant === "v2") v2CompletedTotal++;
      else controlCompletedTotal++;

      const day7Start = new Date(user.completedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      const day7End = new Date(user.completedAt.getTime() + 8 * 24 * 60 * 60 * 1000);

      // Check if user has any event in this day 7-8 window
      const returnedEvent = await prisma.analyticsEvent.findFirst({
        where: {
          OR: [{ userId: user.id }, { anonymousId: user.id }],
          occurredAt: {
            gte: day7Start,
            lte: day7End,
          },
        },
        select: { id: true },
      });

      if (returnedEvent) {
        if (user.variant === "v2") v2Retained++;
        else controlRetained++;
      }
    }

    const day7Retention = {
      v2: v2CompletedTotal > 0 ? Number(((v2Retained / v2CompletedTotal) * 100).toFixed(1)) : 0,
      control: controlCompletedTotal > 0 ? Number(((controlRetained / controlCompletedTotal) * 100).toFixed(1)) : 0,
    };

    // 10. Email Metrics (from User table & email_link_clicked events)
    const emailUsersSent = await prisma.user.count({
      where: {
        lastWeeklyReportSent: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const emailClicks = await prisma.analyticsEvent.count({
      where: {
        eventName: "email_link_clicked",
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const emailMetrics = {
      sent: emailUsersSent,
      clicks: emailClicks,
      clickThroughRate:
        emailUsersSent > 0
          ? Number(((emailClicks / emailUsersSent) * 100).toFixed(1))
          : 0,
    };

    // 11. Recent Activity Feed (Sanitized last 50 events)
    const recentEvents = events.slice(0, 50).map((evt) => ({
      eventId: evt.eventId,
      eventName: evt.eventName,
      variant: (evt.onboardingVariant === "v2" ? "v2" : "control") as "v2" | "control",
      step: evt.step,
      stepName: evt.stepName,
      occurredAt: evt.occurredAt.toISOString(),
      userId: evt.userId ? maskIdentifier(evt.userId) : null,
      anonymousId: evt.anonymousId ? maskIdentifier(evt.anonymousId) : null,
    }));

    return NextResponse.json({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalUsers,
      v2Users,
      controlUsers,
      funnel,
      dropOffByStep,
      medianTimeToComplete,
      day7Retention,
      emailMetrics,
      recentEvents,
    });
  } catch (error: any) {
    console.error("Admin analytics aggregation error:", error);
    return NextResponse.json(
      { error: "Internal server error aggregating analytics data." },
      { status: 500 }
    );
  }
}
