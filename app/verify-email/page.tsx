"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  ShieldCheck,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RotateCw,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlEmail = searchParams.get("email") || "";
  const urlOtp = searchParams.get("otp") || "";

  const [email, setEmail] = useState(urlEmail);
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize email and OTP from URL or sessionStorage
  useEffect(() => {
    let targetEmail = urlEmail;

    if (!targetEmail && typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("pending_signup");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.email) {
            targetEmail = parsed.email;
            setEmail(parsed.email);
          }
        }
      } catch {}
    }

    if (urlOtp && urlOtp.length === 6 && /^\d+$/.test(urlOtp)) {
      const parts = urlOtp.split("");
      setDigits(parts);
    }
  }, [urlEmail, urlOtp]);

  // Focus the first empty input on mount
  useEffect(() => {
    const firstEmptyIndex = digits.findIndex((d) => d === "");
    const targetIdx = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
    inputRefs.current[targetIdx]?.focus();
  }, []);

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index: number, val: string) => {
    setErrorMessage("");
    // Accept only numeric characters
    const cleanVal = val.replace(/\D/g, "");

    if (!cleanVal) {
      const newDigits = [...digits];
      newDigits[index] = "";
      setDigits(newDigits);
      return;
    }

    // Single digit input
    const newDigits = [...digits];
    newDigits[index] = cleanVal.slice(-1);
    setDigits(newDigits);

    // Auto-advance to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      // If current box is empty, move to previous and clear it
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setErrorMessage("");
    const pasted = e.clipboardData.getData("text").trim();
    const numbersOnly = pasted.replace(/\D/g, "").slice(0, 6);

    if (numbersOnly) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = numbersOnly[i] || "";
      }
      setDigits(newDigits);

      // Focus appropriate input
      const nextEmpty = numbersOnly.length < 6 ? numbersOnly.length : 5;
      inputRefs.current[nextEmpty]?.focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const fullOtp = digits.join("");
    if (fullOtp.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!email) {
      setErrorMessage("Email address is missing. Please return to the sign up page.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: fullOtp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || data.error || "Verification failed. Please try again.");
        setSubmitting(false);
        return;
      }

      setSuccessMessage("Email verified successfully! Signing you in...");

      // Attempt auto-login if credentials exist in sessionStorage
      let autoLoginSucceeded = false;
      if (typeof window !== "undefined") {
        try {
          const stored = sessionStorage.getItem("pending_signup");
          if (stored) {
            const { email: storedEmail, password, callbackUrl } = JSON.parse(stored);
            if (storedEmail === email && password) {
              const signRes = await signIn("credentials", {
                redirect: false,
                email: storedEmail,
                password,
              });

              if (signRes?.ok) {
                autoLoginSucceeded = true;
                sessionStorage.removeItem("pending_signup");
                router.push(callbackUrl || "/onboarding");
                router.refresh();
                return;
              }
            }
          }
        } catch {}
      }

      // If auto-login is not possible, redirect to login page
      if (!autoLoginSucceeded) {
        setTimeout(() => {
          router.push(`/login?verified=true&email=${encodeURIComponent(email)}`);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred.");
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending || !email) return;
    setErrorMessage("");
    setSuccessMessage("");
    setResending(true);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to resend code. Please try again.");
      } else {
        setSuccessMessage("A fresh verification code has been dispatched to your email.");
        setResendCooldown(data.cooldownSeconds || 30);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/^(.)(.*)(@.*)$/, (_, first, middle, domain) => {
        return first + middle.slice(0, 1) + "***" + domain;
      })
    : "your email address";

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[11px] font-mono font-semibold text-indigo-300 mb-4 shadow-[0_0_12px_rgba(99,102,241,0.15)]">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>SECURITY VERIFICATION</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          Check your inbox
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
          We sent a 6-digit verification code to{" "}
          <span className="text-indigo-300 font-medium font-mono">{maskedEmail}</span>.
        </p>
      </div>

      {/* Status Messages */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Glass Card */}
      <div className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Card accent glow */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <form onSubmit={handleVerify} className="space-y-6" noValidate>
          {/* Email reminder / edit */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono font-medium text-slate-300">
                Verification Code
              </label>
              <span className="text-[11px] font-mono text-slate-500">Expires in 10m</span>
            </div>

            {/* 6 Digit Input Group */}
            <div className="grid grid-cols-6 gap-2 sm:gap-3 my-2" onPaste={handlePaste}>
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-full h-13 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono text-white bg-[#0c0f18] rounded-xl border transition-all duration-150 focus:outline-none ${
                    digit
                      ? "border-indigo-500/80 bg-indigo-950/20 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                      : "border-white/[0.12] hover:border-white/20 focus:border-indigo-500"
                  }`}
                  aria-label={`Digit ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || digits.join("").length !== 6}
            className="w-full btn-gradient !py-3 !text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying code...</span>
              </>
            ) : (
              <>
                <span>Confirm &amp; Proceed</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Resend Code Section */}
        <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
          <span>Didn't receive the email?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resending}
            className="inline-flex items-center gap-1.5 font-medium text-indigo-400 hover:text-indigo-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          >
            {resending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : resendCooldown > 0 ? (
              <span className="font-mono text-slate-500">Resend in {resendCooldown}s</span>
            ) : (
              <>
                <RotateCw className="w-3.5 h-3.5" />
                <span>Resend OTP</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="mt-6 text-center space-y-2 text-xs text-slate-500">
        <p>
          Entered the wrong email?{" "}
          <Link
            href="/signup"
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
          >
            Back to Sign Up
          </Link>
        </p>
        <p>
          Already verified?{" "}
          <Link
            href="/login"
            className="text-slate-400 hover:text-slate-300 underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 relative overflow-x-hidden selection:bg-indigo-500/30">
      <div className="bg-mesh-glow" />
      <div className="fixed inset-0 bg-grid-tech pointer-events-none opacity-40 z-0" />

      <Navbar />

      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 sm:px-6 py-12 relative z-10">
        <Suspense
          fallback={
            <div className="font-mono text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              Loading security portal...
            </div>
          }
        >
          <VerifyEmailForm />
        </Suspense>
      </main>
    </div>
  );
}
