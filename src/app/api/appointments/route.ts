import { NextResponse } from "next/server";
import { isSessionFormat } from "@/lib/appointment-status";
import { createBooking } from "@/lib/booking";

/** POST /api/appointments — public session request. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = await createBooking({
    serviceId: String(body.serviceId ?? ""),
    date: String(body.date ?? ""),
    startTime: String(body.startTime ?? ""),
    clientName: String(body.clientName ?? ""),
    clientEmail: body.clientEmail ? String(body.clientEmail) : "",
    clientPhone: body.clientPhone ? String(body.clientPhone) : "",
    sessionFormat: isSessionFormat(body.sessionFormat) ? body.sessionFormat : "IN_PERSON",
    notes: body.notes ? String(body.notes) : "",
    source: "online",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.code });
  }
  return NextResponse.json(
    { ok: true, appointmentId: result.appointmentId, status: result.status },
    { status: 201 },
  );
}
