/**
 * Pure booking validation shared by the server booking flow and the static
 * demo's in-browser store — one set of rules, two runtimes.
 */
import { type BusyBlock, hasConflict, isWithinHours } from "./availability";
import { PRACTICE, practiceTodayISO } from "./practice-config";
import { addDaysISO, isValidDateISO, isValidTime } from "./time";

export type BookingWindowInput = {
  date: string;
  startTime: string;
  durationMinutes: number;
  /** Admin bookings may bypass the lead-time / horizon limits. */
  bypassWindowChecks?: boolean;
};

export type RuleResult = { ok: true } | { ok: false; error: string; code: number };

/** Validate date/time shape, booking window, office hours, and conflicts. */
export function checkBookingWindow(
  input: BookingWindowInput,
  busy: BusyBlock[],
): RuleResult {
  if (!isValidDateISO(input.date)) return { ok: false, error: "Invalid date.", code: 400 };
  if (!isValidTime(input.startTime)) return { ok: false, error: "Invalid time.", code: 400 };

  if (!input.bypassWindowChecks) {
    const today = practiceTodayISO();
    if (input.date < today) return { ok: false, error: "That date is in the past.", code: 400 };
    const horizon = addDaysISO(today, PRACTICE.bookingHorizonDays);
    if (input.date > horizon)
      return {
        ok: false,
        error: `Sessions can be scheduled up to ${PRACTICE.bookingHorizonDays} days out.`,
        code: 400,
      };
  }

  if (!isWithinHours(input.date, input.startTime, input.durationMinutes))
    return { ok: false, error: "The office is closed at that time.", code: 409 };

  if (hasConflict(input.startTime, input.durationMinutes, busy))
    return {
      ok: false,
      error: "Sorry — that time was just taken. Please pick another.",
      code: 409,
    };

  return { ok: true };
}
