/**
 * Email Mailer — Nodemailer SMTP Transport
 *
 * Configure via env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *   EMAIL_FROM  (e.g. "AI Career OS <no-reply@aicareer.os>")
 *
 * If SMTP_HOST is not set the mailer logs to console (dev-safe no-op).
 */

import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!process.env.SMTP_HOST) return null;

  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return _transporter;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || "AI Career OS <no-reply@aicareer.os>";

  if (!transporter) {
    // Dev fallback — log to console so developers can test without SMTP
    console.log(
      `\n📧 [DEV EMAIL — no SMTP configured]\nTo: ${options.to}\nSubject: ${options.subject}\n\n${options.text || "(HTML email — view source for content)"}\n`
    );
    return;
  }

  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}
