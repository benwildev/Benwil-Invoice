"use client";

import { calc, daysBetween, todayISO } from "./billing";
import type { Receipt } from "./types";

export function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Render the receipt sheet to an A4 PDF and download it. */
export async function downloadReceiptPDF(el: HTMLElement, r: Receipt) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  try {
    await document.fonts.ready;
  } catch {}
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false, windowWidth: 900 });
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const w = 210;
  const h = Math.min(297, (canvas.height * w) / canvas.width);
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, w, h);
  const name = `${r.no} ${(r.center?.name || "").replace(/[^\w\- ]+/g, "").trim()}`.trim() + ".pdf";
  saveBlob(name, pdf.output("blob"));
}

export function downloadReceiptsCSV(receipts: Receipt[]) {
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows: unknown[][] = [
    ["Receipt no", "Date", "Center", "Period start", "Period end", "Days", "Subtotal", "Discount", "VAT", "Total", "Paid", "Due", "Status", "Paid via", "Transaction ID"],
  ];
  receipts.forEach((r) => {
    const c = calc(r);
    rows.push([
      r.no, r.date, r.center?.name || "", r.periodStart, r.periodEnd,
      r.periodStart ? daysBetween(r.periodStart, r.periodEnd) : "",
      c.subtotal, c.discount, c.vat, c.total, c.paid, c.due, c.status, r.method, r.txnId,
    ]);
  });
  const csv = "﻿" + rows.map((row) => row.map(q).join(",")).join("\n");
  saveBlob(`benwil-receipts-${todayISO()}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}
