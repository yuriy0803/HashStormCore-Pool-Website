import { api } from "@/lib/api";
import CoinCard from "@/components/CoinCard";
import Stat from "@/components/Stat";
import { tServer } from "@/i18n/server";
import AutoRefresh from "@/components/AutoRefresh";

export const revalidate = 0;

export default async function allpoolsPage() {
  const tStat = tServer("Stat");
  const t = tServer("allpoolsPage");

  const pools = await api.listPools();
  const coinsSet = new Set(pools.map(p => (p.coin?.symbol || "UNKNOWN").toUpperCase()));
  const totalMiners = pools.reduce((s, p) => s + (p.poolStats?.connectedMiners ?? 0), 0);

  const bySymbol = pools.reduce((acc, p) => {
    const s = (p.coin?.symbol || "UNKNOWN").toUpperCase();
    const name = p.coin?.name || s;
    acc[s] ??= { name, count: 0 };
    acc[s].count++;
    return acc;
  }, {} as Record<string, { name: string; count: number }>);

  const items = (Object.entries(bySymbol) as Array<[string, { name: string; count: number }]>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([symbol, { name, count }]) => ({ symbol, name, count }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label={tStat("pools")} value={coinsSet.size} />
        <Stat label={tStat("pool")} value={pools.length} />
        <Stat label={tStat("connectedMiners")} value={totalMiners} />
      </div>

      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(x => <CoinCard key={x.symbol} symbol={x.symbol} name={x.name} count={x.count} />)}
      </div>

      {/* soft refresh */}
      <AutoRefresh everySec={60} />
    </div>
  );
}
