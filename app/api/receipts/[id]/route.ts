import { prisma } from "@/lib/db";
import { fail, handle, ok, readJson } from "@/lib/api";
import { cleanPayments, receiptColumns, validateReceipt } from "@/lib/receipt-input";
import { toReceipt } from "@/lib/serialize";
import type { ReceiptInput } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

/** Edit a receipt. Payments are kept as they are; they're managed via /payments. */
export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const d = await readJson<ReceiptInput>(req);
  const err = validateReceipt(d);
  if (err || !d) return fail(err || "Invalid request.");
  try {
    const [old, center] = await Promise.all([
      prisma.receipt.findUnique({ where: { id } }),
      prisma.center.findUnique({ where: { id: d.centerId } }),
    ]);
    if (!old) return fail("Receipt not found. It may have been deleted.", 404);
    if (!center) return fail("That coaching center no longer exists.", 404);
    const r = await prisma.receipt.update({ where: { id }, data: receiptColumns(d, center, cleanPayments(old.payments)) });
    return ok(toReceipt(r));
  } catch (e) {
    return handle(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    await prisma.receipt.delete({ where: { id } });
    return ok({ ok: true });
  } catch (e) {
    return handle(e);
  }
}
