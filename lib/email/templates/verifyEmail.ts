/**
 * Email Template: OTP Verification
 *
 * Dark-themed HTML email matching AI Career OS design system:
 * #07080e background, indigo/purple gradient accents, Outfit font stack
 */

export interface VerifyEmailTemplateOptions {
  name: string;
  otp: string;
  verifyUrl: string;
}

export function generateVerifyEmailHtml(opts: VerifyEmailTemplateOptions): string {
  const { name, otp, verifyUrl } = opts;
  const firstName = name.split(" ")[0] || name;
  const digits = otp.split(""); // 6 chars

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email – AI Career OS</title>
</head>
<body style="margin:0;padding:0;background-color:#07080e;font-family:'Outfit',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#07080e;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

          <!-- Logo / Brand -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4);-webkit-background-clip:text;color:transparent;font-size:20px;font-weight:800;letter-spacing:-0.5px;">AI Career OS</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:40px 36px;">

              <!-- Badge -->
              <div style="display:inline-block;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.3);border-radius:999px;padding:4px 12px;margin-bottom:20px;">
                <span style="font-size:11px;font-family:'JetBrains Mono',monospace,Courier;color:#a5b4fc;font-weight:600;letter-spacing:0.05em;">EMAIL VERIFICATION</span>
              </div>

              <!-- Heading -->
              <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">
                Verify your email
              </h1>
              <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.6;">
                Hi ${firstName}, use the 6-digit code below to confirm your email address. This code expires in <strong style="color:#c7d2fe;">10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <div style="display:inline-flex;gap:8px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:16px;padding:20px 24px;">
                      ${digits.map((d) => `<span style="display:inline-block;width:36px;height:48px;line-height:48px;text-align:center;background:#0f1120;border:1px solid rgba(99,102,241,0.35);border-radius:10px;font-size:28px;font-weight:700;color:#ffffff;font-family:'JetBrains Mono',monospace,Courier;letter-spacing:0;">${d}</span>`).join("")}
                    </div>
                    <p style="margin:12px 0 0;font-size:11px;font-family:'JetBrains Mono',monospace,Courier;color:#64748b;letter-spacing:0.08em;">YOUR ONE-TIME CODE</p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="border-top:1px solid rgba(255,255,255,0.06);margin:0 0 24px;"></div>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 36px;border-radius:12px;letter-spacing:0.01em;">
                      Verify My Email →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;text-align:center;">
                Or paste this link in your browser:<br/>
                <a href="${verifyUrl}" style="color:#818cf8;word-break:break-all;font-size:11px;">${verifyUrl}</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;" align="center">
              <p style="margin:0;font-size:11px;color:#334155;line-height:1.6;">
                If you didn't create an account, you can safely ignore this email.<br/>
                © ${new Date().getFullYear()} AI Career OS. All rights reserved.
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

export function generateVerifyEmailText(opts: VerifyEmailTemplateOptions): string {
  return `Hi ${opts.name},

Your AI Career OS verification code is: ${opts.otp}

This code expires in 10 minutes.

Or click the link below to verify:
${opts.verifyUrl}

If you didn't sign up, ignore this email.

– AI Career OS Team
`;
}
