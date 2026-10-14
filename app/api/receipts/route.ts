import { prisma } from "@/lib/db";
import { fail, handle, ok, readJson } from "@/lib/api";
import { num, r2 } from "@/lib/billing";
import { receiptColumns, validateReceipt } from "@/lib/receipt-input";
import { toReceipt } from "@/lib/serialize";
import type { ReceiptInput } from "@/lib/types";

export async function POST(req: Request) {
  const d = await readJson<ReceiptInput>(req);
  const err = validateReceipt(d);
  if (err || !d) return fail(err || "Invalid request.");
  try {
    const center = await prisma.center.findUnique({ where: { id: d.centerId } });
    if (!center) return fail("That coaching center no longer exists.", 404);
    const adv = r2(num(d.advance));
    const payments = adv > 0 ? [{ amount: adv, date: d.date, method: d.method || "Cash", txnId: (d.txnId || "").trim() }] : [];
    const r = await prisma.receipt.create({ data: receiptColumns(d, center, payments) });
    return ok(toReceipt(r), 201);
  } catch (e) {
    return handle(e);
  }
}
