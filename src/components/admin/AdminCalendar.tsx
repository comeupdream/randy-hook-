"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  APPOINTMENT_STATUSES,
  STATUS_LABELS,
  type AppointmentStatus,
} from "@/lib/appointment-status";
import {
  adminDeleteAppointment,
  adminListAppointments,
  adminListBlocks,
  adminPatchAppointment,
  type AppointmentRow,
  type BlockRow,
} from "@/lib/client/api";
import { formatTime12 } from "@/lib/format";

const CHIP: Record<AppointmentStatus, string> = {
  REQUESTED: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-sky-50 text-sky-700",
  CANCELLED: "bg-rose-50 text-rose-500 line-through",
  NO_SHOW: "bg-stone-100 text-stone-600",
};

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function AdminCalendar({ today }: { today: string }) {
  const router = useRouter();
  const ty = Number(today.slice(0, 4));
  const tm = Number(today.slice(5, 7)) - 1;

  const [cursor, setCursor] = useState({ y: ty, m: tm });
  const [appts, setAppts] = useState<AppointmentRow[]>([]);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayOpen, setDayOpen] = useState<string | null>(null);

  // 6-week (42 cell) grid covering the month + adjacent spill days.
  const cells = useMemo(() => {
    const leading = new Date(cursor.y, cursor.m, 1).getDay();
    return Array.from(
      { length: 42 },
      (_, i) => new Date(cursor.y, cursor.m, 1 - leading + i),
    );
  }, [cursor]);

  const gridFrom = isoOf(cells[0]);
  const gridTo = isoOf(cells[41]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      adminListAppointments({ from: gridFrom, to: gridTo }),
      adminListBlocks({ from: gridFrom, to: gridTo }),
    ]).then(([a, b]) => {
      if (cancelled) return;
      setLoading(false);
      if ("ok" in a && a.ok === false) {
        if (a.status === 401) router.replace("/admin/login");
        return;
      }
      setAppts((a as { appointments: AppointmentRow[] }).appointments);
      if (!("ok" in b && b.ok === false)) {
        setBlocks((b as { blocks: BlockRow[] }).blocks);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [gridFrom, gridTo, router]);

  const apptsByDate = useMemo(() => {
    const m = new Map<string, AppointmentRow[]>();
    for (const a of appts) {
      if (!m.has(a.date)) m.set(a.date, []);
      m.get(a.date)!.push(a);
    }
    for (const list of m.values())
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return m;
  }, [appts]);

  const blocksByDate = useMemo(() => {
    const m = new Map<string, BlockRow[]>();
    for (const b of blocks) {
      if (!m.has(b.date)) m.set(b.date, []);
      m.get(b.date)!.push(b);
    }
    return m;
  }, [blocks]);

  async function changeStatus(id: string, status: AppointmentStatus) {
    setAppts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    await adminPatchAppointment(id, { status });
  }

  async function remove(id: string) {
    if (!confirm("Delete this session? This can't be undone.")) return;
    setAppts((prev) => prev.filter((a) => a.id !== id));
    await adminDeleteAppointment(id);
  }

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  const dayList = dayOpen ? (apptsByDate.get(dayOpen) ?? []) : [];
  const dayBlocks = dayOpen ? (blocksByDate.get(dayOpen) ?? []) : [];

  return (
    <div className="card mt-5 overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="font-serif text-xl">
          {MONTHS[cursor.m]} {cursor.y}
          {loading && <span className="ml-2 font-sans text-xs text-muted">loading…</span>}
        </h2>
        <div className="flex items-center gap-1">
          <button onClick={() => shiftMonth(-1)} className="rounded-full border border-line px-3 py-1 text-sm hover:border-accent/40">←</button>
          <button onClick={() => setCursor({ y: ty, m: tm })} className="rounded-full border border-line px-3 py-1 text-sm hover:border-accent/40">Today</button>
          <button onClick={() => shiftMonth(1)} className="rounded-full border border-line px-3 py-1 text-sm hover:border-accent/40">→</button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-line bg-bg/60 text-xs uppercase tracking-wider text-muted">
        {WD.map((w) => (
          <div key={w} className="px-2 py-2 text-center">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const iso = isoOf(d);
          const inMonth = d.getMonth() === cursor.m;
          const isToday = iso === today;
          const list = apptsByDate.get(iso) ?? [];
          const dayBlockList = blocksByDate.get(iso) ?? [];
          const shown = list.slice(0, 3);
          const extra = list.length - shown.length;
          return (
            <button
              key={i}
              onClick={() => setDayOpen(iso)}
              className={`min-h-[106px] border-b border-r border-line p-1.5 text-left align-top transition-colors hover:bg-accent/5 ${inMonth ? "" : "bg-bg/40"}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday ? "bg-accent text-white" : inMonth ? "text-ink" : "text-muted/50"
                  }`}
                >
                  {d.getDate()}
                </span>
                {list.length > 0 && <span className="text-[10px] text-muted">{list.length}</span>}
              </div>
              <div className="space-y-0.5">
                {dayBlockList.slice(0, 1).map((b) => (
                  <div
                    key={b.id}
                    className="truncate rounded bg-stone-200/70 px-1 py-0.5 text-[11px] leading-tight text-stone-600"
                  >
                    ⛔ {formatTime12(b.startTime)} {b.reason || "Blocked"}
                  </div>
                ))}
                {shown.map((a) => (
                  <div
                    key={a.id}
                    className={`truncate rounded px-1 py-0.5 text-[11px] leading-tight ${CHIP[a.status as AppointmentStatus] ?? ""}`}
                  >
                    {formatTime12(a.startTime)} {a.clientName}
                  </div>
                ))}
                {extra > 0 && (
                  <div className="px-1 text-[10px] text-muted">+{extra} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {dayOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={() => setDayOpen(null)}
        >
          <div
            className="card max-h-[80vh] w-full max-w-lg overflow-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl">
                {new Date(dayOpen + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <button onClick={() => setDayOpen(null)} className="text-muted hover:text-ink">✕</button>
            </div>

            {dayBlocks.length > 0 && (
              <div className="mt-4 space-y-2">
                {dayBlocks.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-xl bg-stone-100 px-3 py-2 text-sm text-stone-600"
                  >
                    <span>
                      ⛔ {formatTime12(b.startTime)} · {b.durationMinutes} min ·{" "}
                      {b.reason || "Blocked"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {dayList.length === 0 && dayBlocks.length === 0 ? (
              <p className="mt-6 text-center text-sm text-muted">Nothing scheduled this day.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {dayList.map((a) => (
                  <div key={a.id} className="rounded-xl border border-line p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium tabular-nums">
                          {formatTime12(a.startTime)}{" "}
                          <span className="font-normal text-ink">· {a.serviceName}</span>
                        </div>
                        <div className="text-sm">
                          {a.clientName}
                          {a.clientPhone && <span className="text-muted"> · {a.clientPhone}</span>}
                        </div>
                        <div className="mt-0.5 text-xs text-muted">
                          {a.sessionFormat === "TELEHEALTH" ? "Telehealth" : "In person"}
                          {a.notes && <> · {a.notes}</>}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <select
                          value={a.status}
                          onChange={(e) => changeStatus(a.id, e.target.value as AppointmentStatus)}
                          className="rounded border border-line px-2 py-1 text-xs"
                        >
                          {APPOINTMENT_STATUSES.map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                        <button onClick={() => remove(a.id)} className="text-xs text-muted hover:text-rose-600">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
