import Link from "next/link";
import DemoBadge from "@/components/DemoBadge";
import GutterWords from "@/components/GutterWords";
import HeroVideo from "@/components/HeroVideo";
import RidgeScene from "@/components/RidgeScene";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { LiftCard, Reveal } from "@/components/fx/Lift";
import { SERVICE_CATALOG, SPECIALTIES } from "@/lib/catalog";
import { formatDuration, formatPrice } from "@/lib/format";
import { PRACTICE, hoursForDisplay } from "@/lib/practice-config";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader transparent />
      <main className="flex-1">
        <Hero />
        <Pillars />
        <Welcome />
        <About />
        <Specialties />
        <Sessions />
        <HowItWorks />
        <Visit />
        <ClosingCta />
      </main>
      <SiteFooter />
      <DemoBadge />
    </div>
  );
}

/* ------------------------------------------------------------------ Hero */

function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-bg via-dawn/40 to-dawn/70">
      <div className="container-page relative z-10 flex flex-1 flex-col items-center justify-center pb-[48vh] pt-24 text-center sm:pb-[46vh]">
        <p className="eyebrow animate-fade-up">
          Randy Hook · Licensed Clinical Social Worker
        </p>
        <h1
          className="display mt-6 max-w-4xl text-balance text-4xl leading-[1.12] sm:text-5xl md:text-6xl animate-fade-up"
          style={{ animationDelay: "120ms" }}
        >
          I believe in the power of <em className="text-accent">hope</em>…
          <br />
          I believe in <em className="text-accent">healing</em>…
          <br />
          and I believe deeply in the power of{" "}
          <em className="text-sun">possibility</em>.
        </h1>
        <p
          className="mt-6 max-w-xl text-balance text-base leading-relaxed text-ink/70 sm:text-lg animate-fade-up"
          style={{ animationDelay: "240ms" }}
        >
          Counseling for adults and couples — in person in Harrisonburg or by
          telehealth across Virginia.
        </p>
        <div
          className="mt-9 flex flex-wrap items-center justify-center gap-3 animate-fade-up"
          style={{ animationDelay: "360ms" }}
        >
          <Link href="/book" className="btn-accent">
            Begin — book a session
          </Link>
          <Link href="/book?service=consultation" className="btn-ghost">
            Free 15-minute consultation
          </Link>
        </div>
      </div>

      {/* Aerial sunrise footage, looped seamlessly and blended into the
          dawn palette (falls back to a still under reduced motion). On
          large screens the video pulls in from the edges — a tighter frame
          means less upscaling of the square source, so it plays sharper —
          and the gutters carry a slow drift of giving words. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[76vh]">
        <GutterWords
          side="left"
          className="absolute left-0 top-0 hidden h-full w-36 lg:block"
        />
        <GutterWords
          side="right"
          className="absolute right-0 top-0 hidden h-full w-36 lg:block"
        />
        <HeroVideo className="absolute inset-x-0 bottom-0 h-full overflow-hidden lg:inset-x-36 lg:rounded-t-[2rem]" />
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Pillars */

const PILLARS: { title: string; blurb: React.ReactNode; sun?: boolean; icon: React.ReactNode }[] = [
  {
    title: "Hope",
    blurb:
      "The quiet conviction that things can be different — even when life has dealt you a hand that is hard to play.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="13" r="4" />
        <path d="M12 3v2M4.9 6.9l1.4 1.4M2 13h2M20 13h2M17.7 8.3l1.4-1.4M3 20h18" />
      </svg>
    ),
  },
  {
    title: "Healing",
    blurb:
      "Not erasing what happened, but tending to it — gently, at your pace, until it no longer decides your days.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21V9" />
        <path d="M12 9c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6z" />
        <path d="M12 13c0-2.8-2-4.8-4.8-4.8 0 2.8 2 4.8 4.8 4.8z" />
      </svg>
    ),
  },
  {
    title: "Possibility",
    sun: true,
    blurb: (
      <>
        Regardless of where you have been or what you have been through —{" "}
        <span className="text-sun">possibility</span> is still within reach.
      </>
    ),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 21V5a2 2 0 0 1 2-2h7l7 7v11" />
        <path d="M13 3v7h7" />
        <path d="M8 14h5M8 17h8" />
      </svg>
    ),
  },
];

