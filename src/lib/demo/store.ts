/**
 * The static demo's in-browser data layer.
 *
 * When the site is exported as a static demo (NEXT_PUBLIC_DEMO_MODE=1) there
 * is no server — so this module plays the part of the API using localStorage,
 * the shared service catalog, and the very same pure availability/booking
 * rules the production server runs. Book a session in the demo and it shows
 * up in the demo admin, conflicts and all.
 *
 * Everything here is browser-only. The production build never calls it.
 */
import { BLOCKING_STATUSES, type AppointmentStatus } from "../appointment-status";
import { type BusyBlock, computeAvailableSlots } from "../availability";
import { checkBookingWindow } from "../booking-rules";
import { SERVICE_CATALOG } from "../catalog";
import { DEMO_ADMIN_PASSWORD } from "../mode";
import { PRACTICE, practiceTodayISO } from "../practice-config";
import { addDaysISO, weekdayOf } from "../time";

export type DemoAppointment = {
  id: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  priceCents: number;
  date: string;
  startTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  sessionFormat: string;
  notes: string;
  status: AppointmentStatus;
  source: string;
};

export type DemoBlock = {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  reason: string;
};

type DemoState = {
  appointments: DemoAppointment[];
  blocks: DemoBlock[];
  authed: boolean;
  seededFor: string; // the "today" the sample data was generated for
};

const KEY = "rh-demo-v1";
let counter = 0;

function newId(): string {
  counter += 1;
  return `demo-${Date.now().toString(36)}-${counter}`;
}

/** The next `count` open dates starting tomorrow (demo data is date-relative). */
function nextOpenDays(count: number): string[] {
  const out: string[] = [];
  let cursor = practiceTodayISO();
  let guard = 0;
  while (out.length < count && guard < 30) {
    cursor = addDaysISO(cursor, 1);
    if (PRACTICE.hours[weekdayOf(cursor)]) out.push(cursor);
    guard++;
  }
  return out;
}

/** Sample sessions + blocked time so the demo admin opens with life in it. */
function seed(): DemoState {
  const days = nextOpenDays(4);
  const svc = Object.fromEntries(SERVICE_CATALOG.map((s) => [s.id, s]));
  const mk = (
    day: number,
    time: string,
    serviceId: string,
    clientName: string,
    status: AppointmentStatus,
    extra?: Partial<DemoAppointment>,
  ): DemoAppointment | null => {
    const s = svc[serviceId];
    const date = days[day];
    if (!s || !date) return null;
    return {
      id: newId(),
      serviceId: s.id,
      serviceName: s.name,
      durationMinutes: s.durationMinutes,
      priceCents: s.priceCents,
      date,
      startTime: time,
      clientName,
      clientEmail: "",
      clientPhone: "",
      sessionFormat: "IN_PERSON",
      notes: "",
      status,
      source: "online",
      ...extra,
    };
  };

  const appointments = [
    mk(0, "10:00", "individual", "Jordan Wells", "CONFIRMED", {
      clientPhone: "(555) 204-8821",
    }),
    mk(0, "14:00", "couples", "Sam & Rae Delgado", "CONFIRMED"),
    mk(1, "09:00", "consultation", "Avery Linden", "REQUESTED", {
      clientEmail: "avery@example.com",
      notes: "Found you through the website — hoping to talk this week.",
    }),
    mk(1, "11:00", "individual", "Chris Okafor", "CONFIRMED", {
      sessionFormat: "TELEHEALTH",
    }),
    mk(2, "16:00", "premarital", "Maya & Ben Carter", "REQUESTED", {
      clientEmail: "maya@example.com",
    }),
    mk(3, "10:00", "individual", "Dana Whitfield", "CONFIRMED"),
  ].filter(Boolean) as DemoAppointment[];

  const blocks: DemoBlock[] = [
    days[0]
      ? { id: newId(), date: days[0], startTime: "12:00", durationMinutes: 60, reason: "Lunch" }
      : null,
    days[2]
      ? { id: newId(), date: days[2], startTime: "09:00", durationMinutes: 120, reason: "Clinical supervision" }
      : null,
  ].filter(Boolean) as DemoBlock[];

  return { appointments, blocks, authed: false, seededFor: practiceTodayISO() };
}

function load(): DemoState {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (
        Array.isArray(parsed.appointments) &&
        Array.isArray(parsed.blocks) &&
        // Re-seed when the stored sample data has gone stale (all in the past).
        parsed.seededFor >= addDaysISO(practiceTodayISO(), -14)
      ) {
        return parsed;
      }
    }
  } catch {
    // fall through to a fresh seed
  }
  const fresh = seed();
  save(fresh);
  return fresh;
}

function save(state: DemoState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage full/blocked — demo keeps working from memory
  }
}

let state: DemoState | null = null;
function get(): DemoState {
  if (!state) state = load();
  return state;
}
function commit(): void {
  if (state) save(state);
}

