"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  APPOINTMENT_STATUSES,
  STATUS_LABELS,
  type AppointmentStatus,
} from "@/lib/appointment-status";
import {
  adminCreateAppointment,
  adminDeleteAppointment,
  adminListAppointments,
  adminLogout,
  adminPatchAppointment,
  type AppointmentRow,
  type Service,
} from "@/lib/client/api";
import {
  formatDateShort,
  formatDuration,
  formatPrice,
  formatTime12,
} from "@/lib/format";
import { AdminCalendar } from "@/components/admin/AdminCalendar";
import { AdminBlocks } from "@/components/admin/AdminBlocks";

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  REQUESTED: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-sky-50 text-sky-700 border-sky-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  NO_SHOW: "bg-stone-100 text-stone-600 border-stone-200",
};

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate(),
  ).padStart(2, "0")}`;
}

export default function AdminDashboard({
  services,
  today,
}: {
  services: Service[];
  today: string;
}) {
  const router = useRouter();

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(addDays(today, 30));
  const [status, setStatus] = useState<string>("ALL");
  const [q, setQ] = useState("");
  const [sortDesc, setSortDesc] = useState(false);

  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState<"table" | "calendar" | "blocks">("table");

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await adminListAppointments({
      from: from || undefined,
      to: to || undefined,
      status,
      q: q.trim() || undefined,
    });
    setLoading(false);
    if ("ok" in res && res.ok === false) {
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      setError(res.error || "Could not load sessions.");
      return;
    }
    setRows((res as { appointments: AppointmentRow[] }).appointments);
  }, [from, to, status, q, router]);

  // Refetch on filter changes (search is debounced).
  useEffect(() => {
    const t = setTimeout(fetchList, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchList, q]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const k = `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);
      return sortDesc ? -k : k;
    });
    return copy;
  }, [rows, sortDesc]);

  const stats = useMemo(() => {
    let requested = 0;
    let confirmed = 0;
    let revenue = 0;
    for (const r of rows) {
      if (r.status === "REQUESTED") requested++;
      if (r.status === "CONFIRMED") confirmed++;
      if (r.status === "REQUESTED" || r.status === "CONFIRMED" || r.status === "COMPLETED")
        revenue += r.priceCents;
    }
    return { total: rows.length, requested, confirmed, revenue };
  }, [rows]);

  async function changeStatus(id: string, next: AppointmentStatus) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    const res = await adminPatchAppointment(id, { status: next });
    if (!res.ok) fetchList(); // revert by reloading truth
  }

  async function remove(id: string) {
    if (!confirm("Delete this session? This can't be undone.")) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
    const res = await adminDeleteAppointment(id);
    if (!res.ok) fetchList();
  }

  async function signOut() {
    await adminLogout();
    router.replace("/admin/login");
    router.refresh();
  }

  function applyPreset(preset: "today" | "week" | "upcoming" | "all") {
    if (preset === "today") {
      setFrom(today);
      setTo(today);
    } else if (preset === "week") {
      setFrom(today);
      setTo(addDays(today, 7));
    } else if (preset === "upcoming") {
      setFrom(today);
      setTo(addDays(today, 365));
    } else {
      setFrom("2000-01-01");
      setTo(addDays(today, 365));
    }
    setStatus("ALL");
  }

  function exportCsv() {
    const headers = [
      "Date",
      "Time",
      "Session",
      "Duration (min)",
      "Client",
      "Phone",
      "Email",
      "Format",
      "Fee",
      "Status",
      "Source",
      "Notes",
    ];
    const lines = sorted.map((r) =>
      [
        r.date,
        r.startTime,
        r.serviceName,
        r.durationMinutes,
        r.clientName,
        r.clientPhone,
        r.clientEmail,
        r.sessionFormat === "TELEHEALTH" ? "Telehealth" : "In person",
        (r.priceCents / 100).toFixed(2),
        STATUS_LABELS[r.status as AppointmentStatus] ?? r.status,
        r.source,
        r.notes,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sessions_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const viewTitle =
    view === "blocks" ? "Blocked time" : view === "calendar" ? "Calendar" : "Appointment book";

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <h1 className="font-serif text-2xl leading-none">{viewTitle}</h1>
            <p className="mt-1 text-xs text-muted">
              {new Date(today + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border border-line p-0.5">
              {(
                [
                  ["table", "Appointments"],
                  ["calendar", "Calendar"],
                  ["blocks", "Blocked time"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    view === key ? "bg-accent text-white" : "text-muted hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {view !== "blocks" && (
              <>
                <button onClick={() => setAddOpen(true)} className="btn-accent !px-4 !py-2 text-sm">
                  + New session
                </button>
                <button onClick={exportCsv} className="btn-ghost !px-4 !py-2 text-sm">
                  Export CSV
                </button>
              </>
            )}
            <button onClick={signOut} className="btn-ghost !px-4 !py-2 text-sm">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-6">
        {view === "blocks" ? (
          <AdminBlocks today={today} />
        ) : view === "calendar" ? (
          <AdminCalendar today={today} />
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="In view" value={String(stats.total)} />
              <Stat
                label="Awaiting confirmation"
                value={String(stats.requested)}
                highlight={stats.requested > 0}
              />
              <Stat label="Confirmed" value={String(stats.confirmed)} />
              <Stat label="Booked value" value={formatPrice(stats.revenue) === "Free" ? "$0" : formatPrice(stats.revenue)} accent />
            </div>

            {/* Filters */}
            <div className="card mt-5 p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted">From</label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="field-input !py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">To</label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="field-input !py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="field-input !py-2"
                  >
                    <option value="ALL">All statuses</option>
                    {APPOINTMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-[180px] flex-1">
                  <label className="mb-1 block text-xs text-muted">Search</label>
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Name, phone, email, session…"
                    className="field-input !py-2"
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">Quick:</span>
                {(["today", "week", "upcoming", "all"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => applyPreset(p)}
                    className="rounded-full border border-line px-3 py-1 text-xs text-muted transition-colors hover:border-accent/40 hover:text-ink"
                  >
                    {p === "today"
                      ? "Today"
                      : p === "week"
                        ? "Next 7 days"
                        : p === "upcoming"
                          ? "All upcoming"
                          : "Everything"}
                  </button>
                ))}
                <button
                  onClick={() => setSortDesc((v) => !v)}
                  className="ml-auto rounded-full border border-line px-3 py-1 text-xs text-muted transition-colors hover:border-accent/40 hover:text-ink"
                >
                  Sort: {sortDesc ? "Latest first" : "Soonest first"}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="card mt-5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line bg-bg/60 text-left text-xs uppercase tracking-wider text-muted">
                      <Th>Date</Th>
                      <Th>Time</Th>
                      <Th>Session</Th>
                      <Th>Client</Th>
                      <Th>Contact</Th>
                      <Th className="text-right">Fee</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-16 text-center text-muted">
                          Loading…
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-16 text-center text-accent">
                          {error}
                        </td>
                      </tr>
                    ) : sorted.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-16 text-center text-muted">
                          No sessions match these filters.
                        </td>
                      </tr>
                    ) : (
                      sorted.map((r) => {
                        const isToday = r.date === today;
                        return (
                          <tr
                            key={r.id}
                            className="border-b border-line/70 last:border-0 hover:bg-bg/50"
                          >
                            <td className="whitespace-nowrap px-4 py-3">
                              <span className={isToday ? "font-semibold text-accent" : ""}>
                                {formatDateShort(r.date)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                              {formatTime12(r.startTime)}
                              <span className="ml-1 text-xs text-muted">
                                · {formatDuration(r.durationMinutes)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium">{r.serviceName}</div>
                              <div className="mt-0.5 text-xs text-muted">
                                {r.sessionFormat === "TELEHEALTH" ? "Telehealth" : "In person"}
                                {r.notes && (
                                  <span
                                    className="ml-1 inline-block max-w-[200px] truncate align-bottom"
                                    title={r.notes}
                                  >
                                    · {r.notes}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium">{r.clientName}</div>
                              {r.source === "admin" && (
                                <div className="text-xs text-muted">added by practice</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs leading-relaxed">
                              {r.clientPhone && <div>{r.clientPhone}</div>}
                              {r.clientEmail && (
                                <div className="text-muted">{r.clientEmail}</div>
                              )}
                              {!r.clientPhone && !r.clientEmail && (
                                <span className="text-muted/60">—</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                              {formatPrice(r.priceCents)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={r.status}
                                  onChange={(e) =>
                                    changeStatus(r.id, e.target.value as AppointmentStatus)
                                  }
                                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                                    STATUS_STYLES[r.status as AppointmentStatus] ?? ""
                                  }`}
                                >
                                  {APPOINTMENT_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                      {STATUS_LABELS[s]}
                                    </option>
                                  ))}
                                </select>
                                {r.status === "REQUESTED" && (
                                  <button
                                    onClick={() => changeStatus(r.id, "CONFIRMED")}
                                    className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-accent-deep"
                                    title="Confirm this session (emails the client)"
                                  >
                                    Confirm
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right">
                              <button
                                onClick={() => remove(r.id)}
                                className="text-xs text-muted hover:text-rose-600"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {addOpen && (
        <AddAppointmentModal
          services={services}
          today={today}
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            setAddOpen(false);
            fetchList();
          }}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
  highlight = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`card p-4 ${highlight ? "border-amber-300 bg-amber-50/50" : ""}`}>
      <div className="text-xs text-muted">{label}</div>
      <div
        className={`mt-1 text-2xl font-semibold tabular-nums ${
          accent ? "text-accent" : highlight ? "text-amber-700" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>;
}

function AddAppointmentModal({
  services,
  today,
  onClose,
  onCreated,
}: {
  services: Service[];
  today: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("10:00");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [format, setFormat] = useState("IN_PERSON");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim() || !serviceId || !date || !startTime) {
      setError("Session, date, time and name are required.");
      return;
    }
    setSaving(true);
    setError("");
    const res = await adminCreateAppointment({
      serviceId,
      date,
      startTime,
      clientName: name,
      clientPhone: phone,
      clientEmail: email,
      sessionFormat: format,
      notes,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error || "Could not save.");
      return;
    }
    onCreated();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">New session</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            ✕
          </button>
        </div>
        <p className="mt-1 text-sm text-muted">
          For phone bookings and existing clients. Practice-created sessions
          are confirmed immediately and skip the lead-time limit.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label">Session</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="field-input"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {formatDuration(s.durationMinutes)} · {formatPrice(s.priceCents)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Start time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="field-input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Client name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field-input"
              placeholder="Client name"
            />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Format</label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["IN_PERSON", "In person"],
                  ["TELEHEALTH", "Telehealth"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormat(value)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                    format === value
                      ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                      : "border-line hover:border-accent/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="field-input min-h-16 resize-y"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-accent/5 px-3 py-2 text-sm text-accent">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="btn-accent">
            {saving ? "Saving…" : "Add session"}
          </button>
        </div>
      </div>
    </div>
  );
}
