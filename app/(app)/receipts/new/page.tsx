"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ReceiptForm } from "@/components/ReceiptForm";

function NewReceipt() {
  const p = useSearchParams();
  const center = p.get("center") || undefined;
  const start = p.get("start") || undefined;
  // `key` resets the form when arriving from a different "Bill" link.
  return <ReceiptForm key={`${center}-${start}`} centerId={center} periodStart={start} />;
}

export default function NewReceiptPage() {
  return (
    <Suspense>
      <NewReceipt />
    </Suspense>
  );
}
