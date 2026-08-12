import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/admin/me — is the current session signed in? (UI gate only.) */
export async function GET() {
  return NextResponse.json({ authed: await isAdminAuthed() });
}
