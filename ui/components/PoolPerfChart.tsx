// ui/components/PoolPerfChart.tsx
"use client";

import { useEffect, useState } from "react";

type Point = { t: string; poolHashrate?: number; miners?: number };

export default function PoolPerfChart({ poolId }: { poolId: string }) {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch(`/pools/${encodeURIComponent(poolId)}/performance`, { cache: "no-store" });
        const json = await res.json();
        if (!alive) return;
        // Expect compacted points from the route (already formatted server-side).
        setData(Array.isArray(json) ? json : (json?.stats ?? []));
      } catch {
        if (alive) setData([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    // In dev we can poll a bit; in prod we can remove or increase interval.
    const id = setInterval(load, process.env.NODE_ENV === "development" ? 5000 : 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [poolId]);

  if (loading) return <div className="text-sm text-gray-500">Loading performance...</div>;
  if (!data.length) return <div className="text-sm text-gray-500">No data</div>;

  return (
    <div className="border rounded p-3">
      <div className="text-sm mb-2">Pool Hashrate (last window)</div>
      <ul className="text-xs grid grid-cols-2 gap-1">
        {data.slice(-20).map((p, i) => (
          <li key={i} className="flex justify-between">
            <span>{p.t}</span>
            <span>{p.poolHashrate ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
