import type { Center, Item, Payment, Receipt, Settings, Status } from "./types";

export const DEFAULTS: Settings = {
  business: "Benwil Solutions",
  product: "Coaching Management Software",
  address: "19 Churial Tuly Lane, Chattogram 4000",
  phone: "+880 164 427 2188",
  email: "info@benwil.org",
  website: "www.benwil.org",
  prefix: "BWC",
  periodDays: 30,
  monthlyFee: 5000,
  signer: "Benwil Solutions",
  notes:
    "Thank you for your payment. Your subscription is active for the billing period shown above. For support, call +880 164 427 2188 or email info@benwil.org.",
};

export const METHODS = ["Cash", "bKash", "Nagad", "Rocket", "Bank transfer", "Card", "Cheque"];

/* ---------- numbers ---------- */
export const num = (v: unknown): number => {
  const n = parseFloat(String(v ?? ""));
  return isFinite(n) ? n : 0;
};
export const r2 = (n: number) => Math.round(n * 100) / 100;
export const tk = (n: unknown) =>
  "৳" + num(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const tk0 = (n: unknown) => "৳" + Math.round(num(n)).toLocaleString("en-US");

/* ---------- dates (all YYYY-MM-DD, local time) ---------- */
const pad = (n: number) => String(n).padStart(2, "0");
export const toISO = (d: Date) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
export const todayISO = () => toISO(new Date());
export const parseISO = (s?: string | null) => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};
export const addDays = (s: string, n: number) => {
  const d = parseISO(s);
  if (!d) return "";
  d.setDate(d.getDate() + n);
  return toISO(d);
};
export const daysBetween = (a?: string, b?: string) => {
  const x = parseISO(a), y = parseISO(b);
  if (!x || !y) return 0;
  return Math.round((y.getTime() - x.getTime()) / 86400000);
};
export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const fmtLong = (s?: string) => {
  const d = parseISO(s);
  return d ? `${MONL[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : "-";
};
export const fmtShort = (s?: string) => {
  const d = parseISO(s);
  return d ? `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}` : "-";
};
export const fmtRange = (a?: string, b?: string) => {
  const x = parseISO(a), y = parseISO(b);
  if (!x || !y) return "";
  return `${x.getDate()} ${MON[x.getMonth()]}${x.getFullYear() !== y.getFullYear() ? " " + x.getFullYear() : ""} to ${y.getDate()} ${MON[y.getMonth()]} ${y.getFullYear()}`;
};

/* ---------- money math ---------- */
export type Calc = {
  items: Item[];
  subtotal: number;
  discount: number;
  vatRate: number;
  vat: number;
  total: number;
  paid: number;
  due: number;
  status: Status;
};

export function calc(r: { items?: Item[]; discount?: unknown; vatRate?: unknown; payments?: Pick<Payment, "amount">[] }): Calc {
  const items = (r.items || []).filter((i) => (i.desc || "").trim() || num(i.price));
  const subtotal = r2(items.reduce((a, i) => a + num(i.qty) * num(i.price), 0));
  const discount = r2(num(r.discount));
  const vatRate = num(r.vatRate);
  const vat = r2((Math.max(subtotal - discount, 0) * vatRate) / 100);
  const total = r2(Math.max(subtotal - discount + vat, 0));
  const paid = r2((r.payments || []).reduce((a, p) => a + num(p.amount), 0));
  const due = r2(Math.max(total - paid, 0));
  const status: Status = due <= 0 ? "paid" : paid > 0 ? "partial" : "unpaid";
  return { items, subtotal, discount, vatRate, vat, total, paid, due, status };
}

export const statusLine = (c: Calc) =>
  c.due <= 0 ? "Paid in full" : c.paid > 0 ? `Advance received, balance due ${tk(c.due)}` : `Payment due ${tk(c.due)}`;

export function nextNumber(receipts: Receipt[], prefix: string) {
  const y = new Date().getFullYear();
  const pre = `${prefix || "BWC"}-${y}-`;
  let max = 0;
  receipts.forEach((r) => {
    if ((r.no || "").startsWith(pre)) {
      const n = parseInt(r.no.slice(pre.length), 10);
      if (n > max) max = n;
    }
  });
  return pre + String(max + 1).padStart(4, "0");
}

/** The most recent receipt (by period end) for a center. */
export function latestPeriod(receipts: Receipt[], centerId: string) {
  return receipts
    .filter((r) => r.centerId === centerId && r.periodEnd)
    .sort((a, b) => (a.periodEnd < b.periodEnd ? 1 : -1))[0];
}

/** Centers whose latest subscription period ends within 7 days (or already ended). */
export function renewals(centers: Center[], receipts: Receipt[]) {
  const today = todayISO();
  const out: { center: Center; last: Receipt; left: number }[] = [];
  centers.forEach((c) => {
    const last = latestPeriod(receipts, c.id);
    if (!last) return;
    const left = daysBetween(today, last.periodEnd);
    if (left <= 7) out.push({ center: c, last, left });
  });
  return out.sort((a, b) => a.left - b.left);
}

export const centerName = (r: Receipt, centers: Center[]) =>
  r.center?.name || centers.find((c) => c.id === r.centerId)?.name || "-";
