"use client";

/**
 * The hero's aerial sunrise footage — a seamless crossfade loop served as
 * H.264 (Safari/iOS first) with a VP9 fallback, warmed into the dawn
 * palette and melted into the page toward its lower edge, so the headline
 * can rest on the misted water while the sun stays vivid above.
 *
 * iOS Safari needs special care to autoplay:
 *  - React sets the `muted` DOM property but does not emit the attribute
 *    into server-rendered HTML, and iOS's autoplay gate checks the
 *    attribute — so we set it (and defaultMuted) imperatively.
 *  - Play is attempted immediately, again on loadedmetadata, and once more
 *    on the first touch/click (Low Power Mode blocks autoplay until a
 *    gesture; the poster holds the frame until then).
 *  - prefers-reduced-motion pauses playback and rests on the poster.
 */
import { useEffect, useRef, useState } from "react";
import { ASSET_PREFIX } from "@/lib/mode";

export default function HeroVideo({ className = "" }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedRef = useRef(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // iOS autoplay gate checks attributes, not just properties.
    v.defaultMuted = true;
    v.muted = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tryPlay = () => {
      if (!reducedRef.current) v.play().catch(() => undefined);
    };
    const applyMotionPref = () => {
      reducedRef.current = mq.matches;
      setReduced(mq.matches);
      if (mq.matches) v.pause();
      else tryPlay();
    };

    applyMotionPref();
    mq.addEventListener("change", applyMotionPref);
    v.addEventListener("loadedmetadata", tryPlay);
    v.addEventListener("canplay", tryPlay);

    // Low Power Mode fallback: first gesture anywhere starts the loop.
    const onGesture = () => {
      tryPlay();
      window.removeEventListener("touchend", onGesture);
      window.removeEventListener("click", onGesture);
    };
    window.addEventListener("touchend", onGesture, { passive: true });
    window.addEventListener("click", onGesture);

    return () => {
      mq.removeEventListener("change", applyMotionPref);
      v.removeEventListener("loadedmetadata", tryPlay);
      v.removeEventListener("canplay", tryPlay);
      window.removeEventListener("touchend", onGesture);
      window.removeEventListener("click", onGesture);
    };
  }, []);

  return (
    <div className={className} aria-hidden>
      <video
        ref={videoRef}
        // The source is square; keep the window high in the frame so the
        // sun crowns the band with its sky intact.
        className="h-full w-full object-cover object-[50%_15%]"
        poster={`${ASSET_PREFIX}/hero-poster.jpg`}
        autoPlay={!reduced}
        muted
        loop
        playsInline
        preload="auto"
      >
        {/* H.264 first — iOS/Safari's native pick; VP9 for the rest. */}
        <source src={`${ASSET_PREFIX}/hero.mp4`} type="video/mp4" />
        <source src={`${ASSET_PREFIX}/hero.webm`} type="video/webm" />
      </video>
      {/* Warm the footage into the dawn palette… */}
      <div className="absolute inset-0 bg-dawn/30 mix-blend-soft-light" />
      {/* …and melt the footage downward into the page: the sun and sky stay
          vivid up top, while the misty lake softens into ivory beneath —
          which is exactly where the headline rests. */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[24%] via-bg/60 via-[55%] to-bg" />
    </div>
  );
}
