// ui/components/AlgoStatsBar.tsx
import { api } from "@/lib/api";

export const revalidate = 0; // live

type AlgoAgg = {
  algo: string;
  unit: string;   // "H/s", "Sol/s", etc.
  total: number;  // sum on original unit
  pools: number;  // total pools from algo
};

function fmtMetric(v: number, unit: string) {
  const abs = Math.abs(v);
  const table = [
    { k: 1e15, s: "P" },
    { k: 1e12, s: "T" },
    { k: 1e9,  s: "G" },
    { k: 1e6,  s: "M" },
    { k: 1e3,  s: "K" },
  ];
  for (const t of table) {
    if (abs >= t.k) return `${(v / t.k).toFixed(2)} ${t.s}${unit}`;
  }
  return `${v.toFixed(2)} ${unit}`;
}

export default async function AlgoStatsBar() {
  // live status from cluster
  const status = await api.status().catch(() => null);
  const pools = status?.pools ?? [];

  // agregate by algo
  const map = new Map<string, AlgoAgg>();
  for (const p of pools) {
    const algoRaw = String(p.algo ?? "Unknown");
    const key = algoRaw.toLowerCase();
    const unit = String(p.unit ?? "H/s");
    const current = map.get(key) ?? { algo: algoRaw, unit, total: 0, pools: 0 };
    current.total += Number(p.currentHashrate ?? 0);
    current.pools += 1;
    map.set(key, current);
  }
  const aggs = [...map.values()].sort((a, b) => b.total - a.total);

  if (aggs.length === 0) return null;

  return (
    <section className="rounded-2xl bg-[var(--card)] border border-[var(--edge)] p-4">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {aggs.map((a) => (
          <div
            key={a.algo}
            className="rounded-xl px-4 py-3 border border-[var(--edge)] bg-black/20 flex flex-col gap-1"
          >
            <div className="text-sm uppercase tracking-wide text-[var(--muted)]">
              {a.algo}
            </div>
            <div className="text-2xl font-semibold leading-tight">
              {fmtMetric(a.total, a.unit)}
            </div>
            <div className="text-xs text-[var(--muted)]">
              {a.pools} {a.pools === 1 ? "pool" : "pools"}
            </div>
          </div>
        ))}
      </div>

      {/* BARRINHA DE KPIs (à 2miners) */}
      <div className="mt-4 grid gap-3 md:grid-cols-4 text-sm">
        <div className="rounded-lg border border-[var(--edge)] bg-black/20 px-3 py-2">
          <span className="opacity-70">Payouts regulares:</span>{" "}
          a cada {Math.round(((status?.pools?.[0]?.windowSec ?? 7200) as number) / 3600)}h
        </div>
        <div className="rounded-lg border border-[var(--edge)] bg-black/20 px-3 py-2">
          <span className="opacity-70">Pools:</span>{" "}
          {status?.totalPools ?? aggs.reduce((s, a) => s + a.pools, 0)}
        </div>
        <div className="rounded-lg border border-[var(--edge)] bg-black/20 px-3 py-2">
          <span className="opacity-70">Miners online:</span>{" "}
          {status?.totalMiners ?? 0}
        </div>
        <div className="rounded-lg border border-[var(--edge)] bg-black/20 px-3 py-2">
          <span className="opacity-70">Hashrate total:</span>{" "}
          {fmtMetric(
            Number(status?.totalHashrate ?? aggs.reduce((s, a) => s + a.total, 0)),
            aggs[0]?.unit ?? "H/s"
          )}
        </div>
      </div>
    </section>
  );
}
