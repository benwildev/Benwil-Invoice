"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "./DataProvider";
import { Empty, StatusPill } from "./ui";
import { METHODS, addDays, calc, daysBetween, nextNumber, num, tk, todayISO } from "@/lib/billing";
import type { Item, Receipt, ReceiptInput } from "@/lib/types";

type Draft = Omit<ReceiptInput, "advance"> & { advance: string };

/** Create (no `editing`) or edit an existing receipt. */
export function ReceiptForm({ editing, centerId, periodStart }: { editing?: Receipt; centerId?: string; periodStart?: string }) {
  const { centers, receipts, settings, api, toast } = useData();
  const router = useRouter();
  const periodDays = num(settings.periodDays) || 30;

  const [d, setD] = useState<Draft>(() => {
    if (editing)
      return {
        centerId: editing.centerId, no: editing.no, date: editing.date,
        periodStart: editing.periodStart || "", periodEnd: editing.periodEnd || "",
        items: JSON.parse(JSON.stringify(editing.items || [])),
        discount: editing.discount || 0, vatRate: editing.vatRate || 0,
        method: editing.method || "Cash", txnId: editing.txnId || "", notes: editing.notes || "", advance: "",
      };
    const cen = centers.find((c) => c.id === centerId);
    const start = periodStart || todayISO();
    return {
      centerId: cen ? cen.id : "", no: nextNumber(receipts, settings.prefix), date: todayISO(),
      periodStart: start, periodEnd: addDays(start, periodDays),
      items: [{ desc: `${settings.product} subscription`, qty: 1, price: num(cen?.fee) || num(settings.monthlyFee), period: true }],
      discount: 0, vatRate: 0, method: "Cash", txnId: "", notes: "", advance: "",
    };
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<Draft>) => { setD((x) => ({ ...x, ...patch })); setErr(""); };
  const setItem = (i: number, patch: Partial<Item>) => set({ items: d.items.map((it, n) => (n === i ? { ...it, ...patch } : it)) });

  const c = useMemo(() => {
    const pays = editing ? editing.payments || [] : num(d.advance) > 0 ? [{ amount: num(d.advance) }] : [];
    return calc({ ...d, payments: pays });
  }, [d, editing]);

  if (!centers.length)
    return (
      <>
        <div className="head"><div><h1>New receipt</h1></div></div>
        <Empty title="Add a coaching center first">
          Receipts are billed to a center.
          <div style={{ marginTop: 10 }}><Link className="btn primary" href="/centers?new=1">Add center</Link></div>
        </Empty>
      </>
    );

  function onCenter(id: string) {
    const cen = centers.find((x) => x.id === id);
    const items = cen && num(cen.fee) ? d.items.map((it) => (it.period ? { ...it, price: num(cen.fee) } : it)) : d.items;
    set({ centerId: id, items });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.centerId) return setErr("Choose a coaching center.");
    if (!d.no.trim()) return setErr("Give the receipt a number.");
    if (receipts.some((r) => r.no === d.no.trim() && r.id !== editing?.id)) return setErr(`${d.no} is already used. Change the receipt number.`);
    if (d.periodStart && d.periodEnd && d.periodEnd < d.periodStart) return setErr("Period end is before period start.");
    if (!d.items.some((i) => (i.desc || "").trim() || num(i.price))) return setErr("Add at least one item.");
    setBusy(true);
    try {
      const saved = editing
        ? await api<Receipt>("PUT", `/api/receipts/${editing.id}`, d)
        : await api<Receipt>("POST", "/api/receipts", d);
      toast(editing ? "Receipt updated" : "Receipt created");
      router.push(`/receipts/${saved.id}`);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <div className="head">
        <div>
          <h1>{editing ? "Edit " + editing.no : "New receipt"}</h1>
          <p className="sub">{editing ? "Changes update the receipt for everyone." : "Fill in the period, items and what was paid today."}</p>
        </div>
      </div>
      <div className="split">
        <form className="panel form" noValidate onSubmit={submit}>
          <div className="f c4">
            <label htmlFor="fCenter">Coaching center</label>
            <select id="fCenter" value={d.centerId} onChange={(e) => onCenter(e.target.value)} required>
              <option value="">Choose a center</option>
              {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <span className="hint"><Link href="/centers?new=1">Add a new center</Link></span>
          </div>
          <div className="f c2">
            <label htmlFor="fNo">Receipt no.</label>
            <input id="fNo" className="mono" value={d.no} onChange={(e) => set({ no: e.target.value })} required />
          </div>
          <div className="f c2">
            <label htmlFor="fDate">Receipt date</label>
            <input id="fDate" type="date" value={d.date} onChange={(e) => set({ date: e.target.value })} required />
          </div>
          <div className="f c2">
            <label htmlFor="fStart">Period start</label>
            <input id="fStart" type="date" value={d.periodStart}
              onChange={(e) => { const v = e.target.value; set({ periodStart: v, ...(v ? { periodEnd: addDays(v, periodDays) } : {}) }); }} />
          </div>
          <div className="f c2">
            <label htmlFor="fEnd">Period end</label>
            <input id="fEnd" type="date" value={d.periodEnd} onChange={(e) => set({ periodEnd: e.target.value })} />
            <span className="hint">{d.periodStart && d.periodEnd ? daysBetween(d.periodStart, d.periodEnd) + " days covered" : ""}</span>
          </div>

          <div className="sect">Items</div>
          <div className="c6 tablewrap">
            <table className="items">
              <thead>
                <tr>
                  <th>Description</th><th style={{ width: 70 }}>Qty</th><th style={{ width: 130 }}>Unit price</th>
                  <th style={{ width: 120 }} className="num">Amount</th><th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {d.items.map((it, i) => (
                  <tr key={i}>
                    <td><input value={it.desc} onChange={(e) => setItem(i, { desc: e.target.value })} aria-label="Description" /></td>
                    <td><input type="number" min="0" step="1" value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} aria-label="Quantity" /></td>
                    <td><input type="number" min="0" step="0.01" value={it.price} onChange={(e) => setItem(i, { price: e.target.value })} aria-label="Unit price" /></td>
                    <td className="num">{tk(num(it.qty) * num(it.price))}</td>
                    <td>
                      <button type="button" className="btn ghost sm" aria-label="Remove line"
                        onClick={() => { const items = d.items.filter((_, n) => n !== i); set({ items: items.length ? items : [{ desc: "", qty: 1, price: 0 }] }); }}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="row" style={{ marginTop: 6 }}>
              <button type="button" className="btn sm" onClick={() => set({ items: [...d.items, { desc: "", qty: 1, price: 0 }] })}>Add line</button>
              <button type="button" className="btn sm ghost" onClick={() => set({ items: [...d.items, { desc: "Setup fee", qty: 1, price: 2000 }] })}>Add setup fee</button>
            </div>
          </div>
          <div className="f c2">
            <label htmlFor="fDisc">Discount (BDT)</label>
            <input id="fDisc" type="number" min="0" step="0.01" value={d.discount} onChange={(e) => set({ discount: e.target.value })} />
          </div>
          <div className="f c2">
            <label htmlFor="fVat">VAT (%)</label>
            <input id="fVat" type="number" min="0" step="0.1" value={d.vatRate} onChange={(e) => set({ vatRate: e.target.value })} />
          </div>
          <div className="f c2" />

          {editing ? (
            <div className="c6 sub">Payments are managed on the receipt page.</div>
          ) : (
            <>
              <div className="sect">Payment received today</div>
              <div className="f c2">
                <label htmlFor="fAdv">Amount received (advance or full)</label>
                <input id="fAdv" type="number" min="0" step="0.01" value={d.advance} placeholder="0" onChange={(e) => set({ advance: e.target.value })} />
                <span className="hint">Leave 0 if nothing was paid yet</span>
              </div>
              <div className="f c2">
                <label htmlFor="fMethod">Paid via</label>
                <select id="fMethod" value={d.method} onChange={(e) => set({ method: e.target.value })}>
                  {METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="f c2">
                <label htmlFor="fTxn">Transaction ID</label>
                <input id="fTxn" value={d.txnId} placeholder="bKash / bank reference" onChange={(e) => set({ txnId: e.target.value })} />
              </div>
            </>
          )}
          <div className="f c6">
            <label htmlFor="fNotes">Notes on the receipt</label>
            <textarea id="fNotes" placeholder={settings.notes} value={d.notes} onChange={(e) => set({ notes: e.target.value })} />
          </div>
          <div className="c6 row" style={{ justifyContent: "flex-end" }}>
            <span className="sub" style={{ color: "var(--danger)" }} role="alert">{err}</span>
            <Link className="btn ghost" href={editing ? `/receipts/${editing.id}` : "/"}>Cancel</Link>
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? "Saving…" : editing ? "Save changes" : "Create receipt"}
            </button>
          </div>
        </form>

        <aside className="panel" style={{ position: "sticky", top: 16 }}>
          <header><h2>Summary</h2></header>
          <div className="summary">
            <span className="t">Subtotal</span><span className="v">{tk(c.subtotal)}</span>
            <span className="t">Discount</span><span className="v">{tk(c.discount)}</span>
            <span className="t">VAT ({c.vatRate}%)</span><span className="v">{tk(c.vat)}</span>
            <span className="t big">Total</span><span className="v big">{tk(c.total)}</span>
            <span className="t">{editing ? "Paid" : "Received now"}</span><span className="v">{tk(c.paid)}</span>
            <span className="t due">Due</span><span className="v due">{tk(c.due)}</span>
          </div>
          <p className="sub" style={{ marginTop: 12 }}><StatusPill status={c.status} /></p>
        </aside>
      </div>
    </>
  );
}
