/**
 * Email Template: Sequence 3 - Weekly Re-engagement (7 days inactive)
 *
 * Subject: We miss you – Keep your career momentum going
 * Dark-themed HTML email matching AI Career OS design system.
 */

export interface WeeklyReengagementOptions {
  name?: string | null;
  targetRole: string;
  priorityGap: string;
  nextDayNumber: number;
  nextDayTopic: string;
  ctaUrl: string;
}

export function generateWeeklyReengagementHtml(opts: WeeklyReengagementOptions): string {
  const { name, targetRole, priorityGap, nextDayNumber, nextDayTopic, ctaUrl } = opts;
  const firstName = name ? name.split(" ")[0] : "there";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>We miss you – Keep your career momentum going</title>
</head>
<body style="margin:0;padding:0;background-color:#07080e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#07080e;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <!-- Brand Header -->
          <tr>
            <td style="padding-bottom:28px;" align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4);border-radius:10px;width:32px;height:32px;text-align:center;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:16px;line-height:32px;">✦</span>
                  </td>
                  <td style="padding-left:10px;font-size:16px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                    AI Career <span style="color:#818cf8;">OS</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background:#0e111a;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px;box-shadow:0 20px 40px rgba(0,0,0,0.5);">

              <!-- Status Badge -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                <tr>
                  <td style="background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.3);border-radius:999px;padding:4px 14px;">
                    <span style="font-size:11px;font-weight:600;color:#fbbf24;text-transform:uppercase;letter-spacing:0.5px;">
                      ✦ Re-Engagement &middot; Quick 15-Minute Mission
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
                We miss you, ${firstName}! Keep your career momentum going
              </h1>
              <p style="margin:0 0 24px 0;font-size:14px;color:#94a3b8;line-height:1.6;">
                Consistency is the single biggest predictor of landing senior offers for <strong>${targetRole}</strong>. Spending just 15 minutes today keeps your knowledge fresh and moves your readiness needle forward.
              </p>

              <!-- Priority Gap Spotlight -->
              <div style="background:#141824;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:20px;margin-bottom:28px;">
                <span style="font-size:11px;font-mono;font-weight:700;text-transform:uppercase;color:#f59e0b;letter-spacing:0.5px;display:block;margin-bottom:6px;">
                  High Priority Focus Area
                </span>
                <h3 style="margin:0 0 8px 0;font-size:16px;font-weight:700;color:#ffffff;">
                  ${priorityGap}
                </h3>
                <p style="margin:0 0 14px 0;font-size:13px;color:#cbd5e1;line-height:1.5;">
                  Closing this gap gives you immediate leverage in technical interviews. Your next mission is ready:
                </p>
                <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:12px 14px;font-size:13px;color:#e2e8f0;font-weight:600;">
                  🎯 Day ${nextDayNumber}: ${nextDayTopic}
                </div>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:14px 32px;border-radius:12px;box-shadow:0 8px 24px rgba(99,102,241,0.35);letter-spacing:0.2px;">
                      Do One 15-Minute Mission Today &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;font-size:11px;color:#475569;line-height:1.5;">
              You are tracking ${targetRole} preparation on AI Career OS.<br />
              <a href="${ctaUrl}" style="color:#6366f1;text-decoration:underline;">Open Dashboard</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
