"use client";

/**
 * The hero's aerial Blue Ridge footage — compressed to a ~0.5MB seamless
 * crossfade loop (scripts in the repo history; source uploaded by the
 * practice). Muted, inline, autoplaying background video with:
 *
 *  - an ivory gradient that melts the footage into the page,
 *  - a soft dawn tint so the sky sits inside the site's warm palette,
 *  - a poster frame while loading,
 *  - and a reduced-motion path that holds the poster still.
 */
import { useEffect, useRef, useState } from "react";
import { ASSET_PREFIX } from "@/lib/mode";

export default function HeroVideo({ className = "" }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setReduced(mq.matches);
      const v = videoRef.current;
      if (!v) return;
      if (mq.matches) v.pause();
      else v.play().catch(() => undefined);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div className={className} aria-hidden>
      <video
        ref={videoRef}
        // The source is square; bias the crop upward so the rising sun and
        // its reflection stay in frame inside the wide hero band.
        className="h-full w-full object-cover object-[50%_25%]"
        poster={`${ASSET_PREFIX}/hero-poster.jpg`}
        autoPlay={!reduced}
        muted
        loop
        playsInline
        preload="metadata"
      >
        {/* VP9 for Chrome/Firefox/Edge, H.264 for Safari/iOS. */}
        <source src={`${ASSET_PREFIX}/hero.webm`} type="video/webm" />
        <source src={`${ASSET_PREFIX}/hero.mp4`} type="video/mp4" />
      </video>
      {/* Warm the footage into the dawn palette… */}
      <div className="absolute inset-0 bg-dawn/30 mix-blend-soft-light" />
      {/* …and melt its sky into the page above. */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/20 to-transparent" />
    </div>
  );
}
