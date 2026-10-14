import { prisma } from "@/lib/db";
import { fail, handle, ok, readJson, str } from "@/lib/api";
import { toCenter } from "@/lib/serialize";
import type { CenterInput } from "@/lib/types";
import { centerColumns } from "@/lib/center-input";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const b = await readJson<CenterInput>(req);
  if (!b || !str(b.name)) return fail("Enter the center's name.");
  try {
    const c = await prisma.center.update({ where: { id }, data: centerColumns(b) });
    return ok(toCenter(c));
  } catch (e) {
    return handle(e);
  }
}