/** Small async shim so the demo feels like a network without being one. */
function later<T>(value: T, ms = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// ------------------------------------------------------------------ public api

export async function getServices() {
  return later({ services: SERVICE_CATALOG.map((s, i) => ({ ...s, active: true, sortOrder: i })) });
}

function busyOn(dateISO: string): BusyBlock[] {
  const s = get();
  return [
    ...s.appointments.filter(
      (a) => a.date === dateISO && BLOCKING_STATUSES.includes(a.status),
    ),
    ...s.blocks.filter((b) => b.date === dateISO),
  ].map((b) => ({ startTime: b.startTime, durationMinutes: b.durationMinutes }));
}

export async function getAvailability(dateISO: string, serviceId: string) {
  const service = SERVICE_CATALOG.find((s) => s.id === serviceId);
  if (!service) return later({ ok: false as const, error: "Invalid session type.", status: 400 });
  const slots = computeAvailableSlots(dateISO, service.durationMinutes, busyOn(dateISO));
  return later({ ok: true as const, slots });
}

export type DemoBookingInput = {
  serviceId: string;
  date: string;
  startTime: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  sessionFormat?: string;
  notes?: string;
  source?: "online" | "admin";
  bypassWindowChecks?: boolean;
};

export async function createAppointment(input: DemoBookingInput) {
  const name = input.clientName?.trim();
  if (!name) return later({ ok: false as const, error: "A name is required.", status: 400 });

  const service = SERVICE_CATALOG.find((s) => s.id === input.serviceId);
  if (!service)
    return later({ ok: false as const, error: "That session type is unavailable.", status: 400 });

  const window = checkBookingWindow(
    {
      date: input.date,
      startTime: input.startTime,
      durationMinutes: service.durationMinutes,
      bypassWindowChecks: input.bypassWindowChecks,
    },
    busyOn(input.date),
  );
  if (!window.ok) return later({ ok: false as const, error: window.error, status: window.code });

  const status: AppointmentStatus = input.source === "admin" ? "CONFIRMED" : "REQUESTED";
  const appt: DemoAppointment = {
    id: newId(),
    serviceId: service.id,
    serviceName: service.name,
    durationMinutes: service.durationMinutes,
    priceCents: service.priceCents,
    date: input.date,
    startTime: input.startTime,
    clientName: name,
    clientEmail: input.clientEmail?.trim() ?? "",
    clientPhone: input.clientPhone?.trim() ?? "",
    sessionFormat: input.sessionFormat === "TELEHEALTH" ? "TELEHEALTH" : "IN_PERSON",
    notes: input.notes?.trim() ?? "",
    status,
    source: input.source ?? "online",
  };
  get().appointments.push(appt);
  commit();
  return later({ ok: true as const, appointmentId: appt.id, status });
}

// ------------------------------------------------------------------- admin api

export async function adminLogin(password: string) {
  if (password !== DEMO_ADMIN_PASSWORD) {
    return later({ ok: false as const, error: `Incorrect password. (Demo hint: "${DEMO_ADMIN_PASSWORD}")`, status: 401 });
  }
  get().authed = true;
  commit();
  return later({ ok: true as const });
}

export async function adminLogout() {
  get().authed = false;
  commit();
  return later({ ok: true as const });
}

export async function adminMe() {
  return later({ authed: get().authed }, 60);
}

export type AdminListParams = { from?: string; to?: string; status?: string; q?: string };

export async function adminListAppointments(params: AdminListParams) {
  const s = get();
  const q = params.q?.trim().toLowerCase();
  const rows = s.appointments
    .filter((a) => {
      if (params.from && a.date < params.from) return false;
      if (params.to && a.date > params.to) return false;
      if (params.status && params.status !== "ALL" && a.status !== params.status) return false;
      if (q) {
        const hay = `${a.clientName} ${a.clientEmail} ${a.clientPhone} ${a.serviceName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  return later({ appointments: rows });
}

export async function adminPatchAppointment(id: string, patch: Partial<DemoAppointment>) {
  const s = get();
  const appt = s.appointments.find((a) => a.id === id);
  if (!appt) return later({ ok: false as const, error: "Session not found.", status: 404 });
  Object.assign(appt, patch);
  commit();
  return later({ ok: true as const, appointment: appt });
}

export async function adminDeleteAppointment(id: string) {
  const s = get();
  s.appointments = s.appointments.filter((a) => a.id !== id);
  commit();
  return later({ ok: true as const });
}

export async function adminListBlocks(params: { from?: string; to?: string }) {
  const rows = get()
    .blocks.filter((b) => {
      if (params.from && b.date < params.from) return false;
      if (params.to && b.date > params.to) return false;
      return true;
    })
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  return later({ blocks: rows });
}

export async function adminCreateBlock(input: {
  date: string;
  startTime: string;
  durationMinutes: number;
  reason?: string;
}) {
  const block: DemoBlock = {
    id: newId(),
    date: input.date,
    startTime: input.startTime,
    durationMinutes: input.durationMinutes,
    reason: input.reason?.trim() ?? "",
  };
  get().blocks.push(block);
  commit();
  return later({ ok: true as const, block });
}

export async function adminDeleteBlock(id: string) {
  const s = get();
  s.blocks = s.blocks.filter((b) => b.id !== id);
  commit();
  return later({ ok: true as const });
}

/** Reset the demo to its freshly-seeded state. */
export async function resetDemo() {
  state = seed();
  state.authed = true;
  commit();
  return later({ ok: true as const });
}
