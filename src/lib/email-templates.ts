/**
 * Branded, email-client-safe HTML for the practice's transactional messages.
 *
 * Email clients ignore <style>/external CSS and strip many tags, so everything
 * here is built from tables + inline styles. Each builder returns a subject and
 * both an HTML and a plain-text body.
 */
import { FORMAT_LABELS, type SessionFormat, isSessionFormat } from "./appointment-status";
import { formatDateLong, formatDuration, formatPrice, formatTime12 } from "./format";
import { PRACTICE } from "./practice-config";

/** The appointment fields the templates need (a Prisma Appointment satisfies this). */
export type EmailAppointment = {
  id: string;
  serviceName: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  priceCents: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  sessionFormat: string;
  notes: string;
};

export type BuiltEmail = { subject: string; html: string; text: string };

const ACCENT = "#47664F";
const INK = "#26211B";
const MUTED = "#867A6C";
const IVORY = "#FAF7F1";
const LINE = "#E9E1D3";

/** Escape user-supplied text before placing it into HTML. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.randyhooklcsw.com").replace(/\/$/, "");
}

function formatLabel(f: string): string {
  return isSessionFormat(f) ? FORMAT_LABELS[f as SessionFormat] : f;
}

/** Branded shell around a message body (raw, already-escaped HTML). */
function shell(opts: { preheader: string; flourish: string; heading: string; body: string }): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:${IVORY};">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${IVORY};padding:28px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border:1px solid ${LINE};border-radius:18px;overflow:hidden;">
        <tr><td style="background:${ACCENT};height:6px;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:34px 38px 6px;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;color:${ACCENT};font-size:17px;line-height:1;">${esc(opts.flourish)}</div>
          <h1 style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;color:${INK};font-size:25px;font-weight:600;">${esc(opts.heading)}</h1>
        </td></tr>
        <tr><td style="padding:14px 38px 28px;font-family:Helvetica,Arial,sans-serif;color:${INK};font-size:15px;line-height:1.65;">
          ${opts.body}
        </td></tr>
        <tr><td style="padding:20px 38px 28px;border-top:1px solid ${LINE};font-family:Helvetica,Arial,sans-serif;color:${MUTED};font-size:12px;line-height:1.6;">
          <strong style="color:${INK};">${esc(PRACTICE.name)}</strong><br/>
          ${esc(PRACTICE.address)}, ${esc(PRACTICE.cityLine)}<br/>
          ${esc(PRACTICE.phone)} &middot; ${esc(PRACTICE.email)}
        </td></tr>
      </table>
    </td></tr>
  </table>
  </body></html>`;
}

function detailsTable(a: EmailAppointment): string {
  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:7px 2px;color:${MUTED};font-size:13px;">${label}</td>
      <td style="padding:7px 2px;text-align:right;color:${INK};font-weight:600;">${value}</td>
    </tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="margin:18px 0;background:${IVORY};border:1px solid ${LINE};border-radius:12px;padding:4px 16px;">
    ${row("Session", esc(a.serviceName))}
    ${row("Date", formatDateLong(a.date))}
    ${row("Time", formatTime12(a.startTime))}
    ${row("Length", formatDuration(a.durationMinutes))}
    ${row("Format", esc(formatLabel(a.sessionFormat)))}
    ${a.priceCents ? row("Fee", formatPrice(a.priceCents)) : ""}
  </table>`;
}

function detailsText(a: EmailAppointment): string {
  const lines = [
    `  Session:  ${a.serviceName}`,
    `  Date:     ${formatDateLong(a.date)}`,
    `  Time:     ${formatTime12(a.startTime)}`,
    `  Length:   ${formatDuration(a.durationMinutes)}`,
    `  Format:   ${formatLabel(a.sessionFormat)}`,
  ];
  if (a.priceCents) lines.push(`  Fee:      ${formatPrice(a.priceCents)}`);
  return lines.join("\n");
}

function footerText(): string {
  return `${PRACTICE.name}\n${PRACTICE.address}, ${PRACTICE.cityLine}\n${PRACTICE.phone} · ${PRACTICE.email}`;
}

// ----------------------------------------------------- Client: request received
export function clientRequestReceived(a: EmailAppointment): BuiltEmail {
  const subject = `Your session request — ${formatDateLong(a.date)} at ${formatTime12(a.startTime)}`;
  const body = `
    <p style="margin:0 0 4px;">Hi ${esc(firstName(a.clientName))}, thank you for reaching out — your request is in, and the time below is being held for you. Randy personally confirms every session; you'll hear back shortly.</p>
    ${detailsTable(a)}
    <p style="color:${MUTED};font-size:13px;margin:0;">Need to change anything in the meantime? Just reply to this email or call ${esc(PRACTICE.phone)}.</p>`;
  const text =
    `Hi ${firstName(a.clientName)}, thank you for reaching out — your request is in, and the time below is being held for you. Randy personally confirms every session; you'll hear back shortly.\n\n` +
    detailsText(a) +
    `\n\nNeed to change anything? Reply to this email or call ${PRACTICE.phone}.\n\n${footerText()}`;
  return {
    subject,
    html: shell({
      preheader: "Your session request is in.",
      flourish: "hope · healing · possibility",
      heading: "Your request is in",
      body,
    }),
    text,
  };
}

