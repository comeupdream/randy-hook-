import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/admin/blocks/:id — release a blocked window. */
export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    await prisma.blockedTime.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Block not found." }, { status: 404 });
  }
}
