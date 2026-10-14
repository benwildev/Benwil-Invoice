import { prisma } from "@/lib/db";
import { fail, handle, ok, readJson, str } from "@/lib/api";
import { toCenter } from "@/lib/serialize";
import type { CenterInput } from "@/lib/types";
import { centerColumns } from "@/lib/center-input";

export async function POST(req: Request) {
  const b = await readJson<CenterInput>(req);
  if (!b || !str(b.name)) return fail("Enter the center's name.");
  try {
    const c = await prisma.center.create({ data: centerColumns(b) });
    return ok(toCenter(c), 201);
  } catch (e) {
    return handle(e);
  }
}
