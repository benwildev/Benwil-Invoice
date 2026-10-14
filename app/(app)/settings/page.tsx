"use client";

import { useState } from "react";
import { useData } from "@/components/DataProvider";
import type { Settings } from "@/lib/types";

const FIELDS: { id: keyof Settings; label: string; cls: string; type?: string }[] = [
  { id: "business", label: "Business name", cls: "c3" },
  { id: "product", label: "Product", cls: "c3" },
  { id: "address", label: "Address", cls: "c6" },
  { id: "phone", label: "Phone", cls: "c2" },
  { id: "email", label: "Email", cls: "c2" },
  { id: "website", label: "Website", cls: "c2" },
  { id: "prefix", label: "Receipt prefix", cls: "c2" },
  { id: "periodDays", label: "Default period (days)", cls: "c2", type: "number" },
  { id: "monthlyFee", label: "Default monthly fee (BDT)", cls: "c2", type: "number" },
  { id: "signer", label: "Signature name", cls: "c3" },
];

export default function SettingsPage() {
  const { settings, api, toast } = useData();
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = Object.fromEntries([...FIELDS.map((x) => x.id), "notes"].map((k) => [k, String(f.get(k) ?? "").trim()]));
    setBusy(true);
    try {
      await api("PUT", "/api/settings", body);
      toast("Settings saved");
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="head">
        <div>
          <h1>Settings</h1>
          <p className="sub">Shown on every receipt.</p>
        </div>
      </div>
      <form key={JSON.stringify(settings)} className="panel form" noValidate onSubmit={submit}>
        {FIELDS.map((x) => (
          <div key={x.id} className={`f ${x.cls}`}>
            <label htmlFor={"s-" + x.id}>{x.label}</label>
            <input id={"s-" + x.id} name={x.id} type={x.type || "text"} defaultValue={String(settings[x.id] ?? "")} />
          </div>
        ))}
        <div className="f c6">
          <label htmlFor="s-notes">Default receipt note</label>
          <textarea id="s-notes" name="notes" defaultValue={settings.notes} />
        </div>
        <div className="c6 row" style={{ justifyContent: "flex-end" }}>
          <button className="btn primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save settings"}</button>
        </div>
      </form>
    </>
  );
}
