"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useData } from "@/components/DataProvider";
import { ReceiptTable } from "@/components/ui";
import { downloadReceiptsCSV } from "@/lib/downloads";

type Filter = "all" | "due" | "paid";

function ReceiptsList() {
  const { receipts, centers, toast } = useData();
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const f = params.get("filter");
  const filter: Filter = f === "due" || f === "paid" ? f : "all";
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const s = q.toLowerCase();
    return receipts.filter((r) => {
      if (filter === "due" && r.due <= 0) return false;
      if (filter === "paid" && r.due > 0) return false;
      if (!s) return true;
      const cn = centers.find((c) => c.id === r.centerId)?.name;
      return [r.no, r.center?.name, cn, r.txnId, r.method, ...(r.payments || []).map((p) => p.txnId)].join(" ").toLowerCase().includes(s);
    });
  }, [receipts, centers, filter, q]);

  const setFilter = (k: Filter) => router.replace(k === "all" ? path : `${path}?filter=${k}`, { scroll: false });

  return (
    <>
      <div className="head">
        <div>
          <h1>Receipts</h1>
          <p className="sub">{receipts.length} issued</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => { downloadReceiptsCSV(receipts); toast("CSV saved"); }}>Export CSV</button>
          <Link className="btn primary" href="/receipts/new">New receipt</Link>
        </div>
      </div>
      <div className="row">
        <input className="search" type="search" placeholder="Search number, center, transaction" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search receipts" />
        <div className="seg" role="group" aria-label="Filter">
          {([["all", "All"], ["due", "With balance"], ["paid", "Paid"]] as [Filter, string][]).map(([k, l]) => (
            <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      </div>
      <section className="panel">
        <ReceiptTable list={list} centers={centers} />
      </section>
    </>
  );
}

export default function ReceiptsPage() {
  return (
    <Suspense>
      <ReceiptsList />
    </Suspense>
  );
}
