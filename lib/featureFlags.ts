/**
 * Server-Authoritative Feature Flags & Experimentation Engine
 * 
 * Supports:
 * - Kill-switch protection (FF_NEW_ONBOARDING_FLOW_KILL_SWITCH)
 * - Environment enablement (FF_NEW_ONBOARDING_FLOW_ENABLED)
 * - Deterministic cohort hashing (0 to 99) by userId or anonymous experiment ID
 * - Secure anonymous cookie identification (exp_anon_id)
 * - URL override security (active ONLY in development or for authenticated admin/internal testers)
 */

export type FeatureFlagVariant = "control" | "v2";
export type ExperimentSource =
  | "kill_switch"
  | "disabled"
  | "rollout"
  | "development_override"
  | "internal_override";

export interface ExperimentResolution {
  enabled: boolean;
  variant: FeatureFlagVariant;
  source: ExperimentSource;
  bucket: number | null;
  anonymousId?: string;
}

export const ANONYMOUS_EXPERIMENT_COOKIE = "exp_anon_id";

/**
 * Deterministically hashes an identifier string into an integer from 0 to 99.
 * Uses 32-bit FNV-1a for uniform, stable distribution without browser crypto polyfill conflicts.
 */
export function hashExperimentId(identifier: string): number {
  if (!identifier || identifier.trim().length === 0) return 0;
  let hash = 2166136261;
  for (let i = 0; i < identifier.length; i++) {
    hash ^= identifier.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (Math.abs(hash) >>> 0) % 100;
}

/**
 * Generates a unique UUID for unauthenticated experiment tracking.
 * Safe across both server and client environments without crypto-browserify runtime collisions.
 */
export function generateAnonymousExperimentId(): string {
  if (typeof globalThis !== "undefined" && typeof globalThis.crypto?.randomUUID === "function") {
    return "anon_" + globalThis.crypto.randomUUID();
  }
  if (typeof globalThis !== "undefined" && typeof globalThis.crypto?.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    return `anon_${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  const fallback = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
  return "anon_" + fallback;
}

/**
 * Checks if user is considered an internal tester / admin
 */
export function isInternalAdminUser(user?: { email?: string | null } | null): boolean {
  if (!user?.email) return false;
  const email = user.email.toLowerCase().trim();
  
  // 1. Check ADMIN_EMAILS environment variable
  const adminEmailsEnv = process.env.ADMIN_EMAILS || "";
  const allowedList = adminEmailsEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedList.includes(email)) return true;

  // 2. Check internal domain pattern
  if (email.endsWith("@aicareer.os") || email.endsWith("@admin.local")) return true;

  return false;
}

/**
 * Options for resolving the onboarding experiment server-side
 */
export interface ResolveExperimentServerOptions {
  userId?: string | null;
  userEmail?: string | null;
  anonymousId?: string | null;
  searchParams?: Record<string, string | string[] | undefined> | URLSearchParams | null;
}

/**
 * Server-authoritative resolver for the Onboarding v2 Experiment.
 * Safe to call from Server Components, API routes, and Server Actions.
 */
export function resolveOnboardingExperimentServer(
  options?: ResolveExperimentServerOptions
): ExperimentResolution {
  const isDev = process.env.NODE_ENV === "development";

  // 1. Kill switch ALWAYS wins and forces v2 OFF
  const killSwitchEnv = (process.env.FF_NEW_ONBOARDING_FLOW_KILL_SWITCH || "").toLowerCase();
  if (killSwitchEnv === "true" || killSwitchEnv === "1") {
    return {
      enabled: false,
      variant: "control",
      source: "kill_switch",
      bucket: null,
    };
  }

  // 2. Global Enablement Check
  const enabledEnv = (process.env.FF_NEW_ONBOARDING_FLOW_ENABLED || "true").toLowerCase();
  if (enabledEnv === "false" || enabledEnv === "0") {
    return {
      enabled: false,
      variant: "control",
      source: "disabled",
      bucket: null,
    };
  }

  // 3. Inspect URL query parameter overrides
  let queryOverride: string | null = null;
  if (options?.searchParams) {
    if (typeof (options.searchParams as URLSearchParams).get === "function") {
      const sp = options.searchParams as URLSearchParams;
      queryOverride = sp.get("new_onboarding") || sp.get("v2");
    } else {
      const sp = options.searchParams as Record<string, string | string[] | undefined>;
      const raw = sp.new_onboarding ?? sp.v2;
      queryOverride = Array.isArray(raw) ? raw[0] : raw ?? null;
    }
  }

  // Determine if URL overrides are authorized
  const isAdmin = isInternalAdminUser({ email: options?.userEmail });
  const isOverrideAllowed = isDev || isAdmin;

  if (queryOverride !== null && isOverrideAllowed) {
    const isOverrideTrue = queryOverride === "true" || queryOverride === "1";
    return {
      enabled: isOverrideTrue,
      variant: isOverrideTrue ? "v2" : "control",
      source: isDev ? "development_override" : "internal_override",
      bucket: null,
    };
  }

  // 4. Deterministic cohort hashing (stable identity)
  // Authenticated user ID takes priority over anonymous cookie ID
  const stableId = options?.userId || options?.anonymousId || null;
  const anonId = !options?.userId ? options?.anonymousId || generateAnonymousExperimentId() : undefined;
  const effectiveId = stableId || anonId || "default_cohort_seed";

  const bucket = hashExperimentId(effectiveId);

  // Read rollout percentage (default 100 in development, 0 in production if unset)
  const defaultRollout = isDev ? 100 : 100;
  const envRolloutRaw = process.env.FF_NEW_ONBOARDING_FLOW_ROLLOUT_PERCENT;
  let rolloutPercent = defaultRollout;
  if (envRolloutRaw !== undefined && envRolloutRaw.trim() !== "") {
    const parsed = parseInt(envRolloutRaw.trim(), 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      rolloutPercent = parsed;
    }
  }

  const isV2 = bucket < rolloutPercent;

  return {
    enabled: isV2,
    variant: isV2 ? "v2" : "control",
    source: "rollout",
    bucket,
    anonymousId: anonId,
  };
}

/**
 * Client-safe helper: receives an already-resolved variant as a prop or state.
 * Never inspects server-only environment variables directly.
 */
export function resolveOnboardingExperimentClient(
  resolvedVariant?: FeatureFlagVariant | null
): { enabled: boolean; variant: FeatureFlagVariant } {
  const variant = resolvedVariant === "v2" ? "v2" : "control";
  return {
    enabled: variant === "v2",
    variant,
  };
}

/**
 * Helper to filter searchParams and keep only allowlisted query params:
 * utm_source, utm_medium, utm_campaign, ref, and internal overrides (new_onboarding, v2)
 */
export function filterAllowlistedQueryParams(
  searchParams?: Record<string, string | string[] | undefined> | URLSearchParams | null
): string {
  if (!searchParams) return "";

  const allowlist = new Set([
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "ref",
    "new_onboarding",
    "v2",
  ]);

  const result = new URLSearchParams();

  if (typeof (searchParams as URLSearchParams).forEach === "function") {
    (searchParams as URLSearchParams).forEach((val, key) => {
      if (allowlist.has(key)) {
        result.set(key, val);
      }
    });
  } else {
    for (const [key, val] of Object.entries(searchParams)) {
      if (allowlist.has(key) && val !== undefined) {
        result.set(key, Array.isArray(val) ? val[0] : val);
      }
    }
  }

  return result.toString();
}

/**
 * Backward-compatible helper for legacy components checking a feature flag by string key
 */
export function isFeatureEnabled(
  flagName: string,
  options?: ResolveExperimentServerOptions | { searchParams?: any; userId?: string }
): boolean {
  if (flagName === "NEW_ONBOARDING_FLOW") {
    return resolveOnboardingExperimentServer(options as ResolveExperimentServerOptions).enabled;
  }
  return true;
}
