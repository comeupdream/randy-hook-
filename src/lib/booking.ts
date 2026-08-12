import { BLOCKING_STATUSES, type SessionFormat } from "./appointment-status";
import { type BusyBlock } from "./availability";
import { checkBookingWindow } from "./booking-rules";
import { ownerEmail, sendEmail } from "./email";
import {
  clientRequestReceived,
  clientConfirmed,
  ownerNewRequest,
  type EmailAppointment,
} from "./email-templates";
import { prisma } from "./prisma";

/**
 * Everything that occupies the calendar on a given date: sessions in a
 * blocking status plus admin-blocked personal time.
 */
export async function getBusyBlocks(dateISO: string): Promise<BusyBlock[]> {
  const [appointments, blocks] = await Promise.all([
    prisma.appointment.findMany({
      where: { date: dateISO, status: { in: BLOCKING_STATUSES } },
      select: { startTime: true, durationMinutes: true },
    }),
    prisma.blockedTime.findMany({
      where: { date: dateISO },
      select: { startTime: true, durationMinutes: true },
    }),
  ]);
  return [...appointments, ...blocks];
}

export type CreateBookingInput = {
  serviceId: string;
  date: string;
  startTime: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  sessionFormat?: SessionFormat;
  notes?: string;
  source?: "online" | "admin";
  /** Admin bookings may bypass the lead-time / horizon limits. */
  bypassWindowChecks?: boolean;
  /** Which emails to fire. Defaults to both. */
  notify?: { client?: boolean; owner?: boolean };
};

export type CreateBookingResult =
  | { ok: true; appointmentId: string; status: string }
  | { ok: false; error: string; code: number };

/**
 * Validate + create a session with a server-side conflict check. Shared by
 * the public booking form and the admin "add session" action.
 *
 * Online requests are created as REQUESTED (they hold their slot until Randy
 * confirms them in the admin); admin-created sessions are CONFIRMED outright.
 */
export async function createBooking(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  const name = input.clientName?.trim();
  if (!name) return { ok: false, error: "A name is required.", code: 400 };

  const service = await prisma.service.findUnique({
    where: { id: input.serviceId },
  });
  if (!service || !service.active)
    return { ok: false, error: "That session type is unavailable.", code: 400 };

  const busy = await getBusyBlocks(input.date);
  const window = checkBookingWindow(
    {
      date: input.date,
      startTime: input.startTime,
      durationMinutes: service.durationMinutes,
      bypassWindowChecks: input.bypassWindowChecks,
    },
    busy,
  );
  if (!window.ok) return window;

  const status = input.source === "admin" ? "CONFIRMED" : "REQUESTED";

  const appt = await prisma.appointment.create({
    data: {
      serviceId: service.id,
      serviceName: service.name,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
      date: input.date,
      startTime: input.startTime,
      clientName: name,
      clientEmail: input.clientEmail?.trim() ?? "",
      clientPhone: input.clientPhone?.trim() ?? "",
      sessionFormat: input.sessionFormat ?? "IN_PERSON",
      notes: input.notes?.trim() ?? "",
      status,
      source: input.source ?? "online",
    },
  });

  await sendBookingEmails(appt, status, input.notify);

  return { ok: true, appointmentId: appt.id, status };
}

/**
 * Fire the emails for a new booking. Online requests send the client a
 * "request received" note plus an owner alert; admin-created sessions send
 * the client a confirmation. Failures are swallowed inside sendEmail, so a
 * provider hiccup can never break a booking.
 */
async function sendBookingEmails(
  appt: EmailAppointment,
  status: string,
  notify: CreateBookingInput["notify"],
): Promise<void> {
  const wantClient = notify?.client ?? true;
  const wantOwner = notify?.owner ?? true;

  const tasks: Promise<unknown>[] = [];
  if (wantClient && appt.clientEmail) {
    const template =
      status === "CONFIRMED" ? clientConfirmed(appt) : clientRequestReceived(appt);
    tasks.push(
      sendEmail({ to: appt.clientEmail, replyTo: ownerEmail(), ...template }),
    );
  }
  if (wantOwner) {
    tasks.push(
      sendEmail({
        to: ownerEmail(),
        replyTo: appt.clientEmail || undefined,
        ...ownerNewRequest(appt),
      }),
    );
  }
  await Promise.allSettled(tasks);
}
