// ui/components/AlgoStatsBar.tsx
import { api } from "@/lib/api";

export const revalidate = 0; // live

type AlgoAgg = {
  algo: string;
  unit: "H/s" | "Sol/s";
  total: number; // sum in original unit (pool hashrate)
  pools: number;
};

const unitByAlgo: Record<string, "H/s" | "Sol/s"> = {
  Equihash: "Sol/s",
  "Equihash 144,5": "Sol/s",
  KawPoW: "H/s",
  ProgPoW: "H/s",
  "SHA-256": "H/s",
  Ethash: "H/s",
};

function coercePoolsShape(res: any): any[] {
  // Accepted: { pools: [...] } OR directly [...]
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.pools)) return res.pools;
  // fallback: some endpoints may call "items"
  if (Array.isArray(res.items)) return res.items;
  return [];
}

function fmtMetric(v: number, unit: string) {
  const val = Number(v) || 0;
  const abs = Math.abs(val);
  const table = [
    { k: 1e15, s: "P" },
    { k: 1e12, s: "T" },
    { k: 1e9, s: "G" },
    { k: 1e6, s: "M" },
    { k: 1e3, s: "K" },
  ];
  for (const t of table) if (abs >= t.k) return `${(val / t.k).toFixed(2)} ${t.s}${unit}`;
  return `${val.toFixed(2)} ${unit}`;
}

export default async function AlgoStatsBar() {
  let pools: any[] = [];
  try {
    const res = await api.listPools();
    pools = coercePoolsShape(res);
  } catch {
    pools = [];
  }

  // KPIs
  const coinsSet = new Set(
    pools.map((p) => p?.coin?.symbol).filter(Boolean)
  );
  const algosSet = new Set(
    pools.map((p) => p?.coin?.algorithm).filter(Boolean)
  );
  const totalPools = pools.length;
  const totalMiners = pools.reduce(
    (s, p) => s + Number(p?.poolStats?.connectedMiners ?? 0),
    0
  );

  // Aggregates by algorithm using **poolStats.poolHashrate**
  const map = new Map<string, AlgoAgg>();
  for (const p of pools) {
    const algo = String(p?.coin?.algorithm ?? "Unknown");
    const unit = unitByAlgo[algo] ?? "H/s";
    const current = map.get(algo) ?? { algo, unit, total: 0, pools: 0 };
    current.total += Number(p?.poolStats?.poolHashrate ?? 0);
    current.pools += 1;
    map.set(algo, current);
  }

  const aggs = [...map.values()].sort((a, b) => b.total - a.total);

  // If there are no pools, it shows an empty card instead of crashing
  if (totalPools === 0) {
    return (
      <section className="rounded-2xl bg-[var(--card)] border border-[var(--edge)] p-4">
        <div className="text-sm text-[var(--muted)]">No pools online.</div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-[var(--card)] border border-[var(--edge)] p-4">
      {aggs.length > 0 && (
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
      )}

      {/* KPIs */}
      <div className="mt-4 grid gap-3 md:grid-cols-5 text-sm">
        <div className="rounded-lg border border-[var(--edge)] bg-black/20 px-3 py-2">
          <span className="opacity-70">Coins:</span> {coinsSet.size}
        </div>
        <div className="rounded-lg border border-[var(--edge)] bg-black/20 px-3 py-2">
          <span className="opacity-70">Algorithms:</span> {algosSet.size}
        </div>
        <div className="rounded-lg border border-[var(--edge)] bg-black/20 px-3 py-2">
          <span className="opacity-70">Pools:</span> {totalPools}
        </div>
        <div className="rounded-lg border border-[var(--edge)] bg-black/20 px-3 py-2">
          <span className="opacity-70">Miners online:</span> {totalMiners}
        </div>
        <div className="rounded-lg border border-[var(--edge)] bg-black/20 px-3 py-2">
          <span className="opacity-70">Total hashrate:</span>{" "}
          {fmtMetric(
            aggs.reduce((s, a) => s + a.total, 0),
            aggs[0]?.unit ?? "H/s"
          )}
        </div>
      </div>
    </section>
  );
}
