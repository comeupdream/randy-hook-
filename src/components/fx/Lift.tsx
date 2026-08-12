"use client";

/**
 * Procedural motion primitives — the site's signature effect.
 *
 *  <Reveal delay={ms}>  — rises into place when scrolled into view
 *                         (IntersectionObserver → .is-shown; stagger with
 *                         `delay`, usually index * 70–90ms).
 *
 *  <LiftCard>           — a card that tilts toward the pointer, rises on
 *                         hover, and carries a pointer-tracked sheen. All
 *                         geometry is computed from the pointer position at
 *                         runtime; CSS in globals.css does the drawing.
 *
 * Both respect prefers-reduced-motion (handled in CSS; the JS below is
 * passive either way).
 */
import {
  useEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent,
} from "react";

type RevealProps = HTMLAttributes<HTMLDivElement> & {
  /** Stagger, in ms — typically index * 80. */
  delay?: number;
};

export function Reveal({ delay = 0, className = "", style, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-shown");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("is-shown");
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
}

const MAX_TILT_X = 3.2; // deg — gentle; this is a therapy practice, not a game
const MAX_TILT_Y = 4.2;

type LiftCardProps = HTMLAttributes<HTMLDivElement>;

export function LiftCard({ className = "", children, ...rest }: LiftCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0..1
    const y = (e.clientY - rect.top) / rect.height; // 0..1
    el.style.setProperty("--px", `${(x * 100).toFixed(2)}%`);
    el.style.setProperty("--py", `${(y * 100).toFixed(2)}%`);
    el.style.setProperty("--tx", `${((0.5 - y) * MAX_TILT_X).toFixed(2)}deg`);
    el.style.setProperty("--ty", `${((x - 0.5) * MAX_TILT_Y).toFixed(2)}deg`);
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tx", "0deg");
    el.style.setProperty("--ty", "0deg");
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`lift ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
