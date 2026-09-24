/**
 * Email Template: Sequence 1 - Onboarding Abandonment (24h after start)
 *
 * Subject: You're 1 step away from your personalized career roadmap
 * Dark-themed HTML email matching AI Career OS design system.
 */

export interface OnboardingReminderOptions {
  name?: string | null;
  lastStep: number;
  lastStepName: string;
  targetRole?: string | null;
  ctaUrl: string;
}

export function generateOnboardingReminderHtml(opts: OnboardingReminderOptions): string {
  const { name, lastStep, lastStepName, targetRole, ctaUrl } = opts;
  const firstName = name ? name.split(" ")[0] : "there";
  const progressPercent = Math.min(95, lastStep * 20);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're 1 step away from your personalized career roadmap</title>
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
                  <td style="background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.3);border-radius:999px;padding:4px 14px;">
                    <span style="font-size:11px;font-weight:600;color:#818cf8;text-transform:uppercase;letter-spacing:0.5px;">
                      ✦ Roadmap Draft Waiting &middot; ~2 Minutes Left
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
                Hi ${firstName}, you&apos;re 1 step away from your personalized career roadmap
              </h1>
              <p style="margin:0 0 24px 0;font-size:14px;color:#94a3b8;line-height:1.6;">
                You started engineering your trajectory for <strong>${targetRole || "your next tech role"}</strong>. Your profile draft is saved at <strong>Step ${lastStep}: ${lastStepName}</strong> (${progressPercent}% complete).
              </p>

              <!-- Progress Indicator Box -->
              <div style="background:#141824;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:18px;margin-bottom:28px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
                  <tr>
                    <td style="font-size:12px;color:#94a3b8;font-weight:600;">Overall Progress</td>
                    <td align="right" style="font-size:12px;color:#818cf8;font-weight:700;">${progressPercent}% Complete</td>
                  </tr>
                </table>
                <div style="background:rgba(255,255,255,0.08);border-radius:999px;height:6px;overflow:hidden;">
                  <div style="background:linear-gradient(90deg,#6366f1,#a855f7,#06b6d4);height:6px;width:${progressPercent}%;border-radius:999px;"></div>
                </div>
                <p style="margin:10px 0 0 0;font-size:12px;color:#cbd5e1;">
                  Next: Complete questionnaire and unlock your tailored 8-week curriculum.
                </p>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:14px 32px;border-radius:12px;box-shadow:0 8px 24px rgba(99,102,241,0.35);letter-spacing:0.2px;">
                      Finish Your Roadmap &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;font-size:11px;color:#475569;line-height:1.5;">
              You received this because you started creating your career plan on AI Career OS.<br />
              <a href="${ctaUrl}" style="color:#6366f1;text-decoration:underline;">Resume Session</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
