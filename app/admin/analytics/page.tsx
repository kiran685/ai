import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isInternalAdminUser } from "@/lib/featureFlags";
import { AnalyticsDashboardClient } from "./AnalyticsDashboardClient";

export const metadata: Metadata = {
  title: "Admin Analytics Dashboard | AI Career OS",
  description:
    "Evaluate onboarding funnel metrics, v2 vs. control A/B experimentation, retention, and live telemetry.",
};

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions);

  // Server-side authentication guard:
  // Must be authenticated AND have an authorized admin email
  if (!session?.user || !isInternalAdminUser(session.user)) {
    redirect("/login?callbackUrl=/admin/analytics&error=admin_required");
  }

  return (
    <AnalyticsDashboardClient
      userEmail={session.user.email || "admin@aicareer.os"}
    />
  );
}
