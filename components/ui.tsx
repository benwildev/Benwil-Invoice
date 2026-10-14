"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { centerName, fmtRange, fmtShort, tk } from "@/lib/billing";
import type { Center, Receipt, Status } from "@/lib/types";

export function StatusPill({ status }: { status: Status }) {
  if (status === "paid") return <span className="pill paid">Paid</span>;
  if (status === "partial") return <span className="pill partial">Advance paid</span>;
  return <span className="pill unpaid">Unpaid</span>;
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children}
    </div>
  );
}

export function ReceiptTable({ list, centers }: { list: Receipt[]; centers: Center[] }) {
  const router = useRouter();
  if (!list.length)
    return (
      <Empty title="No receipts yet">
        Create one with <Link href="/receipts/new">New receipt</Link>. Add the coaching center first if it isn&apos;t listed.
      </Empty>
    );
  return (
    <div className="tablewrap">
      <table className="list">
        <thead>
          <tr>
            <th>Receipt</th>
            <th>Date</th>
            <th>Center</th>
            <th>Period</th>
            <th>Status</th>
            <th className="num">Total</th>
            <th className="num">Paid</th>
            <th className="num">Due</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.id} className="click" onClick={() => router.push(`/receipts/${r.id}`)}>
              <td className="mono">
                <Link href={`/receipts/${r.id}`} onClick={(e) => e.stopPropagation()} style={{ color: "inherit", textDecoration: "none" }}>
                  {r.no}
                </Link>
              </td>
              <td style={{ whiteSpace: "nowrap" }}>{fmtShort(r.date)}</td>
              <td>{centerName(r, centers)}</td>
              <td style={{ whiteSpace: "nowrap" }}>{r.periodStart ? fmtRange(r.periodStart, r.periodEnd) : "-"}</td>
              <td>
                <StatusPill status={r.status} />
              </td>
              <td className="num">{tk(r.total)}</td>
              <td className="num">{tk(r.paid)}</td>
              <td className="num" style={r.due > 0 ? { color: "var(--danger)", fontWeight: 600 } : undefined}>
                {tk(r.due)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
