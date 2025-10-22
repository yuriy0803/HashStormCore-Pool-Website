import Link from "next/link";
import Stat from "@/components/Stat";
import { api } from "@/lib/api";
import { tServer } from "@/i18n/server";

export default async function Home() {
  const tHome = tServer("Home");
  const tStat = tServer("Stat");

  const pools = await api.listPools().catch(() => []);
  const totalMiners = pools.reduce((s, p) => s + (p.poolStats?.connectedMiners ?? 0), 0);
  const coinsSet = new Set(pools.map(p => (p.coin?.symbol || "UNKNOWN").toUpperCase()));

  return (
    <div className="space-y-10">
      {/* HERO */}
      <section className="rounded-3xl border border-edge bg-card/60 p-8 md:p-12 flex flex-col items-start gap-6">
        <span className="text-accent/80 text-sm tracking-wider uppercase">{tHome("welcomeBadge")}</span>
        <h1 className="text-3xl md:text-4xl font-semibold">HashStorm Pool</h1>
        <p className="text-sub max-w-2xl">{tHome("tagline")}</p>

        <div className="flex flex-wrap gap-3">
          <Link href="/coins" className="rounded-xl bg-accent/20 border border-accent/40 px-5 py-2.5 hover:bg-accent/30">
            {tHome("exploreCoins")}
          </Link>
          <Link href="/pools" className="rounded-xl bg-edge border border-edge/80 px-5 py-2.5 hover:border-accent/40">
            {tHome("viewPools")}
          </Link>
          <Link href="/miner" className="rounded-xl bg-edge border border-edge/80 px-5 py-2.5 hover:border-accent/40">
            {tHome("minerLookup")}
          </Link>
        </div>
      </section>

      {/* QUICK STATS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Stat label={tStat("coins")} value={coinsSet.size} />
        <Stat label={tStat("pools")} value={pools.length} />
        <Stat label={tStat("connectedMiners")} value={totalMiners} />
      </section>

      {/* Note */}
      <section className="text-sub text-sm">
        {tHome("tip")} <code className="mx-1">{tHome("endpoint")}</code>.
      </section>
    </div>
  );
}
