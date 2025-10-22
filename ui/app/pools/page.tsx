import { api } from "@/lib/api";
import PoolCard from "@/components/PoolCard";
import Stat from "@/components/Stat";
import { tServer } from "@/i18n/server";

export default async function PoolsPage() {
  const tStat = tServer("Stat");
  const t = tServer("PoolsPage");

  const pools = await api.listPools().catch(()=>[]);
  const totalMiners = pools.reduce((s, p) => s + (p.poolStats?.connectedMiners ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label={tStat("pools")} value={pools.length} />
        <Stat label={tStat("connectedMiners")} value={totalMiners} />
      </div>

      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pools.map(p => <PoolCard key={p.id} p={p}/>)}
      </div>
    </div>
  );
}
