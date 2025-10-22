// ui/app/miner/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useT } from "@/i18n/client";

export default function MinerPage() {
  const params = useSearchParams();
  const router = useRouter();
  const t = useT("Miner");
  const tC = useT("Common");

  const [addr, setAddr] = useState(params.get("address") || "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function runSearch() {
    const a = addr.trim();
    if (!a) return;
    setLoading(true);
    setMsg(null);

    const BASE = process.env.NEXT_PUBLIC_MININGCORE_API_URL!;
    try {
      const r = await fetch(`${BASE}/pools`, { cache: "no-store" });
      const data = await r.json();
      const pools = data?.pools ?? [];

      for (const p of pools) {
        try {
          const minerRes = await fetch(`${BASE}/pools/${p.id}/miners/${a}`, { cache: "no-store" });
          if (minerRes.ok) {
            router.push(`/pools/${encodeURIComponent(p.id)}/miners/${encodeURIComponent(a)}`);
            return;
          }
        } catch {}
      }
      setMsg(tC("notFoundMiner"));
    } catch {
      setMsg(tC("poolServerError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const q = params.get("address");
    if (q) {
      setAddr(q);
      runSearch();
    }
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t("lookupTitle")}</h1>
      <div className="flex flex-col md:flex-row gap-3">
        <input
          className="rounded-xl bg-card border border-edge px-3 py-2 flex-1"
          placeholder={tC("walletAddress")}
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
        />
        <button
          onClick={runSearch}
          disabled={!addr || loading}
          className="rounded-xl bg-accent/20 border border-accent/40 px-4 py-2 hover:bg-accent/30 disabled:opacity-50"
        >
          {loading ? tC("searching") : tC("search")}
        </button>
      </div>
      {msg && <div className="text-red-400">{msg}</div>}
    </div>
  );
}
