// Email transport via Brevo's HTTP API (https://api.brevo.com/v3/smtp/email).
//
// Why not nodemailer/SMTP? This Render service blocks outbound SMTP on both
// 465 and 587 (CONN timeout), so SMTP can never connect from here. Brevo's
// HTTP API uses port 443, which is always allowed. This module keeps the same
// `transporter.sendMail({...})` + `sender` interface, so emails.js is unchanged.
//
// Setup required (Render env + Brevo dashboard):
//   1. BREVO_API_KEY  – from Brevo > SMTP & API > API Keys
//   2. Verify a sender in Brevo (Senders & Domains). With no custom domain,
//      verify a single email (e.g. your Gmail) and set EMAIL_FROM to it.
import dotenv from "dotenv";

dotenv.config();

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

export const sender = {
  // Must be a VERIFIED sender in Brevo, otherwise the API returns 400.
  email: process.env.EMAIL_FROM || process.env.MAILTRAP_USER || "eventsedu73@gmail.com",
  name: process.env.EMAIL_FROM_NAME || "EduEvents",
};

// Parse the `"Name" <email>` string that emails.js builds into Brevo's object.
function parseFrom(from) {
  if (!from) return { ...sender };
  const m = /^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/.exec(from);
  if (m) return { name: (m[1] || "").trim() || sender.name, email: m[2].trim() };
  return { name: sender.name, email: from.trim() };
}

function toRecipients(to) {
  const list = Array.isArray(to) ? to : String(to).split(",");
  return list.map((e) => ({ email: e.trim() })).filter((r) => r.email);
}

// Map nodemailer-style attachments to Brevo's { name, content(base64) }.
// Note: Brevo does not support `cid:` inline images, so the QR-code attachment
// is delivered as a normal attachment rather than rendered inline in the body.
function mapAttachments(attachments) {
  if (!attachments || !attachments.length) return undefined;
  return attachments.map((a, i) => {
    let content = a.content;
    if (Buffer.isBuffer(content)) content = content.toString("base64");
    return { name: a.filename || `attachment-${i}`, content };
  });
}

export const transporter = {
  async sendMail({ from, to, subject, html, text, attachments }) {
    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is not set");
    }

    const body = {
      sender: parseFrom(from),
      to: toRecipients(to),
      subject,
      htmlContent: html,
      textContent: text,
      attachment: mapAttachments(attachments),
    };

    const res = await fetch(BREVO_URL, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Brevo send failed (${res.status}): ${detail}`);
    }

    const data = await res.json().catch(() => ({}));
    return { messageId: data.messageId };
  },
};

// Surface configuration problems at startup, visible in Render logs.
if (!BREVO_API_KEY) {
  console.warn("⚠️  BREVO_API_KEY is not set — emails will fail to send.");
} else {
  console.log(`Email transport: Brevo HTTP API ready (from=${sender.email})`);
}
