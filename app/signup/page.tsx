"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff, Loader2, AlertCircle, Sparkles } from "lucide-react";
import Navbar from "@/app/components/Navbar";

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/get-started";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    setErrors({});

    const result = signupSchema.safeParse({ name, email, password, confirmPassword });
    if (!result.success) {
      const fe: FormErrors = {};
      for (const issue of result.error.issues) {
        const f = issue.path[0] as keyof FormErrors;
        if (!fe[f]) fe[f] = issue.message;
      }
      setErrors(fe);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Failed to create account. Please try again.");
        setSubmitting(false);
        return;
      }

      // Store credentials temporarily so verify-email page can auto-sign in after OTP
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "pending_signup",
          JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            callbackUrl,
          })
        );
      }

      router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[420px] mx-auto">
      {/* Heading */}
      <div className="mb-8 text-left">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[11px] font-mono text-indigo-300 mb-3">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          Get Started Free
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Start building your AI-guided, verified career acceleration roadmap.
        </p>
      </div>

      {/* Server error */}
      {serverError && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label htmlFor="su-name" className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              Full Name
            </label>
            <input
              id="su-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
              }}
              placeholder="Ada Lovelace"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 bg-[#0c0f18] focus:outline-none transition-colors ${
                errors.name ? "border-rose-500" : "border-white/[0.12] focus:border-indigo-500"
              }`}
            />
            {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="su-email" className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              Email address
            </label>
            <input
              id="su-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="you@example.com"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 bg-[#0c0f18] focus:outline-none transition-colors ${
                errors.email ? "border-rose-500" : "border-white/[0.12] focus:border-indigo-500"
              }`}
            />
            {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="su-password" className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="su-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                }}
                placeholder="••••••••"
                className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-slate-500 bg-[#0c0f18] focus:outline-none transition-colors ${
                  errors.password ? "border-rose-500" : "border-white/[0.12] focus:border-indigo-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="su-confirm" className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              Confirm Password
            </label>
            <input
              id="su-confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined }));
              }}
              placeholder="••••••••"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 bg-[#0c0f18] focus:outline-none transition-colors ${
                errors.confirmPassword ? "border-rose-500" : "border-white/[0.12] focus:border-indigo-500"
              }`}
            />
            {errors.confirmPassword && <p className="text-xs text-rose-400 mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-gradient !py-3 !text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account &amp; Begin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        Already have an account?{" "}
        <Link
          href={`/login${callbackUrl !== "/onboarding" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
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
              Loading registration portal...
            </div>
          }
        >
          <SignupForm />
        </Suspense>
      </main>
    </div>
  );
}
