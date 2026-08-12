import { PRACTICE, practiceNowHM, practiceTodayISO } from "./practice-config";
import { minutesToTime, timeToMinutes, weekdayOf } from "./time";

/** A booked/blocked window that occupies the calendar on a given day. */
export type BusyBlock = { startTime: string; durationMinutes: number };

/**
 * Compute bookable start times for a date + session duration.
 *
 * Rules:
 *  - Must fall within that weekday's office hours.
 *  - The whole session (start + duration) must finish before closing.
 *  - Must not overlap an existing busy block (sessions or blocked time).
 *  - For "today", must respect the minimum lead time.
 *
 * Returns "HH:MM" start times, ascending. Pure — safe on server and client,
 * which is what lets the static demo share the real engine.
 */
export function computeAvailableSlots(
  dateISO: string,
  durationMinutes: number,
  busy: BusyBlock[],
): string[] {
  const hours = PRACTICE.hours[weekdayOf(dateISO)];
  if (!hours) return []; // closed that day

  const openMin = timeToMinutes(hours.open);
  const closeMin = timeToMinutes(hours.close);
  const step = PRACTICE.slotIntervalMinutes;

  // Earliest allowed start if the date is today.
  let earliest = openMin;
  if (dateISO === practiceTodayISO()) {
    const nowMin = timeToMinutes(practiceNowHM()) + PRACTICE.minLeadMinutes;
    earliest = Math.max(earliest, Math.ceil(nowMin / step) * step);
  }

  const busyRanges = busy.map((b) => {
    const s = timeToMinutes(b.startTime);
    return [s, s + b.durationMinutes] as const;
  });

  const slots: string[] = [];
  for (let start = openMin; start + durationMinutes <= closeMin; start += step) {
    if (start < earliest) continue;
    const end = start + durationMinutes;
    const overlaps = busyRanges.some(([bs, be]) => start < be && bs < end);
    if (!overlaps) slots.push(minutesToTime(start));
  }
  return slots;
}

/** Does a proposed booking overlap any existing busy block? */
export function hasConflict(
  startTime: string,
  durationMinutes: number,
  busy: BusyBlock[],
): boolean {
  const start = timeToMinutes(startTime);
  const end = start + durationMinutes;
  return busy.some((b) => {
    const bs = timeToMinutes(b.startTime);
    const be = bs + b.durationMinutes;
    return start < be && bs < end;
  });
}

/** Is the proposed start within office hours and fully before close? */
export function isWithinHours(
  dateISO: string,
  startTime: string,
  durationMinutes: number,
): boolean {
  const hours = PRACTICE.hours[weekdayOf(dateISO)];
  if (!hours) return false;
  const start = timeToMinutes(startTime);
  const end = start + durationMinutes;
  return start >= timeToMinutes(hours.open) && end <= timeToMinutes(hours.close);
}
