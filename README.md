# Randy Hook, LCSW — randyhooklcsw.com rebuild

*Hope · Healing · Possibility*

A complete rebuild of [randyhooklcsw.com](https://www.randyhooklcsw.com) with a
real booking system and a practice admin backend — designed to ship **twice
from one codebase**:

1. **Static demo first** — a fully static export (GitHub Pages-ready) where
   the entire booking flow and admin run in the browser against simulated
   data, so the site can be reviewed end-to-end before any server exists.
2. **Web service later** — the same code deployed as a Next.js server with
   Postgres, real emails, and a cron-driven reminder pipeline.

Scaffolded from the booking architecture proven in
[`auto-revival`](https://github.com/comeupdream/auto-revival) and
[`Main-Street-Salon`](https://github.com/comeupdream/Main-Street-Salon).

---

## What's inside

**Public site** (`/`)
- Procedurally generated Blue Ridge hero (seeded midpoint-displacement SVG —
  no image assets) under Randy's welcome message, set in Fraunces at display
  optical size
- Hope / Healing / Possibility pillars, about & credentials, ten specialty
  areas, sessions & rates, office hours, crisis-line footer
- Signature "procedural lift" motion: scroll-staggered reveals plus
  pointer-tracked tilt/sheen on cards (`src/components/fx/Lift.tsx`), fully
  disabled under `prefers-reduced-motion`

**Booking** (`/book`)
- Three steps: session → date & time → details (in-person / telehealth)
- Live availability from office hours, existing sessions, blocked time, lead
  time, and booking horizon — conflicts re-checked server-side at submit
- Online requests arrive as **Requested** and hold their slot; Randy confirms
  each one personally (that transition emails the client)

**Practice admin** (`/admin`, password-protected)
- Appointment book: filters, search, status flow (Requested → Confirmed →
  Completed / Cancelled / No-show), one-click **Confirm**, CSV export
- Month calendar with day drill-in
- **Blocked time**: hold lunch/supervision/PTO windows — they vanish from
  public availability instantly
- Add sessions by hand (phone bookings skip the lead-time limit)

**Email** (optional, via Resend)
- Request received / confirmed / cancelled / 24h reminder — warm, branded,
  table-layout HTML + plain text. Sending is a safe no-op until
  `RESEND_API_KEY` is set; a provider hiccup can never break a booking.

---

## Quick start (local)

```bash
npm install

# Full system against Postgres:
cp .env.example .env          # fill in DATABASE_URL etc.
npm run db:push && npm run db:seed
npm run dev                   # http://localhost:3000

# Or: instant demo mode, no database at all:
npm run dev:demo
```

Admin: `http://localhost:3000/admin` — password is `ADMIN_PASSWORD`
(defaults to `hook-admin` in dev; the demo uses `demo`).

## Static demo build

```bash
npm run build:demo            # → out/
npx serve out                 # preview locally
```

`scripts/build-demo.mjs` sets the API routes aside, exports the site with
`NEXT_PUBLIC_DEMO_MODE=1`, and restores everything after. In demo mode the
client data layer (`src/lib/client/api.ts`) swaps the API for an in-browser
store (`src/lib/demo/store.ts`) that runs the **same** pure availability and
booking rules — book a session in the demo and it appears in the demo admin,
double-booking prevention included. State persists in `localStorage`; a
ribbon marks the preview as simulated.

**GitHub Pages**: `.github/workflows/demo-pages.yml` builds and deploys the
demo. One-time setup: repo *Settings → Pages → Source: GitHub Actions*. It
runs on pushes to `main`, or trigger it manually from any branch with *Run
workflow*.

## Production deploy (web service)

**Render (one click):** the repo ships a `render.yaml` Blueprint — *New →
Blueprint* in the Render dashboard creates the web service + free Postgres,
wires `DATABASE_URL`, generates `SESSION_SECRET`/`CRON_SECRET`, and prompts
for `ADMIN_PASSWORD`. Works the same on any Node host (Railway, Fly, a VPS)
with `npm run build` / `npm run start` and the env vars below.

| Env var | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Postgres connection string |
| `ADMIN_PASSWORD` | ✅ | Sign-in for `/admin` |
| `SESSION_SECRET` | ✅ | Signs the admin session cookie |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Absolute links in emails/metadata |
| `RESEND_API_KEY` | – | Turns on real email delivery |
| `EMAIL_FROM` | – | Verified sender, e.g. `Randy Hook, LCSW <hello@…>` |
| `OWNER_EMAIL` | – | Where new-request alerts go |
| `CRON_SECRET` | – | Protects `/api/cron/reminders` |

**Reminders:** point any scheduler (cron-job.org, GitHub Actions, UptimeRobot)
at `GET /api/cron/reminders?secret=<CRON_SECRET>` roughly hourly. De-duped via
`reminderSentAt`, and only **confirmed** sessions are reminded.

## Architecture notes

```
src/lib/
  practice-config.ts   ← name, contact, hours, timezone, lead time, horizon
  catalog.ts           ← session menu + specialties (seed ▸ demo ▸ site share it)
  availability.ts      ← pure slot engine (server & demo run the same math)
  booking-rules.ts     ← pure window/conflict validation, shared the same way
  booking.ts           ← server createBooking (Prisma + emails)
  client/api.ts        ← the one data layer components call; demo/live switch
  demo/store.ts        ← localStorage "server" for the static demo
```

- Times are stored as practice-local strings (`"YYYY-MM-DD"`, `"HH:MM"`) —
  no timezone drift between server and office.
- Pages are static shells; data always flows through the client layer. That's
  what makes the static export honest and keeps the production pages fresh
  without build-time database access.
- To re-skin, edit the CSS variables in `src/app/globals.css`; to change
  hours/fees, edit `practice-config.ts` / `catalog.ts` (then re-seed).

### Roadmap to full service
- Online payments / deposits (Stripe) at booking
- SMS reminders alongside email
- Client self-service reschedule/cancel links
- Google Calendar two-way sync
- Intake forms after confirmation

Fonts: Fraunces & Source Sans 3, vendored under the SIL OFL — see
`src/fonts/README.md`.
