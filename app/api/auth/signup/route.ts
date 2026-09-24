/**
 * POST /api/auth/signup
 *
 * Dedicated signup route. Creates the User, sends OTP, returns { success, email }.
 * Does NOT sign in — that happens after email verification.
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAndSendOtp } from "@/lib/email/otpService";

export const runtime = "nodejs";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Validation error";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Check for existing account
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, emailVerified: true },
    });

    if (existing) {
      if (existing.emailVerified) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in." },
          { status: 409 }
        );
      }
      // Account exists but unverified — resend OTP
      try {
        await createAndSendOtp(existing.id, normalizedEmail, name.trim());
      } catch (otpErr: any) {
        return NextResponse.json(
          { error: otpErr.message || "Failed to send verification code" },
          { status: 429 }
        );
      }
      return NextResponse.json({ success: true, email: normalizedEmail, resent: true });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (emailVerified = null = unverified)
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        // emailVerified intentionally NOT set — stays null until OTP confirmed
      },
    });

    // Send OTP
    try {
      await createAndSendOtp(user.id, normalizedEmail, name.trim());
    } catch (otpErr: any) {
      // Rollback user creation if OTP rate-limited
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
      return NextResponse.json(
        { error: otpErr.message || "Failed to send verification code" },
        { status: 429 }
      );
    }

    return NextResponse.json({ success: true, email: normalizedEmail });
  } catch (error: any) {
    console.error("[POST /api/auth/signup] error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
