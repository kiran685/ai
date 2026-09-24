"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, ArrowUpDown } from "lucide-react";
import { FunnelData } from "./FunnelChart";

export interface DropOffByStep {
  step1: number;
  step2: number;
  step3: number;
  step4: number;
  step5: number;
}

export interface DropOffTableProps {
  dropOffData: {
    v2: DropOffByStep;
    control: DropOffByStep;
  };
  funnelData?: {
    v2: FunnelData;
    control: FunnelData;
  };
}

export const DropOffTable: React.FC<DropOffTableProps> = ({
  dropOffData,
  funnelData,
}) => {
  const [sortByImprovement, setSortByImprovement] = useState<boolean>(true);

  // Define step transitions
  const transitions = [
    {
      id: "step1",
      stepName: "Step 1 → 2",
      description: "Resume Upload → AI Extraction",
      v2Users: dropOffData.v2.step1,
      controlUsers: dropOffData.control.step1,
      v2Base: funnelData?.v2.started || 1,
      controlBase: funnelData?.control.started || 1,
    },
    {
      id: "step2",
      stepName: "Step 2 → 3",
      description: "AI Extraction → Career Discovery",
      v2Users: dropOffData.v2.step2,
      controlUsers: dropOffData.control.step2,
      v2Base: funnelData?.v2.step1Completed || 1,
      controlBase: funnelData?.control.step1Completed || 1,
    },
    {
      id: "step3",
      stepName: "Step 3 → 4",
      description: "Career Discovery → Preferences",
      v2Users: dropOffData.v2.step3,
      controlUsers: dropOffData.control.step3,
      v2Base: funnelData?.v2.step2Completed || 1,
      controlBase: funnelData?.control.step2Completed || 1,
    },
    {
      id: "step4",
      stepName: "Step 4 → 5",
      description: "Preferences → Blueprint Preview",
      v2Users: dropOffData.v2.step4,
      controlUsers: dropOffData.control.step4,
      v2Base: funnelData?.v2.step3Completed || 1,
      controlBase: funnelData?.control.step3Completed || 1,
    },
    {
      id: "step5",
      stepName: "Step 5 → Launch",
      description: "Blueprint Preview → Committed",
      v2Users: dropOffData.v2.step5,
      controlUsers: dropOffData.control.step5,
      v2Base: funnelData?.v2.step4Completed || 1,
      controlBase: funnelData?.control.step4Completed || 1,
    },
  ];

  // Calculate percentages and delta for each row
  const rows = transitions.map((t) => {
    const v2Pct = Math.round((t.v2Users / t.v2Base) * 100) || 0;
    const controlPct = Math.round((t.controlUsers / t.controlBase) * 100) || 0;
    // Delta: Control drop-off % minus v2 drop-off %
    // If control had 22% drop and v2 had 15%, delta is +7% (v2 is better)
    const delta = controlPct - v2Pct;
    const isBetter = delta > 0;

    return {
      ...t,
      v2Pct,
      controlPct,
      delta,
      isBetter,
    };
  });

  const sortedRows = [...rows].sort((a, b) => {
    if (sortByImprovement) {
      return b.delta - a.delta;
    }
    return 0;
  });

  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Step-by-Step Drop-Off Analysis
          </h3>
          <p className="text-xs text-slate-400">
            Compares candidate attrition between onboarding stages
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSortByImprovement(!sortByImprovement)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors cursor-pointer"
        >
          <ArrowUpDown className="w-3 h-3 text-indigo-400" />
          <span>{sortByImprovement ? "Sorted by Impact" : "Sequential Order"}</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 font-medium">
              <th className="py-2.5 px-3">Step Transition</th>
              <th className="py-2.5 px-3">v2 Drop-Off</th>
              <th className="py-2.5 px-3">Control Drop-Off</th>
              <th className="py-2.5 px-3">Difference</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {sortedRows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-200">
                    {row.stepName}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {row.description}
                  </div>
                </td>

                <td className="py-3 px-3 font-mono">
                  <span className="text-slate-200 font-semibold">
                    {row.v2Pct}%
                  </span>
                  <span className="text-slate-500 text-[11px] ml-1">
                    ({row.v2Users.toLocaleString()} users)
                  </span>
                </td>

                <td className="py-3 px-3 font-mono">
                  <span className="text-slate-200 font-semibold">
                    {row.controlPct}%
                  </span>
                  <span className="text-slate-500 text-[11px] ml-1">
                    ({row.controlUsers.toLocaleString()} users)
                  </span>
                </td>

                <td className="py-3 px-3 font-mono">
                  <span
                    className={`font-semibold ${
                      row.delta > 0
                        ? "text-emerald-400"
                        : row.delta < 0
                        ? "text-rose-400"
                        : "text-slate-400"
                    }`}
                  >
                    {row.delta > 0 ? `-${row.delta}% attrition` : row.delta < 0 ? `+${Math.abs(row.delta)}% attrition` : "0%"}
                  </span>
                </td>

                <td className="py-3 px-3">
                  {row.isBetter ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Better
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <XCircle className="w-3 h-3" />
                      Needs Work
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
