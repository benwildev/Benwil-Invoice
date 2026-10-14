"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useData } from "@/components/DataProvider";
import { ReceiptForm } from "@/components/ReceiptForm";
import { Empty } from "@/components/ui";

export default function EditReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const { receipts } = useData();
  const r = receipts.find((x) => x.id === id);
  if (!r)
    return (
      <Empty title="Receipt not found">
        It may have been deleted. <Link className="btn sm" href="/receipts">Back to receipts</Link>
      </Empty>
    );
  return <ReceiptForm key={r.id} editing={r} />;
}