// ------------------------------------------------------------ Client: confirmed
export function clientConfirmed(a: EmailAppointment): BuiltEmail {
  const subject = `Confirmed — ${formatDateLong(a.date)} at ${formatTime12(a.startTime)}`;
  const telehealthNote =
    a.sessionFormat === "TELEHEALTH"
      ? `<p style="margin:0 0 4px;color:${MUTED};font-size:13px;">This is a telehealth session — Randy will send a private video link before you meet.</p>`
      : "";
  const body = `
    <p style="margin:0 0 4px;">Hi ${esc(firstName(a.clientName))}, your session is confirmed. I look forward to meeting with you.</p>
    ${detailsTable(a)}
    ${telehealthNote}
    <p style="color:${MUTED};font-size:13px;margin:0;">Need to reschedule? Reply to this email or call ${esc(PRACTICE.phone)} and we'll find a better time.</p>`;
  const text =
    `Hi ${firstName(a.clientName)}, your session is confirmed.\n\n` +
    detailsText(a) +
    (a.sessionFormat === "TELEHEALTH"
      ? `\n\nThis is a telehealth session — Randy will send a private video link before you meet.`
      : "") +
    `\n\nNeed to reschedule? Reply to this email or call ${PRACTICE.phone}.\n\n${footerText()}`;
  return {
    subject,
    html: shell({
      preheader: "Your session is confirmed.",
      flourish: "hope · healing · possibility",
      heading: "You're confirmed",
      body,
    }),
    text,
  };
}

// ----------------------------------------------------------- Owner: new request
export function ownerNewRequest(a: EmailAppointment): BuiltEmail {
  const isRequest = true;
  const subject = `New ${isRequest ? "request" : "session"} · ${a.clientName} · ${formatDateLong(a.date)} ${formatTime12(a.startTime)}`;
  const contactRow = (label: string, value: string) =>
    `<tr><td style="padding:4px 2px;color:${MUTED};font-size:13px;">${label}</td><td style="padding:4px 2px;text-align:right;color:${INK};">${value}</td></tr>`;
  const contact = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:2px 0 0;">
      ${contactRow("Client", `<strong>${esc(a.clientName)}</strong>`)}
      ${a.clientPhone ? contactRow("Phone", esc(a.clientPhone)) : ""}
      ${a.clientEmail ? contactRow("Email", esc(a.clientEmail)) : ""}
    </table>`;
  const body = `
    <p style="margin:0 0 4px;">A new session request just came in — it's holding its slot until you confirm it.</p>
    ${detailsTable(a)}
    ${contact}
    ${a.notes ? `<p style="margin:16px 0 0;"><span style="color:${MUTED};font-size:13px;">Notes:</span><br/>${esc(a.notes)}</p>` : ""}
    <p style="margin:18px 0 0;"><a href="${siteUrl()}/admin" style="color:${ACCENT};font-weight:600;text-decoration:none;">Open the appointment book →</a></p>`;
  const text =
    `New session request for ${PRACTICE.name}.\n\n` +
    detailsText(a) +
    `\n\n  Client:   ${a.clientName}` +
    (a.clientPhone ? `\n  Phone:    ${a.clientPhone}` : "") +
    (a.clientEmail ? `\n  Email:    ${a.clientEmail}` : "") +
    (a.notes ? `\n\nNotes: ${a.notes}` : "") +
    `\n\nAdmin: ${siteUrl()}/admin`;
  return {
    subject,
    html: shell({
      preheader: `${a.clientName} — ${formatDateLong(a.date)}`,
      flourish: "new request",
      heading: "New session request",
      body,
    }),
    text,
  };
}

// ------------------------------------------------------------ Client: cancelled
export function clientCancellation(a: EmailAppointment): BuiltEmail {
  const subject = `Cancelled — your session on ${formatDateLong(a.date)}`;
  const body = `
    <p style="margin:0 0 4px;">Hi ${esc(firstName(a.clientName))}, the session below has been cancelled.</p>
    ${detailsTable(a)}
    <p style="margin:0;">If you'd like to find a new time, you can <a href="${siteUrl()}/book" style="color:${ACCENT};font-weight:600;">request a session online</a> or call ${esc(PRACTICE.phone)} — the door is always open.</p>`;
  const text =
    `Hi ${firstName(a.clientName)}, the session below has been cancelled.\n\n` +
    detailsText(a) +
    `\n\nFind a new time: ${siteUrl()}/book  ·  or call ${PRACTICE.phone}\n\n${footerText()}`;
  return {
    subject,
    html: shell({
      preheader: "Your session has been cancelled.",
      flourish: "hope · healing · possibility",
      heading: "Session cancelled",
      body,
    }),
    text,
  };
}

// ------------------------------------------------------------- Client: reminder
export function clientReminder(a: EmailAppointment): BuiltEmail {
  const subject = `Reminder · your session ${formatDateLong(a.date)} at ${formatTime12(a.startTime)}`;
  const body = `
    <p style="margin:0 0 4px;">Hi ${esc(firstName(a.clientName))}, a gentle reminder about your upcoming session.</p>
    ${detailsTable(a)}
    <p style="color:${MUTED};font-size:13px;margin:0;">Can't make it? Reply to this email or call ${esc(PRACTICE.phone)} and we'll find a better time.</p>`;
  const text =
    `Hi ${firstName(a.clientName)}, a gentle reminder about your upcoming session.\n\n` +
    detailsText(a) +
    `\n\nCan't make it? Reply to this email or call ${PRACTICE.phone}.\n\n${footerText()}`;
  return {
    subject,
    html: shell({
      preheader: "A reminder about your upcoming session.",
      flourish: "see you soon",
      heading: "Session reminder",
      body,
    }),
    text,
  };
}
