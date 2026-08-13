import Link from "next/link";
import { PRACTICE, hoursForDisplay } from "@/lib/practice-config";

export default function SiteFooter() {
  const hours = hoursForDisplay();
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="font-serif text-2xl">{PRACTICE.name}</div>
          <p className="flourish mt-1 text-lg">
            hope · healing · <span className="text-sun">possibility</span>
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            {PRACTICE.description}
          </p>
          <Link href="/book" className="btn-accent mt-6 !px-5 !py-2.5">
            Book a session
          </Link>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide">Visit</h3>
          <address className="mt-3 space-y-1 text-sm not-italic leading-relaxed text-muted">
            <div>{PRACTICE.address}</div>
            <div>{PRACTICE.cityLine}</div>
            <div className="pt-2">
              <a
                className="hover:text-accent"
                href={`tel:${PRACTICE.phone.replace(/[^\d+]/g, "")}`}
              >
                {PRACTICE.phone}
              </a>
            </div>
            <div>
              <a className="hover:text-accent" href={`mailto:${PRACTICE.email}`}>
                {PRACTICE.email}
              </a>
            </div>
          </address>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide">Office hours</h3>
          <ul className="mt-3 space-y-1 text-sm text-muted">
            {hours.map((h) => (
              <li key={h.day} className="flex justify-between gap-4">
                <span>{h.day.slice(0, 3)}</span>
                <span className={h.hours === "Closed" ? "text-muted/60" : ""}>
                  {h.hours}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line bg-bg/60">
        <div className="container-page py-4 text-center text-xs leading-relaxed text-muted">
          If you are in crisis or thinking about harming yourself, please don&apos;t
          wait for an appointment — call or text{" "}
          <a href="tel:988" className="font-semibold text-accent hover:underline">
            988
          </a>{" "}
          (Suicide &amp; Crisis Lifeline) or dial 911. Support is available 24/7.
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <span>
            © {new Date().getFullYear()} {PRACTICE.name}. All rights reserved.
          </span>
          <div className="flex items-center gap-4">
            <Link href="/book" className="hover:text-accent">
              Book online
            </Link>
            <Link href="/admin" className="hover:text-accent">
              Practice sign-in
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
