"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  adminCreateBlock,
  adminDeleteBlock,
  adminListBlocks,
  type BlockRow,
} from "@/lib/client/api";
import { formatDateShort, formatDuration, formatTime12 } from "@/lib/format";

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate(),
  ).padStart(2, "0")}`;
}

const DURATIONS = [30, 60, 90, 120, 180, 240, 480];

/**
 * "Blocked time" — hold personal windows (lunch, supervision, PTO,
 * paperwork) so the booking engine can't offer them to clients.
 */
export function AdminBlocks({ today }: { today: string }) {
  const router = useRouter();
  const [rows, setRows] = useState<BlockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("12:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await adminListBlocks({ from: today, to: addDays(today, 365) });
    setLoading(false);
    if ("ok" in res && res.ok === false) {
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      setError(res.error || "Could not load blocked time.");
      return;
    }
    setRows((res as { blocks: BlockRow[] }).blocks);
  }, [today, router]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  async function addBlock() {
    if (!date || !startTime || !durationMinutes) {
      setFormError("Date, start time and length are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    const res = await adminCreateBlock({ date, startTime, durationMinutes, reason });
    setSaving(false);
    if (!res.ok) {
      setFormError(res.error || "Could not save.");
      return;
    }
    setReason("");
    fetchList();
  }

  async function remove(id: string) {
    setRows((prev) => prev.filter((b) => b.id !== id));
    const res = await adminDeleteBlock(id);
    if (!res.ok) fetchList();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      {/* Add a block */}
      <div className="card h-fit p-6">
        <h2 className="font-serif text-xl">Block time</h2>
        <p className="mt-1 text-sm text-muted">
          Hold a window for yourself — clients won&apos;t be offered any time
          that overlaps it.
        </p>
        <div className="mt-5 space-y-4">
          <div>
            <label className="field-label">Date</label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="field-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Length</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="field-input"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {formatDuration(d)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="field-label">Reason (just for you)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="field-input"
              placeholder="Lunch, supervision, paperwork…"
            />
          </div>
          {formError && (
            <p className="rounded-lg bg-accent/5 px-3 py-2 text-sm text-accent">
              {formError}
            </p>
          )}
          <button onClick={addBlock} disabled={saving} className="btn-accent w-full">
            {saving ? "Saving…" : "Block this time"}
          </button>
        </div>
      </div>

      {/* Upcoming blocks */}
      <div className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-serif text-xl">Upcoming blocked time</h2>
        </div>
        {loading ? (
          <div className="px-5 py-16 text-center text-sm text-muted">Loading…</div>
        ) : error ? (
          <div className="px-5 py-16 text-center text-sm text-accent">{error}</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-muted">
            Nothing blocked yet. Time you block here disappears from the public
            booking calendar instantly.
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="flex items-center gap-4">
                  <span className="w-24 shrink-0 text-sm font-medium">
                    {formatDateShort(b.date)}
                  </span>
                  <span className="text-sm tabular-nums">
                    {formatTime12(b.startTime)}
                    <span className="ml-1 text-xs text-muted">
                      · {formatDuration(b.durationMinutes)}
                    </span>
                  </span>
                  {b.reason && <span className="text-sm text-muted">{b.reason}</span>}
                </div>
                <button
                  onClick={() => remove(b.id)}
                  className="text-xs text-muted hover:text-rose-600"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
