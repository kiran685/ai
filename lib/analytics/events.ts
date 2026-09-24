/**
 * Onboarding Analytics & Telemetry Layer
 * 
 * Tracks key funnel conversion events:
 * - onboarding_started: Initiated step 1 of onboarding
 * - onboarding_step_completed: Advanced through any step (1 to 5)
 * - onboarding_completed: Finalized roadmap and committed to career journey
 * - onboarding_abandoned: User left or refreshed before completion
 */

export type OnboardingEventType =
  | "onboarding_started"
  | "onboarding_step_completed"
  | "onboarding_completed"
  | "onboarding_abandoned";

export interface OnboardingEventPayload {
  event: OnboardingEventType;
  step?: number;
  stepName?: string;
  targetRole?: string;
  timeSpentMs?: number;
  metadata?: Record<string, any>;
  timestamp?: string;
  userId?: string;
}

/**
 * Dispatches an analytics event reliably (sendBeacon when available on unload, else fetch)
 */
export function trackEvent(payload: OnboardingEventPayload): void {
  try {
    const data: OnboardingEventPayload = {
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString(),
    };

    const serialized = JSON.stringify(data);

    if (typeof window !== "undefined") {
      // 1. Try Beacon API (optimal for unloads / abandonment)
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([serialized], { type: "application/json" });
        const success = navigator.sendBeacon("/api/analytics/track", blob);
        if (success) return;
      }

      // 2. Standard fetch fallback
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: serialized,
        keepalive: true,
      }).catch((err) => {
        // Silently log telemetry error without disrupting UX
        console.debug("Telemetry dispatch error:", err);
      });
    }
  } catch (e) {
    console.debug("Failed to serialize analytics event:", e);
  }
}

export function trackOnboardingStarted(metadata?: Record<string, any>): void {
  trackEvent({
    event: "onboarding_started",
    step: 1,
    stepName: "Resume Upload",
    metadata,
  });
}

export function trackOnboardingStepCompleted(
  step: number,
  stepName: string,
  metadata?: Record<string, any>
): void {
  trackEvent({
    event: "onboarding_step_completed",
    step,
    stepName,
    metadata,
  });
}

export function trackOnboardingCompleted(
  targetRole: string,
  metadata?: Record<string, any>
): void {
  trackEvent({
    event: "onboarding_completed",
    step: 5,
    stepName: "Roadmap Launch",
    targetRole,
    metadata,
  });
}

export function trackOnboardingAbandoned(
  lastStep: number,
  lastStepName: string,
  timeSpentMs?: number,
  metadata?: Record<string, any>
): void {
  trackEvent({
    event: "onboarding_abandoned",
    step: lastStep,
    stepName: lastStepName,
    timeSpentMs,
    metadata,
  });
}
