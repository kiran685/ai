"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, TrendingDown } from "lucide-react";

export interface FunnelData {
  started: number;
  step1Completed: number;
  step2Completed: number;
  step3Completed: number;
  step4Completed: number;
  step5Completed: number;
  completed: number;
  completionRate: number;
}

export interface FunnelChartProps {
  data: FunnelData;
  variant: "v2" | "control";
  highlightStep?: number;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({
  data,
  variant,
  highlightStep,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const steps = [
    {
      id: 0,
      name: "Funnel Entry",
      shortName: "Started",
      count: data.started,
      desc: "User initiated onboarding",
    },
    {
      id: 1,
      name: "Step 1: Resume Upload",
      shortName: "Step 1",
      count: data.step1Completed,
      desc: "Uploaded and parsed resume",
    },
    {
      id: 2,
      name: "Step 2: AI Competency",
      shortName: "Step 2",
      count: data.step2Completed,
      desc: "Extracted skills & strengths",
    },
    {
      id: 3,
      name: "Step 3: Career Discovery",
      shortName: "Step 3",
      count: data.step3Completed,
      desc: "Matched roles & skill gaps",
    },
    {
      id: 4,
      name: "Step 4: Roadmap Setup",
      shortName: "Step 4",
      count: data.step4Completed,
      desc: "Committed hours & pacing",
    },
    {
      id: 5,
      name: "Step 5: Blueprint Preview",
      shortName: "Step 5",
      count: data.step5Completed,
      desc: "Reviewed curriculum preview",
    },
    {
      id: 6,
      name: "Roadmap Launch",
      shortName: "Completed",
      count: data.completed,
      desc: "Finalized roadmap commitment",
    },
  ];

  // Calculate drop-offs between consecutive stages to identify the worst drop-off step
  let worstDropOffIndex = -1;
  let maxDropOffUsers = -1;

  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i - 1].count;
    const curr = steps[i].count;
    const drop = prev - curr;
    if (drop > maxDropOffUsers && prev > 0) {
      maxDropOffUsers = drop;
      worstDropOffIndex = i;
    }
  }

  // If external highlightStep is provided, use that
  const activeHighlightIndex =
    highlightStep !== undefined ? highlightStep : worstDropOffIndex;

  const baselineCount = data.started || 1;

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className={`px-2.5 py-0.5 text-xs font-semibold rounded-md uppercase tracking-wider ${
              variant === "v2"
                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                : "bg-slate-700/40 text-slate-300 border border-slate-600/40"
            }`}
          >
            {variant === "v2" ? "v2 Experience" : "Control Baseline"}
          </span>
          <h3 className="text-sm font-semibold text-white">Funnel Progression</h3>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-400">Conversion:</span>
          <span
            className={`font-semibold ${
              data.completionRate >= 50
                ? "text-emerald-400"
                : data.completionRate >= 35
                ? "text-yellow-400"
                : "text-rose-400"
            }`}
          >
            {data.completionRate}%
          </span>
        </div>
      </div>

      {/* Horizontal Bar Funnel */}
      <div className="flex flex-col gap-2.5 mt-1">
        {steps.map((step, idx) => {
          const pctOfStart =
            data.started > 0
              ? Math.round((step.count / baselineCount) * 100)
              : 0;
          const isWorst = idx === activeHighlightIndex && idx > 0;
          const prevCount = idx > 0 ? steps[idx - 1].count : step.count;
          const dropFromPrev = Math.max(0, prevCount - step.count);
          const dropPctFromPrev =
            prevCount > 0 ? Math.round((dropFromPrev / prevCount) * 100) : 0;

          // Gradient color according to status & variant
          let barGradient =
            variant === "v2"
              ? "from-indigo-600 to-purple-600"
              : "from-slate-600 to-slate-500";

          if (isWorst) {
            barGradient = "from-rose-600 to-rose-700";
          } else if (idx === steps.length - 1) {
            barGradient = "from-emerald-500 to-cyan-500";
          }

          return (
            <div
              key={step.id}
              className="relative group flex flex-col gap-1 p-2 rounded-xl hover:bg-white/[0.03] transition-all duration-200"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Step info row */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-medium">
                    {step.name}
                  </span>
                  {isWorst && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Largest Drop-Off (-{dropPctFromPrev}%)
                    </span>
                  )}
                  {idx === steps.length - 1 && step.count > 0 && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Success
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-200 font-semibold">
                    {step.count.toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    ({pctOfStart}%)
                  </span>
                </div>
              </div>

              {/* Progress bar container */}
              <div className="h-3 w-full rounded-full bg-white/[0.05] overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500 ease-out shadow-sm`}
                  style={{
                    width: `${Math.max(pctOfStart, step.count > 0 ? 3 : 0)}%`,
                  }}
                />
              </div>

              {/* Hover Tooltip Details */}
              {hoveredIndex === idx && idx > 0 && (
                <div className="absolute top-[-36px] right-2 z-20 px-2.5 py-1 rounded-lg bg-black/90 border border-white/20 text-[11px] text-slate-200 shadow-xl pointer-events-none flex items-center gap-2">
                  <span>
                    Drop from prev:{" "}
                    <strong className="text-rose-400 font-mono">
                      -{dropFromPrev}
                    </strong>{" "}
                    candidates ({dropPctFromPrev}%)
                  </span>
                  <TrendingDown className="w-3 h-3 text-rose-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
