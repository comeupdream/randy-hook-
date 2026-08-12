import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { isSessionFormat } from "@/lib/appointment-status";
import { isAdminAuthed } from "@/lib/auth";
import { createBooking } from "@/lib/booking";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/admin/appointments — filtered list for the appointment book. */
export async function GET(req: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const where: Prisma.AppointmentWhereInput = {};
  if (from || to) {
    const dateFilter: Prisma.StringFilter = {};
    if (from) dateFilter.gte = from;
    if (to) dateFilter.lte = to;
    where.date = dateFilter;
  }
  if (status && status !== "ALL") where.status = status;
  if (q) {
    where.OR = [
      { clientName: { contains: q, mode: "insensitive" } },
      { clientEmail: { contains: q, mode: "insensitive" } },
      { clientPhone: { contains: q, mode: "insensitive" } },
      { serviceName: { contains: q, mode: "insensitive" } },
    ];
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ appointments });
}

/** POST /api/admin/appointments — practice-created (phone / walk-in) session. */
export async function POST(req: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await createBooking({
    serviceId: String(body.serviceId ?? ""),
    date: String(body.date ?? ""),
    startTime: String(body.startTime ?? ""),
    clientName: String(body.clientName ?? ""),
    clientEmail: body.clientEmail ? String(body.clientEmail) : "",
    clientPhone: body.clientPhone ? String(body.clientPhone) : "",
    sessionFormat: isSessionFormat(body.sessionFormat) ? body.sessionFormat : "IN_PERSON",
    notes: body.notes ? String(body.notes) : "",
    source: "admin",
    bypassWindowChecks: true,
    // The practice booked this, so send the client their confirmation but
    // skip the owner self-alert.
    notify: { client: true, owner: false },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.code });
  }
  return NextResponse.json(
    { ok: true, appointmentId: result.appointmentId },
    { status: 201 },
  );
}
