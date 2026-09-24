import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/mailer";
import { generateFeedbackNotificationHtml } from "@/lib/email/templates/feedbackNotification";

export const runtime = "nodejs";

const feedbackSchema = z.object({
  type: z.enum(["Bug", "Feature request", "General feedback", "bug", "feature_request", "general"]).default("General feedback"),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  message: z.string().min(3, "Feedback message must be at least 3 characters").max(4000),
  email: z.string().email().optional().or(z.literal("")),
  route: z.string().optional().default("/"),
  screenshotNote: z.string().max(2000).optional(),
});

const ADMIN_FEEDBACK_EMAIL = "sskiran961@gmail.com";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    const body = await request.json().catch(() => ({}));

    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid feedback payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { type, rating, message, email, route, screenshotNote } = parsed.data;

    const userEmail = session?.user?.email || (email ? email : null);
    const userName = session?.user?.name || null;
    const userId = session?.user?.id || null;

    // Persist to Feedback table
    // Ensure we handle case where user is guest or authenticated
    const feedbackMetadata = {
      email: userEmail,
      type,
      route,
      screenshotNote,
      userName,
      ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
    };

    // If userId exists and is valid in DB, link it, otherwise fallback gracefully
    let resolvedUserId: string | null = null;
    if (userId) {
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (userExists) {
        resolvedUserId = userExists.id;
      }
    }

    // If user is guest and no user in DB, create or find a system placeholder user if relation is required
    let finalUserId = resolvedUserId;
    if (!finalUserId) {
      // Find or create a system guest record if necessary
      const guest = await prisma.user.findFirst({
        where: { email: "system_feedback_guest@aicareer.os" },
        select: { id: true },
      });
      if (guest) {
        finalUserId = guest.id;
      } else {
        const newGuest = await prisma.user.create({
          data: {
            email: "system_feedback_guest@aicareer.os",
            name: "Guest Feedback Submitter",
          },
          select: { id: true },
        }).catch(() => null);
        finalUserId = newGuest?.id || null;
      }
    }

    if (finalUserId) {
      await prisma.feedback.create({
        data: {
          userId: finalUserId,
          email: userEmail,
          type: type.toLowerCase().replace(/\s+/g, "_"),
          route: route || "/",
          category: type.toUpperCase().replace(/\s+/g, "_"),
          rating: rating ?? null,
          content: message,
          metadata: JSON.stringify(feedbackMetadata),
        },
      });
    }

    // Dispatches notification email directly to sskiran961@gmail.com
    const emailHtml = generateFeedbackNotificationHtml({
      type,
      rating,
      message,
      email: userEmail,
      userName,
      route,
      screenshotNote,
      submittedAt: new Date().toLocaleString("en-US", { timeZoneName: "short" }),
    });

    await sendEmail({
      to: ADMIN_FEEDBACK_EMAIL,
      subject: `AI Career OS Feedback – [${type}] from ${userEmail || "Anonymous"}`,
      html: emailHtml,
      text: `New Feedback received: [${type}]\nFrom: ${userEmail || "Anonymous"}\nRating: ${rating ? `${rating}/5` : "N/A"}\nRoute: ${route}\nMessage:\n${message}`,
    }).catch((emailErr) => {
      console.error("Failed to dispatch feedback email:", emailErr);
    });

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully. Thank you!",
    });
  } catch (error: any) {
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback." },
      { status: 500 }
    );
  }
}
