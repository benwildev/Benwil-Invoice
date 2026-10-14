"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useData } from "./DataProvider";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/receipts", label: "Receipts" },
  { href: "/receipts/new", label: "New receipt" },
  { href: "/centers", label: "Centers" },
  { href: "/settings", label: "Settings" },
];

function isActive(path: string, href: string) {
  if (href === "/") return path === "/";
  if (href === "/receipts") return path.startsWith("/receipts") && path !== "/receipts/new";
  return path.startsWith(href);
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { receipts, ready, failed } = useData();
  const dueN = receipts.filter((r) => r.due > 0).length;

  async function logout() {
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  }

  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          <span className="chip">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Benwil Coaching Management Software" />
          </span>
          <small>Billing</small>
        </div>
        <nav>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="navlink" aria-current={isActive(path, n.href) ? "page" : undefined}>
              {n.label}
              {n.href === "/receipts" && dueN > 0 && <span className="count">{dueN}</span>}
            </Link>
          ))}
        </nav>
        <div className="foot">Amounts in BDT</div>
        <button className="logout" onClick={logout}>
          Sign out
        </button>
      </aside>
      <main>
        {failed ? (
          <div className="empty">
            <strong>Billing records aren&apos;t available</strong>
            {failed}
          </div>
        ) : !ready ? (
          <div className="empty">
            <strong>Loading your billing records</strong>Centers, receipts and dues will appear here.
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
