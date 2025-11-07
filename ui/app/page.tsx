// ui/app/page.tsx
import Link from "next/link";
import Stat from "@/components/Stat";
import { api } from "@/lib/api";
import { tServer } from "@/i18n/server";
import CoinCard from "@/components/CoinCard";
import AlgoStatsBar from "@/components/AlgoStatsBar";
import Brand from "@/components/Brand";
import AutoRefresh from "@/components/AutoRefresh";
import PoolCardsWall from "@/components/PoolCardsWall";
import CoinCardsWall from "@/components/CoinCardsWall";

export const revalidate = 0;

export default async function Home() {
  const tHome = tServer("Home");
  const tStat = tServer("Stat");
  const t = tServer("allpoolsPage");

  const pools = await api.listPools().catch(() => []);

  // LIVE: total miners a partir de /api/live/status
  const status = await api.status().catch(() => null);
  const items: any[] = Array.isArray(status?.items) ? status!.items : [];
  const totalMiners = items.reduce((s, it) => s + Number(it?.minersOnline ?? 0), 0);

  const coinsSet = new Set(
    pools.map((p: any) => (p?.coin?.symbol || "UNKNOWN").toUpperCase())
  );

  const bySymbol = pools.reduce((acc: Record<string, { name: string; count: number }>, p: any) => {
    const s = (p?.coin?.symbol || "UNKNOWN").toUpperCase();
    const name = p?.coin?.name || s;
    acc[s] ??= { name, count: 0 };
    acc[s].count++;
    return acc;
  }, {});
  const itemsCards = (Object.entries(bySymbol) as Array<[string, { name: string; count: number }]>)
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
      </section>

      <AlgoStatsBar />

      <h1 className="text-xl font-semibold">{t("title")}</h1>
      {/* LIVE cards por pool */}
      <CoinCardsWall />

      <section className="text-sub text-sm">
        {tHome("tip")} <code className="mx-1">{tHome("endpoint")}</code>.
      </section>

      <AutoRefresh everySec={60} />
    </div>
  );
}
