import { PrismaClient } from "@prisma/client";
import { SERVICE_CATALOG } from "../src/lib/catalog";
import { PRACTICE } from "../src/lib/practice-config";

const prisma = new PrismaClient();

function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PRACTICE.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate(),
  ).padStart(2, "0")}`;
}

function weekday(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** The next `count` open dates starting tomorrow. */
function nextOpenDays(count: number): string[] {
  const out: string[] = [];
  let cursor = todayISO();
  let guard = 0;
  while (out.length < count && guard < 30) {
    cursor = addDays(cursor, 1);
    if (PRACTICE.hours[weekday(cursor)]) out.push(cursor);
    guard++;
  }
  return out;
}

async function main() {
  // Session menu — idempotent upserts keyed by stable slugs.
  for (const [i, s] of SERVICE_CATALOG.entries()) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: { ...s, sortOrder: i, active: true },
      create: { ...s, sortOrder: i, active: true },
    });
  }
  console.log(`Seeded ${SERVICE_CATALOG.length} session types.`);

  const count = await prisma.appointment.count();
  if (count > 0) {
    console.log(`Skipped demo sessions (${count} already exist).`);
    return;
  }

  const byId = Object.fromEntries(SERVICE_CATALOG.map((s) => [s.id, s]));
  const days = nextOpenDays(3);
  const demo = [
    { day: 0, time: "10:00", svc: "individual", name: "Jordan Wells", phone: "(555) 204-8821", status: "CONFIRMED" },
    { day: 0, time: "14:00", svc: "couples", name: "Sam & Rae Delgado", phone: "(555) 332-0091", status: "CONFIRMED" },
    { day: 1, time: "09:00", svc: "consultation", name: "Avery Linden", phone: "(555) 884-2310", status: "REQUESTED" },
    { day: 1, time: "11:00", svc: "individual", name: "Chris Okafor", phone: "(555) 119-6654", status: "CONFIRMED" },
    { day: 2, time: "16:00", svc: "premarital", name: "Maya & Ben Carter", phone: "(555) 770-5512", status: "REQUESTED" },
  ];

  for (const d of demo) {
    const svc = byId[d.svc];
    const date = days[d.day];
    if (!svc || !date) continue;
    await prisma.appointment.create({
      data: {
        serviceId: svc.id,
        serviceName: svc.name,
        durationMinutes: svc.durationMinutes,
        priceCents: svc.priceCents,
        date,
        startTime: d.time,
        clientName: d.name,
        clientPhone: d.phone,
        clientEmail: "",
        status: d.status,
        source: "online",
      },
    });
  }
  console.log(`Seeded ${demo.length} sample sessions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
