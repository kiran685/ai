"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  trackOnboardingStarted,
  trackOnboardingStepCompleted,
  trackOnboardingCompleted,
  trackOnboardingAbandoned,
} from "@/lib/analytics/events";

export const ONBOARDING_STEPS = [
  { step: 1, name: "Resume Upload", shortName: "Resume", desc: "Upload and parse your background" },
  { step: 2, name: "AI Competency Extraction", shortName: "Analysis", desc: "Extracting skills & benchmarks" },
  { step: 3, name: "Career Discovery Fit", shortName: "Discovery", desc: "Match target roles & gaps" },
  { step: 4, name: "Roadmap Configuration", shortName: "Preferences", desc: "Commitment hours & pacing" },
  { step: 5, name: "Blueprint Preview & Launch", shortName: "Launch", desc: "Confirm tailored roadmap" },
] as const;

export interface OnboardingDraftData {
  resumeText?: string;
  resumeFileName?: string;
  resumeCharacters?: number;
  discoveryMatches?: any[];
  careerProfile?: any;
  targetRole?: string;
  questionnaireAnswers?: Record<string, any>;
  roadmapWeeks?: any[];
  agentSummary?: any;
}

const LOCAL_STORAGE_STEP_KEY = "ai_career_onboarding_step";
const LOCAL_STORAGE_DATA_KEY = "ai_career_onboarding_data";

