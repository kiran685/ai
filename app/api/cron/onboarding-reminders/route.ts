import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/mailer";
import { generateOnboardingReminderHtml } from "@/lib/email/templates/onboardingReminder";
import { generateWeek1ActivationHtml } from "@/lib/email/templates/week1Activation";
import { generateWeeklyReengagementHtml } from "@/lib/email/templates/weeklyReengagement";

export const runtime = "nodejs";

const ONBOARDING_STEP_NAMES: Record<number, string> = {
  1: "Resume Upload",
  2: "AI Capability Analysis",
  3: "Role Discovery Fit",
  4: "Roadmap Calibration",
  5: "Roadmap Launch",
};

export async function POST(req: NextRequest) {
  // ── Auth guard: CRON_SECRET or Cron-Secret header ────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cronHeader = req.headers.get("cron-secret") || req.headers.get("x-cron-secret");

  if (cronSecret && token !== cronSecret && cronHeader !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const stats = {
    sequence1Sent: 0,
    sequence2Sent: 0,
    sequence3Sent: 0,
    errors: [] as string[],
  };

  try {
    // =========================================================================
    // SEQUENCE 1: Onboarding Abandonment (Started >24h ago, not completed)
    // =========================================================================
    const abandonedUsers = await prisma.user.findMany({
      where: {
        onboardingCompleted: false,
        email: { not: null },
        updatedAt: { lte: twentyFourHoursAgo },
      },
      include: {
        careerProfiles: {
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
      take: 50,
    });

    for (const user of abandonedUsers) {
      if (!user.email) continue;
      const step = user.onboardingStep || 1;
      const stepName = ONBOARDING_STEP_NAMES[step] || "Roadmap Calibration";
      const targetRole = user.careerProfiles[0]?.targetRole || "Software Engineer";

      try {
        const html = generateOnboardingReminderHtml({
          name: user.name,
          lastStep: step,
          lastStepName: stepName,
          targetRole,
          ctaUrl: `${appUrl}/onboarding?step=${step}`,
        });

        await sendEmail({
          to: user.email,
          subject: "You're 1 step away from your personalized career roadmap",
          html,
          text: `Hi ${user.name || "there"}, you're at Step ${step}: ${stepName}. Finish your roadmap at ${appUrl}/onboarding?step=${step}`,
        });

        stats.sequence1Sent++;
      } catch (err: any) {
        stats.errors.push(`Seq1 error for user ${user.id}: ${err.message}`);
      }
    }

    // =========================================================================
    // SEQUENCE 2: Week-1 Activation (Completed onboarding >48h ago, no Day 1 passed)
    // =========================================================================
    const completedUsers = await prisma.user.findMany({
      where: {
        onboardingCompleted: true,
        email: { not: null },
        updatedAt: { lte: fortyEightHoursAgo },
      },
      include: {
        careerProfiles: {
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
        dailyMissions: {
          where: { dayNumber: 1 },
        },
        assessments: {
          where: { dayNumber: 1, passed: true },
        },
      },
      take: 50,
    });

    for (const user of completedUsers) {
      if (!user.email) continue;
      const day1Passed =
        user.dailyMissions.some((m) => m.completed) ||
        user.assessments.length > 0;

      if (day1Passed) continue; // Skip activated users

      const targetRole = user.careerProfiles[0]?.targetRole || "Software Engineer";
      const day1Topic =
        user.dailyMissions[0]?.title ||
        `${targetRole} Core Architecture & Runtime Mechanics`;

      try {
        const html = generateWeek1ActivationHtml({
          name: user.name,
          targetRole,
          day1Topic,
          ctaUrl: `${appUrl}/mission/day/week-1_day-1`,
        });

        await sendEmail({
          to: user.email,
          subject: "Start your 8-week plan – Day 1 takes ~15 minutes",
          html,
          text: `Hi ${user.name || "there"}, Day 1 of your ${targetRole} roadmap is ready: ${day1Topic}. Open mission: ${appUrl}/mission/day/week-1_day-1`,
        });

        stats.sequence2Sent++;
      } catch (err: any) {
        stats.errors.push(`Seq2 error for user ${user.id}: ${err.message}`);
      }
    }

    // =========================================================================
    // SEQUENCE 3: Weekly Re-engagement (7 Days Inactive)
    // =========================================================================
    const inactiveUsers = await prisma.user.findMany({
      where: {
        onboardingCompleted: true,
        email: { not: null },
        weeklyReportEnabled: true,
        updatedAt: { lte: sevenDaysAgo },
      },
      include: {
        careerProfiles: {
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
        skillGaps: {
          include: { skill: true },
          take: 1,
        },
        dailyMissions: {
          orderBy: { dayNumber: "asc" },
        },
      },
      take: 50,
    });

    for (const user of inactiveUsers) {
      if (!user.email) continue;
      const targetRole = user.careerProfiles[0]?.targetRole || "Software Engineer";
      const priorityGap =
        user.skillGaps[0]?.skill?.name || "System Design & Concurrency Safety";

      // Find first uncompleted mission
      const nextMission = user.dailyMissions.find((m) => !m.completed);
      const nextDayNumber = nextMission?.dayNumber || 1;
      const nextDayTopic =
        nextMission?.title || `${targetRole} Production Foundations`;

      try {
        const html = generateWeeklyReengagementHtml({
          name: user.name,
          targetRole,
          priorityGap,
          nextDayNumber,
          nextDayTopic,
          ctaUrl: `${appUrl}/dashboard`,
        });

        await sendEmail({
          to: user.email,
          subject: "We miss you – Keep your career momentum going",
          html,
          text: `Hi ${user.name || "there"}, keep your momentum going for ${targetRole}. Focus on ${priorityGap} today: ${appUrl}/dashboard`,
        });

        stats.sequence3Sent++;
      } catch (err: any) {
        stats.errors.push(`Seq3 error for user ${user.id}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error: any) {
    console.error("Onboarding reminder cron error:", error);
    return NextResponse.json(
      { error: "Cron execution failed", details: error.message },
      { status: 500 }
    );
  }
}