function Pillars() {
  return (
    <section className="border-b border-line bg-surface">
      <div className="container-page grid gap-5 py-16 sm:grid-cols-3 sm:py-20">
        {PILLARS.map((p, i) => (
          <Reveal key={p.title} delay={i * 90}>
            <LiftCard className="card h-full p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent [&_svg]:h-6 [&_svg]:w-6">
                {p.icon}
              </div>
              <h2 className={`mt-5 font-serif text-2xl${p.sun ? " text-sun" : ""}`}>
                {p.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.blurb}</p>
            </LiftCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Welcome */

function Welcome() {
  return (
    <section id="welcome" className="dawn-wash">
      <div className="container-page max-w-3xl py-20 sm:py-28">
        <Reveal className="text-center">
          <p className="eyebrow">A welcome from Randy</p>
        </Reveal>
        <Reveal delay={90}>
          <div className="relative mt-10">
            <span
              aria-hidden
              className="display pointer-events-none absolute -left-2 -top-10 select-none text-8xl text-accent/15 sm:-left-10"
            >
              &ldquo;
            </span>
            <div className="space-y-6 font-serif text-lg leading-[1.85] text-ink/90 sm:text-xl">
              <p>
                So many of us, perhaps you, have encountered situations and
                circumstances that have challenged your ability to believe in
                any of these virtues. For whatever reason life has dealt you a
                hand that is hard to play. All of us, and I mean all of us, go
                through times of transition, turmoil and thus…{" "}
                <span className="text-sun">possibility</span>.
              </p>
              <p>
                I want to help you realize your full potential to discover and
                develop your true self with the understanding that hope,
                healing and <span className="text-sun">possibility</span> are
                the essence of navigating through anything that life may throw
                at us. Regardless of where you have been or what you have been
                through I want you to know that{" "}
                <span className="text-sun">possibility</span> is still within
                reach.
              </p>
              <p>I welcome the opportunity to walk with you on your path.</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={180} className="mt-10 text-center">
          <p className="flourish text-3xl">Let&apos;s begin…</p>
          <Link href="/book" className="btn-accent mt-6">
            Book a session
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- About */

const CREDENTIALS = [
  {
    title: "Training & approach",
    items: [
      "Dialectical Behavioral Therapy (DBT)",
      "Emotionally Focused Therapy (EFT)",
      "Certified PREP instructor — Prevention & Relationship Enhancement Program",
    ],
  },
  {
    title: "Education",
    items: [
      "B.S. — Eastern Mennonite University",
      "M.S.W. — Tulane University School of Social Work",
    ],
  },
  {
    title: "Experience",
    items: [
      "Director of Counseling Services — Bridgewater College",
      "Rockingham Memorial Hospital",
      "Center for Marriage and Family Counseling",
    ],
  },
];

function About() {
  return (
    <section id="about" className="border-t border-line bg-surface">
      <div className="container-page grid gap-12 py-20 sm:py-28 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow">About Randy</p>
          <h2 className="display mt-4 text-4xl sm:text-5xl">
            A steady companion for the hard seasons
          </h2>
          <div className="mt-6 space-y-4 leading-relaxed text-ink/80">
            <p>
              Randy Hook is a Licensed Clinical Social Worker offering
              compassionate counseling to adults and couples across
              Harrisonburg and the Shenandoah Valley. His practice is built on
              a simple conviction: that with the right support, people can
              navigate anything life throws at them.
            </p>
            <p>
              Before opening his private practice, Randy directed counseling
              services at Bridgewater College and served clients at Rockingham
              Memorial Hospital and the Center for Marriage and Family
              Counseling — years of walking alongside students, couples, and
              families through transition, loss, and growth.
            </p>
            <p>
              Sessions are available in person or by telehealth, and every new
              relationship starts the same way — with a free, no-pressure
              conversation.
            </p>
          </div>
          <Link href="/book?service=consultation" className="btn-ghost mt-8">
            Start with a free consultation
          </Link>
        </Reveal>

        <div className="grid content-start gap-5">
          {CREDENTIALS.map((c, i) => (
            <Reveal key={c.title} delay={i * 90}>
              <LiftCard className="card p-6">
                <h3 className="font-serif text-xl">{c.title}</h3>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
                  {c.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </LiftCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ Specialties */

function Specialties() {
  return (
    <section id="specialties" className="border-t border-line">
      <div className="container-page py-20 sm:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Specialties</p>
          <h2 className="display mt-4 text-4xl sm:text-5xl">
            Whatever you&apos;re carrying, you don&apos;t have to carry it alone
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {SPECIALTIES.map((s, i) => (
            <Reveal key={s.title} delay={(i % 5) * 70}>
              <LiftCard className="card h-full p-5">
                <h3 className="font-serif text-lg leading-snug">{s.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  {s.blurb}
                </p>
              </LiftCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Sessions */

function Sessions() {
  return (
    <section id="sessions" className="border-t border-line bg-surface">
      <div className="container-page py-20 sm:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Sessions &amp; rates</p>
          <h2 className="display mt-4 text-4xl sm:text-5xl">
            Simple, transparent ways to work together
          </h2>
          <p className="mt-4 text-muted">
            Every session can be in person at the Harrisonburg office or by
            secure telehealth — whichever serves you best.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_CATALOG.map((s, i) => (
            <Reveal key={s.id} delay={(i % 3) * 90} className={i === 0 ? "sm:col-span-2 lg:col-span-1" : ""}>
              <LiftCard className="card flex h-full flex-col p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-accent/80">
                  {s.category}
                </div>
                <h3 className="mt-2 font-serif text-2xl">{s.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {s.description}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  <span className="text-sm text-muted">
                    {formatDuration(s.durationMinutes)}
                  </span>
                  <span className="font-serif text-xl">
                    {formatPrice(s.priceCents)}
                  </span>
                </div>
                <Link
                  href={`/book?service=${s.id}`}
                  className="btn-ghost mt-4 w-full !py-2.5 text-sm"
                >
                  Book this session
                </Link>
              </LiftCard>
            </Reveal>
          ))}
        </div>

        <Reveal delay={180}>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-muted">
            Questions about insurance or fees? Reach out — we&apos;ll talk it
            through together, and a superbill can be provided for
            out-of-network reimbursement.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- How it works */

const STEPS = [
  {
    n: "01",
    title: "Reach out",
    blurb:
      "Book a free 15-minute phone consultation — a low-pressure way to share what's going on and see if we're a good fit.",
  },
  {
    n: "02",
    title: "Find your time",
    blurb:
      "Choose a session online in about a minute. Randy personally confirms every request, so you're never booking into a void.",
  },
  {
    n: "03",
    title: "Begin",
    blurb:
      "Meet in person in Harrisonburg or by secure telehealth from anywhere in Virginia. One step at a time, together.",
  },
];

function HowItWorks() {
  return (
    <section className="border-t border-line dawn-wash">
      <div className="container-page py-20 sm:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Getting started</p>
          <h2 className="display mt-4 text-4xl sm:text-5xl">
            Three gentle steps
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 90}>
              <LiftCard className="card h-full p-7">
                <div className="display text-5xl text-accent/25">{s.n}</div>
                <h3 className="mt-4 font-serif text-2xl">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.blurb}</p>
              </LiftCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- Visit */

function Visit() {
  const hours = hoursForDisplay();
  return (
    <section id="visit" className="border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-20 sm:py-28 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <p className="eyebrow">Visit the office</p>
          <h2 className="display mt-4 text-4xl sm:text-5xl">
            A quiet corner of Harrisonburg
          </h2>
          <div className="mt-6 space-y-2 leading-relaxed text-ink/80">
            <p className="font-medium text-ink">
              {PRACTICE.address}, {PRACTICE.cityLine}
            </p>
            <p>
              <a
                className="text-accent hover:underline"
                href={`tel:${PRACTICE.phone.replace(/[^\d+]/g, "")}`}
              >
                {PRACTICE.phone}
              </a>{" "}
              ·{" "}
              <a className="text-accent hover:underline" href={`mailto:${PRACTICE.email}`}>
                {PRACTICE.email}
              </a>
            </p>
            <p className="text-muted">{PRACTICE.region}.</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <LiftCard className="card p-5">
              <h3 className="font-serif text-lg">Telehealth</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Secure video sessions available to clients anywhere in
                Virginia — same care, from wherever you're most comfortable.
              </p>
            </LiftCard>
            <LiftCard className="card p-5">
              <h3 className="font-serif text-lg">First visit?</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Come as you are. There's parking nearby, a comfortable place
                to land, and no expectations beyond showing up.
              </p>
            </LiftCard>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <LiftCard className="card p-7">
            <h3 className="font-serif text-2xl">Office hours</h3>
            <ul className="mt-5 divide-y divide-line text-sm">
              {hours.map((h) => (
                <li key={h.day} className="flex items-center justify-between py-2.5">
                  <span className="text-ink/80">{h.day}</span>
                  <span
                    className={
                      h.hours === "Closed"
                        ? "text-muted/60"
                        : "font-medium tabular-nums text-ink"
                    }
                  >
                    {h.hours}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-muted">
              Evening times fill quickly — booking online shows you every open
              slot in real time.
            </p>
            <Link href="/book" className="btn-accent mt-5 w-full">
              See open times
            </Link>
          </LiftCard>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ Closing CTA */

function ClosingCta() {
  return (
    <section className="relative overflow-hidden border-t border-line bg-gradient-to-b from-bg to-dawn/60">
      <div className="container-page relative z-10 py-24 text-center sm:py-32">
        <Reveal>
          <h2 className="display mx-auto max-w-3xl text-balance text-4xl leading-tight sm:text-6xl">
            <em className="text-sun">Possibility</em> is still within reach.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-muted">
            Whenever you&apos;re ready, the first step is a small one — and you
            won&apos;t be taking it alone.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/book" className="btn-accent">
              Let&apos;s begin
            </Link>
            <a
              href={`tel:${PRACTICE.phone.replace(/[^\d+]/g, "")}`}
              className="btn-ghost"
            >
              Or call {PRACTICE.phone}
            </a>
          </div>
        </Reveal>
      </div>
      <RidgeScene className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full opacity-[0.22]" />
    </section>
  );
}
