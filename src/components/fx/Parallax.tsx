"use client";

/**
 * Pointer parallax for the hero scene: tracks the pointer across the
 * viewport, eases toward it each frame, and publishes the normalized
 * position as --par-x / --par-y (−1…1) on the wrapper. The `.rs-px-*`
 * groups inside RidgeScene consume those variables at different depths,
 * so the mountains shift like a camera move.
 *
 * No-ops entirely under prefers-reduced-motion and on touch-only devices
 * (no pointermove means the vars simply stay at 0).
 */
import { useEffect, useRef, type ReactNode } from "react";

export default function Parallax({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = 0;

    const tick = () => {
      currentX += (targetX - currentX) * 0.055;
      currentY += (targetY - currentY) * 0.055;
      el.style.setProperty("--par-x", currentX.toFixed(4));
      el.style.setProperty("--par-y", currentY.toFixed(4));
      const settled =
        Math.abs(targetX - currentX) < 0.001 && Math.abs(targetY - currentY) < 0.001;
      raf = settled ? 0 : requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
