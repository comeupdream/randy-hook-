import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  type AppointmentStatus,
  isAppointmentStatus,
  isSessionFormat,
} from "@/lib/appointment-status";
import { isAdminAuthed } from "@/lib/auth";
import { ownerEmail, sendEmail } from "@/lib/email";
import { clientCancellation, clientConfirmed } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";
import { isValidDateISO, isValidTime } from "@/lib/time";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/appointments/:id — update status or details. */
export async function PATCH(req: Request, ctx: Ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const data: Prisma.AppointmentUpdateInput = {};

  let newStatus: AppointmentStatus | undefined;
  if (body.status !== undefined) {
    if (!isAppointmentStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    newStatus = body.status;
    data.status = newStatus;
  }
  if (body.clientName !== undefined) data.clientName = String(body.clientName);
  if (body.clientEmail !== undefined) data.clientEmail = String(body.clientEmail);
  if (body.clientPhone !== undefined) data.clientPhone = String(body.clientPhone);
  if (body.notes !== undefined) data.notes = String(body.notes);
  if (body.sessionFormat !== undefined) {
    if (!isSessionFormat(body.sessionFormat))
      return NextResponse.json({ error: "Invalid session format." }, { status: 400 });
    data.sessionFormat = body.sessionFormat;
  }
  if (body.date !== undefined) {
    if (!isValidDateISO(String(body.date)))
      return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    data.date = String(body.date);
  }
  if (body.startTime !== undefined) {
    if (!isValidTime(String(body.startTime)))
      return NextResponse.json({ error: "Invalid time." }, { status: 400 });
    data.startTime = String(body.startTime);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  // Email the client only on a real transition (REQUESTED → CONFIRMED sends a
  // confirmation; any → CANCELLED sends a cancellation), so check prior state.
  let priorStatus: string | null = null;
  if (newStatus === "CANCELLED" || newStatus === "CONFIRMED") {
    const existing = await prisma.appointment.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }
    priorStatus = existing.status;
  }

  try {
    const appointment = await prisma.appointment.update({ where: { id }, data });

    if (appointment.clientEmail) {
      if (newStatus === "CANCELLED" && priorStatus !== "CANCELLED") {
        await sendEmail({
          to: appointment.clientEmail,
          replyTo: ownerEmail(),
          ...clientCancellation(appointment),
        });
      } else if (newStatus === "CONFIRMED" && priorStatus === "REQUESTED") {
        await sendEmail({
          to: appointment.clientEmail,
          replyTo: ownerEmail(),
          ...clientConfirmed(appointment),
        });
      }
    }

    return NextResponse.json({ ok: true, appointment });
  } catch {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
}

/** DELETE /api/admin/appointments/:id — remove a session. */
export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
}