export function useOnboardingProgress() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [draftData, setDraftData] = useState<OnboardingDraftData>({});
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasCompleted, setHasCompleted] = useState<boolean>(false);

  const hasInitializedRef = useRef<boolean>(false);
  const stepStartTimeRef = useRef<number>(Date.now());
  const hasFiredStartedRef = useRef<boolean>(false);
  const currentStepRef = useRef<number>(currentStep);
  currentStepRef.current = currentStep;
  const hasCompletedRef = useRef<boolean>(hasCompleted);
  hasCompletedRef.current = hasCompleted;

  // 1. Hydrate state on initial load (only runs once on mount)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    let initialStep = 1;
    let initialData: OnboardingDraftData = {};

    // Check URL query param first (?step=X)
    const urlStepParam = searchParams.get("step");
    const urlCareerParam = searchParams.get("career") || searchParams.get("targetRole");
    const isReset = searchParams.get("reset") === "true";

    if (isReset || urlCareerParam) {
      // User is explicitly starting fresh or calibrating a new role -> ALWAYS start at Step 1!
      initialStep = 1;
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);
        } catch (e) {}
      }
    } else if (urlStepParam) {
      const parsed = parseInt(urlStepParam, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
        initialStep = parsed;
      }
    } else if (typeof window !== "undefined") {
      try {
        const cachedStep = localStorage.getItem(LOCAL_STORAGE_STEP_KEY);
        if (cachedStep) {
          const parsedLocal = parseInt(cachedStep, 10);
          // Only resume in-flight steps 2..4; if it was step 5 or invalid, start at Step 1
          if (!isNaN(parsedLocal) && parsedLocal >= 1 && parsedLocal < 5) {
            initialStep = parsedLocal;
          }
        }

        const cachedData = localStorage.getItem(LOCAL_STORAGE_DATA_KEY);
        if (cachedData) {
          initialData = JSON.parse(cachedData);
        }
      } catch (err) {
        console.warn("Could not read cached onboarding state:", err);
      }
    }

    if (urlCareerParam) {
      initialData.targetRole = urlCareerParam;
    }

    setCurrentStep(initialStep);
    setDraftData((prev) => ({ ...prev, ...initialData }));

    // Fetch server-persisted state from DB (if authenticated)
    async function loadServerProgress() {
      try {
        const res = await fetch("/api/onboarding/progress");
        if (res.ok) {
          const resData = await res.json();
          if (resData.authenticated) {
            if (resData.onboardingCompleted) {
              setHasCompleted(true);
            }
            // CRITICAL: NEVER jump to Step 5 or overwrite current step if urlStepParam or urlCareerParam or isReset was given
            // Only resume incomplete draft steps (2..4) if the user did NOT specify any parameters and onboarding isn't completed
            if (
              !urlStepParam &&
              !urlCareerParam &&
              !isReset &&
              !resData.onboardingCompleted &&
              typeof resData.onboardingStep === "number" &&
              resData.onboardingStep >= 2 &&
              resData.onboardingStep < 5
            ) {
              setCurrentStep(resData.onboardingStep);
            }

            if (resData.onboardingData) {
              setDraftData((prev) => ({
                ...prev,
                ...resData.onboardingData,
                ...(urlCareerParam ? { targetRole: urlCareerParam } : {}),
              }));
            }
          }
        }
      } catch (e) {
        console.warn("Failed to load server onboarding progress:", e);
      } finally {
        setIsHydrated(true);
      }
    }

    loadServerProgress();

    // Fire onboarding_started once
    if (!hasFiredStartedRef.current) {
      hasFiredStartedRef.current = true;
      trackOnboardingStarted({ initialStep });
    }
  }, []);

  // 2. Abandonment tracking listener
  useEffect(() => {
    function handleVisibilityOrUnload() {
      if (
        document.visibilityState === "hidden" &&
        currentStepRef.current < 5 &&
        !hasCompletedRef.current
      ) {
        const timeSpent = Date.now() - stepStartTimeRef.current;
        const stepMeta = ONBOARDING_STEPS.find((s) => s.step === currentStepRef.current);
        trackOnboardingAbandoned(
          currentStepRef.current,
          stepMeta?.name || `Step ${currentStepRef.current}`,
          timeSpent
        );
      }
    }

    window.addEventListener("visibilitychange", handleVisibilityOrUnload);
    window.addEventListener("beforeunload", handleVisibilityOrUnload);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityOrUnload);
      window.removeEventListener("beforeunload", handleVisibilityOrUnload);
    };
  }, []);

  // 3. Save progress helper (localStorage + Database + URL sync)
  const saveProgress = useCallback(
    async (nextStep: number, partialData?: Partial<OnboardingDraftData>, markCompleted?: boolean) => {
      const mergedData = { ...draftData, ...(partialData || {}) };
      setDraftData(mergedData);

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_STORAGE_STEP_KEY, String(nextStep));
          localStorage.setItem(LOCAL_STORAGE_DATA_KEY, JSON.stringify(mergedData));
        } catch (err) {
          console.warn("LocalStorage save error:", err);
        }
      }

      setIsSaving(true);
      try {
        await fetch("/api/onboarding/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: nextStep,
            data: partialData,
            completed: markCompleted,
          }),
        });
      } catch (err) {
        console.warn("Could not save onboarding progress to server:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [draftData]
  );

  // 4. Advance or navigate to a step
  const goToStep = useCallback(
    (targetStep: number, partialData?: Partial<OnboardingDraftData>, metadata?: Record<string, any>) => {
      if (targetStep < 1 || targetStep > 5) return;

      const previousStep = currentStep;
      const prevStepMeta = ONBOARDING_STEPS.find((s) => s.step === previousStep);
      const timeSpent = Date.now() - stepStartTimeRef.current;

      // Track completion of previous step
      trackOnboardingStepCompleted(
        previousStep,
        prevStepMeta?.name || `Step ${previousStep}`,
        {
          timeSpentMs: timeSpent,
          nextStep: targetStep,
          ...metadata,
        }
      );

      // Reset step timer
      stepStartTimeRef.current = Date.now();
      setCurrentStep(targetStep);

      // Update URL query string smoothly without reload
      if (typeof window !== "undefined") {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("step", String(targetStep));
        window.history.replaceState({}, "", currentUrl.toString());
      }

      // Persist to storage and DB
      saveProgress(targetStep, partialData);
    },
    [currentStep, saveProgress]
  );

  // 5. Complete entire onboarding
  const completeOnboarding = useCallback(
    async (finalRole: string, metadata?: Record<string, any>) => {
      setHasCompleted(true);
      hasCompletedRef.current = true;

      trackOnboardingCompleted(finalRole, metadata);

      await saveProgress(5, { targetRole: finalRole }, true);

      // Also ensure profile is marked complete in DB
      try {
        await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetRole: finalRole,
            onboardingCompleted: true,
          }),
        });
      } catch (e) {
        console.warn("Sync final profile error:", e);
      }

      // Clear draft storage
      if (typeof window !== "undefined") {
        localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);
      }

      // Route to candidate dashboard
      router.push("/dashboard");
    },
    [router, saveProgress]
  );

  return {
    currentStep,
    steps: ONBOARDING_STEPS,
    draftData,
    isHydrated,
    isSaving,
    hasCompleted,
    goToStep,
    saveProgress,
    completeOnboarding,
    setDraftData,
  };
}
