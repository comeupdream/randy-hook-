/**
 * Two build modes, one codebase:
 *
 *  - Default: a full Node web service (API routes + Postgres via Prisma).
 *    This is the production booking system.
 *
 *  - DEMO_STATIC=1: a fully static export (`out/`) for the client demo —
 *    deployable to GitHub Pages or any static host. `scripts/build-demo.mjs`
 *    sets this, temporarily sets the API routes aside, and flips the client
 *    into in-browser demo mode (NEXT_PUBLIC_DEMO_MODE=1) where bookings live
 *    in localStorage.
 */
const isStaticDemo = process.env.DEMO_STATIC === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isStaticDemo
    ? {
        output: "export",
        images: { unoptimized: true },
        // e.g. "/randy-hook-" when served from GitHub Pages project site.
        basePath: process.env.DEMO_BASE_PATH || "",
        trailingSlash: true,
      }
    : {}),
};

module.exports = nextConfig;
