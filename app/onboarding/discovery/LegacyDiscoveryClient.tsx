"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Target,
  Award,
  BookOpen,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";
import OnboardingProgress from "@/app/components/OnboardingProgress";
import { CareerDiscoveryMatch, StructuredCareerProfile } from "@/types";

function CareerDiscoveryContent() {
  const router = useRouter();
  const [careerProfile, setCareerProfile] = useState<StructuredCareerProfile | null>(null);
  const [matches, setMatches] = useState<CareerDiscoveryMatch[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Try to load from localStorage cache first
    try {
      const cached = localStorage.getItem("career_discovery_data");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.matches && parsed.matches.length > 0) {
          setMatches(parsed.matches);
          setCareerProfile(parsed.careerProfile);
          setSelectedRole(parsed.topRole || parsed.matches[0]?.roleName || "Software Engineer");
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not parse cached discovery data:", e);
    }

    // 2. Otherwise load profile from DB
    async function loadFromProfile() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (data.success && data.analysis?.resumeText) {
          const discoveryRes = await fetch("/api/career/discovery", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: data.analysis.resumeText,
              fileName: data.analysis.fileName || "resume.pdf",
            }),
          });
          const discoveryData = await discoveryRes.json();
          if (discoveryData.matches) {
            setMatches(discoveryData.matches);
            setCareerProfile(discoveryData.careerProfile);
            setSelectedRole(discoveryData.topRole || discoveryData.matches[0]?.roleName || "Software Engineer");
          }
        } else {
          router.push("/onboarding/resume");
        }
      } catch (err) {
        console.error("Failed to load discovery:", err);
        router.push("/onboarding/resume");
      } finally {
        setLoading(false);
      }
    }

    loadFromProfile();
  }, [router]);

  async function handleSelectRole(roleToSelect: string) {
    setSelectedRole(roleToSelect);
    setSaving(true);

    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: roleToSelect,
        }),
      });

      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to select role:", err);
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080e] flex items-center justify-center text-slate-400 font-mono text-xs">
        <Sparkles className="w-5 h-5 mx-auto mb-2 animate-pulse text-indigo-400" />
        <p>Synthesizing career discovery fit...</p>
      </div>
    );
  }

  const topMatch = matches.find((m) => m.roleName === selectedRole) || matches[0];

  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 relative selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="bg-mesh-glow" />
      <div className="fixed inset-0 bg-grid-tech pointer-events-none opacity-40 z-0" />

      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-24 relative z-10">
        <OnboardingProgress
          step={2}
          totalSteps={3}
          label="Career Discovery Matrix"
          icon={Compass}
        />

        <section className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-mono text-indigo-300 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Resume-First Capability Audit
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Where does your profile fit?
          </h1>

          <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            Based on your resume, our AI evaluated your verified experience against target industry benchmarks.
          </p>
        </section>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {matches.map((m) => {
            const isSelected = selectedRole === m.roleName;
            return (
              <div
                key={m.roleName}
                onClick={() => setSelectedRole(m.roleName)}
                className={`rounded-2xl border p-5 transition-all cursor-pointer ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full border bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
                    {m.matchPercentage}% Match
                  </span>
                  <span className="text-[10px] font-mono uppercase text-slate-400">
                    {m.recommendation}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{m.roleName}</h3>
                <p className="text-xs text-slate-400">{m.summary}</p>
              </div>
            );
          })}
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSelectRole(selectedRole)}
            disabled={!selectedRole || saving}
            className="btn-gradient !py-3 !px-6 !text-xs font-mono font-bold flex items-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <span>Confirm & Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
}

export default function LegacyDiscoveryClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07080e] flex items-center justify-center text-slate-400 font-mono text-xs">
          <Sparkles className="w-5 h-5 mx-auto mb-2 animate-pulse text-indigo-400" />
          <p>Loading discovery...</p>
        </div>
      }
    >
      <CareerDiscoveryContent />
    </Suspense>
  );
}
