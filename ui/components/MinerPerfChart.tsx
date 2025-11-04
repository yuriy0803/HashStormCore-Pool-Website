// ui/components/MinerPerfChart.tsx
"use client";

import { useEffect, useState } from "react";

type Point = { t: string; hashrate?: number };

export default function MinerPerfChart({ poolId, address }: { poolId: string; address: string }) {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch(`/api/pools/${encodeURIComponent(poolId)}/miners/${encodeURIComponent(address)}/performance`, { cache: "no-store" }); const json = await res.json();
        if (!alive) return;
        setData(Array.isArray(json) ? json : json);
      } catch {
        if (alive) setData([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, process.env.NODE_ENV === "development" ? 5000 : 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [poolId, address]);

  if (loading) return <div className="text-sm text-gray-500">Loading miner performance...</div>;
  if (!data.length) return <div className="text-sm text-gray-500">No data</div>;

  return (
    <div className="border rounded p-3">
      <div className="text-sm mb-2">Miner Hashrate (last window)</div>
      <ul className="text-xs grid grid-cols-2 gap-1">
        {data.slice(-20).map((p, i) => (
          <li key={i} className="flex justify-between">
            <span>{p.t}</span>
            <span>{p.hashrate ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
