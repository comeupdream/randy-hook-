/**
 * The practice's session menu — the single source of truth shared by:
 *  - prisma/seed.ts (seeds the live database),
 *  - the static demo's in-browser store,
 *  - the public "Sessions & rates" section.
 *
 * `id` is a stable slug so re-seeding is idempotent. Fees are placeholders —
 * edit freely; the booking engine reads whatever is here / in the DB.
 */

export type CatalogService = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  category: string;
};

export const SERVICE_CATALOG: CatalogService[] = [
  {
    id: "consultation",
    name: "Free Phone Consultation",
    description:
      "A brief, no-pressure call to talk about what's bringing you in and whether we'd be a good fit.",
    durationMinutes: 15,
    priceCents: 0,
    category: "Getting Started",
  },
  {
    id: "individual",
    name: "Individual Therapy",
    description:
      "One-on-one support for anxiety, depression, grief, trauma, life transitions, and more.",
    durationMinutes: 50,
    priceCents: 13000,
    category: "Individual",
  },
  {
    id: "couples",
    name: "Couples Counseling",
    description:
      "Emotionally Focused Therapy to help you reconnect, communicate, and repair together.",
    durationMinutes: 50,
    priceCents: 15000,
    category: "Couples & Relationships",
  },
  {
    id: "couples-extended",
    name: "Extended Couples Session",
    description:
      "A longer session for couples working through deeper patterns — room to slow down and go further.",
    durationMinutes: 80,
    priceCents: 21000,
    category: "Couples & Relationships",
  },
  {
    id: "premarital",
    name: "Premarital Counseling (PREP)",
    description:
      "Build a strong foundation with the Prevention & Relationship Enhancement Program, taught by a certified PREP instructor.",
    durationMinutes: 60,
    priceCents: 15000,
    category: "Couples & Relationships",
  },
];

/** Specialty areas shown on the public site. */
export const SPECIALTIES: { title: string; blurb: string }[] = [
  { title: "Anxiety", blurb: "Quiet the constant hum of worry and find steadier ground." },
  { title: "Depression", blurb: "Gentle, practical support for the seasons when everything feels heavy." },
  { title: "Couples Counseling", blurb: "Rebuild trust, closeness, and the conversations that matter." },
  { title: "Marital & Premarital", blurb: "Strengthen the foundation — before and throughout marriage." },
  { title: "Trauma & PTSD", blurb: "Process what happened at your pace, with care and safety." },
  { title: "Grief & Loss", blurb: "Room to carry what you've lost, and to keep living alongside it." },
  { title: "College Mental Health", blurb: "Support through the pressures and transitions of student life." },
  { title: "LGBTQIA+ & Gender Identity", blurb: "An affirming space to be fully, freely yourself." },
  { title: "Men's Issues", blurb: "A place where it's safe to set the armor down." },
  { title: "Postpartum Depression", blurb: "Compassionate care for the hardest, most tender season." },
];
