import { IS_DEMO } from "@/lib/mode";

/**
 * A quiet ribbon shown only in the static demo build, so nobody mistakes the
 * preview for a live booking system.
 */
export default function DemoBadge() {
  if (!IS_DEMO) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-surface/95 px-4 py-2 text-xs text-muted shadow-lg backdrop-blur">
        <span className="inline-block h-2 w-2 rounded-full bg-gold" />
        Demo preview — bookings are simulated in your browser, nothing is sent.
      </div>
    </div>
  );
}
