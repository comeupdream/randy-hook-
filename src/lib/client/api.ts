/**
 * The client-side data layer every interactive component talks to.
 *
 * Two backends, one interface:
 *  - Live (default): fetches the Next.js API routes backed by Postgres.
 *  - Demo (NEXT_PUBLIC_DEMO_MODE=1): routes to the in-browser store so the
 *    statically-exported demo behaves like the real system — same
 *    availability engine, same rules, no server.
 *
 * Components never know which one they're on, which is exactly what makes
 * "static demo first, web service later" a config flip instead of a rewrite.
 */
import { IS_DEMO } from "../mode";

export type Service = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  category: string;
};

export type AppointmentRow = {
  id: string;
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
  status: string;
  source: string;
};

export type BlockRow = {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  reason: string;
};

export type BookingInput = {
  serviceId: string;
  date: string;
  startTime: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  sessionFormat?: string;
  notes?: string;
};

type Fail = { ok: false; error: string; status: number };

async function j<T>(res: Response): Promise<T | Fail> {
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    return {
      ok: false,
      error: typeof data.error === "string" ? data.error : "Something went wrong.",
      status: res.status,
    };
  }
  return data as T;
}

const demo = () => import("../demo/store");

// ------------------------------------------------------------------ public

export async function fetchServices(): Promise<{ services: Service[] } | Fail> {
  if (IS_DEMO) return (await demo()).getServices();
  try {
    return await j(await fetch("/api/services"));
  } catch {
    return { ok: false, error: "Network error.", status: 0 };
  }
}

export async function fetchAvailability(
  date: string,
  serviceId: string,
): Promise<{ ok: true; slots: string[] } | Fail> {
  if (IS_DEMO) return (await demo()).getAvailability(date, serviceId);
  try {
    const res = await fetch(`/api/availability?date=${date}&serviceId=${serviceId}`);
    const data = await j<{ slots: string[] }>(res);
    if ("ok" in data && data.ok === false) return data;
    return { ok: true, slots: (data as { slots: string[] }).slots ?? [] };
  } catch {
    return { ok: false, error: "Network error.", status: 0 };
  }
}

export async function createAppointment(
  input: BookingInput,
): Promise<{ ok: true; appointmentId: string; status: string } | Fail> {
  if (IS_DEMO) return (await demo()).createAppointment(input);
  try {
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await j<{ ok: true; appointmentId: string; status: string }>(res);
    return data as { ok: true; appointmentId: string; status: string } | Fail;
  } catch {
    return { ok: false, error: "Network error.", status: 0 };
  }
}

// ------------------------------------------------------------------- admin

export async function adminLogin(password: string): Promise<{ ok: true } | Fail> {
  if (IS_DEMO) return (await demo()).adminLogin(password);
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    return (await j<{ ok: true }>(res)) as { ok: true } | Fail;
  } catch {
    return { ok: false, error: "Network error.", status: 0 };
  }
}

export async function adminLogout(): Promise<void> {
  if (IS_DEMO) {
    await (await demo()).adminLogout();
    return;
  }
  await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
}

export async function adminMe(): Promise<{ authed: boolean }> {
  if (IS_DEMO) return (await demo()).adminMe();
  try {
    const res = await fetch("/api/admin/me");
    const data = (await res.json().catch(() => ({}))) as { authed?: boolean };
    return { authed: Boolean(data.authed) };
  } catch {
    return { authed: false };
  }
}

export type AdminListParams = { from?: string; to?: string; status?: string; q?: string };

export async function adminListAppointments(
  params: AdminListParams,
): Promise<{ appointments: AppointmentRow[] } | Fail> {
  if (IS_DEMO) {
    const r = await (await demo()).adminListAppointments(params);
    return r as { appointments: AppointmentRow[] };
  }
  const search = new URLSearchParams();
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.status) search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  try {
    return (await j(await fetch(`/api/admin/appointments?${search.toString()}`))) as
      | { appointments: AppointmentRow[] }
      | Fail;
  } catch {
    return { ok: false, error: "Network error.", status: 0 };
  }
}

export async function adminCreateAppointment(
  input: BookingInput,
): Promise<{ ok: true } | Fail> {
  if (IS_DEMO) {
    const r = await (await demo()).createAppointment({
      ...input,
      source: "admin",
      bypassWindowChecks: true,
    });
    return r as { ok: true } | Fail;
  }
  try {
    const res = await fetch("/api/admin/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await j<{ ok: true }>(res)) as { ok: true } | Fail;
  } catch {
    return { ok: false, error: "Network error.", status: 0 };
  }
}

export async function adminPatchAppointment(
  id: string,
  patch: Record<string, unknown>,
): Promise<{ ok: true } | Fail> {
  if (IS_DEMO) {
    const r = await (await demo()).adminPatchAppointment(id, patch);
    return r as { ok: true } | Fail;
  }
  try {
    const res = await fetch(`/api/admin/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return (await j<{ ok: true }>(res)) as { ok: true } | Fail;
  } catch {
    return { ok: false, error: "Network error.", status: 0 };
  }
}

export async function adminDeleteAppointment(id: string): Promise<{ ok: true } | Fail> {
  if (IS_DEMO) return (await demo()).adminDeleteAppointment(id);
  try {
    const res = await fetch(`/api/admin/appointments/${id}`, { method: "DELETE" });
    return (await j<{ ok: true }>(res)) as { ok: true } | Fail;
  } catch {
    return { ok: false, error: "Network error.", status: 0 };
  }
}

export async function adminListBlocks(params: {
  from?: string;
  to?: string;
}): Promise<{ blocks: BlockRow[] } | Fail> {
  if (IS_DEMO) {
    const r = await (await demo()).adminListBlocks(params);
    return r as { blocks: BlockRow[] };
  }
  const search = new URLSearchParams();
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  try {
    return (await j(await fetch(`/api/admin/blocks?${search.toString()}`))) as
      | { blocks: BlockRow[] }
      | Fail;
  } catch {
    return { ok: false, error: "Network error.", status: 0 };
  }
}

export async function adminCreateBlock(input: {
  date: string;
  startTime: string;
  durationMinutes: number;
  reason?: string;
}): Promise<{ ok: true } | Fail> {
  if (IS_DEMO) {
    const r = await (await demo()).adminCreateBlock(input);
    return r as { ok: true } | Fail;
  }
  try {
    const res = await fetch("/api/admin/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await j<{ ok: true }>(res)) as { ok: true } | Fail;
  } catch {
    return { ok: false, error: "Network error.", status: 0 };
  }
}

export async function adminDeleteBlock(id: string): Promise<{ ok: true } | Fail> {
  if (IS_DEMO) return (await demo()).adminDeleteBlock(id);
  try {
    const res = await fetch(`/api/admin/blocks/${id}`, { method: "DELETE" });
    return (await j<{ ok: true }>(res)) as { ok: true } | Fail;
  } catch {
    return { ok: false, error: "Network error.", status: 0 };
  }
}
