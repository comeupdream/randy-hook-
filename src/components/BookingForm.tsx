"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createAppointment,
  fetchAvailability,
  fetchServices,
  type Service,
} from "@/lib/client/api";
import { formatDateLong, formatDuration, formatPrice, formatTime12 } from "@/lib/format";
import { PRACTICE, practiceTodayISO } from "@/lib/practice-config";
import { addDaysISO, weekdayOf } from "@/lib/time";

type Step = 1 | 2 | 3;

const STEP_LABELS = ["Session", "Date & time", "Your details"];

/** The next `n` open dates, starting today, as ISO strings. */
function nextOpenDates(n: number): string[] {
  const out: string[] = [];
  let cursor = practiceTodayISO();
  let guard = 0;
  while (out.length < n && guard < 90) {
    if (PRACTICE.hours[weekdayOf(cursor)]) out.push(cursor);
    cursor = addDaysISO(cursor, 1);
    guard++;
  }
  return out;
}

export default function BookingForm() {
  const searchParams = useSearchParams();
  const requestedServiceId = searchParams.get("service") ?? "";

  const [services, setServices] = useState<Service[] | null>(null);
  const [loadError, setLoadError] = useState("");

  const [step, setStep] = useState<Step>(1);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    format: "IN_PERSON",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmed, setConfirmed] = useState<null | {
    service: string;
    date: string;
    time: string;
    name: string;
  }>(null);

  // Booking window — computed client-side so the static demo stays truthful.
  const [win, setWin] = useState<null | { minDate: string; maxDate: string; quickDates: string[] }>(
    null,
  );

  useEffect(() => {
    const minDate = practiceTodayISO();
    setWin({
      minDate,
      maxDate: addDaysISO(minDate, PRACTICE.bookingHorizonDays),
      quickDates: nextOpenDates(5),
    });
    fetchServices().then((res) => {
      if ("ok" in res && res.ok === false) {
        setLoadError(res.error);
        return;
      }
      const list = (res as { services: Service[] }).services;
      setServices(list);
      // Deep-link: /book?service=<id> skips straight to the calendar.
      if (requestedServiceId && list.some((s) => s.id === requestedServiceId)) {
        setServiceId(requestedServiceId);
        setStep(2);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const service = useMemo(
    () => services?.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );

  const grouped = useMemo(() => {
    const m = new Map<string, Service[]>();
    for (const s of services ?? []) {
      if (!m.has(s.category)) m.set(s.category, []);
      m.get(s.category)!.push(s);
    }
    return Array.from(m.entries());
  }, [services]);

  // Fetch availability whenever the service or date changes.
  const reqId = useRef(0);
  useEffect(() => {
    if (!serviceId || !date) {
      setSlots([]);
      return;
    }
    const id = ++reqId.current;
    setLoadingSlots(true);
    setSlotError("");
    setTime("");
    fetchAvailability(date, serviceId).then((res) => {
      if (id !== reqId.current) return; // stale response
      setLoadingSlots(false);
      if (res.ok) setSlots(res.slots);
      else {
        setSlots([]);
        setSlotError(res.error || "Could not load times.");
      }
    });
  }, [serviceId, date]);

  function pickService(id: string) {
    setServiceId(id);
    setDate("");
    setTime("");
    setStep(2);
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  async function submit() {
    if (!service || !date || !time || !form.name.trim() || !emailOk) return;
    setSubmitting(true);
    setSubmitError("");
    const res = await createAppointment({
      serviceId: service.id,
      date,
      startTime: time,
      clientName: form.name,
      clientPhone: form.phone,
      clientEmail: form.email,
      sessionFormat: form.format,
      notes: form.notes,
    });
    setSubmitting(false);
    if (!res.ok) {
      setSubmitError(res.error || "Something went wrong. Please try again.");
      // If the slot was just taken, refresh availability and step back.
      if (res.status === 409) {
        setTime("");
        const r = await fetchAvailability(date, service.id);
        setSlots(r.ok ? r.slots : []);
        setStep(2);
      }
      return;
    }
    setConfirmed({
      service: service.name,
      date,
      time,
      name: form.name.trim(),
    });
  }

  // -------------------------------------------------------------- Loading
  if (loadError) {
    return (
      <div className="card p-10 text-center text-sm text-muted">{loadError}</div>
    );
  }
  if (!services || !win) {
    return (
      <div className="card space-y-3 p-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-line/60" />
        ))}
      </div>
    );
  }

  // ----------------------------------------------------------- Confirmation
  if (confirmed) {
    return (
      <div className="card p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="mt-6 font-serif text-3xl">Your request is in</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">
          Thank you, {confirmed.name.split(" ")[0]} — this time is being held
          for you. Randy personally confirms every session, so you&apos;ll hear
          back shortly{form.email ? " by email" : ""}.
        </p>
        <div className="mx-auto mt-8 max-w-sm space-y-3 rounded-xl2 border border-line bg-bg/60 p-6 text-left text-sm">
          <Row label="Session" value={confirmed.service} />
          <Row label="Date" value={formatDateLong(confirmed.date)} />
          <Row label="Time" value={formatTime12(confirmed.time)} />
          <Row
            label="Format"
            value={form.format === "TELEHEALTH" ? "Telehealth" : "In person"}
          />
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-ghost">
            Back to home
          </Link>
          <button
            className="btn-accent"
            onClick={() => {
              setConfirmed(null);
              setServiceId("");
              setDate("");
              setTime("");
              setForm({ name: "", phone: "", email: "", format: "IN_PERSON", notes: "" });
              setStep(1);
            }}
          >
            Request another
          </button>
        </div>
      </div>
    );
  }

  const canContinueDate = Boolean(date && time);
  const canSubmit = Boolean(date && time && form.name.trim() && emailOk) && !submitting;

  return (
    <div className="card overflow-hidden">
      {/* Stepper */}
      <ol className="grid grid-cols-3 border-b border-line text-sm">
        {STEP_LABELS.map((label, i) => {
          const n = (i + 1) as Step;
          const active = step === n;
          const done = step > n;
          return (
            <li
              key={label}
              className={`flex items-center justify-center gap-2 px-2 py-4 text-center ${
                active ? "bg-accent/5" : ""
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                  active
                    ? "bg-accent text-white"
                    : done
                      ? "bg-accent/15 text-accent"
                      : "bg-line text-muted"
                }`}
              >
                {done ? "✓" : n}
              </span>
              <span className={active ? "font-medium text-ink" : "text-muted"}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="p-6 sm:p-8">
        {/* ----------------------------------------------------- Step 1: Session */}
        {step === 1 && (
          <div className="space-y-8">
            {grouped.map(([category, items]) => (
              <div key={category}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent">
                  {category}
                </h3>
                <div className="grid gap-3">
                  {items.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => pickService(s.id)}
                      className="group flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 text-left transition-all hover:border-accent/50 hover:shadow-sm"
                    >
                      <div className="min-w-0">
                        <div className="font-medium">{s.name}</div>
                        <div className="mt-0.5 text-sm text-muted">{s.description}</div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        <span className="font-medium tabular-nums">
                          {formatPrice(s.priceCents)}
                        </span>
                        <span className="text-xs text-muted">
                          {formatDuration(s.durationMinutes)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ------------------------------------------------ Step 2: Date & time */}
        {step === 2 && service && (
          <div className="space-y-6">
            <SelectedServiceBar service={service} onChange={() => setStep(1)} />

            <div>
              <label className="field-label" htmlFor="date">
                Choose a date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                min={win.minDate}
                max={win.maxDate}
                onChange={(e) => setDate(e.target.value)}
                className="field-input max-w-xs"
              />
              {win.quickDates.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {win.quickDates.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDate(d)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        date === d
                          ? "border-accent bg-accent text-white"
                          : "border-line text-muted hover:border-accent/40 hover:text-ink"
                      }`}
                    >
                      {new Date(d + "T00:00:00").toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {date && (
              <div>
                <div className="field-label">Available times</div>
                {loadingSlots ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-10 animate-pulse rounded-lg bg-line/60" />
                    ))}
                  </div>
                ) : slotError ? (
                  <p className="rounded-lg bg-accent/5 px-4 py-3 text-sm text-accent">
                    {slotError}
                  </p>
                ) : slots.length === 0 ? (
                  <p className="rounded-lg border border-line bg-bg/50 px-4 py-3 text-sm text-muted">
                    No openings for this date. Try another day above.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((s) => (
                      <button
                        key={s}
                        onClick={() => setTime(s)}
                        className={`rounded-lg border px-2 py-2.5 text-sm tabular-nums transition-all ${
                          time === s
                            ? "border-accent bg-accent text-white shadow-sm"
                            : "border-line hover:border-accent/50 hover:bg-accent/5"
                        }`}
                      >
                        {formatTime12(s)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStep(1)} className="btn-ghost">
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canContinueDate}
                className="btn-accent"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------- Step 3: Details */}
        {step === 3 && service && (
          <div className="space-y-6">
            <div className="rounded-xl2 border border-line bg-bg/50 p-5">
              <div className="text-sm text-muted">You&apos;re requesting</div>
              <div className="mt-1 font-serif text-xl">{service.name}</div>
              <div className="mt-1 text-sm text-muted">
                {formatDateLong(date)} at {formatTime12(time)} ·{" "}
                {formatDuration(service.durationMinutes)} ·{" "}
                {formatPrice(service.priceCents)}
              </div>
              <button
                onClick={() => setStep(2)}
                className="mt-2 text-xs font-medium text-accent hover:underline"
              >
                Change date or time
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="name">
                  Full name <span className="text-accent">*</span>
                </label>
                <input
                  id="name"
                  className="field-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="email">
                  Email <span className="text-accent">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className="field-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@email.com"
                  autoComplete="email"
                  required
                  aria-invalid={form.email.length > 0 && !emailOk}
                />
                {form.email.length > 0 && !emailOk && (
                  <p className="mt-1 text-xs text-accent">Enter a valid email address.</p>
                )}
                <p className="mt-1 text-xs text-muted">
                  Your confirmation and reminder arrive here.
                </p>
              </div>
              <div>
                <label className="field-label" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  className="field-input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>
              <div className="sm:col-span-2">
                <div className="field-label">Session format</div>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["IN_PERSON", "In person", "273 Newman Ave, Harrisonburg"],
                      ["TELEHEALTH", "Telehealth", "Secure video, anywhere in Virginia"],
                    ] as const
                  ).map(([value, label, hint]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm({ ...form, format: value })}
                      className={`rounded-xl border p-3.5 text-left transition-all ${
                        form.format === value
                          ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                          : "border-line hover:border-accent/40"
                      }`}
                    >
                      <div className="text-sm font-medium">{label}</div>
                      <div className="mt-0.5 text-xs text-muted">{hint}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="notes">
                  Anything you&apos;d like Randy to know? (optional)
                </label>
                <textarea
                  id="notes"
                  className="field-input min-h-20 resize-y"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Whatever feels comfortable to share — a sentence is plenty."
                />
                <p className="mt-1 text-xs text-muted">
                  Please keep this brief and avoid sensitive details — there
                  will be plenty of room to talk when you meet.
                </p>
              </div>
            </div>

            {submitError && (
              <p className="rounded-lg bg-accent/5 px-4 py-3 text-sm text-accent">
                {submitError}
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStep(2)} className="btn-ghost">
                ← Back
              </button>
              <button onClick={submit} disabled={!canSubmit} className="btn-accent">
                {submitting ? "Sending…" : "Request session"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function SelectedServiceBar({
  service,
  onChange,
}: {
  service: Service;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl2 border border-line bg-bg/50 p-4">
      <div>
        <div className="font-medium">{service.name}</div>
        <div className="text-sm text-muted">
          {formatDuration(service.durationMinutes)} · {formatPrice(service.priceCents)}
        </div>
      </div>
      <button onClick={onChange} className="text-xs font-medium text-accent hover:underline">
        Change
      </button>
    </div>
  );
}
