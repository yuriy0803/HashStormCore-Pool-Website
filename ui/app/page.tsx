import Link from "next/link";
import Stat from "@/components/Stat";
import { api } from "@/lib/api";
import { tServer } from "@/i18n/server";
import CoinCard from "@/components/CoinCard";
import AlgoStatsBar from "@/components/AlgoStatsBar";
import Brand from "@/components/Brand";
import AutoRefresh from "@/components/AutoRefresh";

export const revalidate = 0;

export default async function Home() {
  const tHome = tServer("Home");
  const tStat = tServer("Stat");

  const pools = await api.listPools().catch(() => []);
  const totalMiners = pools.reduce((s, p) => s + (p.poolStats?.connectedMiners ?? 0), 0);
  const coinsSet = new Set(pools.map(p => (p.coin?.symbol || "UNKNOWN").toUpperCase()));

  const t = tServer("allpoolsPage");

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
    <div className="space-y-6">
      <section className="rounded-3xl border border-edge bg-card/60 p-8 md:p-12 flex flex-col items-start gap-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Brand withText size={72} textClassName="text-accent/80 text-3xl tracking-wider uppercase" href={null} />
        </h2>
        <span className="text-accent/80 text-1xl tracking-wider uppercase">{tHome("welcomeBadge")}</span>
        <p className="text-1xl max-w-2xl">{tHome("tagline")}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/allpools" className="rounded-xl bg-accent/20 border border-accent/40 px-5 py-2.5 hover:bg-accent/30">
            {tHome("viewPools")}
          </Link>
          <Link href="/miner" className="rounded-xl bg-edge border border-edge/80 px-5 py-2.5 hover:border-accent/40">
            {tHome("minerLookup")}
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Stat label={tStat("coins")} value={coinsSet.size} />
        <Stat label={tStat("pools")} value={pools.length} />
        <Stat label={tStat("connectedMiners")} value={totalMiners} />
      </section>

      <AlgoStatsBar />

      <h1 className="text-xl font-semibold">{t("title")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(x => <CoinCard key={x.symbol} symbol={x.symbol} name={x.name} count={x.count} />)}
      </div>

      <section className="text-sub text-sm">
        {tHome("tip")} <code className="mx-1">{tHome("endpoint")}</code>.
      </section>

      {/* soft refresh from home */}
      <AutoRefresh everySec={60} />
    </div>
  );
}
