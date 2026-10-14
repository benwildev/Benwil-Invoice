"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useData } from "@/components/DataProvider";
import { ReceiptSheet } from "@/components/ReceiptSheet";
import { Empty, StatusPill } from "@/components/ui";
import { METHODS, fmtShort, num, r2, tk, todayISO } from "@/lib/billing";
import { downloadReceiptPDF } from "@/lib/downloads";
import type { Payment } from "@/lib/types";

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { receipts, centers, settings, api, toast } = useData();
  const r = receipts.find((x) => x.id === id);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!r)
    return (
      <Empty title="Receipt not found">
        It may have been deleted.{" "}
        <Link className="btn sm" href="/receipts">Back to receipts</Link>
      </Empty>
    );

  async function writePayments(payments: Payment[], msg: string) {
    setBusy(true);
    try {
      await api("PUT", `/api/receipts/${r!.id}/payments`, { payments });
      toast(msg);
      return true;
    } catch (e) {
      toast((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const amt = r2(num(f.get("amount")));
    if (amt <= 0) return toast("Enter the amount received.");
    const p: Payment = {
      amount: amt,
      date: String(f.get("date") || todayISO()),
      method: String(f.get("method") || "Cash"),
      txnId: String(f.get("txnId") || "").trim(),
    };
    await writePayments([...(r!.payments || []), p], `${tk(amt)} recorded`);
  }

  async function removePayment(i: number) {
    const p = [...(r!.payments || [])];
    p.splice(i, 1);
    await writePayments(p, "Payment removed");
  }

  async function del() {
    setBusy(true);
    try {
      await api("DELETE", `/api/receipts/${r!.id}`);
      toast("Receipt deleted");
      router.push("/receipts");
    } catch (e) {
      toast((e as Error).message);
      setBusy(false);
    }
  }

  async function pdf() {
    if (!sheetRef.current) return;
    setPdfBusy(true);
    try {
      await downloadReceiptPDF(sheetRef.current, r!);
      toast("PDF saved");
    } catch {
      toast("Couldn't make the PDF. Try again.");
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <>
      <div className="head">
        <div>
          <Link className="btn ghost sm" href="/receipts">← Receipts</Link>
          <h1 className="mono" style={{ fontSize: 20, marginTop: 6 }}>{r.no}</h1>
          <p className="sub">
            {r.center?.name || ""} · <StatusPill status={r.status} />
          </p>
        </div>
        <div className="row">
          <button className="btn primary" onClick={pdf} disabled={pdfBusy}>{pdfBusy ? "Preparing PDF…" : "Download PDF"}</button>
          <Link className="btn" href={`/receipts/${r.id}/edit`}>Edit</Link>
        </div>
      </div>

      <div className="split">
        <div className="sheetwrap">
          <ReceiptSheet ref={sheetRef} r={r} settings={settings} centers={centers} />
        </div>
        <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <section className="panel">
            <header><h2>Balance</h2><StatusPill status={r.status} /></header>
            <dl className="kv">
              <dt>Total</dt><dd>{tk(r.total)}</dd>
              <dt>Paid</dt><dd>{tk(r.paid)}</dd>
              <dt style={{ color: "var(--danger)", fontWeight: 600 }}>Due</dt>
              <dd style={{ color: "var(--danger)", fontWeight: 600 }}>{tk(r.due)}</dd>
            </dl>
          </section>

          <section className="panel">
            <header><h2>Payments</h2></header>
            <div className="paylist">
              {(r.payments || []).length ? (
                r.payments.map((p, i) => (
                  <div className="p" key={i}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{tk(p.amount)}</div>
                      <div className="sub">
                        {fmtShort(p.date)} · {p.method || ""}
                        {p.txnId ? " · " + p.txnId : ""}
                      </div>
                    </div>
                    <button className="btn ghost sm" disabled={busy} onClick={() => removePayment(i)} aria-label="Remove payment">Remove</button>
                  </div>
                ))
              ) : (
                <div className="sub">No payment recorded yet.</div>
              )}
            </div>
            {r.due > 0 && (
              <form key={`${r.id}-${r.payments.length}`} className="form" style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))", marginTop: 14 }} onSubmit={addPayment}>
                <div className="f c2">
                  <label htmlFor="payAmt">Amount received</label>
                  <input id="payAmt" name="amount" type="number" min="0" step="0.01" defaultValue={r.due} required />
                </div>
                <div className="f">
                  <label htmlFor="payDate">Date</label>
                  <input id="payDate" name="date" type="date" defaultValue={todayISO()} required />
                </div>
                <div className="f">
                  <label htmlFor="payMethod">Paid via</label>
                  <select id="payMethod" name="method" defaultValue={r.method || "Cash"}>
                    {METHODS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="f c2">
                  <label htmlFor="payTxn">Transaction ID</label>
                  <input id="payTxn" name="txnId" placeholder="Optional" />
                </div>
                <div className="c2">
                  <button className="btn primary" type="submit" disabled={busy}>Record payment</button>
                </div>
              </form>
            )}
          </section>

          <section className="panel">
            <header><h2>Delete receipt</h2></header>
            {confirmDel ? (
              <>
                <p className="sub" style={{ margin: "0 0 10px" }}>
                  This removes {r.no} and its payments for everyone. It can&apos;t be undone.
                </p>
                <div className="row">
                  <button className="btn danger" onClick={del} disabled={busy}>Delete permanently</button>
                  <button className="btn ghost" onClick={() => setConfirmDel(false)}>Keep it</button>
                </div>
              </>
            ) : (
              <button className="btn danger sm" onClick={() => setConfirmDel(true)}>Delete this receipt</button>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
