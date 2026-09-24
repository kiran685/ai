/**
 * POST /api/auth/verify-email
 *
 * Validates a 6-digit OTP for a given email.
 * On success: sets User.emailVerified = now().
 * Client then calls signIn("credentials") to complete login.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/email/otpService";

export const runtime = "nodejs";

const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request. Please provide a valid email and 6-digit code." },
        { status: 400 }
      );
    }

    const { email, otp } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Look up user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address." },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "already_verified", message: "This email is already verified. Please sign in." },
        { status: 200 }
      );
    }

    // Verify OTP
    const result = await verifyOtp(user.id, otp);

    if (!result.success) {
      const messages: Record<string, string> = {
        INVALID_OTP: "Incorrect code. Please check and try again.",
        EXPIRED: "This code has expired. Please request a new one.",
        ALREADY_VERIFIED: "This email is already verified.",
        NOT_FOUND: "Code not found. Please request a new one.",
      };
      return NextResponse.json(
        { error: result.error, message: messages[result.error] || "Invalid code." },
        { status: 400 }
      );
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/auth/verify-email] error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
