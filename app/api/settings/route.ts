import { prisma } from "@/lib/db";
import { handle, ok, readJson, str } from "@/lib/api";
import { num } from "@/lib/billing";
import { toSettings } from "@/lib/serialize";
import type { Settings } from "@/lib/types";

export async function PUT(req: Request) {
  const b = (await readJson<Partial<Settings>>(req)) || {};
  const data = {
    business: str(b.business),
    product: str(b.product),
    address: str(b.address),
    phone: str(b.phone),
    email: str(b.email),
    website: str(b.website),
    prefix: str(b.prefix) || "BWC",
    periodDays: Math.round(num(b.periodDays)) || 30,
    monthlyFee: num(b.monthlyFee),
    signer: str(b.signer),
    notes: str(b.notes),
  };
  try {
    const s = await prisma.setting.upsert({ where: { id: "business" }, create: { id: "business", ...data }, update: data });
    return ok(toSettings(s));
  } catch (e) {
    return handle(e);
  }
}
