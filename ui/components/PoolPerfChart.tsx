// ui/components/PoolPerfChart.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import ChartArea from "@/components/ChartArea";

type Point = { t: string; poolHashrate: number };
type PerfPoint = { created: string; poolHashrate?: number | null };

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export default function PoolPerfChart({
  poolId,
  initialData = []
}: {
  poolId: string;
  initialData?: Point[];
}) {
  const [data, setData] = useState<Point[]>(initialData);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const BASE = process.env.NEXT_PUBLIC_MININGCORE_API_URL;
    if (!BASE) {
      setErr("NEXT_PUBLIC_MININGCORE_API_URL missing");
      return;
    }
    try {
      setErr(null);
      const url = joinUrl(BASE, `/pools/${encodeURIComponent(poolId)}/performance`);
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);

      const json: unknown = await r.json();
      const arr: PerfPoint[] =
        Array.isArray(json) ? json :
        Array.isArray((json as any)?.data) ? (json as any).data :
        [];

      const chart: Point[] = arr.map((p) => ({
        t: new Date(p.created).toLocaleTimeString(),
        poolHashrate: Number(p.poolHashrate ?? 0)
      }));

      setData(chart);
    } catch (e: any) {
      setErr(e?.message || "Failed to fetch");
      // mantém os dados atuais (SSR) para não piscar vazio
    }
  }

  useEffect(() => {
    load(); // 1º refresh ao montar
    const i = setInterval(load, 300_000); // 5 minutos
    return () => clearInterval(i);
  }, [poolId]);

  const chartData = useMemo(() => data, [data]);

  return (
    <>
      {err && <div className="text-sm text-red-400">Error: {err}</div>}
      <ChartArea data={chartData} xKey="t" yKey="poolHashrate" yFormat="hashrate" />
    </>
  );
}

