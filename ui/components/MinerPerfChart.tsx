// ui/components/MinerPerfChart.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import ChartArea from "@/components/ChartArea";

type Row = { created: string; workers?: Record<string, { hashrate?: number }> };

export default function MinerPerfChart({
  poolId,
  address,
}: {
  poolId: string;
  address: string;
}) {
  const [data, setData] = useState<{ t: string; hashrate: number }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const lastTs = useRef<number>(0);

  async function load() {
    try {
      const r = await fetch(
        `/api/pools/${encodeURIComponent(poolId)}/miners/${encodeURIComponent(address)}/performance`,
        { cache: "no-store" }
      );
      setLoaded(true);
      if (!r.ok) return;

      const rows: Row[] = await r.json();
      if (!Array.isArray(rows) || rows.length === 0) return;

      const newest = new Date(rows[rows.length - 1].created).getTime();
      if (newest !== lastTs.current || data.length === 0) {
        lastTs.current = newest;

        const d = rows.map((p) => {
          const total = Object.values(p.workers || {}).reduce(
            (s, w: any) => s + (w?.hashrate ?? 0),
            0
          );
          return { t: new Date(p.created).toLocaleTimeString(), hashrate: total };
        });

        setData(d);
      }
    } catch (e) {
      setLoaded(true);
      if (process.env.NODE_ENV === "development") console.warn("Miner perf fetch failed", e);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 300_000); // 5 min
    return () => clearInterval(id);
  }, [poolId, address]);

  if (!loaded || data.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-edge p-4 h-64 flex items-center justify-center text-sub">
        No data yet
      </div>
    );
  }

  return <ChartArea data={data} xKey="t" yKey="hashrate" yFormat="hashrate" />;
}
