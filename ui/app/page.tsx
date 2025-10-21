import { api } from "@/lib/api";
import PoolCard from "@/components/PoolCard";
import Stat from "@/components/Stat";
import { fmtHashrate } from "@/lib/format";

export default async function Home() {
  const pools = await api.listPools().catch(() => []);
  const totalHash = pools.reduce((s,p)=> s + (p.poolStats?.poolHashrate ?? 0), 0);
  const totalMiners = pools.reduce((s,p)=> s + (p.poolStats?.connectedMiners ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Active Pools" value={pools.length} />
        <Stat label="Total Hashrate" value={fmtHashrate(totalHash)} />
        <Stat label="Miners online" value={totalMiners} />
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Pools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pools.map(p => <PoolCard key={p.id} p={p} />)}
        </div>
      </section>
    </div>
  );
}
