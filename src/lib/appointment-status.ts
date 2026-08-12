/** Allowed session statuses (stored as text — validated here). */
export const APPOINTMENT_STATUSES = [
  "REQUESTED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/**
 * Statuses that occupy a slot on the calendar (block double-booking).
 * A REQUESTED session holds its slot while Randy confirms it.
 */
export const BLOCKING_STATUSES: AppointmentStatus[] = [
  "REQUESTED",
  "CONFIRMED",
  "COMPLETED",
];

export function isAppointmentStatus(v: unknown): v is AppointmentStatus {
  return typeof v === "string" && (APPOINTMENT_STATUSES as readonly string[]).includes(v);
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  REQUESTED: "Requested",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
};

/** Session formats. */
export const SESSION_FORMATS = ["IN_PERSON", "TELEHEALTH"] as const;
export type SessionFormat = (typeof SESSION_FORMATS)[number];

export function isSessionFormat(v: unknown): v is SessionFormat {
  return typeof v === "string" && (SESSION_FORMATS as readonly string[]).includes(v);
}

export const FORMAT_LABELS: Record<SessionFormat, string> = {
  IN_PERSON: "In person",
  TELEHEALTH: "Telehealth",
};
