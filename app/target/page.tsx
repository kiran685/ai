"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Target,
  ArrowRight,
  Sparkles,
  Check,
  Code2,
  Database,
  Layers,
  Cpu,
  ShieldAlert,
  Cloud,
  CheckCircle2,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";

export default function TargetRolePage() {
  const router = useRouter();
  const [role, setRole] = useState("Software Engineer");
  const [customRole, setCustomRole] = useState("");

  const techRoles = [
    { name: "Software Engineer", desc: "Core algorithms, data structures, full-stack principles" },
    { name: "Backend Developer", desc: "APIs, microservices, databases, system architecture" },
    { name: "Frontend Developer", desc: "React, modern UI frameworks, performance, state" },
    { name: "Full Stack Developer", desc: "End-to-end architecture, client + server engineering" },
    { name: "Data Analyst", desc: "SQL, business intelligence, visualization, reporting" },
    { name: "Data Scientist", desc: "Statistical modeling, Python, ML algorithms, insights" },
    { name: "AI / ML Engineer", desc: "Deep learning, PyTorch, model pipelines, MLOps" },
    { name: "QA Engineer", desc: "Automation testing, Jest, Cypress, integration test suites" },
    { name: "DevOps Engineer", desc: "CI/CD, Docker, Kubernetes, cloud infrastructure" },
    { name: "Cybersecurity Engineer", desc: "Penetration testing, network security, threat analysis" },
    { name: "Other", desc: "Enter your own specialized custom technology role" },
  ];

  function handleContinue() {
    const selectedRole = role === "Other" ? customRole.trim() : role;
    if (!selectedRole) return;

    router.push(`/onboarding?step=1&career=${encodeURIComponent(selectedRole)}&reset=true`);
  }

  const isContinueDisabled = !role || (role === "Other" && !customRole.trim());

  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 relative selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="bg-mesh-glow" />
      <div className="fixed inset-0 bg-grid-tech pointer-events-none opacity-40 z-0" />

      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-24 relative z-10">
        {/* Header Breadcrumb */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-mono text-indigo-300 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Path A &middot; Target Role Selection
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Which role are you targeting?
          </h1>

          <p className="text-slate-400 text-sm sm:text-base mt-2.5 max-w-xl leading-relaxed">
            Select the specialization you want to pursue. We will tailor your skill audit, benchmark requirements, and generate your weekly milestones around this role.
          </p>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6">
          {techRoles.map((item) => {
            const isSelected = role === item.name;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => setRole(item.name)}
                className={`text-left rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer flex items-start justify-between group touch-target-min ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-500/15 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40 text-white"
                    : "border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/[0.18] hover:bg-white/[0.04]"
                }`}
              >
                <div className="pr-3">
                  <span className="text-sm sm:text-base font-bold text-white block">
                    {item.name}
                  </span>
                  <span className="text-xs text-slate-400 mt-1 block leading-relaxed">
                    {item.desc}
                  </span>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? "bg-gradient-to-r from-indigo-500 to-cyan-400 text-white"
                      : "border border-white/[0.2] bg-white/[0.02] group-hover:border-white/[0.4]"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Role Input if "Other" is chosen */}
        {role === "Other" && (
          <div className="mt-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6 animate-fade-in">
            <label
              htmlFor="custom-role-input"
              className="block text-xs font-mono font-semibold uppercase tracking-wider text-indigo-300 mb-2 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Specify your target role title:
            </label>
            <input
              id="custom-role-input"
              type="text"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder="e.g. Quantitative Developer, Blockchain Engineer, iOS Developer..."
              className="w-full rounded-xl border border-white/[0.12] bg-[#0c0f18] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-2">
              We will dynamically calibrate industry requirements and assessments for this exact title.
            </p>
          </div>
        )}

        {/* Actions Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={() => router.push("/get-started")}
            className="text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            &larr; Back to Entry Options
          </button>

          <button
            type="button"
            onClick={handleContinue}
            disabled={isContinueDisabled}
            className="w-full sm:w-auto btn-gradient !py-3.5 !px-8 !text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
          >
            <span>Continue with {role === "Other" ? (customRole || "Custom Role") : role}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
