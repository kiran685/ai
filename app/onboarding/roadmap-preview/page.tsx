import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  resolveOnboardingExperimentServer,
  filterAllowlistedQueryParams,
  ANONYMOUS_EXPERIMENT_COOKIE,
} from "@/lib/featureFlags";
import LegacyRoadmapPreviewClient from "./LegacyRoadmapPreviewClient";

export default async function LegacyRoadmapPreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const session = await getServerSession(authOptions).catch(() => null);

  const anonId = cookieStore.get(ANONYMOUS_EXPERIMENT_COOKIE)?.value;
  const experiment = resolveOnboardingExperimentServer({
    userId: session?.user?.id,
    userEmail: session?.user?.email,
    anonymousId: anonId,
    searchParams: sp,
  });

  if (experiment.enabled) {
    const query = filterAllowlistedQueryParams(sp);
    redirect(`/onboarding?step=5${query ? `&${query}` : ""}`);
  }

  return <LegacyRoadmapPreviewClient />;
}
