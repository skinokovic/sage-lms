import nodemailer from "nodemailer";

const BRAND_RED = "#B00000";
const BRAND_NAVY = "#1E3A8A";

let transporter;

const isConfigured = () =>
  Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  );

const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Escapes the text, then turns web addresses into clickable links
const linkify = (text) =>
  escapeHtml(text).replace(
    /(https?:\/\/[^\s<]+)/g,
    `<a href="$1" style="color:${BRAND_NAVY};word-break:break-all;">$1</a>`,
  );

// A simple branded email built from plain text (and an optional button)
const buildHtml = ({ subject, text = "", action }) => {
  const paragraphs = String(text)
    .split(/\n{2,}/)
    .filter((part) => part.trim())
    .map(
      (part) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">${linkify(
          part,
        ).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");

  const button = action
    ? `<p style="margin:24px 0;"><a href="${escapeHtml(
        action.url,
      )}" style="display:inline-block;background:${BRAND_RED};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 28px;border-radius:10px;">${escapeHtml(
        action.label,
      )}</a></p>`
    : "";

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:${BRAND_NAVY};padding:20px 28px;">
                <span style="font-size:22px;font-weight:700;color:#ffffff;">SAGE</span>
                <span style="font-size:22px;font-weight:700;color:#fca5a5;">LMS</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 18px;font-size:20px;color:#111827;">${escapeHtml(
                  subject,
                )}</h1>
                ${paragraphs}
                ${button}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#f9fafb;font-size:12px;color:#6b7280;">
                This is an automated message from SAGE LMS. Please do not reply to it.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

/**
 * Sends an email.
 *
 *   sendEmail({ to, subject, text, html?, action?: { label, url } })
 *
 * Without SMTP settings it only prints the email in development, and refuses
 * to run in production so a missing setting is never silent.
 */
const sendEmail = async ({ to, subject, text, html, action }) => {
  if (!to) {
    throw new Error("Email recipient is required");
  }

  if (!isConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email service is not configured");
    }

    console.log("--- EMAIL (not sent: SMTP is not configured) ---");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text);
    console.log("-------------------------------------------------");

    return { mocked: true };
  }

  return getTransporter().sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html: html || buildHtml({ subject, text, action }),
  });
};

export default sendEmail;
