/**
 * OTP Service — Email Verification
 *
 * - Generates cryptographically secure 6-digit OTPs
 * - SHA-256 hashes before DB storage (no plaintext at rest)
 * - 10-minute expiry + one-time consumed flag
 * - Rate limiting: max 3 OTP requests per email per hour
 */

import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/mailer";
import {
  generateVerifyEmailHtml,
  generateVerifyEmailText,
} from "@/lib/email/templates/verifyEmail";

const OTP_EXPIRY_MINUTES = 10;
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MINUTES = 60;

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

export function generateOtp(): string {
  // Cryptographically secure 6-digit number (000000 – 999999)
  const value = crypto.randomInt(0, 1_000_000);
  return String(value).padStart(6, "0");
}

export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

export async function checkRateLimit(email: string): Promise<void> {
  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
  );

  const recentCount = await prisma.emailOtp.count({
    where: {
      email: email.toLowerCase(),
      createdAt: { gte: windowStart },
    },
  });

  if (recentCount >= RATE_LIMIT_MAX) {
    throw new Error(
      `Too many verification requests. Please wait before requesting another code.`
    );
  }
}

// ---------------------------------------------------------------------------
// Create & send OTP
// ---------------------------------------------------------------------------

export async function createAndSendOtp(
  userId: string,
  email: string,
  name: string
): Promise<void> {
  await checkRateLimit(email);

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate (consume) any previous unconsumed OTPs for this user
  await prisma.emailOtp.updateMany({
    where: { userId, consumed: false },
    data: { consumed: true },
  });

  // Store new OTP record
  await prisma.emailOtp.create({
    data: {
      userId,
      email: email.toLowerCase(),
      otpHash,
      expiresAt,
      consumed: false,
    },
  });

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/verify-email?otp=${otp}&email=${encodeURIComponent(email)}`;

  await sendEmail({
    to: email,
    subject: "Verify your email for AI Career OS",
    html: generateVerifyEmailHtml({ name, otp, verifyUrl }),
    text: generateVerifyEmailText({ name, otp, verifyUrl }),
  });
}

// ---------------------------------------------------------------------------
// Verify OTP
// ---------------------------------------------------------------------------

export type OtpVerifyResult =
  | { success: true }
  | { success: false; error: "INVALID_OTP" | "EXPIRED" | "ALREADY_VERIFIED" | "NOT_FOUND" };

export async function verifyOtp(
  userId: string,
  plainOtp: string
): Promise<OtpVerifyResult> {
  const otpHash = hashOtp(plainOtp.trim());

  // Find the latest unconsumed OTP for this user
  const record = await prisma.emailOtp.findFirst({
    where: {
      userId,
      consumed: false,
      otpHash,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { success: false, error: "INVALID_OTP" };
  }

  if (record.expiresAt < new Date()) {
    // Mark as consumed so it can't be replayed
    await prisma.emailOtp.update({
      where: { id: record.id },
      data: { consumed: true },
    });
    return { success: false, error: "EXPIRED" };
  }

  // Mark consumed (one-time use)
  await prisma.emailOtp.update({
    where: { id: record.id },
    data: { consumed: true },
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Resend OTP (by email — looks up user)
// ---------------------------------------------------------------------------

export async function resendOtp(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, name: true, email: true, emailVerified: true },
  });

  if (!user) {
    throw new Error("No account found with this email address.");
  }

  if (user.emailVerified) {
    throw new Error("This email address is already verified.");
  }

  await createAndSendOtp(user.id, user.email!, user.name || "there");
}
