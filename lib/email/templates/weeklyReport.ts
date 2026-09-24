/**
 * Email Template: Weekly Progress Report
 *
 * Dark-themed HTML email matching AI Career OS design system.
 * Scannable layout: role, missions, readiness score, skill gaps, CTA.
 */

export interface WeeklyReportTemplateOptions {
  name: string;
  role: string;
  completedCount: number;
  missions: string[];       // 1–3 example mission titles
  readinessScore: number;   // 0–100
  priorityGaps: string[];   // 1–2 high-severity skill gaps
  ctaUrl: string;
  weekLabel: string;        // e.g. "Sep 16 – Sep 22"
}

export function generateWeeklyReportHtml(opts: WeeklyReportTemplateOptions): string {
  const { name, role, completedCount, missions, readinessScore, priorityGaps, ctaUrl, weekLabel } = opts;
  const firstName = name.split(" ")[0] || name;

  const scoreColor =
    readinessScore >= 75 ? "#10b981" : readinessScore >= 50 ? "#6366f1" : "#f59e0b";
  const scoreLabel =
    readinessScore >= 75 ? "Interview Ready" : readinessScore >= 50 ? "On Track" : "Building Foundation";

  const missionRows = missions
    .slice(0, 3)
    .map(
      (m) =>
        `<tr><td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
          <span style="color:#94a3b8;font-size:12px;">✓</span>
          <span style="color:#cbd5e1;font-size:13px;margin-left:8px;">${m}</span>
        </td></tr>`
    )
    .join("");

  const gapPills = priorityGaps
    .slice(0, 2)
    .map(
      (g) =>
        `<span style="display:inline-block;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.3);border-radius:999px;padding:3px 10px;font-size:11px;color:#fbbf24;margin:2px;">${g}</span>`
    )
    .join(" ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Weekly Report – AI Career OS</title>
</head>
<body style="margin:0;padding:0;background-color:#07080e;font-family:'Outfit',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#07080e;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <!-- Brand -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <span style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4);-webkit-background-clip:text;color:transparent;font-size:20px;font-weight:800;">AI Career OS</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px 32px;">

              <!-- Header -->
              <div style="margin-bottom:24px;">
                <div style="display:inline-block;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.3);border-radius:999px;padding:4px 12px;margin-bottom:12px;">
                  <span style="font-size:11px;font-family:monospace;color:#a5b4fc;font-weight:600;letter-spacing:0.05em;">WEEKLY REPORT · ${weekLabel}</span>
                </div>
                <h1 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                  Great work this week, ${firstName}! 🚀
                </h1>
                <p style="margin:0;font-size:14px;color:#64748b;">Here's your AI Career OS progress summary.</p>
              </div>

              <!-- Role Badge -->
              <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.2);border-radius:12px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:8px;">
                <span style="font-size:12px;color:#67e8f9;font-family:monospace;letter-spacing:0.04em;">TARGET ROLE</span>
                <span style="font-weight:700;color:#ffffff;font-size:15px;margin-left:8px;">${role}</span>
              </div>

              <!-- Stats Row -->
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:20px;">
                <tr>
                  <!-- Missions Completed -->
                  <td style="width:48%;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:12px;padding:16px;vertical-align:top;" valign="top">
                    <p style="margin:0 0 4px;font-size:11px;font-family:monospace;color:#6ee7b7;letter-spacing:0.05em;">MISSIONS DONE</p>
                    <p style="margin:0;font-size:32px;font-weight:800;color:#ffffff;">${completedCount}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#475569;">this week</p>
                  </td>

                  <td style="width:4%;"></td>

                  <!-- Readiness Score -->
                  <td style="width:48%;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.15);border-radius:12px;padding:16px;vertical-align:top;" valign="top">
                    <p style="margin:0 0 4px;font-size:11px;font-family:monospace;color:#a5b4fc;letter-spacing:0.05em;">READINESS SCORE</p>
                    <p style="margin:0;font-size:32px;font-weight:800;color:${scoreColor};">${readinessScore}<span style="font-size:16px;color:#475569;">%</span></p>
                    <p style="margin:4px 0 0;font-size:11px;color:${scoreColor};">${scoreLabel}</p>
                  </td>
                </tr>
              </table>

              <!-- Score Bar -->
              <div style="margin-bottom:24px;">
                <div style="height:6px;background:rgba(255,255,255,0.05);border-radius:999px;overflow:hidden;">
                  <div style="height:100%;width:${Math.min(readinessScore, 100)}%;background:linear-gradient(90deg,#6366f1,${scoreColor});border-radius:999px;transition:width 0.5s;"></div>
                </div>
              </div>

              ${
                missions.length > 0
                  ? `<!-- Recent Missions -->
              <div style="margin-bottom:20px;">
                <p style="margin:0 0 10px;font-size:12px;font-family:monospace;color:#64748b;letter-spacing:0.05em;">COMPLETED MISSIONS</p>
                <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  ${missionRows}
                </table>
              </div>`
                  : ""
              }

              ${
                priorityGaps.length > 0
                  ? `<!-- Priority Gaps -->
              <div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:12px;padding:14px 16px;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:11px;font-family:monospace;color:#fbbf24;letter-spacing:0.05em;">⚡ FOCUS AREAS THIS WEEK</p>
                <div>${gapPills}</div>
              </div>`
                  : ""
              }

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:8px;">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 40px;border-radius:12px;letter-spacing:0.01em;">
                      Continue Your Roadmap →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;" align="center">
              <p style="margin:0;font-size:11px;color:#334155;line-height:1.7;">
                You're receiving this because weekly reports are enabled on your account.<br/>
                <a href="${ctaUrl}/settings" style="color:#475569;">Manage email preferences</a> · © ${new Date().getFullYear()} AI Career OS
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function generateWeeklyReportText(opts: WeeklyReportTemplateOptions): string {
  return `Hi ${opts.name},

Here's your AI Career OS weekly report for ${opts.weekLabel}.

Target Role: ${opts.role}
Missions Completed: ${opts.completedCount}
Career Readiness Score: ${opts.readinessScore}%

${opts.missions.length > 0 ? `Completed Missions:\n${opts.missions.slice(0, 3).map((m) => `  • ${m}`).join("\n")}\n` : ""}
${opts.priorityGaps.length > 0 ? `Priority Focus Areas:\n${opts.priorityGaps.map((g) => `  • ${g}`).join("\n")}\n` : ""}
Continue your roadmap: ${opts.ctaUrl}

– AI Career OS Team
`;
}
