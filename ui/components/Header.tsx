"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { useT } from "@/i18n/client";

export default function Header() {
  const [addr, setAddr] = useState("");
  const router = useRouter();
  const tH = useT("Header");
  const tC = useT("Common");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const a = addr.trim();
    if (!a) return;

    const BASE = process.env.NEXT_PUBLIC_MININGCORE_API_URL!;
    try {
      const r = await fetch(`${BASE}/pools`, { cache: "no-store" });
      const data = await r.json();
      const all = data?.pools ?? [];

      for (const pool of all) {
        try {
          const res = await fetch(`${BASE}/pools/${pool.id}/miners/${a}`, { cache: "no-store" });
          if (res.ok) {
            router.push(`/pools/${encodeURIComponent(pool.id)}/miners/${encodeURIComponent(a)}`);
            return;
          }
        } catch { /* ignore */ }
      }
      router.push(`/miner?address=${encodeURIComponent(a)}&notfound=1`);
    } catch {
      router.push(`/miner?address=${encodeURIComponent(a)}&error=fetch`);
    }
  }

  return (
    <header className="border-b border-edge sticky top-0 z-50 bg-bg/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
        <Link href="/" className="font-semibold text-lg">HashStorm</Link>

        <nav className="flex items-center gap-4 text-sub">
          <Link href="/coins">{tH("coins")}</Link>
          <Link href="/pools">{tH("pools")}</Link>
          <Link href="/miner">{tH("miner")}</Link>
        </nav>

        <form onSubmit={onSubmit} className="ml-auto flex items-center gap-2">
          <input
            className="rounded-xl bg-card border border-edge px-3 py-2 w-56"
            placeholder={`${tC("walletAddress")}…`}
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-xl bg-accent/20 border border-accent/40 px-4 py-2 hover:bg-accent/30 disabled:opacity-50"
            disabled={!addr.trim()}
          >
            {tC("search")}
          </button>
        </form>

        <div className="ml-3">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
