"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResumeRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const career =
      searchParams.get("career") || searchParams.get("targetRole") || "";
    const careerParam = career ? `&career=${encodeURIComponent(career)}` : "";
    router.replace(`/onboarding?step=1${careerParam}&reset=true`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#07080e] flex flex-col items-center justify-center text-slate-400 font-mono text-xs gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      <span>Redirecting to Onboarding Step 1...</span>
    </div>
  );
}

export default function ResumePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07080e] flex items-center justify-center text-slate-400 font-mono text-xs">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <ResumeRedirect />
    </Suspense>
  );
}
