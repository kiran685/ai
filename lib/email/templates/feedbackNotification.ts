/**
 * Feedback Notification Email Template
 * Sends structured feedback notifications to the admin team (sskiran961@gmail.com)
 */

export interface FeedbackNotificationData {
  type: string;
  rating?: number | null;
  message: string;
  email?: string | null;
  userName?: string | null;
  route?: string | null;
  screenshotNote?: string | null;
  submittedAt: string;
}

export function generateFeedbackNotificationHtml(data: FeedbackNotificationData): string {
  const stars = data.rating ? "★".repeat(data.rating) + "☆".repeat(5 - data.rating) : "Not rated";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Feedback Received</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07080e; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #0e111a; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.3); }
    h1 { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 16px; margin-bottom: 24px; }
    .card { background-color: #141824; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 18px; margin-bottom: 20px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
    .row:last-child { border-bottom: none; }
    .label { color: #94a3b8; }
    .value { color: #f1f5f9; font-weight: 600; }
    .message-box { background: rgba(0,0,0,0.3); border-left: 3px solid #6366f1; padding: 14px; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap; }
    .stars { color: #f59e0b; font-size: 16px; }
    .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">AI Career OS &middot; Feedback Intake</span>
    <h1>New User Feedback: ${data.type}</h1>

    <div class="card">
      <div class="row">
        <span class="label">Submitter:</span>
        <span class="value">${data.email || "Anonymous Visitor"} ${data.userName ? `(${data.userName})` : ""}</span>
      </div>
      <div class="row">
        <span class="label">Category:</span>
        <span class="value">${data.type}</span>
      </div>
      <div class="row">
        <span class="label">Rating:</span>
        <span class="value stars">${stars}</span>
      </div>
      <div class="row">
        <span class="label">Active Route:</span>
        <span class="value font-mono">${data.route || "/"}</span>
      </div>
      <div class="row">
        <span class="label">Timestamp:</span>
        <span class="value">${data.submittedAt}</span>
      </div>
    </div>

    <h2 style="font-size: 14px; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">Feedback Message</h2>
    <div class="message-box">
      ${data.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
    </div>

    ${
      data.screenshotNote
        ? `
    <h2 style="font-size: 14px; color: #94a3b8; text-transform: uppercase; margin-top: 16px; margin-bottom: 8px;">Screenshot / Context Notes</h2>
    <div class="message-box" style="border-left-color: #06b6d4;">
      ${data.screenshotNote.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
    </div>
    `
        : ""
    }

    <div class="footer">
      This notification was automatically dispatched to sskiran961@gmail.com by the AI Career OS Feedback Engine.
    </div>
  </div>
</body>
</html>
  `;
}
