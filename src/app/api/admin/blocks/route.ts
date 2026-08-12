import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { isAdminAuthed } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidDateISO, isValidTime } from "@/lib/time";

export const dynamic = "force-dynamic";

/** GET /api/admin/blocks?from=&to= — blocked-time windows. */
export async function GET(req: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Prisma.BlockedTimeWhereInput = {};
  if (from || to) {
    const dateFilter: Prisma.StringFilter = {};
    if (from) dateFilter.gte = from;
    if (to) dateFilter.lte = to;
    where.date = dateFilter;
  }

  const blocks = await prisma.blockedTime.findMany({
    where,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ blocks });
}

/** POST /api/admin/blocks — hold a window on the calendar. */
export async function POST(req: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const date = String(body.date ?? "");
  const startTime = String(body.startTime ?? "");
  const durationMinutes = Number(body.durationMinutes ?? 0);
  const reason = body.reason ? String(body.reason) : "";

  if (!isValidDateISO(date))
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  if (!isValidTime(startTime))
    return NextResponse.json({ error: "Invalid time." }, { status: 400 });
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0 || durationMinutes > 24 * 60)
    return NextResponse.json({ error: "Invalid length." }, { status: 400 });

  const block = await prisma.blockedTime.create({
    data: { date, startTime, durationMinutes, reason },
  });

  return NextResponse.json({ ok: true, block }, { status: 201 });
}
