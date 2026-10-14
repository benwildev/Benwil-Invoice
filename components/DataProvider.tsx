"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { DEFAULTS } from "@/lib/billing";
import type { AppData, Center, Receipt, Settings } from "@/lib/types";

type Ctx = {
  ready: boolean;
  failed: string | null;
  centers: Center[];
  receipts: Receipt[];
  settings: Settings;
  refresh: () => Promise<void>;
  /** Call an API route; throws an Error with a friendly message on failure, then refreshes data. */
  api: <T = unknown>(method: string, url: string, body?: unknown) => Promise<T>;
  toast: (msg: string) => void;
};

const DataContext = createContext<Ctx | null>(null);

export function useData() {
  const c = useContext(DataContext);
  if (!c) throw new Error("useData must be used inside <DataProvider>");
  return c;
}

const byName = (a: Center, b: Center) => (a.name || "").localeCompare(b.name || "");
const byNewest = (a: Receipt, b: Receipt) => ((b.date || "") + (b.no || "")).localeCompare((a.date || "") + (a.no || ""));

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>({ centers: [], receipts: [], settings: { ...DEFAULTS } });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg(""), 2600);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/data", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname + window.location.search);
        return;
      }
      if (!res.ok) throw new Error();
      const j = (await res.json()) as AppData;
      setData({ centers: [...j.centers].sort(byName), receipts: [...j.receipts].sort(byNewest), settings: j.settings });
      setFailed(null);
      setReady(true);
    } catch {
      setFailed("Couldn't load billing records. Check the database connection and reload.");
    }
  }, []);

  const api = useCallback(
    async <T,>(method: string, url: string, body?: unknown): Promise<T> => {
      let res: Response;
      try {
        res = await fetch(url, {
          method,
          headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
      } catch {
        throw new Error("Couldn't save. Check your connection and try again.");
      }
      if (res.status === 401) {
        window.location.href = "/login";
        throw new Error("Your session has ended. Sign in again.");
      }
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Couldn't save. Try again.");
      await refresh();
      return j as T;
    },
    [refresh],
  );

  useEffect(() => {
    refresh();
    // Pick up changes made in other tabs or by other people when coming back to the page.
    const onFocus = () => document.visibilityState === "visible" && refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);

  return (
    <DataContext.Provider value={{ ready, failed, ...data, refresh, api, toast }}>
      {children}
      <div className="toast" role="status" hidden={!toastMsg}>
        {toastMsg}
      </div>
    </DataContext.Provider>
  );
}
