/**
 * Central practice configuration.
 *
 * Everything the public site & booking engine need to know about the practice
 * lives here so it's easy to tweak without hunting through the code.
 */

export type DayHours = { open: string; close: string } | null;

export const PRACTICE = {
  name: "Randy Hook, LCSW",
  shortName: "Randy",
  credential: "Licensed Clinical Social Worker",
  tagline: "Hope. Healing. Possibility.",
  description:
    "Compassionate counseling for adults and couples in Harrisonburg and the Shenandoah Valley — in person or by telehealth.",
  phone: "(540) 746-2626",
  email: "randy@randyhooklcsw.com",
  address: "273 Newman Ave.",
  cityLine: "Harrisonburg, VA 22801",
  region: "Serving Harrisonburg & the Shenandoah Valley",

  /** IANA timezone the practice operates in. Drives "today" / past-slot logic. */
  timezone: "America/New_York",

  /** Spacing between offered start times, in minutes (sessions start on the hour). */
  slotIntervalMinutes: 60,

  /** How far ahead clients may book, in days. */
  bookingHorizonDays: 45,

  /** Minimum lead time before a session can start today, in minutes. */
  minLeadMinutes: 240,

  /**
   * Office hours per weekday in practice-local time (24h "HH:MM").
   * Index: 0 = Sunday … 6 = Saturday. `null` means closed that day.
   */
  hours: {
    0: null, // Sunday — closed
    1: { open: "09:00", close: "17:00" }, // Monday
    2: { open: "09:00", close: "19:00" }, // Tuesday
    3: { open: "09:00", close: "19:00" }, // Wednesday
    4: { open: "09:00", close: "19:00" }, // Thursday
    5: { open: "09:00", close: "14:00" }, // Friday
    6: null, // Saturday — closed
  } as Record<number, DayHours>,
} as const;

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** Human-readable hours list for display on the site. */
export function hoursForDisplay(): { day: string; hours: string }[] {
  return WEEKDAY_LABELS.map((day, i) => {
    const h = PRACTICE.hours[i];
    return {
      day,
      hours: h ? `${to12h(h.open)} – ${to12h(h.close)}` : "Closed",
    };
  });
}

function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, "0")}${ampm}`;
}

/** Current date in the practice timezone as "YYYY-MM-DD". */
export function practiceTodayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PRACTICE.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Current time in the practice timezone as "HH:MM" (24h). */
export function practiceNowHM(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: PRACTICE.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}
