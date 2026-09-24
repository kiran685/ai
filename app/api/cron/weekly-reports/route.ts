/**
 * POST /api/cron/weekly-reports
 *
 * Sends weekly progress report emails to eligible users.
 * Protected by CRON_SECRET header.
 *
 * Eligible users:
 *  - emailVerified IS NOT NULL
 *  - weeklyReportEnabled = true
 *  - lastWeeklyReportSent IS NULL OR lastWeeklyReportSent < 7 days ago
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/mailer";
import {
  generateWeeklyReportHtml,
  generateWeeklyReportText,
} from "@/lib/email/templates/weeklyReport";

export const runtime = "nodejs";

function getWeekLabel(): string {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(now)}`;
}

export async function POST(req: NextRequest) {
  // ── Auth guard ──────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const weekLabel = getWeekLabel();

  // ── Fetch eligible users ───────────────────────────────────────────────
  const users = await prisma.user.findMany({
    where: {
      emailVerified: { not: null },
      weeklyReportEnabled: true,
      OR: [
        { lastWeeklyReportSent: null },
        { lastWeeklyReportSent: { lt: sevenDaysAgo } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      lastWeeklyReportSent: true,
      careerProfiles: {
        select: {
          targetRole: true,
          readinessDetails: true,
          alignmentScore: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      dailyMissions: {
        where: { createdAt: { gte: sevenDaysAgo }, completed: true },
        select: { title: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      skillGaps: {
        where: { severity: { in: ["high", "CRITICAL", "HIGH"] } },
        select: { skill: { select: { name: true } } },
        take: 2,
      },
    },
  });

  let sent = 0;
  let errors = 0;

  for (const user of users) {
    if (!user.email) continue;

    try {
      const profile = user.careerProfiles[0];
      const role = profile?.targetRole || "Your Career Path";

      // Parse readiness score — try readinessDetails JSON first, fall back to alignmentScore
      let readinessScore = profile?.alignmentScore ?? 0;
      if (profile?.readinessDetails) {
        try {
          const rd = JSON.parse(profile.readinessDetails);
          if (typeof rd?.overallScore === "number") readinessScore = rd.overallScore;
          else if (typeof rd?.score === "number") readinessScore = rd.score;
        } catch {}
      }

      const completedCount = user.dailyMissions.length;
      const missions = user.dailyMissions.map((m) => m.title);
      const priorityGaps = user.skillGaps.map((g) => g.skill.name);

      await sendEmail({
        to: user.email,
        subject: `Your AI Career OS Weekly Report – ${weekLabel}`,
        html: generateWeeklyReportHtml({
          name: user.name || "there",
          role,
          completedCount,
          missions,
          readinessScore,
          priorityGaps,
          ctaUrl: `${appUrl}/dashboard`,
          weekLabel,
        }),
        text: generateWeeklyReportText({
          name: user.name || "there",
          role,
          completedCount,
          missions,
          readinessScore,
          priorityGaps,
          ctaUrl: `${appUrl}/dashboard`,
          weekLabel,
        }),
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { lastWeeklyReportSent: new Date() },
      });

      sent++;
    } catch (err) {
      console.error(`[weekly-reports] Failed for user ${user.id}:`, err);
      errors++;
    }
  }

  console.log(`[weekly-reports] Done — sent: ${sent}, errors: ${errors}, total eligible: ${users.length}`);
  return NextResponse.json({ success: true, sent, errors, eligible: users.length });
}

// Also support GET for simple health check (still requires secret)
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const count = await prisma.user.count({
    where: {
      emailVerified: { not: null },
      weeklyReportEnabled: true,
      OR: [{ lastWeeklyReportSent: null }, { lastWeeklyReportSent: { lt: sevenDaysAgo } }],
    },
  });

  return NextResponse.json({ eligible: count });
}
