/**
 * POST /api/auth/resend-otp
 *
 * Resends a fresh OTP to the given email. 
 * Enforces rate limit (3 per hour) via otpService.
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

    return NextResponse.json({ success: true, cooldownSeconds: 30 });
  } catch (error: any) {
    const isRateLimit =
      typeof error?.message === "string" &&
      error.message.toLowerCase().includes("too many");

    return NextResponse.json(
      { error: error?.message || "Failed to resend code." },
      { status: isRateLimit ? 429 : 400 }
    );
  }
}
