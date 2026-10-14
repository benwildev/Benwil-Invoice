import { prisma } from "@/lib/db";
import { fail, handle, ok, readJson } from "@/lib/api";
import { cleanPayments, totalsFor } from "@/lib/receipt-input";
import { toReceipt } from "@/lib/serialize";

type Ctx = { params: Promise<{ id: string }> };

/** Replace a receipt's payment list and recompute paid / due / status. */
export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const b = await readJson<{ payments?: unknown }>(req);
  if (!b || !Array.isArray(b.payments)) return fail("Invalid request.");
  try {
    const old = await prisma.receipt.findUnique({ where: { id } });
    if (!old) return fail("Receipt not found. It may have been deleted.", 404);
    const r = await prisma.receipt.update({ where: { id }, data: totalsFor(old, cleanPayments(b.payments)) });
    return ok(toReceipt(r));
  } catch (e) {
    return handle(e);
  }
}
