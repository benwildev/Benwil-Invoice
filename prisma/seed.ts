/**
 * Seeds the database from prisma/seed-data.json.
 * Safe to run more than once: records are upserted by id.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { readFileSync } from "node:fs";
import { DEFAULTS, calc, num, r2 } from "../lib/billing";
import type { Item, Payment } from "../lib/types";

type SeedCenter = { id: string; name: string; owner?: string; phone?: string; address?: string; fee?: number; notes?: string };
type SeedReceipt = {
  id: string; no: string; centerId: string;
  center?: { name?: string; owner?: string; address?: string; phone?: string };
  date: string; periodStart?: string; periodEnd?: string;
  items?: Item[]; discount?: number; vatRate?: number;
  method?: string; txnId?: string; notes?: string; payments?: Payment[];
  createdAt?: string;
};
type Seed = { settings?: Partial<typeof DEFAULTS>; centers?: SeedCenter[]; receipts?: SeedReceipt[] };

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const seed: Seed = JSON.parse(readFileSync(new URL("./seed-data.json", import.meta.url), "utf8"));

  const s = { ...DEFAULTS, ...(seed.settings || {}) };
  await prisma.setting.upsert({ where: { id: "business" }, create: { id: "business", ...s }, update: s });
  console.log("Settings: saved");

  for (const c of seed.centers || []) {
    const data = { name: c.name, owner: c.owner || "", phone: c.phone || "", address: c.address || "", fee: num(c.fee), notes: c.notes || "" };
    await prisma.center.upsert({ where: { id: c.id }, create: { id: c.id, ...data }, update: data });
  }
  console.log(`Centers: ${(seed.centers || []).length}`);

  for (const r of seed.receipts || []) {
    const payments = (r.payments || []).map((p) => ({ amount: r2(num(p.amount)), date: p.date, method: p.method || "Cash", txnId: p.txnId || "" }));
    const items = r.items || [];
    const c = calc({ items, discount: r.discount, vatRate: r.vatRate, payments });
    const cen = (seed.centers || []).find((x) => x.id === r.centerId);
    const data = {
      no: r.no, centerId: r.centerId,
      centerSnap: { name: r.center?.name ?? cen?.name ?? "", owner: r.center?.owner ?? cen?.owner ?? "", address: r.center?.address ?? cen?.address ?? "", phone: r.center?.phone ?? cen?.phone ?? "" },
      date: r.date, periodStart: r.periodStart || "", periodEnd: r.periodEnd || "",
      items, discount: r2(num(r.discount)), vatRate: num(r.vatRate),
      method: r.method || "Cash", txnId: r.txnId || "", notes: r.notes || "", payments,
      total: c.total, paid: c.paid, due: c.due, status: c.status,
    };
    await prisma.receipt.upsert({
      where: { id: r.id },
      create: { id: r.id, ...data, ...(r.createdAt ? { createdAt: new Date(r.createdAt) } : {}) },
      update: data,
    });
  }
  console.log(`Receipts: ${(seed.receipts || []).length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
