"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff, Loader2, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import Navbar from "@/app/components/Navbar";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormErrors = { email?: string; password?: string };

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const verifiedParam = searchParams.get("verified") === "true";
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [verifiedSuccess, setVerifiedSuccess] = useState(verifiedParam);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    setErrors({});
    const result = loginSchema.safeParse({ email, password });
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
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
        callbackUrl,
      });
      if (res?.error) {
        setServerError(res.error === "CredentialsSignin" ? "Invalid email or password" : res.error);
        setSubmitting(false);
      } else if (res?.ok) {
        let destination = callbackUrl;
        if (callbackUrl === "/dashboard") {
          try {
            const statusRes = await fetch("/api/profile/status");
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              destination = statusData.onboardingCompleted ? "/dashboard" : "/get-started";
            } else {
              destination = "/get-started";
            }
          } catch {
            destination = "/get-started";
          }
        }
        router.push(destination);
        router.refresh();
      } else {
        setServerError("Failed to sign in. Please try again.");
        setSubmitting(false);
      }
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
          Member Sign In
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to access your calibrated learning roadmap and active daily checkpoints.
        </p>
      </div>

      {/* Verified success notification */}
      {verifiedSuccess && (
        <div
          role="status"
          className="mb-5 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300 flex items-start gap-2.5 animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>Email successfully verified! Enter your password to sign in.</span>
        </div>
      )}

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
          {/* Email */}
          <div>
            <label htmlFor="login-email" className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              Email address
            </label>
            <input
              id="login-email"
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
            <label htmlFor="login-password" className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        Don&apos;t have an account yet?{" "}
        <Link
          href={`/signup${callbackUrl !== "/dashboard" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-4"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
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
              Loading login portal...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
