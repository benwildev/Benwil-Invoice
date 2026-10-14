import { forwardRef } from "react";
import { calc, daysBetween, fmtLong, fmtRange, num, statusLine, tk } from "@/lib/billing";
import type { Center, Receipt, Settings } from "@/lib/types";

/** The printable A4 receipt in the Benwil letterhead. */
export const ReceiptSheet = forwardRef<HTMLDivElement, { r: Receipt; settings: Settings; centers: Center[] }>(
  function ReceiptSheet({ r, settings: st, centers }, ref) {
    const c = calc(r);
    const cen = r.center?.name ? r.center : centers.find((x) => x.id === r.centerId) || { name: "", owner: "", address: "", phone: "" };
    const pays = r.payments || [];
    const lastPay = pays.length ? pays[pays.length - 1] : null;
    return (
      <div className="sheet" ref={ref}>
        <div className="band" />
        <div className="inner">
          <div className="top">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="logo" src="/logo.png" alt="Benwil Coaching Management Software" />
            <div className="ttl">
              <div className="h">PAYMENT RECEIPT</div>
              <div className="s">{statusLine(c)}</div>
            </div>
          </div>
          <div className="rule">
            <i />
            <b />
          </div>
          <div className="cols">
            <div>
              <div className="lab">BILLED TO</div>
              <div className="bill">
                <div className="nm">{cen.name}</div>
                {cen.owner && <div>{cen.owner}</div>}
                {cen.address && <div>{cen.address}</div>}
                {cen.phone && <div>{cen.phone}</div>}
              </div>
            </div>
            <div>
              <div className="lab">RECEIPT DETAILS</div>
              <div className="det">
                <span>Receipt no.</span>
                <span style={{ fontWeight: 700 }}>{r.no}</span>
                <span>Payment date</span>
                <span>{fmtLong(lastPay?.date || r.date)}</span>
                <span>Paid via</span>
                <span>{lastPay?.method || r.method || "-"}</span>
                <span>Transaction ID</span>
                <span>{lastPay?.txnId || r.txnId || "-"}</span>
                {r.periodStart && (
                  <>
                    <span>Period start</span>
                    <span>{fmtLong(r.periodStart)}</span>
                    <span>Period end</span>
                    <span>{fmtLong(r.periodEnd)}</span>
                    <span>Days covered</span>
                    <span>{daysBetween(r.periodStart, r.periodEnd)} days</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <table className="lines">
            <thead>
              <tr>
                <th style={{ width: 28 }}>#</th>
                <th>Description</th>
                <th>Billing period</th>
                <th className="c" style={{ width: 44 }}>Qty</th>
                <th className="r">Unit price (BDT)</th>
                <th className="r">Amount (BDT)</th>
              </tr>
            </thead>
            <tbody>
              {c.items.map((i, n) => (
                <tr key={n}>
                  <td className="i">{n + 1}</td>
                  <td>{i.desc}</td>
                  <td>{i.period ? fmtRange(r.periodStart, r.periodEnd) : ""}</td>
                  <td className="c">{String(i.qty)}</td>
                  <td className="r">{tk(i.price)}</td>
                  <td className="r">{tk(num(i.qty) * num(i.price))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bottom">
            <div>
              <div className="lab">NOTES</div>
              <div className="notes">{r.notes || st.notes}</div>
            </div>
            <div className="tot">
              <div className="l"><span>Subtotal</span><span>{tk(c.subtotal)}</span></div>
              {c.discount ? <div className="l"><span>Discount</span><span>{tk(c.discount)}</span></div> : null}
              <div className="l"><span>VAT ({c.vatRate}%)</span><span>{tk(c.vat)}</span></div>
              <div className="l big"><span>TOTAL</span><span>{tk(c.total)}</span></div>
              <div className="l"><span>{c.due > 0 ? "Advance paid" : "Paid"}</span><span>{tk(c.paid)}</span></div>
              <div className="l due"><span>Due</span><span>{tk(c.due)}</span></div>
            </div>
          </div>
          <div className="sign">
            <div className="disc">This is a computer-generated receipt and is valid without a seal.</div>
            <div className="who">
              Authorised signature<b>{st.signer}</b>
            </div>
          </div>
          <div className="space" />
        </div>
        {c.due <= 0 && <div className="paidstamp">PAID</div>}
        <div className="band b" />
        <div className="foot">
          <div>{st.address}</div>
          <div className="c">
            <span>{st.phone}</span>
            <span>{st.email}</span>
            <span>{st.website}</span>
          </div>
        </div>
      </div>
    );
  },
);
