import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json().catch(() => ({}));
    } else {
      const text = await req.text().catch(() => "");
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }
    }

    const session = await getServerSession(authOptions).catch(() => null);
    const candidateUserId = session?.user?.id || (body.userId !== "anonymous" ? body.userId : null);

    // Verify user exists in User table to avoid foreign key errors
    let effectiveUserId: string | null = null;
    if (candidateUserId) {
      try {
        const existing = await prisma.user.findUnique({
          where: { id: candidateUserId },
          select: { id: true },
        });
        if (existing) {
          effectiveUserId = existing.id;
        }
      } catch {
        effectiveUserId = null;
      }
    }

    const eventName = body.event || body.eventName || "unknown";
    const eventId =
      body.eventId ||
      `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const variant =
      body.variant ||
      body.onboardingVariant ||
      body.metadata?.variant ||
      "v2";

    const duration =
      typeof body.timeSpentMs === "number"
        ? body.timeSpentMs
        : typeof body.durationMs === "number"
        ? body.durationMs
        : null;

    // Structured logging for production observability
    console.log(
      `📊 [ANALYTICS] event=${eventName} user=${effectiveUserId || body.anonymousId || "anon"} variant=${variant} step=${body.step || "N/A"}`
    );

    // Idempotent upsert to ensure no duplicate event IDs
    await prisma.analyticsEvent
      .upsert({
        where: { eventId },
        update: {},
        create: {
          eventId,
          eventName,
          occurredAt: body.timestamp ? new Date(body.timestamp) : new Date(),
          sessionId: body.sessionId || `sess_${Date.now()}`,
          anonymousId: body.anonymousId || (effectiveUserId ? null : "anon_user"),
          userId: effectiveUserId,
          onboardingVariant: variant,
          step: typeof body.step === "number" ? body.step : null,
          stepName: body.stepName || null,
          durationMs: duration,
          selectedRole: body.targetRole || body.selectedRole || null,
          errorCode: body.errorCode || null,
          route: body.route || "/onboarding",
          metadata: body.metadata
            ? JSON.stringify(body.metadata).slice(0, 2048)
            : null,
        },
      })
      .catch((err) => {
        console.error("Failed to persist AnalyticsEvent:", err);
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics track error:", error);
    return NextResponse.json({ success: false }, { status: 200 }); // Always 200 for beacons
  }
}

