import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import BookingForm from "@/components/BookingForm";
import DemoBadge from "@/components/DemoBadge";
import SiteFooter from "@/components/SiteFooter";
import { PRACTICE } from "@/lib/practice-config";

export const metadata: Metadata = {
  title: "Book a session",
};

/**
 * Static shell — the form loads its data through the client api layer, which
 * talks to the API routes in production and the in-browser store in the demo.
 */
export default function BookPage() {
  return (
    <div className="flex min-h-screen flex-col dawn-wash">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
        <div className="container-page flex h-20 items-center justify-between">
          <Link href="/" className="flex flex-col leading-none">
            <span className="font-serif text-xl tracking-tight">{PRACTICE.name}</span>
            <span className="mt-0.5 text-[11px] uppercase tracking-[0.28em] text-muted">
              Book online
            </span>
          </Link>
          <Link href="/" className="text-sm text-muted hover:text-accent">
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="container-page w-full max-w-3xl flex-1 py-12 sm:py-16">
        <div className="mb-8 text-center">
          <p className="flourish text-2xl">let&apos;s begin…</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl">Book a session</h1>
          <p className="mt-3 text-muted">
            Choose a session, pick a time that works, and you&apos;re set.
            Randy personally confirms every request.
          </p>
        </div>

        <Suspense fallback={null}>
          <BookingForm />
        </Suspense>

        <p className="mx-auto mt-8 max-w-xl text-center text-xs leading-relaxed text-muted">
          This form is not monitored for emergencies. If you are in crisis,
          please call or text <span className="font-semibold">988</span>{" "}
          (Suicide &amp; Crisis Lifeline) or dial 911 — support is available
          24/7.
        </p>
      </main>

      <SiteFooter />
      <DemoBadge />
    </div>
  );
}
