import type { Center as DbCenter } from "@/generated/prisma/client";
import { calc, num, r2 } from "./billing";
import type { Payment, ReceiptInput } from "./types";
import { str } from "./api";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Validate a receipt form and return an error message, or null when it's fine. */
export function validateReceipt(d: ReceiptInput | null): string | null {
  if (!d) return "Invalid request.";
  if (!str(d.centerId)) return "Choose a coaching center.";
  if (!str(d.no)) return "Give the receipt a number.";
  if (!ISO.test(str(d.date))) return "Enter the receipt date.";
  if (d.periodStart && !ISO.test(d.periodStart)) return "Period start is not a valid date.";
  if (d.periodEnd && !ISO.test(d.periodEnd)) return "Period end is not a valid date.";
  if (d.periodStart && d.periodEnd && d.periodEnd < d.periodStart) return "Period end is before period start.";
  if (!cleanItems(d.items).length) return "Add at least one item.";
  return null;
}

export function cleanItems(items: ReceiptInput["items"] | undefined) {
  return (Array.isArray(items) ? items : [])
    .filter((i) => str(i?.desc) || num(i?.price))
    .map((i) => ({ desc: str(i.desc), qty: num(i.qty) || 1, price: r2(num(i.price)), period: !!i.period }));
}

export function cleanPayments(list: unknown): Payment[] {
  return (Array.isArray(list) ? list : [])
    .map((p) => ({ amount: r2(num(p?.amount)), date: str(p?.date), method: str(p?.method) || "Cash", txnId: str(p?.txnId) }))
    .filter((p) => p.amount > 0 && ISO.test(p.date));
}

/** Build the columns Prisma stores for a receipt, with totals computed on the server. */
export function receiptColumns(d: ReceiptInput, center: DbCenter, payments: Payment[]) {
  const items = cleanItems(d.items);
  const discount = r2(num(d.discount));
  const vatRate = num(d.vatRate);
  const c = calc({ items, discount, vatRate, payments });
  return {
    no: str(d.no),
    centerId: center.id,
    centerSnap: { name: center.name, owner: center.owner, address: center.address, phone: center.phone },
    date: str(d.date),
    periodStart: str(d.periodStart),
    periodEnd: str(d.periodEnd),
    items,
    discount,
    vatRate,
    method: str(d.method) || "Cash",
    txnId: str(d.txnId),
    notes: str(d.notes),
    payments,
    total: c.total,
    paid: c.paid,
    due: c.due,
    status: c.status,
  };
}

export function totalsFor(r: { items: unknown; discount: unknown; vatRate: unknown }, payments: Payment[]) {
  const c = calc({ items: r.items as ReceiptInput["items"], discount: r.discount, vatRate: r.vatRate, payments });
  return { payments, total: c.total, paid: c.paid, due: c.due, status: c.status };
}
