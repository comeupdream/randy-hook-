/**
 * Demo-mode flag, inlined at build time.
 *
 * When NEXT_PUBLIC_DEMO_MODE === "1" the site runs entirely in the browser:
 * the data client (src/lib/client/api.ts) talks to a localStorage-backed
 * store instead of the API routes, so a static export behaves like the real
 * booking system. The production web service simply builds without the flag.
 */
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

/** Demo admin password, shown as a hint on the demo sign-in screen. */
export const DEMO_ADMIN_PASSWORD = "demo";
