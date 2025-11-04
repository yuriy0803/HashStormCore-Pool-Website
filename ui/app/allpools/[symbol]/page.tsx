import { api } from "@/lib/api";
import PoolCard from "@/components/PoolCard";
import Stat from "@/components/Stat";
import { tServer } from "@/i18n/server";
import ChartArea from "@/components/ChartArea";

export const revalidate = 0;

export default async function CoinPoolsPage({ params }: { params: { symbol: string } }) {
  const tStat = tServer("Stat");
  const tCoin = tServer("CoinPools");

  const symbol = params.symbol.toUpperCase();

  // All pools are filtered by coin.
  const poolsAll = await api.listPools();
  const pools = poolsAll.filter(p => (p.coin?.symbol || "").toUpperCase() === symbol);

  const unit =
    String(pools[0]?.coin?.family).toLowerCase() === "equihash" ? "Sol/s" : "H/s";
  const name = pools[0]?.coin?.name || symbol;

  // ---------- FOR NON DEVS, KPI = KEY PERFORMANCE INDICATOR ---------- \\

  // ---------- Main KPIs (pool side) ---------- \\
  const totalHashrate = pools.reduce((s, p) => s + (p.poolStats?.poolHashrate ?? 0), 0);
  const totalMiners = pools.reduce((s, p) => s + (p.poolStats?.connectedMiners ?? 0), 0);

  // ---------- BLOCK KPIs (excludes ORPHANED) ---------- \\
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  let totalBlocksAll = 0;
  let totalBlocks30d = 0;
  let totalBlocks24h = 0;

  const isOrphan = (b: any) => {
    const flag =
      Boolean(b?.orphaned) || Boolean(b?.isOrphan) || Boolean(b?.orphan);
    const s = String(b?.status ?? b?.blockStatus ?? "").toLowerCase();
    return flag || s === "orphan" || s === "orphaned" || s === "orphan-block";
  };

  const getCreatedMs = (b: any) => {
    const raw =
      b?.created ??
      b?.createdAt ??
      b?.creationTime ??
      b?.timestamp ??
      b?.time;
    const ms = new Date(raw).getTime();
    return Number.isFinite(ms) ? ms : NaN;
  };

  for (const p of pools) {
    // Catch many at once (CHANGE NUM TO REDUCE BLOCKS LOADED)
    const { blocks } = await api.poolBlocks(p.id, 0, 10000);

    for (const b of (blocks as any[]) ?? []) {
      if (isOrphan(b)) continue; // ignore orphans

      totalBlocksAll++;

      const ms = getCreatedMs(b);
      if (!Number.isFinite(ms)) continue;

      if (ms >= monthAgo) totalBlocks30d++;
      if (ms >= dayAgo) totalBlocks24h++;
    }
  }


  // ---------- CHART (excludes ORPHANED) ---------- \\
  // THIS IS NOT WORKING PROPERLY, TODO: FIX THIS
  // Choose unit by coin/algorithm (Equihash => Sol/s)
  const algo = pools[0]?.coin?.algorithm ?? "";
  const yUnit: "H/s" | "Sol/s" = algo.toLowerCase().includes("equihash") ? "Sol/s" : "H/s";

  // retrieve the performance of each pool and sum them by timestamp.
  let combined: Array<{ t: string; v: number }> = [];
  {
    const map = new Map<string, number>();
    for (const p of pools) {
      const perf = await api.getPoolPerformance(p.id).catch(() => null);
      const stats: Array<{ created: string; poolHashrate: number }> = perf?.stats ?? [];
      for (const s of stats) {
        const key = s.created;
        map.set(key, (map.get(key) ?? 0) + Number(s.poolHashrate ?? 0));
      }
    }
    combined = [...map.entries()]
      .map(([t, v]) => ({ t, v }))
      .sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{name} ({symbol})</h1>

      {/* BLOCKS KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Stat label="Total blocos minados" value={totalBlocksAll} />
        <Stat label="Blocos (últimos 30 dias)" value={totalBlocks30d} />
        <Stat label="Blocos (últimas 24h)" value={totalBlocks24h} />
      </div>

      {/* TOP KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Stat label={tStat("totalHashrate")} value={`${(totalHashrate / 1000).toFixed(2)} k${unit}`} />
        <Stat label={tStat("connectedMiners")} value={totalMiners} />
        <Stat label={tStat("pools")} value={pools.length} />
      </div>

      <section className="space-y-3 mt-6">
        <h2 className="text-lg font-semibold">Hashrate (todas as pools)</h2>
        <ChartArea
          data={combined}
          xKey="t"
          yKey="v"
          yFormat="hashrate"
          unit={yUnit}
          stepMinutes={60}
          labelEvery={60}
          carryForward
        />
      </section>

      {pools.length === 0 ? (
        <div className="text-sm text-[var(--muted)]">Sem pools para esta coin.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pools.map(p => <PoolCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
