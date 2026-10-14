import type { Center as DbCenter, Receipt as DbReceipt, Setting as DbSetting } from "@/generated/prisma/client";
import { DEFAULTS } from "./billing";
import type { Center, CenterSnap, Item, Payment, Receipt, Settings, Status } from "./types";

const n = (v: unknown) => Number(v ?? 0);

export const toCenter = (c: DbCenter): Center => ({
  id: c.id,
  name: c.name,
  owner: c.owner,
  phone: c.phone,
  address: c.address,
  fee: n(c.fee),
  notes: c.notes,
});

export const toReceipt = (r: DbReceipt): Receipt => ({
  id: r.id,
  no: r.no,
  centerId: r.centerId,
  center: (r.centerSnap as unknown as CenterSnap) ?? { name: "", owner: "", address: "", phone: "" },
  date: r.date,
  periodStart: r.periodStart,
  periodEnd: r.periodEnd,
  items: (r.items as unknown as Item[]) ?? [],
  discount: n(r.discount),
  vatRate: n(r.vatRate),
  method: r.method,
  txnId: r.txnId,
  notes: r.notes,
  payments: (r.payments as unknown as Payment[]) ?? [],
  total: n(r.total),
  paid: n(r.paid),
  due: n(r.due),
  status: r.status as Status,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

export const toSettings = (s: DbSetting | null): Settings =>
  s
    ? {
        business: s.business,
        product: s.product,
        address: s.address,
        phone: s.phone,
        email: s.email,
        website: s.website,
        prefix: s.prefix,
        periodDays: s.periodDays,
        monthlyFee: n(s.monthlyFee),
        signer: s.signer,
        notes: s.notes,
      }
    : { ...DEFAULTS };
