/**
 * POST /api/auth/send-otp
 *
 * Sends / resends a fresh 6-digit OTP to the user's email.
 * Enforces rate limit (max 3 requests per hour).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resendOtp } from "@/lib/email/otpService";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    await resendOtp(parsed.data.email);

    return NextResponse.json({ success: true, message: "Verification code sent." });
  } catch (error: any) {
    const isRateLimit =
      typeof error?.message === "string" &&
      error.message.toLowerCase().includes("too many");

    return NextResponse.json(
      { error: error?.message || "Failed to send verification code." },
      { status: isRateLimit ? 429 : 400 }
    );
  }
}
