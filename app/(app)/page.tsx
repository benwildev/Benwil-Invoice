"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useData } from "@/components/DataProvider";
import { Empty, ReceiptTable, StatusPill } from "@/components/ui";
import { MONL, centerName, fmtShort, num, renewals, tk, tk0, todayISO } from "@/lib/billing";

export default function DashboardPage() {
  const { receipts, centers, settings } = useData();
  const router = useRouter();
  const billed = receipts.reduce((a, r) => a + r.total, 0);
  const got = receipts.reduce((a, r) => a + r.paid, 0);
  const due = receipts.reduce((a, r) => a + r.due, 0);
  const ym = todayISO().slice(0, 7);
  const monthGot = receipts.reduce(
    (a, r) => a + (r.payments || []).filter((p) => (p.date || "").startsWith(ym)).reduce((s, p) => s + num(p.amount), 0),
    0,
  );
  const owing = receipts.filter((r) => r.due > 0).sort((a, b) => b.due - a.due);
  const rn = renewals(centers, receipts);
  const now = new Date();

  return (
    <>
      <div className="head">
        <div>
          <h1>Dashboard</h1>
          <p className="sub">
            {settings.business} · {settings.product}
          </p>
        </div>
        <div className="row">
          <Link className="btn primary" href="/receipts/new">New receipt</Link>
        </div>
      </div>

      <div className="stats">
        <div className="stat due">
          <span className="k">Outstanding due</span>
          <span className="v">{tk0(due)}</span>
          <span className="n">{owing.length} receipt{owing.length === 1 ? "" : "s"} with a balance</span>
        </div>
        <div className="stat">
          <span className="k">Collected this month</span>
          <span className="v">{tk0(monthGot)}</span>
          <span className="n">{MONL[now.getMonth()]} {now.getFullYear()}</span>
        </div>
        <div className="stat">
          <span className="k">Total billed</span>
          <span className="v">{tk0(billed)}</span>
          <span className="n">{tk0(got)} collected overall</span>
        </div>
        <div className="stat">
          <span className="k">Centers</span>
          <span className="v">{centers.length}</span>
          <span className="n">{receipts.length} receipt{receipts.length === 1 ? "" : "s"} issued</span>
        </div>
      </div>

      <div className="grid2">
        <section className="panel">
          <header>
            <h2>Balances due</h2>
            <Link className="btn ghost sm" href="/receipts?filter=due">See all</Link>
          </header>
          {owing.length ? (
            <div className="tablewrap">
              <table className="list">
                <thead>
                  <tr><th>Receipt</th><th>Center</th><th>Status</th><th className="num">Due</th></tr>
                </thead>
                <tbody>
                  {owing.slice(0, 8).map((r) => (
                    <tr key={r.id} className="click" onClick={() => router.push(`/receipts/${r.id}`)}>
                      <td className="mono"><Link href={`/receipts/${r.id}`} onClick={(e) => e.stopPropagation()} style={{ color: "inherit", textDecoration: "none" }}>{r.no}</Link></td>
                      <td>{centerName(r, centers)}</td>
                      <td><StatusPill status={r.status} /></td>
                      <td className="num">{tk(r.due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="Nothing is due">Every receipt is paid in full.</Empty>
          )}
        </section>

        <section className="panel">
          <header><h2>Renewals in the next 7 days</h2></header>
          {rn.length ? (
            <div className="tablewrap">
              <table className="list">
                <tbody>
                  {rn.map((x) => (
                    <tr key={x.center.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{x.center.name}</div>
                        <div className="sub">Period ends {fmtShort(x.last.periodEnd)}</div>
                      </td>
                      <td>
                        {x.left < 0 ? (
                          <span className="pill late">{-x.left} day{x.left === -1 ? "" : "s"} overdue</span>
                        ) : x.left === 0 ? (
                          <span className="pill late">Ends today</span>
                        ) : (
                          <span className="pill soon">{x.left} day{x.left === 1 ? "" : "s"} left</span>
                        )}
                      </td>
                      <td className="num">
                        <Link className="btn sm" href={`/receipts/new?center=${encodeURIComponent(x.center.id)}&start=${x.last.periodEnd}`}>
                          Bill next period
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="No renewals coming up">Centers whose billing period ends within 7 days show here.</Empty>
          )}
        </section>
      </div>

      <section className="panel">
        <header>
          <h2>Latest receipts</h2>
          <Link className="btn ghost sm" href="/receipts">All receipts</Link>
        </header>
        <ReceiptTable list={receipts.slice(0, 6)} centers={centers} />
      </section>
    </>
  );
}
