"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useData } from "@/components/DataProvider";
import { Empty } from "@/components/ui";
import { fmtShort, latestPeriod, tk, tk0 } from "@/lib/billing";
import type { Center } from "@/lib/types";

type Edit = Partial<Center> | null;

function CenterForm({ ce, onDone }: { ce: Partial<Center>; onDone: () => void }) {
  const { api, toast, settings } = useData();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      name: String(f.get("name") || "").trim(),
      owner: String(f.get("owner") || ""),
      phone: String(f.get("phone") || ""),
      address: String(f.get("address") || ""),
      fee: f.get("fee"),
      notes: String(f.get("notes") || ""),
    };
    if (!body.name) return setErr("Enter the center's name.");
    setBusy(true);
    try {
      if (ce.id) await api("PUT", `/api/centers/${ce.id}`, body);
      else await api("POST", "/api/centers", body);
      toast(ce.id ? "Center saved" : "Center added");
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel form" noValidate onSubmit={submit}>
      <div className="f c3"><label htmlFor="cName">Center name</label><input id="cName" name="name" defaultValue={ce.name} required autoFocus /></div>
      <div className="f c3"><label htmlFor="cOwner">Owner / contact</label><input id="cOwner" name="owner" defaultValue={ce.owner} /></div>
      <div className="f c2"><label htmlFor="cPhone">Phone</label><input id="cPhone" name="phone" defaultValue={ce.phone} inputMode="tel" /></div>
      <div className="f c2"><label htmlFor="cAddr">Address / area</label><input id="cAddr" name="address" defaultValue={ce.address} /></div>
      <div className="f c2"><label htmlFor="cFee">Monthly fee (BDT)</label><input id="cFee" name="fee" type="number" min="0" step="1" defaultValue={ce.fee ?? settings.monthlyFee} /></div>
      <div className="f c6"><label htmlFor="cNotes">Notes</label><textarea id="cNotes" name="notes" defaultValue={ce.notes} /></div>
      <div className="c6 row" style={{ justifyContent: "flex-end" }}>
        <span className="sub" style={{ color: "var(--danger)" }} role="alert">{err}</span>
        <button type="button" className="btn ghost" onClick={onDone}>Cancel</button>
        <button className="btn primary" type="submit" disabled={busy}>{ce.id ? "Save center" : "Add center"}</button>
      </div>
    </form>
  );
}

function Centers() {
  const { centers, receipts } = useData();
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const [edit, setEdit] = useState<Edit>(params.get("new") ? {} : null);

  const close = () => {
    setEdit(null);
    if (params.get("new")) router.replace(path, { scroll: false });
  };
  const bal = (id: string) => receipts.filter((r) => r.centerId === id).reduce((a, r) => a + r.due, 0);

  return (
    <>
      <div className="head">
        <div>
          <h1>Coaching centers</h1>
          <p className="sub">{centers.length} on record</p>
        </div>
        {!edit && <button className="btn primary" onClick={() => setEdit({})}>Add center</button>}
      </div>
      {edit && <CenterForm key={edit.id || "new"} ce={edit} onDone={close} />}
      <section className="panel">
        {centers.length ? (
          <div className="tablewrap">
            <table className="list">
              <thead>
                <tr>
                  <th>Center</th><th>Contact</th><th>Phone</th><th className="num">Monthly fee</th>
                  <th>Paid until</th><th className="num">Balance due</th><th />
                </tr>
              </thead>
              <tbody>
                {centers.map((c) => {
                  const b = bal(c.id);
                  const last = latestPeriod(receipts, c.id);
                  const billHref = `/receipts/new?center=${encodeURIComponent(c.id)}${last ? `&start=${last.periodEnd}` : ""}`;
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>
                        {c.name}
                        <div className="sub" style={{ fontWeight: 400 }}>{c.address || ""}</div>
                      </td>
                      <td>{c.owner || ""}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{c.phone || ""}</td>
                      <td className="num">{tk0(c.fee)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{last ? fmtShort(last.periodEnd) : "-"}</td>
                      <td className="num" style={b > 0 ? { color: "var(--danger)", fontWeight: 600 } : undefined}>{tk(b)}</td>
                      <td className="num" style={{ whiteSpace: "nowrap" }}>
                        <Link className="btn sm" href={billHref}>Bill</Link>{" "}
                        <button className="btn ghost sm" onClick={() => { setEdit({ ...c }); window.scrollTo(0, 0); }}>Edit</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No centers yet">Add the coaching centers you bill. Each one keeps its own monthly fee and balance.</Empty>
        )}
      </section>
    </>
  );
}

export default function CentersPage() {
  return (
    <Suspense>
      <Centers />
    </Suspense>
  );
}
