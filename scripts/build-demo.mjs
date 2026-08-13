#!/usr/bin/env node
/**
 * Build the fully static demo (`out/`).
 *
 * Next's `output: "export"` can't include dynamic API routes, and the demo
 * doesn't need them — the client runs against the in-browser store instead.
 * So this script:
 *
 *   1. temporarily sets src/app/api aside,
 *   2. runs `next build` with DEMO_STATIC=1 (static export config) and
 *      NEXT_PUBLIC_DEMO_MODE=1 (client demo store),
 *   3. drops a .nojekyll marker for GitHub Pages,
 *   4. always restores the API routes, success or failure.
 *
 * Options via env:
 *   DEMO_BASE_PATH  – e.g. "/randy-hook-" when hosting at
 *                     https://<user>.github.io/randy-hook-/ (defaults to "")
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = join(root, "src", "app", "api");
const holdDir = join(root, ".demo-hold");
const heldApi = join(holdDir, "api");

if (!existsSync(apiDir)) {
  console.error("src/app/api not found — is the repo checkout complete?");
  process.exit(1);
}
if (existsSync(heldApi)) {
  console.error(".demo-hold/api already exists — a previous demo build was interrupted.");
  console.error("Restore it first:  mv .demo-hold/api src/app/api && rmdir .demo-hold");
  process.exit(1);
}

mkdirSync(holdDir, { recursive: true });
renameSync(apiDir, heldApi);
console.log("→ API routes set aside for the static export");

let failed = false;
try {
  // A stale server-mode build cache confuses the export; start clean.
  rmSync(join(root, ".next"), { recursive: true, force: true });

  execSync("npx next build", {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      DEMO_STATIC: "1",
      NEXT_PUBLIC_DEMO_MODE: "1",
      DEMO_BASE_PATH: process.env.DEMO_BASE_PATH || "",
      // Raw asset URLs (hero video/poster) need the base path explicitly.
      NEXT_PUBLIC_BASE_PATH: process.env.DEMO_BASE_PATH || "",
    },
  });

  // GitHub Pages must not run the output through Jekyll (it drops _next/).
  writeFileSync(join(root, "out", ".nojekyll"), "");
  console.log("→ static demo written to out/ (with .nojekyll)");
} catch {
  failed = true;
} finally {
  renameSync(heldApi, apiDir);
  rmSync(holdDir, { recursive: true, force: true });
  console.log("→ API routes restored");
}

if (failed) {
  console.error("Static demo build failed.");
  process.exit(1);
}
